import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, CreditCard } from 'lucide-react';
import { Notification } from '../../backend';

interface NotificationBannerProps {
  notifications: Notification[];
}

export default function NotificationBanner({ notifications }: NotificationBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (notifications.length === 0) {
    return null;
  }

  // Sort notifications by priority (lower number = higher priority)
  const sortedNotifications = [...notifications].sort((a, b) => Number(a.priority) - Number(b.priority));

  // Filter out dismissed notifications
  const visibleNotifications = sortedNotifications.filter(
    (notification) => !dismissedIds.has(notification.title + notification.message)
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  const handleDismiss = (notification: Notification) => {
    const id = notification.title + notification.message;
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const getNotificationIcon = (icon: string) => {
    if (icon === '💰') {
      return <CreditCard className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  const getNotificationVariant = (color: string): 'default' | 'destructive' => {
    if (color.toLowerCase().includes('ff6347') || color.toLowerCase().includes('red')) {
      return 'destructive';
    }
    return 'default';
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleNotifications.map((notification, index) => (
        <Alert
          key={index}
          variant={getNotificationVariant(notification.color)}
          className="relative border-2"
          style={{
            borderColor: notification.color,
            backgroundColor: `${notification.color}15`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5" style={{ color: notification.color }}>
              {getNotificationIcon(notification.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <AlertTitle className="font-semibold text-base mb-1">
                {notification.title}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {notification.message}
              </AlertDescription>
              {notification.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {notification.actions.map(([label, _url], actionIndex) => (
                    <Button
                      key={actionIndex}
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      style={{
                        borderColor: notification.color,
                        color: notification.color,
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-background/50"
              onClick={() => handleDismiss(notification)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss notification</span>
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}

