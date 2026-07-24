import { describe, it, expect } from 'vitest';
import { loadModel, KnowledgeBase } from './knowledge-base';

const kb = new KnowledgeBase(loadModel('semantic-model.yaml'));

describe('KnowledgeBase.resolveTerm', () => {
  it('同义词解析到指标', () => {
    expect(kb.resolveTerm('销售额')).toEqual({ kind: 'metric', name: 'gmv' });
  });
  it('直接名解析到维度', () => {
    expect(kb.resolveTerm('category')).toEqual({ kind: 'dimension', name: 'category' });
  });
  it('维度取值解析', () => {
    expect(kb.resolveTerm('长三角')).toEqual({ kind: 'value', name: '华东', dimension: 'region' });
  });
  it('未知词返回 null', () => {
    expect(kb.resolveTerm('不存在的词')).toBeNull();
  });
});
