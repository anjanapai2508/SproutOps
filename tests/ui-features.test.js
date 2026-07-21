import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
const app=fs.readFileSync('app/src/App.tsx','utf8');const card=fs.readFileSync('app/src/components/VideoCard.tsx','utf8');const workflow=fs.readFileSync('app/src/components/WorkflowSection.tsx','utf8');const styles=fs.readFileSync('app/src/styles.css','utf8');
describe('SproutOps React UI features',()=>{
  it('keeps desktop and mobile New Video actions',()=>{expect(app).toContain('new-video-fab');expect(fs.readFileSync('app/src/components/AppHeader.tsx','utf8')).toContain('header-new-video-btn');expect(app).toContain('max-sm:grid');});
  it('renders database video facts',()=>{expect(card).toContain('video.sequence_number');expect(card).toContain('VIDEO_STAGE_LABELS[video.current_stage]');expect(card).toContain('NEXT_ACTION_LABELS[video.next_action]');expect(card).toContain('video.updated_at');});
  it('renders every checklist item as an enabled checkbox outside pending writes',()=>{expect(workflow).toContain('deriveWorkflowItems(video)');expect(workflow).toContain('type="checkbox"');expect(workflow).toContain('disabled={pending}');expect(workflow).not.toContain("item.key!=='review_edit'");});
  it('uses Tailwind and no inline legacy stylesheet',()=>{expect(styles).toContain('@import "tailwindcss"');expect(fs.readFileSync('app/index.html','utf8')).not.toContain('<style>');});
});
