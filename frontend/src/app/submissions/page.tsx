import ManagementSubmissions from "@frontend/components/management/ManagementSubmissions";
import SubmissionsManagement from "@frontend/components/submissions/SubmissionsManagement";
import { isManagementRole, requireAppProfile } from "@backend/modules/auth/requireAppProfile";
import { listSubmissions } from "@backend/modules/submissions/submission-service";

export default async function SubmissionsPage() {
  const profile = await requireAppProfile();
  const result=await listSubmissions();const items=result.ok?result.data:[];
  return isManagementRole(profile.role)
    ? <ManagementSubmissions backendItems={items}/>
    : <SubmissionsManagement backendItems={items}/>;
}
