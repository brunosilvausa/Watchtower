import { describe, expect, it } from 'vitest';
import { hasPermission } from './product.js';
describe('workspace permissions', () => {
  it('viewerCannotMutate', () => { expect(hasPermission('viewer', 'read')).toBe(true); expect(hasPermission('viewer', 'monitor:write')).toBe(false); });
  it('reserves financial and deletion authority for owner', () => { expect(hasPermission('admin', 'billing:write')).toBe(false); expect(hasPermission('admin', 'workspace:delete')).toBe(false); expect(hasPermission('owner', 'billing:write')).toBe(true); });
  it('allows editor monitoring but not membership administration', () => { expect(hasPermission('editor', 'monitor:write')).toBe(true); expect(hasPermission('editor', 'workspace:admin')).toBe(false); });
});
