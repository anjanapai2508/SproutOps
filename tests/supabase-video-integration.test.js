import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
const app=fs.readFileSync('app/src/App.tsx','utf8');const hook=fs.readFileSync('app/src/hooks/useVideos.ts','utf8');const workflow=fs.readFileSync('app/src/constants/video-workflow.ts','utf8');const config=fs.readFileSync('vite.config.ts','utf8');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
describe('Supabase React integration',()=>{
  it('loads videos through the service without mock data',()=>{expect(hook).toContain('getVideos');expect(hook).not.toContain('initialVideos');});
  it('keeps loading, retry, and empty states',()=>{expect(app).toContain('Could not load videos. Please try again.');expect(app).toContain('videos.load()');expect(app).toContain('No videos available');});
  it('centralizes workflow labels',()=>{expect(workflow).toContain("key:'review_edit'");expect(workflow).toContain("key:'prepare_metadata'");expect(workflow).toContain("['no_action_required','No Action Required']");});
  it('keeps the Vite app root and environment directory',()=>{expect(pkg.scripts.dev).toBe('vite --config vite.config.ts');expect(pkg.scripts.build).toContain('vite build --config vite.config.ts');expect(config).toContain("root: 'app'");expect(config).toContain("envDir: '.'");});
  it('protects the dashboard with the auth hook and development bypass',()=>{expect(app).toContain('useAuth()');expect(fs.readFileSync('app/src/hooks/useAuth.ts','utf8')).toContain("VITE_APP_MODE==='development'");});
});
