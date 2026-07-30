import ManagementNotifications from "@/components/management/ManagementNotifications";
import NotificationsCenter from "@/components/notifications/NotificationsCenter";
import { isManagementRole, requireAppProfile } from "@/lib/auth/requireAppProfile";
import { listNotifications } from "@/lib/notifications/notification-service";

export default async function NotificationsPage() {
  const profile = await requireAppProfile();
  const result=await listNotifications();const data=result.ok?result.data:{items:[],unread:0};
  return isManagementRole(profile.role)
    ? <ManagementNotifications backendNotifications={data.items}/>
    : <NotificationsCenter backendNotifications={data.items}/>;
}
