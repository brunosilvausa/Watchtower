CREATE OR REPLACE FUNCTION sync_public_index() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_kind text; v_lookup text; BEGIN v_kind:=TG_TABLE_NAME; IF TG_OP='DELETE' THEN DELETE FROM product_public_index WHERE product_public_index.kind=v_kind AND resource_id=OLD.id; RETURN OLD; END IF; IF v_kind='api_keys' THEN v_lookup:=NEW.token_hash; ELSIF v_kind='monitors' THEN v_lookup:=NEW.heartbeat_hash; ELSE v_lookup:=NEW.slug; END IF; DELETE FROM product_public_index WHERE product_public_index.kind=v_kind AND resource_id=NEW.id; IF v_lookup IS NOT NULL THEN INSERT INTO product_public_index VALUES(v_kind,v_lookup,NEW.workspace_id,NEW.id); END IF; RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION worker_claim_deliveries(worker text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,channel text,destination text,encrypted_credentials text,event text,payload jsonb,incident_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; item record; claimed integer:=0; policy jsonb;
BEGIN
 IF batch<1 OR batch>16 OR NOT EXISTS(SELECT 1 FROM probes p WHERE p.id=worker AND p.workspace_id IS NULL AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds') THEN RETURN; END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE; END IF;
  SELECT p.config INTO policy FROM alert_policies p ORDER BY p.created_at,p.id LIMIT 1;policy:=coalesce(policy,'{}');
  UPDATE notification_outbox o SET state='cancelled',lease_token=NULL,lease_until=NULL FROM incidents i WHERE o.incident_id=i.id AND o.event='escalation' AND (i.acknowledged_at IS NOT NULL OR i.resolved_at IS NOT NULL) AND o.state IN ('pending','retry');
  IF worker_quiet(policy,now()) THEN CONTINUE; END IF;
  IF coalesce((policy->>'reminders')::boolean,false) THEN
   INSERT INTO notification_outbox(workspace_id,channel_id,incident_id,event,payload,idempotency_key)
   SELECT tenant,c.id,i.id,'reminder',jsonb_build_object('subject',i.title,'message',i.title),i.id::text||':reminder:'||floor(extract(epoch FROM (now()-i.opened_at))/1800)::text||':'||c.id::text FROM incidents i CROSS JOIN alert_channels c WHERE i.resolved_at IS NULL AND i.opened_at<now()-interval '30 minutes' AND c.enabled AND NOT worker_maintenance(i.monitor_id,now()) ON CONFLICT(idempotency_key) DO NOTHING;
  END IF;
  FOR item IN SELECT o.*,coalesce(c.type,'email') channel_type,coalesce(c.destination,o.payload->>'destination') channel_destination,CASE WHEN c.id IS NULL THEN '__SYSTEM_EMAIL__' ELSE c.encrypted_credentials END credentials FROM notification_outbox o LEFT JOIN alert_channels c ON c.id=o.channel_id AND c.workspace_id=o.workspace_id LEFT JOIN incidents i ON i.id=o.incident_id WHERE (c.enabled OR (o.channel_id IS NULL AND o.event IN ('subscription-verification','status-update'))) AND o.state IN ('pending','retry') AND o.attempts<5 AND o.next_attempt_at<=now() AND (o.lease_until IS NULL OR o.lease_until<=now()) AND (i.id IS NULL OR NOT worker_maintenance(i.monitor_id,now())) ORDER BY o.next_attempt_at,o.id LIMIT least(3,batch-claimed) FOR UPDATE OF o SKIP LOCKED LOOP
   UPDATE notification_outbox o SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',attempts=attempts+1 WHERE o.id=item.id RETURNING o.lease_token INTO lease_token;
   id:=item.id; workspace_id:=tenant; channel:=item.channel_type; destination:=item.channel_destination; encrypted_credentials:=item.credentials;event:=item.event;payload:=item.payload;incident_id:=item.incident_id; RETURN NEXT;claimed:=claimed+1;
  END LOOP;
  EXIT WHEN claimed>=batch;
 END LOOP;
END $$;
