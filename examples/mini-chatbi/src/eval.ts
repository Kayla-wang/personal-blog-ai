import { readFileSync } from 'node:fs';
import type { PipelineResult } from './pipeline';

export interface Golden {
  question: string;
  metric: string;
  check?: { field: string; value: string };
}

export function loadGolden(path: string): Golden[] {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Golden);
}

export function scoreOne(result: PipelineResult, g: Golden): { pass: boolean; reason: string } {
  if (result.query.metric !== g.metric) {
    return { pass: false, reason: `指标应为 ${g.metric},实际 ${result.query.metric}` };
  }
  if (g.check) {
    const actual = String(result.rows[0]?.[g.check.field]);
    if (actual !== g.check.value) {
      return { pass: false, reason: `${g.check.field} 应为 ${g.check.value},实际 ${actual}` };
    }
  }
  return { pass: true, reason: 'ok' };
}
