export default function(req: Request) {
  return new Response(JSON.stringify({
    message: 'Hello from the API!',
    time: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 