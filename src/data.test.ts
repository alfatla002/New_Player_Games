import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getSession: vi.fn(), signInAnonymously: vi.fn(), from: vi.fn(), order: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: mock, from: mock.from }) }));
beforeEach(() => {
 vi.resetModules();
 vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
 vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
 mock.getSession.mockResolvedValue({ data: { session: null }, error: null });
 mock.signInAnonymously.mockResolvedValue({ data: { user: { id: 'guest-a' } }, error: null });
 mock.order.mockResolvedValue({ data: [], error: null });
 mock.from.mockReturnValue({ select: () => ({ order: mock.order }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('guest session lifecycle', () => {
 it('shares concurrent initialization to avoid duplicate anonymous accounts', async () => {
  const {loadBoard} = await import('./data');
  const [a,b] = await Promise.all([loadBoard(),loadBoard()]);
  expect(a.userId).toBe('guest-a'); expect(b).toEqual(a);
  expect(mock.signInAnonymously).toHaveBeenCalledTimes(1);
 });
 it('reuses an existing guest session', async () => {
  mock.getSession.mockResolvedValue({data:{session:{user:{id:'existing-guest'}}},error:null});
  const {loadBoard} = await import('./data');
  expect((await loadBoard()).userId).toBe('existing-guest');
  expect(mock.signInAnonymously).not.toHaveBeenCalled();
 });
 it('surfaces auth errors and allows an explicit retry', async () => {
  mock.signInAnonymously.mockResolvedValueOnce({data:{user:null},error:new Error('Anonymous sign-in disabled')});
  const {loadBoard} = await import('./data');
  await expect(loadBoard()).rejects.toThrow('Anonymous sign-in disabled');
  await expect(loadBoard()).resolves.toMatchObject({userId:'guest-a'});
 });
 it('surfaces database errors instead of falling back to local demo data', async () => {
  mock.order.mockResolvedValue({data:null,error:new Error('Database unavailable')});
  const {loadBoard} = await import('./data');
  await expect(loadBoard()).rejects.toThrow('Database unavailable');
 });
});
