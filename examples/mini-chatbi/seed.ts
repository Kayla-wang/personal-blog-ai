import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// node:sqlite 是较新的内置模块,vite/vitest 的解析器尚不识别;
// 用 createRequire 在运行时加载,绕过打包器解析(tsx 与 vitest 下行为一致)。
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): { run(...params: unknown[]): unknown };
    close(): void;
  };
};

const REGIONS = ['华东', '华南', '华北', '西南'];
const CATEGORIES = ['数码', '服饰', '食品', '家居'];
const MONTHS = ['2026-05', '2026-06'];

export function seed(dbPath: string): void {
  const db = new DatabaseSync(dbPath);
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
  for (const month of MONTHS) {
    for (const region of REGIONS) {
      const rows = region === '华东' ? 5 : 3;
      for (const category of CATEGORIES) {
        for (let i = 0; i < rows; i++) {
          // user_id 只由 region+i 决定 → 同一用户跨多个品类下单 → distinct 计数跨品类相加会重复
          const uid = REGIONS.indexOf(region) * 100 + i + 1;
          const amount = (CATEGORIES.indexOf(category) + 1) * 1000 + i * 100;
          ins.run(uid, region, category, amount, month);
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
