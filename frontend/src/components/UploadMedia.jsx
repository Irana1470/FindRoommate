import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function UploadMedia({
  previews,
  files,
  setFiles,
  setPreviews,
  videoPreview,
  setVideoPreview,
  videoFile,
  setVideoFile,
  existingImages,
  setExistingImages,
  existingVideo,
  setExistingVideo,
  isEditMode,
}) {
  const appendMedia = useCallback(acceptedFiles => {
    if (!acceptedFiles.length) {
      return;
    }

    const imageFiles = acceptedFiles.filter(file => file.type?.startsWith('image/'));
    const videoFiles = acceptedFiles.filter(file => file.type?.startsWith('video/'));

    if (imageFiles.length > 0) {
      setFiles(prev => [...prev, ...imageFiles]);
      setPreviews(prev => [...prev, ...imageFiles.map(file => URL.createObjectURL(file))]);
    }

    if (videoFiles.length > 0) {
      const nextVideo = videoFiles[0];
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(nextVideo);
      setVideoPreview(URL.createObjectURL(nextVideo));

      if (videoFiles.length > 1) {
        toast('Chỉ hỗ trợ 1 video cho mỗi bài đăng, mình đã giữ video đầu tiên.');
      } else if (acceptedFiles.length > 1 && imageFiles.length > 0) {
        toast.success('Đã thêm ảnh và video vào bài đăng.');
      }
    }
  }, [setFiles, setPreviews, setVideoFile, setVideoPreview, videoPreview]);

  const onDrop = useCallback(accepted => {
    appendMedia(accepted);
  }, [appendMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    multiple: true,
  });

  useEffect(() => () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
  }, [previews, videoPreview]);

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo('');
  };

  const removePreviewImage = index => {
    URL.revokeObjectURL(previews[index]);
    setFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="form-group">
      <label className="form-label">Ảnh và video</label>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <span style={{ fontSize: 40 }}>📸</span>
          <p>{isDragActive ? 'Thả ảnh hoặc video vào đây...' : 'Kéo thả hoặc click để chọn ảnh và video'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hỗ trợ JPG, PNG, WEBP và 1 video MP4/MOV/WebM</p>
        </div>
      </div>

      {isEditMode && (existingImages.length > 0 || existingVideo) && (
        <div className="media-existing-group">
          <div className="form-note">Media hiện tại của bài đăng</div>
          {existingImages.length > 0 && (
            <div className="preview-grid">
              {existingImages.map((src, index) => (
                <div key={`${src}-${index}`} className="preview-item preview-item-static">
                  <img src={src} alt="" />
                  <button
                    type="button"
                    className="preview-remove"
                    onClick={() => {
                      setExistingImages(current => current.filter((_, itemIndex) => itemIndex !== index));
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          {existingVideo && !videoPreview && (
            <div className="video-preview-card">
              <video src={existingVideo} controls className="video-preview-player" />
              <button
                type="button"
                className="preview-remove preview-remove-video"
                onClick={removeVideo}
              >
                x
              </button>
            </div>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <div className="media-preview-group">
          <div className="form-note">Ảnh mới sẽ được thêm vào bộ ảnh hiện tại.</div>
          <div className="preview-grid">
            {previews.map((src, index) => (
              <div key={index} className="preview-item">
                <img src={src} alt="" />
                <button
                  type="button"
                  className="preview-remove"
                  onClick={() => removePreviewImage(index)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {videoPreview && (
        <div className="media-preview-group">
          <div className="form-note">
            {videoFile ? 'Video mới sẽ thay thế video hiện tại.' : 'Video hiện tại của bài đăng.'}
          </div>
          <div className="video-preview-card">
            <video
              src={videoPreview}
              controls
              className="video-preview-player"
            />
            <button
              type="button"
              className="preview-remove preview-remove-video"
              onClick={removeVideo}
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
