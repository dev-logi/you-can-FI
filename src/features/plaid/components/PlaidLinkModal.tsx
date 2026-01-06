/**
 * Plaid Link Modal Component (DEPRECATED)
 * 
 * This component is no longer used - PlaidLinkButton now handles
 * the Plaid Link flow directly using the native SDK.
 * 
 * Kept for backwards compatibility in case any code still imports it.
 */

import React from 'react';

interface PlaidLinkModalProps {
  visible: boolean;
  linkToken: string | null;
  onSuccess: (publicToken: string, metadata: any) => void;
  onError: (error: any) => void;
  onExit: () => void;
}

/**
 * @deprecated Use PlaidLinkButton instead - it handles the entire Plaid flow.
 */
export function PlaidLinkModal({
  visible,
  linkToken,
  onSuccess,
  onError,
  onExit,
}: PlaidLinkModalProps) {
  // This component is deprecated - PlaidLinkButton now handles everything
  // using the native react-native-plaid-link-sdk
  console.warn('[PlaidLinkModal] This component is deprecated. Use PlaidLinkButton instead.');
  return null;
}
