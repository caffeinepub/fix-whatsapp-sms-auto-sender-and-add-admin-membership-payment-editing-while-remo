import { ManualCreateMemberResponse, CommunicationChannel } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageSquare, Phone, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CommunicationDisclaimer from './CommunicationDisclaimer';

interface CommunicationSimulationProps {
  response: ManualCreateMemberResponse;
}

export default function CommunicationSimulation({ response }: CommunicationSimulationProps) {
  const { member, credentials, communicationLogs } = response;

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'whatsapp':
        return <Phone className="h-5 w-5" />;
    }
  };

  const getChannelLabel = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      case 'whatsapp':
        return 'WhatsApp';
    }
  };

  const getChannelColor = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-500';
      case 'sms':
        return 'bg-green-500';
      case 'whatsapp':
        return 'bg-emerald-500';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllMessageContent = (log: typeof communicationLogs[0]) => {
    navigator.clipboard.writeText(log.content);
    toast.success(`${getChannelLabel(log.channel)} message copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">
                Member Created Successfully!
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                {member.name} has been added to the system with the provided credentials
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Member Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Login Credentials</CardTitle>
          <CardDescription>
            These credentials have been set by you for the new member
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Email Address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                  {credentials.email}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.email, 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                  {credentials.password}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.password, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-4 text-sm text-amber-900 dark:text-amber-100">
            <strong>Important:</strong> Please share these credentials with the member securely. They will
            need them to log in to their account.
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <CommunicationDisclaimer />

      {/* Communication Simulations */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Logs (Simulated)</CardTitle>
          <CardDescription>
            Preview of notification content that would be sent to the member. These are simulated logs and not actually delivered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {communicationLogs.map((log, index) => (
            <div key={index}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${getChannelColor(log.channel)} text-white`}>
                    {getChannelIcon(log.channel)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{getChannelLabel(log.channel)} Notification</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(Number(log.timestamp) / 1000000).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
                    Simulated (Not Delivered)
                  </Badge>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Message Content:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyAllMessageContent(log)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Message
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {log.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Member Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
          <CardDescription>Summary of the newly created member profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div className="text-base font-semibold">{member.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
              <div className="text-base font-semibold">{member.phone}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Membership Plan</div>
              <div className="text-base font-semibold">{member.membershipPlan.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Plan Price</div>
              <div className="text-base font-semibold">
                ₹{Number(member.membershipPlan.price).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Duration</div>
              <div className="text-base font-semibold">
                {Number(member.membershipPlan.durationMonths)} months
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Membership Status</div>
              <div className="text-base font-semibold capitalize">{member.membershipStatus}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
