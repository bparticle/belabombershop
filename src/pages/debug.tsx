import { useState, useEffect } from "react";

interface DebugData {
  productIds?: any[];
  rawSyncProduct?: any;
  rawSyncVariants?: any[];
  variantDetails?: Array<{
    sync_variant: any;
    store_variant?: any;
    store_variant_error?: string;
  }>;
}

const DebugPage = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const response = await fetch('/api/debug/printful-data');
        const data = await response.json();
        setDebugData(data);
      } catch (err: any) {
        setError(err?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) return <div className="p-8">Loading debug data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Printful Data Debug</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Product IDs</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugData?.productIds, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">First Product - Sync Product</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugData?.rawSyncProduct, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">First Product - Sync Variants</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugData?.rawSyncVariants, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Variant Details</h2>
          <div className="space-y-4">
            {debugData?.variantDetails?.map((variantDetail, index) => (
              <div key={index} className="border rounded p-4">
                <h3 className="text-lg font-medium mb-2">Variant {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Sync Variant:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(variantDetail.sync_variant, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Store Variant:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(variantDetail.store_variant, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DebugPage;
