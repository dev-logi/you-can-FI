/**
 * Plaid Link Button Component
 * 
 * Button to initiate Plaid Link flow for connecting bank accounts.
 */

import React, { useState, useEffect } from 'react';
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

      if (token) {
        setModalVisible(true);
      }
    } catch (err) {
      console.error('[PlaidLinkButton] Error:', err);
      onError?.(err);
    }
  };

  const handleSuccess = (publicToken: string, metadata: any) => {
    setModalVisible(false);
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
        disabled={isLoading || !linkToken}
      >
        Connect Bank Account
      </Button>

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

