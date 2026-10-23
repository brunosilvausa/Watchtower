import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const stepOutcomes = new Set(['success', 'failure', 'cancelled', 'skipped']);
const testOutcomes = new Set(['expected', 'unexpected', 'flaky', 'skipped']);
const attemptOutcomes = new Set(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']);
export function summarize(checks, reports) {
  const tests = [];
  function visit(suite, directory) {
    for (const spec of suite.specs ?? []) {
      let file = spec.file?.replaceAll('\\', '/');
      if (/^[a-z0-9-]+\.spec\.ts$/.test(file) && ['browser', 'design-system'].includes(directory)) file = `tests/${directory}/${file}`;
      if (!/^tests\/(browser|design-system)\/[a-z0-9-]+\.spec\.ts$/.test(file) || !Number.isInteger(spec.line)) continue;
      for (const test of spec.tests ?? []) {
        if (!['desktop', 'tablet', 'mobile'].includes(test.projectName) || !testOutcomes.has(test.status)) continue;
        tests.push({ file, line: spec.line, project: test.projectName, outcome: test.status, attempts: (test.results ?? []).map(result => result.status).filter(status => attemptOutcomes.has(status)) });
      }
    }
    for (const child of suite.suites ?? []) visit(child, directory);
  }
  for (const report of reports) visit(report, report.config?.rootDir?.replaceAll('\\', '/').split('/').at(-1));
  return { checks: Object.fromEntries(Object.entries(checks).filter(([key, value]) => /^[a-z-]+$/.test(key) && stepOutcomes.has(value))), tests };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const reports = [];
  let unavailableReports = 0;
  for (const file of process.argv.slice(2)) {
    try { reports.push(JSON.parse(readFileSync(file, 'utf8'))); } catch { unavailableReports++; }
  }
  const result = { ...summarize(JSON.parse(process.env.CI_CHECKS ?? '{}'), reports), unavailableReports };
  mkdirSync('ci-reports', { recursive: true });
  writeFileSync('ci-reports/summary.json', JSON.stringify(result, null, 2) + '\n');
}
