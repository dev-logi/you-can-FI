/**
 * Plaid Link Modal Component
 * 
 * Modal that displays Plaid Link in a WebView for cross-platform support.
 */

import React, { useRef, useEffect } from 'react';
import { Modal, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';

import { usePlaidStore } from '../store';

// For web, we'll dynamically load Plaid Link script
declare global {
  interface Window {
    Plaid?: {
      create: (config: any) => {
        open: () => void;
      };
    };
  }
}

interface PlaidLinkModalProps {
  visible: boolean;
  linkToken: string | null;
  onSuccess: (publicToken: string, metadata: any) => void;
  onError: (error: any) => void;
  onExit: () => void;
}

export function PlaidLinkModal({
  visible,
  linkToken,
  onSuccess,
  onError,
  onExit,
}: PlaidLinkModalProps) {
  const webViewRef = useRef<WebView>(null);
  const linkHandlerRef = useRef<any>(null); // Store Plaid Link handler
  const { exchangePublicToken } = usePlaidStore();

  useEffect(() => {
    if (!visible || !linkToken) {
      // Clean up when modal closes
      if (linkHandlerRef.current) {
        try {
          linkHandlerRef.current.destroy?.();
        } catch (e) {
          // Ignore cleanup errors
        }
        linkHandlerRef.current = null;
      }
      return;
    }

    // Only create Plaid Link once per token
    const plaidLinkScript = `
      (function() {
        // Clean up any existing Plaid Link instance
        if (window.plaidLinkHandler) {
          try {
            window.plaidLinkHandler.destroy();
          } catch (e) {
            // Ignore cleanup errors
          }
          window.plaidLinkHandler = null;
        }
        
        // Load Plaid Link script if not already loaded
        if (!window.Plaid) {
          const script = document.createElement('script');
          script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          script.onload = function() {
            initializePlaidLink();
          };
          script.onerror = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PLAID_ERROR',
              error: 'Failed to load Plaid Link script'
            }));
          };
          document.head.appendChild(script);
        } else {
          // Script already loaded, initialize immediately
          initializePlaidLink();
        }
        
        function initializePlaidLink() {
          if (window.Plaid && window.Plaid.create) {
            try {
              window.plaidLinkHandler = window.Plaid.create({
                token: '${linkToken}',
                onSuccess: function(publicToken, metadata) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PLAID_SUCCESS',
                    publicToken: publicToken,
                    metadata: metadata
                  }));
                },
                onExit: function(err, metadata) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PLAID_EXIT',
                    error: err,
                    metadata: metadata
                  }));
                },
                onEvent: function(eventName, metadata) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PLAID_EVENT',
                    eventName: eventName,
                    metadata: metadata
                  }));
                }
              });
              
              // Open Link
              window.plaidLinkHandler.open();
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PLAID_ERROR',
                error: 'Failed to create Plaid Link: ' + (error.message || String(error))
              }));
            }
          }
        }
      })();
    `;

    // Inject script after a short delay to ensure WebView is ready
    const timeoutId = setTimeout(() => {
      webViewRef.current?.injectJavaScript(plaidLinkScript);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [visible, linkToken]);

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'PLAID_SUCCESS':
          try {
            // Exchange public token for access token
            const accounts = await exchangePublicToken(message.publicToken);
            onSuccess(message.publicToken, { ...message.metadata, accounts });
          } catch (error) {
            onError(error);
          }
          break;
        case 'PLAID_EXIT':
          onExit();
          break;
        case 'PLAID_ERROR':
          onError({ message: message.error });
          break;
        default:
          // Ignore other events
          break;
      }
    } catch (error) {
      console.error('[PlaidLinkModal] Error parsing message:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
          }
          #plaid-link-container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading {
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div id="plaid-link-container">
          <div class="loading">Loading Plaid Link...</div>
        </div>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onExit}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <YStack flex={1}>
          {/* Header */}
          <XStack
            padding={16}
            paddingBottom={12}
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="#e0e0e0"
            backgroundColor="#ffffff"
          >
            <Text fontSize={18} fontWeight="600" color="#2d3436">
              Connect Bank Account
            </Text>
            <Pressable onPress={onExit} hitSlop={10}>
              <Text fontSize={24} color="#636e72">×</Text>
            </Pressable>
          </XStack>

          {/* WebView */}
          {linkToken ? (
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              style={{ flex: 1 }}
            />
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center" padding={24}>
              <Text fontSize={16} color="#636e72">
                Loading...
              </Text>
            </YStack>
          )}
        </YStack>
      </SafeAreaView>
    </Modal>
  );
}

