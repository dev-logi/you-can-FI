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

import { Button, Input, CurrencyInput, OptionButton } from '../../src/shared/components';
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
  const { addLiability, isLoading } = useNetWorthStore();

  const [step, setStep] = useState<'category' | 'details'>('category');
  const [category, setCategory] = useState<LiabilityCategory | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [interestRate, setInterestRate] = useState('');

  const handleCategorySelect = (cat: LiabilityCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = LIABILITY_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    setStep('details');
  };

  const handleSave = async () => {
    if (!category) return;

    await addLiability({
      category,
      name,
      balance,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack
            padding={24}
            paddingBottom={16}
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="#e0ddd8"
          >
            <Pressable onPress={() => router.back()}>
              <Text fontSize={16} color="#636e72">
                Cancel
              </Text>
            </Pressable>
            <Text fontSize={18} fontWeight="700" color="#2d3436">
              Add Liability
            </Text>
            <YStack width={50} />
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
            <YStack flex={1} padding={24} gap={24}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={8}>
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
                <YStack gap={20}>
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

              <YStack flex={1} />

              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleSave}
                  loading={isLoading}
                  disabled={!name || balance <= 0}
                >
                  Add Liability
                </Button>
              </Animated.View>
            </YStack>
          )}
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

