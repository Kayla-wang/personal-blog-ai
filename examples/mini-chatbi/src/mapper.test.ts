import { describe, it, expect } from 'vitest';
import { loadModel, KnowledgeBase } from './knowledge-base';
import { mapQuery } from './mapper';

const kb = new KnowledgeBase(loadModel('semantic-model.yaml'));

describe('mapQuery', () => {
  it('识别指标、维度、维度值', () => {
    const r = mapQuery('华东区上月各品类的销售额', kb);
    expect(r.metrics).toContain('gmv');
    expect(r.dimensions).toContain('category');
    expect(r.values).toContainEqual({ dimension: 'region', value: '华东' });
  });

  it('无命中时返回空数组', () => {
    const r = mapQuery('今天天气怎么样', kb);
    expect(r.metrics).toEqual([]);
    expect(r.dimensions).toEqual([]);
    expect(r.values).toEqual([]);
  });
});
