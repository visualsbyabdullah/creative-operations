import EmployeeSettings from "@/components/profile/EmployeeSettings";
import { requireAppProfile } from "@/lib/auth/requireAppProfile";

export default async function SettingsPage() {
  await requireAppProfile();

  return <EmployeeSettings />;
}
