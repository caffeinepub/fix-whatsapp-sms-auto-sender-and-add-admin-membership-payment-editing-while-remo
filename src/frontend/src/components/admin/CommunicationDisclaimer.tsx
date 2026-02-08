import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CommunicationDisclaimer() {
  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Simulated Communication Logs
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <p className="mb-2">
          <strong>Important:</strong> Email, SMS, and WhatsApp notifications shown below are{' '}
          <strong>simulated in-app logs only</strong> and are <strong>not delivered</strong> to real
          devices or phone numbers in this build.
        </p>
        <p>
          To notify the member, please <strong>manually copy and share</strong> the login credentials
          and membership details through your preferred communication method.
        </p>
      </AlertDescription>
    </Alert>
  );
}
