import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Clock, Monitor, Settings, PenTool as Tool, UserPlus, X, Check, ArrowLeft, Users, FileText, Power, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from './store';
import type { SupportRequest, RequestCategory, NotificationUser } from './types';

const queryClient = new QueryClient();

function CreateRequest() {
  const [category, setCategory] = useState<RequestCategory>('HARDWARE_REPLACEMENT');
  const [description, setDescription] = useState('');
  const addRequest = useStore((state) => state.addRequest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: SupportRequest = {
      id: Date.now().toString(),
      userId: 0, // Web user
      username: 'web_user',
      category,
      description,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    addRequest(request);
    setDescription('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Создать заявку</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RequestCategory)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="HARDWARE_REPLACEMENT">Замена оборудования</option>
            <option value="SOFTWARE_INSTALLATION">Установка ПО</option>
            <option value="TECHNICAL_SUPPORT">Техническая поддержка</option>
            <option value="REPAIR">Ремонт</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание проблемы
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md h-32"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center space-x-2"
        >
          <Send className="w-5 h-5" />
          <span>Отправить заявку</span>
        </button>
      </form>
    </div>
  );
}

// ... (keep all other existing components)

function App() {
  const { requests, selectedRequest, setSelectedRequest } = useStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'create'>('requests');
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
              <TabButton
                active={activeTab === 'create'}
                icon={Send}
                onClick={() => setActiveTab('create')}
              >
                Создать заявку
              </TabButton>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {activeTab === 'users' ? (
              <NotificationUsersList />
            ) : activeTab === 'create' ? (
              <CreateRequest />
            ) : selectedRequest && currentRequest ? (
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
            )}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;