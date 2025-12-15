/**
 * Progress Bar Component
 * 
 * Shows progress through onboarding or other flows.
 */

import React from 'react';
import { XStack, YStack, Text, styled } from 'tamagui';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const Container = styled(YStack, {
  gap: 8,
});

const Track = styled(XStack, {
  height: 8,
  backgroundColor: '#e0ddd8',
  borderRadius: 4,
  overflow: 'hidden',
});

const AnimatedFill = Animated.createAnimatedComponent(
  styled(XStack, {
    height: '100%',
    backgroundColor: '#1e3a5f',
    borderRadius: 4,
  })
);

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ progress, showLabel = false, label }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${clampedProgress}%`, {
        damping: 15,
        stiffness: 100,
      }),
    };
  }, [clampedProgress]);

  return (
    <Container>
      {showLabel && (
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={14} color="#636e72">
            {label ?? 'Progress'}
          </Text>
          <Text fontSize={14} fontWeight="600" color="#1e3a5f">
            {clampedProgress}%
          </Text>
        </XStack>
      )}
      <Track>
        <AnimatedFill style={animatedStyle} />
      </Track>
    </Container>
  );
}

