CREATE OR REPLACE FUNCTION request_monitor_check(monitor uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM monitors WHERE id=monitor FOR UPDATE;
 IF NOT FOUND THEN RETURN;END IF;
 UPDATE monitor_region_schedules SET next_check_at=now() WHERE monitor_id=monitor;
 UPDATE monitors SET next_check_at=now() WHERE id=monitor;
END $$;
