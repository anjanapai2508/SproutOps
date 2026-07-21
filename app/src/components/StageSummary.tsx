import { VIDEO_STAGE_LABELS } from '../constants/video-workflow';
import type { Video } from '../types/domain';

const stages=[['pre_production','📝'],['production','🎥'],['editing','✂️'],['publishing','🚀'],['completed','✓']] as const;
export function StageSummary({video}:{video:Video}) { return <div className="mt-4 grid grid-cols-5 gap-1" aria-label="Production pipeline">{stages.map(([stage,icon])=><div key={stage} className={`min-w-0 text-center text-[11px] font-semibold ${video.current_stage===stage?'text-cyan-700':'text-slate-400'}`}><span className="text-base">{icon}</span><span className="mt-1 block truncate max-sm:hidden">{VIDEO_STAGE_LABELS[stage]}</span></div>)}</div>; }
