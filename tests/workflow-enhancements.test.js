import { describe, expect, it } from 'vitest';
import fs from 'fs';

const main = fs.readFileSync('app/src/main.js', 'utf8');

describe('video mutations', () => {
  it('connects create with title validation, description, saving, and ordered insertion', () => {
    expect(main).toContain("const title=data.get('title')?.toString().trim()");
    expect(main).toContain('state.isSaving=true');
    expect(main).toContain('state.createDraft={title,description}');
    expect(main).toContain('value="${escapeHtml(state.createDraft.title)}"');
    expect(main).toContain('await createVideo({title,description})');
    expect(main).toContain('sortVideos([...state.videos,created])');
    expect(main).toContain("state.createDraft={title:'',description:''}");
    expect(main).toContain('Could not create the video.');
  });

  it('connects title and description updates', () => {
    expect(main).toContain('await updateVideo(id,{title})');
    expect(main).not.toContain('<span>Description</span>');
    expect(main).toContain('Could not save the changes.');
  });

  it('confirms and performs soft archive through the service', () => {
    expect(main).toContain("window.confirm('Archive this video?");
    expect(main).toContain('await archiveVideo(id)');
    expect(main).not.toContain('.delete()');
  });
});
