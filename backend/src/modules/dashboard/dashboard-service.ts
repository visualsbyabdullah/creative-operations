import "server-only";

import { getActiveProfile, isManagementRole } from "@backend/modules/auth/authorization";
import type { ActionResult } from "@shared/contracts/action-result";
import type { ManagementDashboardData } from "@shared/contracts/dashboard-types";
import { createClient } from "@backend/supabase/server";

export async function getManagementDashboard():Promise<ActionResult<ManagementDashboardData>>{
  const actor=await getActiveProfile();
  if(actor.status!=="active"||!isManagementRole(actor.profile.role)){
    return{ok:false,code:"forbidden"};
  }
  const client=await createClient();
  const{data,error}=await client.rpc("get_management_dashboard_v1");
  const row=data?.[0] as Record<string,unknown>|undefined;
  if(error||!row)return{ok:false,code:"temporarily_unavailable"};
  return{ok:true,data:{
    activeTasks:Number(row.active_tasks??0),
    pendingReviews:Number(row.pending_reviews??0),
    delayedTasks:Number(row.delayed_tasks??0),
    teamMembers:Number(row.team_members??0),
    team:(row.team as ManagementDashboardData["team"])??[],
    reviews:(row.reviews as ManagementDashboardData["reviews"])??[],
  }};
}
