/**
 * Assets List Screen
 * 
 * Shows all assets with edit/delete functionality.
 * Supports connecting existing assets to Plaid for auto-sync.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { usePlaidStore } from '../../src/features/plaid/store';
import { LinkExistingModal } from '../../src/features/plaid/components/LinkExistingModal';
import { getAssetCategoryLabel } from '../../src/features/netWorth/service';
import { Asset, AssetCategory } from '../../src/shared/types';
import { formatCurrency, formatPercentage, calculatePercentage } from '../../src/shared/utils';
import { HoldingService, GlobalHoldingsResponse, HoldingGroup, AggregatedHolding } from '../../src/api/services/holdingService';

type ViewMode = 'account' | 'holding';

export default function AssetsScreen() {
  const router = useRouter();
  const { assets, updateAsset, deleteAsset, isLoading, summary, refresh } = useNetWorthStore();
  const { isLoading: isPlaidLoading } = usePlaidStore();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState(0);
  
  // State for linking existing asset to Plaid
  const [linkingAsset, setLinkingAsset] = useState<Asset | null>(null);
  
  // View mode toggle state
  const [viewMode, setViewMode] = useState<ViewMode>('account');
  const [holdingsData, setHoldingsData] = useState<GlobalHoldingsResponse | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);
  
  // Fetch holdings when switching to holdings view
  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    setHoldingsError(null);
    try {
      console.log('[Assets] Fetching global holdings...');
      const data = await HoldingService.getAllHoldings();
      console.log('[Assets] Holdings received:', data.total_holdings);
      setHoldingsData(data);
    } catch (err: any) {
      console.error('[Assets] Error fetching holdings:', err);
      setHoldingsError(err?.message || 'Failed to load holdings');
    } finally {
      setHoldingsLoading(false);
    }
  }, []);
  
  // Fetch holdings when view mode changes to 'holding'
  useEffect(() => {
    if (viewMode === 'holding') {
      fetchHoldings();
    }
  }, [viewMode, fetchHoldings]);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditValue(asset.value);
  };

  const handleSave = async () => {
    if (!editingAsset) return;

    await updateAsset(editingAsset.id, {
      name: editName,
      value: editValue,
    });

    setEditingAsset(null);
  };

  const handleDelete = (asset: Asset) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAsset(asset.id),
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group assets by category
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<AssetCategory, Asset[]>);

  // Calculate totals and percentages for each category
  const totalAssets = summary?.totalAssets ?? 0;
  const categoryTotals = Object.entries(groupedAssets).reduce((acc, [category, categoryAssets]) => {
    const total = categoryAssets.reduce((sum, asset) => sum + asset.value, 0);
    const percentage = calculatePercentage(total, totalAssets);
    acc[category] = { total, percentage };
    return acc;
  }, {} as Record<string, { total: number; percentage: number }>);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <XStack
            padding={24}
            paddingBottom={16}
            justifyContent="space-between"
            alignItems="center"
          >
            <Pressable onPress={() => router.back()}>
              <Text fontSize={16} color="#1e3a5f">
                ← Back
              </Text>
            </Pressable>
            <Text fontSize={20} fontWeight="700" color="#2d3436">
              Assets
            </Text>
            <Text fontSize={16} fontWeight="600" color="#4a7c59">
              {formatCurrency(summary?.totalAssets ?? 0)}
            </Text>
          </XStack>
        </Animated.View>

        {/* View Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <XStack paddingHorizontal={24} paddingBottom={16}>
            <XStack
              flex={1}
              backgroundColor="#f0f2f5"
              borderRadius={12}
              padding={4}
            >
              <Pressable
                onPress={() => setViewMode('account')}
                style={{ flex: 1 }}
              >
                <YStack
                  backgroundColor={viewMode === 'account' ? '#ffffff' : 'transparent'}
                  borderRadius={10}
                  paddingVertical={10}
                  alignItems="center"
                  shadowColor={viewMode === 'account' ? '#000' : 'transparent'}
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={viewMode === 'account' ? 0.1 : 0}
                  shadowRadius={2}
                >
                  <Text
                    fontSize={14}
                    fontWeight={viewMode === 'account' ? '600' : '500'}
                    color={viewMode === 'account' ? '#1e3a5f' : '#636e72'}
                  >
                    By Account
                  </Text>
                </YStack>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('holding')}
                style={{ flex: 1 }}
              >
                <YStack
                  backgroundColor={viewMode === 'holding' ? '#ffffff' : 'transparent'}
                  borderRadius={10}
                  paddingVertical={10}
                  alignItems="center"
                  shadowColor={viewMode === 'holding' ? '#000' : 'transparent'}
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={viewMode === 'holding' ? 0.1 : 0}
                  shadowRadius={2}
                >
                  <Text
                    fontSize={14}
                    fontWeight={viewMode === 'holding' ? '600' : '500'}
                    color={viewMode === 'holding' ? '#1e3a5f' : '#636e72'}
                  >
                    By Holding
                  </Text>
                </YStack>
              </Pressable>
            </XStack>
          </XStack>
        </Animated.View>

        {/* Asset List or Holdings View */}
        <ScrollView flex={1} paddingHorizontal={24}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {viewMode === 'holding' ? (
              // Holdings View
              holdingsLoading ? (
                <YStack flex={1} justifyContent="center" alignItems="center" paddingTop={60}>
                  <Spinner size="large" color="#1e3a5f" />
                  <Text fontSize={14} color="#636e72" marginTop={12}>
                    Loading holdings...
                  </Text>
                </YStack>
              ) : holdingsError ? (
                <Card marginTop={24}>
                  <YStack alignItems="center" padding={24} gap={12}>
                    <Text fontSize={40}>⚠️</Text>
                    <Text fontSize={14} color="#c75c5c" textAlign="center">
                      {holdingsError}
                    </Text>
                    <Button variant="secondary" size="small" onPress={fetchHoldings}>
                      Try Again
                    </Button>
                  </YStack>
                </Card>
              ) : !holdingsData || holdingsData.total_holdings === 0 ? (
                <Card marginTop={24}>
                  <YStack alignItems="center" padding={32} gap={16}>
                    <Text fontSize={48}>📊</Text>
                    <Text fontSize={16} color="#636e72" textAlign="center">
                      No investment holdings found. Connect investment accounts to see individual holdings.
                    </Text>
                  </YStack>
                </Card>
              ) : (
                <YStack gap={24} paddingBottom={100}>
                  {/* Holdings Summary */}
                  <Card>
                    <YStack alignItems="center" gap={4}>
                      <Text fontSize={14} color="#636e72">
                        Total Holdings Value
                      </Text>
                      <Text fontSize={28} fontWeight="700" color="#4a7c59">
                        {formatCurrency(holdingsData.total_value)}
                      </Text>
                      <Text fontSize={12} color="#636e72">
                        {holdingsData.total_holdings} holdings across {holdingsData.groups.length} categories
                      </Text>
                    </YStack>
                  </Card>
                  
                  {/* Holdings Groups */}
                  {holdingsData.groups.map((group) => (
                    <HoldingGroupSection key={group.type} group={group} />
                  ))}
                </YStack>
              )
            ) : assets.length === 0 ? (
              <Card marginTop={24}>
                <YStack alignItems="center" padding={32} gap={16}>
                  <Text fontSize={48}>📈</Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    No assets yet. Add your first asset to start tracking your net worth.
                  </Text>
                  <Button
                    variant="primary"
                    onPress={() => router.push('/(main)/add-asset')}
                  >
                    Add Asset
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap={24} paddingBottom={100}>
                {Object.entries(groupedAssets).map(([category, categoryAssets]) => {
                  const categoryTotal = categoryTotals[category];
                  return (
                    <YStack key={category} gap={12}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={14} fontWeight="600" color="#636e72">
                          {getAssetCategoryLabel(category as AssetCategory).toUpperCase()}
                        </Text>
                        <XStack gap={12} alignItems="center">
                          <Text fontSize={14} fontWeight="700" color="#4a7c59" width={90} textAlign="right">
                            {formatCurrency(categoryTotal.total)}
                          </Text>
                          <Text fontSize={12} color="#636e72" width={45} textAlign="right">
                            {formatPercentage(categoryTotal.percentage)}
                          </Text>
                        </XStack>
                      </XStack>
                      {categoryAssets.map((asset) => (
                        <Pressable 
                          key={asset.id}
                          onPress={() => {
                            console.log('[Assets] Navigating to account-detail:', asset.id);
                            router.push(`/(main)/account-detail?id=${asset.id}&type=asset`);
                          }}
                        >
                          <Card>
                            <YStack gap={12}>
                              <XStack justifyContent="space-between" alignItems="center">
                                <YStack flex={1}>
                                  <XStack gap={8} alignItems="center">
                                    <Text fontSize={16} fontWeight="600" color="#2d3436">
                                      {asset.name}
                                    </Text>
                                    {asset.isConnected && (
                                      <YStack
                                        paddingHorizontal={6}
                                        paddingVertical={2}
                                        borderRadius={8}
                                        backgroundColor="#e8f5e9"
                                      >
                                        <Text fontSize={10} fontWeight="600" color="#4a7c59">
                                          SYNCED
                                        </Text>
                                      </YStack>
                                    )}
                                  </XStack>
                                  <Text fontSize={20} fontWeight="700" color="#4a7c59">
                                    {formatCurrency(asset.value)}
                                  </Text>
                                  {asset.isConnected && asset.lastSyncedAt && (
                                    <Text fontSize={11} color="#636e72">
                                      Last synced: {formatDate(asset.lastSyncedAt)}
                                    </Text>
                                  )}
                                </YStack>
                                <XStack gap={8}>
                                  {!asset.isConnected && !asset.connectedAccountId && (
                                    <Pressable onPress={(e) => {
                                      e.stopPropagation();
                                      setLinkingAsset(asset);
                                    }}>
                                      <Text fontSize={14} color="#4a7c59">
                                        Connect
                                      </Text>
                                    </Pressable>
                                  )}
                                  <Pressable onPress={(e) => {
                                    e.stopPropagation();
                                    handleEdit(asset);
                                  }}>
                                    <Text fontSize={14} color="#1e3a5f">
                                      Edit
                                    </Text>
                                  </Pressable>
                                  <Pressable onPress={(e) => {
                                    e.stopPropagation();
                                    handleDelete(asset);
                                  }}>
                                    <Text fontSize={14} color="#c75c5c">
                                      Delete
                                    </Text>
                                  </Pressable>
                                </XStack>
                              </XStack>
                            </YStack>
                          </Card>
                        </Pressable>
                      ))}
                    </YStack>
                  );
                })}
              </YStack>
            )}
          </Animated.View>
        </ScrollView>

        {/* Add Button */}
        {assets.length > 0 && (
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            padding={24}
            backgroundColor="#faf8f5"
          >
            <Button
              variant="primary"
              fullWidth
              onPress={() => router.push('/(main)/add-asset')}
            >
              + Add Asset
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Edit Modal */}
      <Modal
        visible={editingAsset !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingAsset(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          <YStack
            flex={1}
            backgroundColor="rgba(0,0,0,0.5)"
            justifyContent="flex-end"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <YStack
                backgroundColor="#ffffff"
                borderTopLeftRadius={24}
                borderTopRightRadius={24}
                padding={24}
                paddingBottom={40}
                gap={20}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    Edit Asset
                  </Text>
                  <Pressable
                    onPress={() => setEditingAsset(null)}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                      padding: 8,
                      backgroundColor: '#f5f6f7',
                      borderRadius: 20,
                    })}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#636e72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M18 6L6 18M6 6l12 12" />
                    </Svg>
                  </Pressable>
                </XStack>

                <Input
                  label="Name"
                  value={editName}
                  onChangeText={setEditName}
                />

                <CurrencyInput
                  label="Value"
                  value={editValue}
                  onChangeValue={setEditValue}
                />

                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleSave}
                  loading={isLoading}
                  disabled={!editName || editValue <= 0}
                >
                  Save Changes
                </Button>
              </YStack>
            </ScrollView>
          </YStack>
        </KeyboardAvoidingView>
      </Modal>

      {/* Link Existing Asset to Plaid Modal */}
      <LinkExistingModal
        visible={linkingAsset !== null}
        entityId={linkingAsset?.id ?? ''}
        entityName={linkingAsset?.name ?? ''}
        entityType="asset"
        onClose={() => setLinkingAsset(null)}
        onSuccess={() => {
          setLinkingAsset(null);
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

// ========== Holding Group Component ==========

function HoldingGroupSection({ group }: { group: HoldingGroup }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Icon map for security types
  const typeIcons: Record<string, string> = {
    'equity': '📈',
    'etf': '📊',
    'mutual fund': '📁',
    'cryptocurrency': '₿',
    'fixed income': '🏦',
    'derivative': '📉',
    'cash': '💵',
    'other': '📋',
  };
  
  const icon = typeIcons[group.type] || '📋';
  
  return (
    <YStack gap={12}>
      {/* Group Header */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap={8} alignItems="center">
            <Text fontSize={18}>{icon}</Text>
            <Text fontSize={14} fontWeight="600" color="#636e72">
              {group.display_name.toUpperCase()} ({group.holdings_count})
            </Text>
          </XStack>
          <XStack gap={8} alignItems="center">
            <Text fontSize={14} fontWeight="700" color="#4a7c59">
              {formatCurrency(group.total_value)}
            </Text>
            <Text fontSize={14} color="#636e72">
              {isExpanded ? '▼' : '▶'}
            </Text>
          </XStack>
        </XStack>
      </Pressable>
      
      {/* Holdings List */}
      {isExpanded && group.holdings.map((holding) => (
        <HoldingCard key={holding.security_id} holding={holding} />
      ))}
    </YStack>
  );
}

function HoldingCard({ holding }: { holding: AggregatedHolding }) {
  const [showAccounts, setShowAccounts] = useState(false);
  
  // Calculate gain/loss if cost basis available
  const hasGainLoss = holding.total_cost_basis && holding.total_cost_basis > 0;
  const gainLoss = hasGainLoss ? holding.total_value - holding.total_cost_basis! : null;
  const gainLossPercent = hasGainLoss && holding.total_cost_basis! > 0
    ? ((holding.total_value - holding.total_cost_basis!) / holding.total_cost_basis!) * 100
    : null;
  const isGain = gainLoss !== null && gainLoss >= 0;
  
  return (
    <Card>
      <YStack gap={8}>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1}>
            <XStack gap={8} alignItems="center">
              {holding.ticker_symbol && (
                <YStack paddingHorizontal={6} paddingVertical={2} backgroundColor="#f0f2f5" borderRadius={4}>
                  <Text fontSize={12} fontWeight="700" color="#1e3a5f">
                    {holding.ticker_symbol}
                  </Text>
                </YStack>
              )}
              <Text fontSize={15} fontWeight="600" color="#2d3436" numberOfLines={1} flex={1}>
                {holding.security_name}
              </Text>
            </XStack>
            <Text fontSize={12} color="#636e72" marginTop={4}>
              {holding.total_quantity.toFixed(3)} shares @ {formatCurrency(holding.average_price)}
            </Text>
            {/* Single account - show inline */}
            {holding.accounts_count === 1 && holding.accounts[0] && (
              <Text fontSize={11} color="#636e72" marginTop={4}>
                {holding.accounts[0].account_name} • {holding.accounts[0].institution_name}
              </Text>
            )}
            {/* Multiple accounts - expandable */}
            {holding.accounts_count > 1 && (
              <Pressable onPress={() => setShowAccounts(!showAccounts)}>
                <Text fontSize={11} color="#1e3a5f" marginTop={4}>
                  in {holding.accounts_count} accounts {showAccounts ? '▲' : '▼'}
                </Text>
              </Pressable>
            )}
          </YStack>
          <YStack alignItems="flex-end">
            <Text fontSize={18} fontWeight="700" color="#4a7c59">
              {formatCurrency(holding.total_value)}
            </Text>
            {gainLoss !== null && (
              <Text fontSize={12} color={isGain ? '#4a7c59' : '#c75c5c'}>
                {isGain ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPercent?.toFixed(1)}%)
              </Text>
            )}
          </YStack>
        </XStack>
        
        {/* Accounts Breakdown */}
        {showAccounts && holding.accounts.length > 0 && (
          <YStack
            marginTop={8}
            paddingTop={8}
            borderTopWidth={1}
            borderTopColor="#f0f2f5"
            gap={6}
          >
            {holding.accounts.map((acc, idx) => (
              <XStack key={idx} justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontSize={12} color="#636e72" numberOfLines={1}>
                    {acc.account_name}
                  </Text>
                  <Text fontSize={10} color="#a0a0a0">
                    {acc.institution_name}
                  </Text>
                </YStack>
                <Text fontSize={12} color="#2d3436">
                  {formatCurrency(acc.value)}
                </Text>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
