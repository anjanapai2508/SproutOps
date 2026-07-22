import { describe, expect, it, vi } from 'vitest';
import { createEditingService } from '../app/src/services/editing.ts';

function queryResult(result={data:null,error:null}) {
  const query={
    select:vi.fn(()=>query),eq:vi.fn(()=>query),in:vi.fn(()=>query),order:vi.fn(()=>query),
    limit:vi.fn(()=>query),insert:vi.fn(()=>query),update:vi.fn(()=>query),
    single:vi.fn(()=>Promise.resolve(result)),maybeSingle:vi.fn(()=>Promise.resolve(result)),
    then(resolve,reject){return Promise.resolve(result).then(resolve,reject);}
  };
  return query;
}

describe('editing service',()=>{
  it('creates the next editing version and links it to the video',async()=>{
    const latestQuery=queryResult({data:{version_number:2},error:null});
    const created={id:'e3',video_id:'v1',version_number:3,status:'Editing'};
    const insertQuery=queryResult({data:created,error:null});
    const savedVideo={id:'v1',next_action_version_id:'e3'};
    const videoQuery=queryResult({data:savedVideo,error:null});
    let editCalls=0;
    const client={from:vi.fn((table)=>table==='videos'?videoQuery:++editCalls===1?latestQuery:insertQuery)};
    await expect(createEditingService(client).startEditing({id:'v1'},'u1')).resolves.toEqual({video:savedVideo,activeVersion:created});
    expect(insertQuery.insert).toHaveBeenCalledWith({video_id:'v1',version_number:3,status:'Editing',created_by:'u1',assigned_editor:'u1'});
    expect(videoQuery.update).toHaveBeenCalledWith({next_action_version_id:'e3'});
  });

  it('rejects unsupported edit status without querying',async()=>{
    const client={from:vi.fn()};
    await expect(createEditingService(client).updateEditingStatus({id:'v1'}, {id:'e1'}, 'Done', 'u1'))
      .rejects.toThrow('Unsupported edit status');
    expect(client.from).not.toHaveBeenCalled();
  });

  it('rejects empty comments without querying',async()=>{
    const client={from:vi.fn()};
    await expect(createEditingService(client).addEditComment('e1',{id:'u1'},{display_name:'Roshan'},'   '))
      .rejects.toThrow('Comment cannot be empty');
    expect(client.from).not.toHaveBeenCalled();
  });

  it('inserts trimmed comments with historical author snapshots',async()=>{
    const saved={id:'c1',message:'Looks good'};
    const query=queryResult({data:saved,error:null});
    const client={from:vi.fn(()=>query)};
    await expect(createEditingService(client).addEditComment('e1',{id:'u1'},{display_name:'Roshan'},' Looks good '))
      .resolves.toEqual(saved);
    expect(query.insert).toHaveBeenCalledWith({version_id:'e1',author_id:'u1',author_name_snapshot:'Roshan',author_role_snapshot:'Team Member',message:'Looks good'});
  });

  it('orders active-version comments chronologically',async()=>{
    const version={id:'e1',video_id:'v1',version_number:1,status:'Editing',created_by:'u1',assigned_editor:'u1'};
    const versionQuery=queryResult({data:[version],error:null});
    const commentsQuery=queryResult({data:[],error:null});
    const profilesQuery=queryResult({data:[{id:'u1',display_name:'Roshan'}],error:null});
    const client={from:vi.fn((table)=>table==='edit_versions'?versionQuery:table==='edit_comments'?commentsQuery:profilesQuery)};
    const details=await createEditingService(client).getEditingDetails({id:'v1',next_action_version_id:'e1'});
    expect(details.activeVersion).toEqual(version);
    expect(commentsQuery.order).toHaveBeenCalledWith('created_at',{ascending:true});
    expect(details.profilesById.u1.display_name).toBe('Roshan');
  });

  it('changes edit status without overriding checklist-derived video fields',async()=>{
    const version={id:'e1',status:'In-Review'};
    const query=queryResult({data:version,error:null});
    const client={from:vi.fn(()=>query)};
    const video={id:'v1',current_stage:'pre_production',next_action:'write_script'};
    await expect(createEditingService(client).updateEditingStatus(video,{id:'e1'},'In-Review','u1'))
      .resolves.toEqual({video,activeVersion:version});
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledWith('edit_versions');
  });

  it('updates both the edit version and video workflow when status becomes Complete',async()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-22T19:00:00.000Z'));
    const version={id:'e1',status:'Complete'};
    const versionQuery=queryResult({data:version,error:null});
    const savedVideo={id:'v1',current_stage:'publishing',next_action:'create_thumbnail'};
    const videoQuery=queryResult({data:savedVideo,error:null});
    const client={from:vi.fn((table)=>table==='edit_versions'?versionQuery:videoQuery)};
    const video={id:'v1',completed_actions:['write_script']};

    await expect(createEditingService(client).updateEditingStatus(video,{id:'e1',status:'Editing',reviewed_at:null},'Complete','u1'))
      .resolves.toEqual({video:savedVideo,activeVersion:version});

    expect(versionQuery.update).toHaveBeenCalledWith({
      status:'Complete',reviewed_by:'u1',reviewed_at:'2026-07-22T19:00:00.000Z'
    });
    expect(videoQuery.update).toHaveBeenCalledWith({
      completed_actions:['write_script','review_script','shoot_video','record_voice','start_editing','continue_editing','submit_for_review','review_edit','make_edit_changes','approve_edit'],
      current_stage:'publishing',next_action:'create_thumbnail',published_at:null
    });
    expect(videoQuery.eq).toHaveBeenCalledWith('id','v1');
    vi.useRealTimers();
  });

  it('turns plain Supabase errors into displayable errors',async()=>{
    const query=queryResult({data:null,error:{code:'42501',message:'new row violates row-level security policy'}});
    const client={from:vi.fn(()=>query)};

    await expect(createEditingService(client).updateEditingStatus({id:'v1'},{id:'e1'},'Editing'))
      .rejects.toThrow('new row violates row-level security policy (42501)');
  });
});
