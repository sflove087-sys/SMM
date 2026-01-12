export enum UserType {
    PERSONAL = 'PERSONAL',
    AGENT = 'AGENT',
    ADMIN = 'ADMIN',
}

export enum TransactionType {
    CASH_IN = 'CASH_IN',
    CASH_OUT = 'CASH_OUT',
    SEND_MONEY = 'SEND_MONEY',
    MOBILE_RECHARGE = 'MOBILE_RECHARGE',
    MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESSFUL = 'SUCCESSFUL',
    FAILED = 'FAILED',
}

export type LoggingStatus = 'SKIPPED' | 'SUCCESS' | 'ERROR';

export interface User {
    id: string;
    mobile: string;
    pin: string;
    name: string;
    email?: string;
    userType: UserType;
    balance: number;
    isActive: boolean;
    photoBase64?: string; // For storing user profile picture
    dailyTransactionTotal: number;
    monthlyTransactionTotal: number;
    lastLogin: Date;
    deviceId: string | null;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    timestamp: Date;
    fromUserId: string;
    toUserId: string;
    fromUserName: string;
    toUserName: string;
    fromUserMobile: string;
    toUserMobile: string;
    description: string;
}

export interface AdminSystemSettings {
    personalDailyLimit: number;
    personalMonthlyLimit: number;
    agentCashHandlingLimit: number;
    otpRules: string;
}