import { useState } from 'react';
import { Users, Play, Plus, LogIn, Link2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { createSyncPlayGroup, joinSyncPlayGroup } from '../../api/syncplay';

export function SyncPlayPage() {
  const [groupId, setGroupId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleCreateGroup = async () => {
    setIsCreating(true);
    try {
      await createSyncPlayGroup();
      toast({
        title: '房间创建成功',
        message: '您已成功创建同步观影房间，快去邀请好友吧！',
        type: 'success'
      });
      // 真实项目中这里应更新房间状态或跳转至观影大厅
    } catch (err: any) {
      toast({
        title: '创建失败',
        message: err.message || '无法创建同步观影房间',
        type: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId.trim()) {
      toast({ title: '参数错误', message: '请输入房间 ID', type: 'warning' });
      return;
    }
    
    setIsJoining(true);
    try {
      await joinSyncPlayGroup(groupId.trim());
      toast({
        title: '加入成功',
        message: '您已成功加入同步观影房间！',
        type: 'success'
      });
      // 真实项目中这里应跳转至房间大厅
    } catch (err: any) {
      toast({
        title: '加入失败',
        message: err.message || '无法加入房间，请检查 ID 是否正确',
        type: 'error'
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-700">
      {/* 头部展示区域 */}
      <div className="relative mb-12 p-10 rounded-[2rem] overflow-hidden glass border border-[var(--border-subtle)] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent opacity-80"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30 backdrop-blur-xl shadow-glow">
            <Users size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] tracking-tight mb-4">SyncPlay 同步观影</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
            距离不再是问题。与远方的家人或朋友共同观看同一部电影，播放进度与操作实时同步，随时分享精彩瞬间。
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 创建房间卡片 */}
        <div className="p-8 rounded-3xl glass border border-[var(--border-subtle)] flex flex-col items-center text-center group hover:border-indigo-500/50 transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">创建放映室</h2>
          <p className="text-[var(--text-secondary)] mb-8 flex-1">
            创建一个全新的专属房间，生成邀请链接，让好友加入您的电影之夜。
          </p>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating}
            variant="primary" 
            className="w-full py-4 text-lg rounded-xl shadow-glow"
          >
            {isCreating ? '创建中...' : '新建房间'}
          </Button>
        </div>

        {/* 加入房间卡片 */}
        <div className="p-8 rounded-3xl glass border border-[var(--border-subtle)] flex flex-col items-center text-center group hover:border-purple-500/50 transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">加入放映室</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            已有邀请码？输入好友分享的房间 ID，立刻加入他们的电影世界。
          </p>
          
          <div className="w-full space-y-4">
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
              <input
                type="text"
                placeholder="请输入房间 ID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-center tracking-wider font-mono"
              />
            </div>
            <Button 
              onClick={handleJoinGroup} 
              disabled={isJoining || !groupId}
              className="w-full py-4 text-lg rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-glow"
            >
              {isJoining ? '连接中...' : '加入房间'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* 功能占位 */}
      <div className="mt-12 p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center gap-4 opacity-70">
        <div className="p-3 bg-[var(--bg-base)] rounded-xl text-yellow-500">
          <Play size={24} />
        </div>
        <div>
          <h3 className="font-bold text-[var(--text-primary)]">当前正在开发中</h3>
          <p className="text-sm text-[var(--text-secondary)]">播放器内部已支持底层 SyncPlay 协议，目前我们正在完善实时互动聊天面板。</p>
        </div>
      </div>
    </div>
  );
}
