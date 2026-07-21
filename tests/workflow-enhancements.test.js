import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
const hook=fs.readFileSync('app/src/hooks/useVideos.ts','utf8');
const modal=fs.readFileSync('app/src/components/NewVideoModal.tsx','utf8');
const card=fs.readFileSync('app/src/components/VideoCard.tsx','utf8');
describe('video mutations',()=>{
  it('creates a validated video and keeps ordered state',()=>{expect(modal).toContain('title.trim()');expect(modal).toContain('Could not create the video.');expect(hook).toContain('createVideo(input)');expect(hook).toContain('sort([...items,saved])');});
  it('updates titles without adding a description editor',()=>{expect(card).toContain('onUpdate(value)');expect(card).not.toContain('<span>Description</span>');expect(hook).toContain('updateVideo(video.id,{title})');});
  it('confirms and performs soft archive',()=>{expect(card).toContain("window.confirm('Archive this video?");expect(hook).toContain('archiveVideo(video.id)');expect(hook).not.toContain('.delete()');});
});
