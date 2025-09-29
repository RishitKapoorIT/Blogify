import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${api}/health`).then(async (r) => {
      const data = await r.json().catch(() => null);
      setHealth(data);
    }).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-4">
        <h1 className="text-3xl font-bold">Blogify</h1>
        <p className="text-gray-600">Full-stack scaffold is running.</p>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(health, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
