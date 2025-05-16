// app/student-dashboard/page.js
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-auth';
import ClientDashboard from './ClientDashboard';

export default async function StudentPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'student') redirect('/unauthorized');

  return <ClientDashboard session={session} />;
}
