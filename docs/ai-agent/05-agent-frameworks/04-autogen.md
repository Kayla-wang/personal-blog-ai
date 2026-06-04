---
title: AutoGen（多 Agent 对话）
sidebar_position: 4
tags: [Agent, AutoGen, 多Agent]
---

# AutoGen

> 微软的多 Agent 对话框架

## 概述

AutoGen 是微软推出的多 Agent 框架，核心理念是通过 Agent 之间的对话来完成复杂任务。

## 核心概念

### 1. AutoGen 特点

```
核心理念：
- Agent 之间通过对话协作
- 可以包含人类参与者
- 支持代码执行和工具调用
```

### 2. Agent 类型

| 类型 | 说明 | 用途 |
|------|------|------|
| AssistantAgent | AI 助手 | 思考和回复 |
| UserProxyAgent | 用户代理 | 执行代码、人类输入 |
| GroupChat | 群聊 | 多 Agent 协作 |

### 3. 基本示例

```python
from autogen import AssistantAgent, UserProxyAgent

# 配置 LLM
llm_config = {
    "model": "gpt-4o",
    "api_key": "your-key"
}

# 创建助手 Agent
assistant = AssistantAgent(
    name="assistant",
    llm_config=llm_config,
    system_message="你是一个有帮助的 AI 助手。"
)

# 创建用户代理
user_proxy = UserProxyAgent(
    name="user",
    human_input_mode="NEVER",  # 不需要人工输入
    code_execution_config={"use_docker": False}
)

# 发起对话
user_proxy.initiate_chat(
    assistant,
    message="写一个 Python 函数计算斐波那契数列"
)
```

## 实践要点

### 代码执行

{/* TODO: 补充更复杂的代码执行示例 */}

```python
from autogen import AssistantAgent, UserProxyAgent

# 助手负责写代码
coder = AssistantAgent(
    name="coder",
    llm_config=llm_config,
    system_message="你是一个 Python 专家，善于写高质量代码。"
)

# 用户代理执行代码
executor = UserProxyAgent(
    name="executor",
    human_input_mode="NEVER",
    code_execution_config={
        "work_dir": "./workspace",
        "use_docker": False,  # 生产环境建议用 Docker
    },
    max_consecutive_auto_reply=5
)

# 执行对话
executor.initiate_chat(
    coder,
    message="创建一个数据可视化脚本，分析 data.csv 中的销售数据"
)
```

### 多 Agent 群聊

```python
from autogen import GroupChat, GroupChatManager

# 创建多个专业 Agent
planner = AssistantAgent(
    name="planner",
    system_message="你是项目规划师，负责分解任务。"
)

coder = AssistantAgent(
    name="coder", 
    system_message="你是程序员，负责编写代码。"
)

reviewer = AssistantAgent(
    name="reviewer",
    system_message="你是代码审查员，负责检查代码质量。"
)

user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")

# 创建群聊
groupchat = GroupChat(
    agents=[user_proxy, planner, coder, reviewer],
    messages=[],
    max_round=10
)

manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

# 发起群聊
user_proxy.initiate_chat(
    manager,
    message="开发一个简单的待办事项 API"
)
```

### 人工介入

```python
user_proxy = UserProxyAgent(
    name="user",
    human_input_mode="TERMINATE",  # 可以手动终止
    # human_input_mode="ALWAYS"    # 每轮都需要确认
)

# 运行时会在终端等待人工输入
```

### 自定义 Agent

```python
from autogen import ConversableAgent

class CustomAgent(ConversableAgent):
    def __init__(self, name, **kwargs):
        super().__init__(name=name, **kwargs)
    
    def generate_reply(self, messages, sender, config=None):
        # 自定义回复逻辑
        last_message = messages[-1]["content"]
        
        if "天气" in last_message:
            return "今天天气晴朗！"
        
        # 调用默认行为
        return super().generate_reply(messages, sender, config)
```

### 工具使用

```python
from autogen import register_function

# 定义工具
def get_stock_price(symbol: str) -> str:
    """获取股票价格"""
    # 实际实现...
    return f"{symbol}: $150.00"

# 注册工具
register_function(
    get_stock_price,
    caller=assistant,
    executor=user_proxy,
    description="获取股票价格"
)

# 使用
user_proxy.initiate_chat(
    assistant,
    message="查询 AAPL 的股票价格"
)
```

## 常见问题

### Q: AutoGen 适合什么场景？

- 需要代码生成和执行
- 多角色协作（规划、执行、审查）
- 人机协作任务
- 研究和原型开发

### Q: 和 LangGraph 的区别？

| 方面 | AutoGen | LangGraph |
|------|---------|-----------|
| 协作模式 | 对话驱动 | 状态机驱动 |
| 代码执行 | 内置支持 | 需要自己实现 |
| 流程控制 | 较灵活 | 更精确 |
| 生产就绪 | 研究为主 | 生产友好 |

### Q: 安全性如何？

代码执行有风险，建议：
1. 使用 Docker 隔离
2. 限制可执行的命令
3. 设置超时和资源限制

## 学习资源

- [AutoGen 官方文档](https://microsoft.github.io/autogen/)
- [AutoGen GitHub](https://github.com/microsoft/autogen)

---

{/* TODO: 补充实际多 Agent 协作案例 */}
