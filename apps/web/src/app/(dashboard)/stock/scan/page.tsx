"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff, QrCode, Loader2 } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    setError(null);
    setCameraReady(false);

    try {
      if (!containerRef.current) return;

      scannerRef.current = new Html5Qrcode("qr-reader");

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setCameraReady(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(
        "Impossible d'acceder a la camera. Verifiez les permissions."
      );
    }
  }

  async function stopScanning() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
    setCameraReady(false);
  }

  function onScanSuccess(decodedText: string) {
    // Check if it's a valid bag URL
    try {
      const url = new URL(decodedText);
      const pathname = url.pathname;

      // Check if it matches /stock/[id] pattern
      const match = pathname.match(/^\/stock\/([a-zA-Z0-9]+)$/);
      if (match) {
        stopScanning();
        router.push(pathname);
        return;
      }
    } catch {
      // Not a valid URL, check if it's just an ID
      if (/^[a-f\d]{24}$/i.test(decodedText)) {
        stopScanning();
        router.push(`/stock/${decodedText}`);
        return;
      }
    }

    setError("QR code non reconnu. Assurez-vous de scanner un QR code MonCoeur.");
  }

  function onScanError(errorMessage: string) {
    // Ignore "No QR code found" errors during scanning
    if (!errorMessage.includes("No QR code found")) {
      console.log("Scan error:", errorMessage);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scanner QR</h1>
          <p className="text-muted-foreground">
            Scannez le QR code d&apos;un sac pour acceder a sa fiche
          </p>
        </div>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner
          </CardTitle>
          <CardDescription>
            Pointez la camera vers le QR code du sac
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={containerRef}
            id="qr-reader"
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative"
          >
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {scanning && !cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            {!scanning ? (
              <Button onClick={startScanning} size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Demarrer le scan
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="outline" size="lg">
                <CameraOff className="mr-2 h-4 w-4" />
                Arreter le scan
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Le scan redirigera automatiquement vers la fiche du sac
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
