import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Loader2, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      scannerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false,
    );

    scannerRef.current = scanner;

    try {
      scanner.render(
        (decodedText: string) => {
          setStatus('ready');
          onScan(decodedText);
        },
        () => {
          setStatus(prev => (prev === 'loading' ? 'ready' : prev));
        },
      );
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to start the QR scanner.');
    }

    return () => {
      const activeScanner = scannerRef.current;
      scannerRef.current = null;
      void activeScanner?.clear().catch(() => undefined);
    };
  }, [onScan, scannerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Scan QR Code</h2>
            <p className="text-sm text-gray-500">Align the code inside the frame to continue.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close QR scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-3">
          <div id={scannerId} className="min-h-[320px]" />
        </div>

        <div className="mt-4 flex min-h-6 items-center gap-2 text-sm font-medium text-gray-600">
          {status === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Starting camera...</span>
            </>
          )}
          {status === 'ready' && <span>Scanner is ready.</span>}
          {status === 'error' && <span className="text-red-600">{error ?? 'Scanner failed to start.'}</span>}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
