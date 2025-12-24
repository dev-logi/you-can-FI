/**
 * Multi Item Form Component
 * 
 * Form for entering details for multiple items of the same category.
 * Used after count input in dashboard add flows.
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from './Button';
import { Input, CurrencyInput } from './Input';
import { AssetCategory, LiabilityCategory } from '../types';

interface AssetItemData {
  name: string;
  value: number;
}

interface LiabilityItemData {
  name: string;
  balance: number;
  interestRate?: number;
}

interface MultiItemFormProps {
  count: number;
  category: AssetCategory | LiabilityCategory;
  categoryLabel: string;
  defaultName: string;
  isLiability?: boolean;
  onSave: (items: AssetItemData[] | LiabilityItemData[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type ItemData = AssetItemData | LiabilityItemData;

export function MultiItemForm({
  count,
  category,
  categoryLabel,
  defaultName,
  isLiability = false,
  onSave,
  onCancel,
  isLoading = false,
}: MultiItemFormProps) {
  const [items, setItems] = useState<AssetItemData[] | LiabilityItemData[]>(() => {
    if (isLiability) {
      return Array.from({ length: count }, (_, i) => ({
        name: count > 1 ? `${defaultName} ${i + 1}` : defaultName,
        balance: 0,
        interestRate: undefined,
      })) as LiabilityItemData[];
    } else {
      return Array.from({ length: count }, (_, i) => ({
        name: count > 1 ? `${defaultName} ${i + 1}` : defaultName,
        value: 0,
      })) as AssetItemData[];
    }
  });

  const handleItemChange = (index: number, field: string, value: string | number | undefined) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    await onSave(items);
  };

  const canSave = isLiability
    ? (items as LiabilityItemData[]).every((item) => item.name.trim() && item.balance > 0)
    : (items as AssetItemData[]).every((item) => item.name.trim() && item.value > 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
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
          <Pressable onPress={onCancel} style={{ minWidth: 60 }}>
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
              {isLiability ? 'Add Liabilities' : 'Add Assets'}
            </Text>
          </XStack>
          <XStack width={60} />
        </XStack>

        <ScrollView
          flex={1}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <YStack gap={8} marginBottom={24}>
              <Pressable onPress={onCancel}>
                <Text fontSize={14} color="#1e3a5f">
                  ← Change category
                </Text>
              </Pressable>
              <Text fontSize={20} fontWeight="700" color="#2d3436">
                Enter Details
              </Text>
              <Text fontSize={14} color="#636e72">
                {count === 1
                  ? `Enter details for your ${categoryLabel.toLowerCase()}`
                  : `Enter details for ${count} ${categoryLabel.toLowerCase()} accounts`}
              </Text>
            </YStack>
          </Animated.View>

        <YStack gap={24}>
          {items.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(200 + index * 50).springify()}
            >
              <YStack
                padding={20}
                backgroundColor="#ffffff"
                borderRadius={16}
                borderWidth={1}
                borderColor="#e8e8e8"
                gap={16}
              >
                <Text fontSize={16} fontWeight="600" color="#2d3436">
                  {count > 1 ? `${categoryLabel} ${index + 1}` : categoryLabel}
                </Text>

                <Input
                  label="Name"
                  placeholder={`e.g., ${defaultName}${count > 1 ? ` ${index + 1}` : ''}`}
                  value={item.name}
                  onChangeText={(text) => handleItemChange(index, 'name', text)}
                />

                {isLiability ? (
                  <>
                    <CurrencyInput
                      label="Current Balance"
                      value={(item as LiabilityItemData).balance}
                      onChangeValue={(val) => handleItemChange(index, 'balance', val)}
                      placeholder="0"
                    />
                    <Input
                      label="Interest Rate (%)"
                      placeholder="e.g., 18.99"
                      value={(item as LiabilityItemData).interestRate?.toString() || ''}
                      onChangeText={(text) => {
                        const num = text ? parseFloat(text) : undefined;
                        handleItemChange(index, 'interestRate', num);
                      }}
                      keyboardType="decimal-pad"
                      helperText="Optional"
                    />
                  </>
                ) : (
                  <CurrencyInput
                    label="Current Value"
                    value={(item as AssetItemData).value}
                    onChangeValue={(val) => handleItemChange(index, 'value', val)}
                    placeholder="0"
                  />
                )}
              </YStack>
            </Animated.View>
          ))}
        </YStack>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <YStack gap={12} marginTop={24}>
            <Button
              variant="primary"
              fullWidth
              onPress={handleSave}
              loading={isLoading}
              disabled={!canSave}
            >
              {count === 1 ? 'Add' : `Add ${count} Items`}
            </Button>
            <Button variant="ghost" fullWidth onPress={onCancel}>
              Cancel
            </Button>
          </YStack>
        </Animated.View>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}

