import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';

const NODE_ENV = import.meta.env.VITE_NODE_ENV;
// Use relative URLs in production (same domain), absolute in development
const API_URL = NODE_ENV === 'development' ? 'http://localhost:3001' : '';

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

      // Guard against zero dimensions before metadata is ready
      const width = video.videoWidth || video.clientWidth || 640;
      const height = video.videoHeight || video.clientHeight || 480;
      canvas.width = width;
      canvas.height = height;

      canvas.getContext('2d').drawImage(video, 0, 0, width, height);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
      setStatus('Processing image with Google Vision…');
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
      setMatches(matches.map(m => m.fragrance || m.metadata || {}).filter(Boolean));
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
    <div className="min-h-screen bg-[#F8F9FA] p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif italic text-gray-900 mb-8">Scan Fragrance</h1>
        
        {!isScanning && !capturedImage && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Scan a Fragrance Bottle</h2>
            <p className="text-gray-500 mb-8">Point your camera at the fragrance bottle label to identify it</p>
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Scanning
            </button>
          </div>
        )}

        {isScanning && (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white rounded-2xl w-64 h-96 opacity-50"></div>
              </div>
            </div>
            <div className="p-6 flex gap-4 flex-wrap items-center">
              {status && (
                <p className="text-sm text-gray-500 mb-2 w-full">{status}</p>
              )}
              <button
                onClick={capturePhoto}
                className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Processing image...</p>
          </div>
        )}

        {capturedImage && !isProcessing && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Captured Image</h3>
              <img src={capturedImage} alt="Captured" className="w-full max-w-md mx-auto rounded-2xl" />
              {extractedText && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Extracted Text:</p>
                  <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">{extractedText}</p>
                </div>
              )}
            </div>

            {matches.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Matches Found</h3>
                <div className="space-y-3">
                  {matches.map((fragrance, index) => {
                    const fragranceIndex = fragranceData.indexOf(fragrance);
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(`/fragrance/${fragranceIndex + 1}`)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left border border-gray-100"
                      >
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                          {fragrance['Image URL'] ? (
                            <img src={fragrance['Image URL']} alt={fragrance.Name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{fragrance.Name}</h4>
                          <p className="text-sm text-gray-500">{fragrance.Brand}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : extractedText && (
              <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                <p className="text-gray-600 mb-4">No matches found. Try scanning again or search manually.</p>
              </div>
            )}

            {/* Scan Again button always available after a capture */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setExtractedText('');
                  setMatches([]);
                  setStatus('');
                  setIsProcessing(false);
                  setIsScanning(false);
                }}
                className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
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

