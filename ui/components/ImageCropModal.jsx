import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const ImageCropModal = ({ isOpen, onClose, onCropComplete, initialImage }) => {
  const [imgSrc, setImgSrc] = useState(initialImage || '');
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
    aspect: 1 // Square crop for profile pictures
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
  }, []);

  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Set canvas size to the crop size
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Draw the cropped image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return canvas;
  }, [completedCrop]);

  const handleCropComplete = () => {
    const canvas = generateCroppedImage();
    if (canvas) {
      // Convert canvas to Blob instead of base64
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
            onClose();
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onMouseDown={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crop className="w-6 h-6" />
            Crop Profile Picture
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!imgSrc ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-md">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Crop className="w-12 h-12 text-indigo-600 mb-3" />
                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-200 font-semibold">
                      Click to upload profile picture
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG or JPEG (Max 5MB)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <button
                  onClick={handleRotate}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">{scale.toFixed(1)}x</span>
                </div>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>

              {/* Crop Area */}
              <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: '60vh',
                      maxWidth: '100%'
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              {/* Preview */}
              {completedCrop && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Preview:</p>
                  <div className="relative">
                    <canvas
                      ref={previewCanvasRef}
                      className="rounded-full border-4 border-indigo-200 shadow-lg"
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Hidden canvas for generating preview */}
              {completedCrop && (
                <canvas
                  ref={previewCanvasRef}
                  style={{ display: 'none' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {imgSrc && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-between gap-3">
            <button
              onClick={() => {
                setImgSrc('');
                setCompletedCrop(null);
                setScale(1);
                setRotate(0);
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Change Image
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                disabled={!completedCrop}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
              >
                Apply Crop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropModal;
