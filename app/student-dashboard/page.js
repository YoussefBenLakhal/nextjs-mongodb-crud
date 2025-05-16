import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-auth';
import ClientDashboard from './ClientDashboard'; // Nom corrigé

export default async function StudentPage() {
  const session = await getSession();
  
  if (!session) redirect('/login');
  if (session.role !== 'student') redirect('/dashboard/student');

  return <ClientDashboard session={session} />; // Utilisation du bon composant
}