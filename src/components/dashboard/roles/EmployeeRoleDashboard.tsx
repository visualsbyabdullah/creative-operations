import CreativeDashboard from "@/components/dashboard/CreativeDashboard";

import type {
  EmployeeProfile,
} from "@/types/auth";

export default function EmployeeRoleDashboard({
  profile,
}: {
  profile: EmployeeProfile;
}) {
  return (
    <CreativeDashboard
      profile={profile}
    />
  );
}