# Mini-SuperSonic (简化版 Chat BI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Node.js + TypeScript 复刻 SuperSonic 的核心链路(NL → 语义查询 → SQL → 执行),含一个 Corrector→Parser 自动纠错的智能体循环,并配套 5 篇系列实战文章。

**Architecture:** 语义模型(YAML)是地基,启动时构建 Knowledge Base。链路为:Schema Mapper(规则)→ Semantic Parser(LLM + zod)→ Semantic Corrector(规则校验)→ Semantic Translator(纯代码)→ Executor(SQLite)。唯一的自主循环在 Corrector 校验失败时把错误喂回 Parser 重试。

**Tech Stack:** TypeScript, better-sqlite3, Vercel AI SDK (`ai` + `@ai-sdk/openai`), zod, yaml, vitest, tsx。

## Global Constraints

- 代码全部位于 `examples/mini-chatbi/`,独立 `package.json`,不污染 Docusaurus 内容目录。
- 语言 TypeScript,ESM(`"type": "module"`),Node >= 20。
- LLM 走 OpenAI 兼容接口,配置来自 `examples/mini-chatbi/.env`(`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`),`.env` 不入库,提供 `.env.example`。
- 测试用 vitest;确定性组件必须可脱离 LLM 单测;涉及 LLM 的组件通过依赖注入 mock。
- 每个任务遵循 TDD:先写失败测试 → 跑红 → 最小实现 → 跑绿 → 提交。
- 文章位于 `projects/06-chat-bi/`,单篇 Markdown 控制在 300 行内;写超长文件用骨架 + Edit。
- 提交信息用中文,遵循 `type(scope): 描述` 格式。

---

## File Structure

- `examples/mini-chatbi/package.json` — 依赖与脚本(scaffold)
- `examples/mini-chatbi/tsconfig.json` — TS 配置
- `examples/mini-chatbi/vitest.config.ts` — 测试配置
- `examples/mini-chatbi/.env.example` — LLM 配置样例
- `examples/mini-chatbi/semantic-model.yaml` — 语义模型(项目灵魂)
- `examples/mini-chatbi/src/types.ts` — 语义模型类型 + SemanticQuery zod schema
- `examples/mini-chatbi/seed.ts` — 建库 + 塞假数据
- `examples/mini-chatbi/src/executor.ts` — 执行 SQL
- `examples/mini-chatbi/src/knowledge-base.ts` — 加载模型 + 术语/同义词字典
- `examples/mini-chatbi/src/mapper.ts` — NL → 映射结果
- `examples/mini-chatbi/src/translator.ts` — 语义查询 → SQL
- `examples/mini-chatbi/src/corrector.ts` — 校验语义查询
- `examples/mini-chatbi/src/llm.ts` — generateObject 封装(可注入)
- `examples/mini-chatbi/src/parser.ts` — NL + 映射 → 语义查询(LLM)
- `examples/mini-chatbi/src/pipeline.ts` — 编排全链路 + 分步打印 + 纠错循环
- `examples/mini-chatbi/src/cli.ts` — `ask` / `eval` 命令
- `examples/mini-chatbi/eval/golden.jsonl` — 黄金样本集
- `examples/mini-chatbi/.gitignore` — 隔离本地产物(node_modules/*.db/.env)
- `projects/06-chat-bi/_category_.json` + `01-overview.md` ~ `05-eval.md` — 系列文章

---

## Tasks

### Task 1: 脚手架 + 类型与 SemanticQuery schema

**Files:**
- Create: `examples/mini-chatbi/package.json`
- Create: `examples/mini-chatbi/tsconfig.json`
- Create: `examples/mini-chatbi/vitest.config.ts`
- Create: `examples/mini-chatbi/.env.example`
- Create: `examples/mini-chatbi/src/types.ts`
- Test: `examples/mini-chatbi/src/types.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `SemanticQuery` 类型与 `SemanticQuerySchema`(zod)
  - `SemanticModel`、`Measure`、`Dimension`、`Entity` 类型
  - `Filter` 类型与 `FilterSchema`

- [ ] **Step 1: 建 package.json**

```json
{
  "name": "mini-chatbi",
  "private": true,
  "type": "module",
  "scripts": {
    "seed": "tsx seed.ts",
    "ask": "tsx src/cli.ts ask",
    "eval": "tsx src/cli.ts eval",
    "test": "vitest run"
  },
  "dependencies": {
    "ai": "^4.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "better-sqlite3": "^11.0.0",
    "yaml": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: 建 tsconfig.json 与 vitest.config.ts**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

`.env.example`:
```
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=sk-xxx
AI_MODEL=qwen-plus
```

- [ ] **Step 3: 装依赖**

Run: `cd examples/mini-chatbi && npm install`
Expected: 安装成功,生成 `node_modules` 与 `package-lock.json`。

- [ ] **Step 4: 写失败测试 `src/types.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { SemanticQuerySchema } from './types';

describe('SemanticQuerySchema', () => {
  it('接受合法的语义查询', () => {
    const q = {
      metric: 'gmv',
      dimensions: ['category'],
      filters: [{ field: 'region', op: 'in', value: ['华东'] }],
      order: { by: 'gmv', dir: 'desc' },
      limit: 1,
    };
    expect(SemanticQuerySchema.parse(q)).toEqual(q);
  });

  it('缺少 metric 时报错', () => {
    expect(() => SemanticQuerySchema.parse({ dimensions: [], filters: [] })).toThrow();
  });

  it('order.dir 非法时报错', () => {
    expect(() =>
      SemanticQuerySchema.parse({ metric: 'gmv', dimensions: [], filters: [], order: { by: 'gmv', dir: 'up' } })
    ).toThrow();
  });
});
```

- [ ] **Step 5: 跑测试确认失败**

Run: `npm test`
Expected: FAIL,`Cannot find module './types'`。

- [ ] **Step 6: 实现 `src/types.ts`**

```ts
import { z } from 'zod';

export interface Entity { table: string; primary_key: string; }
export interface Dimension { expr: string; values?: string[]; type?: 'time'; }
export interface Measure {
  expr?: string;
  additivity?: 'full' | 'semi' | 'none';
  type?: 'ratio';
  numerator?: string;
  denominator?: string;
}
export interface SemanticModel {
  entities: Record<string, Entity>;
  dimensions: Record<string, Dimension>;
  measures: Record<string, Measure>;
  synonyms: Record<string, string[]>;
}

export const FilterSchema = z.object({
  field: z.string(),
  op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});
export type Filter = z.infer<typeof FilterSchema>;

export const SemanticQuerySchema = z.object({
  metric: z.string(),
  dimensions: z.array(z.string()),
  filters: z.array(FilterSchema),
  order: z.object({ by: z.string(), dir: z.enum(['asc', 'desc']) }).optional(),
  limit: z.number().int().positive().optional(),
});
export type SemanticQuery = z.infer<typeof SemanticQuerySchema>;
```

- [ ] **Step 7: 跑测试确认通过**

Run: `npm test`
Expected: PASS(3 个用例)。

- [ ] **Step 8: 提交**

```bash
git add examples/mini-chatbi/package.json examples/mini-chatbi/tsconfig.json examples/mini-chatbi/vitest.config.ts examples/mini-chatbi/.env.example examples/mini-chatbi/src/types.ts examples/mini-chatbi/src/types.test.ts examples/mini-chatbi/package-lock.json
git commit -m "feat(mini-chatbi): 脚手架与 SemanticQuery 类型 schema"
```

### Task 2: 数据库 seed 与 Executor

**Files:**
- Create: `examples/mini-chatbi/seed.ts`
- Create: `examples/mini-chatbi/src/executor.ts`
- Test: `examples/mini-chatbi/src/executor.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `createDb(path: string): void` —— 建表并塞数据(seed.ts 导出 `seed(dbPath)`)
  - `class Executor { constructor(dbPath: string); run(sql: string): Record<string, unknown>[]; close(): void }`

- [ ] **Step 1: 实现 `seed.ts`(建库脚本)**

单表 `orders` 即可演示三类可加性(可加 / 去重不可加 / 比率不可加),不引入跨表 join。确定性造数,保证评测可复现:同一 `user_id` 会在多个品类下单,让 `COUNT(DISTINCT user_id)` 的「去重不可加」现象真实出现。

```ts
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const REGIONS = ['华东', '华南', '华北', '西南'];
const CATEGORIES = ['数码', '服饰', '食品', '家居'];
const MONTHS = ['2026-05', '2026-06'];

export function seed(dbPath: string): void {
  const db = new Database(dbPath);
  db.exec(`
    DROP TABLE IF EXISTS orders;
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY, user_id INTEGER, region TEXT,
      category TEXT, amount REAL, month TEXT
    );
  `);
  const ins = db.prepare(
    'INSERT INTO orders (user_id, region, category, amount, month) VALUES (?,?,?,?,?)'
  );
  let orderId = 0;
  for (const month of MONTHS) {
    for (const region of REGIONS) {
      const rows = region === '华东' ? 5 : 3;
      for (const category of CATEGORIES) {
        for (let i = 0; i < rows; i++) {
          // user_id 只由 region+i 决定 → 同一用户跨多个品类下单 → distinct 计数跨品类相加会重复
          const uid = REGIONS.indexOf(region) * 100 + i + 1;
          const amount = (CATEGORIES.indexOf(category) + 1) * 1000 + i * 100;
          ins.run(uid, region, category, amount, month);
          orderId++;
        }
      }
    }
  }
  db.close();
}

// 跨平台入口判断(Windows 上 file:// 拼接会失配)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed('mini-chatbi.db');
  console.log('seeded mini-chatbi.db');
}
```

- [ ] **Step 2: 写失败测试 `src/executor.test.ts`**

```ts
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
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npm test executor`
Expected: FAIL,`Cannot find module './executor'`。

- [ ] **Step 4: 实现 `src/executor.ts`**

```ts
import Database from 'better-sqlite3';

export class Executor {
  private db: Database.Database;
  constructor(dbPath: string) { this.db = new Database(dbPath, { readonly: false }); }
  run(sql: string): Record<string, unknown>[] {
    return this.db.prepare(sql).all() as Record<string, unknown>[];
  }
  close(): void { this.db.close(); }
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test executor`
Expected: PASS(2 个用例)。

- [ ] **Step 6: 提交**

```bash
git add examples/mini-chatbi/seed.ts examples/mini-chatbi/src/executor.ts examples/mini-chatbi/src/executor.test.ts
git commit -m "feat(mini-chatbi): SQLite seed 脚本与 Executor"
```

### Task 3: Knowledge Base(语义模型加载 + 同义词字典)

**Files:**
- Create: `examples/mini-chatbi/semantic-model.yaml`
- Create: `examples/mini-chatbi/src/knowledge-base.ts`
- Test: `examples/mini-chatbi/src/knowledge-base.test.ts`

**Interfaces:**
- Consumes: `SemanticModel` (Task 1)
- Produces:
  - `loadModel(path: string): SemanticModel`
  - `class KnowledgeBase { constructor(model: SemanticModel); resolveTerm(term: string): { kind: 'metric' | 'dimension' | 'value'; name: string; dimension?: string } | null; get model(): SemanticModel }`

- [ ] **Step 1: 建 `semantic-model.yaml`**

```yaml
entities:
  order: { table: orders, primary_key: id }

dimensions:
  region:   { expr: region, values: [华东, 华南, 华北, 西南] }
  category: { expr: category }
  month:    { expr: month, type: time }

measures:
  gmv:          { expr: "SUM(amount)",             additivity: full }
  order_count:  { expr: "COUNT(id)",               additivity: full }
  active_users: { expr: "COUNT(DISTINCT user_id)", additivity: none }
  avg_order_value:
    type: ratio
    numerator: "SUM(amount)"
    denominator: "COUNT(id)"
    additivity: none

synonyms:
  华东: [华东区, 长三角]
  gmv: [销售额, 成交额, 卖得好]
  active_users: [活跃用户, 活跃用户数, 下单用户数]
  avg_order_value: [客单价, 平均订单金额]
```

全部指标基于单表 `orders`。`additivity` 三态:`full`(gmv/order_count 可跨维度相加)、`none`(active_users 是去重计数、avg_order_value 是比率,都不可简单相加)。

- [ ] **Step 2: 写失败测试 `src/knowledge-base.test.ts`**

```ts
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
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npm test knowledge-base`
Expected: FAIL,`Cannot find module './knowledge-base'`。

- [ ] **Step 4: 实现 `src/knowledge-base.ts`**

```ts
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
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test knowledge-base`
Expected: PASS(4 个用例)。

- [ ] **Step 6: 提交**

```bash
git add examples/mini-chatbi/semantic-model.yaml examples/mini-chatbi/src/knowledge-base.ts examples/mini-chatbi/src/knowledge-base.test.ts
git commit -m "feat(mini-chatbi): 语义模型与 Knowledge Base 同义词解析"
```

### Task 4: Schema Mapper(规则映射)

**Files:**
- Create: `examples/mini-chatbi/src/mapper.ts`
- Test: `examples/mini-chatbi/src/mapper.test.ts`

**Interfaces:**
- Consumes: `KnowledgeBase` (Task 3)
- Produces:
  - `interface MappingResult { metrics: string[]; dimensions: string[]; values: { dimension: string; value: string }[] }`
  - `function mapQuery(nl: string, kb: KnowledgeBase): MappingResult`

说明:Mapper 用规则(在 KB 里逐词试探)产出「命中了哪些指标/维度/维度值」的线索,后续注入 Parser 的 prompt 当上下文。分词用简单策略:对模型里所有已知词(指标名、维度名、同义词、维度取值)做子串匹配。

- [ ] **Step 1: 写失败测试 `src/mapper.test.ts`**

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test mapper`
Expected: FAIL,`Cannot find module './mapper'`。

- [ ] **Step 3: 实现 `src/mapper.ts`**

```ts
import type { KnowledgeBase } from './knowledge-base';

export interface MappingResult {
  metrics: string[];
  dimensions: string[];
  values: { dimension: string; value: string }[];
}

export function mapQuery(nl: string, kb: KnowledgeBase): MappingResult {
  const m = kb.model;
  const terms = new Set<string>();
  for (const name of Object.keys(m.measures)) terms.add(name);
  for (const name of Object.keys(m.dimensions)) terms.add(name);
  for (const aliases of Object.values(m.synonyms ?? {})) aliases.forEach((a) => terms.add(a));
  for (const def of Object.values(m.dimensions)) (def.values ?? []).forEach((v) => terms.add(v));

  const result: MappingResult = { metrics: [], dimensions: [], values: [] };
  for (const term of terms) {
    if (!nl.includes(term)) continue;
    const r = kb.resolveTerm(term);
    if (!r) continue;
    if (r.kind === 'metric' && !result.metrics.includes(r.name)) result.metrics.push(r.name);
    else if (r.kind === 'dimension' && !result.dimensions.includes(r.name)) result.dimensions.push(r.name);
    else if (r.kind === 'value' && r.dimension)
      result.values.push({ dimension: r.dimension, value: r.name });
  }
  return result;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test mapper`
Expected: PASS(2 个用例)。

- [ ] **Step 5: 提交**

```bash
git add examples/mini-chatbi/src/mapper.ts examples/mini-chatbi/src/mapper.test.ts
git commit -m "feat(mini-chatbi): 规则 Schema Mapper"
```

### Task 5: Semantic Translator(语义查询 → SQL)

**Files:**
- Create: `examples/mini-chatbi/src/translator.ts`
- Test: `examples/mini-chatbi/src/translator.test.ts`

**Interfaces:**
- Consumes: `SemanticQuery`, `SemanticModel`, `Filter` (Task 1);`Executor` (Task 2) 仅测试用
- Produces: `function translate(q: SemanticQuery, model: SemanticModel): string`

- [ ] **Step 1: 写失败测试 `src/translator.test.ts`**

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test translator`
Expected: FAIL,`Cannot find module './translator'`。

- [ ] **Step 3: 实现 `src/translator.ts`**

```ts
import type { SemanticQuery, SemanticModel, Filter } from './types';

function metricExpr(name: string, model: SemanticModel): string {
  const m = model.measures[name];
  if (!m) throw new Error(`unknown metric: ${name}`);
  if (m.type === 'ratio') return `(${m.numerator}) * 1.0 / (${m.denominator})`;
  return m.expr!;
}

function dimExpr(name: string, model: SemanticModel): string {
  return model.dimensions[name]?.expr ?? name;
}

function quote(v: string | number): string {
  return typeof v === 'number' ? String(v) : `'${v}'`;
}

function filterSql(f: Filter, model: SemanticModel): string {
  const col = dimExpr(f.field, model);
  if (f.op === 'in' && Array.isArray(f.value)) {
    return `${col} IN (${f.value.map(quote).join(', ')})`;
  }
  return `${col} ${f.op} ${quote(f.value as string | number)}`;
}

export function translate(q: SemanticQuery, model: SemanticModel): string {
  const table = Object.values(model.entities)[0].table;
  const dims = q.dimensions.map((d) => `${dimExpr(d, model)} AS ${d}`);
  const select = [...dims, `${metricExpr(q.metric, model)} AS ${q.metric}`].join(', ');
  let sql = `SELECT ${select} FROM ${table}`;
  if (q.filters.length) sql += ` WHERE ${q.filters.map((f) => filterSql(f, model)).join(' AND ')}`;
  if (q.dimensions.length) sql += ` GROUP BY ${q.dimensions.map((d) => dimExpr(d, model)).join(', ')}`;
  if (q.order) sql += ` ORDER BY ${q.order.by} ${q.order.dir.toUpperCase()}`;
  if (q.limit) sql += ` LIMIT ${q.limit}`;
  return sql;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test translator`
Expected: PASS(3 个用例)。

- [ ] **Step 5: 提交**

```bash
git add examples/mini-chatbi/src/translator.ts examples/mini-chatbi/src/translator.test.ts
git commit -m "feat(mini-chatbi): Semantic Translator 语义查询编译为 SQL"
```

### Task 6: Semantic Corrector(规则校验)

**Files:**
- Create: `examples/mini-chatbi/src/corrector.ts`
- Test: `examples/mini-chatbi/src/corrector.test.ts`

**Interfaces:**
- Consumes: `SemanticQuery`, `SemanticModel` (Task 1)
- Produces: `function correct(q: SemanticQuery, model: SemanticModel): { ok: boolean; errors: string[] }`

校验规则:①指标存在;②维度存在;③过滤字段是合法维度;④过滤取值在维度 `values` 白名单内(抓「华中」这类幻觉值);⑤非可加指标不支持多维度拆分(抓「去重/比率跨维度相加」的误解)。规则④⑤产生的错误正是纠错循环能修的信号。

- [ ] **Step 1: 写失败测试 `src/corrector.test.ts`**

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test corrector`
Expected: FAIL,`Cannot find module './corrector'`。

- [ ] **Step 3: 实现 `src/corrector.ts`**

```ts
import type { SemanticQuery, SemanticModel } from './types';

export function correct(q: SemanticQuery, model: SemanticModel): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const measure = model.measures[q.metric];
  if (!measure) {
    errors.push(`未知指标 "${q.metric}",可选:${Object.keys(model.measures).join('/')}`);
  }
  for (const d of q.dimensions) {
    if (!model.dimensions[d]) {
      errors.push(`未知维度 "${d}",可选:${Object.keys(model.dimensions).join('/')}`);
    }
  }
  for (const f of q.filters) {
    const dim = model.dimensions[f.field];
    if (!dim) { errors.push(`过滤字段 "${f.field}" 不是合法维度`); continue; }
    if (dim.values) {
      const vals = Array.isArray(f.value) ? f.value : [f.value];
      for (const v of vals) {
        if (!dim.values.includes(String(v))) {
          errors.push(`维度 "${f.field}" 不存在取值 "${v}",合法取值:${dim.values.join('/')}`);
        }
      }
    }
  }
  if (measure?.additivity === 'none' && q.dimensions.length > 1) {
    errors.push(`指标 "${q.metric}" 不可加,不支持按多个维度(${q.dimensions.join(',')})同时拆分`);
  }
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test corrector`
Expected: PASS(4 个用例)。

- [ ] **Step 5: 提交**

```bash
git add examples/mini-chatbi/src/corrector.ts examples/mini-chatbi/src/corrector.test.ts
git commit -m "feat(mini-chatbi): Semantic Corrector 规则校验"
```

### Task 7: LLM 封装 + Semantic Parser

**Files:**
- Create: `examples/mini-chatbi/src/llm.ts`
- Create: `examples/mini-chatbi/src/parser.ts`
- Test: `examples/mini-chatbi/src/parser.test.ts`

**Interfaces:**
- Consumes: `SemanticQuerySchema`/`SemanticQuery`/`SemanticModel` (Task 1),`MappingResult` (Task 4)
- Produces:
  - `interface LLMClient { generate<T>(prompt: string, schema: z.ZodType<T>): Promise<T> }`
  - `const defaultLLM: LLMClient`
  - `interface ParseOptions { llm?: LLMClient; previousQuery?: SemanticQuery; previousErrors?: string[] }`
  - `function buildPrompt(nl: string, mapping: MappingResult, model: SemanticModel, opts?: ParseOptions): string`
  - `function parse(nl: string, mapping: MappingResult, model: SemanticModel, opts?: ParseOptions): Promise<SemanticQuery>`

LLM 用依赖注入(`LLMClient`)以便脱离真实模型单测。`parse` 内部再跑一次 `SemanticQuerySchema.parse` 兜底。

- [ ] **Step 1: 实现 `src/llm.ts`**

```ts
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { z } from 'zod';

export interface LLMClient {
  generate<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
}

// 惰性创建 provider:调用时才读 env,确保 CLI 里 loadEnvFile 先执行
export const defaultLLM: LLMClient = {
  async generate(prompt, schema) {
    const provider = createOpenAI({
      baseURL: process.env.AI_BASE_URL,
      apiKey: process.env.AI_API_KEY,
    });
    const { object } = await generateObject({
      model: provider(process.env.AI_MODEL ?? 'qwen-plus'),
      schema,
      prompt,
    });
    return object;
  },
};
```

- [ ] **Step 2: 写失败测试 `src/parser.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { loadModel } from './knowledge-base';
import { parse, buildPrompt } from './parser';
import type { LLMClient } from './llm';

const model = loadModel('semantic-model.yaml');
const mapping = { metrics: ['gmv'], dimensions: ['category'], values: [{ dimension: 'region', value: '华东' }] };

describe('parser', () => {
  it('parse 用注入的 llm 返回校验后的语义查询', async () => {
    const fake: LLMClient = {
      async generate() { return { metric: 'gmv', dimensions: ['category'], filters: [] } as any; },
    };
    const q = await parse('华东各品类销售额', mapping, model, { llm: fake });
    expect(q.metric).toBe('gmv');
    expect(q.dimensions).toEqual(['category']);
  });

  it('buildPrompt 注入 mapper 线索', () => {
    const p = buildPrompt('华东各品类销售额', mapping, model);
    expect(p).toContain('gmv');
    expect(p).toContain('category');
  });

  it('buildPrompt 注入上次错误用于重试', () => {
    const p = buildPrompt('x', mapping, model, {
      previousErrors: ['未知指标 "sales"'],
      previousQuery: { metric: 'sales', dimensions: [], filters: [] },
    });
    expect(p).toContain('未知指标');
    expect(p).toContain('请修正');
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npm test parser`
Expected: FAIL,`Cannot find module './parser'`。

- [ ] **Step 4: 实现 `src/parser.ts`**

```ts
import { SemanticQuerySchema, type SemanticQuery, type SemanticModel } from './types';
import type { MappingResult } from './mapper';
import { defaultLLM, type LLMClient } from './llm';

export interface ParseOptions {
  llm?: LLMClient;
  previousQuery?: SemanticQuery;
  previousErrors?: string[];
}

export function buildPrompt(
  nl: string,
  mapping: MappingResult,
  model: SemanticModel,
  opts: ParseOptions = {}
): string {
  const metrics = Object.keys(model.measures).join(', ');
  const dimensions = Object.keys(model.dimensions).join(', ');
  const hint =
    `指标=${mapping.metrics.join('/') || '无'}, ` +
    `维度=${mapping.dimensions.join('/') || '无'}, ` +
    `维度取值=${mapping.values.map((v) => `${v.dimension}:${v.value}`).join('/') || '无'}`;
  let p = `你是数据分析助手。把用户问题转成语义查询 JSON,只能使用下列词表。
可用指标: ${metrics}
可用维度: ${dimensions}
Schema Mapper 命中线索: ${hint}
用户问题: "${nl}"`;
  if (opts.previousErrors?.length) {
    p += `\n\n上一次生成的查询有以下错误,请修正后重新生成:\n` +
      opts.previousErrors.map((e) => `- ${e}`).join('\n') +
      `\n上次查询: ${JSON.stringify(opts.previousQuery)}`;
  }
  return p;
}

export async function parse(
  nl: string,
  mapping: MappingResult,
  model: SemanticModel,
  opts: ParseOptions = {}
): Promise<SemanticQuery> {
  const llm = opts.llm ?? defaultLLM;
  const raw = await llm.generate(buildPrompt(nl, mapping, model, opts), SemanticQuerySchema);
  return SemanticQuerySchema.parse(raw);
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test parser`
Expected: PASS(3 个用例)。

- [ ] **Step 6: 提交**

```bash
git add examples/mini-chatbi/src/llm.ts examples/mini-chatbi/src/parser.ts examples/mini-chatbi/src/parser.test.ts
git commit -m "feat(mini-chatbi): LLM 封装与 Semantic Parser(zod 约束输出)"
```

### Task 8: Pipeline 编排 + 纠错循环(智能体循环)

**Files:**
- Create: `examples/mini-chatbi/src/pipeline.ts`
- Test: `examples/mini-chatbi/src/pipeline.test.ts`

**Interfaces:**
- Consumes: `KnowledgeBase` (T3), `mapQuery` (T4), `parse` (T7), `correct` (T6), `translate` (T5), `Executor` (T2), `LLMClient` (T7), `SemanticQuery` (T1)
- Produces:
  - `interface PipelineResult { query: SemanticQuery; sql: string; rows: Record<string, unknown>[]; attempts: number }`
  - `interface PipelineOptions { llm?: LLMClient; maxRetries?: number; log?: (msg: string) => void }`
  - `class Pipeline { constructor(kb: KnowledgeBase, exec: Executor); run(nl: string, opts?: PipelineOptions): Promise<PipelineResult> }`

核心:`run` 里 Parser→Corrector 是一个循环,校验失败就把错误喂回 Parser 重试,最多 `maxRetries`(默认 3)次;每步通过 `log` 打印,即「分步透明输出」。

- [ ] **Step 1: 写失败测试 `src/pipeline.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadModel, KnowledgeBase } from './knowledge-base';
import { seed } from '../seed';
import { Executor } from './executor';
import { Pipeline } from './pipeline';
import type { LLMClient } from './llm';

const DB = 'test-pipeline.db';
let kb: KnowledgeBase;
let exec: Executor;
beforeAll(() => { seed(DB); kb = new KnowledgeBase(loadModel('semantic-model.yaml')); exec = new Executor(DB); });
afterAll(() => exec.close());

describe('Pipeline', () => {
  it('校验失败后重试并最终成功', async () => {
    let call = 0;
    const fake: LLMClient = {
      async generate() {
        call++;
        return (call === 1
          ? { metric: 'sales', dimensions: [], filters: [] }
          : { metric: 'gmv', dimensions: ['category'], filters: [], order: { by: 'gmv', dir: 'desc' }, limit: 1 }) as any;
      },
    };
    const r = await new Pipeline(kb, exec).run('各品类销售额最高', { llm: fake });
    expect(r.attempts).toBe(2);
    expect(r.rows[0].category).toBe('家居');
  });

  it('超过重试上限抛错', async () => {
    const fake: LLMClient = { async generate() { return { metric: 'sales', dimensions: [], filters: [] } as any; } };
    await expect(
      new Pipeline(kb, exec).run('x', { llm: fake, maxRetries: 2 })
    ).rejects.toThrow('纠错');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test pipeline`
Expected: FAIL,`Cannot find module './pipeline'`。

- [ ] **Step 3: 实现 `src/pipeline.ts`**

```ts
import type { SemanticQuery } from './types';
import { KnowledgeBase } from './knowledge-base';
import { mapQuery } from './mapper';
import { parse } from './parser';
import { correct } from './corrector';
import { translate } from './translator';
import { Executor } from './executor';
import type { LLMClient } from './llm';

export interface PipelineResult {
  query: SemanticQuery;
  sql: string;
  rows: Record<string, unknown>[];
  attempts: number;
}

export interface PipelineOptions {
  llm?: LLMClient;
  maxRetries?: number;
  log?: (msg: string) => void;
}

export class Pipeline {
  constructor(private kb: KnowledgeBase, private exec: Executor) {}

  async run(nl: string, opts: PipelineOptions = {}): Promise<PipelineResult> {
    const model = this.kb.model;
    const maxRetries = opts.maxRetries ?? 3;
    const log = opts.log ?? (() => {});

    log(`[Q] ${nl}`);
    const mapping = mapQuery(nl, this.kb);
    log(`[1] Mapper → ${JSON.stringify(mapping)}`);

    let previousQuery: SemanticQuery | undefined;
    let previousErrors: string[] | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const query = await parse(nl, mapping, model, { llm: opts.llm, previousQuery, previousErrors });
      log(`[2] Parser (第${attempt}次) → ${JSON.stringify(query)}`);

      const { ok, errors } = correct(query, model);
      log(`[3] Corrector → ${ok ? '✓ 通过' : '✗ ' + errors.join('; ')}`);
      if (!ok) { previousQuery = query; previousErrors = errors; continue; }

      const sql = translate(query, model);
      log(`[4] Translator → ${sql}`);
      const rows = this.exec.run(sql);
      log(`[5] Executor → ${rows.length} 行`);
      return { query, sql, rows, attempts: attempt };
    }
    throw new Error(`纠错 ${maxRetries} 次仍未通过校验: ${previousErrors?.join('; ')}`);
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test pipeline`
Expected: PASS(2 个用例)。

- [ ] **Step 5: 提交**

```bash
git add examples/mini-chatbi/src/pipeline.ts examples/mini-chatbi/src/pipeline.test.ts
git commit -m "feat(mini-chatbi): Pipeline 编排与 Corrector→Parser 纠错循环"
```

### Task 9: CLI(ask / eval)+ 黄金样本集

**Files:**
- Create: `examples/mini-chatbi/src/eval.ts`
- Create: `examples/mini-chatbi/src/cli.ts`
- Create: `examples/mini-chatbi/eval/golden.jsonl`
- Test: `examples/mini-chatbi/src/eval.test.ts`

**Interfaces:**
- Consumes: `PipelineResult` (T8), `Pipeline`/`KnowledgeBase`/`Executor`/`loadModel` (前置任务)
- Produces:
  - `interface Golden { question: string; metric: string; check?: { field: string; value: string } }`
  - `function loadGolden(path: string): Golden[]`
  - `function scoreOne(result: PipelineResult, g: Golden): { pass: boolean; reason: string }`

`eval.ts` 抽出可单测的评分逻辑;`cli.ts` 负责 `ask`(分步打印 + 结果表)与 `eval`(跑黄金样本算准确率)两条命令,只做 IO 编排不含逻辑。

- [ ] **Step 1: 写失败测试 `src/eval.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { scoreOne } from './eval';

const base = { sql: '', rows: [{ category: '家居', gmv: 100 }], attempts: 1 };

describe('scoreOne', () => {
  it('指标与检查都命中 → pass', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'gmv', dimensions: ['category'], filters: [] } } as any,
      { question: 'x', metric: 'gmv', check: { field: 'category', value: '家居' } }
    );
    expect(r.pass).toBe(true);
  });

  it('指标不符 → fail', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'order_count', dimensions: [], filters: [] } } as any,
      { question: 'x', metric: 'gmv' }
    );
    expect(r.pass).toBe(false);
    expect(r.reason).toContain('gmv');
  });

  it('检查值不符 → fail', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'gmv', dimensions: ['category'], filters: [] } } as any,
      { question: 'x', metric: 'gmv', check: { field: 'category', value: '数码' } }
    );
    expect(r.pass).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test eval`
Expected: FAIL,`Cannot find module './eval'`。

- [ ] **Step 3: 实现 `src/eval.ts`**

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test eval`
Expected: PASS(3 个用例)。

- [ ] **Step 5: 建黄金样本集 `eval/golden.jsonl`**

```jsonl
{"question": "各品类销售额最高的是哪个", "metric": "gmv", "check": {"field": "category", "value": "家居"}}
{"question": "华东区总成交额", "metric": "gmv"}
{"question": "一共有多少订单", "metric": "order_count"}
{"question": "各地区的活跃用户数", "metric": "active_users"}
{"question": "客单价是多少", "metric": "avg_order_value"}
{"question": "华南和华北的销售额", "metric": "gmv"}
{"question": "食品类目卖了多少钱", "metric": "gmv"}
{"question": "按月份看成交额", "metric": "gmv"}
{"question": "各品类的订单量", "metric": "order_count"}
{"question": "华东区平均订单金额", "metric": "avg_order_value"}
```

说明:只有结果稳定唯一的问题才加 `check`。gmv 各品类不等,「家居最高」稳定可查;order_count 各品类相等(seed 保证),故只校验 `metric` 不加 `check`。

- [ ] **Step 6: 实现 `src/cli.ts`**

```ts
import { loadModel, KnowledgeBase } from './knowledge-base';
import { Executor } from './executor';
import { Pipeline } from './pipeline';
import { loadGolden, scoreOne } from './eval';

const DB = 'mini-chatbi.db';

async function main(): Promise<void> {
  try { process.loadEnvFile('.env'); } catch { /* .env 可选 */ }

  const [cmd, ...rest] = process.argv.slice(2);
  const kb = new KnowledgeBase(loadModel('semantic-model.yaml'));
  const exec = new Executor(DB);
  const pipeline = new Pipeline(kb, exec);

  if (cmd === 'ask') {
    const question = rest.join(' ');
    const result = await pipeline.run(question, { log: (m) => console.log(m) });
    console.log('\n结果:');
    console.table(result.rows);
  } else if (cmd === 'eval') {
    const golden = loadGolden('eval/golden.jsonl');
    let pass = 0;
    for (const g of golden) {
      try {
        const result = await pipeline.run(g.question);
        const s = scoreOne(result, g);
        if (s.pass) pass++;
        console.log(`${s.pass ? '✓' : '✗'} ${g.question}${s.pass ? '' : ' — ' + s.reason}`);
      } catch (e) {
        console.log(`✗ ${g.question} — 异常: ${(e as Error).message}`);
      }
    }
    console.log(`\n准确率: ${pass}/${golden.length} = ${Math.round((pass / golden.length) * 100)}%`);
  } else {
    console.log('用法: npm run ask -- "<问题>"  |  npm run eval');
  }
  exec.close();
}

main();
```

- [ ] **Step 7: 手动验证(需真实 LLM 配置)**

Run:
```bash
cp .env.example .env   # 填入真实 AI_API_KEY
npm run seed
npm run ask -- "各品类销售额最高的是哪个"
npm run eval
```
Expected:`ask` 打印 [Q]→[1]~[5] 五步 + 结果表;`eval` 打印每条通过情况与准确率。若某条 `check` 因数据并列不稳定,按 Step 5 说明去掉该 `check`。

- [ ] **Step 8: 提交**

```bash
git add examples/mini-chatbi/src/eval.ts examples/mini-chatbi/src/eval.test.ts examples/mini-chatbi/src/cli.ts examples/mini-chatbi/eval/golden.jsonl
git commit -m "feat(mini-chatbi): CLI ask/eval 命令与黄金样本评测集"
```

### Task 10: 隔离 examples/ 产物 + 验证根构建

**Files:**
- Create: `examples/mini-chatbi/.gitignore`
- Verify: `docusaurus.config.js`(确认无需改动)

**Interfaces:**
- Consumes: 无
- Produces: 无(仅隔离与验证)

说明:Docusaurus 只处理 `docs/`(notes 插件)与 `projects/`(projects 插件)两个内容目录,根级 `examples/` 不会被当作站点内容,无需改 `docusaurus.config.js`。本任务确保代码产物不入库,且根构建不被影响。

- [ ] **Step 1: 建 `examples/mini-chatbi/.gitignore`**

```
node_modules/
*.db
.env
```

- [ ] **Step 2: 确认 package-lock 已入库、db/env 未入库**

Run: `git status --short examples/`
Expected:看到 `.gitignore`、`package.json`、`package-lock.json`、`src/`、`semantic-model.yaml`、`seed.ts`、`eval/golden.jsonl`;**不**出现 `*.db`、`.env`、`node_modules`。

- [ ] **Step 3: 验证根构建不受影响**

Run(仓库根目录):`npm run build`
Expected:构建成功,产物在 `build/`;`examples/` 内容不出现在站点里,无相关坏链报错。

- [ ] **Step 4: 提交**

```bash
git add examples/mini-chatbi/.gitignore
git commit -m "chore(mini-chatbi): 隔离本地产物,确认不影响站点构建"
```

### Task 11: 文章 1 — 概述

**Files:**
- Create: `projects/06-chat-bi/_category_.json`
- Create: `projects/06-chat-bi/01-overview.md`

**Interfaces:**
- Consumes: 无
- Produces: 系列文章目录节点

- [ ] **Step 1: 建目录分类 `projects/06-chat-bi/_category_.json`**

```json
{
  "label": "Chat BI 实战:从零搭一个语义层",
  "position": 6,
  "link": { "type": "generated-index", "description": "模仿 SuperSonic 做一个极简 Chat BI,理解 NL→SQL 全链路与智能体纠错循环。" }
}
```

- [ ] **Step 2: 写 `01-overview.md`**

frontmatter:
```markdown
---
title: 概述:为什么 Text2SQL 不够可靠
sidebar_position: 1
tags: [Chat BI, 语义层, Text2SQL, Agent]
---
```

正文覆盖(控制在 300 行内):
1. **痛点**:直接 NL→SQL 的流水线在真实场景可靠性不足(引用 SuperSonic 的判断)。
2. **静默错误**:语法对、结果错、还很可信 —— 给一个「活跃用户」口径被猜错的例子。
3. **两因素框架**:验证信号 + 犯错代价,解释 Chat BI 为何「只读所以易落地,但逻辑无验证信号所以危险」。
4. **解法概览**:语义层兜住理解 + 评测集造验证信号 + 人兜结论。
5. **本系列要做什么**:mini-SuperSonic 的五步链路架构图(Mapper→Parser→Corrector→Translator→Executor)+ 一个纠错循环,预告后四篇。

- [ ] **Step 3: 验证根构建**

Run(根目录):`npm run start` 或 `npm run build`
Expected:`/projects` 下出现「Chat BI 实战」分类与「概述」文章,无坏链。

- [ ] **Step 4: 提交**

```bash
git add projects/06-chat-bi/_category_.json projects/06-chat-bi/01-overview.md
git commit -m "docs(projects): Chat BI 实战系列 01 概述"
```

### Task 12: 文章 2 — 语义建模

**Files:**
- Create: `projects/06-chat-bi/02-semantic-modeling.md`

**Interfaces:**
- Consumes: 已实现的 `semantic-model.yaml`、`knowledge-base.ts`(引用其代码片段)
- Produces: 无

- [ ] **Step 1: 写 `02-semantic-modeling.md`**

frontmatter:
```markdown
---
title: 语义建模:给数据一本"业务词典"
sidebar_position: 2
tags: [语义层, 语义建模, 可加性]
---
```

正文覆盖(300 行内,贴 `semantic-model.yaml` 与 `knowledge-base.ts` 真实片段):
1. **语义层要解决的矛盾**:物理事实 vs 业务概念。
2. **语义模型四要素**:实体 / 维度 / 度量 / 口径,配 `semantic-model.yaml` 讲解。
3. **可加性(核心)**:full / none 三态,用 `gmv`(可加)、`active_users`(去重不可加)、`avg_order_value`(比率不可加)三个真实指标讲透「平均的平均是错的」「去重数相加会重复」。
4. **同义词与 Knowledge Base**:贴 `knowledge-base.ts` 的 `resolveTerm`,讲「长三角→华东」「销售额→gmv」怎么解析。
5. **小结**:语义模型是后续所有组件的地基。

- [ ] **Step 2: 验证根构建**

Run:`npm run build`
Expected:文章渲染正常,代码块高亮,无坏链。

- [ ] **Step 3: 提交**

```bash
git add projects/06-chat-bi/02-semantic-modeling.md
git commit -m "docs(projects): Chat BI 实战系列 02 语义建模"
```

### Task 13: 文章 3 — 链路拆解

**Files:**
- Create: `projects/06-chat-bi/03-pipeline.md`

**Interfaces:**
- Consumes: `mapper.ts` / `parser.ts` / `translator.ts` / `executor.ts` 与 `ask` 命令的真实运行输出
- Produces: 无

- [ ] **Step 1: 写 `03-pipeline.md`**

frontmatter:
```markdown
---
title: 链路拆解:一句话到 SQL 的五步旅程
sidebar_position: 3
tags: [Chat BI, Text2SQL, 架构]
---
```

正文覆盖(300 行内):
1. **一条问题的完整旅程**:贴 `npm run ask -- "华东区上月各品类销售额"` 的真实分步输出([1]~[5])。
2. **逐组件拆解**:
   - Schema Mapper(规则)—— 贴 `mapper.ts` 片段,讲「命中线索」怎么产出。
   - Semantic Parser(LLM + zod)—— 贴 `parser.ts`,重点讲「把输出关进笼子」(`generateObject` + `SemanticQuerySchema`)。
   - Semantic Translator(纯代码)—— 贴 `translator.ts`,讲「口径由引擎拼、模型碰不到 SQL,所以口径不会错」。
   - Executor —— 一句话带过。
3. **为什么这样分层**:确定性部分用代码、不确定部分才用 LLM,把 LLM 的作用面压到最小。
4. **小结**:引出下一篇 —— 这条链路里唯一需要「循环」的地方是校验失败后的重试。

- [ ] **Step 2: 验证根构建**

Run:`npm run build`
Expected:渲染正常,无坏链。

- [ ] **Step 3: 提交**

```bash
git add projects/06-chat-bi/03-pipeline.md
git commit -m "docs(projects): Chat BI 实战系列 03 链路拆解"
```

### Task 14: 文章 4 — 智能体循环

**Files:**
- Create: `projects/06-chat-bi/04-agent-loop.md`

**Interfaces:**
- Consumes: `corrector.ts` / `pipeline.ts` 与一次「校验失败→重试成功」的真实运行输出
- Produces: 无

- [ ] **Step 1: 写 `04-agent-loop.md`**

frontmatter:
```markdown
---
title: 加一个智能体循环:让它自己纠错
sidebar_position: 4
tags: [Agent, 智能体, 自主循环]
---
```

正文覆盖(300 行内):
1. **流水线 vs 智能体的分界**:前面 Mapper/Translator/Executor 是确定性流水线,唯一的「自主循环」在 Corrector→Parser。
2. **Corrector 在校验什么**:贴 `corrector.ts`,讲四条规则,重点是「非法维度值(华中)」和「非可加指标多维拆分」——这些是循环能修的信号。
3. **循环怎么搭**:贴 `pipeline.ts` 的重试循环,讲「把错误喂回 prompt 让它重试」+ 停止条件(校验通过 / 达上限)。
4. **贴真实输出**:一次「第一次生成 sales(未知指标)→ Corrector 报错 → 第二次改成 gmv → 通过」的运行日志。
5. **回到框架**:什么时候该加循环?—— 有明确验证信号时(呼应「三档 / 两因素」)。纯流水线够用时别硬加循环。

- [ ] **Step 2: 验证根构建**

Run:`npm run build`
Expected:渲染正常,无坏链。

- [ ] **Step 3: 提交**

```bash
git add projects/06-chat-bi/04-agent-loop.md
git commit -m "docs(projects): Chat BI 实战系列 04 智能体纠错循环"
```

### Task 15: 文章 5 — 验证与总结

**Files:**
- Create: `projects/06-chat-bi/05-eval.md`

**Interfaces:**
- Consumes: `eval.ts` / `golden.jsonl` 与 `npm run eval` 的真实输出
- Produces: 无

- [ ] **Step 1: 写 `05-eval.md`**

frontmatter:
```markdown
---
title: 验证:用评测集抓"静默错误"
sidebar_position: 5
tags: [Chat BI, 评测, 静默错误]
---
```

正文覆盖(300 行内):
1. **两层验证回顾**:分步透明输出(通不通)+ 评测集(对不对)。
2. **为什么需要评测集**:逻辑对错没有自动验证信号 → 用黄金样本人为造一个。
3. **评测集怎么建**:贴 `golden.jsonl` 与 `eval.ts` 的 `scoreOne`,讲「问题 + 期望指标 + 可选结果检查」。
4. **贴真实输出**:`npm run eval` 的通过/失败列表与准确率。
5. **全系列总纲**:Chat BI 可靠性 = 语义层质量 × 使用者兜错能力;主战场在运营层;这个简化版覆盖了哪些、没覆盖哪些(多轮记忆、向量检索、权限)作为「进阶方向」。
6. **参考**:链接 SuperSonic 仓库,说明简化版与真实平台的差距。

- [ ] **Step 2: 验证根构建**

Run:`npm run build`
Expected:整个系列 5 篇渲染正常,无坏链。

- [ ] **Step 3: 提交**

```bash
git add projects/06-chat-bi/05-eval.md
git commit -m "docs(projects): Chat BI 实战系列 05 验证与总结"
```
