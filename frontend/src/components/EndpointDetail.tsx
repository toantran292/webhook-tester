import { useState } from 'react';
import { Endpoint, Request, getWebhookUrl } from '../api/client';
import { RequestList } from './RequestList';

type TabType = 'requests' | 'configuration';

interface EndpointDetailProps {
  endpoint: Endpoint;
  requests: Request[];
  selectedRequestId: number | null;
  loadingRequests: boolean;
  onUpdateEndpoint: (updates: Partial<Endpoint>) => Promise<void>;
  onSelectRequest: (request: Request | null) => void;
  onClearRequests: () => void;
}

export function EndpointDetail({
  endpoint,
  requests,
  selectedRequestId,
  loadingRequests,
  onUpdateEndpoint,
  onSelectRequest,
  onClearRequests,
}: EndpointDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    const url = getWebhookUrl(endpoint.slug);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with endpoint name and URL */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800">{endpoint.name}</h2>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              endpoint.enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {endpoint.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Webhook URL */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <code className="flex-1 text-sm font-mono text-gray-700 truncate">
            {getWebhookUrl(endpoint.slug)}
          </code>
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('configuration')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'configuration'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Configuration
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden bg-white">
        {activeTab === 'requests' && (
          <RequestList
            requests={requests}
            selectedId={selectedRequestId}
            onSelect={onSelectRequest}
            onClear={onClearRequests}
            loading={loadingRequests}
          />
        )}

        {activeTab === 'configuration' && (
          <div className="p-4 overflow-auto h-full">
            <div className="max-w-2xl space-y-6">
              {/* Response Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Response Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      HTTP Status Code
                    </label>
                    <input
                      type="number"
                      value={endpoint.response_status}
                      onChange={(e) =>
                        onUpdateEndpoint({
                          response_status: parseInt(e.target.value) || 200,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Response Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={endpoint.delay_ms}
                      onChange={(e) =>
                        onUpdateEndpoint({
                          delay_ms: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Response Body
                    </label>
                    <textarea
                      value={endpoint.response_body}
                      onChange={(e) =>
                        onUpdateEndpoint({ response_body: e.target.value })
                      }
                      placeholder='{"status": "ok"}'
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              {/* Security Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Security
                </h3>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Secret Key
                  </label>
                  <input
                    type="text"
                    value={endpoint.secret_key}
                    onChange={(e) =>
                      onUpdateEndpoint({ secret_key: e.target.value })
                    }
                    placeholder="Leave empty to disable authentication"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    When set, requests must include the{' '}
                    <code className="bg-gray-100 px-1 rounded">
                      X-Webhook-Secret
                    </code>{' '}
                    header with this value.
                  </p>
                </div>
              </section>

              {/* Endpoint Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Endpoint Status
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={endpoint.enabled}
                    onChange={(e) =>
                      onUpdateEndpoint({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Endpoint is enabled
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-400 ml-7">
                  Disabled endpoints will return 503 Service Unavailable.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
