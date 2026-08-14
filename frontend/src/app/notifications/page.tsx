import ManagementNotifications from "@frontend/components/management/ManagementNotifications";
import NotificationsCenter from "@frontend/components/notifications/NotificationsCenter";
import { isManagementRole, requireAppProfile } from "@backend/modules/auth/requireAppProfile";
import { listNotifications } from "@backend/modules/notifications/notification-service";

export default async function NotificationsPage() {
  const profile = await requireAppProfile();
  const result=await listNotifications();const data=result.ok?result.data:{items:[],unread:0};
  return isManagementRole(profile.role)
    ? <ManagementNotifications backendNotifications={data.items}/>
    : <NotificationsCenter backendNotifications={data.items}/>;
}
