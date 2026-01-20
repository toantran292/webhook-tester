import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  connected: boolean;
}

export function Layout({ sidebar, children, connected }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Webhook Tester</h1>
          <div className="flex items-center mt-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
