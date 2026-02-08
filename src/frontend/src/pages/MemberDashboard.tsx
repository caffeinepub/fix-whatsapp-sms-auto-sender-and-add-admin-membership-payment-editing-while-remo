import DashboardLayout from '../components/DashboardLayout';
import MemberPortal from '../components/member/MemberPortal';

export default function MemberDashboard() {
  return (
    <DashboardLayout role="member">
      <MemberPortal />
    </DashboardLayout>
  );
}

