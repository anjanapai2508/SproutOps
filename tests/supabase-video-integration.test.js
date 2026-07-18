import { describe, expect, it } from 'vitest';
import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const main = fs.existsSync('app/src/main.js') ? fs.readFileSync('app/src/main.js', 'utf8') : '';
const labels = fs.existsSync('app/src/constants/video-labels.js')
  ? fs.readFileSync('app/src/constants/video-labels.js', 'utf8')
  : '';
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const viteConfig = fs.existsSync('vite.config.js') ? fs.readFileSync('vite.config.js', 'utf8') : '';
const authService = fs.existsSync('app/src/services/auth.js')
  ? fs.readFileSync('app/src/services/auth.js', 'utf8')
  : '';

describe('Supabase videos-only integration', () => {
  it('loads through the videos service without mock video data', () => {
    expect(main).toContain("from './services/videos.js'");
    expect(main).toContain('await getVideos()');
    expect(main).not.toContain('const initialVideos');
    expect(main).not.toContain('createVideoWorkflow');
  });

  it('renders loading, error with retry, and actionable empty states', () => {
    expect(main).toContain('Loading videos');
    expect(main).toContain('Could not load videos. Please try again.');
    expect(main).toContain('data-action="retry-videos"');
    expect(main).toContain('No videos available');
    expect(main).toContain('Videos will appear here once they are added.');
  });

  it('renders database-backed workflow subcategory cards without mock progress', () => {
    expect(main).toContain('renderTaskSection');
    expect(main).toContain('renderEditingSection');
    expect(main).toContain('PRE-PRODUCTION');
    expect(main).toContain('PRODUCTION');
    expect(main).toContain('EDITING');
    expect(main).toContain('PUBLISHING');
    expect(main).not.toContain('progress.percentage');
  });

  it('restores the original light-blue New Video treatment', () => {
    expect(html).toContain('--new-video-background:#EAF5FC');
    expect(html).toContain('--new-video-text:#1D70A2');
    expect(html).toContain('.new-video-btn { background:var(--new-video-background);');
  });

  it('centralizes readable next-action labels', () => {
    expect(labels).toContain("review_edit: 'Review the latest edit'");
    expect(labels).toContain("prepare_metadata: 'Prepare description and tags'");
    expect(labels).toContain("no_action_required: 'No action required'");
  });

  it('uses Vite positional roots for development and production builds', () => {
    expect(packageJson.scripts.dev).toBe('vite --config vite.config.js');
    expect(packageJson.scripts.build).toBe('vite build --config vite.config.js');
    expect(packageJson.scripts.preview).toBe('vite preview --config vite.config.js');
    expect(viteConfig).toContain("root: 'app'");
    expect(viteConfig).toContain("envDir: '.'");
  });

  it('keeps write controls visible but guards them behind authentication', () => {
    expect(main).toContain("from './services/auth.js'");
    expect(main).toContain('await requireAuthenticated()');
    expect(main).toContain('Sign in is required to manage videos.');
    expect(authService).toContain('client.auth.getSession()');
  });

  it('starts loading without requiring unsupported top-level await', () => {
    expect(main).toContain('\nloadVideos();');
    expect(main).not.toContain('\nawait loadVideos();');
  });
});
