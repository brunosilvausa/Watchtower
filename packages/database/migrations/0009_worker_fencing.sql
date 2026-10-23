CREATE OR REPLACE FUNCTION worker_complete_check(tenant uuid,monitor uuid,fence uuid,version integer,worker text,location text,result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item monitors%ROWTYPE; incident incidents%ROWTYPE; policy jsonb; observation text; failures integer; successes integer; new_incident_id uuid; in_maintenance boolean; quorum integer;
BEGIN
 PERFORM set_config('app.workspace_id',tenant::text,true);
 SELECT * INTO item FROM monitors WHERE id=monitor AND workspace_id=tenant FOR UPDATE;
 IF NOT FOUND OR item.lease_token IS DISTINCT FROM fence OR item.lease_worker IS DISTINCT FROM worker OR item.lease_until<=clock_timestamp() OR item.config_version<>version OR item.paused OR item.archived_at IS NOT NULL OR EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND region=location AND workspace_id IS NULL) THEN RETURN false; END IF;
 observation:=result->>'state';
 IF observation NOT IN ('up','down','degraded','unknown') OR coalesce((result->>'durationMs')::numeric,0)<0 OR length(coalesce(result->>'errorCode',''))>100 THEN RAISE EXCEPTION 'Invalid result'; END IF;
 SELECT config INTO policy FROM alert_policies ORDER BY created_at,id LIMIT 1; policy:=coalesce(policy,'{}');
 quorum:=coalesce((policy->>'quorum')::integer,1);
 -- One public worker cannot certify multi-region quorum; keep state explicitly unknown until enough fresh distinct observations exist.
 IF quorum>1 AND (SELECT count(DISTINCT r.region) FROM check_results r WHERE r.monitor_id=monitor AND r.observed_at>now()-make_interval(secs=>item.interval_seconds*2) AND coalesce(r.raw_state,r.state)=observation AND r.region<>location AND EXISTS(SELECT 1 FROM probes p WHERE p.region=r.region AND p.last_seen_at>now()-interval '90 seconds' AND NOT p.draining AND p.workspace_id IS NULL))<quorum-1 THEN observation:='unknown'; END IF;
 in_maintenance:=worker_maintenance(monitor,now());
 INSERT INTO check_results(workspace_id,monitor_id,state,duration_ms,status_code,error_code,region,observed_at,expires_at,raw_state,maintenance) VALUES(tenant,monitor,CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,(result->>'durationMs')::double precision,(result->>'statusCode')::integer,CASE WHEN observation='unknown' AND quorum>1 THEN 'QUORUM_UNAVAILABLE' ELSE result->>'errorCode' END,location,now(),(result->>'expiresAt')::timestamptz,result->>'state',in_maintenance);
 failures:=CASE WHEN in_maintenance THEN 0 WHEN observation IN ('down','degraded') THEN item.failure_count+1 ELSE 0 END;
 successes:=CASE WHEN in_maintenance THEN 0 WHEN observation='up' THEN item.success_count+1 ELSE 0 END;
 UPDATE monitors SET state=CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,failure_count=failures,success_count=successes,lease_token=NULL,lease_until=NULL,lease_worker=NULL,next_check_at=now()+make_interval(secs=>item.interval_seconds),updated_at=now() WHERE id=monitor;
 SELECT * INTO incident FROM incidents WHERE monitor_id=monitor AND resolved_at IS NULL FOR UPDATE;
 IF NOT in_maintenance AND failures>=2 AND incident.id IS NULL THEN
  INSERT INTO incidents(workspace_id,monitor_id,title) VALUES(tenant,monitor,item.name||' is unavailable') RETURNING id INTO new_incident_id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,new_incident_id,'opened','Confirmed by two consecutive failed checks');
  PERFORM worker_enqueue(tenant,new_incident_id,'alert',item.name||' is unavailable',policy);
 ELSIF successes>=2 AND incident.id IS NOT NULL THEN
  UPDATE incidents SET state='resolved',resolved_at=now(),resolution='observed_recovery' WHERE id=incident.id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,incident.id,'recovered','Confirmed by two consecutive successful checks');
  UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE incident_id=incident.id AND event IN ('escalation','reminder') AND state IN ('pending','retry');
  IF NOT in_maintenance AND coalesce((policy->>'recovery')::boolean,true) THEN PERFORM worker_enqueue(tenant,incident.id,'recovery',item.name||' recovered',policy); END IF;
 END IF;
 RETURN true;
END $$;
