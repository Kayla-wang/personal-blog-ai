---
title: 后端自动化平台
sidebar_position: 1
tags: [自动化, 后端, 定时任务]
---

# 后端自动化平台

> 构建数据同步、报表生成、定时任务的自动化平台

## 项目概述

### 功能范围

- **数据同步**：跨系统数据同步
- **报表生成**：自动生成业务报表
- **邮件发送**：批量邮件、定时提醒
- **定时任务**：Cron 任务调度
- **数据库备份**：自动备份与恢复

### 技术栈

- 运行时：Node.js
- 任务调度：Bull + Redis
- 数据库：PostgreSQL
- AI 增强：LangChain.js（智能决策）

## 架构设计

```
┌─────────────────────────────────────────────┐
│                 任务调度中心                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Cron   │ │  Event  │ │  Manual │       │
│  │ Trigger │ │ Trigger │ │ Trigger │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┼───────────┘             │
│                   ↓                          │
│            ┌──────────────┐                  │
│            │  Task Queue  │ ←── Redis/Bull  │
│            └──────┬───────┘                  │
│                   ↓                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Worker  │ │ Worker  │ │ Worker  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

## 核心模块

### 1. 任务定义

```typescript
// 任务基类
interface Task {
  id: string;
  name: string;
  cron?: string;           // Cron 表达式
  handler: () => Promise<TaskResult>;
  onSuccess?: (result: TaskResult) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
}

// 数据同步任务
const syncOrdersTask: Task = {
  id: 'sync-orders',
  name: '同步订单数据',
  cron: '0 */6 * * *',  // 每 6 小时
  handler: async () => {
    const orders = await sourceDB.query('SELECT * FROM orders WHERE updated_at > ?', [lastSync]);
    await targetDB.upsert('orders', orders);
    return { synced: orders.length };
  },
  retryCount: 3,
};
```

### 2. AI 增强决策

```typescript
// 智能报表生成
const reportAgent = async (request: string) => {
  const model = new ChatOpenAI({ model: 'gpt-4o' });
  
  const tools = [
    queryDatabaseTool,   // 查询数据库
    generateChartTool,   // 生成图表
    sendEmailTool,       // 发送邮件
  ];

  // Agent 根据请求自动决定：
  // 1. 需要查询哪些数据
  // 2. 生成什么类型的图表
  // 3. 发送给谁
  return await agentExecutor.invoke({ input: request });
};

// 使用示例
await reportAgent('生成本月销售报表，发送给销售团队');
```

### 3. 任务监控

```typescript
// 任务状态追踪
interface TaskExecution {
  taskId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  retryAttempt: number;
}

// 告警规则
const alertRules = [
  { condition: 'task.failed && task.retryAttempt >= 3', action: 'sendAlert' },
  { condition: 'task.duration > 30min', action: 'sendWarning' },
];
```

## 实现步骤

### Step 1: 任务队列设置

```typescript
import Bull from 'bull';

const taskQueue = new Bull('automation-tasks', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// 注册处理器
taskQueue.process('sync', async (job) => {
  return await syncHandler(job.data);
});

taskQueue.process('report', async (job) => {
  return await reportHandler(job.data);
});
```

### Step 2: 定时任务注册

```typescript
import cron from 'node-cron';

// 注册定时任务
cron.schedule('0 8 * * *', () => {
  taskQueue.add('report', { type: 'daily-summary' });
});

cron.schedule('0 */6 * * *', () => {
  taskQueue.add('sync', { source: 'crm', target: 'warehouse' });
});
```

### Step 3: 监控面板

```typescript
// 任务状态 API
@Controller('tasks')
export class TaskController {
  @Get('status')
  async getStatus() {
    const waiting = await taskQueue.getWaitingCount();
    const active = await taskQueue.getActiveCount();
    const completed = await taskQueue.getCompletedCount();
    const failed = await taskQueue.getFailedCount();
    
    return { waiting, active, completed, failed };
  }

  @Get('history')
  async getHistory(@Query('limit') limit = 100) {
    return await taskQueue.getJobs(['completed', 'failed'], 0, limit);
  }
}
```

## 最佳实践

1. **幂等设计**：任务重复执行不产生副作用
2. **断点续传**：大任务支持分批处理
3. **资源限制**：控制并发数，避免压垮下游
4. **完善日志**：记录每一步执行详情
5. **告警及时**：失败立即通知，不要等用户发现

## 进阶功能

- [ ] 任务依赖图（DAG）
- [ ] 动态 Cron 表达式
- [ ] 任务执行可视化
- [ ] 自动扩缩容 Worker
