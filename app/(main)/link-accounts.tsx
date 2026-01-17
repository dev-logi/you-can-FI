/**
 * Link Accounts Screen
 * 
 * Unified screen for connecting bank accounts via Plaid.
 * Shows ALL accounts (both assets and liabilities) from the connected institution.
 * Routes them automatically to the correct entity type based on Plaid's classification.
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { usePlaidStore } from '../../src/features/plaid/store';
import { PlaidLinkButton } from '../../src/features/plaid/components/PlaidLinkButton';
import { PlaidAccountsModal } from '../../src/features/plaid/components/PlaidAccountsModal';
import type { PlaidAccountInfo } from '../../src/api/services/plaidService';

export default function LinkAccountsScreen() {
  const router = useRouter();
  const { refresh } = useNetWorthStore();
  const { connectedAccounts } = usePlaidStore();

  const [localError, setLocalError] = useState<string | null>(null);
  
  // Plaid flow state
  const [showPlaidAccountsModal, setShowPlaidAccountsModal] = useState(false);
  const [plaidAccountsToLink, setPlaidAccountsToLink] = useState<PlaidAccountInfo[]>([]);
  const [plaidInstitutionName, setPlaidInstitutionName] = useState<string | undefined>();

  // Count assets vs liabilities in accounts
  const countAccountTypes = (accounts: PlaidAccountInfo[]) => {
    const assets = accounts.filter(acc => acc.is_asset).length;
    const liabilities = accounts.filter(acc => !acc.is_asset).length;
    return { assets, liabilities };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack
            padding={24}
            paddingBottom={16}
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="#e0ddd8"
            minHeight={56}
          >
            <Pressable onPress={() => router.back()} style={{ minWidth: 60 }}>
              <Text fontSize={16} color="#636e72">
                Cancel
              </Text>
            </Pressable>
            <XStack flex={1} justifyContent="center" alignItems="center">
              <Text 
                fontSize={18} 
                fontWeight="700" 
                color="#2d3436"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Link Accounts
              </Text>
            </XStack>
            <XStack width={60} />
          </XStack>

          <ScrollView flex={1} padding={24}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <YStack gap={24}>
                <YStack gap={8}>
                  <Text fontSize={24} fontWeight="700" color="#2d3436">
                    Connect Your Accounts
                  </Text>
                  <Text fontSize={16} color="#636e72">
                    Securely link your bank accounts to automatically sync balances.
                    Assets and debts will be categorized automatically.
                  </Text>
                </YStack>

                {/* Connect Bank Card */}
                <Card
                  padding={24}
                  backgroundColor="#f0f7ff"
                  borderWidth={2}
                  borderColor="#1e3a5f"
                >
                  <YStack gap={16}>
                    <XStack gap={12} alignItems="center">
                      <Text fontSize={36}>🏦</Text>
                      <YStack flex={1}>
                        <Text fontSize={20} fontWeight="700" color="#1e3a5f">
                          Link Financial Accounts
                        </Text>
                        <Text fontSize={14} color="#636e72" marginTop={4}>
                          Connect checking, savings, credit cards, loans, investments & more
                        </Text>
                      </YStack>
                    </XStack>

                    {/* What gets synced */}
                    <YStack gap={8} backgroundColor="#ffffff" padding={16} borderRadius={12}>
                      <Text fontSize={14} fontWeight="600" color="#2d3436">
                        We'll automatically categorize:
                      </Text>
                      <XStack gap={24}>
                        <YStack gap={4}>
                          <Text fontSize={12} fontWeight="600" color="#4a7c59">ASSETS</Text>
                          <Text fontSize={12} color="#636e72">• Checking & Savings</Text>
                          <Text fontSize={12} color="#636e72">• Investments & 401(k)</Text>
                          <Text fontSize={12} color="#636e72">• Brokerage accounts</Text>
                        </YStack>
                        <YStack gap={4}>
                          <Text fontSize={12} fontWeight="600" color="#c75c5c">DEBTS</Text>
                          <Text fontSize={12} color="#636e72">• Credit cards</Text>
                          <Text fontSize={12} color="#636e72">• Mortgages & loans</Text>
                          <Text fontSize={12} color="#636e72">• Student loans</Text>
                        </YStack>
                      </XStack>
                    </YStack>
                    
                    <YStack gap={8}>
                      <PlaidLinkButton
                        onSuccess={(publicToken: string, metadata: any) => {
                          console.log('[LinkAccounts] Plaid success, accounts:', metadata.accounts);
                          if (metadata.accounts && metadata.accounts.length > 0) {
                            // Show ALL accounts - both assets and liabilities
                            setPlaidAccountsToLink(metadata.accounts);
                            setPlaidInstitutionName(metadata.institution?.name);
                            setShowPlaidAccountsModal(true);
                            setLocalError(null);
                          }
                        }}
                        onError={(error) => {
                          console.error('[LinkAccounts] Plaid error:', error);
                          setLocalError(error?.message || 'Failed to connect bank');
                        }}
                        onExit={() => {
                          console.log('[LinkAccounts] Plaid exit');
                        }}
                      />
                      
                      {connectedAccounts.length > 0 && (
                        <Text fontSize={12} color="#4a7c59" textAlign="center">
                          ✓ {connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} already connected
                        </Text>
                      )}
                    </YStack>
                  </YStack>
                </Card>

                {/* Divider */}
                <XStack alignItems="center" gap={16}>
                  <YStack flex={1} height={1} backgroundColor="#e0ddd8" />
                  <Text fontSize={14} color="#636e72">or add manually</Text>
                  <YStack flex={1} height={1} backgroundColor="#e0ddd8" />
                </XStack>

                {/* Manual Entry Options */}
                <YStack gap={12}>
                  <Pressable onPress={() => router.push('/(main)/add-asset?method=manual')}>
                    <Card padding={16}>
                      <XStack gap={12} alignItems="center">
                        <Text fontSize={24}>💰</Text>
                        <YStack flex={1}>
                          <Text fontSize={16} fontWeight="600" color="#2d3436">
                            Add Asset Manually
                          </Text>
                          <Text fontSize={13} color="#636e72" marginTop={2}>
                            Real estate, vehicles, valuables, etc.
                          </Text>
                        </YStack>
                        <Text fontSize={20} color="#636e72">→</Text>
                      </XStack>
                    </Card>
                  </Pressable>

                  <Pressable onPress={() => router.push('/(main)/add-liability?method=manual')}>
                    <Card padding={16}>
                      <XStack gap={12} alignItems="center">
                        <Text fontSize={24}>💳</Text>
                        <YStack flex={1}>
                          <Text fontSize={16} fontWeight="600" color="#2d3436">
                            Add Liability Manually
                          </Text>
                          <Text fontSize={13} color="#636e72" marginTop={2}>
                            Private loans, debts not in banks, etc.
                          </Text>
                        </YStack>
                        <Text fontSize={20} color="#636e72">→</Text>
                      </XStack>
                    </Card>
                  </Pressable>
                </YStack>

                {/* Error display */}
                {localError && (
                  <Card variant="warning">
                    <Text fontSize={14} color="#d4a84b" textAlign="center">
                      {localError}
                    </Text>
                  </Card>
                )}
              </YStack>
            </Animated.View>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>

      {/* Plaid Accounts Modal - Shows ALL accounts */}
      <PlaidAccountsModal
        visible={showPlaidAccountsModal}
        accounts={plaidAccountsToLink}
        institutionName={plaidInstitutionName}
        onClose={() => {
          setShowPlaidAccountsModal(false);
          setPlaidAccountsToLink([]);
          setPlaidInstitutionName(undefined);
        }}
        onComplete={() => {
          setShowPlaidAccountsModal(false);
          setPlaidAccountsToLink([]);
          setPlaidInstitutionName(undefined);
          refresh();
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
