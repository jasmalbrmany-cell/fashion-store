import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

interface ImageUploaderProps {
  images: { id: string; url: string; isPrimary: boolean }[];
  onImagesChange: (images: { id: string; url: string; isPrimary: boolean }[]) => void;
  maxImages?: number;
  isRTL?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  isRTL = false
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (images.length + fileArray.length > maxImages) {
      alert(`يمكنك رفع ${maxImages} صور فقط`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = fileArray.map(async (originalFile, index) => {
        const fileId = `${Date.now()}-${index}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Compress image
          const file = await compressImage(originalFile, 1200, 0.8);

          if (!isSupabaseConfigured()) {
            // Fallback: create local URL
            const url = URL.createObjectURL(file);
            setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
            return { id: fileId, url, isPrimary: images.length === 0 };
          }

          // Upload to Supabase
          const fileExt = file.name.split('.').pop();
          const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage
            .from('product-images')
            .getPublicUrl(data.path);

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

          return {
            id: fileId,
            url: publicData.publicUrl,
            isPrimary: images.length === 0
          };
        } catch (err) {
          console.error('Upload error:', err);
          setUploadProgress(prev => ({ ...prev, [fileId]: -1 }));
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(r => r !== null) as typeof images;
      
      onImagesChange([...images, ...successfulUploads]);
      setUploadProgress({});
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    onImagesChange(
      images.map(img => ({
        ...img,
        isPrimary: img.id === id
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={isUploading || images.length >= maxImages}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <p className="font-bold text-gray-600">جاري الرفع...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-bold text-gray-900">اضغط لرفع صور</p>
                <p className="text-sm text-gray-500">أو اسحب الصور هنا</p>
                <p className="text-xs text-gray-400 mt-1">
                  {images.length}/{maxImages} صور
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            const progress = uploadProgress[image.id];
            const isLoading = progress !== undefined && progress < 100;
            const isFailed = progress === -1;

            return (
              <div
                key={image.id}
                className="relative group rounded-2xl overflow-hidden bg-gray-100 aspect-square"
              >
                {/* Image */}
                <img
                  src={image.url}
                  alt="Product"
                  className="w-full h-full object-cover"
                />

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white mx-auto mb-2" />
                      <p className="text-xs text-white font-bold">{progress}%</p>
                    </div>
                  </div>
                )}

                {/* Failed Overlay */}
                {isFailed && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <p className="text-xs text-white font-bold">فشل الرفع</p>
                  </div>
                )}

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded-lg text-xs font-bold">
                    الصورة الرئيسية
                  </div>
                )}

                {/* Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
                      title="اجعلها الصورة الرئيسية"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title="حذف الصورة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 font-bold">
        💡 يمكنك رفع حتى {maxImages} صور. الصورة الأولى ستكون الصورة الرئيسية.
      </div>
    </div>
  );
};
