import { describe, it, expect } from 'vitest';
import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const main = fs.readFileSync('app/src/main.js', 'utf8');

describe('SproutOps UI features', () => {
  it('keeps responsive desktop and mobile New Video actions', () => {
    expect(main).toContain('header-new-video-btn');
    expect(main).toContain('new-video-fab');
    expect(html).toContain('.header-new-video-btn { display:none; }');
    expect(html).toContain('.new-video-fab { display:inline-grid;');
  });

  it('renders sequence-numbered database video cards', () => {
    expect(main).toContain('#${video.sequence_number}');
    expect(main).toContain('VIDEO_STAGE_LABELS[video.current_stage]');
    expect(main).toContain('NEXT_ACTION_LABELS[video.next_action]');
    expect(main).toContain('video.next_action_note');
    expect(main).toContain('video.updated_at');
  });

  it('renders connected workflow task and editing data', () => {
    expect(main).toContain('video.video_tasks');
    expect(main).toContain('video.edit_versions');
    expect(main).toContain('version.edit_comments');
  });
});
