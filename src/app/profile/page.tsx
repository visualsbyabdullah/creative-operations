import ManagementProfileSettings from "@/components/management/ManagementProfileSettings";
import EmployeeProfileSettings from "@/components/profile/EmployeeProfileSettings";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";
import { getSelfProfile } from "@/lib/profiles/profile-service";
import { signAvatarPath } from "@/lib/storage/storage-service";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const profile = await requireAppProfile();
  const model = await getSelfProfile();
  if (!model) redirect("/auth/signout?reason=missing_profile");
  model.avatarUrl = await signAvatarPath(model.avatarPath);
  return isManagementRole(profile.role)
    ? <ManagementProfileSettings profile={profile} model={model} />
    : <EmployeeProfileSettings profile={model} />;
}
