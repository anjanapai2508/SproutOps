import { VIDEO_STAGE_LABELS, VIDEO_WORKFLOW } from '../constants/video-workflow';
import type { Video, VideoStage } from '../types/domain';

const stages=[
  ['pre_production','📝'],
  ['production','🎥'],
  ['editing','✂️'],
  ['publishing','🚀'],
  ['completed','✓']
] as const satisfies readonly (readonly [Exclude<VideoStage,'on_hold'>,string])[];

export function StageSummary({video}:{video:Video}) {
  const completed=new Set(video.completed_actions);

  return <div className="relative mt-5" aria-label="Production pipeline">
    <div className="absolute left-[10%] right-[10%] top-5 h-px bg-slate-300" aria-hidden="true"/>
    <div className="relative grid grid-cols-5 gap-1">
      {stages.map(([stage,icon])=>{
        const stageActions=VIDEO_WORKFLOW.filter((item)=>item.stage===stage);
        const isCurrent=video.current_stage===stage;
        const isComplete=stage!=='completed'&&stageActions.length>0&&stageActions.every((item)=>completed.has(item.key));
        const state=isCurrent?'current':isComplete?'completed':'upcoming';
        const circle=state==='current'
          ? 'border-2 border-cyan-600 bg-cyan-50 text-cyan-800 shadow-sm'
          : state==='completed'
            ? 'border border-emerald-500 bg-emerald-50 text-emerald-800'
            : 'border border-slate-300 bg-white text-slate-400';

        return <div key={stage} className="relative z-10 flex min-w-0 flex-col items-center text-center" aria-label={`${VIDEO_STAGE_LABELS[stage]}: ${state}`}>
          <span className={`relative grid h-10 w-10 place-items-center rounded-full text-base ${circle}`} aria-hidden="true">
            {icon}
            {isComplete&&<span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">✓</span>}
          </span>
          <span className={`mt-1.5 block text-[10px] font-medium leading-tight ${isCurrent?'text-cyan-800':isComplete?'text-emerald-800':'text-slate-500'}`}>{VIDEO_STAGE_LABELS[stage]}</span>
          <span className="mt-0.5 min-h-3 text-[9px] font-semibold uppercase tracking-wide text-cyan-700">{isCurrent?'Current':''}</span>
        </div>;
      })}
    </div>
  </div>;
}
