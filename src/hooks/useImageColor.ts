import { useState, useEffect } from 'react';

export function useImageColor(imageUrl?: string | null) {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // 极度缩小图片以快速计算平均色
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          // 忽略完全透明的像素
          if (data[i + 3] < 128) continue;
          
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          setColor(`${r}, ${g}, ${b}`); // 返回 rgb 数值部分，方便在 CSS 中使用 rgba()
        }
      } catch (err) {
        console.warn('Failed to extract image color', err);
      }
    };
  }, [imageUrl]);

  return color;
}
