export type RequestCategory = 
  | 'HARDWARE_REPLACEMENT'
  | 'SOFTWARE_INSTALLATION'
  | 'TECHNICAL_SUPPORT'
  | 'REPAIR';

export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface SupportRequest {
  id: string;
  userId: number;
  username: string;
  category: RequestCategory;
  description: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationUser {
  id: string;
  username: string;
  chatId: string;
  isAdmin: boolean;
}