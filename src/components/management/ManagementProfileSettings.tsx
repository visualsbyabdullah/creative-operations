import EmployeeProfileSettings from "@/components/profile/EmployeeProfileSettings";
import type { SelfProfile } from "@/lib/profiles/profile-types";
import type { EmployeeProfile } from "@/types/auth";

export default function ManagementProfileSettings({
  model,
}: {
  profile: EmployeeProfile;
  model: SelfProfile;
}) {
  return <EmployeeProfileSettings profile={model} />;
}
