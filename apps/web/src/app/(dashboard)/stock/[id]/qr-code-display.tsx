"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeDisplayProps {
  bagId: string;
  reference: string;
}

export function QRCodeDisplay({ bagId, reference }: QRCodeDisplayProps) {
  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/stock/${bagId}`;

  function downloadQRCode() {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${reference}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG
          id="qr-code-svg"
          value={qrUrl}
          size={160}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center font-mono">
        {reference}
      </p>
      <Button variant="outline" size="sm" onClick={downloadQRCode}>
        <Download className="mr-2 h-4 w-4" />
        Telecharger
      </Button>
    </div>
  );
}
