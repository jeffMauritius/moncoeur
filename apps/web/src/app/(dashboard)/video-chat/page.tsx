"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Users,
} from "lucide-react";

export default function VideoChatPage() {
  const { data: session } = useSession();
  const [roomId, setRoomId] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Generate a random room ID
  function generateRoomId() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    return id;
  }

  // Start local video
  const startLocalVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Impossible d'acceder a la camera. Verifiez les permissions.");
    }
  }, []);

  // Stop local video
  function stopLocalVideo() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }

  // Toggle camera
  function toggleCamera() {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }

  // Toggle microphone
  function toggleMic() {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }

  // Start call
  async function startCall() {
    if (!roomId) {
      generateRoomId();
    }
    await startLocalVideo();
    setIsInCall(true);
    setError(null);
  }

  // End call
  function endCall() {
    stopLocalVideo();
    setIsInCall(false);
  }

  // Copy room ID
  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalVideo();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Chat</h1>
        <p className="text-muted-foreground">
          Communiquez en video avec votre equipe
        </p>
      </div>

      {!isInCall ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Room */}
          <Card>
            <CardHeader>
              <CardTitle>Creer une reunion</CardTitle>
              <CardDescription>
                Demarrez une nouvelle reunion video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={startCall} className="w-full">
                <Video className="mr-2 h-4 w-4" />
                Demarrer une reunion
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Un code de reunion sera genere automatiquement
              </p>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader>
              <CardTitle>Rejoindre une reunion</CardTitle>
              <CardDescription>
                Entrez le code de reunion pour rejoindre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">Code de reunion</Label>
                <Input
                  id="roomId"
                  placeholder="Ex: ABC123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={startCall}
                disabled={roomId.length < 3}
                className="w-full"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Rejoindre
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Room Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {roomId}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={copyRoomId}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "Copie!" : "Copier"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecte en tant que {session?.user?.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Video Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Local Video */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video bg-black object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <Badge variant="secondary">
                    {session?.user?.name} (Vous)
                  </Badge>
                </div>
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <VideoOff className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Placeholder for remote video */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      En attente d&apos;autres participants...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Partagez le code <strong>{roomId}</strong> pour inviter
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isMicOn ? "outline" : "destructive"}
                  size="lg"
                  onClick={toggleMic}
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant={isCameraOn ? "outline" : "destructive"}
                  size="lg"
                  onClick={toggleCamera}
                >
                  {isCameraOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>

                <Button variant="destructive" size="lg" onClick={endCall}>
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">A propos du video chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cette fonctionnalite de video chat est une version simplifiee.
                Pour une implementation complete avec connexion entre plusieurs
                utilisateurs, un serveur de signalisation WebRTC serait necessaire.
                La version actuelle permet de tester votre camera et microphone.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
