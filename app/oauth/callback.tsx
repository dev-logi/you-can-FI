/**
 * OAuth Callback Screen
 * 
 * Handles Plaid OAuth redirect after user authenticates with their bank.
 * This screen receives the oauth_state_id and resumes the Plaid Link flow.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Spinner } from 'tamagui';
import { 
  create, 
  open, 
  dismissLink,
  LinkSuccess, 
  LinkExit, 
  LinkIOSPresentationStyle,
  LinkLogLevel,
} from 'react-native-plaid-link-sdk';
import * as Linking from 'expo-linking';

import { usePlaidStore } from '../../src/features/plaid/store';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oauth_state_id?: string; error?: string }>();
  const { linkToken, exchangePublicToken } = usePlaidStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccess = useCallback(async (success: LinkSuccess) => {
    console.log('[OAuthCallback] Link Success:', success);
    
    try {
      // Exchange public token for access token
      await exchangePublicToken(success.publicToken);
      setStatus('success');
      
      // Navigate to main screen after a brief delay
      setTimeout(() => {
        router.replace('/(main)');
      }, 1500);
    } catch (err: any) {
      console.error('[OAuthCallback] Error exchanging token:', err);
      setStatus('error');
      setErrorMessage(err?.detail || err?.message || 'Failed to complete connection');
    }
  }, [exchangePublicToken, router]);

  const handleExit = useCallback((exit: LinkExit) => {
    console.log('[OAuthCallback] Link Exit:', exit);
    dismissLink();
    
    if (exit.error) {
      setStatus('error');
      setErrorMessage(exit.error.displayMessage || exit.error.errorMessage || 'Connection failed');
    } else {
      // User cancelled - go back to main
      router.replace('/(main)');
    }
  }, [router]);

  useEffect(() => {
    const resumeOAuth = async () => {
      console.log('[OAuthCallback] Received params:', params);
      
      // Check for error from OAuth provider
      if (params.error) {
        setStatus('error');
        setErrorMessage(params.error);
        return;
      }

      // Need oauth_state_id to resume
      if (!params.oauth_state_id) {
        setStatus('error');
        setErrorMessage('Missing OAuth state. Please try again.');
        return;
      }

      // Need the original link token
      if (!linkToken) {
        console.log('[OAuthCallback] No stored link token, fetching new one...');
        // If no stored link token, we need to create a new one
        // This shouldn't normally happen, but handle it gracefully
        setStatus('error');
        setErrorMessage('Session expired. Please try connecting again.');
        return;
      }

      try {
        // Build the received redirect URI
        // This MUST be the HTTPS Universal Link URL that Plaid redirected to,
        // NOT the deep link scheme. Plaid validates this matches what it sent.
        const receivedRedirectUri = `https://you-can-fi-production.up.railway.app/oauth/callback?oauth_state_id=${params.oauth_state_id}`;
        
        console.log('[OAuthCallback] Resuming OAuth with:');
        console.log('[OAuthCallback] - Link Token:', linkToken.substring(0, 20) + '...');
        console.log('[OAuthCallback] - Received Redirect URI:', receivedRedirectUri);

        // Re-create Plaid Link with the same token
        create({
          token: linkToken,
          noLoadingState: false,
        });

        // Open Plaid Link to resume OAuth flow
        open({
          onSuccess: handleSuccess,
          onExit: handleExit,
          iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
          logLevel: LinkLogLevel.DEBUG,
          receivedRedirectUri,
        });
      } catch (err: any) {
        console.error('[OAuthCallback] Error resuming OAuth:', err);
        setStatus('error');
        setErrorMessage(err?.message || 'Failed to resume connection');
      }
    };

    resumeOAuth();
  }, [params, linkToken, handleSuccess, handleExit]);

  return (
    <YStack flex={1} backgroundColor="#faf8f5" alignItems="center" justifyContent="center" padding={24}>
      {status === 'loading' && (
        <>
          <Spinner size="large" color="#1e3a5f" />
          <Text fontSize={18} fontWeight="600" color="#2d3436" marginTop={24} textAlign="center">
            Completing Connection...
          </Text>
          <Text fontSize={14} color="#636e72" marginTop={8} textAlign="center">
            Please wait while we finish linking your account.
          </Text>
        </>
      )}

      {status === 'success' && (
        <>
          <Text fontSize={48}>✓</Text>
          <Text fontSize={18} fontWeight="600" color="#4a7c59" marginTop={16} textAlign="center">
            Account Connected!
          </Text>
          <Text fontSize={14} color="#636e72" marginTop={8} textAlign="center">
            Redirecting to dashboard...
          </Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Text fontSize={48}>⚠️</Text>
          <Text fontSize={18} fontWeight="600" color="#c75c5c" marginTop={16} textAlign="center">
            Connection Failed
          </Text>
          <Text fontSize={14} color="#636e72" marginTop={8} textAlign="center">
            {errorMessage}
          </Text>
          <Text
            fontSize={14}
            color="#1e3a5f"
            marginTop={24}
            textDecorationLine="underline"
            onPress={() => router.replace('/(main)')}
          >
            Return to Dashboard
          </Text>
        </>
      )}
    </YStack>
  );
}
