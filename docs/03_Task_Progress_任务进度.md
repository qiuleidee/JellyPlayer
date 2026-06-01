# JellyPlayer v2.0 核心开发任务清单

## 阶段一：发烧友级视听徽章系统 (Media Info Badges)

- [x] 1.1 解析 MediaSources 与提取音视频规格
- [x] 1.2 创建 MediaBadges UI 组件（SVG 图标与玻璃质感）
- [x] 1.3 在 DetailPage 中渲染高级徽章
- [x] 1.4 在 PlayerPage 信息栏渲染高级徽章

## 阶段二：播放器内核极客进阶 (Player Pro Features)

- [x] 2.1 封装音轨/字幕流解析钩子 (useMediaStreams)
- [x] 2.2 实现底层 hls.js 音轨与字幕无缝热切换
- [x] 2.3 获取章节信息 (Chapters) 并在进度条渲染分割点
- [x] 2.4 解析片头片尾时间戳并实现"自动跳过片头"浮层交互

## 阶段三：高度个性化与动态主题 (Customization & Themes)

- [x] 3.1 引入 @dnd-kit 并创建首页布局拖拽排序组件
- [x] 3.2 在 SettingsPage 添加可视化排版配置
- [x] 3.3 完善 Ocean / Forest 主题的 CSS Variables
- [x] 3.4 实现全局主题的无缝切换

## 阶段四：元数据手动修正与刮削 (Fix Match)

- [x] 4.1 在 api 层封装搜刮器相关接口 (Search, Apply)
- [x] 4.2 创建 IdentifyModal 搜刮弹窗组件
- [x] 4.3 在详情页 (DetailPage) 和后台管理 (AdminPage) 添加"识别/修正匹配"按钮
- [x] 4.4 走通查询、选择结果、应用刮削并触发详情刷新的完整闭环

## 阶段五：在线字幕中心 (Subtitles Hub)

- [x] 5.1 编写字幕搜索 API (Search Remote Subtitles) 和下载 API
- [x] 5.2 创建 SubtitleSearchModal 交互浮层
- [x] 5.3 集成到详情页，允许点击后直接搜寻并挂载字幕下载并动态挂载至播放器底层

## 阶段六：SyncPlay 多人协同与互动 (SyncPlay Ultimate)

- [x] 6.1 封装 WebSocket SyncPlayCommand 同步处理器
- [x] 6.2 引入防抖与播放器时间轴延迟补偿算法
- [x] 6.3 搭建浮动式聊天面板与弹幕层
- [x] 6.4 实现房间内用户连接状态的实时渲染
