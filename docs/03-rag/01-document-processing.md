---
title: 文档处理（PDF / Word / 网页抓取）
sidebar_position: 1
tags: [RAG, 文档处理, PDF, 爬虫]
---

# 文档处理

> PDF、Word、网页的解析与提取

## 概述

RAG 的第一步是将各种格式的文档转换为可处理的文本。不同格式需要不同的处理策略。

## 核心概念

### 1. 常见文档格式

| 格式 | 复杂度 | 推荐工具 |
|------|--------|----------|
| TXT/Markdown | 简单 | 直接读取 |
| PDF | 中-高 | PyMuPDF / pdfplumber |
| Word (.docx) | 中 | python-docx |
| HTML/网页 | 中 | BeautifulSoup / Trafilatura |
| Excel | 中 | pandas |

### 2. 处理流程

```
原始文档 → 文本提取 → 清洗 → 分块 → Embedding
```

## 实践要点

### PDF 处理

{/* TODO: 补充复杂 PDF 的处理代码 */}

```python
# 方式 1: PyMuPDF（推荐，速度快）
import fitz  # PyMuPDF

def extract_pdf_text(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

# 方式 2: pdfplumber（表格支持好）
import pdfplumber

def extract_pdf_with_tables(file_path: str) -> dict:
    with pdfplumber.open(file_path) as pdf:
        text = ""
        tables = []
        
        for page in pdf.pages:
            text += page.extract_text() or ""
            page_tables = page.extract_tables()
            tables.extend(page_tables)
    
    return {"text": text, "tables": tables}

# 方式 3: LangChain 封装
from langchain_community.document_loaders import PyMuPDFLoader

loader = PyMuPDFLoader("document.pdf")
documents = loader.load()
```

### Word 文档处理

```python
from docx import Document

def extract_docx_text(file_path: str) -> str:
    doc = Document(file_path)
    
    text_parts = []
    for para in doc.paragraphs:
        text_parts.append(para.text)
    
    # 也可以提取表格
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                text_parts.append(cell.text)
    
    return "\n".join(text_parts)
```

### 网页抓取

```python
# 方式 1: BeautifulSoup（通用）
import requests
from bs4 import BeautifulSoup

def scrape_webpage(url: str) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    
    # 移除脚本和样式
    for script in soup(["script", "style"]):
        script.decompose()
    
    return soup.get_text(separator="\n", strip=True)

# 方式 2: Trafilatura（专为正文提取设计）
import trafilatura

def extract_article(url: str) -> str:
    downloaded = trafilatura.fetch_url(url)
    text = trafilatura.extract(downloaded)
    return text or ""

# 方式 3: LangChain WebBaseLoader
from langchain_community.document_loaders import WebBaseLoader

loader = WebBaseLoader("https://example.com")
documents = loader.load()
```

### 文本清洗

```python
import re

def clean_text(text: str) -> str:
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    
    # 移除特殊字符（保留中文、英文、数字、标点）
    text = re.sub(r'[^\w\s一-鿿.,!?;:，。！？；：]', '', text)
    
    # 移除过短的行
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 10]
    
    return '\n'.join(lines)
```

### LangChain 统一接口

```python
from langchain_community.document_loaders import (
    PyMuPDFLoader,
    Docx2txtLoader,
    WebBaseLoader,
    TextLoader,
)

def load_document(file_path: str):
    """根据文件类型选择合适的加载器"""
    
    if file_path.endswith('.pdf'):
        loader = PyMuPDFLoader(file_path)
    elif file_path.endswith('.docx'):
        loader = Docx2txtLoader(file_path)
    elif file_path.endswith('.txt') or file_path.endswith('.md'):
        loader = TextLoader(file_path)
    elif file_path.startswith('http'):
        loader = WebBaseLoader(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path}")
    
    return loader.load()
```

## 常见问题

### Q: PDF 表格提取不准确怎么办？

1. 使用 pdfplumber 而不是 PyMuPDF
2. 考虑 OCR 方案（如 pdf2image + Tesseract）
3. 对于复杂表格，可能需要手动处理

### Q: 网页抓取被反爬怎么办？

1. 添加 User-Agent 和延迟
2. 使用 Selenium/Playwright 渲染 JS
3. 考虑付费代理服务

### Q: 文档中有图片怎么处理？

1. 忽略图片（如果只需要文本）
2. 使用 OCR 提取图片中的文字
3. 使用多模态模型理解图片内容

## 学习资源

- [PyMuPDF 文档](https://pymupdf.readthedocs.io/)
- [pdfplumber 文档](https://github.com/jsvine/pdfplumber)
- [LangChain Document Loaders](https://python.langchain.com/docs/modules/data_connection/document_loaders)

---

{/* TODO: 补充实际项目的文档处理流水线 */}
