import EmployeeSettings from "@/components/profile/EmployeeSettings";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";
import { getSelfProfileResult } from "@/lib/profiles/profile-service";
import { signAvatarPath } from "@/lib/storage/storage-service";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  await requireAppProfile();
  const result = await getSelfProfileResult();
  if (result.status === "missing") {
    redirect("/auth/signout?reason=missing_profile");
  }
  if (result.status === "error") {
    throw new Error("Profile data is temporarily unavailable.");
  }
  const profile = result.profile;
  profile.avatarUrl = await signAvatarPath(profile.avatarPath);
  return <EmployeeSettings profile={profile} />;
}
