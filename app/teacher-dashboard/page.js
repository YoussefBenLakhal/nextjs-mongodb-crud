// app/teacher-dashboard/page.js
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-auth';
import TeacherDashboardClient from './ClientDashboard';

export default async function TeacherDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'teacher') {
    console.error(`Unauthorized access attempt by ${session.email} with role ${session.role}`);
    redirect('/unauthorized');
  }

  return <TeacherDashboardClient initialSession={session} />;
}

export const dynamic = 'force-dynamic';