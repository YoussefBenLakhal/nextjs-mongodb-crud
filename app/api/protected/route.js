export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  
  return new Response(JSON.stringify({ 
    message: 'Protected data',
    userId 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}