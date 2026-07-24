import { describe, it, expect } from 'vitest';
import { loadModel } from './knowledge-base';
import { correct } from './corrector';

const model = loadModel('semantic-model.yaml');

describe('correct', () => {
  it('合法查询通过', () => {
    const r = correct({ metric: 'gmv', dimensions: ['category'], filters: [{ field: 'region', op: 'in', value: ['华东'] }] }, model);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('未知指标报错', () => {
    const r = correct({ metric: 'sales', dimensions: [], filters: [] }, model);
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('sales');
  });

  it('非法维度取值报错', () => {
    const r = correct({ metric: 'gmv', dimensions: [], filters: [{ field: 'region', op: '=', value: '华中' }] }, model);
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('华中');
  });

  it('非可加指标多维度拆分报错', () => {
    const r = correct({ metric: 'avg_order_value', dimensions: ['region', 'category'], filters: [] }, model);
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('不可加');
  });
});
