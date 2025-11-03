import React, { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

const ImageUpload = ({ 
  images = [], 
  onChange,
  onImagesChange, 
  maxImages = 10,
  multiple = true 
}) => {
  // Convert string URLs to objects with id if needed
  const normalizeImages = (imgs) => {
    return imgs.map((img, index) => {
      if (typeof img === 'string') {
        return {
          id: `img_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          url: img
        };
      }
      return img;
    });
  };

  const [previews, setPreviews] = useState(normalizeImages(images));
  const fileInputRef = useRef(null);

  // Update previews when images prop changes
  useEffect(() => {
    setPreviews(normalizeImages(images));
  }, [images]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (previews.length + files.length > maxImages) {
      console.warn(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh`);
      return;
    }

    const newPreviews = [];
    const readers = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        console.warn('Vui lòng chỉ chọn file ảnh');
        return;
      }

      // Check file size (max 500KB for base64 storage)
      if (file.size > 500000) {
        console.warn(`File ${file.name} quá lớn. Vui lòng chọn ảnh nhỏ hơn 500KB`);
        return;
      }

      const reader = new FileReader();
      readers.push(
        new Promise((resolve) => {
          reader.onloadend = () => {
            newPreviews.push({
              id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: reader.result,
              file
            });
            resolve();
          };
          reader.readAsDataURL(file);
        })
      );
    });

    Promise.all(readers).then(() => {
      const updated = [...previews, ...newPreviews];
      setPreviews(updated);
      // Call both callbacks for backward compatibility
      const urls = updated.map(img => img.url);
      if (onImagesChange) onImagesChange(urls);
      if (onChange) onChange(urls);
    });
  };

  const handleRemoveImage = (id) => {
    const updated = previews.filter(img => img.id !== id);
    setPreviews(updated);
    // Call both callbacks for backward compatibility
    const urls = updated.map(img => img.url);
    if (onImagesChange) onImagesChange(urls);
    if (onChange) onChange(urls);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {previews.map((preview) => (
          <div
            key={preview.id}
            style={{
              position: 'relative',
              paddingTop: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#F3F4F6'
            }}
          >
            <img
              src={preview.url}
              alt="Preview"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <button
              onClick={() => handleRemoveImage(preview.id)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {previews.length < maxImages && (
          <button
            onClick={handleClick}
            style={{
              position: 'relative',
              paddingTop: '100%',
              border: '2px dashed #D1D5DB',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4F46E5';
              e.currentTarget.style.backgroundColor = '#EEF2FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: '#6B7280'
            }}>
              <Upload size={32} />
              <span style={{ fontSize: '12px', textAlign: 'center' }}>
                Tải ảnh lên
              </span>
            </div>
          </button>
        )}
      </div>

      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        textAlign: 'center'
      }}>
        {previews.length}/{maxImages} ảnh
      </p>
    </div>
  );
};

export default ImageUpload;