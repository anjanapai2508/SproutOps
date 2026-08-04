import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getProjects } from '../services/projects';
import type { Project } from '../types/domain';

type ProjectContextValue={
  projects:Project[];
  activeProjectId:string|null;
  activeProject:Project|null;
  loading:boolean;
  error:string|null;
  setActiveProjectId:(projectId:string)=>void;
  refresh:()=>Promise<void>;
};

const ProjectContext=createContext<ProjectContextValue|null>(null);
const storageKey=(userId:string)=>`sproutops:active-project:${userId}`;

function readSavedProject(userId:string):string|null {
  if(typeof localStorage==='undefined'||typeof localStorage.getItem!=='function')return null;
  try{return localStorage.getItem(storageKey(userId));}catch{return null;}
}

function saveProject(userId:string,projectId:string):void {
  if(typeof localStorage==='undefined'||typeof localStorage.setItem!=='function')return;
  try{localStorage.setItem(storageKey(userId),projectId);}catch{}
}

export function ProjectProvider({userId,children}:{userId:string;children:ReactNode}) {
  const [projects,setProjects]=useState<Project[]>([]);
  const [activeProjectIdState,setActiveProjectIdState]=useState<string|null>(null);
  const [loading,setLoading]=useState(Boolean(userId));
  const [error,setError]=useState<string|null>(null);
  const requestId=useRef(0);

  const load=useCallback(async()=>{
    const request=++requestId.current;
    if(!userId){setProjects([]);setActiveProjectIdState(null);setLoading(false);setError(null);return;}
    setProjects([]);setActiveProjectIdState(null);setLoading(true);setError(null);
    try{
      const allowed=await getProjects(userId);
      if(request!==requestId.current)return;
      const saved=readSavedProject(userId);
      const nextId=allowed.some(({id})=>id===saved)?saved:allowed[0]?.id||null;
      setProjects(allowed);
      setActiveProjectIdState(nextId);
      if(nextId)saveProject(userId,nextId);
    }catch{
      if(request!==requestId.current)return;
      setProjects([]);
      setActiveProjectIdState(null);
      setError('Could not load your projects.');
    }finally{if(request===requestId.current)setLoading(false);}
  },[userId]);

  useEffect(()=>{void load();return()=>{requestId.current++;};},[load]);

  const setActiveProjectId=useCallback((projectId:string)=>{
    if(!projects.some(({id})=>id===projectId))return;
    setActiveProjectIdState(projectId);
    if(userId)saveProject(userId,projectId);
  },[projects,userId]);

  const value=useMemo<ProjectContextValue>(()=>({
    projects,
    activeProjectId:activeProjectIdState,
    activeProject:projects.find(({id})=>id===activeProjectIdState)||null,
    loading,
    error,
    setActiveProjectId,
    refresh:load
  }),[projects,activeProjectIdState,loading,error,setActiveProjectId,load]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject():ProjectContextValue {
  const value=useContext(ProjectContext);
  if(!value)throw new Error('useProject must be used within ProjectProvider');
  return value;
}
