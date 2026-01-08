/**
 * Plaid Accounts Modal
 * 
 * Shows ALL accounts returned from Plaid after linking.
 * Simplified flow: Create new entry or Skip.
 * 
 * Note: Linking to existing assets/liabilities is done from the 
 * Assets/Liabilities list screens via "Connect Bank" on individual cards.
 * 
 * Future subscription consideration:
 * - Free tier: limit to 3 connections, show upgrade prompt when exceeded
 * - Premium tier: unlimited connections
 */

import React, { useState } from 'react';
import { Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Button, Card } from '../../../shared/components';
import { useNetWorthStore } from '../../netWorth/store';
import type { PlaidAccountInfo } from '../../../api/services/plaidService';
import { formatCurrency } from '../../../shared/utils';

interface PlaidAccountsModalProps {
  visible: boolean;
  accounts: PlaidAccountInfo[];
  institutionName?: string;
  onClose: () => void;
  onComplete: () => void;
}

type AccountAction = 'create' | 'skip' | null;

interface AccountState {
  action: AccountAction;
  isProcessed: boolean;
}

export function PlaidAccountsModal({
  visible,
  accounts,
  institutionName,
  onClose,
  onComplete,
}: PlaidAccountsModalProps) {
  const router = useRouter();
  const { refresh } = useNetWorthStore();
  
  // Track state for each account
  const [accountStates, setAccountStates] = useState<Record<string, AccountState>>(() => {
    const initial: Record<string, AccountState> = {};
    accounts.forEach(acc => {
      initial[acc.account_id] = {
        action: null,
        isProcessed: false,
      };
    });
    return initial;
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset state when accounts change
  React.useEffect(() => {
    if (accounts.length > 0) {
      const initial: Record<string, AccountState> = {};
      accounts.forEach(acc => {
        initial[acc.account_id] = {
          action: null,
          isProcessed: false,
        };
      });
      setAccountStates(initial);
      setCurrentIndex(0);
    }
  }, [accounts]);

  if (!visible || accounts.length === 0) return null;

  const currentAccount = accounts[currentIndex];
  const currentState = accountStates[currentAccount?.account_id];
  const processedCount = Object.values(accountStates).filter(s => s.isProcessed).length;
  const totalAccounts = accounts.length;
  const isAsset = currentAccount?.is_asset ?? true;

  const updateAccountState = (accountId: string, updates: Partial<AccountState>) => {
    setAccountStates(prev => ({
      ...prev,
      [accountId]: { ...prev[accountId], ...updates },
    }));
  };

  const handleCreateNew = () => {
    if (!currentAccount) return;
    
    // Mark as processed and navigate
    updateAccountState(currentAccount.account_id, { isProcessed: true, action: 'create' });
    
    // Navigate to add screen with Plaid data (including balance)
    // Pass method=manual to skip the gateway screen since we're coming from Plaid
    const route = isAsset ? '/(main)/add-asset' : '/(main)/add-liability';
    
    // Close modal and navigate
    onClose();
    router.push({
      pathname: route,
      params: {
        plaidAccountId: currentAccount.account_id,
        plaidName: currentAccount.name,
        plaidCategory: currentAccount.suggested_category || '',
        plaidType: currentAccount.type || '',
        plaidSubtype: currentAccount.subtype || '',
        plaidBalance: currentAccount.current_balance?.toString() || '',
      },
    });
  };

  const handleSkip = () => {
    if (!currentAccount) return;
    updateAccountState(currentAccount.account_id, { isProcessed: true, action: 'skip' });
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < accounts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All accounts processed
      refresh();
      onComplete();
    }
  };

  const getAccountTypeLabel = (account: PlaidAccountInfo) => {
    const parts = [account.type];
    if (account.subtype) parts.push(account.subtype);
    if (account.mask) parts.push(`•••• ${account.mask}`);
    return parts.join(' • ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <YStack flex={1}>
            {/* Header */}
            <XStack
              padding={24}
              paddingBottom={16}
              justifyContent="space-between"
              alignItems="center"
              borderBottomWidth={1}
              borderBottomColor="#e0e0e0"
              backgroundColor="#ffffff"
            >
              <YStack>
                <Text fontSize={20} fontWeight="700" color="#2d3436">
                  {institutionName || 'Bank'} Accounts
                </Text>
                <Text fontSize={14} color="#636e72" marginTop={4}>
                  Account {currentIndex + 1} of {totalAccounts}
                </Text>
              </YStack>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text fontSize={24} color="#636e72">×</Text>
              </Pressable>
            </XStack>

            {/* Progress indicator */}
            <XStack padding={16} paddingBottom={8} gap={4}>
              {accounts.map((acc, idx) => (
                <YStack
                  key={acc.account_id}
                  flex={1}
                  height={4}
                  borderRadius={2}
                  backgroundColor={
                    accountStates[acc.account_id]?.isProcessed
                      ? '#4a7c59'
                      : idx === currentIndex
                      ? '#1e3a5f'
                      : '#e0e0e0'
                  }
                />
              ))}
            </XStack>

            {/* Current Account Card */}
            <ScrollView flex={1} contentContainerStyle={{ padding: 24 }}>
              <Animated.View entering={FadeInUp.springify()}>
                <Card marginBottom={24}>
                  <YStack gap={8}>
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack flex={1}>
                        <Text fontSize={18} fontWeight="600" color="#2d3436">
                          {currentAccount?.name}
                        </Text>
                        <Text fontSize={14} color="#636e72" marginTop={4}>
                          {currentAccount && getAccountTypeLabel(currentAccount)}
                        </Text>
                      </YStack>
                      <YStack
                        backgroundColor={isAsset ? '#e8f5e9' : '#ffebee'}
                        paddingHorizontal={12}
                        paddingVertical={4}
                        borderRadius={12}
                      >
                        <Text
                          fontSize={12}
                          fontWeight="600"
                          color={isAsset ? '#4a7c59' : '#c75c5c'}
                        >
                          {isAsset ? 'Asset' : 'Liability'}
                        </Text>
                      </YStack>
                    </XStack>
                    {currentAccount?.current_balance !== undefined && currentAccount?.current_balance !== null && (
                      <Text fontSize={24} fontWeight="700" color={isAsset ? '#4a7c59' : '#c75c5c'} marginTop={8}>
                        {formatCurrency(Math.abs(currentAccount.current_balance))}
                      </Text>
                    )}
                    {currentAccount?.suggested_category && (
                      <Text fontSize={12} color="#1e3a5f" marginTop={4}>
                        Category: {currentAccount.suggested_category.replace(/_/g, ' ')}
                      </Text>
                    )}
                  </YStack>
                </Card>
              </Animated.View>

              {/* Action Selection */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text fontSize={16} fontWeight="600" color="#2d3436" marginBottom={16}>
                  Add this account?
                </Text>

                {/* Create New Option */}
                <Pressable
                  onPress={() => updateAccountState(currentAccount.account_id, { action: 'create' })}
                >
                  <Card
                    marginBottom={12}
                    backgroundColor={currentState?.action === 'create' ? '#f0f7ff' : '#ffffff'}
                    borderWidth={currentState?.action === 'create' ? 2 : 1}
                    borderColor={currentState?.action === 'create' ? '#1e3a5f' : '#e0e0e0'}
                  >
                    <XStack gap={12} alignItems="center">
                      <Text fontSize={28}>✓</Text>
                      <YStack flex={1} gap={4}>
                        <Text fontSize={16} fontWeight="600" color="#2d3436">
                          Yes, add as {isAsset ? 'Asset' : 'Liability'}
                        </Text>
                        <Text fontSize={14} color="#636e72">
                          Track this account with auto-sync
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                </Pressable>

                {/* Skip Option */}
                <Pressable
                  onPress={() => updateAccountState(currentAccount.account_id, { action: 'skip' })}
                >
                  <Card
                    marginBottom={12}
                    backgroundColor={currentState?.action === 'skip' ? '#fff5f5' : '#ffffff'}
                    borderWidth={currentState?.action === 'skip' ? 2 : 1}
                    borderColor={currentState?.action === 'skip' ? '#c75c5c' : '#e0e0e0'}
                  >
                    <XStack gap={12} alignItems="center">
                      <Text fontSize={28}>✗</Text>
                      <YStack flex={1} gap={4}>
                        <Text fontSize={16} fontWeight="600" color="#636e72">
                          Skip this account
                        </Text>
                        <Text fontSize={14} color="#636e72">
                          Don't track this account
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                </Pressable>
              </Animated.View>
            </ScrollView>

            {/* Footer */}
            <YStack 
              padding={24} 
              gap={12} 
              borderTopWidth={1} 
              borderTopColor="#e0e0e0" 
              backgroundColor="#ffffff"
            >
              {currentState?.action === 'create' && (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleCreateNew}
                >
                  Add & Continue
                </Button>
              )}
              {currentState?.action === 'skip' && (
                <Button
                  variant="secondary"
                  fullWidth
                  onPress={handleSkip}
                >
                  Skip & Continue
                </Button>
              )}
              {!currentState?.action && (
                <Button
                  variant="ghost"
                  fullWidth
                  onPress={onClose}
                >
                  Cancel
                </Button>
              )}
              
              {/* Summary of processed accounts */}
              {processedCount > 0 && (
                <Text fontSize={12} color="#636e72" textAlign="center">
                  {processedCount} of {totalAccounts} accounts processed
                </Text>
              )}
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
