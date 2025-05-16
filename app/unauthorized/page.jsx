// app/unauthorized/page.jsx
export default function Unauthorized() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">401 - Unauthorized Access</h1>
        <p className="text-gray-600">You don't have permission to view this page</p>
        <a 
          href="/login" 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </a>
      </div>
    );
  }