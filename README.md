# JellyPlayer

JellyPlayer 是一个专为 Jellyfin 打造的**现代化、响应式、企业级高颜值的 Web 客户端**。它彻底抛弃了原生客户端简陋的界面，采用了受 Infuse 8 和 Apple TV 启发的设计美学，为您提供极具沉浸感的流媒体视听体验。

## ✨ 核心特性 (Features)

### 🎨 极致的视觉享受
- **动态模糊与玻璃拟态**：全站大规模采用 Backdrop Blur 毛玻璃特效，背景会随着当前海报的色彩动态改变（主导色提取技术）。
- **流畅丝滑的动画 (Framer Motion)**：从路由切换、卡片悬停到弹出对话框，每一处交互都伴随 60fps 的顺滑弹性动画。
- **现代化海报墙**：支持 4 种无缝切换的海报尺寸（小、中、大、超大），以及信息量更丰富的纯列表模式。
- **动态主题系统**：内置 Infuse、Ocean、Forest、Royal 等多款精心调校的颜色主题，支持深浅色模式与系统跟随。

### 🚀 强悍的播放内核
- **HLS 原生支持**：内嵌最新版 `hls.js` 引擎，完美兼容 Jellyfin 的 Direct Play 和 Transcoding (转码) 串流。
- **企业级播放器 UI**：参考主流流媒体平台的控制栏设计，底部进度条支持悬浮拖拽、音频轨/字幕流实时切换、画中画(PiP)、全屏模式。

### 🔄 实时响应与性能
- **全局 WebSocket 同步**：后台自动维持长连接，任何新入库的电影或在其他设备上的播放进度，都会**实时无缝**同步到当前页面，彻底告别 F5 刷新。
- **深度缓存策略**：底层采用 `TanStack Query` 配合持久化存储，哪怕服务器短暂失联，依然能秒开页面并提供离线浏览体验。
- **代码分割与懒加载**：极速的首屏加载体验，核心组件按需动态加载。

### 🛠 进阶功能
- **全维度的筛选系统**：年代、流派、是否观看、收藏状态一键过滤；首字母侧边栏极速跳转定位。
- **数据分析大盘**：内置 `Recharts` 图表库生成年度观影报告（流派偏好饼图、播放时长柱状图）。
- **合集与播放列表**：完美兼容 Jellyfin 后端的 BoxSets 和 Playlists 设定。
- **同步观影 (SyncPlay)**：内置精美的房间大厅，轻松与远方的朋友组局同时观影。

---

## 💻 本地部署与开发

### 1. 环境准备
请确保您的设备已安装 [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)。

### 2. 克隆与安装依赖
```bash
git clone <repository-url>
cd mediaplayer
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问控制台输出的地址（通常为 `http://localhost:5173`）即可。

### 4. 构建生产环境代码
```bash
npm run build
```
编译后得到的高性能静态文件将会输出在 `dist` 目录中。

---

## 📺 Android TV 客户端部署

本项目现已全面接入 **Capacitor 原生引擎** 与 **Norigin Spatial Navigation (空间焦点导航)**，完美支持直接打包为可供遥控器操作的 Android TV 电视端 APK！

### 云端一键打包 (推荐给普通用户)
前往本项目的 GitHub 页面，点击 **`Actions`** 选项卡。
选择左侧的 `Build Android TV APK` 工作流，点击 **Run workflow**。
等待两分钟后，即可在构建产物中直接下载 `mediaplayer-tv-debug.apk` 安装到您的智能电视上！

### 本地原生编译 (推荐给开发者)
如果您想修改 Android 底层代码（如接入 ExoPlayer 硬件解码），请确保安装了 Android Studio。
```bash
npm run build
npx cap sync android
```
随后使用 Android Studio 打开项目根目录下的 `android` 文件夹即可进行原生调试与打包。

---

## 🗺 架构技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 8 + SWC
- **样式方案**: TailwindCSS v4 + Vanilla CSS Variables
- **状态管理**: Zustand (带持久化存储)
- **数据请求**: Axios + TanStack React Query (带持久化缓存)
- **动画与图标**: Framer Motion + Lucide React
- **流媒体引擎**: hls.js
- **图表库**: Recharts

---

## 📝 鸣谢
本项目旨在提供更好的 Jellyfin 前端体验，后端依然完全依赖于强大的 [Jellyfin](https://jellyfin.org/) 开源生态。
# JellyPlayer
