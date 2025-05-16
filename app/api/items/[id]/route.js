import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await db;
    const item = await client.db()
      .collection('items')
      .findOne({ 
        _id: new ObjectId(params.id),
        userId: session.userId 
      });

    if (!item) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    return Response.json(item);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const client = await db;

    const result = await client.db()
      .collection('items')
      .updateOne(
        { 
          _id: new ObjectId(params.id),
          userId: session.userId 
        },
        { $set: data }
      );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await db;
    const result = await client.db()
      .collection('items')
      .deleteOne({ 
        _id: new ObjectId(params.id),
        userId: session.userId 
      });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}