import { useState } from 'react';
import { Palette, PlaySquare, Type, Server as ServerIcon, Monitor, Menu, Eye, EyeOff } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { Switch, Dropdown, Button } from '../../components/ui';
import styles from './SettingsPage.module.css';

type TabId = 'appearance' | 'playback' | 'subtitles' | 'network';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');

  return (
    <div className={styles['settings-page']}>
      <div className={styles['settings-header']}>
        <h1 className={styles['settings-title']}>设置</h1>
      </div>

      <div className={styles['settings-content']}>
        {/* 左侧导航 */}
        <div className={styles['settings-nav']}>
          <button
            className={`${styles['nav-item']} ${activeTab === 'appearance' ? styles.active : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={20} /> 界面与主题
          </button>
          <button
            className={`${styles['nav-item']} ${activeTab === 'playback' ? styles.active : ''}`}
            onClick={() => setActiveTab('playback')}
          >
            <PlaySquare size={20} /> 播放设置
          </button>
          <button
            className={`${styles['nav-item']} ${activeTab === 'subtitles' ? styles.active : ''}`}
            onClick={() => setActiveTab('subtitles')}
          >
            <Type size={20} /> 字幕设置
          </button>
          <button
            className={`${styles['nav-item']} ${activeTab === 'network' ? styles.active : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <ServerIcon size={20} /> 服务器与网络
          </button>
        </div>

        {/* 右侧面板 */}
        <div className={styles['settings-panel']}>
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'playback' && <PlaybackSettings />}
          {activeTab === 'subtitles' && <SubtitleSettings />}
          {activeTab === 'network' && <NetworkSettings />}
        </div>
      </div>
    </div>
  );
}

function SortableItem({ id, label, isHidden, onToggle }: { id: string; label: string; isHidden: boolean; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${styles['sortable-item']} ${isDragging ? styles['is-dragging'] : ''} ${isHidden ? styles['is-hidden'] : ''}`}>
      <div className={styles['drag-handle-wrapper']} {...attributes} {...listeners}>
        <Menu size={16} className={styles['drag-handle']} />
      </div>
      <span className={styles['item-label']}>{label}</span>
      <button 
        className={styles['toggle-btn']} 
        onClick={() => onToggle(id)}
        title={isHidden ? "点击显示" : "点击隐藏"}
      >
        {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, themeColor, homeLayout, hiddenHomeModules = [], updateSettings } = useSettingsStore();

  const layoutLabels: Record<string, string> = {
    views: '我的资料库',
    resume: '继续观看',
    suggestions: '猜你喜欢',
    nextup: '下一集',
    latest: '最新加入',
  };

  // 兼容老数据：如果旧用户的 homeLayout 里没有 views，自动补充到前面
  if (!homeLayout.includes('views')) {
    setTimeout(() => {
      updateSettings({ homeLayout: ['views', ...homeLayout] });
    }, 0);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = homeLayout.indexOf(active.id as string);
      const newIndex = homeLayout.indexOf(over.id as string);
      updateSettings({ homeLayout: arrayMove(homeLayout, oldIndex, newIndex) });
    }
  };

  const toggleModule = (id: string) => {
    if (hiddenHomeModules.includes(id)) {
      updateSettings({ hiddenHomeModules: hiddenHomeModules.filter((m) => m !== id) });
    } else {
      updateSettings({ hiddenHomeModules: [...hiddenHomeModules, id] });
    }
  };

  return (
    <div>
      <h2 className={styles['panel-title']}>界面与主题</h2>
      
      <div className={styles['form-group']}>
        <label className={styles['form-label']}>颜色模式</label>
        <Dropdown
          trigger={<Button variant="secondary">{theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '跟随系统'}</Button>}
          items={[
            { id: 'system', label: '跟随系统', onClick: () => updateSettings({ theme: 'system' }) },
            { id: 'dark', label: '深色', onClick: () => updateSettings({ theme: 'dark' }) },
            { id: 'light', label: '浅色', onClick: () => updateSettings({ theme: 'light' }) },
          ]}
          align="left"
        />
        <p className={styles['form-desc']}>选择应用的颜色深浅模式。</p>
      </div>

      <div className={styles['form-group']}>
        <label className={styles['form-label']}>主题配色预设</label>
        <Dropdown
          trigger={
            <Button variant="secondary">
              {themeColor === 'infuse' ? 'Infuse (橙金)' : 
               themeColor === 'ocean' ? '海洋 (深蓝)' :
               themeColor === 'forest' ? '森林 (翠绿)' :
               themeColor === 'royal' ? '皇家 (亮紫)' : '樱花 (粉红)'}
            </Button>
          }
          items={[
            { id: 'infuse', label: 'Infuse (橙金)', onClick: () => updateSettings({ themeColor: 'infuse' }) },
            { id: 'ocean', label: '海洋 (深蓝)', onClick: () => updateSettings({ themeColor: 'ocean' }) },
            { id: 'forest', label: '森林 (翠绿)', onClick: () => updateSettings({ themeColor: 'forest' }) },
            { id: 'royal', label: '皇家 (亮紫)', onClick: () => updateSettings({ themeColor: 'royal' }) },
            { id: 'sakura', label: '樱花 (粉红)', onClick: () => updateSettings({ themeColor: 'sakura' }) },
          ]}
          align="left"
        />
        <p className={styles['form-desc']}>选择应用的主题强调色预设，定制你的个性化播放器体验。</p>
      </div>

      <div className={styles['form-group']}>
        <label className={styles['form-label']}>首页排版布局</label>
        <p className={styles['form-hint']}>拖动调整顺序，点击右侧眼睛图标隐藏/显示模块</p>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={homeLayout} strategy={verticalListSortingStrategy}>
            <div className={styles['sortable-list']}>
              {homeLayout.map((id) => (
                <SortableItem 
                  key={id} 
                  id={id} 
                  label={layoutLabels[id] || id} 
                  isHidden={hiddenHomeModules.includes(id)}
                  onToggle={toggleModule}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function PlaybackSettings() {
  const { hardwareDecoding, autoPlayNext, updateSettings } = useSettingsStore();

  return (
    <div>
      <h2 className={styles['panel-title']}>播放设置</h2>
      
      <div className={styles['form-group']}>
        <div className={styles['switch-group']}>
          <div>
            <div className={styles['form-label']} style={{ marginBottom: 0 }}>允许硬件解码 (WebCodecs)</div>
            <div className={styles['form-desc']} style={{ marginTop: 4 }}>
              优先使用浏览器的硬件加速解码器播放媒体。如果遇到黑屏或花屏，请尝试关闭此选项。
            </div>
          </div>
          <Switch checked={hardwareDecoding} onChange={(val) => updateSettings({ hardwareDecoding: val })} />
        </div>
      </div>

      <div className={styles['form-group']}>
        <div className={styles['switch-group']}>
          <div>
            <div className={styles['form-label']} style={{ marginBottom: 0 }}>自动播放下一集</div>
            <div className={styles['form-desc']} style={{ marginTop: 4 }}>
              剧集播放结束时自动倒计时并播放下一集。
            </div>
          </div>
          <Switch checked={autoPlayNext} onChange={(val) => updateSettings({ autoPlayNext: val })} />
        </div>
      </div>
    </div>
  );
}

function SubtitleSettings() {
  const { subtitleSize, updateSettings } = useSettingsStore();

  const sizeLabel = { small: '小', normal: '标准', large: '大', xlarge: '超大' };

  return (
    <div>
      <h2 className={styles['panel-title']}>字幕设置</h2>
      
      <div className={styles['form-group']}>
        <label className={styles['form-label']}>字幕大小</label>
        <Dropdown
          trigger={<Button variant="secondary">{sizeLabel[subtitleSize]}</Button>}
          items={[
            { id: 'small', label: '小', onClick: () => updateSettings({ subtitleSize: 'small' }) },
            { id: 'normal', label: '标准', onClick: () => updateSettings({ subtitleSize: 'normal' }) },
            { id: 'large', label: '大', onClick: () => updateSettings({ subtitleSize: 'large' }) },
            { id: 'xlarge', label: '超大', onClick: () => updateSettings({ subtitleSize: 'xlarge' }) },
          ]}
          align="left"
        />
      </div>
    </div>
  );
}

function NetworkSettings() {
  const servers = useAuthStore((s) => s.servers);
  const activeServerId = useAuthStore((s) => s.activeServerId);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div>
      <h2 className={styles['panel-title']}>服务器与网络</h2>
      
      <div className={styles['form-group']}>
        <label className={styles['form-label']}>已保存的服务器</label>
        <div className="flex flex-col gap-2 mt-2">
          {servers.map(server => (
            <div key={server.id} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center gap-3">
                <Monitor size={20} className="text-[var(--text-secondary)]" />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {server.name} {activeServerId === server.id && <span className="ml-2 text-xs text-accent bg-[var(--accent-subtle)] border border-[var(--accent-glow)] px-2 py-0.5 rounded-full">当前连接</span>}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">{server.url}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border-default)]">
        <Button variant="ghost" onClick={logout} className="!text-red-500 hover:!bg-red-500/10 hover:!border-red-500/30 border border-transparent">
          退出所有服务器
        </Button>
      </div>
    </div>
  );
}
