# GitHub Actions 排查与使用说明

核查日期：2026-10-17（Asia/Hong_Kong）。

## 当前决定：停用自动工作流

根据用户要求，已移除 `.github/workflows/check.yml`，后续直接提交、推送代码，不再触发该 Windows 验证工作流。本地检查命令及 `.gitattributes` 换行规则继续保留。下文记录停用前的排查和 Actions 使用规则，历史失败运行仍可在 GitHub 查看。

## 本次失败与修复

- 运行：<https://github.com/ferrymo/ai-deck/actions/runs/39042327529/job/117424148420>
- 提交：`0baaabe9a2370162d6def04374641ee47774e404`。
- GitHub API 确认：依赖安装和 `pnpm typecheck` 成功，`pnpm check` 失败，后续测试、UI 验证、打包和打包版烟雾检查被跳过。
- 完整日志的下载地址发生 TLS 连接错误，未取得云端 Biome 的逐项诊断；以下原因通过失败提交的隔离副本复现。

仓库没有约束检出时的换行符。Windows Git 在 `core.autocrlf=true` 时把文本文件检出为 CRLF，而当前 Biome 格式化规则要求 LF。原工作区的大部分源码仍是 LF，原工作区检查通过不能证明全新 Windows 检出也会通过。

在失败提交的干净副本中启用 `core.autocrlf=true`，使用本地已安装的 Biome 2.5.15 检查，42 个文件中出现 41 个错误。添加 `.gitattributes` 后重新克隆、检出，保持相同 Git 配置，再检查同样的 42 个文件，全部通过。此对照支持换行转换是该失败步骤的原因，最终仍需新提交在 GitHub 上运行确认。

修复为 `.gitattributes` 中的 `* text=auto eol=lf`，并为未来的 `.bat`、`.cmd` 保留 CRLF 例外。未禁用格式检查，未更改全局 Git 配置。

当前未提交的界面改动另带入 5 个缺少 `<title>` 的 SVG：Cursor、DeepSeek、Node.js、Qoder、Windsurf。这些文件不属于失败提交。本次仅为其补充无障碍标题，保留原有 SVG 内容与图形。

验证结果：

| 检查 | 结果 |
| --- | --- |
| 原提交 + Windows CRLF 检出 | 复现 41 个 Biome 错误 |
| 原提交 + `.gitattributes` + 全新 Windows 检出 | 42 个文件通过 |
| 当前工作区 `pnpm check` | 49 个文件通过 |
| 当前工作区 `pnpm typecheck` | 通过 |
| 当前工作区 `pnpm test` | 2 个测试文件、12 项测试通过 |

排查修复阶段未重新执行 UI 测试、打包或 Electron 烟雾测试，也未在 GitHub 上重跑。临时副本复用了本机依赖，不能替代完整云端环境验证；后续按用户要求移除工作流并提交、推送代码。

GitHub 还报告 `actions/checkout@v4`、`actions/setup-node@v4`、`pnpm/action-setup@v4` 的 Node 20 action 运行时弃用警告；这些准备步骤已经成功，因此该警告不是本次失败步骤。它与项目通过 setup-node 选择的 Node 24 是两个层面的运行时。

## Actions 如何使用

GitHub Actions 根据事件自动执行仓库中的 YAML 工作流。停用前的 `.github/workflows/check.yml` 在 push 和 pull request 时触发，在 GitHub 提供的临时 Windows 机器中依次下载代码、准备 Node/pnpm、安装依赖、检查类型和格式、运行测试、验证 UI、打包并启动打包版做烟雾检查。

工作流叫 workflow，整组验证任务叫 job，执行任务的机器叫 runner，每条命令或复用 action 是一个 step。原工作流用于验证，不会自动发布 Release 或部署应用。

启用工作流时的使用步骤（当前已停用）：

1. 修改代码后运行 `pnpm check`、`pnpm typecheck`、`pnpm test`。
2. 提交并推送，GitHub 自动创建新运行。
3. 在仓库 Actions 页打开运行和第一个失败步骤，查看实际错误；失败后跳过的步骤不代表它们自身有错误。
4. 修改代码后推送新提交。旧运行的 Re-run jobs 仍然使用旧提交，不能验证尚未推送的修复。

## 免费与收费

本次 API 核实仓库是公开仓库，原工作流使用标准 `windows-latest` runner，因此原工作流的运行时间免费。公开仓库的标准 runner 不受私有仓库每月 2,000 分钟额度约束。

| 场景 | 当前官方规则 |
| --- | --- |
| 公开仓库 + 标准 GitHub runner | 运行时间免费，包括 Windows |
| 私有仓库 + 标准 GitHub runner | 先使用账户方案额度，超额用量收费 |
| Larger runners | 公开仓库也收费，不能抵扣方案赠送分钟 |
| 自托管 runner | GitHub 当前不收 runner 运行费用，机器等成本自行承担 |
| 构建产物与缓存存储 | 有独立额度及超额存储计费规则 |

GitHub Free 包含每月 2,000 分钟、500 MB 构建产物存储；Pro 为 3,000 分钟、1 GB；缓存额度每个仓库 10 GB。分钟额度按账户计算，不是每个私有仓库各送一份；不同系统的额度折算以账单页面为准。构建产物与 GitHub Packages 共用存储额度，缓存单独计算。

官方当前标准 x64 超额费率示例：Linux 2 核 0.006 美元/分钟，Windows 2 核 0.010 美元/分钟，macOS 0.062 美元/分钟；具体机器规格价格不同。收费 job 的不足一分钟部分向上取整，失败执行消耗的时间也计入用量。

原工作流没有上传 artifact 或配置 Actions 缓存；临时 runner 内生成的打包目录不会因此自动成为长期保存的 artifact。

没有有效支付方式时，超出免费额度后会阻止继续使用；配置了支付方式的账户，应在账户 Settings 的 Billing and licensing 中查看用量和预算。预算提醒不等于自动停止，应核对是否启用了达到预算后停止使用的选项。本次未查看或修改账户账单、支付方式或预算。

官方参考（价格与规则可能调整）：

- [GitHub Actions 概念](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [GitHub Actions 计费和免费额度](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Runner 价格](https://docs.github.com/en/billing/reference/actions-runner-pricing)
