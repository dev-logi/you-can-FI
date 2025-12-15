/**
 * Option Button Component
 * 
 * Used for single/multi-choice questions in onboarding.
 * Shows selected state with checkmark.
 */

import React from 'react';
import { XStack, Text, styled } from 'tamagui';
import { Pressable } from 'react-native';

const Container = styled(XStack, {
  backgroundColor: '#ffffff',
  borderWidth: 2,
  borderColor: '#e0ddd8',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  gap: 12,

  variants: {
    selected: {
      true: {
        borderColor: '#1e3a5f',
        backgroundColor: 'rgba(30, 58, 95, 0.05)',
      },
    },
  } as const,
});

const Checkbox = styled(XStack, {
  width: 24,
  height: 24,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: '#e0ddd8',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    selected: {
      true: {
        borderColor: '#1e3a5f',
        backgroundColor: '#1e3a5f',
      },
    },
    radio: {
      true: {
        borderRadius: 12,
      },
    },
  } as const,
});

const CheckIcon = styled(Text, {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '700',
});

const Label = styled(Text, {
  flex: 1,
  fontSize: 16,
  color: '#2d3436',
});

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  radio?: boolean;
}

export function OptionButton({
  label,
  selected,
  onPress,
  radio = false,
}: OptionButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Container selected={selected}>
        <Checkbox selected={selected} radio={radio}>
          {selected && <CheckIcon>✓</CheckIcon>}
        </Checkbox>
        <Label>{label}</Label>
      </Container>
    </Pressable>
  );
}

