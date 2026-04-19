# Forsion Launcher 浏览器扩展

让 Chrome / Edge 每次启动以及每个新标签页都默认打开 [forsion.net](https://forsion.net/)。

## 功能

- **浏览器启动**：监听 `chrome.runtime.onStartup`，自动把启动时的空白/新标签页更新为 forsion.net（避免重复开页）。
- **新建标签页**：通过 `chrome_url_overrides.newtab` 接管新标签页，立刻跳转到 forsion.net。
- **图标按钮**：点击工具栏上的 Forsion 图标也会打开 forsion.net。
- **首次安装**：安装完成后自动打开一次 forsion.net 作为欢迎页。

基于 Manifest V3，不请求任何 host 权限，只需要 `tabs` 权限。

## 开发模式加载

1. 打开扩展管理页
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. 打开右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择当前目录 `apps/Forsion-Desktop/browser-extension/`
5. 固定（pin）扩展到工具栏以便验证

## 验证

- 按 `Ctrl+T` 新建标签页 → 应立即跳转到 forsion.net（可见极短的深色 loading）
- 完全退出浏览器后重新打开 → 首个窗口应自动停在 forsion.net
- 点击工具栏 Forsion 图标 → 新开一个 forsion.net 标签

## 文件结构

```
browser-extension/
├── manifest.json     # MV3 清单
├── background.js     # Service Worker：onStartup / onInstalled / action
├── newtab.html       # 新标签页覆盖（品牌 loading）
├── newtab.js         # 立即 location.replace 到 forsion.net
├── icons/            # 16 / 32 / 48 / 128 PNG
└── README.md
```

## 打包发布

开发完成后可通过 Chrome Web Store / Edge Add-ons 发布：

```bash
# 打包为 zip（用于提交到应用商店）
cd apps/Forsion-Desktop
zip -r forsion-launcher.zip browser-extension \
  -x "browser-extension/README.md"
```

## 已知限制

- 与其他接管 newtab 的扩展互斥，同时只能启用一个。
- 企业/教育策略可能强制指定 newtab，会覆盖本扩展的行为。
- `chrome.runtime.onStartup` 在浏览器使用「继续上次打开的页面」恢复会话时仍会触发，已在 `background.js` 中通过「只更新空白 tab」策略避免打断用户。
