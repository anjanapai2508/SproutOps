import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

describe('React TypeScript Tailwind toolchain', () => {
  it('uses the React TypeScript entry and strict build checks', () => {
    expect(pkg.dependencies.react).toBeTruthy();
    expect(pkg.dependencies['react-dom']).toBeTruthy();
    expect(pkg.devDependencies.typescript).toBeTruthy();
    expect(pkg.devDependencies.tailwindcss).toBeTruthy();
    expect(pkg.devDependencies['@tailwindcss/vite']).toBeTruthy();
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeTruthy();
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.build).toContain('npm run typecheck');
    expect(fs.existsSync('vite.config.ts')).toBe(true);
    expect(fs.existsSync('app/src/main.tsx')).toBe(true);
  });
});
