---
title: ReAct 框架
sidebar_position: 4
tags: [Prompt, ReAct, Agent, 推理]
---

# ReAct 框架

> Reasoning + Acting：Agent 的核心思维模式

## 概述

ReAct 是 Agent 最重要的提示词框架，结合了推理（Reasoning）和行动（Acting）。让模型先思考，再决定调用什么工具，然后根据结果继续思考。

## 核心概念

### 1. ReAct 循环

```
Thought（思考）→ Action（行动）→ Observation（观察）→ Thought → ...
```

```python
"""
问题：北京今天的天气怎么样？

Thought: 用户想知道北京的天气，我需要调用天气查询工具。
Action: get_weather(city="北京")
Observation: 北京今天晴，温度 25°C，空气质量良好。

Thought: 我已经获得了天气信息，可以回答用户了。
Action: finish(answer="北京今天晴，温度 25°C，空气质量良好。")
"""
```

### 2. 标准 Prompt 模板

```python
REACT_PROMPT = """
你是一个 AI 助手，可以使用以下工具：

{tools}

请使用以下格式回答问题：

Question: 需要回答的问题
Thought: 我需要思考下一步该做什么
Action: 工具名称[参数]
Observation: 工具返回的结果
... (这个 Thought/Action/Observation 可以重复多次)
Thought: 我现在知道最终答案了
Final Answer: 最终答案

Question: {question}
"""
```

### 3. 工具描述格式

```python
TOOLS = """
1. search(query: str) - 搜索互联网获取信息
2. calculator(expression: str) - 执行数学计算
3. get_weather(city: str) - 获取指定城市的天气
"""
```

## 实践要点

### 完整的 ReAct 实现

{/* TODO: 补充完整的 ReAct Agent 代码 */}

```python
import re
from typing import Callable

class ReActAgent:
    def __init__(self, tools: dict[str, Callable], llm):
        self.tools = tools
        self.llm = llm
    
    def run(self, question: str, max_steps: int = 5) -> str:
        prompt = self._build_prompt(question)
        
        for step in range(max_steps):
            # 获取下一步思考和行动
            response = self.llm.invoke(prompt)
            
            # 解析 Action
            action_match = re.search(r"Action: (\w+)\[(.*?)\]", response)
            
            if "Final Answer:" in response:
                return self._extract_answer(response)
            
            if action_match:
                tool_name, tool_input = action_match.groups()
                
                # 执行工具
                observation = self._execute_tool(tool_name, tool_input)
                
                # 添加观察结果，继续循环
                prompt += f"\n{response}\nObservation: {observation}\n"
        
        return "无法在限定步骤内完成任务"
    
    def _execute_tool(self, name: str, input: str) -> str:
        if name in self.tools:
            return self.tools[name](input)
        return f"未知工具: {name}"
```

### 与 Function Calling 的关系

```
ReAct = 提示词层面的工具使用范式
Function Calling = API 层面的工具调用机制

现代实践：
- 用 ReAct 思维设计 Agent 逻辑
- 用 Function Calling 实现工具调用
- 两者结合使用
```

### LangChain 中的 ReAct

```python
from langchain.agents import create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool

# 定义工具
tools = [
    Tool(
        name="Search",
        func=search_function,
        description="搜索互联网"
    ),
    Tool(
        name="Calculator", 
        func=calculate,
        description="数学计算"
    )
]

# 创建 ReAct Agent
llm = ChatOpenAI(model="gpt-4o")
agent = create_react_agent(llm, tools, prompt_template)
```

## 常见问题

### Q: ReAct 和 CoT 有什么区别？

| 方面 | CoT | ReAct |
|------|-----|-------|
| 核心 | 只思考 | 思考 + 行动 |
| 交互 | 单次生成 | 多轮循环 |
| 工具 | 不使用 | 调用外部工具 |
| 应用 | 纯推理任务 | Agent |

### Q: ReAct 会陷入死循环吗？

可能。解决方案：
1. 设置最大步数限制
2. 检测重复行动
3. 添加超时机制

### Q: 如何让 Agent 知道什么时候停止？

```python
# 明确的结束条件
PROMPT += """
当你确定已经获得足够信息回答问题时，使用：
Final Answer: [你的最终答案]

不要继续尝试获取更多信息，除非确实需要。
"""
```

## 学习资源

- [ReAct 论文](https://arxiv.org/abs/2210.03629)
- [LangChain ReAct Agent](https://python.langchain.com/docs/modules/agents/agent_types/react)

---

{/* TODO: 补充复杂 ReAct Agent 的实现案例 */}
