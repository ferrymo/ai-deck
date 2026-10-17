# 工具品牌素材

2026-10-17 从品牌官网、官方文档、官方发布者页面或项目自身仓库下载。素材随客户端打包；运行时不向第三方网站请求图片。每份素材的来源页面、下载地址和 SHA-256 见 [sources.json](./sources.json)。

覆盖目录中的全部 16 个工具条目，以及 Node.js 运行时。Codex CLI / Codex 共用 OpenAI 官方发布的 Codex 扩展图标，Claude Code / Claude 共用 Claude 官方品牌标志。

- Windsurf 使用官方品牌页面提供的 Windsurf Symbol，保留现有工具身份。
- Antigravity Tools 使用 `lbjlaq/Antigravity-Manager` 自身的应用图标，与 Google Antigravity 区分。
- DeepSeek Harness 使用 `deepseek-ai/deepseek-harness` 官方仓库的 Windows 应用图标。
- ZCode 使用 `zcode.z.ai` 官网图标。品牌素材的来源不代表本机安装包已经通过发行来源或签名验证；原有发现与管理边界保持不变。

图标通过 `brands.ts` 静态导入，由 Vite 处理资源路径，兼容 Electron 的 `file://` 加载。显示保留原色、原比例；深浅主题均使用浅色底座，避免黑色标志在深色背景上消失。工具名称已在相邻文本展示，图片作为装饰使用空替代文本，避免屏幕阅读器重复朗读。未知工具保留通用占位图标。

SVG 增加产品名称的 `title` 元数据，不改变图形；清单分别保留下载原件和本地文件的校验值。使用处的 `img` 替代文本和装饰语义由 React 组件管理。

这些第三方标志用于识别对应产品，其商标及素材权利归各自权利人所有，不属于 AI Deck 的 MIT 授权范围，也不表示品牌方背书。
