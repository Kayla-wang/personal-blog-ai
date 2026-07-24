import { createRequire } from 'node:module';

// node:sqlite 是较新的内置模块,vite/vitest 的解析器尚不识别;
// 用 createRequire 在运行时加载,绕过打包器解析(tsx 与 vitest 下行为一致)。
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => {
    prepare(sql: string): { all(...params: unknown[]): Record<string, unknown>[] };
    close(): void;
  };
};

export class Executor {
  private db: InstanceType<typeof DatabaseSync>;
  constructor(dbPath: string) { this.db = new DatabaseSync(dbPath); }
  run(sql: string): Record<string, unknown>[] {
    return this.db.prepare(sql).all();
  }
  close(): void { this.db.close(); }
}
