begin;

do $migration$
declare
  v_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.consume_auth_rate_limit(text,bytea,uuid)'::regprocedure
  ) into v_definition;
  v_definition := replace(v_definition, 'pg_catalog.greatest', 'greatest');
  v_definition := replace(v_definition, 'pg_catalog.least', 'least');
  execute v_definition;
end;
$migration$;

do $migration$
declare
  v_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.get_employee_directory_v2(text,public.app_role[],public.department_type[],boolean,text,text,integer,text,boolean,uuid)'::regprocedure
  ) into v_definition;
  v_definition := replace(
    v_definition,
    'select * from cursor_filtered' || chr(10) || '    order by',
    'select directory_row.* from cursor_filtered directory_row' || chr(10) || '    order by'
  );
  v_definition := replace(v_definition, 'lower(full_name)', 'lower(directory_row.full_name)');
  v_definition := replace(v_definition, 'lower(email)', 'lower(directory_row.email)');
  v_definition := replace(v_definition, 'then role::text', 'then directory_row.role::text');
  v_definition := replace(v_definition, 'then department::text', 'then directory_row.department::text');
  v_definition := replace(v_definition, 'then is_active', 'then directory_row.is_active');
  v_definition := replace(v_definition, 'then active_count', 'then directory_row.active_count');
  v_definition := replace(v_definition, 'then completed_count', 'then directory_row.completed_count');
  v_definition := replace(v_definition, 'then delayed_count', 'then directory_row.delayed_count');
  v_definition := replace(v_definition, 'then progress_value', 'then directory_row.progress_value');
  v_definition := replace(v_definition, 'then updated_at', 'then directory_row.updated_at');
  v_definition := replace(v_definition, 'then id end', 'then directory_row.id end');
  v_definition := replace(v_definition, chr(10) || '      id asc', chr(10) || '      directory_row.id asc');
  execute v_definition;
end;
$migration$;

commit;
