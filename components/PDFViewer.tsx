import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useRouter } from 'next/router';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

const PDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Set up responsive sizing (width only, not scale)
  useEffect(() => {
    const handleResize = () => {
      // Get actual container width if available
      const containerWidth = containerRef.current ? containerRef.current.offsetWidth - 40 : 0; // Subtract padding
      
      // If container reference isn't ready yet, use window width-based calculations
      let calculatedWidth = containerWidth || 0;
      if (calculatedWidth === 0) {
        calculatedWidth = window.innerWidth < 640 ? window.innerWidth - 32 : // Small screens with padding
                         window.innerWidth < 768 ? 600 : // Medium screens
                         window.innerWidth < 1024 ? 700 : // Large screens
                         window.innerWidth < 1280 ? 850 : // XL screens
                         1000; // 2XL screens
      }
      
      setWidth(calculatedWidth);
      
      // We don't adjust scale based on screen size anymore
      // Always use the manually set scale value
      console.log(`Resized: Width ${calculatedWidth}px, Scale ${scale}`);
    };

    // Initial sizing
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [scale]); // Include scale in dependencies to update when it changes

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    // Run the resize handler after document loads to ensure proper sizing
    setTimeout(() => {
      const event = new Event('resize');
      window.dispatchEvent(event);
    }, 100);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages || 1, newPageNumber));
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password === '9544') {
      router.push('/chat?user=Unknown%201');
    } else if (password === '911') {
      router.push('/chat?user=Unknown%202');
    } else {
      alert('Invalid password');
    }
    
    setPassword('');
    setShowPasswordModal(false);
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Loading state */}
      <div className="flex justify-center py-4">
        <Document
          file="/CELL.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading PDF...
              </div>
            </div>
          }
          error={
            <div className="text-center text-red-500 py-8">
              <p>Error loading PDF. Please try again later.</p>
            </div>
          }
          className="shadow-lg max-w-full"
        >
          {/* Three-dot menu - positioned relative to page, not document */}
          <div className="absolute top-2 right-2 z-10">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowPasswordModal(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  More
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              width={width}
              scale={scale}
              className="border border-gray-300 mx-auto"
            />
          </div>
        </Document>
      </div>

      {/* PDF Navigation */}
      <div className="flex flex-wrap justify-center mt-4 gap-2 sm:gap-4 px-2">
        <button
          disabled={pageNumber <= 1}
          onClick={() => changePage(-1)}
          className="px-2 sm:px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm sm:text-base"
        >
          Previous
        </button>
        <p className="self-center text-sm sm:text-base">
          Page {pageNumber} of {numPages || 0}
        </p>
        <button
          disabled={pageNumber >= (numPages || 1)}
          onClick={() => changePage(1)}
          className="px-2 sm:px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm sm:text-base"
        >
          Next
        </button>
        
        {/* Scale controls */}
        <div className="w-full sm:w-auto flex justify-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm"
            title="Zoom out"
          >
            -
          </button>
          <span className="text-sm self-center mx-1">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
            className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Enter Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded mb-4"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 