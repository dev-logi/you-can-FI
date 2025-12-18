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
      
      // Add to local state immediately instead of full refresh
      const currentAssets = get().assets;
      const currentSummary = get().summary;
      
      set({ 
        isLoading: false,
        assets: [...currentAssets, asset],
        summary: currentSummary ? {
          ...currentSummary,
          totalAssets: currentSummary.totalAssets + asset.value,
          netWorth: currentSummary.netWorth + asset.value,
        } : null,
      });
      
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
      const updatedAsset = await NetWorthApiService.updateAsset(id, data);
      
      if (updatedAsset) {
        // Update in local state
        const currentAssets = get().assets;
        const oldAsset = currentAssets.find(a => a.id === id);
        const valueDiff = updatedAsset.value - (oldAsset?.value ?? 0);
        
        set({ 
          isLoading: false,
          assets: currentAssets.map(a => a.id === id ? updatedAsset : a),
          summary: get().summary ? {
            ...get().summary!,
            totalAssets: get().summary!.totalAssets + valueDiff,
            netWorth: get().summary!.netWorth + valueDiff,
          } : null,
        });
      } else {
        set({ isLoading: false });
      }
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
      
      // Remove from local state
      const currentAssets = get().assets;
      const deletedAsset = currentAssets.find(a => a.id === id);
      
      set({ 
        isLoading: false,
        assets: currentAssets.filter(a => a.id !== id),
        summary: deletedAsset && get().summary ? {
          ...get().summary!,
          totalAssets: get().summary!.totalAssets - deletedAsset.value,
          netWorth: get().summary!.netWorth - deletedAsset.value,
        } : get().summary,
      });
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
      
      // Add to local state immediately instead of full refresh
      const currentLiabilities = get().liabilities;
      const currentSummary = get().summary;
      
      set({ 
        isLoading: false,
        liabilities: [...currentLiabilities, liability],
        summary: currentSummary ? {
          ...currentSummary,
          totalLiabilities: currentSummary.totalLiabilities + liability.balance,
          netWorth: currentSummary.netWorth - liability.balance,
        } : null,
      });
      
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
      const updatedLiability = await NetWorthApiService.updateLiability(id, data);
      
      if (updatedLiability) {
        // Update in local state
        const currentLiabilities = get().liabilities;
        const oldLiability = currentLiabilities.find(l => l.id === id);
        const balanceDiff = updatedLiability.balance - (oldLiability?.balance ?? 0);
        
        set({ 
          isLoading: false,
          liabilities: currentLiabilities.map(l => l.id === id ? updatedLiability : l),
          summary: get().summary ? {
            ...get().summary!,
            totalLiabilities: get().summary!.totalLiabilities + balanceDiff,
            netWorth: get().summary!.netWorth - balanceDiff,
          } : null,
        });
      } else {
        set({ isLoading: false });
      }
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
      
      // Remove from local state
      const currentLiabilities = get().liabilities;
      const deletedLiability = currentLiabilities.find(l => l.id === id);
      
      set({ 
        isLoading: false,
        liabilities: currentLiabilities.filter(l => l.id !== id),
        summary: deletedLiability && get().summary ? {
          ...get().summary!,
          totalLiabilities: get().summary!.totalLiabilities - deletedLiability.balance,
          netWorth: get().summary!.netWorth + deletedLiability.balance,
        } : get().summary,
      });
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

