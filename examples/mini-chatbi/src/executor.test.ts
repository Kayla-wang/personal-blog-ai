import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { seed } from '../seed';
import { Executor } from './executor';

const DB = 'test-exec.db';
let exec: Executor;

beforeAll(() => { seed(DB); exec = new Executor(DB); });
afterAll(() => { exec.close(); });

describe('Executor', () => {
  it('执行聚合 SQL 返回行', () => {
    const rows = exec.run("SELECT category, SUM(amount) AS gmv FROM orders GROUP BY category");
    expect(rows.length).toBe(4);
    expect(rows[0]).toHaveProperty('gmv');
  });

  it('华东订单数多于华南(seed 保证)', () => {
    const [r] = exec.run(
      "SELECT (SELECT COUNT(*) FROM orders WHERE region='华东') - (SELECT COUNT(*) FROM orders WHERE region='华南') AS diff"
    );
    expect(Number(r.diff)).toBeGreaterThan(0);
  });
});
