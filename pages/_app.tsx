import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
} 