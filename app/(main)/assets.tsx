/**
 * Assets List Screen
 * 
 * Shows all assets with edit/delete functionality.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput } from '../../src/shared/components/index';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { getAssetCategoryLabel } from '../../src/features/netWorth/service';
import { Asset, AssetCategory } from '../../src/shared/types';
import { formatCurrency } from '../../src/shared/utils';

export default function AssetsScreen() {
  const router = useRouter();
  const { assets, updateAsset, deleteAsset, isLoading, summary } = useNetWorthStore();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState(0);

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

  // Group assets by category
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<AssetCategory, Asset[]>);

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
                {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
                  <YStack key={category} gap={12}>
                    <Text fontSize={14} fontWeight="600" color="#636e72">
                      {getAssetCategoryLabel(category as AssetCategory).toUpperCase()}
                    </Text>
                    {categoryAssets.map((asset) => (
                      <Card key={asset.id} pressable>
                        <XStack justifyContent="space-between" alignItems="center">
                          <YStack flex={1}>
                            <Text fontSize={16} fontWeight="600" color="#2d3436">
                              {asset.name}
                            </Text>
                            <Text fontSize={20} fontWeight="700" color="#4a7c59">
                              {formatCurrency(asset.value)}
                            </Text>
                          </YStack>
                          <XStack gap={8}>
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
                      </Card>
                    ))}
                  </YStack>
                ))}
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
                  <Pressable onPress={() => setEditingAsset(null)}>
                    <Text fontSize={24} color="#636e72">×</Text>
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
    </SafeAreaView>
  );
}

