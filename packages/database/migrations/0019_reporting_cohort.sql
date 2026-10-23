CREATE FUNCTION workspace_churn_cohort(cutoff timestamptz) RETURNS TABLE(active_at_start integer,cancelled integer) LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 WITH first_state AS (SELECT state FROM subscription_state_history WHERE observed_at<=cutoff ORDER BY observed_at DESC,id DESC LIMIT 1),last_state AS (SELECT state FROM subscription_state_history WHERE observed_at<=now() ORDER BY observed_at DESC,id DESC LIMIT 1)
 SELECT CASE WHEN (SELECT state FROM first_state)='active' THEN 1 ELSE 0 END,CASE WHEN (SELECT state FROM first_state)='active' AND (SELECT state FROM last_state) IN ('cancelled','canceled') THEN 1 ELSE 0 END;
$$;
REVOKE ALL ON FUNCTION workspace_churn_cohort(timestamptz) FROM PUBLIC;
CREATE OR REPLACE FUNCTION platform_snapshot(actor text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE base jsonb;tenant record;queue_rows jsonb:='[]';mrr jsonb;queue jsonb;oldest timestamptz;candidate timestamptz;epoch timestamptz;cancelled integer:=0;active_start integer:=0;n integer;missing integer;known integer;cohort record;
BEGIN
 base:=platform_snapshot_before_reporting(actor);SELECT min(started_at) INTO epoch FROM platform_reporting_epoch;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO mrr FROM (SELECT upper(t->'subscription'->>'currency') AS currency,coalesce(sum((t->'subscription'->>'monthlyAmount')::numeric) FILTER(WHERE t->'subscription'->>'state'='active'),0) AS "monthlyAmount",count(*) FILTER(WHERE t->'subscription'->>'state'='active')::int AS subscriptions FROM jsonb_array_elements(base->'tenants') t WHERE t->'subscription'->>'monthlyAmount' IS NOT NULL AND t->'subscription'->>'currency' ~ '^[A-Za-z]{3}$' GROUP BY 1)x;
 SELECT count(*) FILTER(WHERE t->'subscription'->>'state'='active' AND (t->'subscription'->>'monthlyAmount' IS NULL OR coalesce(t->'subscription'->>'currency','') !~ '^[A-Za-z]{3}$')),count(*) FILTER(WHERE t->'subscription'->>'monthlyAmount' IS NOT NULL AND t->'subscription'->>'currency' ~ '^[A-Za-z]{3}$') INTO missing,known FROM jsonb_array_elements(base->'tenants')t;
 FOR tenant IN SELECT value FROM jsonb_array_elements(base->'tenants') LOOP
  PERFORM set_config('app.workspace_id',tenant.value->>'id',true);
  SELECT queue_rows||coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO queue_rows FROM (SELECT state,count(*)::int count FROM notification_outbox GROUP BY state)x;
  SELECT min(created_at) INTO candidate FROM notification_outbox WHERE state IN ('pending','retry');IF oldest IS NULL OR candidate<oldest THEN oldest:=candidate;END IF;
  SELECT * INTO cohort FROM workspace_churn_cohort(now()-interval '30 days');cancelled:=cancelled+cohort.cancelled;active_start:=active_start+cohort.active_at_start;
 END LOOP;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO queue FROM (SELECT value->>'state' state,sum((value->>'count')::integer)::integer count FROM jsonb_array_elements(queue_rows) GROUP BY 1)x;
 RETURN base||jsonb_build_object('metrics',jsonb_build_object('mrr',mrr,'mrrState',CASE WHEN known=0 THEN 'unconfigured' WHEN missing>0 THEN 'partial' ELSE 'observed' END,'churn',jsonb_build_object('state',CASE WHEN epoch>now()-interval '30 days' THEN 'insufficient_history' ELSE 'observed' END,'ratePercent',CASE WHEN epoch<=now()-interval '30 days' AND active_start>0 THEN 100.0*cancelled/active_start ELSE NULL END,'activeAtStart',CASE WHEN epoch<=now()-interval '30 days' THEN active_start ELSE NULL END,'cancelled',CASE WHEN epoch<=now()-interval '30 days' THEN cancelled ELSE NULL END,'windowDays',30,'historyStartedAt',epoch),'queue',queue,'queueOldestPendingAt',oldest));
END $$;
