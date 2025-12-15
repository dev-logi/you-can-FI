/**
 * Add Asset Screen
 * 
 * Modal for adding a new asset.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput, OptionButton } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { AssetCategory } from '../../src/shared/types';
import { ASSET_CATEGORY_CONFIG } from '../../src/features/netWorth/service';

const ASSET_CATEGORIES: Array<{ value: AssetCategory; label: string }> = [
  { value: 'cash', label: 'Cash & Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'retirement_401k', label: '401(k) / 403(b)' },
  { value: 'retirement_ira', label: 'Traditional IRA' },
  { value: 'retirement_roth', label: 'Roth IRA' },
  { value: 'retirement_hsa', label: 'HSA' },
  { value: 'retirement_pension', label: 'Pension' },
  { value: 'retirement_other', label: 'Other Retirement' },
  { value: 'brokerage', label: 'Brokerage / Investments' },
  { value: 'real_estate_primary', label: 'Primary Residence' },
  { value: 'real_estate_rental', label: 'Rental Property' },
  { value: 'real_estate_land', label: 'Land' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'business', label: 'Business' },
  { value: 'valuables', label: 'Valuables' },
  { value: 'other', label: 'Other' },
];

export default function AddAssetScreen() {
  const router = useRouter();
  const { addAsset, isLoading } = useNetWorthStore();

  const [step, setStep] = useState<'category' | 'details'>('category');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);

  const handleCategorySelect = (cat: AssetCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = ASSET_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    setStep('details');
  };

  const handleSave = async () => {
    if (!category) return;

    await addAsset({
      category,
      name,
      value,
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
              Add Asset
            </Text>
            <YStack width={50} />
          </XStack>

          {step === 'category' ? (
            <ScrollView flex={1} padding={24}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={16}>
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    What type of asset?
                  </Text>

                  <YStack gap={12}>
                    {ASSET_CATEGORIES.map((cat) => (
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
                    Asset Details
                  </Text>
                </YStack>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <YStack gap={20}>
                  <Input
                    label="Name"
                    placeholder="e.g., Chase Checking"
                    value={name}
                    onChangeText={setName}
                  />

                  <CurrencyInput
                    label="Current Value"
                    value={value}
                    onChangeValue={setValue}
                    placeholder="0"
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
                  disabled={!name || value <= 0}
                >
                  Add Asset
                </Button>
              </Animated.View>
            </YStack>
          )}
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

