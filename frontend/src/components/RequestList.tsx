import { Request } from '../api/client';

interface RequestListProps {
  requests: Request[];
  selectedId: number | null;
  onSelect: (request: Request) => void;
  onClear: () => void;
  loading: boolean;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
};

export function RequestList({
  requests,
  selectedId,
  onSelect,
  onClear,
  loading,
}: RequestListProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">
          Requests ({requests.length})
        </h3>
        {requests.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No requests yet</p>
            <p className="text-sm mt-1">Send a webhook to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => onSelect(request)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedId === request.id
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      methodColors[request.method] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {request.method}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 truncate">
                    {request.query_params ? `?${request.query_params}` : '/'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(request.received_at)}
                  </span>
                </div>
                {request.content_type && (
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {request.content_type}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
