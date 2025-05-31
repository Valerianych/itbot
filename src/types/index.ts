export type RequestCategory = 
  | 'HARDWARE_REPLACEMENT'
  | 'SOFTWARE_INSTALLATION'
  | 'TECHNICAL_SUPPORT'
  | 'REPAIR';

export interface SupportRequest {
  id: string;
  userId: number;
  username: string;
  category: RequestCategory;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}