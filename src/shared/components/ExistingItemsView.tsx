/**
 * Existing Items View Component
 * 
 * Displays existing items for a category with their details.
 * Shows count and allows adding more items.
 */

import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from './Card';
import { Asset, Liability, AssetCategory, LiabilityCategory } from '../types';
import { formatCurrency } from '../utils';

interface ExistingItemsViewProps {
  existingAssets?: Asset[];
  existingLiabilities?: Liability[];
  category: AssetCategory | LiabilityCategory;
  categoryLabel: string;
  isLiability?: boolean;
  onAddMore: () => void;
}

export function ExistingItemsView({
  existingAssets,
  existingLiabilities,
  category,
  categoryLabel,
  isLiability = false,
  onAddMore,
}: ExistingItemsViewProps) {
  const items = isLiability ? existingLiabilities : existingAssets;
  const count = items?.length || 0;
  const totalValue = isLiability
    ? (items as Liability[])?.reduce((sum, item) => sum + item.balance, 0) || 0
    : (items as Asset[])?.reduce((sum, item) => sum + item.value, 0) || 0;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <YStack gap={16} marginBottom={24}>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={4}>
            <Text fontSize={18} fontWeight="700" color="#2d3436">
              Existing {categoryLabel}
            </Text>
            <Text fontSize={14} color="#636e72">
              {count} {count === 1 ? 'account' : 'accounts'} • {formatCurrency(totalValue)} total
            </Text>
          </YStack>
        </XStack>
      </Animated.View>

      <YStack gap={12}>
        {items.map((item, index) => (
          <Animated.View
            key={isLiability ? (item as Liability).id : (item as Asset).id}
            entering={FadeInDown.delay(150 + index * 50).springify()}
          >
            <Card variant="default">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1} gap={4}>
                  <Text fontSize={16} fontWeight="600" color="#2d3436">
                    {item.name}
                  </Text>
                  <Text fontSize={14} color="#636e72">
                    {isLiability
                      ? `Balance: ${formatCurrency((item as Liability).balance)}`
                      : `Value: ${formatCurrency((item as Asset).value)}`}
                    {(item as Liability).interestRate && (
                      <Text fontSize={14} color="#636e72">
                        {' • '}
                        {(item as Liability).interestRate}% APR
                      </Text>
                    )}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          </Animated.View>
        ))}
      </YStack>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Pressable onPress={onAddMore}>
          <Card variant="outline" style={{ borderStyle: 'dashed' }}>
            <XStack alignItems="center" justifyContent="center" gap={8}>
              <Text fontSize={20}>+</Text>
              <Text fontSize={16} fontWeight="600" color="#1e3a5f">
                Add Another {categoryLabel}
              </Text>
            </XStack>
          </Card>
        </Pressable>
      </Animated.View>
    </YStack>
  );
}

