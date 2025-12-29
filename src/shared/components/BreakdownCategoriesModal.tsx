/**
 * Breakdown Categories Modal
 * 
 * Shows all categories in a full-screen modal
 */

import React from 'react';
import { Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: '#faf8f5' }}
        >
          <YStack flex={1}>
            {/* Header */}
            <XStack
              paddingHorizontal={24}
              paddingVertical={20}
              justifyContent="space-between"
              alignItems="center"
              borderBottomWidth={1}
              borderBottomColor="#f0f0f0"
              backgroundColor="#ffffff"
            >
              <Text fontSize={22} fontWeight="700" color="#2d3436">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 8,
                  backgroundColor: '#f5f6f7',
                  borderRadius: 20,
                })}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#636e72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </Pressable>
            </XStack>

            {/* Categories List */}
            <ScrollView
              flex={1}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
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

