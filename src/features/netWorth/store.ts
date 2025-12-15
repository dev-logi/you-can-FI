/**
 * Net Worth Zustand Store
 * 
 * Manages UI state for net worth display and editing.
 * Syncs with NetWorthApiService for calculations via the Python backend.
 * 
 * ARCHITECTURE: UI components read from this store.
 * The store calls the API service which talks to the backend.
 */

import { create } from 'zustand';
import {
  Asset,
  Liability,
  AssetCategory,
  LiabilityCategory,
  NetWorthSummary,
  CategoryBreakdown,
} from '../../shared/types';
import { NetWorthApiService } from '../../api/services/netWorthService';

interface NetWorthStore {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  summary: NetWorthSummary | null;
  assets: Asset[];
  liabilities: Liability[];
  assetBreakdown: CategoryBreakdown[];
  liabilityBreakdown: CategoryBreakdown[];
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  addAsset: (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Asset>;
  updateAsset: (id: string, data: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addLiability: (data: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Liability>;
  updateLiability: (id: string, data: Partial<Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
}

export const useNetWorthStore = create<NetWorthStore>((set, get) => ({
  // Initial state
  isLoading: false,
  isInitialized: false,
  summary: null,
  assets: [],
  liabilities: [],
  assetBreakdown: [],
  liabilityBreakdown: [],
  error: null,

  // Refresh all data
  refresh: async () => {
    set({ isLoading: true, error: null });

    try {
      const [summary, assets, liabilities, assetBreakdown, liabilityBreakdown] =
        await Promise.all([
          NetWorthApiService.calculate(),
          NetWorthApiService.getAssets(),
          NetWorthApiService.getLiabilities(),
          NetWorthApiService.getAssetBreakdown(),
          NetWorthApiService.getLiabilityBreakdown(),
        ]);

      set({
        isLoading: false,
        isInitialized: true,
        summary,
        assets,
        liabilities,
        assetBreakdown,
        liabilityBreakdown,
      });
    } catch (error) {
      console.error('[NetWorthStore] Refresh error:', error);
      set({
        isLoading: false,
        error: 'Failed to load net worth data',
      });
    }
  },

  // Add asset
  addAsset: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const asset = await NetWorthApiService.addAsset(data);
      await get().refresh();
      return asset;
    } catch (error) {
      console.error('[NetWorthStore] Add asset error:', error);
      set({
        isLoading: false,
        error: 'Failed to add asset',
      });
      throw error;
    }
  },

  // Update asset
  updateAsset: async (id, data) => {
    set({ isLoading: true, error: null });

    try {
      await NetWorthApiService.updateAsset(id, data);
      await get().refresh();
    } catch (error) {
      console.error('[NetWorthStore] Update asset error:', error);
      set({
        isLoading: false,
        error: 'Failed to update asset',
      });
      throw error;
    }
  },

  // Delete asset
  deleteAsset: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await NetWorthApiService.deleteAsset(id);
      await get().refresh();
    } catch (error) {
      console.error('[NetWorthStore] Delete asset error:', error);
      set({
        isLoading: false,
        error: 'Failed to delete asset',
      });
      throw error;
    }
  },

  // Add liability
  addLiability: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const liability = await NetWorthApiService.addLiability(data);
      await get().refresh();
      return liability;
    } catch (error) {
      console.error('[NetWorthStore] Add liability error:', error);
      set({
        isLoading: false,
        error: 'Failed to add liability',
      });
      throw error;
    }
  },

  // Update liability
  updateLiability: async (id, data) => {
    set({ isLoading: true, error: null });

    try {
      await NetWorthApiService.updateLiability(id, data);
      await get().refresh();
    } catch (error) {
      console.error('[NetWorthStore] Update liability error:', error);
      set({
        isLoading: false,
        error: 'Failed to update liability',
      });
      throw error;
    }
  },

  // Delete liability
  deleteLiability: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await NetWorthApiService.deleteLiability(id);
      await get().refresh();
    } catch (error) {
      console.error('[NetWorthStore] Delete liability error:', error);
      set({
        isLoading: false,
        error: 'Failed to delete liability',
      });
      throw error;
    }
  },
}));

// Selector hooks for specific data
export const useNetWorth = () => useNetWorthStore((state) => state.summary?.netWorth ?? 0);
export const useTotalAssets = () => useNetWorthStore((state) => state.summary?.totalAssets ?? 0);
export const useTotalLiabilities = () => useNetWorthStore((state) => state.summary?.totalLiabilities ?? 0);
export const useAssets = () => useNetWorthStore((state) => state.assets);
export const useLiabilities = () => useNetWorthStore((state) => state.liabilities);

