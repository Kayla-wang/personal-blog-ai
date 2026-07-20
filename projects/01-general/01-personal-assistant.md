---
title: 个人 AI 助理
sidebar_position: 1
tags: [个人助理, 入门项目]
---

# 个人 AI 助理

> 构建一个多功能的个人助理，掌握 Agent 开发基础

## 项目概述

### 功能范围

- **日程管理**：创建、查询、修改日程
- **待办提醒**：任务管理与提醒
- **信息检索**：搜索互联网获取信息
- **生活服务**：天气查询、汇率转换
- **旅行规划**：行程建议、景点推荐

### 技术栈

- 前端：React + Tailwind CSS
- 后端：Nest.js
- AI：LangChain.js + OpenAI
- 数据库：PostgreSQL + Redis

## 架构设计

```
┌─────────────────────────────────────┐
│           React 前端                │
│    对话界面 / 日程面板 / 设置       │
└───────────────┬─────────────────────┘
                │ REST API / WebSocket
┌───────────────▼─────────────────────┐
│           Nest.js API               │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │  Agent  │ │  Tools  │ │Memory │ │
│  │ Service │ │ Service │ │Service│ │
│  └─────────┘ └─────────┘ └───────┘ │
├─────────────────────────────────────┤
│  PostgreSQL    │    Redis           │
└─────────────────────────────────────┘
```

## 核心工具

### 1. 日程工具

```typescript
const calendarTool = tool(
  async ({ action, date, title, description }) => {
    switch (action) {
      case 'create':
        return await calendarService.create({ date, title, description });
      case 'list':
        return await calendarService.list(date);
      case 'delete':
        return await calendarService.delete(title);
    }
  },
  {
    name: 'calendar',
    description: '管理日程。可以创建、查询、删除日程安排。',
    schema: z.object({
      action: z.enum(['create', 'list', 'delete']),
      date: z.string().optional().describe('日期，格式 YYYY-MM-DD'),
      title: z.string().optional().describe('日程标题'),
      description: z.string().optional().describe('日程描述'),
    }),
  }
);
```

### 2. 天气工具

```typescript
const weatherTool = tool(
  async ({ city }) => {
    const data = await fetch(`${WEATHER_API}?city=${city}`);
    return formatWeather(data);
  },
  {
    name: 'get_weather',
    description: '获取指定城市的天气信息',
    schema: z.object({
      city: z.string().describe('城市名称'),
    }),
  }
);
```

### 3. 搜索工具

```typescript
const searchTool = tool(
  async ({ query }) => {
    const results = await searchService.search(query);
    return results.slice(0, 5).map(r => ({
      title: r.title,
      snippet: r.snippet,
      url: r.url,
    }));
  },
  {
    name: 'web_search',
    description: '搜索互联网获取最新信息。当需要查询新闻、时事或实时数据时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
  }
);
```

## 实现步骤

### Step 1: 项目初始化

```bash
# 创建 Nest.js 项目
nest new personal-assistant-api
cd personal-assistant-api

# 安装依赖
npm install @langchain/openai @langchain/core langchain zod
```

### Step 2: 实现 Agent 服务

```typescript
// src/agent/agent.service.ts
@Injectable()
export class AgentService {
  private model: ChatOpenAI;
  private tools: StructuredTool[];

  constructor(
    private calendarService: CalendarService,
    private memoryService: MemoryService,
  ) {
    this.model = new ChatOpenAI({ model: 'gpt-4o' });
    this.tools = [calendarTool, weatherTool, searchTool];
  }

  async chat(userId: string, message: string) {
    const memory = await this.memoryService.get(userId);
    
    const modelWithTools = this.model.bindTools(this.tools);
    
    // ReAct 循环
    let messages = [...memory, { role: 'user', content: message }];
    
    while (true) {
      const response = await modelWithTools.invoke(messages);
      messages.push(response);
      
      if (!response.tool_calls?.length) {
        break; // 无工具调用，结束循环
      }
      
      // 执行工具
      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(toolCall);
        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }
    
    await this.memoryService.save(userId, messages);
    return messages[messages.length - 1].content;
  }
}
```

### Step 3: 实现对话接口

```typescript
// src/chat/chat.controller.ts
@Controller('chat')
export class ChatController {
  constructor(private agentService: AgentService) {}

  @Post()
  async chat(@Body() dto: ChatDto, @Req() req) {
    const userId = req.user.id;
    const response = await this.agentService.chat(userId, dto.message);
    return { response };
  }

  @Sse('stream')
  async stream(@Body() dto: ChatDto, @Req() req) {
    // 流式响应实现
  }
}
```

### Step 4: 前端对话界面

```tsx
// 简化的对话组件
function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setInput('');
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <ChatInput value={input} onChange={setInput} onSend={sendMessage} />
    </div>
  );
}
```

## 进阶优化

- [ ] 添加语音输入/输出
- [ ] 集成更多 API（地图、翻译）
- [ ] 实现多用户隔离
- [ ] 添加对话历史搜索
- [ ] 优化响应速度（流式输出）

## 学习收获

完成此项目后，你将掌握：
- Agent 基础架构设计
- 工具定义与调用
- 对话记忆管理
- 前后端集成开发
