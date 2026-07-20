---
title: Memory 管理
sidebar_position: 5
tags: [Agent, Memory, 记忆]
---

# Memory 管理

> 短期记忆、长期记忆、向量记忆的设计与实现

## 概述

Memory 让 Agent 能够记住历史信息，实现连贯的多轮对话和长期学习。不同类型的记忆服务于不同目的。

## 核心概念

### 1. 记忆类型

| 类型 | 生命周期 | 用途 | 实现 |
|------|----------|------|------|
| 短期记忆 | 单次会话 | 对话上下文 | 消息列表 |
| 长期记忆 | 跨会话 | 用户偏好、历史 | 数据库 |
| 向量记忆 | 持久化 | 语义检索 | 向量库 |
| 工作记忆 | 单次任务 | 中间结果 | 状态对象 |

### 2. 记忆管理挑战

```
问题：
- 上下文窗口有限
- 长对话占用大量 Token
- 需要选择性记忆

解决：
- 摘要压缩
- 滑动窗口
- 语义检索
```

## 实践要点

### 短期记忆（对话历史）

```python
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory

# 完整历史（适合短对话）
buffer_memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 滑动窗口（只保留最近 k 轮）
window_memory = ConversationBufferWindowMemory(
    k=5,  # 最近 5 轮
    memory_key="chat_history",
    return_messages=True
)

# 使用
chain = ConversationChain(llm=llm, memory=window_memory)
chain.invoke({"input": "你好"})
chain.invoke({"input": "我叫小明"})
chain.invoke({"input": "我叫什么？"})  # 能记住
```

### 摘要记忆

{/* TODO: 补充摘要记忆的实际使用 */}

```python
from langchain.memory import ConversationSummaryMemory

# 自动摘要历史对话
summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="chat_history"
)

# 对话被压缩为摘要
# "用户介绍自己叫小明，询问了天气，对结果表示满意..."
```

### 长期记忆（数据库存储）

```python
from langchain_community.chat_message_histories import SQLChatMessageHistory

# 使用 SQLite 持久化
message_history = SQLChatMessageHistory(
    session_id="user_123",
    connection_string="sqlite:///chat_history.db"
)

# 添加消息
message_history.add_user_message("你好")
message_history.add_ai_message("你好！有什么可以帮你的？")

# 获取历史
messages = message_history.messages
```

### 向量记忆（语义检索）

```python
from langchain.memory import VectorStoreRetrieverMemory
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建向量存储
vectorstore = Chroma(
    embedding_function=OpenAIEmbeddings(),
    persist_directory="./memory_db"
)

# 向量记忆
vector_memory = VectorStoreRetrieverMemory(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    memory_key="relevant_history"
)

# 保存记忆
vector_memory.save_context(
    {"input": "我喜欢吃川菜"},
    {"output": "好的，我记住了，你喜欢川菜"}
)

# 检索相关记忆
relevant = vector_memory.load_memory_variables({"input": "推荐一些美食"})
# 会检索出关于川菜的历史
```

### 混合记忆策略

```python
from langchain.memory import CombinedMemory

# 组合多种记忆
combined_memory = CombinedMemory(memories=[
    window_memory,   # 最近对话
    vector_memory,   # 相关历史
])

# 提示词模板中使用多种记忆
template = """
最近对话：
{chat_history}

相关历史：
{relevant_history}

用户输入：{input}
"""
```

### 自定义记忆实现

```python
from langchain.schema import BaseMemory
from pydantic import BaseModel

class UserProfileMemory(BaseMemory, BaseModel):
    """存储用户画像的记忆"""
    
    user_profile: dict = {}
    memory_key: str = "user_profile"
    
    @property
    def memory_variables(self) -> list[str]:
        return [self.memory_key]
    
    def load_memory_variables(self, inputs: dict) -> dict:
        return {self.memory_key: str(self.user_profile)}
    
    def save_context(self, inputs: dict, outputs: dict) -> None:
        # 从对话中提取用户信息
        self._extract_user_info(inputs, outputs)
    
    def _extract_user_info(self, inputs, outputs):
        # 使用 LLM 提取用户偏好等信息
        # 更新 self.user_profile
        pass
    
    def clear(self) -> None:
        self.user_profile = {}
```

## 常见问题

### Q: 记忆占用太多 Token 怎么办？

1. 使用滑动窗口限制长度
2. 定期摘要压缩
3. 用向量检索替代完整历史

### Q: 如何处理敏感信息？

```python
# 过滤敏感信息
def sanitize_memory(text: str) -> str:
    # 移除手机号、身份证等
    import re
    text = re.sub(r'\d{11}', '[PHONE]', text)
    return text
```

### Q: 长期记忆和 RAG 有什么区别？

| 方面 | 长期记忆 | RAG |
|------|----------|-----|
| 来源 | 用户对话产生 | 外部文档 |
| 更新 | 动态积累 | 定期索引 |
| 目的 | 个性化 | 知识增强 |

## 学习资源

- [LangChain Memory](https://python.langchain.com/docs/modules/memory)
- [Memory 最佳实践](https://www.anthropic.com/research/memory-in-llm)

---

{/* TODO: 补充生产级记忆系统设计 */}
