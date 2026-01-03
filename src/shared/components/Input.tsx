/**
 * Input Component
 * 
 * Styled text input with label and error states.
 */

import React from 'react';
import { Input as TamaguiInput, YStack, Text, styled, GetProps } from 'tamagui';

const StyledInput = styled(TamaguiInput, {
  backgroundColor: '#ffffff',
  borderWidth: 2,
  borderColor: '#e0ddd8',
  borderRadius: 12,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 18, // Increased to prevent top text cutoff
  paddingBottom: 20, // Significantly increased bottom padding to prevent text cutoff when focused
  fontSize: 16,
  color: '#2d3436',
  fontFamily: '$body',
  minHeight: 60, // Increased minimum height to ensure proper text display

  focusStyle: {
    borderColor: '#1e3a5f',
    paddingTop: 18, // Maintain padding when focused
    paddingBottom: 20, // Maintain bottom padding when focused to prevent cutoff
  },

  variants: {
    error: {
      true: {
        borderColor: '#c75c5c',
      },
    },
  } as const,
});

const Label = styled(Text, {
  fontSize: 14,
  fontWeight: '600',
  color: '#2d3436',
  marginBottom: 8,
});

const ErrorText = styled(Text, {
  fontSize: 12,
  color: '#c75c5c',
  marginTop: 4,
});

const HelperText = styled(Text, {
  fontSize: 12,
  color: '#636e72',
  marginTop: 4,
});

interface InputProps extends Omit<GetProps<typeof StyledInput>, 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  return (
    <YStack>
      {label && <Label>{label}</Label>}
      <StyledInput 
        error={!!error} 
        includeFontPadding={false}
        style={[
          {
            paddingTop: 18,
            paddingBottom: 20,
            minHeight: 60,
          },
          style,
        ]}
        {...props} 
      />
      {error && <ErrorText>{error}</ErrorText>}
      {helperText && !error && <HelperText>{helperText}</HelperText>}
    </YStack>
  );
}

// Currency input variant
interface CurrencyInputProps {
  label?: string;
  value: number;
  onChangeValue: (value: number) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export function CurrencyInput({ value, onChangeValue, label, placeholder, error, helperText }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(
    value > 0 ? value.toString() : ''
  );

  const handleChange = (text: string) => {
    // Remove non-numeric characters except decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : cleaned;

    setDisplayValue(formatted);
    
    const numValue = parseFloat(formatted) || 0;
    onChangeValue(numValue);
  };

  return (
    <YStack>
      {label && <Label>{label}</Label>}
      <StyledInput
        keyboardType="decimal-pad"
        value={displayValue}
        onChangeText={handleChange}
        placeholder={placeholder ?? "0"}
        error={!!error}
        includeFontPadding={false}
        style={{
          paddingTop: 18,
          paddingBottom: 20,
          minHeight: 60,
        }}
      />
      {error && <ErrorText>{error}</ErrorText>}
      {helperText && !error && <HelperText>{helperText}</HelperText>}
    </YStack>
  );
}

