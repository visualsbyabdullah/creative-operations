import EmployeeProfileSettings from "@frontend/components/profile/EmployeeProfileSettings";
import type { SelfProfile } from "@shared/contracts/profile-types";

export default function EmployeeSettings({ profile }: { profile: SelfProfile }) {
  return <EmployeeProfileSettings profile={profile} />;
}
