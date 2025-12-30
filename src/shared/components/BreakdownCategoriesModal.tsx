/**
 * Breakdown Categories Modal
 * 
 * Shows all categories in a full-screen modal
 */

import React from 'react';
import { Modal, ScrollView, Pressable, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from './Card';
import { formatCurrency, formatPercentage } from '../utils';
import type { PieChartData } from './PieChart';

interface BreakdownCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: PieChartData[];
  valueColor: string; // Color for values (green for assets, red for liabilities)
}

export function BreakdownCategoriesModal({
  visible,
  onClose,
  title,
  data,
  valueColor,
}: BreakdownCategoriesModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="#ffffff">
        <StatusBar barStyle="dark-content" />

        {/* Header with proper safe area */}
        <YStack
          paddingTop={insets.top + 8}
          paddingHorizontal={20}
          paddingBottom={16}
          backgroundColor="#ffffff"
          borderBottomWidth={1}
          borderBottomColor="#e8e8e8"
        >
          <XStack
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize={24} fontWeight="700" color="#2d3436" flex={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text fontSize={24} fontWeight="600" color="#666">×</Text>
            </Pressable>
          </XStack>
        </YStack>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: '#faf8f5' }}
        >

          {/* Categories List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack gap={12}>
              {data.map((item, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <Card>
                    <XStack
                      justifyContent="space-between"
                      alignItems="center"
                      paddingVertical={8}
                    >
                      <XStack gap={12} alignItems="center" flex={1}>
                        <YStack
                          width={16}
                          height={16}
                          borderRadius={8}
                          backgroundColor={item.color}
                        />
                        <YStack flex={1}>
                          <Text fontSize={16} fontWeight="600" color="#2d3436">
                            {item.label}
                          </Text>
                          <Text fontSize={12} color="#636e72" marginTop={2}>
                            {formatPercentage(item.percentage)} of total
                          </Text>
                        </YStack>
                      </XStack>
                      <Text fontSize={16} fontWeight="600" color={valueColor}>
                        {formatCurrency(item.value)}
                      </Text>
                    </XStack>
                  </Card>
                </Animated.View>
              ))}
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </YStack>
    </Modal>
  );
}

