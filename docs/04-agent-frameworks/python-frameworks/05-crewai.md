---
title: CrewAI（角色化 Agent 团队）
sidebar_position: 5
tags: [Agent, CrewAI, 多Agent, 角色]
---

# CrewAI

> 基于角色的 Agent 团队协作框架

## 概述

CrewAI 的核心理念是：定义 Agent 的角色、目标和背景，让它们像真实团队一样协作。

## 核心概念

### 1. CrewAI 核心要素

```
Agent  → 角色定义（谁）
Task   → 任务定义（做什么）
Crew   → 团队编排（怎么协作）
Tools  → 能力扩展（用什么）
```

### 2. 与其他框架对比

| 方面 | CrewAI | AutoGen | LangGraph |
|------|--------|---------|-----------|
| 核心理念 | 角色协作 | 对话驱动 | 状态机 |
| 易用性 | 高 | 中 | 中 |
| 灵活性 | 中 | 高 | 高 |
| 学习成本 | 低 | 中 | 中 |

### 3. 基本示例

```python
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# 定义 Agent
researcher = Agent(
    role="研究员",
    goal="深入研究给定主题，提供全面的信息",
    backstory="你是一位经验丰富的研究员，善于从多个角度分析问题",
    llm=llm
)

writer = Agent(
    role="作家",
    goal="将研究结果转化为易读的文章",
    backstory="你是一位专业作家，善于将复杂信息写成通俗易懂的内容",
    llm=llm
)

# 定义任务
research_task = Task(
    description="研究 AI Agent 的最新发展趋势",
    agent=researcher,
    expected_output="一份详细的研究报告"
)

write_task = Task(
    description="基于研究报告写一篇博客文章",
    agent=writer,
    expected_output="一篇 1000 字左右的博客文章",
    context=[research_task]  # 依赖研究任务的输出
)

# 创建团队
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task]
)

# 执行
result = crew.kickoff()
```

## 实践要点

### 工具使用

{/* TODO: 补充更多工具示例 */}

```python
from crewai_tools import SerperDevTool, WebsiteSearchTool

# 搜索工具
search_tool = SerperDevTool()

# 网站搜索工具
website_tool = WebsiteSearchTool()

# 分配给 Agent
researcher = Agent(
    role="研究员",
    goal="研究最新的技术趋势",
    tools=[search_tool, website_tool],
    llm=llm
)
```

### 自定义工具

```python
from crewai_tools import BaseTool

class StockPriceTool(BaseTool):
    name: str = "股票价格查询"
    description: str = "查询指定股票的当前价格"
    
    def _run(self, symbol: str) -> str:
        # 实际实现
        return f"{symbol}: $150.00"

# 使用
analyst = Agent(
    role="金融分析师",
    tools=[StockPriceTool()],
    llm=llm
)
```

### 流程控制

```python
from crewai import Process

# 顺序执行（默认）
crew = Crew(
    agents=[agent1, agent2],
    tasks=[task1, task2],
    process=Process.sequential
)

# 层级执行（有 manager）
crew = Crew(
    agents=[agent1, agent2],
    tasks=[task1, task2],
    process=Process.hierarchical,
    manager_llm=ChatOpenAI(model="gpt-4o")
)
```

### 记忆能力

```python
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    memory=True,  # 启用记忆
    embedder={
        "provider": "openai",
        "config": {"model": "text-embedding-3-small"}
    }
)
```

### 输出结构化

```python
from pydantic import BaseModel

class ResearchReport(BaseModel):
    topic: str
    findings: list[str]
    conclusion: str

research_task = Task(
    description="研究 AI Agent",
    agent=researcher,
    expected_output="研究报告",
    output_pydantic=ResearchReport  # 结构化输出
)
```

### 异步执行

```python
import asyncio

async def run_crew():
    result = await crew.kickoff_async()
    return result

# 执行
result = asyncio.run(run_crew())
```

## 常见问题

### Q: CrewAI 适合什么场景？

- 内容创作流水线（研究 → 写作 → 审核）
- 数据分析任务（收集 → 分析 → 报告）
- 多角色协作的明确流程
- 快速原型开发

### Q: 如何调试 Agent 协作？

```python
crew = Crew(
    agents=[...],
    tasks=[...],
    verbose=True,  # 详细日志
    step_callback=lambda step: print(f"Step: {step}")
)
```

### Q: 任务失败怎么处理？

```python
task = Task(
    description="...",
    agent=agent,
    max_retry=3,  # 最多重试 3 次
    retry_on_error=True
)
```

## 学习资源

- [CrewAI 官方文档](https://docs.crewai.com/)
- [CrewAI GitHub](https://github.com/joaomdmoura/crewai)

---

{/* TODO: 补充实际业务场景的 CrewAI 应用 */}
