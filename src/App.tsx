import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Clock, Monitor, Settings, PenTool as Tool, UserPlus, X, Check, ArrowLeft, Users, FileText, Power } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from './store';
import type { SupportRequest, RequestCategory, NotificationUser } from './types';

const queryClient = new QueryClient();

function RequestDetails({ request, onBack }: { request: SupportRequest; onBack: () => void }) {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Заявка #{request.id}</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(request.category)}
            <span className="text-lg">@{request.username}</span>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Описание:</h3>
          <p className="text-gray-700">{request.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>Создано: {format(request.createdAt, 'dd.MM.yyyy HH:mm')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>Обновлено: {format(request.updatedAt, 'dd.MM.yyyy HH:mm')}</span>
          </div>
        </div>

        {request.status === 'PENDING' && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Принять заявку
            </button>
            <button
              onClick={() => updateRequestStatus(request.id, 'REJECTED')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Отклонить
            </button>
          </div>
        )}

        {request.status === 'IN_PROGRESS' && (
          <div className="flex justify-end">
            <button
              onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Завершить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: SupportRequest }) {
  const { updateRequestStatus, setSelectedRequest } = useStore();

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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedRequest(request.id)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getCategoryIcon(request.category)}
          <h3 className="text-lg font-semibold">@{request.username}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>
      <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
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
    <div className="bg-white rounded-lg shadow-md p-6">
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

function BotControl() {
  const { botState, setBotState } = useStore();

  const toggleBot = async () => {
    try {
      const response = await fetch('/api/bot/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: botState.isRunning ? 'stop' : 'start' }),
      });

      if (response.ok) {
        setBotState({
          isRunning: !botState.isRunning,
          [botState.isRunning ? 'lastStopped' : 'lastStarted']: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Статус Telegram бота</h3>
          <p className="text-sm text-gray-500">
            {botState.isRunning ? 'Бот активен' : 'Бот неактивен'}
            {botState.lastStarted && botState.isRunning && (
              <span className="ml-2">
                (с {format(botState.lastStarted, 'HH:mm dd.MM.yyyy')})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={toggleBot}
          className={`px-4 py-2 rounded-md text-white flex items-center space-x-2 ${
            botState.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Power className="w-5 h-5" />
          <span>{botState.isRunning ? 'Остановить' : 'Запустить'}</span>
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, children, onClick }: { active: boolean; icon: any; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </button>
  );
}

function App() {
  const { requests, selectedRequest, setSelectedRequest } = useStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const currentRequest = requests.find(r => r.id === selectedRequest);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">IT Support Dashboard</h1>
            <BotControl />
            <div className="flex space-x-4">
              <TabButton
                active={activeTab === 'requests'}
                icon={FileText}
                onClick={() => setActiveTab('requests')}
              >
                Заявки
              </TabButton>
              <TabButton
                active={activeTab === 'users'}
                icon={Users}
                onClick={() => setActiveTab('users')}
              >
                Пользователи
              </TabButton>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {activeTab === 'users' ? (
              <NotificationUsersList />
            ) : (
              selectedRequest && currentRequest ? (
                <RequestDetails
                  request={currentRequest}
                  onBack={() => setSelectedRequest(null)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {requests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;