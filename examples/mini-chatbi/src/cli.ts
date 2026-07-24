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
