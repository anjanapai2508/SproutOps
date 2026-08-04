import { describe, expect, it, vi } from 'vitest';
import { createProjectsService } from '../app/src/services/projects.ts';

function membershipQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(result))
  };
  return query;
}

describe('projects service', () => {
  it('loads only active projects for the signed-in profile', async () => {
    const project = { id: 'project-1', name: 'Peppy Bubs', description: null, is_active: true };
    const query = membershipQuery({ data: [{ project }], error: null });
    const client = { from: vi.fn(() => query) };

    await expect(createProjectsService(client).getProjects('user-1')).resolves.toEqual([project]);

    expect(client.from).toHaveBeenCalledWith('project_members');
    expect(query.select).toHaveBeenCalledWith('project:projects!inner(id, name, description, is_active)');
    expect(query.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('projects.is_active', true);
    expect(query.order).toHaveBeenCalledWith('name', { referencedTable: 'projects', ascending: true });
  });

  it('rejects membership query errors', async () => {
    const error = new Error('RLS denied');
    const query = membershipQuery({ data: null, error });
    const client = { from: vi.fn(() => query) };

    await expect(createProjectsService(client).getProjects('user-1')).rejects.toBe(error);
  });
});
