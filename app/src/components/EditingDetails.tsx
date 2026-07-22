import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { addEditComment, getEditingDetails, startEditing, updateEditingStatus } from '../services/editing';
import { EDIT_STATUS_LABELS, withEditingVersion } from '../constants/video-workflow';
import type { EditingDetails as Details, EditVersion, EditVersionStatus, Video } from '../types/domain';

const SELECTABLE_STATUSES=['Editing','In-Review','Complete'] as const satisfies readonly EditVersionStatus[];
const format=(value:string|null)=>value?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)):'—';
const selectableStatus=(status:EditVersionStatus):typeof SELECTABLE_STATUSES[number]=>status==='In-Review'||status==='Complete'?status:status==='Editing'?'Editing':status==='draft'?'Editing':'Complete';

export function EditingDetails({video,user,onVideoChange}:{video:Video;user:User|null;onVideoChange?:(video:Video)=>void}) {
  const [details,setDetails]=useState<Details|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const [commentOpen,setCommentOpen]=useState(false);
  const [showPrevious,setShowPrevious]=useState(false);
  const commentRef=useRef<HTMLTextAreaElement>(null);

  const load=async()=>{
    setLoading(true);setError(null);
    try{setDetails(await getEditingDetails(video));}
    catch{setError('Could not load editing details.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[video.id,video.next_action_version_id]);
  useEffect(()=>{if(commentOpen)commentRef.current?.focus();},[commentOpen]);

  const mutate=async(operation:()=>Promise<unknown>)=>{
    setBusy(true);setError(null);
    try{await operation();await load();}
    catch(value){setError(value instanceof Error?value.message:'Could not save editing changes.');}
    finally{setBusy(false);}
  };
  const syncVersion=(base:Video,version:EditVersion)=>onVideoChange?.(withEditingVersion(base,version));

  if(loading)return <div className="py-4 text-sm text-slate-500" role="status">Loading editing details…</div>;
  if(error&&!details)return <div className="py-4 text-sm text-red-700" role="alert">Could not load editing details. <button className="btn-text" onClick={()=>void load()}>Retry</button></div>;
  const version=details?.activeVersion;
  if(!version)return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="eyebrow">Editing status</div><div className="mt-1 text-base font-semibold text-slate-800">Draft</div>
    <p className="mt-2 text-sm text-slate-500">No editing version has been created yet.</p>
    {error&&<div className="mt-3 text-xs text-red-700" role="status">{error}</div>}
    {user&&<button className="btn-primary mt-4" type="button" disabled={busy} onClick={async()=>{
      setBusy(true);setError(null);
      try{
        const result=await startEditing(video,user.id);
        setDetails((current)=>({activeVersion:result.activeVersion,versions:[result.activeVersion,...(current?.versions||[])],comments:[],profilesById:current?.profilesById||{}}));
        syncVersion(result.video,result.activeVersion);
      }catch(value){setError(value instanceof Error?value.message:'Could not start editing.');}
      finally{setBusy(false);}
    }}>{busy?'Starting…':'Start Editing'}</button>}
  </div>;

  const profileName=(id:string|null)=>id?(details?.profilesById[id]?.display_name||'Unknown user'):'Unknown user';
  const comments=details?.comments||[];
  const visibleComments=showPrevious?comments:comments.slice(-3);

  return <div className="grid gap-5">
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="eyebrow">Editing status</div><div className="mt-1 text-sm text-slate-500">Version {version.version_number}</div></div>
        <label className="grid min-w-44 gap-1 text-xs font-medium text-slate-500">Status
          <select className="input min-h-10 py-1" value={selectableStatus(version.status)} disabled={busy||!user} onChange={(event)=>user&&void mutate(async()=>{const result=await updateEditingStatus(video,version,event.target.value as EditVersionStatus,user.id);syncVersion(result.video,result.activeVersion);})}>
            {SELECTABLE_STATUSES.map((status)=><option key={status} value={status}>{EDIT_STATUS_LABELS[status]}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 grid gap-1 text-xs font-medium text-slate-500">
        <span>Assigned to {profileName(version.assigned_editor)}</span>
        <span>Created by {profileName(version.created_by)} · {format(version.created_at)}</span>
      </div>
    </div>

    {error&&<div className="text-xs text-red-700" role="status">{error}</div>}

    <section>
      <div className="flex items-center justify-between gap-3">
        <div><div className="eyebrow">Comments</div><div className="mt-1 text-sm text-slate-500">{comments.length} {comments.length===1?'comment':'comments'}</div></div>
        {user&&!commentOpen&&<button className="btn-secondary" type="button" onClick={()=>setCommentOpen(true)}>Create new comment</button>}
      </div>

      {commentOpen&&user&&<form className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3" onSubmit={(event)=>{event.preventDefault();void mutate(async()=>{await addEditComment(version.id,user,details?.profilesById[user.id]||null,message);setMessage('');setCommentOpen(false);});}}>
        <label className="grid gap-1 text-xs font-medium text-slate-500">Comment
          <textarea ref={commentRef} className="input min-h-24 resize-y" value={message} onChange={(event)=>setMessage(event.target.value)} placeholder="Write a comment" required/>
        </label>
        <div className="flex justify-end gap-2"><button className="btn-secondary" type="button" onClick={()=>{setMessage('');setCommentOpen(false);}}>Cancel</button><button className="btn-primary" disabled={busy}>Save comment</button></div>
      </form>}

      <div className="mt-3">
        {visibleComments.length?visibleComments.map((comment)=><article key={comment.id} className="border-b border-slate-100 py-3 last:border-0">
          <div className="flex flex-wrap justify-between gap-2 text-xs"><strong className="font-semibold">{comment.author_name_snapshot}</strong><span className="font-medium text-slate-400">{format(comment.created_at)}</span></div>
          <p className="mt-1 text-sm text-slate-600">{comment.message}</p>
        </article>):<div className="py-3 text-sm text-slate-500">No comments yet.</div>}
      </div>
      {comments.length>3&&<button className="btn-text mt-1" type="button" onClick={()=>setShowPrevious((value)=>!value)}>{showPrevious?'Show latest only':'Show previous'}</button>}
    </section>
  </div>;
}
