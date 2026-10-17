# AI Deck Logo 更新

采用内置 imagegen 生成新 Logo：蓝底白色 A 形机翼，下方独立甲板象征稳定支撑，呼应“您负责飞我负责稳”。保留应用现有蓝色视觉方向。

## 素材与使用

- `resources/logo-source.png`：生成原图，作为图标导出源。
- `resources/icon.png`：256 × 256，供侧栏、浏览器标签页、Electron 窗口及托盘使用。
- `resources/icon.ico`：16、24、32、48、64、128、256 像素，供 Windows 打包使用。
- 原图为不透明蓝底；侧栏通过现有圆角样式显示。

重新导出：`pnpm exec electron scripts/create-icon.mjs`。脚本仅缩放与封装素材，不重新绘制旧 Logo。

## 最终生成提示词

```text
Create a single square production software app icon for AI Deck. 1024x1024. Full-bleed perfectly SOLID flat cobalt blue #4263D8 background, edge to edge, square corners, fully opaque. In the center one bold WHITE aircraft / abstract A mark: a symmetrical upward-pointing rounded apex, two swept delta wings reaching down-left and down-right, broad white strokes and generous triangular blue negative space opening downwards between the wings. One short wide white trapezoidal horizontal flight deck bar sits at the bottom between the wing tips, detached from the wings. The overall mark is contained in the central 72% of the canvas, balanced padding on all sides, minimalist aviation-inspired monogram. Uniform white mark, uniform blue background, exact two-color vector-like graphic, clean smooth contours. No black, no dark regions, no lighting effects, no gradients, no shadow, no transparent areas, no 3D, no texture, no text, no extra symbols. This is a final flat app asset, not a mockup.
```

## 验证

- TypeScript 类型检查与 Electron/Vite 构建通过。
- 使用本机 Edge 运行现有桌面与窄屏布局截图测试，通过。
- 检查侧栏在桌面、窄窗口和深色主题下的显示。
- 已生成 `release/logo-preview/AI Deck Setup 0.1.0.exe` 安装包和 `release/logo-preview/win-unpacked/AI Deck.exe` 免安装程序。
- 使用隔离数据目录验证打包后的程序：启动成功、总览文案与当前源码一致、新 Logo 加载成功、本地状态读取正常。
- 未执行安装；现有已安装应用需安装新包后更新图标。构建产物保留在本地，不纳入 Git。

