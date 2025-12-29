/**
 * Plaid Link Button Component
 * 
 * Button to initiate Plaid Link flow for connecting bank accounts.
 */

import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Button } from '../../../shared/components';
import { usePlaidStore } from '../store';

interface PlaidLinkButtonProps {
  onSuccess?: (publicToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  onExit?: () => void;
}

export function PlaidLinkButton({ onSuccess, onError, onExit }: PlaidLinkButtonProps) {
  const { createLinkToken, exchangePublicToken, isLoading, error } = usePlaidStore();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fetch link token when component mounts
    createLinkToken().then(setLinkToken).catch((err) => {
      console.error('[PlaidLinkButton] Failed to create link token:', err);
      onError?.(err);
    });
  }, []);

  const handlePress = async () => {
    try {
      // Ensure we have a link token
      let token = linkToken;
      if (!token) {
        token = await createLinkToken();
        setLinkToken(token);
      }

      // For web, we'll use Plaid Link web SDK
      // For native, we'll use react-native-plaid-link-sdk
      if (Platform.OS === 'web') {
        // Web implementation using Plaid Link web SDK
        // This will be implemented when we add the web SDK
        console.log('[PlaidLinkButton] Web Plaid Link not yet implemented');
        onError?.({ message: 'Web Plaid Link not yet implemented' });
      } else {
        // Native implementation using react-native-plaid-link-sdk
        // This will be implemented when we add the native SDK
        console.log('[PlaidLinkButton] Native Plaid Link not yet implemented');
        onError?.({ message: 'Native Plaid Link not yet implemented' });
      }
    } catch (err) {
      console.error('[PlaidLinkButton] Error:', err);
      onError?.(err);
    }
  };

  return (
    <Button
      variant="primary"
      onPress={handlePress}
      loading={isLoading}
      disabled={isLoading || !linkToken}
    >
      Connect Bank Account
    </Button>
  );
}

