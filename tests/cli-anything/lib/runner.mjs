/**
 * runner.mjs — Shared CLI-Anything test runner for Ryde API
 *
 * Usage:
 *   import { createRunner } from './lib/runner.mjs';
 *   const { test, assert, summary } = createRunner('My API Tests');
 *
 *   await test('Health check', async () => {
 *       const res = await fetch('...');
 *       assert(res.ok, 'Expected 200');
 *   });
 *
 *   summary();
 */

import { writeFileSync } from 'fs';

export function createRunner(suiteName, opts = {}) {
    const results = [];
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const filterIdx = args.indexOf('--filter');
    const filterPattern = filterIdx >= 0 ? new RegExp(args[filterIdx + 1], 'i') : null;

    const slug = suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const jsonPath = opts.jsonOutputPath || `C:/tmp/test-${slug}-results.json`;

    console.log(`\n  ${suiteName}\n`);

    async function test(name, fn) {
        if (filterPattern && !filterPattern.test(name)) {
            results.push({ name, status: 'skipped', ms: 0 });
            return;
        }
        const start = Date.now();
        try {
            await fn();
            const ms = Date.now() - start;
            results.push({ name, status: 'passed', ms });
            if (!jsonOutput) console.log(`  [PASS] ${name} (${ms}ms)`);
        } catch (err) {
            const ms = Date.now() - start;
            results.push({ name, status: 'failed', ms, error: err.message });
            if (!jsonOutput) console.error(`  [FAIL] ${name} (${ms}ms)\n    ${err.message}`);
        }
    }

    function assert(condition, msg) {
        if (!condition) throw new Error(msg);
    }

    function summary() {
        console.log('\n' + '-'.repeat(65));
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        console.log(`  ${passed} passed, ${failed} failed, ${skipped} skipped  (${results.length} total)`);

        if (failed > 0) {
            console.log('\n  Failed tests:');
            results.filter(r => r.status === 'failed').forEach(r => {
                console.error(`    [FAIL] ${r.name}\n      ${r.error}`);
            });
        }

        if (jsonOutput) {
            writeFileSync(jsonPath, JSON.stringify({
                suite: suiteName,
                results,
                summary: { passed, failed, skipped, total: results.length },
                timestamp: new Date().toISOString(),
            }, null, 2));
            console.log(`\n  Results written to ${jsonPath}`);
        }

        process.exit(failed > 0 ? 1 : 0);
    }

    return { test, assert, summary, results };
}
