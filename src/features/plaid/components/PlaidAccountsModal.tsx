/**
 * Plaid Accounts Modal
 * 
 * Shows ALL accounts returned from Plaid after linking.
 * Lets user handle each account: link to existing, create new, or skip.
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
import { usePlaidStore } from '../store';
import { useNetWorthStore } from '../../netWorth/store';
import type { PlaidAccountInfo, LinkAccountRequest } from '../../../api/services/plaidService';
import { formatCurrency } from '../../../shared/utils';

interface PlaidAccountsModalProps {
  visible: boolean;
  accounts: PlaidAccountInfo[];
  institutionName?: string;
  onClose: () => void;
  onComplete: () => void;
}

type AccountAction = 'link' | 'create' | 'skip' | null;

interface AccountState {
  action: AccountAction;
  selectedEntityId: string | null;
  isProcessed: boolean;
  error: string | null;
}

export function PlaidAccountsModal({
  visible,
  accounts,
  institutionName,
  onClose,
  onComplete,
}: PlaidAccountsModalProps) {
  const router = useRouter();
  const { linkAccount, isLoading } = usePlaidStore();
  const { assets, liabilities, refresh } = useNetWorthStore();
  
  // Track state for each account
  const [accountStates, setAccountStates] = useState<Record<string, AccountState>>(() => {
    const initial: Record<string, AccountState> = {};
    accounts.forEach(acc => {
      initial[acc.account_id] = {
        action: null,
        selectedEntityId: null,
        isProcessed: false,
        error: null,
      };
    });
    return initial;
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when accounts change
  React.useEffect(() => {
    if (accounts.length > 0) {
      const initial: Record<string, AccountState> = {};
      accounts.forEach(acc => {
        initial[acc.account_id] = {
          action: null,
          selectedEntityId: null,
          isProcessed: false,
          error: null,
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

  // Get matching entities for linking
  const getMatchingEntities = (account: PlaidAccountInfo) => {
    if (account.is_asset) {
      // Show all assets, prioritize matching category
      const matching = assets.filter(a => a.category === account.suggested_category);
      const others = assets.filter(a => a.category !== account.suggested_category);
      return { matching, others, isAsset: true };
    } else {
      const matching = liabilities.filter(l => l.category === account.suggested_category);
      const others = liabilities.filter(l => l.category !== account.suggested_category);
      return { matching, others, isAsset: false };
    }
  };

  const { matching: matchingEntities, others: otherEntities, isAsset } = 
    currentAccount ? getMatchingEntities(currentAccount) : { matching: [], others: [], isAsset: true };

  const updateAccountState = (accountId: string, updates: Partial<AccountState>) => {
    setAccountStates(prev => ({
      ...prev,
      [accountId]: { ...prev[accountId], ...updates },
    }));
  };

  const handleLinkExisting = async () => {
    if (!currentState?.selectedEntityId || !currentAccount) return;
    
    setIsProcessing(true);
    updateAccountState(currentAccount.account_id, { error: null });
    
    try {
      const request: LinkAccountRequest = {
        connected_account_id: currentAccount.account_id,
        entity_id: currentState.selectedEntityId,
        entity_type: isAsset ? 'asset' : 'liability',
      };
      await linkAccount(request);
      updateAccountState(currentAccount.account_id, { isProcessed: true });
      moveToNext();
    } catch (err: any) {
      let errorMessage = 'Failed to link account';
      if (typeof err?.detail === 'string') {
        errorMessage = err.detail;
      } else if (Array.isArray(err?.detail) && err.detail.length > 0) {
        errorMessage = err.detail[0]?.msg || 'Validation error';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      updateAccountState(currentAccount.account_id, { error: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNew = () => {
    if (!currentAccount) return;
    
    // Mark as processed and navigate
    updateAccountState(currentAccount.account_id, { isProcessed: true, action: 'create' });
    
    // Navigate to add screen with Plaid data (including balance)
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
                      <Text fontSize={20} fontWeight="700" color={isAsset ? '#4a7c59' : '#c75c5c'} marginTop={8}>
                        {formatCurrency(Math.abs(currentAccount.current_balance))}
                      </Text>
                    )}
                    {currentAccount?.suggested_category && (
                      <Text fontSize={12} color="#1e3a5f" marginTop={4}>
                        Suggested category: {currentAccount.suggested_category}
                      </Text>
                    )}
                  </YStack>
                </Card>
              </Animated.View>

              {/* Action Selection */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text fontSize={16} fontWeight="600" color="#2d3436" marginBottom={16}>
                  What would you like to do?
                </Text>

                {/* Link to Existing Option */}
                <Pressable
                  onPress={() => updateAccountState(currentAccount.account_id, { action: 'link' })}
                >
                  <Card
                    marginBottom={12}
                    backgroundColor={currentState?.action === 'link' ? '#f0f7ff' : '#ffffff'}
                    borderWidth={currentState?.action === 'link' ? 2 : 1}
                    borderColor={currentState?.action === 'link' ? '#1e3a5f' : '#e0e0e0'}
                  >
                    <YStack gap={4}>
                      <Text fontSize={16} fontWeight="600" color="#2d3436">
                        Link to Existing {isAsset ? 'Asset' : 'Liability'}
                      </Text>
                      <Text fontSize={14} color="#636e72">
                        Connect to an entry you've already added
                      </Text>
                    </YStack>
                  </Card>
                </Pressable>

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
                    <YStack gap={4}>
                      <Text fontSize={16} fontWeight="600" color="#2d3436">
                        Create New {isAsset ? 'Asset' : 'Liability'}
                      </Text>
                      <Text fontSize={14} color="#636e72">
                        Add as a new entry with auto-sync
                      </Text>
                    </YStack>
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
                    <YStack gap={4}>
                      <Text fontSize={16} fontWeight="600" color="#636e72">
                        Skip This Account
                      </Text>
                      <Text fontSize={14} color="#636e72">
                        Don't track this account for now
                      </Text>
                    </YStack>
                  </Card>
                </Pressable>
              </Animated.View>

              {/* Entity Selection (if linking) */}
              {currentState?.action === 'link' && (
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <YStack marginTop={16} gap={12}>
                    {matchingEntities.length > 0 && (
                      <>
                        <Text fontSize={14} fontWeight="600" color="#2d3436">
                          Suggested matches:
                        </Text>
                        {matchingEntities.map(entity => (
                          <Pressable
                            key={entity.id}
                            onPress={() => updateAccountState(currentAccount.account_id, { 
                              selectedEntityId: entity.id 
                            })}
                          >
                            <Card
                              backgroundColor={currentState.selectedEntityId === entity.id ? '#f0f7ff' : '#ffffff'}
                              borderWidth={currentState.selectedEntityId === entity.id ? 2 : 1}
                              borderColor={currentState.selectedEntityId === entity.id ? '#1e3a5f' : '#e0e0e0'}
                            >
                              <XStack justifyContent="space-between" alignItems="center">
                                <YStack flex={1}>
                                  <Text fontSize={16} fontWeight="600" color="#2d3436">
                                    {entity.name}
                                  </Text>
                                  <Text fontSize={14} color="#636e72">
                                    {entity.category}
                                  </Text>
                                </YStack>
                                <Text
                                  fontSize={16}
                                  fontWeight="600"
                                  color={isAsset ? '#4a7c59' : '#c75c5c'}
                                >
                                  {formatCurrency(isAsset ? (entity as any).value : (entity as any).balance)}
                                </Text>
                              </XStack>
                            </Card>
                          </Pressable>
                        ))}
                      </>
                    )}

                    {otherEntities.length > 0 && (
                      <>
                        <Text fontSize={14} fontWeight="600" color="#636e72" marginTop={8}>
                          Other {isAsset ? 'assets' : 'liabilities'}:
                        </Text>
                        {otherEntities.map(entity => (
                          <Pressable
                            key={entity.id}
                            onPress={() => updateAccountState(currentAccount.account_id, { 
                              selectedEntityId: entity.id 
                            })}
                          >
                            <Card
                              backgroundColor={currentState.selectedEntityId === entity.id ? '#f0f7ff' : '#ffffff'}
                              borderWidth={currentState.selectedEntityId === entity.id ? 2 : 1}
                              borderColor={currentState.selectedEntityId === entity.id ? '#1e3a5f' : '#e0e0e0'}
                            >
                              <XStack justifyContent="space-between" alignItems="center">
                                <YStack flex={1}>
                                  <Text fontSize={16} fontWeight="500" color="#2d3436">
                                    {entity.name}
                                  </Text>
                                  <Text fontSize={14} color="#636e72">
                                    {entity.category}
                                  </Text>
                                </YStack>
                                <Text
                                  fontSize={16}
                                  fontWeight="500"
                                  color={isAsset ? '#4a7c59' : '#c75c5c'}
                                >
                                  {formatCurrency(isAsset ? (entity as any).value : (entity as any).balance)}
                                </Text>
                              </XStack>
                            </Card>
                          </Pressable>
                        ))}
                      </>
                    )}

                    {matchingEntities.length === 0 && otherEntities.length === 0 && (
                      <Card variant="highlighted">
                        <Text fontSize={14} color="#636e72" textAlign="center">
                          No existing {isAsset ? 'assets' : 'liabilities'} to link to.
                          Consider creating a new one instead.
                        </Text>
                      </Card>
                    )}
                  </YStack>
                </Animated.View>
              )}

              {/* Error display */}
              {currentState?.error && (
                <Text fontSize={12} color="#c75c5c" textAlign="center" marginTop={16}>
                  {currentState.error}
                </Text>
              )}
            </ScrollView>

            {/* Footer */}
            <YStack 
              padding={24} 
              gap={12} 
              borderTopWidth={1} 
              borderTopColor="#e0e0e0" 
              backgroundColor="#ffffff"
            >
              {currentState?.action === 'link' && (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleLinkExisting}
                  loading={isProcessing || isLoading}
                  disabled={!currentState.selectedEntityId || isProcessing}
                >
                  Link & Continue
                </Button>
              )}
              {currentState?.action === 'create' && (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleCreateNew}
                >
                  Create & Continue
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
