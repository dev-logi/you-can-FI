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
  backgroundColor: '#f8f9fa',
  borderRadius: 10,
  padding: 14,
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,

  variants: {
    selected: {
      true: {
        backgroundColor: '#e9ecef',
      },
    },
  } as const,
});

const Checkbox = styled(XStack, {
  width: 20,
  height: 20,
  borderRadius: 5,
  borderWidth: 2,
  borderColor: '#667eea',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    selected: {
      true: {
        borderColor: '#667eea',
        backgroundColor: '#667eea',
      },
    },
    radio: {
      true: {
        borderRadius: 10,
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

