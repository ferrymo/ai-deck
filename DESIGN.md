---
name: AI Deck
description: 让真实工具状态清楚可读的个人 AI 工作台
colors:
  canvas: "#f8f9fb"
  surface: "#ffffff"
  surface-subtle: "#fcfcfd"
  sidebar: "#f2f4f7"
  text: "#242935"
  secondary: "#515a68"
  muted: "#626c7b"
  border: "#e5e8ee"
  border-strong: "#dce0e7"
  line: "#edf0f4"
  hover: "#f1f3f7"
  accent: "#4263d8"
  accent-hover: "#3453c4"
  accent-soft: "#e5ebfc"
  accent-faint: "#f0f3fc"
  green: "#33765d"
  green-soft: "#edf6f0"
  amber: "#9c6a25"
  amber-soft: "#fbf3e6"
  dark-canvas: "#17191e"
  dark-surface: "#202329"
  dark-sidebar: "#1b1e24"
  dark-text: "#e5e8ef"
  dark-secondary: "#bec4ce"
  dark-muted: "#9aa3b1"
  dark-border: "#30353e"
  dark-accent: "#7e9bff"
  dark-accent-soft: "#2a3653"
  dark-green: "#89c6aa"
  dark-amber: "#dfb574"
typography:
  headline:
    fontFamily: "Segoe UI Variable, Segoe UI, Microsoft YaHei UI, sans-serif"
    fontSize: "25px"
    fontWeight: 620
    lineHeight: 1.4
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Segoe UI Variable, Segoe UI, Microsoft YaHei UI, sans-serif"
    fontSize: "15px"
    fontWeight: 620
    lineHeight: 1.5
  body:
    fontFamily: "Segoe UI Variable, Segoe UI, Microsoft YaHei UI, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
  label:
    fontFamily: "Segoe UI Variable, Segoe UI, Microsoft YaHei UI, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.7
  mono:
    fontFamily: "Cascadia Code, Consolas, monospace"
    fontSize: "11px"
    lineHeight: 1.65
rounded:
  badge: "4px"
  control: "7px"
  icon: "10px"
  panel: "12px"
  command: "13px"
spacing:
  compact: "7px"
  item: "12px"
  grid: "18px"
  section: "27px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "7px 13px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.control}"
    padding: "7px 13px"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "34px"
    width: "205px"
  nav-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 13px"
  badge-warning:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
---

# Design System: AI Deck

## Overview

**Creative North Star: "清晰的个人工作台"**

以瓷白底面、石墨文字和少量蓝色操作构成安静、精确的 Windows 客户端。中文优先，靠排版、留白、细分隔线和真实元数据建立质感；工具是内容主体，装饰退后。浅色是主视觉，深色是同一系统的备选主题。

延续已确认的 code-first 方向：先看本机状态，再检查不确定项，最后针对一个安装实例操作。列表打开右侧检查器，保留原工作区的视觉上下文。

**Key Characteristics:**

- 浅底、细线、低饱和辅助色。
- 紧凑系统文字与宽松区域留白并存。
- 状态、来源、路径与版本具有固定位置。
- 蓝色标识选择和操作，绿色与琥珀色传达状态。

依据为 `PRODUCT.md`、`src/renderer/src/tokens.css`、`styles.css`、`components.tsx`、`App.tsx` 与 `src/renderer/index.html` 的方向约定；尺寸以实际 CSS 为准。此文记录 0.1.0 的已建成界面。视觉证据位于 `.impeccable/review/desktop.png`、`mobile.png`、`store.png`、`electron-real.png`。

## Colors

主色是克制的工作台蓝，配合冷白底面与有层次的灰色；状态色只承担语义。

- **Primary：工作台蓝**（`accent`）用于主按钮、选中导航、链接与焦点；`accent-soft` 用于选中底色，`accent-faint` 用于轻提示。
- **状态色：稳态绿 / 提醒琥珀**（`green` / `amber`）分别用于已就绪与待修复、检查失败等提示，配合文字而非单靠颜色识别。
- **Neutral：瓷白与石墨**（`canvas`、`surface`、`sidebar`、`text`）区分工作区、内容面、导航与主要信息；`secondary` 和 `muted` 承载说明、版本与时间。
- 深色沿用相同语义，`dark-*` 对应深色覆盖值；完整主题映射以 `tokens.css` 为准。深色主按钮另有专用深色文字，不能直接沿用浅色白字。

**The 语义优先 Rule.** 不用绿色替代“待验证”，不把未知版本写成已核实版本；状态必须有文字。

## Typography

使用 Windows 系统字栈：Segoe UI Variable → Segoe UI → Microsoft YaHei UI → sans-serif。中文由可用的系统字体回退；不依赖在线字体。路径使用 Cascadia Code → Consolas → monospace。

- 页面标题使用 `headline`，小屏降至（22px）；区块标题使用 `title`，次级标题（14px / 600）。
- 正文基准使用 `body`，按钮（12px / 500），行名称（12px / 570），说明与元数据主要为（10–12px）。
- 统计数字（24px / 550）与版本使用等宽数字；路径允许断行，列表副标题可省略，完整路径在检查器中展示。
- 避免把产品界面扩展成大字营销页；保持中文标题自然句式和简短操作名称。

## Layout

固定导航与独立滚动工作区组成应用壳。标准侧栏（218px），手动收起后（76px）；标题栏（57px），底部状态栏（29px），主内容内边距（34px 36px 40px）。七个工作区共享此结构：总览、我的工具、个人 Skills、探索商店、运行时、任务记录、偏好设置。

总览采用宽工具列表与窄提示栏，标准提示栏（260px）、列间距（25px）。顶部环境摘要横向排列，列表行最小高度（73px）；工具表格保留名称、版本、来源、状态。Skills 为双列，商店为三列。内容面内部分区依靠细线，不再逐层套卡片。

| 断点 | 实际适配 |
| --- | --- |
| ≥1600px | 内容内边距 40px 55px；提示栏 310px，列间距 30px；列表行 82px。 |
| ≤1150px | 侧栏 190px；内容内边距 27px 25px；提示栏 235px；商店两列。 |
| ≤950px | 总览单列，提示栏移至列表后并排两列；Skills 单列；收起商店装饰图标。 |
| ≤700px | 导航变为 68px 图标栏；内容内边距 24px 20px；提示栏和商店单列；筛选搜索满宽，工具表格隐藏次要列。 |

右侧检查器宽（420px），上限为视口宽度，占满视口高度。命令搜索宽度为 `min(570px, calc(100vw - 30px))`。小屏适配用于窄窗和浏览器预览，不代表已有移动端产品。

## Elevation & Depth

常规内容面无投影，以背景层次、圆角与（1px）边框分组。投影集中在主按钮、更新浮层、搜索对话框、检查器与短提示，表示可操作性或覆盖关系。

- 主按钮：`0 2px 3px #22399e13`。
- 命令搜索：`0 20px 70px #0003`。
- 实例检查器：`-8px 0 40px #00000014`。
- 对话框遮罩：`#18202d42`，保留背景定位感。

## Shapes

AI Deck 品牌标识使用蓝底白色 A 形机翼与独立甲板，源图为 `resources/logo-source.png`。侧栏以 34px 正方形、9px 圆角展示 `resources/icon.png`；Windows 图标由同一原图导出多尺寸 ICO，详见 `docs/Logo更新记录.md`。

使用小圆角矩形，面板与控件半径见 frontmatter；工具品牌图标采用本地官方素材，保留原色与比例，深浅主题均置于白色细边框底座。未知工具使用通用占位图标。状态点为小圆点。轮廓以单条细边框为主，不加厚重渐变边缘或立体浮雕。

## Components

- **按钮**：主按钮蓝底，次按钮白底细边框，另有文字和图标按钮。标准最小高度（35px），小按钮（29px）；禁用态透明度（0.48）并显示不可用光标。
- **导航与筛选**：导航蓝色选中底面，悬停使用中性底色；筛选标签使用更淡的中性选中背景。收起时保留图标和提示名称。
- **搜索**：带图标、可清除内容的紧凑输入；快捷搜索用 Ctrl+K 唤起，Esc 关闭，结果可跳转页面或打开实例。
- **状态标签**：已就绪为绿点加文字；检查失败、待修复用琥珀色标签；仅发现配置、待验证用中性色。检查错误优先展示。
- **内容面与工具列表**：列表行整行可点，悬停轻微变色；工具图标、名称、渠道、版本与健康状态按固定顺序呈现。商店卡片与 Skills 卡片保留同样的边框和文字层次。
- **实例检查器**：依次展示健康状态、版本证据、官方版本、安装位置与管理方式；底部提供加入管理和官方入口。接管仅表示记录实例，不能暗示已经安装或升级。
- **反馈**：首次加载显示骨架与说明；连接失败显示错误及重试；空列表给出原因和适当入口；后台任务在状态栏显示；结果提示区分成功与错误；更新浮层展示当前阶段及可执行动作。
- **交互与无障碍**：控件颜色过渡（160ms ease），检查器进入（180ms ease-out），加载和旋转（1.5s）；系统减少动态效果时关闭动画与过渡。焦点为（2px）蓝色轮廓，标准偏移（3px），输入偏移（1px）；可交互图标有可访问名称。

浏览器使用示例数据，保留“预览 · 示例数据”“示例工作空间”等标记；窄屏虽隐藏顶部预览标记，底部仍标识示例工作空间。示例版本、数量和状态不能作为本机事实。当前产品为发现与管理基础版；未开放的自动安装、自动升级保持禁用或明确说明，界面入口不构成功能已完成的证据。

## Do's and Don'ts

### Do:

- **Do** 优先呈现名称、真实来源、路径和健康状态，让细节能在检查器继续核实。
- **Do** 沿用系统字栈、语义颜色和既有布局断点，保持七个页面的操作习惯一致。
- **Do** 给加载、空数据、失败、未知、禁用和示例状态明确文字。

### Don't:

- **Don't** 将浏览器示例数据写成真实本机扫描结果，或把安装升级入口当作已完成能力。
- **Don't** 通过大面积高饱和色、层层卡片或持续动画制造视觉重量。
- **Don't** 为了紧凑隐藏唯一的状态说明，或只用颜色表达健康和风险。
