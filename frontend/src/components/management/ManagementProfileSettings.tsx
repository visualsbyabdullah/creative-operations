import EmployeeProfileSettings from "@frontend/components/profile/EmployeeProfileSettings";
import type { SelfProfile } from "@shared/contracts/profile-types";
import type { EmployeeProfile } from "@shared/contracts/auth";

export default function ManagementProfileSettings({
  model,
}: {
  profile: EmployeeProfile;
  model: SelfProfile;
}) {
  return <EmployeeProfileSettings profile={model} />;
}
