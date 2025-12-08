import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';

const ScanFragrance = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [matches, setMatches] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
      processImage(imageData);
    }
  };

  // Process image with OCR
  const processImage = async (imageData) => {
    setIsProcessing(true);
    
    try {
      // Use Tesseract.js for client-side OCR
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      setExtractedText(text);
      findMatches(text);
      
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Find matching fragrances
  const findMatches = (text) => {
    const searchTerms = text
      .split(/\s+/)
      .filter(term => term.length > 2)
      .map(term => term.toLowerCase());
    
    const results = fragranceData.filter(fragrance => {
      const name = (fragrance.Name || '').toLowerCase();
      const brand = (fragrance.Brand || '').toLowerCase();
      
      return searchTerms.some(term => 
        name.includes(term) || brand.includes(term)
      );
    });
    
    setMatches(results.slice(0, 5)); // Top 5 matches
  };

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
            <div className="p-6 flex gap-4">
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
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setExtractedText('');
                    setMatches([]);
                  }}
                  className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  Scan Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanFragrance;

