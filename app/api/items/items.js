import { protectApiRoute } from '@/lib/auth-utils';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await protectApiRoute();
    const client = await connectToDatabase();
    
    const items = await client.db()
      .collection('items')
      .find({ userId: session.userId })
      .toArray();

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}