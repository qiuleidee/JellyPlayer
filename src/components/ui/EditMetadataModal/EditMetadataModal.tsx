import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../Modal/Modal';
import { Button, Input } from '../../ui';
import { updateItemMetadata } from '../../../api/metadata';
import styles from './EditMetadataModal.module.css';

interface EditMetadataModalProps {
  open: boolean;
  onClose: () => void;
  item: any; // 原始 DTO
  onSuccess?: () => void;
}

export default function EditMetadataModal({ open, onClose, item, onSuccess }: EditMetadataModalProps) {
  const [formData, setFormData] = useState({
    Name: '',
    OriginalTitle: '',
    Overview: '',
    ProductionYear: '',
  });

  useEffect(() => {
    if (open && item) {
      setFormData({
        Name: item.Name || '',
        OriginalTitle: item.OriginalTitle || '',
        Overview: item.Overview || '',
        ProductionYear: item.ProductionYear ? String(item.ProductionYear) : '',
      });
    }
  }, [open, item]);

  const updateMutation = useMutation({
    mutationFn: async (updatedItem: any) => {
      await updateItemMetadata(item.Id, updatedItem);
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 合并表单数据到原始 DTO
    const updatedItem = {
      ...item,
      Name: formData.Name,
      OriginalTitle: formData.OriginalTitle,
      Overview: formData.Overview,
      ProductionYear: formData.ProductionYear ? parseInt(formData.ProductionYear, 10) : undefined,
    };

    updateMutation.mutate(updatedItem);
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑元数据" size="md">
      <form onSubmit={handleSubmit} className={styles['form-container']}>
        <div className={styles['form-group']}>
          <label>标题</label>
          <Input 
            value={formData.Name} 
            onChange={(e) => setFormData({ ...formData, Name: e.target.value })} 
            required
            autoFocus
          />
        </div>

        <div className={styles['form-group']}>
          <label>原名</label>
          <Input 
            value={formData.OriginalTitle} 
            onChange={(e) => setFormData({ ...formData, OriginalTitle: e.target.value })} 
          />
        </div>

        <div className={styles['form-group']}>
          <label>年份</label>
          <Input 
            type="number"
            value={formData.ProductionYear} 
            onChange={(e) => setFormData({ ...formData, ProductionYear: e.target.value })} 
          />
        </div>

        <div className={styles['form-group']}>
          <label>简介</label>
          <textarea
            className={styles['textarea']}
            value={formData.Overview}
            onChange={(e) => setFormData({ ...formData, Overview: e.target.value })}
            rows={5}
          />
        </div>

        <div className={styles['form-actions']}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>
            取消
          </Button>
          <Button type="submit" disabled={updateMutation.isPending} leftIcon={<Save size={16} />}>
            {updateMutation.isPending ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
