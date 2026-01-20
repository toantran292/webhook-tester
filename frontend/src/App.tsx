import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { EndpointList } from './components/EndpointList';
import { EndpointDetail } from './components/EndpointDetail';
import { RequestDetail } from './components/RequestDetail';
import { useSSE } from './hooks/useSSE';
import { api, Endpoint, Request } from './api/client';

function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Handle new SSE requests
  const handleNewRequest = useCallback(
    (newRequest: Request & { endpoint_slug: string }) => {
      if (selectedEndpoint && newRequest.endpoint_id === selectedEndpoint.id) {
        setRequests((prev) => [newRequest, ...prev]);
      }
    },
    [selectedEndpoint]
  );

  const { connected } = useSSE(handleNewRequest);

  // Load endpoints
  const loadEndpoints = useCallback(async () => {
    try {
      const data = await api.listEndpoints();
      setEndpoints(data);
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    }
  }, []);

  // Load requests for selected endpoint
  const loadRequests = useCallback(async () => {
    if (!selectedEndpoint) return;

    setLoadingRequests(true);
    try {
      const data = await api.listRequests(selectedEndpoint.id);
      setRequests(data.requests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [selectedEndpoint]);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  useEffect(() => {
    if (selectedEndpoint) {
      loadRequests();
    } else {
      setRequests([]);
    }
  }, [selectedEndpoint, loadRequests]);

  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setSelectedRequest(null);
  };

  const handleClearRequests = async () => {
    if (!selectedEndpoint) return;
    if (!confirm('Clear all requests for this endpoint?')) return;

    try {
      await api.clearRequests(selectedEndpoint.id);
      setRequests([]);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Failed to clear requests:', err);
    }
  };

  const handleUpdateEndpoint = async (updates: Partial<Endpoint>) => {
    if (!selectedEndpoint) return;
    try {
      const updated = await api.updateEndpoint(selectedEndpoint.id, updates);
      setSelectedEndpoint(updated);
      loadEndpoints();
    } catch (err) {
      console.error('Failed to update endpoint:', err);
    }
  };

  return (
    <Layout
      connected={connected}
      sidebar={
        <EndpointList
          endpoints={endpoints}
          selectedId={selectedEndpoint?.id ?? null}
          onSelect={handleSelectEndpoint}
          onRefresh={loadEndpoints}
        />
      }
    >
      {selectedEndpoint ? (
        <EndpointDetail
          endpoint={selectedEndpoint}
          requests={requests}
          selectedRequestId={selectedRequest?.id ?? null}
          loadingRequests={loadingRequests}
          onUpdateEndpoint={handleUpdateEndpoint}
          onSelectRequest={setSelectedRequest}
          onClearRequests={handleClearRequests}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <svg
            className="w-24 h-24 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
          <p className="text-lg">Select an endpoint to view requests</p>
          <p className="text-sm mt-2">
            Or create a new endpoint from the sidebar
          </p>
        </div>
      )}

      {/* Request detail modal */}
      {selectedRequest && (
        <RequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </Layout>
  );
}

export default App;
