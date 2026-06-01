import { useState, useRef } from 'react';
import { Search, Loader2, UploadCloud, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../Modal/Modal';
import { Button } from '../../ui';
import { uploadLocalSubtitle } from '../../../api/subtitles';
import styles from './SubtitleSearchModal.module.css';

interface SubtitleSearchModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemName?: string;
  onSuccess?: () => void;
}

export default function SubtitleSearchModal({
  open,
  onClose,
  itemId,
  itemName = '',
  onSuccess,
}: SubtitleSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 提取干净的电影名 (去除年份和多余符号)
  const cleanName = itemName.replace(/\s*\(\d{4}\).*$/, '').trim();

  // 上传 Mutatuion
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 提取扩展名
      const ext = file.name.split('.').pop()?.toLowerCase() || 'srt';
      const allowedExts = ['srt', 'ass', 'vtt', 'sub'];
      if (!allowedExts.includes(ext)) {
        throw new Error('不支持的字幕格式，仅支持 srt, ass, vtt, sub');
      }

      // 读取文件并转为 Base64
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            await uploadLocalSubtitle(itemId, 'chi', ext, base64Data);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      alert('字幕上传成功！播放器将自动重新挂载。');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      alert(`上传失败: ${err.message || '网络错误'}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExternalSearch = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="字幕管理中心"
      size="md"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose} disabled={uploadMutation.isPending}>
            关闭
          </Button>
        </div>
      }
    >
      <div className={styles['modal-container']}>
        {/* 选项卡 */}
        <div className={styles['tabs-header']}>
          <button
            className={`${styles['tab-btn']} ${activeTab === 'search' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('search')}
          >
            聚合导航搜索
          </button>
          <button
            className={`${styles['tab-btn']} ${activeTab === 'upload' ? styles['active'] : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            本地直传
          </button>
        </div>

        {/* 搜索 Tab */}
        {activeTab === 'search' && (
          <div className={styles['tab-content']}>
            <div className={styles['alert-box']}>
              因服务端未配置字幕插件，您可以通过下方快捷按钮前往主流字幕网站进行精确查找。<br/>
              当前影片识别为：<strong>{cleanName || '未知媒体'}</strong>
            </div>
            
            <div className={styles['buttons-grid']}>
              <Button
                variant="secondary"
                className={styles['search-btn']}
                leftIcon={<Search size={16} />}
                rightIcon={<ExternalLink size={14} className={styles['icon-dimmed']} />}
                onClick={() => handleExternalSearch(`https://subhd.tv/search/${encodeURIComponent(cleanName)}`)}
                disabled={!cleanName}
              >
                SubHD 搜索
              </Button>
              
              <Button
                variant="secondary"
                className={styles['search-btn']}
                leftIcon={<Search size={16} />}
                rightIcon={<ExternalLink size={14} className={styles['icon-dimmed']} />}
                onClick={() => handleExternalSearch(`https://zimuku.org/search?q=${encodeURIComponent(cleanName)}`)}
                disabled={!cleanName}
              >
                字幕库 (Zimuku)
              </Button>

              <Button
                variant="secondary"
                className={styles['search-btn']}
                leftIcon={<Search size={16} />}
                rightIcon={<ExternalLink size={14} className={styles['icon-dimmed']} />}
                onClick={() => handleExternalSearch(`https://assrt.net/sub/?searchword=${encodeURIComponent(cleanName)}`)}
                disabled={!cleanName}
              >
                伪射手 (Assrt)
              </Button>

              <Button
                variant="secondary"
                className={styles['search-btn']}
                leftIcon={<Search size={16} />}
                rightIcon={<ExternalLink size={14} className={styles['icon-dimmed']} />}
                onClick={() => handleExternalSearch(`https://www.opensubtitles.org/zh/search/sublanguageid-all/moviename-${encodeURIComponent(cleanName)}`)}
                disabled={!cleanName}
              >
                OpenSubtitles
              </Button>
            </div>
            
            <div className={styles['helper-text']}>
              * 下载字幕后，请切换到【本地直传】进行挂载
            </div>
          </div>
        )}

        {/* 上传 Tab */}
        {activeTab === 'upload' && (
          <div className={styles['upload-tab']}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".srt,.ass,.vtt,.sub"
              style={{ display: 'none' }}
            />
            
            <div 
              className={`${styles['upload-box']} ${uploadMutation.isPending ? styles['disabled'] : ''}`}
              onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <p>正在读取并上传...</p>
                </>
              ) : (
                <>
                  <UploadCloud size={48} style={{ color: 'var(--accent)' }} />
                  <div className={styles['upload-text']}>
                    <strong>点击选择本地字幕文件</strong>
                    <span>支持 SRT / ASS / VTT 格式</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
