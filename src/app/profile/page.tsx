import ManagementProfileSettings from "@/components/management/ManagementProfileSettings";
import EmployeeProfileSettings from "@/components/profile/EmployeeProfileSettings";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";

export default async function ProfilePage() {
  const profile = await requireAppProfile();
  return isManagementRole(profile.role)
    ? <ManagementProfileSettings profile={profile} />
    : <EmployeeProfileSettings />;
}