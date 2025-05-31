import { create } from 'zustand';
import type { SupportRequest, NotificationUser, RequestStatus } from '../types';

interface AppState {
  requests: SupportRequest[];
  notificationUsers: NotificationUser[];
  addRequest: (request: SupportRequest) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  addNotificationUser: (user: NotificationUser) => void;
  removeNotificationUser: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  requests: [],
  notificationUsers: [],
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
}));