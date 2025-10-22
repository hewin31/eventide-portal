import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QRCodeModalProps {
  eventName: string;
  qrCodeDataUrl: string | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ eventName, qrCodeDataUrl, onClose }) => {
  if (!qrCodeDataUrl) {
    return null; // Or a loading/error state
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md m-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-3 right-3 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Event Check-in</CardTitle>
          <CardDescription>Scan this QR code to mark attendance for "{eventName}"</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <img src={qrCodeDataUrl} alt={`QR Code for ${eventName}`} className="w-64 h-64" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">This code is unique to this event.</p>
        </CardContent>
      </Card>
    </div>
  );
};