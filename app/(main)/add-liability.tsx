/**
 * Add Liability Screen
 * 
 * Modal for adding a new liability.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput, OptionButton, CountInputModal, MultiItemForm, ExistingItemsView } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { LiabilityCategory } from '../../src/shared/types';
import { getLiabilityCategoryLabel } from '../../src/features/netWorth/service';
import { isLiabilityCategoryItemizable, getLiabilityItemizationLabel, getLiabilityAdditionalItemizationLabel } from '../../src/shared/utils/itemization';

// Types for multi-item form
type AssetItemData = {
  name: string;
  value: number;
};

type LiabilityItemData = {
  name: string;
  balance: number;
  interestRate?: number;
};

const LIABILITY_CATEGORIES: Array<{ value: LiabilityCategory; label: string }> = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'other', label: 'Other Debt' },
];

export default function AddLiabilityScreen() {
  const router = useRouter();
  const { addLiability, isLoading, error, liabilities } = useNetWorthStore();

  const [step, setStep] = useState<'category' | 'existing' | 'count' | 'details'>('category');
  const [category, setCategory] = useState<LiabilityCategory | null>(null);
  const [count, setCount] = useState(1);
  const [showCountModal, setShowCountModal] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [interestRate, setInterestRate] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCategorySelect = (cat: LiabilityCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = LIABILITY_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    
    // Check if category supports itemization
    if (isLiabilityCategoryItemizable(cat)) {
      // Check if there are existing items for this category
      const existingItems = liabilities.filter(l => l.category === cat);
      if (existingItems.length > 0) {
        // Show existing items first
        setStep('existing');
      } else {
        // No existing items, show count modal
        setShowCountModal(true);
      }
    } else {
      setStep('details');
    }
  };

  const handleCountConfirm = (selectedCount: number) => {
    setCount(selectedCount);
    setShowCountModal(false);
    setStep('details');
  };

  const handleAddMore = () => {
    // Show count modal to add more items
    setShowCountModal(true);
  };

  const handleMultiItemSave = async (items: any[]) => {
    setLocalError(null);
    try {
      // Create all items sequentially
      const liabilityItems = items as LiabilityItemData[];
      for (const item of liabilityItems) {
        await addLiability({
          category: category!,
          name: item.name,
          balance: item.balance,
          interestRate: item.interestRate,
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to add liabilities:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add liabilities. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!category) return;
    setLocalError(null);

    try {
      await addLiability({
        category,
        name,
        balance,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
      });
      router.back();
    } catch (error: any) {
      console.error('Failed to add liability:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add liability. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const categoryLabel = category ? getLiabilityCategoryLabel(category) : '';
  const defaultName = category ? LIABILITY_CATEGORIES.find((c) => c.value === category)?.label ?? '' : '';
  const existingLiabilities = category ? liabilities.filter(l => l.category === category) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack
            padding={24}
            paddingBottom={16}
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="#e0ddd8"
            minHeight={56}
          >
            <Pressable onPress={() => router.back()} style={{ minWidth: 60 }}>
              <Text fontSize={16} color="#636e72">
                Cancel
              </Text>
            </Pressable>
            <XStack flex={1} justifyContent="center" alignItems="center">
              <Text 
                fontSize={18} 
                fontWeight="700" 
                color="#2d3436"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Add Liability
              </Text>
            </XStack>
            <XStack width={60} />
          </XStack>

          {step === 'category' ? (
            <ScrollView flex={1} padding={24}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={16}>
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    What type of liability?
                  </Text>

                  <YStack gap={12}>
                    {LIABILITY_CATEGORIES.map((cat) => (
                      <OptionButton
                        key={cat.value}
                        label={cat.label}
                        selected={category === cat.value}
                        onPress={() => handleCategorySelect(cat.value)}
                        radio
                      />
                    ))}
                  </YStack>
                </YStack>
              </Animated.View>
            </ScrollView>
          ) : step === 'existing' ? (
            // Show existing items
            <ScrollView 
              flex={1} 
              contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={8} marginBottom={24}>
                  <Pressable onPress={() => setStep('category')}>
                    <Text fontSize={14} color="#1e3a5f">
                      ← Change category
                    </Text>
                  </Pressable>
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    {categoryLabel}
                  </Text>
                </YStack>
              </Animated.View>

              <ExistingItemsView
                existingLiabilities={existingLiabilities}
                category={category!}
                categoryLabel={categoryLabel}
                isLiability={true}
                onAddMore={handleAddMore}
              />
            </ScrollView>
          ) : step === 'count' ? (
            // This step is handled by CountInputModal
            <YStack flex={1} />
          ) : (
            count > 1 ? (
              // Multi-item form
              <MultiItemForm
                count={count}
                category={category!}
                categoryLabel={categoryLabel}
                defaultName={defaultName}
                isLiability={true}
                onSave={handleMultiItemSave}
                onCancel={() => {
                  if (existingLiabilities.length > 0) {
                    setStep('existing');
                  } else {
                    setStep('category');
                  }
                  setCount(1);
                }}
                isLoading={isLoading}
                existingCount={existingLiabilities.length}
              />
            ) : (
              // Single item form
              <ScrollView 
                flex={1} 
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <YStack gap={8} marginBottom={24}>
                    <Pressable onPress={() => setStep('category')}>
                      <Text fontSize={14} color="#1e3a5f">
                        ← Change category
                      </Text>
                    </Pressable>
                    <Text fontSize={20} fontWeight="700" color="#2d3436">
                      Liability Details
                    </Text>
                  </YStack>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <YStack gap={20} marginBottom={24}>
                    <Input
                      label="Name"
                      placeholder="e.g., Chase Sapphire"
                      value={name}
                      onChangeText={setName}
                    />

                    <CurrencyInput
                      label="Current Balance"
                      value={balance}
                      onChangeValue={setBalance}
                      placeholder="0"
                    />

                    <Input
                      label="Interest Rate (%)"
                      placeholder="e.g., 18.99"
                      value={interestRate}
                      onChangeText={setInterestRate}
                      keyboardType="decimal-pad"
                      helperText="Optional"
                    />
                  </YStack>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <YStack gap={12}>
                    {(localError || error) && (
                      <Card variant="warning">
                        <Text fontSize={14} color="#d4a84b" textAlign="center">
                          {localError || error}
                        </Text>
                      </Card>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      onPress={handleSave}
                      loading={isLoading}
                      disabled={!name || balance <= 0}
                    >
                      Add Liability
                    </Button>
                  </YStack>
                </Animated.View>
              </ScrollView>
            )
          )}
        </YStack>
      </KeyboardAvoidingView>

      {/* Count Input Modal */}
      {category && isLiabilityCategoryItemizable(category) && (
        <CountInputModal
          visible={showCountModal}
          title={(liabilities.filter(l => l.category === category).length > 0)
            ? getLiabilityAdditionalItemizationLabel(category)
            : getLiabilityItemizationLabel(category)}
          subtitle="You'll be able to enter details for each account separately"
          onClose={() => {
            setShowCountModal(false);
            if (existingLiabilities.length > 0) {
              setStep('existing');
            } else {
              setStep('category');
            }
          }}
          onConfirm={handleCountConfirm}
          maxCount={50}
          minCount={1}
        />
      )}
    </SafeAreaView>
  );
}

