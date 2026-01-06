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
  const { exchangePublicToken } = usePlaidStore();

  // No longer need to inject JavaScript manually - it's now in the HTML

  const handleMessage = async (event: any) => {
    try {
      console.log('[PlaidLinkModal] Received message:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      console.log('[PlaidLinkModal] Parsed message:', message);
      console.log('[PlaidLinkModal] Message type:', message.type);
      
      switch (message.type) {
        case 'PLAID_SUCCESS':
          console.log('[PlaidLinkModal] PLAID_SUCCESS - publicToken:', message.publicToken);
          console.log('[PlaidLinkModal] PLAID_SUCCESS - metadata:', message.metadata);
          try {
            // Exchange public token for access token
            console.log('[PlaidLinkModal] Calling exchangePublicToken...');
            const accounts = await exchangePublicToken(message.publicToken);
            console.log('[PlaidLinkModal] Exchange successful, accounts:', accounts);
            onSuccess(message.publicToken, { ...message.metadata, accounts });
          } catch (error) {
            console.error('[PlaidLinkModal] Error in exchangePublicToken:', error);
            console.error('[PlaidLinkModal] Error details:', {
              message: error?.message,
              detail: error?.detail,
              stack: error?.stack,
              fullError: error
            });
            onError(error);
          }
          break;
        case 'PLAID_EXIT':
          console.log('[PlaidLinkModal] PLAID_EXIT - error:', message.error);
          console.log('[PlaidLinkModal] PLAID_EXIT - metadata:', message.metadata);
          // If there's an error in exit, pass it along
          if (message.error) {
            console.error('[PlaidLinkModal] Exit with error:', message.error);
            onError({ message: message.error, metadata: message.metadata });
          } else {
            onExit();
          }
          break;
        case 'PLAID_ERROR':
          console.error('[PlaidLinkModal] PLAID_ERROR:', message.error);
          console.error('[PlaidLinkModal] PLAID_ERROR metadata:', message.metadata);
          onError({ message: message.error, metadata: message.metadata });
          break;
        case 'PLAID_EVENT':
          console.log('[PlaidLinkModal] PLAID_EVENT:', message.eventName, message.metadata);
          // Log events but don't handle them as errors
          break;
        default:
          console.log('[PlaidLinkModal] Unknown message type:', message.type);
          // Ignore other events
          break;
      }
    } catch (error) {
      console.error('[PlaidLinkModal] Error parsing message:', error);
      console.error('[PlaidLinkModal] Raw event data:', event.nativeEvent.data);
      onError({ message: 'Failed to process Plaid response', originalError: error });
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src *; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
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
            font-size: 16px;
          }
          .error {
            text-align: center;
            color: #c75c5c;
            font-size: 14px;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div id="plaid-link-container">
          <div class="loading">Loading Plaid Link...</div>
        </div>
        <script>
          console.log('[Plaid WebView] Starting Plaid Link initialization...');
          console.log('[Plaid WebView] Link token:', '${linkToken}');
          
          // Function to send messages to React Native
          function sendMessage(type, data) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
            } else {
              console.error('[Plaid WebView] ReactNativeWebView not available');
            }
          }
          
          // Function to show error in UI
          function showError(message) {
            const container = document.getElementById('plaid-link-container');
            if (container) {
              container.innerHTML = '<div class="error">' + message + '</div>';
            }
          }
          
          // Load Plaid Link script
          console.log('[Plaid WebView] Loading Plaid Link script from CDN...');
          const script = document.createElement('script');
          script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          script.async = true;
          
          script.onload = function() {
            console.log('[Plaid WebView] Plaid Link script loaded successfully');
            
            if (window.Plaid && window.Plaid.create) {
              console.log('[Plaid WebView] Creating Plaid Link handler...');
              
              try {
                const linkHandler = window.Plaid.create({
                  token: '${linkToken}',
                  onSuccess: function(publicToken, metadata) {
                    console.log('[Plaid WebView] onSuccess called');
                    sendMessage('PLAID_SUCCESS', { publicToken, metadata });
                  },
                  onExit: function(err, metadata) {
                    console.log('[Plaid WebView] onExit called', err);
                    sendMessage('PLAID_EXIT', { error: err, metadata });
                  },
                  onEvent: function(eventName, metadata) {
                    console.log('[Plaid WebView] onEvent:', eventName);
                    sendMessage('PLAID_EVENT', { eventName, metadata });
                  },
                  onLoad: function() {
                    console.log('[Plaid WebView] Plaid Link loaded');
                  }
                });
                
                console.log('[Plaid WebView] Opening Plaid Link...');
                linkHandler.open();
              } catch (error) {
                console.error('[Plaid WebView] Error creating Plaid Link:', error);
                showError('Failed to initialize Plaid: ' + error.message);
                sendMessage('PLAID_ERROR', { error: 'Failed to create Plaid Link: ' + error.message });
              }
            } else {
              console.error('[Plaid WebView] Plaid.create not available after script load');
              showError('Plaid Link library not available');
              sendMessage('PLAID_ERROR', { error: 'Plaid.create not available' });
            }
          };
          
          script.onerror = function(error) {
            console.error('[Plaid WebView] Failed to load Plaid Link script:', error);
            showError('Failed to load Plaid Link. Please check your internet connection.');
            sendMessage('PLAID_ERROR', { error: 'Failed to load Plaid Link script from CDN' });
          };
          
          console.log('[Plaid WebView] Appending script to head...');
          document.head.appendChild(script);
        </script>
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
              originWhitelist={['*']}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scalesPageToFit={false}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('[PlaidLinkModal] WebView error:', nativeEvent);
                onError({ 
                  message: 'WebView error', 
                  code: nativeEvent.code,
                  description: nativeEvent.description,
                  domain: nativeEvent.domain,
                  url: nativeEvent.url
                });
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('[PlaidLinkModal] WebView HTTP error:', nativeEvent);
                onError({ 
                  message: 'WebView HTTP error', 
                  statusCode: nativeEvent.statusCode,
                  description: nativeEvent.description,
                  url: nativeEvent.url
                });
              }}
              onLoadEnd={() => {
                console.log('[PlaidLinkModal] WebView load ended');
              }}
              onLoadStart={() => {
                console.log('[PlaidLinkModal] WebView load started');
              }}
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

