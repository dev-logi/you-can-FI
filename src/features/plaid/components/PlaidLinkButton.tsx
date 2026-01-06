/**
 * Plaid Link Button Component
 * 
 * Button to initiate Plaid Link flow using the official native SDK.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Text } from 'tamagui';
import { 
  create, 
  open, 
  dismissLink,
  LinkSuccess, 
  LinkExit, 
  LinkIOSPresentationStyle,
  LinkLogLevel,
  usePlaidEmitter,
  LinkEvent,
} from 'react-native-plaid-link-sdk';

import { Button } from '../../../shared/components';
import { usePlaidStore } from '../store';

interface PlaidLinkButtonProps {
  onSuccess?: (publicToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  onExit?: () => void;
}

export function PlaidLinkButton({ onSuccess, onError, onExit }: PlaidLinkButtonProps) {
  const { createLinkToken, exchangePublicToken, isLoading } = usePlaidStore();
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  // Listen to Plaid events for debugging
  usePlaidEmitter((event: LinkEvent) => {
    console.log('[PlaidLinkButton] Plaid Event:', event.eventName, event.metadata);
  });

  const handleSuccess = useCallback(async (success: LinkSuccess) => {
    console.log('[PlaidLinkButton] Link Success:', success);
    console.log('[PlaidLinkButton] Public Token:', success.publicToken);
    setIsOpening(false);
    setError(null);

    try {
      // Exchange public token for access token
      console.log('[PlaidLinkButton] Exchanging public token...');
      const accounts = await exchangePublicToken(success.publicToken);
      console.log('[PlaidLinkButton] Exchange successful, accounts:', accounts);
      
      onSuccess?.(success.publicToken, { 
        ...success.metadata, 
        accounts 
      });
    } catch (err: any) {
      console.error('[PlaidLinkButton] Error exchanging token:', err);
      const errorMessage = err?.detail || err?.message || 'Failed to exchange token';
      setError(errorMessage);
      onError?.(err);
    }
  }, [exchangePublicToken, onSuccess, onError]);

  const handleExit = useCallback((exit: LinkExit) => {
    console.log('[PlaidLinkButton] Link Exit:', exit);
    setIsOpening(false);
    
    if (exit.error) {
      console.error('[PlaidLinkButton] Exit with error:', exit.error);
      const errorMessage = exit.error.displayMessage || exit.error.errorMessage || 'Connection failed';
      setError(errorMessage);
      onError?.({
        message: errorMessage,
        errorCode: exit.error.errorCode,
        errorType: exit.error.errorType,
        metadata: exit.metadata
      });
    } else {
      console.log('[PlaidLinkButton] User exited without error');
      onExit?.();
    }
    
    // Dismiss Link to clean up
    dismissLink();
  }, [onError, onExit]);

  const handlePress = async () => {
    try {
      setError(null);
      setIsOpening(true);
      
      console.log('[PlaidLinkButton] Creating link token...');
      const linkToken = await createLinkToken();
      
      if (!linkToken) {
        throw new Error('Failed to create link token');
      }
      
      console.log('[PlaidLinkButton] Link token created:', linkToken.substring(0, 20) + '...');
      
      // Create the Link configuration
      console.log('[PlaidLinkButton] Creating Plaid Link...');
      create({
        token: linkToken,
        noLoadingState: false,
      });
      
      // Open Plaid Link
      console.log('[PlaidLinkButton] Opening Plaid Link...');
      open({
        onSuccess: handleSuccess,
        onExit: handleExit,
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        logLevel: LinkLogLevel.DEBUG,
      });
      
    } catch (err: any) {
      console.error('[PlaidLinkButton] Error:', err);
      setIsOpening(false);
      
      let errorMessage = 'Failed to connect to Plaid';
      
      if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Make error messages user-friendly
      if (errorMessage.includes('PLAID_CLIENT_ID') || errorMessage.includes('PLAID_SECRET')) {
        errorMessage = 'Plaid is not configured. Please contact support.';
      }
      
      setError(errorMessage);
      onError?.(err);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onPress={handlePress}
        loading={isLoading || isOpening}
        disabled={isLoading || isOpening}
      >
        Connect Bank Account
      </Button>
      
      {error && (
        <Text fontSize={12} color="#c75c5c" marginTop={4} textAlign="center">
          {error}
        </Text>
      )}
    </>
  );
}
