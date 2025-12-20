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

import { Button, Card, Input, CurrencyInput, OptionButton } from '../../src/shared/components/index';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { LiabilityCategory } from '../../src/shared/types';

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
  const { addLiability, isLoading, error } = useNetWorthStore();

  const [step, setStep] = useState<'category' | 'details'>('category');
  const [category, setCategory] = useState<LiabilityCategory | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [interestRate, setInterestRate] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCategorySelect = (cat: LiabilityCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = LIABILITY_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    setStep('details');
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
          ) : (
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
          )}
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

