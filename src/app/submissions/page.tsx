import ManagementSubmissions from "@/components/management/ManagementSubmissions";
import SubmissionsManagement from "@/components/submissions/SubmissionsManagement";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";
import { listSubmissions } from "@/lib/submissions/submission-service";

export default async function SubmissionsPage() {
  const profile = await requireAppProfile();
  const result=await listSubmissions();const items=result.ok?result.data:[];
  return isManagementRole(profile.role)
    ? <ManagementSubmissions backendItems={items}/>
    : <SubmissionsManagement backendItems={items}/>;
}
