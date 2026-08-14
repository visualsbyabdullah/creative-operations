"use client";

import SystemTable from "@frontend/components/ui/SystemTable";

import { Check, Clock3, ExternalLink, FileText, Loader2, RotateCcw, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ManagementShell from "./ManagementShell";
import type { SubmissionView } from "@shared/contracts/submission-types";
import { submitFeedbackAction } from "@frontend/app/submissions/actions";
import {
  listAttachmentsAction,
  removeAttachmentAction,
} from "@frontend/app/attachments/actions";
import type { AttachmentView } from "@shared/contracts/storage-types";

type ReviewStatus = "In Review" | "Revision Required" | "Approved";

type Submission = {
  id: number|string;
  title: string;
  brand: string;
  employee: string;
  type: "Design" | "Video";
  status: ReviewStatus;
  submitted: string;
  sourceLink: string;
  feedback?: string;
  updatedAt?:string;
  taskUpdatedAt?:string;
  attachmentsImmutable?:boolean;
};

const initialItems: Submission[] = [
  { id: 1, title: "Payroll Automation Post", brand: "Softech", employee: "Ali Raza", type: "Design", status: "In Review", submitted: "Today, 1:20 PM", sourceLink: "https://drive.google.com/" },
  { id: 2, title: "Business Automation Reel", brand: "Softech", employee: "Hamza Khan", type: "Video", status: "Revision Required", submitted: "Today, 12:10 PM", sourceLink: "https://drive.google.com/", feedback: "Shorten the opening and improve caption readability." },
  { id: 3, title: "AI Campaign Planner Carousel", brand: "Softgenie", employee: "Abdullah Naeem", type: "Design", status: "In Review", submitted: "Yesterday, 4:45 PM", sourceLink: "https://drive.google.com/" },
  { id: 4, title: "Broadcast Overlay Demo", brand: "MARK47", employee: "Usman Ali", type: "Video", status: "Approved", submitted: "Yesterday, 2:35 PM", sourceLink: "https://drive.google.com/" },
];

const statusStyles: Record<ReviewStatus, string> = {
  "In Review": "bg-amber-50 text-amber-700",
  "Revision Required": "bg-orange-50 text-orange-700",
  Approved: "bg-emerald-50 text-emerald-700",
};

function mapSubmission(item:SubmissionView):Submission{
  return{id:item.id,title:item.taskTitle,brand:item.brandName,employee:item.submitterName,
    type:item.type==="video"?"Video":"Design",
    status:item.status==="revision_requested"?"Revision Required":
      item.status==="approved"||item.status==="published"?"Approved":"In Review",
    submitted:item.submittedAt?new Date(item.submittedAt).toLocaleString():"Pending",
    sourceLink:item.finalUrl??item.sourceUrl??"#",feedback:item.latestFeedback??undefined,
    updatedAt:item.updatedAt,taskUpdatedAt:item.taskUpdatedAt,
    attachmentsImmutable:item.status==="published"||item.status==="archived"};
}
export default function ManagementSubmissions({backendItems}:{backendItems?:SubmissionView[]}) {
  const [items, setItems] = useState(
    backendItems===undefined?initialItems:backendItems.map(mapSubmission));
  const [selectedId, setSelectedId] = useState<number|string|null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackPending,setFeedbackPending]=useState(false);
  const [feedbackMessage,setFeedbackMessage]=useState("");
  const [attachments,setAttachments]=useState<AttachmentView[]>([]);
  const [attachmentsPending,setAttachmentsPending]=useState(false);
  const [attachmentMessage,setAttachmentMessage]=useState("");
  const [removingAttachment,setRemovingAttachment]=useState<string|null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(()=>{
    if(selectedId===null)return;
    let current=true;
    void listAttachmentsAction("submission",String(selectedId)).then((result)=>{
      if(!current)return;
      if(result.ok)setAttachments(result.data);
      else setAttachmentMessage("Attachments could not be loaded safely.");
      setAttachmentsPending(false);
    });
    return()=>{current=false;};
  },[selectedId]);

  async function removeSubmissionAttachment(id:string){
    if(!selected||selected.attachmentsImmutable||
      !window.confirm("Remove this private submission attachment?"))return;
    setRemovingAttachment(id);setAttachmentMessage("");
    const result=await removeAttachmentAction(id,"submission");
    if(result.ok){
      setAttachments((current)=>current.filter((item)=>item.id!==id));
      setAttachmentMessage("Attachment removed.");
    }else{
      setAttachmentMessage(result.code==="forbidden"
        ?"Published submission attachments are immutable."
        :"Attachment removal could not be completed safely.");
    }
    setRemovingAttachment(null);
  }

  const metrics = useMemo(() => [
    { label: "Total Submissions", value: items.length, caption: "Across both departments", icon: Send, card: "bg-brand-blue-gradient text-white", iconTone: "bg-white text-[#2f80ed]" },
    { label: "In Review", value: items.filter((item) => item.status === "In Review").length, caption: "Waiting for feedback", icon: Clock3, card: "border border-[#edf0f5] bg-white", iconTone: "bg-amber-50 text-amber-600" },
    { label: "Revisions", value: items.filter((item) => item.status === "Revision Required").length, caption: "Action required", icon: RotateCcw, card: "border border-[#edf0f5] bg-white", iconTone: "bg-orange-50 text-orange-600" },
    { label: "Approved", value: items.filter((item) => item.status === "Approved").length, caption: "Ready for publishing", icon: Check, card: "border border-[#edf0f5] bg-white", iconTone: "bg-emerald-50 text-emerald-600" },
  ], [items]);

  function openReview(id: number|string) {
    const item = items.find((entry) => entry.id === id);
    setAttachments([]);
    setAttachmentMessage("");
    setFeedbackMessage("");
    setAttachmentsPending(true);
    setSelectedId(id);
    setFeedback(item?.feedback ?? "");
  }

  async function submitFeedback() {
    if (!selected || !feedback.trim() || feedbackPending) return;
    if(!selected.updatedAt||!selected.taskUpdatedAt){
      setFeedbackMessage("Feedback could not be saved safely.");
      return;
    }
    setFeedbackPending(true);
    setFeedbackMessage("");
    const result=await submitFeedbackAction({submissionId:String(selected.id),feedback,
      expectedUpdatedAt:selected.updatedAt,expectedTaskUpdatedAt:selected.taskUpdatedAt});
    setFeedbackPending(false);
    if(!result.ok){
      setFeedbackMessage(result.code==="stale_update"
        ?"This submission changed since it was loaded. Close and reopen it before saving feedback."
        :"Feedback could not be saved safely.");
      return;
    }
    setItems(current=>current.map(item=>item.id===selected.id?{...item,feedback:feedback.trim()}:item));
    setSelectedId(null);
    setFeedback("");
  }

  return (
    <ManagementShell>
      <section>
        <p className="text-sm font-semibold text-[#2f80ed]">Team reviews</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Submission Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777e89]">Review design and video submissions across the complete creative team.</p>
      </section>

      <section className="page-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, caption, icon: Icon, card, iconTone }) => (
          <article key={label} className={`kpi-card-hover rounded-[22px] p-5 ${card}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-70">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
                <p className="mt-3 text-xs opacity-60">{caption}</p>
              </div>
              <div className={`grid size-11 place-items-center rounded-full ${iconTone}`}><Icon size={20} /></div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white shadow-[0_15px_42px_rgba(24,39,75,0.04)]">
        <div className="border-b border-[#f0f2f5] p-5 sm:p-6">
          <h2 className="text-lg font-bold">Review Queue</h2>
          <p className="mt-1 text-xs text-[#9299a4]">All employee submissions requiring management action</p>
        </div>

        <div className="dashboard-scrollbar overflow-x-auto">
          <SystemTable columns={5} minWidth={960} cellWidth={150}>
            <thead className="bg-[#fafbfc] text-[10px] uppercase tracking-[0.08em] text-[#949ba6]">
              <tr><th className="px-6 py-4">Submission</th><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Submitted</th><th className="px-6 py-4">Status</th><th className="px-6 py-4"><div className="w-full text-left">Action</div></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#f0f2f5]">
                  <td className="px-6 py-4"><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-[10px] text-[#9299a4]">{item.brand} - {item.type}</p></td>
                  <td className="px-6 py-4 text-sm font-semibold">{item.employee}</td>
                  <td className="px-6 py-4 text-xs text-[#707782]">{item.submitted}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyles[item.status]}`}>{item.status}</span></td>
                  <td className="px-6 py-4 align-middle">
  <div className="w-full">
    <button type="button" onClick={() => openReview(item.id)} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e6eaf0] px-4 py-2 text-[10px] font-bold transition hover:border-[#2f80ed] hover:text-[#2f80ed]">
                      Review <ExternalLink size={14} strokeWidth={1.8} className="shrink-0" />
                    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </SystemTable>
        </div>
      </section>

      {selected ? (
        <>
          <button type="button" aria-label="Close submission review" onClick={() => setSelectedId(null)} className="fixed inset-0 z-40 bg-[#111827]/35 backdrop-blur-[2px]" />

          <aside className="dashboard-scrollbar fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-y-auto bg-white shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f5] bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-xs font-bold text-[#2f80ed]">{selected.brand} - {selected.type}</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">Review Submission</h2>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="grid size-10 place-items-center rounded-full bg-[#f4f6f9]"><X size={18} /></button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <section>
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyles[selected.status]}`}>{selected.status}</span>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em]">{selected.title}</h3>
                <p className="mt-2 text-sm text-[#777e89]">Submitted by {selected.employee} - {selected.submitted}</p>
              </section>

              <a href={selected.sourceLink} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e5e9ef] px-5 py-3 text-xs font-bold text-[#2f80ed]">
                Open Submitted Work <ExternalLink size={14} />
              </a>

              <section className="rounded-2xl border border-[#e5e9ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold">Private attachments</h3>
                    <p className="mt-1 text-xs text-[#858d99]">
                      Signed links expire after five minutes.
                    </p>
                  </div>
                  {selected.attachmentsImmutable ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                      Immutable
                    </span>
                  ) : null}
                </div>
                {attachmentsPending ? (
                  <p className="mt-4 text-xs text-[#858d99]">Loading attachments…</p>
                ) : attachments.length===0 ? (
                  <p className="mt-4 text-xs text-[#858d99]">No private attachments.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment)=>(
                      <div key={attachment.id} className="flex items-center gap-3 rounded-xl bg-[#f7f9fc] p-3">
                        <FileText size={16} className="shrink-0 text-[#2f80ed]"/>
                        <a href={attachment.url} target="_blank" rel="noreferrer"
                          className="min-w-0 flex-1 truncate text-xs font-bold text-[#2f80ed]">
                          {attachment.name}
                        </a>
                        <span className="text-[10px] text-[#858d99]">
                          {Math.max(1,Math.ceil(attachment.byteSize/1024))} KB
                        </span>
                        <button type="button"
                          onClick={()=>removeSubmissionAttachment(attachment.id)}
                          disabled={selected.attachmentsImmutable||removingAttachment===attachment.id}
                          title={selected.attachmentsImmutable
                            ?"Published submission attachments cannot be removed."
                            :"Remove attachment"}
                          aria-label={`Remove ${attachment.name}`}
                          className="grid size-8 place-items-center rounded-full text-red-500 disabled:cursor-not-allowed disabled:opacity-35">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {attachmentMessage ? (
                  <p className="mt-3 text-xs text-[#68717e]" role="status">{attachmentMessage}</p>
                ) : null}
              </section>

              <label>
                <span className="text-xs font-bold text-[#4d5560]">Revision feedback</span>
                <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={5} placeholder="Explain what needs to be changed..." className="mt-2 w-full resize-none rounded-2xl border border-[#e5e9ef] p-4 text-sm leading-6 outline-none focus:border-[#2f80ed]" />
              </label>

              <button type="button" onClick={() => submitFeedback()} disabled={!feedback.trim()||feedbackPending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f80ed] px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {feedbackPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {feedbackPending ? "Saving…" : "Submit Feedback"}
              </button>
              {feedbackMessage ? (
                <p className="text-xs font-semibold text-orange-700" role="status">{feedbackMessage}</p>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </ManagementShell>
  );
}
