import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';

const NODE_ENV = import.meta.env.VITE_NODE_ENV;
// Use relative URLs in production (same domain), absolute in development
const API_URL = NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://cologne-recommender-production.up.railway.app';

const ScanFragrance = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [matches, setMatches] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(''); // user-facing status updates
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // Start camera
  const startCamera = async () => {
    try {
      // Immediately reflect UI state while we request the camera
      setIsScanning(true);
      setStatus('Camera on. Align the bottle in the frame, then tap Capture.');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Some browsers need an explicit play() call
        const playPromise = videoRef.current.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(err => {
            console.warn('Video play was blocked:', err);
          });
        }
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Actual video resolution
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Get displayed dimensions of the video element
      const rect = video.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Calculate actual video content size within the element (handling object-contain)
      const videoRatio = videoWidth / videoHeight;
      const displayRatio = displayWidth / displayHeight;
      
      let actualContentWidth, actualContentHeight;
      if (displayRatio > videoRatio) {
        // Video is height-constrained
        actualContentHeight = displayHeight;
        actualContentWidth = displayHeight * videoRatio;
      } else {
        // Video is width-constrained
        actualContentWidth = displayWidth;
        actualContentHeight = displayWidth / videoRatio;
      }

      // Guide rectangle dimensions in display pixels (w-48/h-72 or sm:w-64/h-96)
      const isSm = window.innerWidth >= 640;
      const guideWidth = isSm ? 256 : 192;
      const guideHeight = isSm ? 384 : 288;

      // Calculate scale between display and actual resolution
      const scaleX = videoWidth / actualContentWidth;
      const scaleY = videoHeight / actualContentHeight;

      // Center of the video element
      const elementCenterX = displayWidth / 2;
      const elementCenterY = displayHeight / 2;

      // Guide rectangle bounds relative to element center
      const rectX = elementCenterX - (guideWidth / 2);
      const rectY = elementCenterY - (guideHeight / 2);

      // Offset of the video content within the element (due to object-contain)
      const contentOffsetX = (displayWidth - actualContentWidth) / 2;
      const contentOffsetY = (displayHeight - actualContentHeight) / 2;

      // Map guide rectangle to actual video coordinates
      const sourceX = (rectX - contentOffsetX) * scaleX;
      const sourceY = (rectY - contentOffsetY) * scaleY;
      const sourceWidth = guideWidth * scaleX;
      const sourceHeight = guideHeight * scaleY;

      // Set canvas to the cropped size (preserving guide aspect ratio)
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const ctx = canvas.getContext('2d');
      // Crop to the guide area before converting to base64
      ctx.drawImage(
        video,
        sourceX, sourceY, sourceWidth, sourceHeight, // Source crop
        0, 0, sourceWidth, sourceHeight            // Destination
      );

      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
      setStatus('Processing image…');
      processImage(imageData);
    }
  };

  // Process image via backend (Vertex embedding + Pinecone)
  const processImage = async (imageData) => {
    setIsProcessing(true);
    setMatches([]);
    setExtractedText('');
    setStatus('Sending to scan service…');
    
    try {
      console.log("API_URL", API_URL);
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`Scan API HTTP ${response.status}`);
      }

      const data = await response.json();
      const matches = data.matches || [];
      setExtractedText('');
      setMatches(matches.filter(m => m.fragrance)); // Only keep matches that have fragrance data
      if (matches.length === 0) {
        setStatus('No matches found.');
      } else {
        setStatus(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}.`);
      }
    } catch (error) {
      console.error('Scan API Error:', error);
      setStatus('Failed to process image. Please try again.');
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // findMatches is now handled server-side

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 container-padding pt-24 sm:pt-28">
      <div className="max-w-4xl mx-auto">
        <div className="text-center sm:text-left mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">Scan Fragrance</h1>
          <p className="text-sm sm:text-base text-gray-400">Identify a bottle using AI vision</p>
        </div>
        
        {!isScanning && !capturedImage && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute -inset-0.5 bg-blue-300 rounded-2xl sm:rounded-3xl opacity-10 blur-sm"></div>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-white mb-2 sm:mb-4">Scan a Bottle</h2>
              <p className="text-xs sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">Point your camera at the fragrance bottle label to identify it</p>
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white rounded-full font-medium transition-colors shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                Start Scanning
              </button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="relative bg-black aspect-[3/4] sm:aspect-auto">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full sm:max-h-[70vh] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-blue-400/50 rounded-2xl w-48 h-72 sm:w-64 sm:h-96 shadow-[0_0_30px_rgba(59,130,246,0.2)]"></div>
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 items-center bg-gray-900/50">
              {status && (
                <p className="text-[10px] sm:text-sm text-gray-400 text-center w-full">{status}</p>
              )}
              <div className="flex gap-3 w-full">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-6 py-3 sm:py-4 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white rounded-full font-medium transition-colors backdrop-blur-sm shadow-lg"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 sm:py-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-300 rounded-full font-medium transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-8 sm:p-12 text-center">
            <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-400">Analyzing bottle details...</p>
          </div>
        )}

        {capturedImage && !isProcessing && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-4 sm:p-6">
              <h3 className="text-base sm:text-xl font-medium text-white mb-3 sm:mb-4">Captured Image</h3>
              <div className="relative max-w-sm mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-gray-700/50 shadow-lg">
                <img src={capturedImage} alt="Captured" className="w-full h-auto" />
              </div>
              {extractedText && (
                <div className="mt-4 p-3 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-1 uppercase tracking-wider">Detected Text</p>
                  <p className="text-xs sm:text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">{extractedText}</p>
                </div>
              )}
            </div>

            {matches.length > 0 ? (
              <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-4 sm:p-6">
                <h3 className="text-base sm:text-xl font-medium text-white mb-3 sm:mb-4">Results</h3>
                <div className="space-y-2 sm:space-y-3">
                  {matches.map((match, index) => {
                    const fragrance = match.fragrance;
                    const fragranceIndex = fragranceData.findIndex(f => f.id === fragrance.id);
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(`/fragrance/${fragranceIndex + 1}`)}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-700/50 rounded-xl transition-colors text-left border border-gray-700/50"
                      >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700/50 flex-shrink-0 overflow-hidden border border-gray-600/50">
                          {fragrance['Image URL'] ? (
                            <img src={fragrance['Image URL']} alt={fragrance.Name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm sm:text-base truncate">{fragrance.Name}</h4>
                          <p className="text-[10px] sm:text-sm text-gray-400 truncate">{fragrance.Brand}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : extractedText && (
              <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-6 sm:p-8 text-center">
                <p className="text-xs sm:text-base text-gray-400 mb-3 sm:mb-4">No matches found. Try scanning again or search manually.</p>
              </div>
            )}

            <div className="flex justify-center pb-8">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setExtractedText('');
                  setMatches([]);
                  setStatus('');
                  setIsProcessing(false);
                  setIsScanning(false);
                }}
                className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white rounded-full font-medium transition-colors backdrop-blur-sm shadow-lg"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default ScanFragrance;

