import { create } from 'zustand';
import type { SupportRequest, NotificationUser, RequestStatus } from '../types';

interface AppState {
  requests: SupportRequest[];
  notificationUsers: NotificationUser[];
  selectedRequest: string | null;
  addRequest: (request: SupportRequest) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  addNotificationUser: (user: NotificationUser) => void;
  removeNotificationUser: (id: string) => void;
  setSelectedRequest: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  requests: [],
  notificationUsers: [],
  selectedRequest: null,
  addRequest: (request) =>
    set((state) => ({ requests: [...state.requests, request] })),
  updateRequestStatus: (id, status) =>
    set((state) => ({
      requests: state.requests.map((request) =>
        request.id === id
          ? { ...request, status, updatedAt: new Date() }
          : request
      ),
    })),
  addNotificationUser: (user) =>
    set((state) => ({
      notificationUsers: [...state.notificationUsers, user],
    })),
  removeNotificationUser: (id) =>
    set((state) => ({
      notificationUsers: state.notificationUsers.filter((user) => user.id !== id),
    })),
  setSelectedRequest: (id) => set({ selectedRequest: id }),
}));