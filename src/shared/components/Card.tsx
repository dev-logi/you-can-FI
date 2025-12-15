/**
 * Card Component
 * 
 * Styled container for content sections.
 * Uses Tamagui for consistent theming.
 */

import React from 'react';
import { YStack, styled, GetProps } from 'tamagui';

const StyledCard = styled(YStack, {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,

  variants: {
    variant: {
      default: {},
      highlighted: {
        borderWidth: 2,
        borderColor: '#1e3a5f',
      },
      success: {
        borderWidth: 2,
        borderColor: '#4a7c59',
        backgroundColor: 'rgba(74, 124, 89, 0.05)',
      },
      warning: {
        borderWidth: 2,
        borderColor: '#d4a84b',
        backgroundColor: 'rgba(212, 168, 75, 0.05)',
      },
    },
    pressable: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

type CardProps = GetProps<typeof StyledCard>;

export function Card({ children, ...props }: CardProps) {
  return <StyledCard {...props}>{children}</StyledCard>;
}

