import ManagementSubmissions from "@/components/management/ManagementSubmissions";
import SubmissionsManagement from "@/components/submissions/SubmissionsManagement";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";

export default async function SubmissionsPage() {
  const profile = await requireAppProfile();
  return isManagementRole(profile.role) ? <ManagementSubmissions /> : <SubmissionsManagement />;
}