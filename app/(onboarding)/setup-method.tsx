/**
 * Setup Method Selection Screen
 * 
 * After household selection, user chooses:
 * - Quick Setup (Plaid-first)
 * - Manual Entry
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, ProgressBar, Card } from '../../src/shared/components';
import { PlaidLinkButton } from '../../src/features/plaid/components/PlaidLinkButton';
import { PlaidAccountsModal } from '../../src/features/plaid/components/PlaidAccountsModal';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { usePlaidStore } from '../../src/features/plaid/store';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import type { PlaidAccountInfo } from '../../src/api/services/plaidService';

type SetupMethod = 'quick' | 'manual' | null;

export default function SetupMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress, isLoading } = useOnboardingStore();
  const { connectedAccounts } = usePlaidStore();
  const { refresh } = useNetWorthStore();
  
  const [selected, setSelected] = useState<SetupMethod>(null);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  
  // Plaid flow state
  const [showPlaidAccountsModal, setShowPlaidAccountsModal] = useState(false);
  const [plaidAccountsToLink, setPlaidAccountsToLink] = useState<PlaidAccountInfo[]>([]);
  const [plaidInstitutionName, setPlaidInstitutionName] = useState<string | undefined>();
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(false);

  const handleManualContinue = () => {
    router.push('/(onboarding)/assets/cash');
  };

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    console.log('[SetupMethod] Plaid success, accounts:', metadata.accounts);
    setPlaidError(null);
    
    if (metadata.accounts && metadata.accounts.length > 0) {
      setPlaidAccountsToLink(metadata.accounts);
      setPlaidInstitutionName(metadata.institution?.name);
      setShowPlaidAccountsModal(true);
    }
  };

  const handlePlaidComplete = () => {
    setShowPlaidAccountsModal(false);
    setPlaidAccountsToLink([]);
    setPlaidInstitutionName(undefined);
    setHasConnectedAccounts(true);
    refresh();
  };

  const handleContinueAfterPlaid = () => {
    // After connecting accounts, continue to manual flow for anything missed
    router.push('/(onboarding)/assets/cash');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        {/* Header with Progress */}
        <YStack padding={24} paddingBottom={16}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ProgressBar progress={progress} />
          </Animated.View>
        </YStack>

        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <YStack gap={8} marginBottom={32}>
              <Text
                fontSize={28}
                fontWeight="700"
                color="#2d3436"
                fontFamily="$heading"
              >
                How would you like to start?
              </Text>
              <Text fontSize={16} color="#636e72">
                Choose the method that works best for you
              </Text>
            </YStack>
          </Animated.View>

          {/* Quick Setup Option */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Pressable onPress={() => setSelected('quick')}>
              <Card
                padding={24}
                marginBottom={16}
                backgroundColor={selected === 'quick' ? '#f0f7ff' : '#ffffff'}
                borderWidth={selected === 'quick' ? 2 : 1}
                borderColor={selected === 'quick' ? '#1e3a5f' : '#e0ddd8'}
              >
                <YStack gap={16}>
                  <XStack gap={16} alignItems="flex-start">
                    <Text fontSize={40}>🚀</Text>
                    <YStack flex={1} gap={4}>
                      <XStack alignItems="center" gap={8}>
                        <Text fontSize={20} fontWeight="700" color="#1e3a5f">
                          Quick Setup
                        </Text>
                        <YStack 
                          backgroundColor="#e8f5e9" 
                          paddingHorizontal={8} 
                          paddingVertical={2}
                          borderRadius={8}
                        >
                          <Text fontSize={10} fontWeight="600" color="#4a7c59">
                            RECOMMENDED
                          </Text>
                        </YStack>
                      </XStack>
                      <Text fontSize={14} color="#636e72">
                        Connect your bank accounts and we'll import your balances automatically
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Show Plaid button when selected */}
                  {selected === 'quick' && (
                    <YStack gap={12} marginTop={8}>
                      <PlaidLinkButton
                        onSuccess={handlePlaidSuccess}
                        onError={(error) => {
                          console.error('[SetupMethod] Plaid error:', error);
                          setPlaidError(error?.message || 'Failed to connect bank');
                        }}
                        onExit={() => {
                          console.log('[SetupMethod] Plaid exit');
                        }}
                      />
                      
                      {plaidError && (
                        <Text fontSize={12} color="#c75c5c" textAlign="center">
                          {plaidError}
                        </Text>
                      )}
                      
                      {(hasConnectedAccounts || connectedAccounts.length > 0) && (
                        <YStack gap={8}>
                          <Text fontSize={12} color="#4a7c59" textAlign="center">
                            ✓ {connectedAccounts.length || 'Some'} account{connectedAccounts.length !== 1 ? 's' : ''} connected
                          </Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onPress={handleContinueAfterPlaid}
                          >
                            Continue to add more manually →
                          </Button>
                        </YStack>
                      )}
                    </YStack>
                  )}

                  {/* Benefits */}
                  {selected !== 'quick' && (
                    <YStack gap={6} marginTop={4}>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#4a7c59">✓</Text>
                        <Text fontSize={12} color="#636e72">Auto-import account balances</Text>
                      </XStack>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#4a7c59">✓</Text>
                        <Text fontSize={12} color="#636e72">Keep values synced automatically</Text>
                      </XStack>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#4a7c59">✓</Text>
                        <Text fontSize={12} color="#636e72">Bank-level security</Text>
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </Pressable>
          </Animated.View>

          {/* Manual Entry Option */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Pressable onPress={() => setSelected('manual')}>
              <Card
                padding={24}
                backgroundColor={selected === 'manual' ? '#f0f7ff' : '#ffffff'}
                borderWidth={selected === 'manual' ? 2 : 1}
                borderColor={selected === 'manual' ? '#1e3a5f' : '#e0ddd8'}
              >
                <XStack gap={16} alignItems="flex-start">
                  <Text fontSize={40}>✍️</Text>
                  <YStack flex={1} gap={4}>
                    <Text fontSize={20} fontWeight="700" color="#2d3436">
                      Manual Entry
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      Enter your account values yourself. Great for real estate, vehicles, and other assets.
                    </Text>
                    
                    {/* Benefits */}
                    <YStack gap={6} marginTop={12}>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#636e72">•</Text>
                        <Text fontSize={12} color="#636e72">Full control over your data</Text>
                      </XStack>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#636e72">•</Text>
                        <Text fontSize={12} color="#636e72">No bank connection required</Text>
                      </XStack>
                      <XStack gap={8} alignItems="center">
                        <Text fontSize={12} color="#636e72">•</Text>
                        <Text fontSize={12} color="#636e72">Include all asset types</Text>
                      </XStack>
                    </YStack>
                  </YStack>
                </XStack>
              </Card>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <YStack
          paddingHorizontal={24}
          paddingTop={16}
          paddingBottom={Math.max(insets.bottom, 20) + 16}
          backgroundColor="#faf8f5"
        >
          <Animated.View entering={FadeInUp.delay(500).springify()}>
            {selected === 'manual' && (
              <Button
                variant="primary"
                fullWidth
                onPress={handleManualContinue}
                loading={isLoading}
              >
                Continue with Manual Entry
              </Button>
            )}
            {selected === 'quick' && !hasConnectedAccounts && connectedAccounts.length === 0 && (
              <Text fontSize={12} color="#636e72" textAlign="center">
                Click "Connect Bank Account" above to get started
              </Text>
            )}
            {!selected && (
              <Text fontSize={14} color="#636e72" textAlign="center">
                Select an option above to continue
              </Text>
            )}
          </Animated.View>
        </YStack>
      </YStack>

      {/* Plaid Accounts Modal */}
      <PlaidAccountsModal
        visible={showPlaidAccountsModal}
        accounts={plaidAccountsToLink}
        institutionName={plaidInstitutionName}
        onClose={() => {
          setShowPlaidAccountsModal(false);
          setPlaidAccountsToLink([]);
          setPlaidInstitutionName(undefined);
        }}
        onComplete={handlePlaidComplete}
      />
    </SafeAreaView>
  );
}
