import { useEffect, useState } from 'react';
import { MemberProfile } from '../backend';
import { useGenerateQrCode } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDialogProps {
  member: MemberProfile;
  onClose: () => void;
}

export default function QRCodeDialog({ member, onClose }: QRCodeDialogProps) {
  const [qrData, setQrData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const generateQrCode = useGenerateQrCode();

  useEffect(() => {
    const generateCode = async () => {
      try {
        const data = await generateQrCode.mutateAsync(member.id);
        setQrData(data);
      } catch (error) {
        toast.error('Failed to generate QR code');
        console.error(error);
        onClose();
      }
    };

    generateCode();
  }, [member.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      toast.success('QR code data copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Generate QR code URL using an external service
  const qrCodeImageUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
    : '';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Member QR Code</DialogTitle>
          <DialogDescription>
            QR code for {member.name} - Use this for attendance tracking
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {generateQrCode.isPending || !qrData ? (
            <div className="flex h-[300px] w-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={qrCodeImageUrl}
                  alt={`QR code for ${member.name}`}
                  className="h-[300px] w-[300px]"
                />
              </div>
              <div className="w-full space-y-2">
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">QR Code Data:</p>
                  <p className="font-mono text-sm break-all">{qrData}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    {copied ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Button onClick={onClose} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
