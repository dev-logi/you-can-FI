/**
 * Assets List Screen
 * 
 * Shows all assets with edit/delete functionality.
 * Supports connecting existing assets to Plaid for auto-sync.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
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

export default function AssetsScreen() {
  const router = useRouter();
  const { assets, updateAsset, deleteAsset, isLoading, summary, refresh } = useNetWorthStore();
  const { syncAccount, isLoading: isPlaidLoading } = usePlaidStore();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState(0);
  
  // State for linking existing asset to Plaid
  const [linkingAsset, setLinkingAsset] = useState<Asset | null>(null);

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

  const handleSync = async (asset: Asset) => {
    if (!asset.connectedAccountId) return;
    try {
      await syncAccount(asset.connectedAccountId);
      // Refresh net worth data after sync
      await refresh();
    } catch (error) {
      console.error('[AssetsScreen] Sync error:', error);
    }
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

        {/* Asset List */}
        <ScrollView flex={1} paddingHorizontal={24}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {assets.length === 0 ? (
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
                        <Card key={asset.id} pressable>
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
                                {asset.isConnected && asset.connectedAccountId ? (
                                  <Pressable
                                    onPress={() => handleSync(asset)}
                                    disabled={isPlaidLoading}
                                  >
                                    <Text
                                      fontSize={14}
                                      color="#1e3a5f"
                                      opacity={isPlaidLoading ? 0.5 : 1}
                                    >
                                      {isPlaidLoading ? 'Syncing...' : 'Sync'}
                                    </Text>
                                  </Pressable>
                                ) : (
                                  <Pressable onPress={() => setLinkingAsset(asset)}>
                                    <Text fontSize={14} color="#4a7c59">
                                      Connect
                                    </Text>
                                  </Pressable>
                                )}
                                <Pressable onPress={() => handleEdit(asset)}>
                                  <Text fontSize={14} color="#1e3a5f">
                                    Edit
                                  </Text>
                                </Pressable>
                                <Pressable onPress={() => handleDelete(asset)}>
                                  <Text fontSize={14} color="#c75c5c">
                                    Delete
                                  </Text>
                                </Pressable>
                              </XStack>
                            </XStack>
                          </YStack>
                        </Card>
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

