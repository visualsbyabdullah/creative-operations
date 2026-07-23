import { Bell, Check, CircleAlert, Clock3, Send } from "lucide-react";
import ManagementShell from "./ManagementShell";

const notifications = [
  { title: "New submission received", text: "Ali Raza submitted the Payroll Automation Post for review.", time: "10 minutes ago", icon: Send, tone: "bg-blue-50 text-blue-600" },
  { title: "Task deadline approaching", text: "The MARK47 Broadcast Overlay Demo is due today at 3:00 PM.", time: "35 minutes ago", icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  { title: "Delayed task reported", text: "Usman Ali added a delay reason for the POS Feature Reel.", time: "1 hour ago", icon: CircleAlert, tone: "bg-red-50 text-red-600" },
  { title: "Submission approved", text: "The AI Campaign Planner Carousel was approved.", time: "Yesterday", icon: Check, tone: "bg-emerald-50 text-emerald-600" },
];

export default function ManagementNotifications() {
  return (
    <ManagementShell>
      <section>
        <p className="text-sm font-semibold text-[#2f80ed]">Management activity</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">Track assignments, submissions, delays and team activity.</p>
      </section>

      <section className="page-section-gap rounded-[24px] border border-[#edf0f5] bg-white p-5 shadow-[0_15px_42px_rgba(24,39,75,0.04)] sm:p-6">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-5">
          <div><h2 className="text-lg font-bold">Recent Activity</h2><p className="mt-1 text-xs text-[#9299a4]">{notifications.length} management notifications</p></div>
          <div className="grid size-11 place-items-center rounded-full bg-[#edf5ff] text-[#2f80ed]"><Bell size={19} /></div>
        </div>

        <div className="mt-2 divide-y divide-[#f0f2f5]">
          {notifications.map(({ title, text, time, icon: Icon, tone }) => (
            <article key={title} className="flex gap-4 py-5">
              <div className={`grid size-11 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={18} /></div>
              <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#777e89]">{text}</p><p className="mt-2 text-[10px] font-semibold text-[#a0a7b1]">{time}</p></div>
            </article>
          ))}
        </div>
      </section>
    </ManagementShell>
  );
}