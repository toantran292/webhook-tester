import React, { useState } from 'react';
import { Endpoint, api } from '../api/client';
import { EndpointForm } from './EndpointForm';

interface EndpointListProps {
  endpoints: Endpoint[];
  selectedId: number | null;
  onSelect: (endpoint: Endpoint) => void;
  onRefresh: () => void;
}

export function EndpointList({
  endpoints,
  selectedId,
  onSelect,
  onRefresh,
}: EndpointListProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleCreate = async (name: string) => {
    await api.createEndpoint({ name });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this endpoint and all its requests?')) return;

    setDeleting(id);
    try {
      await api.deleteEndpoint(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (endpoint: Endpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.updateEndpoint(endpoint.id, { enabled: !endpoint.enabled });
    onRefresh();
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
      >
        + New Endpoint
      </button>

      {showForm && (
        <EndpointForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-2">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.id}
            onClick={() => onSelect(endpoint)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedId === endpoint.id
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      endpoint.enabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium text-gray-800 truncate">
                    {endpoint.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-mono truncate">
                  /hook/{endpoint.slug}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => handleToggle(endpoint, e)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title={endpoint.enabled ? 'Disable' : 'Enable'}
                >
                  {endpoint.enabled ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => handleDelete(endpoint.id, e)}
                  disabled={deleting === endpoint.id}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {endpoints.length === 0 && !showForm && (
          <p className="text-center text-gray-500 py-8">
            No endpoints yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
