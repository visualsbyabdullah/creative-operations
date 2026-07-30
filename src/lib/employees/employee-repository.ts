import { createClient } from "@/lib/supabase/server";
import type {
  EmployeeListInput,
  InviteEmployeeInput,
  ManagedEmployeeUpdate,
} from "@/lib/employees/employee-schemas";
import { decodeEmployeeCursor } from "@/lib/employees/employee-cursor";

export async function listEmployeeRows(input: EmployeeListInput) {
  const client = await createClient();
  const query = {
    search: input.search,
    roles: input.roles,
    departments: input.departments,
    isActive: input.isActive,
    sort: input.sort,
    direction: input.direction,
  };
  const cursor = decodeEmployeeCursor(query, input.cursor);
  if (input.cursor && !cursor) {
    return { data: null, error: { code: "22023", message: "invalid cursor" } };
  }
  return client.rpc("get_employee_directory_v2", {
    p_search: input.search,
    p_roles: input.roles,
    p_departments: input.departments,
    p_is_active: input.isActive,
    p_sort: input.sort,
    p_direction: input.direction,
    p_limit: input.limit,
    p_cursor_value: cursor?.value === null || cursor?.value === undefined
      ? null : String(cursor.value),
    p_cursor_is_null: cursor?.value === null,
    p_cursor_id: cursor?.id ?? null,
  });
}

export async function getEmployeeRow(profileId: string) {
  const client = await createClient();
  return client.rpc("get_employee_detail", { p_profile_id: profileId });
}

export async function prepareInvitation(input: InviteEmployeeInput, digestHex: string) {
  const client = await createClient();
  return client.rpc("prepare_employee_invitation_v2", {
    p_email_digest: `\\x${digestHex}`,
    p_full_name: input.fullName,
    p_role: input.role,
    p_department: input.department,
    p_manager_id: input.managerId,
  });
}

export async function markInvitationAccepted(intentId: string, userId: string) {
  const client = await createClient();
  return client.rpc("mark_employee_invitation_provider_accepted", {
    p_intent_id: intentId,
    p_invited_user_id: userId,
  });
}

export async function finalizeInvitation(intentId: string, userId: string) {
  const client = await createClient();
  return client.rpc("finalize_employee_invitation", {
    p_intent_id: intentId,
    p_invited_user_id: userId,
  });
}

export async function updateManagedEmployee(input: ManagedEmployeeUpdate) {
  const client = await createClient();
  return client.rpc("manage_profile_v2", {
    p_profile_id: input.profileId,
    p_full_name: input.fullName,
    p_avatar_url: input.avatarUrl,
    p_phone: input.phone,
    p_timezone: input.timezone,
    p_department: input.department,
    p_role: input.role,
    p_is_active: input.isActive,
    p_manager_id: input.managerId,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
}
