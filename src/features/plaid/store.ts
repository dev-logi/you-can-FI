/**
 * Plaid Zustand Store
 * 
 * Manages UI state for Plaid connected accounts.
 * Syncs with PlaidApiService for Plaid integration via the backend.
 */

import { create } from 'zustand';
import {
  PlaidApiService,
  ConnectedAccount,
  PlaidAccountInfo,
  SyncResponse,
  LinkAccountRequest,
} from '../../api/services/plaidService';

interface PlaidStore {
  // State
  isLoading: boolean;
  connectedAccounts: ConnectedAccount[];
  error: string | null;
  linkToken: string | null;

  // Actions
  createLinkToken: () => Promise<string>;
  exchangePublicToken: (publicToken: string) => Promise<PlaidAccountInfo[]>;
  refreshConnectedAccounts: () => Promise<void>;
  syncAllAccounts: () => Promise<SyncResponse>;
  syncAccount: (accountId: string) => Promise<SyncResponse>;
  linkAccount: (request: LinkAccountRequest) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
}

export const usePlaidStore = create<PlaidStore>((set, get) => ({
  // Initial state
  isLoading: false,
  connectedAccounts: [],
  error: null,
  linkToken: null,

  // Create Link token
  createLinkToken: async () => {
    set({ isLoading: true, error: null });

    try {
      const linkToken = await PlaidApiService.createLinkToken();
      set({ linkToken, isLoading: false });
      return linkToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create link token';
      console.error('[PlaidStore] Create link token error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Exchange public token
  exchangePublicToken: async (publicToken: string) => {
    set({ isLoading: true, error: null });

    try {
      const accounts = await PlaidApiService.exchangePublicToken(publicToken);
      set({ isLoading: false });
      
      // Refresh connected accounts after exchange
      await get().refreshConnectedAccounts();
      
      return accounts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to exchange token';
      console.error('[PlaidStore] Exchange token error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Refresh connected accounts list
  refreshConnectedAccounts: async () => {
    set({ isLoading: true, error: null });

    try {
      const accounts = await PlaidApiService.getConnectedAccounts();
      set({ connectedAccounts: accounts, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch connected accounts';
      console.error('[PlaidStore] Refresh accounts error:', error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Sync all accounts
  syncAllAccounts: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await PlaidApiService.syncAllAccounts();
      set({ isLoading: false });
      
      // Refresh connected accounts after sync
      await get().refreshConnectedAccounts();
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync accounts';
      console.error('[PlaidStore] Sync all accounts error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Sync single account
  syncAccount: async (accountId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await PlaidApiService.syncAccount(accountId);
      set({ isLoading: false });
      
      // Refresh connected accounts after sync
      await get().refreshConnectedAccounts();
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync account';
      console.error('[PlaidStore] Sync account error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Link account to asset/liability
  linkAccount: async (request: LinkAccountRequest) => {
    set({ isLoading: true, error: null });

    try {
      await PlaidApiService.linkAccount(request);
      set({ isLoading: false });
      
      // Refresh connected accounts after linking
      await get().refreshConnectedAccounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link account';
      console.error('[PlaidStore] Link account error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Disconnect account
  disconnectAccount: async (accountId: string) => {
    set({ isLoading: true, error: null });

    try {
      await PlaidApiService.disconnectAccount(accountId);
      set({ isLoading: false });
      
      // Refresh connected accounts after disconnect
      await get().refreshConnectedAccounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect account';
      console.error('[PlaidStore] Disconnect account error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));

