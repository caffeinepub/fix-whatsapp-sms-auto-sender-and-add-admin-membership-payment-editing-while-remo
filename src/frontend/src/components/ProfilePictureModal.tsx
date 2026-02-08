import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfilePictureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  altText: string;
}

export default function ProfilePictureModal({
  open,
  onOpenChange,
  imageUrl,
  altText,
}: ProfilePictureModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent 
        className="max-w-4xl border-0 bg-transparent p-0 shadow-none"
        onClick={() => onOpenChange(false)}
      >
        <div className="relative flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-[90vh] max-w-full rounded-lg object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
