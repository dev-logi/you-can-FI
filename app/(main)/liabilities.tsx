/**
 * Liabilities List Screen
 * 
 * Shows all liabilities with edit/delete functionality.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { getLiabilityCategoryLabel } from '../../src/features/netWorth/service';
import { Liability, LiabilityCategory } from '../../src/shared/types';
import { formatCurrency, formatPercentage } from '../../src/shared/utils';

export default function LiabilitiesScreen() {
  const router = useRouter();
  const { liabilities, updateLiability, deleteLiability, isLoading, summary } = useNetWorthStore();
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState(0);
  const [editInterestRate, setEditInterestRate] = useState('');

  const handleEdit = (liability: Liability) => {
    setEditingLiability(liability);
    setEditName(liability.name);
    setEditBalance(liability.balance);
    setEditInterestRate(liability.interestRate?.toString() ?? '');
  };

  const handleSave = async () => {
    if (!editingLiability) return;

    await updateLiability(editingLiability.id, {
      name: editName,
      balance: editBalance,
      interestRate: editInterestRate ? parseFloat(editInterestRate) : undefined,
    });

    setEditingLiability(null);
  };

  const handleDelete = (liability: Liability) => {
    Alert.alert(
      'Delete Liability',
      `Are you sure you want to delete "${liability.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLiability(liability.id),
        },
      ]
    );
  };

  // Group liabilities by category
  const groupedLiabilities = liabilities.reduce((acc, liability) => {
    if (!acc[liability.category]) {
      acc[liability.category] = [];
    }
    acc[liability.category].push(liability);
    return acc;
  }, {} as Record<LiabilityCategory, Liability[]>);

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
              Liabilities
            </Text>
            <Text fontSize={16} fontWeight="600" color="#c75c5c">
              {formatCurrency(summary?.totalLiabilities ?? 0)}
            </Text>
          </XStack>
        </Animated.View>

        {/* Liability List */}
        <ScrollView flex={1} paddingHorizontal={24}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {liabilities.length === 0 ? (
              <Card marginTop={24}>
                <YStack alignItems="center" padding={32} gap={16}>
                  <Text fontSize={48}>✨</Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    No liabilities. You're debt-free! Keep it up.
                  </Text>
                  <Button
                    variant="secondary"
                    onPress={() => router.push('/(main)/add-liability')}
                  >
                    Add Liability
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap={24} paddingBottom={100}>
                {Object.entries(groupedLiabilities).map(([category, categoryLiabilities]) => (
                  <YStack key={category} gap={12}>
                    <Text fontSize={14} fontWeight="600" color="#636e72">
                      {getLiabilityCategoryLabel(category as LiabilityCategory).toUpperCase()}
                    </Text>
                    {categoryLiabilities.map((liability) => (
                      <Card key={liability.id} pressable>
                        <XStack justifyContent="space-between" alignItems="center">
                          <YStack flex={1}>
                            <Text fontSize={16} fontWeight="600" color="#2d3436">
                              {liability.name}
                            </Text>
                            <XStack gap={8} alignItems="center">
                              <Text fontSize={20} fontWeight="700" color="#c75c5c">
                                {formatCurrency(liability.balance)}
                              </Text>
                              {liability.interestRate && (
                                <Text fontSize={12} color="#636e72">
                                  @ {formatPercentage(liability.interestRate)}
                                </Text>
                              )}
                            </XStack>
                          </YStack>
                          <XStack gap={8}>
                            <Pressable onPress={() => handleEdit(liability)}>
                              <Text fontSize={14} color="#1e3a5f">
                                Edit
                              </Text>
                            </Pressable>
                            <Pressable onPress={() => handleDelete(liability)}>
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
        {liabilities.length > 0 && (
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
              onPress={() => router.push('/(main)/add-liability')}
            >
              + Add Liability
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Edit Modal */}
      <Modal
        visible={editingLiability !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingLiability(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <YStack
            flex={1}
            backgroundColor="rgba(0,0,0,0.5)"
            justifyContent="flex-end"
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
                  Edit Liability
                </Text>
                <Pressable onPress={() => setEditingLiability(null)}>
                  <Text fontSize={24} color="#636e72">×</Text>
                </Pressable>
              </XStack>

              <Input
                label="Name"
                value={editName}
                onChangeText={setEditName}
              />

              <CurrencyInput
                label="Balance"
                value={editBalance}
                onChangeValue={setEditBalance}
              />

              <Input
                label="Interest Rate (%)"
                value={editInterestRate}
                onChangeText={setEditInterestRate}
                keyboardType="decimal-pad"
                placeholder="e.g., 6.5"
                helperText="Optional"
              />

              <Button
                variant="primary"
                fullWidth
                onPress={handleSave}
                loading={isLoading}
                disabled={!editName || editBalance <= 0}
              >
                Save Changes
              </Button>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

