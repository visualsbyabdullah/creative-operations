import ManagementNotifications from "@/components/management/ManagementNotifications";
import NotificationsCenter from "@/components/notifications/NotificationsCenter";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";

export default async function NotificationsPage() {
  const profile = await requireAppProfile();
  return isManagementRole(profile.role) ? <ManagementNotifications /> : <NotificationsCenter />;
}