import { getSupabase } from '../lib/supabase';
import type { Project } from '../types/domain';

type Client=ReturnType<typeof getSupabase>;
type MembershipRow={project:Project};

export function createProjectsService(client:Client) {
  return {
    async getProjects(profileId:string):Promise<Project[]> {
      const {data,error}=await client.from('project_members')
        .select('project:projects!inner(id, name, description, is_active)')
        .eq('profile_id',profileId)
        .eq('projects.is_active',true)
        .order('name',{referencedTable:'projects',ascending:true});
      if(error)throw error;
      return ((data||[]) as unknown as MembershipRow[]).map(({project})=>project);
    }
  };
}

export const getProjects=(profileId:string)=>createProjectsService(getSupabase()).getProjects(profileId);
