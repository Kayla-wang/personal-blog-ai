import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { SemanticModel } from './types';

export function loadModel(path: string): SemanticModel {
  return parse(readFileSync(path, 'utf-8')) as SemanticModel;
}

type Resolved = { kind: 'metric' | 'dimension' | 'value'; name: string; dimension?: string };

export class KnowledgeBase {
  private syn = new Map<string, string>(); // 同义词 → 规范名
  constructor(private _model: SemanticModel) {
    for (const [canonical, aliases] of Object.entries(_model.synonyms ?? {})) {
      for (const a of aliases) this.syn.set(a, canonical);
    }
  }
  get model(): SemanticModel { return this._model; }

  resolveTerm(term: string): Resolved | null {
    const canonical = this.syn.get(term) ?? term;
    if (this._model.measures[canonical]) return { kind: 'metric', name: canonical };
    if (this._model.dimensions[canonical]) return { kind: 'dimension', name: canonical };
    for (const [dim, def] of Object.entries(this._model.dimensions)) {
      if (def.values?.includes(canonical)) return { kind: 'value', name: canonical, dimension: dim };
    }
    return null;
  }
}
