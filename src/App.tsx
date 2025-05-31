import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Clock, Monitor, Settings, PenTool as Tool, UserPlus, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from './store';
import type { SupportRequest, RequestCategory, NotificationUser } from './types';

const queryClient = new QueryClient();

function RequestCard({ request }: { request: SupportRequest }) {
  const updateRequestStatus = useStore((state) => state.updateRequestStatus);

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
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
          {request.status === 'PENDING' && (
            <div className="flex space-x-1">
              <button
                onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}
                className="p-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateRequestStatus(request.id, 'REJECTED')}
                className="p-1 rounded-full bg-red-100 text-red-800 hover:bg-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {request.status === 'IN_PROGRESS' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
              className="p-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-600 mb-4">{request.description}</p>
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="w-4 h-4 mr-2" />
        <span>{format(request.createdAt, 'dd.MM.yyyy HH:mm')}</span>
      </div>
    </div>
  );
}

function NotificationUsersList() {
  const [username, setUsername] = useState('');
  const [chatId, setChatId] = useState('');
  const { notificationUsers, addNotificationUser, removeNotificationUser } = useStore();

  const handleAddUser = () => {
    if (username && chatId) {
      addNotificationUser({
        id: Date.now().toString(),
        username,
        chatId,
        isAdmin: false,
      });
      setUsername('');
      setChatId('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Пользователи для уведомлений</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="Chat ID"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-2">
        {notificationUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div>
              <span className="font-medium">@{user.username}</span>
              <span className="text-sm text-gray-500 ml-2">{user.chatId}</span>
            </div>
            <button
              onClick={() => removeNotificationUser(user.id)}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const requests = useStore((state) => state.requests);

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
            <NotificationUsersList />
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