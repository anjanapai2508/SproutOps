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
    expect(main).not.toContain('video.next_action_note');
    expect(main).toContain('video.updated_at');
  });

  it('presents stage and up-next values as compact information cards', () => {
    expect(main).toContain('fact-card stage-fact');
    expect(main).toContain('fact-card up-next-fact');
    expect(main).toContain('fact-label">Stage');
    expect(main).toContain('fact-label">Up Next');
    expect(html).toContain('--stage-card-background:#F3F0FA');
    expect(html).toContain('--up-next-card-background:#EDF8F0');
    expect(html).not.toContain('.fact-pill');
  });

  it('renders connected workflow task and editing data', () => {
    expect(main).toContain('state.tasksByVideoId[video.id]');
    expect(main).toContain('data-action="toggle-task"');
    expect(main).toContain('await updateVideoTaskCompletion(taskId,completed)');
    expect(main).toContain('video.edit_versions');
    expect(main).toContain('version.edit_comments');
  });
});
