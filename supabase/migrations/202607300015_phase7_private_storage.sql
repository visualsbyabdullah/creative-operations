begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('task-attachments','task-attachments',false,26214400,
    array['image/jpeg','image/png','image/webp','application/pdf','text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('submission-attachments','submission-attachments',false,26214400,
    array['image/jpeg','image/png','image/webp','application/pdf',
      'video/mp4','video/webm',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

alter table public.attachments
  drop constraint if exists attachments_parent_required;
alter table public.attachments
  add constraint attachments_parent_required
  check (pg_catalog.num_nonnulls(task_id,submission_id,brand_id)=1);

create or replace function public.can_access_storage_object_v1(
  p_bucket text,p_name text,p_write boolean
)
returns boolean
language plpgsql
stable
security definer
set search_path=pg_catalog,auth,public,private,storage
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_folders text[]:=storage.foldername(p_name);
  v_resource uuid;
begin
  if v_actor is null or pg_catalog.cardinality(v_folders)<>2
     or v_folders[1]<>v_workspace::text then return false; end if;
  begin v_resource:=v_folders[2]::uuid;
  exception when invalid_text_representation then return false; end;
  if p_bucket='avatars' then
    return v_resource=v_actor;
  elsif p_bucket='task-attachments' then
    return exists(
      select 1 from public.tasks t
      where t.id=v_resource and t.workspace_id=v_workspace
        and (private.is_management() or private.is_task_assignee(t.id))
        and (not p_write or (
          private.is_management() and t.status<>'archived'
          or private.is_task_assignee(t.id)
            and t.status in ('assigned','in_progress','revision_requested')
        ))
    );
  elsif p_bucket='submission-attachments' then
    return exists(
      select 1 from public.submissions s
      where s.id=v_resource and s.workspace_id=v_workspace
        and (private.is_management() or s.submitted_by=v_actor)
        and (not p_write or (
          private.is_management() and s.status not in ('published','archived')
          or s.submitted_by=v_actor
            and s.status in ('draft','submitted','revision_requested')
        ))
    );
  end if;
  return false;
end;
$function$;

create policy private_storage_select_v1 on storage.objects
for select to authenticated
using(public.can_access_storage_object_v1(bucket_id,name,false));
create policy private_storage_insert_v1 on storage.objects
for insert to authenticated
with check(public.can_access_storage_object_v1(bucket_id,name,true));
create policy private_storage_delete_v1 on storage.objects
for delete to authenticated
using(public.can_access_storage_object_v1(bucket_id,name,true));

create or replace function public.set_own_avatar_path_v1(
  p_avatar_path text,p_expected_updated_at timestamptz
)
returns table(old_avatar_path text,updated_at timestamptz)
language plpgsql
security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_profile public.profiles%rowtype;
begin
  if v_actor is null or p_expected_updated_at is null
    or (p_avatar_path is not null and (
      pg_catalog.length(p_avatar_path)>512
      or p_avatar_path !~ ('^'||v_workspace::text||'/'||v_actor::text||
        '/[0-9a-f-]{36}\.(jpg|png|webp)$')
    )) then raise exception 'invalid avatar path' using errcode='22023'; end if;
  select * into v_profile from public.profiles
  where id=v_actor and workspace_id=v_workspace for update;
  if not found then raise exception 'not authorized' using errcode='42501'; end if;
  if v_profile.updated_at<>p_expected_updated_at then
    raise exception 'stale update' using errcode='40001'; end if;
  update public.profiles set avatar_path=p_avatar_path,avatar_url=null
  where id=v_actor;
  perform private.append_business_audit_event(
    'profile_updated',v_actor,v_workspace,'profile',v_actor,
    '{"changed_fields":"avatar_path"}'::jsonb
  );
  return query select v_profile.avatar_path,
    (select p.updated_at from public.profiles p where p.id=v_actor);
end;
$function$;

create or replace function public.register_attachment_v1(
  p_bucket text,p_object_path text,p_parent_type text,p_parent_id uuid,
  p_original_name text,p_mime_type text,p_byte_size bigint
)
returns uuid
language plpgsql
security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_id uuid;
begin
  if v_actor is null or p_parent_type not in ('task','submission')
    or (p_parent_type='task' and p_bucket<>'task-attachments')
    or (p_parent_type='submission' and p_bucket<>'submission-attachments')
    or not public.can_access_storage_object_v1(p_bucket,p_object_path,true)
    or p_object_path !~ ('^'||v_workspace::text||'/'||p_parent_id::text||
      '/[0-9a-f-]{36}\.[a-z0-9]{2,5}$')
    or pg_catalog.length(pg_catalog.btrim(p_original_name)) not between 1 and 255
    or p_byte_size not between 1 and 26214400 then
    raise exception 'invalid attachment' using errcode='22023';
  end if;
  if p_parent_type='task' and not exists(
    select 1 from public.tasks where id=p_parent_id and workspace_id=v_workspace
  ) then raise exception 'parent not found' using errcode='P0002'; end if;
  if p_parent_type='submission' and not exists(
    select 1 from public.submissions where id=p_parent_id and workspace_id=v_workspace
  ) then raise exception 'parent not found' using errcode='P0002'; end if;
  insert into public.attachments(
    workspace_id,owner_id,task_id,submission_id,bucket,object_path,
    original_name,mime_type,byte_size
  ) values(
    v_workspace,v_actor,
    case when p_parent_type='task' then p_parent_id end,
    case when p_parent_type='submission' then p_parent_id end,
    p_bucket,p_object_path,pg_catalog.btrim(p_original_name),p_mime_type,p_byte_size
  ) returning id into v_id;
  perform private.append_business_audit_event(
    'attachment_created',v_actor,v_workspace,'attachment',v_id,
    pg_catalog.jsonb_build_object(
      case when p_parent_type='task' then 'task_id' else 'submission_id' end,
      p_parent_id
    )
  );
  return v_id;
end;
$function$;

create or replace function public.get_attachments_v1(
  p_parent_type text,p_parent_id uuid
)
returns table(
  id uuid,bucket text,object_path text,original_name text,mime_type text,
  byte_size bigint,owner_id uuid,created_at timestamptz
)
language sql stable security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
  select a.id,a.bucket,a.object_path,a.original_name,a.mime_type,
    a.byte_size,a.owner_id,a.created_at
  from public.attachments a
  where private.current_active_profile_id() is not null
    and a.workspace_id=private.current_workspace_id()
    and a.deleted_at is null
    and (
      p_parent_type='task' and a.task_id=p_parent_id
        and private.can_access_task(p_parent_id)
      or p_parent_type='submission' and a.submission_id=p_parent_id
        and private.can_access_submission(p_parent_id)
    )
  order by a.created_at,a.id;
$function$;

create or replace function public.mark_attachment_removed_v1(p_attachment_id uuid)
returns table(bucket text,object_path text)
language plpgsql
security definer
set search_path=pg_catalog,auth,public,private
set row_security=off
as $function$
declare
  v_actor uuid:=private.current_active_profile_id();
  v_workspace uuid:=private.current_workspace_id();
  v_attachment public.attachments%rowtype;
begin
  select * into v_attachment from public.attachments
  where id=p_attachment_id and workspace_id=v_workspace for update;
  if v_actor is null or not found
    or v_attachment.deleted_at is not null
    or not public.can_access_storage_object_v1(
      v_attachment.bucket,v_attachment.object_path,true) then
    raise exception 'attachment not found' using errcode='P0002'; end if;
  update public.attachments set deleted_at=pg_catalog.clock_timestamp()
  where id=p_attachment_id;
  perform private.append_business_audit_event(
    'attachment_removed',v_actor,v_workspace,'attachment',p_attachment_id,'{}'::jsonb
  );
  return query select v_attachment.bucket,v_attachment.object_path;
end;
$function$;

revoke all on function public.can_access_storage_object_v1(text,text,boolean)
  from public,anon,authenticated,service_role;
grant execute on function public.can_access_storage_object_v1(text,text,boolean)
  to authenticated;
revoke all on function public.set_own_avatar_path_v1(text,timestamptz)
  from public,anon,authenticated,service_role;
grant execute on function public.set_own_avatar_path_v1(text,timestamptz) to authenticated;
revoke all on function public.register_attachment_v1(text,text,text,uuid,text,text,bigint)
  from public,anon,authenticated,service_role;
grant execute on function public.register_attachment_v1(text,text,text,uuid,text,text,bigint)
  to authenticated;
revoke all on function public.get_attachments_v1(text,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.get_attachments_v1(text,uuid) to authenticated;
revoke all on function public.mark_attachment_removed_v1(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.mark_attachment_removed_v1(uuid) to authenticated;

commit;
