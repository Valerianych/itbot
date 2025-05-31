import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Clock, Monitor, Settings, PenTool as Tool } from 'lucide-react';
import { format } from 'date-fns';

const queryClient = new QueryClient();

// Mock data for demonstration
const requests: SupportRequest[] = [
  {
    id: '1',
    userId: 123456789,
    username: 'john_doe',
    category: 'HARDWARE_REPLACEMENT',
    description: 'Требуется замена компьютерной мыши',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock requests as needed
];

function RequestCard({ request }: { request: SupportRequest }) {
  const getCategoryIcon = (category: RequestCategory) => {
    switch (category) {
      case 'HARDWARE_REPLACEMENT':
        return <Monitor className="w-5 h-5" />;
      case 'SOFTWARE_INSTALLATION':
        return <Settings className="w-5 h-5" />;
      case 'TECHNICAL_SUPPORT':
        return <Tool className="w-5 h-5" />;
      case 'REPAIR':
        return <Tool className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getCategoryIcon(request.category)}
          <h3 className="text-lg font-semibold">@{request.username}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>
      <p className="text-gray-600 mb-4">{request.description}</p>
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="w-4 h-4 mr-2" />
        <span>{format(request.createdAt, 'dd.MM.yyyy HH:mm')}</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">IT Support Dashboard</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;