import { getSession } from '@/lib/auth-server';

export async function GET() {
  const session = getSession();
  return Response.json(session);
}