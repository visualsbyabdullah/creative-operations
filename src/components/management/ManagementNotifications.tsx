"use client";

import { Bell, Check, CircleAlert, Clock3, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import ManagementShell from "./ManagementShell";
import type { NotificationView } from "@/lib/notifications/notification-types";
import {
  markAllNotificationsReadAction,
  setNotificationReadAction,
} from "@/app/notifications/actions";

const notifications = [
  { title: "New submission received", text: "Ali Raza submitted the Payroll Automation Post for review.", time: "10 minutes ago", icon: Send, tone: "bg-blue-50 text-blue-600" },
  { title: "Task deadline approaching", text: "The MARK47 Broadcast Overlay Demo is due today at 3:00 PM.", time: "35 minutes ago", icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  { title: "Delayed task reported", text: "Usman Ali added a delay reason for the POS Feature Reel.", time: "1 hour ago", icon: CircleAlert, tone: "bg-red-50 text-red-600" },
  { title: "Submission approved", text: "The AI Campaign Planner Carousel was approved.", time: "Yesterday", icon: Check, tone: "bg-emerald-50 text-emerald-600" },
];
type ManagementNotificationItem = {
  id: string | null;
  read: boolean;
  title: string;
  text: string;
  time: string;
  icon: LucideIcon;
  tone: string;
};

export default function ManagementNotifications({backendNotifications}:{backendNotifications?:NotificationView[]}) {
  const mappedItems:ManagementNotificationItem[]=backendNotifications===undefined?notifications.map((item)=>({...item,id:null,read:true})):backendNotifications.map(item=>({
    title:item.title,text:item.body,time:new Date(item.createdAt).toLocaleString(),
    icon:Bell,tone:item.readAt?"bg-slate-50 text-slate-600":"bg-blue-50 text-blue-600",
    id:item.id,read:item.readAt!==null,
  }));
  const [items,setItems]=useState<ManagementNotificationItem[]>(mappedItems);
  const [isPending,startTransition]=useTransition();
  function markOne(id:string|null){
    if(!id||isPending)return;
    startTransition(async()=>{
      const result=await setNotificationReadAction({notificationId:id,read:true});
      if(result.ok)setItems((current)=>current.map((item)=>item.id===id?{...item,read:true,tone:"bg-slate-50 text-slate-600"}:item));
    });
  }
  function markAll(){
    if(isPending)return;
    startTransition(async()=>{
      const result=await markAllNotificationsReadAction();
      if(result.ok)setItems((current)=>current.map((item)=>({...item,read:true,tone:"bg-slate-50 text-slate-600"})));
    });
  }
  return (
    <ManagementShell>
      <section>
        <p className="text-sm font-semibold text-[#2f80ed]">Management activity</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">Track assignments, submissions, delays and team activity.</p>
      </section>

      <section className="page-section-gap rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-6">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-5">
          <div><h2 className="text-lg font-bold">Recent Activity</h2><p className="mt-1 text-xs text-[#9299a4]">{items.length} management notifications</p></div>
          <button type="button" onClick={markAll} disabled={isPending||items.every((item)=>item.read)} className="rounded-full bg-[#edf5ff] px-4 py-2 text-xs font-bold text-[#2f80ed] disabled:opacity-40">
            Mark all read
          </button>
        </div>

        <div className="mt-2 divide-y divide-[#f0f2f5]">
          {items.map(({ id,title, text, time, icon: Icon, tone,read }) => (
            <button type="button" key={id??title} onClick={()=>markOne(id)} disabled={isPending||read||!id} className="flex w-full gap-4 py-5 text-left disabled:cursor-default">
              <div className={`grid size-11 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={18} /></div>
              <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#777e89]">{text}</p><p className="mt-2 text-[10px] font-semibold text-[#a0a7b1]">{time}</p></div>
            </button>
          ))}
        </div>
      </section>
    </ManagementShell>
  );
}
