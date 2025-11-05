export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Page</h1>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">API Tests</h2>
            <div className="space-y-2">
              <a href="/api/health" className="text-blue-600 hover:underline block">
                Health Check
              </a>
              <a href="/api/test-connection" className="text-blue-600 hover:underline block">
                Test Connection
              </a>
              <a href="/api/test-airtable" className="text-blue-600 hover:underline block">
                Test Airtable
              </a>
              <a href="/api/test-records" className="text-blue-600 hover:underline block">
                Test Records
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}