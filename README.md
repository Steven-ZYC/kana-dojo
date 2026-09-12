# かな道场 · Kana Dojo

一个面向中文学习者的日语假名学习网站。通过五十音记忆表、可定制的双向测验和日语输入训练，帮助学习者把平假名、片假名与浊音练成直觉。

**[立即开始练习](https://kana-dojo.stevenzhang.top/)**

## 功能

- 五十音记忆表：同时查看平假名、片假名和罗马字，可切换清音、浊音与半浊音，并支持遮住罗马字自测。
- 双向测验：支持“假名 → 罗马字”和“罗马字 → 假名”两种方向。
- 自定义题库：可限定平假名、片假名、清音、浊音或指定行，也提供常用快捷范围。
- 成绩反馈：每轮 10 题，显示进度、正确率和连续答对次数。
- 本地错题本：按平假名、片假名和练习方向分别记录错题，支持本轮重做、高频错题复习；连续复习答对 2 次后标记为已掌握，同时保留历史记录。
- 日语输入练习：句子中的汉字带假名标注，接受完整汉字句或整句假名读音。
- 键盘引导：练习模式提供罗马字序列、下一键提示和虚拟键盘高亮。
- 60 秒挑战：统计日语输入速度、准确率、用时和完成句数。
- 多端适配：兼容桌面与移动设备，支持白天和夜间模式。

## 技术栈

- [Vue 3](https://vuejs.org/) + TypeScript
- [Vite](https://vite.dev/)
- [Lucide](https://lucide.dev/) 图标
- 原生 CSS 响应式布局

## 本地运行

需要 Node.js 22.13+ 和 npm。

```bash
git clone https://github.com/Steven-ZYC/kana-dojo.git
cd kana-dojo
npm ci
npm run dev
```

访问终端显示的本地地址，通常为 `http://127.0.0.1:5173/`。

质量检查：

```bash
npm run check
```

生产构建与预览：

```bash
npm run build
npm run preview
```

自动格式化：

```bash
npm run format
```

## 项目结构

```text
├─ public/              # favicon、robots、sitemap 与 Web App 清单
├─ src/
│  ├─ App.vue           # 假名数据、学习模式与全部交互
│  ├─ env.d.ts           # Vue 单文件组件类型声明
│  ├─ main.ts           # Vue 入口
│  ├─ mistakeBook.ts     # 错题记录、掌握状态与本地存储格式
│  └─ style.css         # 主题、响应式布局与组件样式
├─ index.html           # 页面元信息与结构化数据
├─ package.json
└─ vite.config.ts
```

## SEO 与部署

规范域名为 `https://kana-dojo.stevenzhang.top/`。项目包含：

- canonical、robots、Open Graph 与 X 元信息
- Schema.org `WebApplication` 结构化数据
- `robots.txt` 与 `sitemap.xml`
- Web App manifest 与品牌 favicon

部署新版本后，请确认 sitemap 能通过规范域名访问，再将站点提交至需要使用的搜索引擎站长平台。

每次向 `main` 分支推送代码时，GitHub Actions 会自动运行质量检查、生成 `dist/`，并完成以下发布步骤：

- 上传名为 `kana-dojo-static` 的 Actions artifact，保留 30 天。
- 创建一个 `deploy-<run number>` GitHub Release，并附上永久保存的 `kana-dojo-static.tar.gz`。

服务器可以通过 GitHub Releases API，或使用 `gh release download --repo Steven-ZYC/kana-dojo --pattern kana-dojo-static.tar.gz` 获取最新版本，解压后将其中的静态文件发布到网站根目录。生产服务器无需安装 Node.js 或重新构建。由于仓库为私有仓库，服务器下载时需要具有仓库读取权限的 GitHub token。

## 数据与隐私

Kana Dojo 不需要账号，也不会把练习内容上传到服务器。所有测验和打字计算均在浏览器中完成。

主题偏好和错题本保存在当前浏览器的 `localStorage` 中，因此不同用户、浏览器或设备之间的数据互不相同，也不会自动同步。刷新或关闭页面后，本轮成绩仍不会保留，错题历史会继续保留。

## 当前限制

- 打字练习目前包含 5 个示例句子。
- 单轮成绩和正在进行的练习不会跨会话保存。
- Web App manifest 已配置，但暂不支持离线使用。
