---
title: LangChain（工具链 / 通用）
sidebar_position: 1
tags: [Agent, LangChain, 框架]
---

# LangChain

> Agent 开发的瑞士军刀

## 概述

LangChain 是最流行的 LLM 应用开发框架，提供了从 Prompt 管理到 Agent 构建的完整工具链。

## 核心概念

### 1. LangChain 架构

```
LangChain 生态：
├── langchain-core    # 核心抽象（必装）
├── langchain         # 主框架
├── langchain-openai  # OpenAI 集成
├── langchain-community # 社区集成
└── langgraph         # 状态机 Agent
```

### 2. 核心组件

| 组件 | 功能 | 示例 |
|------|------|------|
| Models | LLM 统一接口 | ChatOpenAI, ChatAnthropic |
| Prompts | 提示词管理 | ChatPromptTemplate |
| Chains | 链式调用 | LCEL (LangChain Expression Language) |
| Agents | 自主决策 | Tool-using Agent |
| Memory | 对话记忆 | ConversationBufferMemory |
| Retrievers | 检索器 | VectorStoreRetriever |

### 3. LCEL（表达式语言）

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 定义链
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有帮助的助手"),
    ("user", "{input}")
])
llm = ChatOpenAI(model="gpt-4o")
output_parser = StrOutputParser()

# LCEL 语法：用 | 连接
chain = prompt | llm | output_parser

# 调用
result = chain.invoke({"input": "什么是 RAG？"})
```

## 实践要点

### 基础链

{/* TODO: 补充更多实用链示例 */}

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 1. 简单对话
llm = ChatOpenAI(model="gpt-4o")
response = llm.invoke("你好")

# 2. 带 Prompt 模板
prompt = ChatPromptTemplate.from_template(
    "将以下文本翻译成{language}：\n{text}"
)
chain = prompt | llm

result = chain.invoke({
    "language": "英语",
    "text": "今天天气很好"
})

# 3. 结构化输出
from pydantic import BaseModel

class Translation(BaseModel):
    original: str
    translated: str
    confidence: float

structured_llm = llm.with_structured_output(Translation)
result = structured_llm.invoke("翻译：你好")
```

### 工具使用

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# 定义工具
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气"""
    # 实际实现...
    return f"{city}：晴，25°C"

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

# 绑定工具
tools = [get_weather, calculate]
llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools(tools)

# 调用
response = llm_with_tools.invoke("北京今天天气怎么样？")
# 检查是否需要调用工具
if response.tool_calls:
    tool_call = response.tool_calls[0]
    print(f"需要调用: {tool_call['name']}, 参数: {tool_call['args']}")
```

### ReAct Agent

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain import hub

# 获取 ReAct Prompt
prompt = hub.pull("hwchase17/react")

# 创建 Agent
llm = ChatOpenAI(model="gpt-4o", temperature=0)
agent = create_react_agent(llm, tools, prompt)

# 执行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,  # 打印思考过程
    max_iterations=5
)

# 运行
result = agent_executor.invoke({
    "input": "北京今天天气怎么样？如果温度超过20度，帮我计算20*3"
})
```

### RAG 链

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# 设置
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings, persist_directory="./db")
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatOpenAI(model="gpt-4o")

# RAG Prompt
prompt = ChatPromptTemplate.from_template("""
基于以下内容回答问题。如果不知道就说不知道。

内容：
{context}

问题：{question}
""")

# RAG 链
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)

# 使用
answer = rag_chain.invoke("什么是 LangChain？")
```

## 常见问题

### Q: LangChain 和 LlamaIndex 怎么选？

- **LangChain**：通用框架，适合复杂 Agent、多工具场景
- **LlamaIndex**：专注 RAG，文档索引能力强

可以结合使用：LlamaIndex 做检索，LangChain 做 Agent。

### Q: LCEL 学习曲线陡吗？

初期可能不习惯，但掌握后能显著提升代码可读性和可组合性。建议从简单链开始。

### Q: LangChain 版本更新太快怎么办？

1. 锁定版本（poetry.lock / requirements.txt）
2. 关注 breaking changes
3. 优先使用 `langchain-core` 中的稳定 API

## 学习资源

- [LangChain 官方文档](https://python.langchain.com/)
- [LangChain Cookbook](https://github.com/langchain-ai/langchain/tree/master/cookbook)

---

{/* TODO: 补充实际项目的 LangChain 架构 */}
