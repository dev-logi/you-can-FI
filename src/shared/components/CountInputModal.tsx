/**
 * Count Input Modal Component
 * 
 * Reusable modal for asking users how many items they want to add.
 * Used in dashboard add flows for itemization.
 */

import React, { useState } from 'react';
import { Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from './Button';

interface CountInputModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm: (count: number) => void;
  maxCount?: number;
  minCount?: number;
}

export function CountInputModal({
  visible,
  title,
  subtitle,
  onClose,
  onConfirm,
  maxCount = 50,
  minCount = 1,
}: CountInputModalProps) {
  const [count, setCount] = useState(minCount);

  const handleDecrement = () => {
    setCount((prev) => Math.max(minCount, prev - 1));
  };

  const handleIncrement = () => {
    setCount((prev) => Math.min(maxCount, prev + 1));
  };

  const handleConfirm = () => {
    onConfirm(count);
    setCount(minCount); // Reset for next time
  };

  const handleClose = () => {
    setCount(minCount); // Reset
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0,0,0,0.5)"
          justifyContent="flex-end"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack
              backgroundColor="#ffffff"
              borderTopLeftRadius={24}
              borderTopRightRadius={24}
              padding={24}
              paddingBottom={40}
              gap={24}
            >
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={8} alignItems="center">
                  <Text fontSize={48}>💰</Text>
                  <Text
                    fontSize={24}
                    fontWeight="700"
                    color="#2d3436"
                    fontFamily="$heading"
                    textAlign="center"
                  >
                    {title}
                  </Text>
                  {subtitle && (
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      {subtitle}
                    </Text>
                  )}
                </YStack>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <XStack
                  alignItems="center"
                  justifyContent="center"
                  gap={24}
                  paddingVertical={24}
                  backgroundColor="#faf8f5"
                  borderRadius={16}
                  borderWidth={2}
                  borderColor="#e8e8e8"
                >
                  <Button
                    variant="ghost"
                    onPress={handleDecrement}
                    disabled={count <= minCount}
                    style={{ minWidth: 60 }}
                  >
                    <Text fontSize={32} fontWeight="700">−</Text>
                  </Button>
                  <Text
                    fontSize={48}
                    fontWeight="700"
                    color="#1e3a5f"
                    minWidth={80}
                    textAlign="center"
                  >
                    {count}
                  </Text>
                  <Button
                    variant="ghost"
                    onPress={handleIncrement}
                    disabled={count >= maxCount}
                    style={{ minWidth: 60 }}
                  >
                    <Text fontSize={32} fontWeight="700">+</Text>
                  </Button>
                </XStack>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <YStack gap={12}>
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={handleConfirm}
                    disabled={count < minCount}
                  >
                    Continue
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onPress={handleClose}
                  >
                    Cancel
                  </Button>
                </YStack>
              </Animated.View>
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}

