import EmployeeProfileSettings from "@/components/profile/EmployeeProfileSettings";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";
import { getSelfProfileResult } from "@/lib/profiles/profile-service";
import { signAvatarPath } from "@/lib/storage/storage-service";
import { redirect } from "next/navigation";

export default async function ProfilePage(props?: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  await requireAppProfile();
  const result = await getSelfProfileResult();
  if (result.status === "missing") {
    redirect("/auth/signout?reason=missing_profile");
  }
  if (result.status === "error") {
    throw new Error("Profile data is temporarily unavailable.");
  }
  const model = result.profile;
  model.avatarUrl = await signAvatarPath(model.avatarPath);
  const state = props ? (await props.searchParams).state : undefined;
  return <EmployeeProfileSettings profile={model} emailChanged={state === "email_changed"} />;
}
