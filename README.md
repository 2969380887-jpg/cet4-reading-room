# 四级精读室

一个面向手机和电脑的纯静态四级阅读学习网站，包含六套真题的选词填空和两篇仔细阅读。

## 功能

- 六套卷子切换
- 选词填空点击作答与本地进度保存
- 仔细阅读选项作答与本地进度保存
- 点击任意英文单词查询中文、英文释义和发音
- 每段英文按需翻译为中文，结果保存在当前设备
- 生词本保存在当前设备

## 本地预览

在项目目录启动任意静态文件服务器，例如：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 公开发布

整个目录可直接发布到 GitHub Pages、Cloudflare Pages、Netlify 或其他静态网站托管服务，不需要构建命令。

发布到 GitHub 后，在仓库的 `Settings` -> `Pages` 中选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/root`，保存即可获得公共网址。

公开发布前，请确认你拥有公开传播试卷原文的相应权利。

## 更新试卷数据

`tools/extract_papers.py` 会从原始 PDF 重新生成 `data/papers.json`。
