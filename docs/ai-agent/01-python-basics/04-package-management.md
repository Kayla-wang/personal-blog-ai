---
title: 包管理（pip、poetry、uv）
sidebar_position: 4
tags: [Python, pip, poetry, uv, 包管理]
---

# 包管理（pip、poetry、uv）

> Python 依赖管理：从混乱到清晰

## 概述

Python 的包管理历来是痛点，但近年工具链大幅改善。本文介绍三种主流方案，帮你选择适合的工具。

## 核心概念

### 1. pip + venv（基础方案）

```bash
# 创建虚拟环境
python -m venv .venv

# 激活（Windows）
.venv\Scripts\activate

# 激活（Mac/Linux）
source .venv/bin/activate

# 安装依赖
pip install langchain openai

# 导出依赖
pip freeze > requirements.txt

# 从文件安装
pip install -r requirements.txt
```

**优点**：Python 内置，无需额外安装
**缺点**：依赖版本管理粗糙，lock 机制弱

### 2. Poetry（现代方案）

```bash
# 安装 Poetry
pip install poetry

# 初始化项目
poetry init

# 添加依赖
poetry add langchain openai
poetry add pytest --group dev  # 开发依赖

# 安装所有依赖
poetry install

# 运行命令
poetry run python main.py
poetry run pytest
```

**pyproject.toml 示例**：

```toml
[tool.poetry]
name = "my-agent"
version = "0.1.0"

[tool.poetry.dependencies]
python = "^3.11"
langchain = "^0.2.0"
openai = "^1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
```

**优点**：依赖解析精确，lock 文件可靠，开发体验好
**缺点**：安装稍慢，需要学习新命令

### 3. uv（新一代方案）

```bash
# 安装 uv
pip install uv

# 创建虚拟环境
uv venv

# 安装依赖（超快）
uv pip install langchain openai

# 从 requirements.txt 安装
uv pip install -r requirements.txt

# 同步依赖（类似 npm ci）
uv pip sync requirements.txt
```

**优点**：极快（比 pip 快 10-100 倍），兼容 pip 命令
**缺点**：较新，生态还在发展

## 实践要点

### 工具选择建议

| 场景 | 推荐工具 |
|------|----------|
| 快速实验/脚本 | pip + venv |
| 正式项目 | Poetry |
| 追求速度 | uv |
| CI/CD 环境 | uv（快）或 Poetry（稳） |

### 与 npm 的对比

| 概念 | npm | Python |
|------|-----|--------|
| 包管理器 | npm | pip / poetry / uv |
| 依赖文件 | package.json | requirements.txt / pyproject.toml |
| lock 文件 | package-lock.json | poetry.lock / uv.lock |
| 虚拟环境 | node_modules | .venv |
| 安装命令 | npm install | pip install / poetry install |

### 常用命令速查

```bash
# pip
pip install {package}
pip install -r requirements.txt
pip freeze > requirements.txt

# poetry
poetry add {package}
poetry install
poetry update
poetry run {command}

# uv
uv pip install {package}
uv pip install -r requirements.txt
uv venv
```

## 常见问题

### Q: 项目应该选择哪个工具？

**新手或简单项目**：pip + venv，门槛最低

**团队协作项目**：Poetry，依赖管理更可靠

**大型项目/追求效率**：uv，速度优势明显

### Q: 如何处理依赖冲突？

```bash
# Poetry 会自动解析冲突
poetry add package-a package-b  # 自动找兼容版本

# pip 需要手动处理
pip install package-a==1.0.0 package-b==2.0.0
```

### Q: 虚拟环境必须用吗？

**强烈建议使用**。不同项目可能需要不同版本的包，虚拟环境避免冲突。

## 学习资源

- [Poetry 官方文档](https://python-poetry.org/docs/)
- [uv 官方文档](https://docs.astral.sh/uv/)
- [Python Packaging User Guide](https://packaging.python.org/)

---

{/* TODO: 补充实际项目的依赖配置示例 */}
