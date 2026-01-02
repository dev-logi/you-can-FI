/**
 * Plaid Link Button Component
 * 
 * Button to initiate Plaid Link flow for connecting bank accounts.
 */

import React, { useState, useEffect } from 'react';
import { Text } from 'tamagui';
import { Button } from '../../../shared/components';
import { usePlaidStore } from '../store';
import { PlaidLinkModal } from './PlaidLinkModal';

interface PlaidLinkButtonProps {
  onSuccess?: (publicToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  onExit?: () => void;
}

export function PlaidLinkButton({ onSuccess, onError, onExit }: PlaidLinkButtonProps) {
  const { createLinkToken, isLoading } = usePlaidStore();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fetch link token when component mounts
    createLinkToken()
      .then((token) => {
        setLinkToken(token);
        setError(null);
      })
      .catch((err: any) => {
        console.error('[PlaidLinkButton] Failed to create link token:', err);
        
        // Extract error message
        let errorMessage = 'Failed to initialize Plaid';
        if (err?.detail) {
          errorMessage = err.detail;
          if (errorMessage.includes('PLAID_CLIENT_ID') || errorMessage.includes('PLAID_SECRET')) {
            errorMessage = 'Plaid is not configured. Please contact support.';
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        // Don't call onError here - let user try manually
      });
  }, []);

  const handlePress = async () => {
    try {
      setError(null);
      // Ensure we have a link token
      let token = linkToken;
      if (!token) {
        token = await createLinkToken();
        setLinkToken(token);
      }

      if (token) {
        setModalVisible(true);
      } else {
        setError('Unable to connect to Plaid. Please try again.');
      }
    } catch (err: any) {
      console.error('[PlaidLinkButton] Error:', err);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to connect to Plaid';
      
      if (err?.detail) {
        // FastAPI error format
        errorMessage = err.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Check for specific error about missing env vars
      if (errorMessage.includes('PLAID_CLIENT_ID') || errorMessage.includes('PLAID_SECRET')) {
        errorMessage = 'Plaid is not configured. Please contact support.';
      }
      
      setError(errorMessage);
      onError?.(err);
    }
  };

  const handleSuccess = (publicToken: string, metadata: any) => {
    setModalVisible(false);
    setError(null);
    onSuccess?.(publicToken, metadata);
  };

  const handleError = (error: any) => {
    setModalVisible(false);
    onError?.(error);
  };

  const handleExit = () => {
    setModalVisible(false);
    onExit?.();
  };

  return (
    <>
      <Button
        variant="primary"
        onPress={handlePress}
        loading={isLoading}
        disabled={isLoading}
      >
        Connect Bank Account
      </Button>
      
      {error && (
        <Text fontSize={12} color="#c75c5c" marginTop={4} textAlign="center">
          {error}
        </Text>
      )}

      <PlaidLinkModal
        visible={modalVisible}
        linkToken={linkToken}
        onSuccess={handleSuccess}
        onError={handleError}
        onExit={handleExit}
      />
    </>
  );
}

