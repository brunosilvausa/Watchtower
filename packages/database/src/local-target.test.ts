import { describe, expect, it } from 'vitest';
import { assertLocalTarget } from './local-target.js';
describe('local database safety boundary', () => {
  it('allows only the exact local database and role', () => {
    expect(() => assertLocalTarget('postgresql://watchtower_migrator:dev@127.0.0.1:55432/watchtower_dev', 'watchtower_migrator')).not.toThrow();
  });
  it.each([
    'postgresql://watchtower_migrator:secret@example.com:55432/watchtower_dev',
    'postgresql://watchtower_migrator:secret@127.0.0.1:55432/production',
    'postgresql://postgres:secret@127.0.0.1:55432/watchtower_dev',
    'postgresql://watchtower_migrator:secret@127.0.0.1:5432/watchtower_dev',
    'postgresql://watchtower_migrator:secret@127.0.0.1:55432/watchtower_dev?host=remote',
    'invalid-secret',
  ])('refuses unsafe target without exposing credentials', (url) => {
    expect(() => assertLocalTarget(url, 'watchtower_migrator')).toThrow('Expected local Watchtower database');
  });
});
