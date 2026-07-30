import EmployeeSettings from "@/components/profile/EmployeeSettings";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";
import { getSelfProfile } from "@/lib/profiles/profile-service";
import { signAvatarPath } from "@/lib/storage/storage-service";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  await requireAppProfile();
  const profile = await getSelfProfile();
  if (!profile) redirect("/auth/signout?reason=missing_profile");
  profile.avatarUrl = await signAvatarPath(profile.avatarPath);
  return <EmployeeSettings profile={profile} />;
}
