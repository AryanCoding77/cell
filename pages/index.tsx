import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import PDFViewer dynamically to avoid SSR issues with react-pdf
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading PDF viewer...
      </div>
    </div>
  ),
});

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6">
      <Head>
        <title>PDF Viewer</title>
        <meta name="description" content="PDF Viewer with password protected chat" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full max-w-5xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-blue-600">PDF Viewer</h1>
        <div className="bg-white p-2 sm:p-4 md:p-6 lg:p-8 rounded-lg shadow-md">
          <PDFViewer />
        </div>
      </main>
    </div>
  );
};

export default Home; 