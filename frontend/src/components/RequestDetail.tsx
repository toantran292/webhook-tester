import { useState } from 'react';
import { Request } from '../api/client';

interface RequestDetailProps {
  request: Request;
  onClose: () => void;
}

type Tab = 'body' | 'headers' | 'info';

export function RequestDetail({ request, onClose }: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('body');

  const formatJson = (str: string): string => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const isJson = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'body', label: 'Body' },
    { id: 'headers', label: 'Headers' },
    { id: 'info', label: 'Info' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
              {request.method}
            </span>
            <span className="text-gray-600">
              Request #{request.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'body' && (
            <div>
              {request.body ? (
                <pre
                  className={`p-4 rounded-lg overflow-auto text-sm ${
                    isJson(request.body)
                      ? 'bg-gray-900 text-green-400'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {formatJson(request.body)}
                </pre>
              ) : (
                <p className="text-gray-500 text-center py-8">No body content</p>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-2">
              {Object.entries(request.headers || {}).map(([key, value]) => (
                <div key={key} className="flex border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-700 w-48 flex-shrink-0">
                    {key}
                  </span>
                  <span className="text-gray-600 break-all">{value}</span>
                </div>
              ))}
              {Object.keys(request.headers || {}).length === 0 && (
                <p className="text-gray-500 text-center py-8">No headers</p>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Method</label>
                <p className="text-gray-800">{request.method}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Query String</label>
                <p className="text-gray-800 font-mono text-sm">
                  {request.query_params || '(none)'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Content-Type</label>
                <p className="text-gray-800">{request.content_type || '(none)'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source IP</label>
                <p className="text-gray-800">{request.source_ip}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Received At</label>
                <p className="text-gray-800">
                  {new Date(request.received_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
