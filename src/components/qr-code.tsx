
"use client";

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OcpLogo from '@/app/ocplogo.png';

interface QRCodeProps {
    type: 'workstation' | 'standard' | 'form';
    id: string;
}

export default function QRCode({ type, id }: QRCodeProps) {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [isDevEnv, setIsDevEnv] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const { hostname, origin } = window.location;
      
      const isCloudWorkstation = hostname.includes('cloudworkstations.dev') || hostname.includes('app.goog');
      setIsDevEnv(isCloudWorkstation);

      const url = `${origin}/${type}/${id}`;
      setPublicUrl(url);
    }
  }, [type, id]);

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-canvas-download-${id}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${type}-${id}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const imageSettings = {
      src: OcpLogo.src,
      height: 40,
      width: 40,
      excavate: true,
  };

  return (
    <Card>
      <CardHeader className="print-hidden">
        <CardTitle>Accès rapide</CardTitle>
        <CardDescription>Scannez ou téléchargez le code QR pour un accès public.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        {publicUrl ? (
          <>
            {/* Visible QR Code for display */}
            <QRCodeCanvas
              value={publicUrl}
              size={150}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"} // Level H for better error correction with logo
              includeMargin={true}
              imageSettings={imageSettings}
            />
            {/* Hidden QR Code for high-resolution download */}
            <QRCodeCanvas
              id={`qr-canvas-download-${id}`}
              value={publicUrl}
              size={512}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              includeMargin={true}
              imageSettings={imageSettings ? {...imageSettings, height: 80, width: 80} : undefined}
              className="hidden"
            />
            
            {isDevEnv && (
                <Alert variant="default" className="text-xs print-hidden">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-semibold">Note de Développement</AlertTitle>
                    <AlertDescription>
                        Ce QR code utilise votre URL de développement privée. Il utilisera l'URL publique après le déploiement sur Vercel.
                    </AlertDescription>
                </Alert>
            )}

            <Button variant="outline" onClick={handleDownload} className="w-full print-hidden">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Skeleton className="h-[150px] w-[150px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
