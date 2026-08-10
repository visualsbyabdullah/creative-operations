import EmployeeProfileSettings from "@/components/profile/EmployeeProfileSettings";
import type { SelfProfile } from "@/lib/profiles/profile-types";

export default function EmployeeSettings({ profile }: { profile: SelfProfile }) {
  return <EmployeeProfileSettings profile={profile} />;
}
