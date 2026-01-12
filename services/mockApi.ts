import { User, Transaction, TransactionType, UserType, AdminSystemSettings, LoggingStatus } from '../types';

// =========================================================================
// Central Backend Endpoint: All app requests are sent to this single URL.
// This URL points to a deployed Google Apps Script Web App that acts as the backend.
// =========================================================================
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6PF8l4xrmPTDlW1gPbsEN3MrYPbzLas4EeW2nplZe-RFDA2izzw952ZEdZj2a7AykoQ/exec";

// --- Utility Functions ---
const getSessionUser = (): User | null => {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

// --- Central API Handler ---
// This function sends all requests to our Google Apps Script backend.
const callApi = async (action: string, payload: object = {}) => {
  if (!SCRIPT_URL) {
      throw new Error("Backend script URL is not configured.");
  }

  try {
    const user = getSessionUser();
    // Always send the userId if a user is logged in, so the backend can handle permissions.
    const finalPayload = (user && user.id) ? { ...payload, userId: user.id } : payload;

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        payload: finalPayload
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'An error occurred on the server.');
    }

    return result.data;

  } catch (error) {
    console.error(`API Error on action "${action}":`, error);
    throw error;
  }
};


// --- API Methods ---

export const api = {
    login: async (mobile: string, pin: string): Promise<User> => {
        return callApi('login', { mobile, pin });
    },

    requestOtp: async (mobile: string): Promise<{ otpForDemo: string }> => {
        return callApi('requestOtp', { mobile });
    },

    verifyOtp: async (mobile: string, otp: string): Promise<boolean> => {
        return callApi('verifyOtp', { mobile, otp });
    },

    getUserByMobile: async (mobile: string): Promise<User | undefined> => {
        return callApi('getUserByMobile', { mobile });
    },
    
    getTransactionHistory: async (userId: string): Promise<Transaction[]> => {
        return callApi('getTransactionHistory');
    },

    performTransaction: async (type: TransactionType, fromUserId: string, toMobile: string, amount: number, pin: string): Promise<Transaction> => {
        return callApi('performTransaction', { type, toMobile, amount, pin });
    },

    registerUser: async (name: string, mobile: string, pin: string, email?: string): Promise<User> => {
        return callApi('registerUser', { name, mobile, pin, email });
    },

    resetPin: async (mobile: string, newPin: string): Promise<boolean> => {
        return callApi('resetPin', { mobile, newPin });
    },
    
    refreshCurrentUser: async (): Promise<User> => {
        return callApi('getCurrentUser');
    },
    
    updateProfile: async (name: string, photoBase64?: string): Promise<User> => {
        return callApi('updateProfile', { name, photoBase64 });
    },
    
    getContacts: async (recipientType: UserType): Promise<User[]> => {
        return callApi('getContacts', { recipientType });
    },

    // Admin functions
    getAllUsers: async (): Promise<User[]> => {
        return callApi('getAllUsers');
    },

    toggleUserStatus: async (userId: string): Promise<User> => {
        return callApi('toggleUserStatus', { userIdToToggle: userId });
    },

    getSystemSettings: async (): Promise<AdminSystemSettings> => {
        return callApi('getSystemSettings');
    },

    updateSystemSettings: async (settings: AdminSystemSettings): Promise<AdminSystemSettings> => {
        return callApi('updateSystemSettings', { settings });
    }
};