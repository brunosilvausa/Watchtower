import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from './ci-report.mjs';

test('failure artifacts retain locations and outcomes without runtime payloads', () => {
  const secret = 'test-only-sensitive-marker';
  const raw = { config: { rootDir: `/tmp/${secret}/tests/browser`, token: secret }, suites: [{ suites: [{ specs: [{ file: 'product-auth.spec.ts', line: 8, title: secret, tests: [{ projectName: 'desktop', status: 'unexpected', results: [{ status: 'failed', error: { message: secret }, attachments: [{ body: secret }] }] }] }] }] }] };
  const report = summarize({ install: 'success', product: 'failure', arbitrary: secret }, [raw]);
  assert.deepEqual(report.checks, { install: 'success', product: 'failure' });
  assert.deepEqual(report.tests, [{ file: 'tests/browser/product-auth.spec.ts', line: 8, project: 'desktop', outcome: 'unexpected', attempts: ['failed'] }]);
  assert.equal(JSON.stringify(report).includes(secret), false);
});

test('missing reports do not hide failed steps and unsafe locations are omitted', () => {
  assert.deepEqual(summarize({ check: 'failure' }, []).checks, { check: 'failure' });
  const raw = { suites: [{ specs: [{ file: '/tmp/private/token', line: 1, tests: [{ projectName: 'desktop', status: 'unexpected' }] }] }] };
  assert.deepEqual(summarize({}, [raw]).tests, []);
});
