import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle, XCircle, Loader2, ScanLine } from 'lucide-react';
import { SignInRequired } from '@/components/auth/SignInRequired';

const API_BASE_URL = 'http://localhost:5000/api';

type ScanStatus = 'idle' | 'scanning' | 'loading' | 'success' | 'error';

interface ApiResponse {
  message?: string;
  error?: string;
}

export const CheckInScanner = () => {
  const { isAuthenticated, token } = useAuth();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [resultMessage, setResultMessage] = useState<string>('');

  // ✅ Updated: handle array of detected codes
  const handleScanResult = async (detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    setStatus('loading');

    const rawValue = detectedCodes[0].rawValue?.trim();
    if (!rawValue) {
      setResultMessage('Could not read QR code. Please try again.');
      setStatus('error');
      return;
    }

    let checkInId = '';
    try {
      const url = new URL(rawValue);
      checkInId = url.searchParams.get('id') || rawValue;
    } catch (e) {
      checkInId = rawValue;
    }

    if (!checkInId) {
      setResultMessage('Could not read QR code. Please try again.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checkInId }),
      });

      const data: ApiResponse = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed with ${res.status}`);

      setResultMessage(data.message || 'Check-in successful!');
      setStatus('success');
    } catch (err: any) {
      setResultMessage(err.message || 'An unknown error occurred.');
      setStatus('error');
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setResultMessage('');
  };

  if (!isAuthenticated) {
    return <SignInRequired description="You need to sign in to check in for events." />;
  }

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Verifying Check-in...</h3>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        );

      case 'success':
        return (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Check-in Successful!</AlertTitle>
            <AlertDescription className="text-green-700">{resultMessage}</AlertDescription>
            <Button onClick={resetScanner} className="mt-4 w-full">
              Scan Another
            </Button>
          </Alert>
        );

      case 'error':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Check-in Failed</AlertTitle>
            <AlertDescription>{resultMessage}</AlertDescription>
            <Button onClick={resetScanner} variant="destructive" className="mt-4 w-full">
              Try Again
            </Button>
          </Alert>
        );

      case 'scanning':
        return (
          <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-primary/20 shadow-lg bg-black">
            <Scanner
              onScan={handleScanResult} // ✅ use onScan
              onError={(error) => console.error(error)}
              constraints={{ facingMode: 'environment' }}
              components={{
                audio: false,
                finder: true,
                torch: true,
                zoom: true,
              }}
              styles={{
                container: { width: '100%', aspectRatio: '1/1' },
                video: { objectFit: 'cover' },
              }}
            />
          </div>
        );

      default:
        return (
          <div className="text-center flex flex-col items-center gap-6">
            <div className="p-6 rounded-full bg-primary/10">
              <ScanLine className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Ready to Check In?</h3>
            <p className="text-muted-foreground max-w-sm">
              Position the event's QR code inside the frame to automatically mark your attendance.
            </p>
            <Button size="lg" onClick={() => setStatus('scanning')}>
              <Camera className="w-5 h-5 mr-2" />
              Start Scanning
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">{renderStatus()}</div>
    </div>
  );
};
