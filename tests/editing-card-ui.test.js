import { describe,expect,it } from 'vitest';
import fs from 'node:fs';

const editing=fs.readFileSync('app/src/components/EditingDetails.tsx','utf8');
const section=fs.existsSync('app/src/components/EditingSection.tsx')?fs.readFileSync('app/src/components/EditingSection.tsx','utf8'):'';
const card=fs.readFileSync('app/src/components/VideoCard.tsx','utf8');

describe('expanded Editing card',()=>{
  it('uses only the three selectable editing statuses',()=>{
    expect(editing).toContain("['Editing','In-Review','Complete']");
    expect(editing).not.toContain('Object.entries(EDIT_STATUS_LABELS)');
  });

  it('shows Draft and offers Start Editing when no version is active',()=>{
    expect(editing).toContain('Draft');
    expect(editing).toContain('Start Editing');
    expect(editing).toContain('startEditing(video,user.id)');
  });

  it('opens comment entry on demand and limits the initial history',()=>{
    expect(editing).toContain('Create new comment');
    expect(editing).toContain('slice(-3)');
    expect(editing).toContain('Show previous');
  });

  it('omits editor assignment and creator metadata',()=>{
    expect(editing).not.toContain('Assigned to');
    expect(editing).not.toContain('Created by');
  });

  it('replaces editing checklist rows without changing other workflow sections',()=>{
    expect(section).toContain('EditingDetails');
    expect(card).toContain('<EditingSection');
    expect(card).not.toContain('stage="editing"');
    expect(card).toContain('stage="pre_production"');
    expect(card).toContain('stage="production"');
    expect(card).toContain('stage="publishing"');
  });
});
