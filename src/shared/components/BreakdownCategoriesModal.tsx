/**
 * Breakdown Categories Modal
 * 
 * Shows all categories in a full-screen modal
 */

import React from 'react';
import { Modal, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
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
              borderBottomColor="#e0e0e0"
              backgroundColor="#ffffff"
            >
              <Text fontSize={20} fontWeight="700" color="#2d3436">
                {title}
              </Text>
              <Pressable 
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text fontSize={28} color="#636e72" lineHeight={28}>×</Text>
              </Pressable>
            </XStack>

            {/* Categories List */}
            <ScrollView
              flex={1}
              contentContainerStyle={{ padding: 24 }}
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
          </YStack>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

