import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-auth';
import ClientDashboard from './ClientDashboard';

export default async function TeacherPage() {
  const session = await getSession();
  
  // Redirections de sécurité
  if (!session) redirect('/login');
  if (session.role !== 'teacher') redirect('/dashboard/teacher');

  return <ClientDashboard session={session} />;
}