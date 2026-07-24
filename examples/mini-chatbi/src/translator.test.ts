import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadModel } from './knowledge-base';
import { translate } from './translator';
import { seed } from '../seed';
import { Executor } from './executor';

const model = loadModel('semantic-model.yaml');
const DB = 'test-translate.db';
let exec: Executor;
beforeAll(() => { seed(DB); exec = new Executor(DB); });
afterAll(() => exec.close());

describe('translate', () => {
  it('gmv by category 翻译并执行,家居最高', () => {
    const sql = translate(
      { metric: 'gmv', dimensions: ['category'], filters: [], order: { by: 'gmv', dir: 'desc' }, limit: 1 },
      model
    );
    const rows = exec.run(sql);
    expect(rows.length).toBe(1);
    expect(rows[0].category).toBe('家居');
  });

  it('比率指标翻译成除法', () => {
    const sql = translate({ metric: 'avg_order_value', dimensions: [], filters: [] }, model);
    expect(sql).toContain('SUM(amount)');
    expect(sql).toContain('/');
  });

  it('in 过滤生成 IN 子句', () => {
    const sql = translate(
      { metric: 'gmv', dimensions: [], filters: [{ field: 'region', op: 'in', value: ['华东', '华南'] }] },
      model
    );
    expect(sql).toContain("region IN ('华东', '华南')");
  });
});
