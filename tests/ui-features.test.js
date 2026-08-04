import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
const app=fs.readFileSync('app/src/App.tsx','utf8');const card=fs.readFileSync('app/src/components/VideoCard.tsx','utf8');const workflow=fs.readFileSync('app/src/components/WorkflowSection.tsx','utf8');const styles=fs.readFileSync('app/src/styles.css','utf8');
describe('SproutOps React UI features',()=>{
  it('keeps desktop and mobile New Video actions',()=>{expect(app).toContain('new-video-fab');expect(fs.readFileSync('app/src/components/AppHeader.tsx','utf8')).toContain('header-new-video-btn');expect(app).toContain('max-sm:grid');});
  it('always renders the active and completed video sections after loading',()=>{expect(app).toContain('<VideoSections key={activeProjectId} videos={visibleVideos}');expect(app).not.toContain('!videos.videos.length?');});
  it('renders user-entered titles and database video facts without sequence prefixes',()=>{expect(card).not.toContain('video.sequence_number');expect(card).toContain('video.title');expect(card).toContain('VIDEO_STAGE_LABELS[video.current_stage]');expect(card).toContain('NEXT_ACTION_LABELS[video.next_action]');expect(card).toContain('video.updated_at');});
  it('renders every checklist item as an enabled checkbox outside pending writes',()=>{expect(workflow).toContain('deriveWorkflowItems(video)');expect(workflow).toContain('type="checkbox"');expect(workflow).toContain('disabled={pending}');expect(workflow).not.toContain("item.key!=='review_edit'");});
  it('uses Tailwind and no inline legacy stylesheet',()=>{expect(styles).toContain('@import "tailwindcss"');expect(fs.readFileSync('app/index.html','utf8')).not.toContain('<style>');});
});
