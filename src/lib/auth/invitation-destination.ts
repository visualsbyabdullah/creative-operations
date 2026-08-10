import { isAppRole } from "@/types/auth";

export type InvitationDestination =
  | "/dashboard"
  | "/inactive"
  | "/auth/signout?reason=denied";

export function invitationDestination(
  accountState: unknown,
): InvitationDestination {
  if (
    accountState !== null &&
    typeof accountState === "object"
  ) {
    const profile = accountState as Record<
      string,
      unknown
    >;

    if (
      isAppRole(profile.role) &&
      profile.is_active === true
    ) {
      return "/dashboard";
    }

    if (
      isAppRole(profile.role) &&
      profile.is_active === false
    ) {
      return "/inactive";
    }
  }

  return "/auth/signout?reason=denied";
}
