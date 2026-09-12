# かな道场 · Kana Dojo

一个面向中文学习者的日语假名学习网站。通过五十音记忆表、可定制的双向测验和日语输入训练，帮助学习者把平假名、片假名与浊音练成直觉。

**[立即开始练习](https://kana-dojo.stevenzhang.top/)**

## 功能

- 五十音记忆表：同时查看平假名、片假名和罗马字，可切换清音、浊音与半浊音，并支持遮住罗马字自测。
- 双向测验：支持“假名 → 罗马字”和“罗马字 → 假名”两种方向。
- 自定义题库：可限定平假名、片假名、清音、浊音或指定行，也提供常用快捷范围。
- 成绩反馈：每轮 10 题，显示进度、正确率和连续答对次数。
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

## 数据与隐私

Kana Dojo 不需要账号，也不会把练习内容上传到服务器。所有测验和打字计算均在浏览器中完成。

目前只有主题偏好保存在浏览器本地；刷新或关闭页面后，本轮成绩和练习状态不会保留。

## 当前限制

- 打字练习目前包含 5 个示例句子。
- 成绩和练习进度不会跨会话保存。
- Web App manifest 已配置，但暂不支持离线使用。
