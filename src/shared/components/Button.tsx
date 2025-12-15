/**
 * Custom Button Component
 * 
 * Styled button with primary and secondary variants.
 * Uses Tamagui for consistent theming.
 */

import React from 'react';
import { Button as TamaguiButton, styled, GetProps } from 'tamagui';

const StyledButton = styled(TamaguiButton, {
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 24,
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: 16,

  variants: {
    variant: {
      primary: {
        backgroundColor: '#1e3a5f',
        color: '#ffffff',
        pressStyle: {
          backgroundColor: '#2d5a8a',
          scale: 0.98,
        },
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1e3a5f',
        color: '#1e3a5f',
        pressStyle: {
          backgroundColor: 'rgba(30, 58, 95, 0.1)',
          scale: 0.98,
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#636e72',
        pressStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
      danger: {
        backgroundColor: '#c75c5c',
        color: '#ffffff',
        pressStyle: {
          backgroundColor: '#d77070',
          scale: 0.98,
        },
      },
    },
    size: {
      small: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 14,
      },
      medium: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        fontSize: 16,
      },
      large: {
        paddingVertical: 18,
        paddingHorizontal: 28,
        fontSize: 18,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

type ButtonProps = GetProps<typeof StyledButton> & {
  loading?: boolean;
};

export function Button({ children, loading, disabled, ...props }: ButtonProps) {
  return (
    <StyledButton
      disabled={disabled || loading}
      opacity={disabled || loading ? 0.6 : 1}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </StyledButton>
  );
}

