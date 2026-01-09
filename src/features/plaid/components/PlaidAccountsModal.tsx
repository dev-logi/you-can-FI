/**
 * Plaid Accounts Modal
 * 
 * Shows ALL accounts returned from Plaid in a list view.
 * User can toggle accounts on/off and add all selected at once.
 * Creates assets/liabilities directly without navigation.
 * Shows completion summary after processing.
 * 
 * Future subscription consideration:
 * - Free tier: limit to 3 connections, show upgrade prompt when exceeded
 * - Premium tier: unlimited connections
 */

import React, { useState, useEffect } from 'react';
import { Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Button, Card } from '../../../shared/components';
import { useNetWorthStore } from '../../netWorth/store';
import { usePlaidStore } from '../store';
import type { PlaidAccountInfo } from '../../../api/services/plaidService';
import { formatCurrency } from '../../../shared/utils';

interface PlaidAccountsModalProps {
  visible: boolean;
  accounts: PlaidAccountInfo[];
  institutionName?: string;
  onClose: () => void;
  onComplete: () => void;
}

type ModalStep = 'select' | 'processing' | 'summary';

interface AccountResult {
  account: PlaidAccountInfo;
  success: boolean;
  error?: string;
  entityId?: string;
}

export function PlaidAccountsModal({
  visible,
  accounts,
  institutionName,
  onClose,
  onComplete,
}: PlaidAccountsModalProps) {
  const router = useRouter();
  const { addAsset, addLiability, refresh } = useNetWorthStore();
  const { linkAccount } = usePlaidStore();
  
  // Track which accounts are selected (toggled on)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<ModalStep>('select');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [processingIndex, setProcessingIndex] = useState(0);

  // Initialize selected accounts when modal opens
  useEffect(() => {
    if (visible && accounts.length > 0) {
      // Default: all accounts selected
      setSelectedAccounts(new Set(accounts.map(acc => acc.account_id)));
      setStep('select');
      setResults([]);
      setProcessingIndex(0);
    }
  }, [visible, accounts]);

  if (!visible || accounts.length === 0) return null;

  const selectedCount = selectedAccounts.size;
  const totalAccounts = accounts.length;

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedAccounts(new Set(accounts.map(acc => acc.account_id)));
  };

  const deselectAll = () => {
    setSelectedAccounts(new Set());
  };

  const handleAddSelected = async () => {
    if (selectedCount === 0) {
      // Nothing selected, just close
      onComplete();
      return;
    }

    setStep('processing');
    const accountsToAdd = accounts.filter(acc => selectedAccounts.has(acc.account_id));
    const newResults: AccountResult[] = [];

    for (let i = 0; i < accountsToAdd.length; i++) {
      const account = accountsToAdd[i];
      setProcessingIndex(i);

      try {
        let entityId: string | undefined;

        if (account.is_asset) {
          // Create asset
          const asset = await addAsset({
            category: (account.suggested_category as any) || 'other',
            name: account.name,
            value: Math.abs(account.current_balance || 0),
          });
          entityId = asset?.id;
        } else {
          // Create liability
          const liability = await addLiability({
            category: (account.suggested_category as any) || 'other',
            name: account.name,
            balance: Math.abs(account.current_balance || 0),
          });
          entityId = liability?.id;
        }

        // Link to Plaid account
        if (entityId) {
          try {
            await linkAccount({
              connected_account_id: account.account_id,
              entity_id: entityId,
              entity_type: account.is_asset ? 'asset' : 'liability',
            });
          } catch (linkError) {
            console.error('[PlaidAccountsModal] Failed to link account:', linkError);
            // Don't fail the whole operation if linking fails
          }
        }

        newResults.push({ account, success: true, entityId });
      } catch (error: any) {
        console.error('[PlaidAccountsModal] Failed to create:', error);
        newResults.push({ 
          account, 
          success: false, 
          error: error?.message || 'Failed to create' 
        });
      }
    }

    // Add skipped accounts to results
    const skippedAccounts = accounts.filter(acc => !selectedAccounts.has(acc.account_id));
    skippedAccounts.forEach(account => {
      newResults.push({ account, success: false, error: 'Skipped' });
    });

    setResults(newResults);
    setStep('summary');
    await refresh();
  };

  const handleDone = () => {
    onComplete();
  };

  const handleViewAssets = () => {
    onClose();
    router.push('/(main)/assets');
  };

  const getAccountTypeLabel = (account: PlaidAccountInfo) => {
    const parts: string[] = [];
    if (account.subtype) parts.push(account.subtype);
    if (account.mask) parts.push(`•••• ${account.mask}`);
    return parts.join(' • ') || account.type;
  };

  const successCount = results.filter(r => r.success).length;
  const skippedCount = results.filter(r => !r.success).length;

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
              <YStack flex={1}>
                <Text fontSize={20} fontWeight="700" color="#2d3436">
                  {step === 'summary' ? 'Done!' : `${institutionName || 'Bank'} Accounts`}
                </Text>
                {step === 'select' && (
                  <Text fontSize={14} color="#636e72" marginTop={4}>
                    {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} found
                  </Text>
                )}
              </YStack>
              {step !== 'processing' && (
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text fontSize={24} color="#636e72">×</Text>
                </Pressable>
              )}
            </XStack>

            {step === 'select' && (
              <>
                {/* Batch Actions */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <XStack 
                    padding={16} 
                    paddingBottom={8} 
                    justifyContent="space-between" 
                    alignItems="center"
                  >
                    <Pressable onPress={selectAll}>
                      <Text fontSize={14} fontWeight="600" color="#1e3a5f">
                        Select All ({totalAccounts})
                      </Text>
                    </Pressable>
                    <Pressable onPress={deselectAll}>
                      <Text fontSize={14} color="#636e72">
                        Deselect All
                      </Text>
                    </Pressable>
                  </XStack>
                </Animated.View>

                {/* Account List */}
                <ScrollView flex={1} contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
                  <Animated.View entering={FadeInUp.springify()}>
                    <YStack gap={12}>
                      {accounts.map((account, index) => {
                        const isSelected = selectedAccounts.has(account.account_id);
                        const isAsset = account.is_asset;
                        
                        return (
                          <Pressable 
                            key={account.account_id}
                            onPress={() => toggleAccount(account.account_id)}
                          >
                            <Card
                              backgroundColor={isSelected ? '#ffffff' : '#f5f5f5'}
                              borderWidth={isSelected ? 2 : 1}
                              borderColor={isSelected ? '#1e3a5f' : '#e0e0e0'}
                              opacity={isSelected ? 1 : 0.7}
                            >
                              <XStack alignItems="center" gap={12}>
                                {/* Toggle */}
                                <Switch
                                  value={isSelected}
                                  onValueChange={() => toggleAccount(account.account_id)}
                                  trackColor={{ false: '#e0e0e0', true: '#1e3a5f' }}
                                  thumbColor="#ffffff"
                                />
                                
                                {/* Account Info */}
                                <YStack flex={1} gap={2}>
                                  <Text 
                                    fontSize={16} 
                                    fontWeight="600" 
                                    color={isSelected ? '#2d3436' : '#636e72'}
                                  >
                                    {account.name}
                                  </Text>
                                  <Text fontSize={12} color="#636e72">
                                    {getAccountTypeLabel(account)}
                                  </Text>
                                </YStack>
                                
                                {/* Balance & Type */}
                                <YStack alignItems="flex-end" gap={2}>
                                  {account.current_balance !== undefined && account.current_balance !== null && (
                                    <Text 
                                      fontSize={16} 
                                      fontWeight="700" 
                                      color={isAsset ? '#4a7c59' : '#c75c5c'}
                                    >
                                      {formatCurrency(Math.abs(account.current_balance))}
                                    </Text>
                                  )}
                                  <YStack
                                    backgroundColor={isAsset ? '#e8f5e9' : '#ffebee'}
                                    paddingHorizontal={8}
                                    paddingVertical={2}
                                    borderRadius={8}
                                  >
                                    <Text 
                                      fontSize={10} 
                                      fontWeight="600" 
                                      color={isAsset ? '#4a7c59' : '#c75c5c'}
                                    >
                                      {isAsset ? 'ASSET' : 'DEBT'}
                                    </Text>
                                  </YStack>
                                </YStack>
                              </XStack>
                            </Card>
                          </Pressable>
                        );
                      })}
                    </YStack>
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
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={handleAddSelected}
                    disabled={selectedCount === 0}
                  >
                    {selectedCount === 0 
                      ? 'Select accounts to add' 
                      : `Add ${selectedCount} Account${selectedCount !== 1 ? 's' : ''}`}
                  </Button>
                  <Pressable onPress={onClose}>
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      Skip for now
                    </Text>
                  </Pressable>
                </YStack>
              </>
            )}

            {step === 'processing' && (
              <YStack flex={1} justifyContent="center" alignItems="center" padding={24}>
                <Animated.View entering={FadeInUp.springify()}>
                  <YStack alignItems="center" gap={24}>
                    <ActivityIndicator size="large" color="#1e3a5f" />
                    <YStack alignItems="center" gap={8}>
                      <Text fontSize={20} fontWeight="700" color="#2d3436">
                        Adding accounts...
                      </Text>
                      <Text fontSize={16} color="#636e72">
                        {processingIndex + 1} of {selectedCount}
                      </Text>
                    </YStack>
                    
                    {/* Progress bar */}
                    <YStack width="100%" height={8} backgroundColor="#e0e0e0" borderRadius={4}>
                      <YStack 
                        height={8} 
                        backgroundColor="#4a7c59" 
                        borderRadius={4}
                        width={`${((processingIndex + 1) / selectedCount) * 100}%`}
                      />
                    </YStack>
                  </YStack>
                </Animated.View>
              </YStack>
            )}

            {step === 'summary' && (
              <>
                <ScrollView flex={1} contentContainerStyle={{ padding: 24 }}>
                  <Animated.View entering={FadeInUp.springify()}>
                    {/* Success Message */}
                    <YStack alignItems="center" gap={16} marginBottom={32}>
                      <Text fontSize={48}>
                        {successCount > 0 ? '✓' : '○'}
                      </Text>
                      <YStack alignItems="center" gap={4}>
                        <Text fontSize={24} fontWeight="700" color="#2d3436">
                          {successCount} Account{successCount !== 1 ? 's' : ''} Added
                        </Text>
                        {skippedCount > 0 && (
                          <Text fontSize={14} color="#636e72">
                            {skippedCount} skipped
                          </Text>
                        )}
                      </YStack>
                    </YStack>

                    {/* Results List */}
                    <YStack gap={12}>
                      {results.map((result, index) => {
                        const isAsset = result.account.is_asset;
                        const isSkipped = result.error === 'Skipped';
                        
                        return (
                          <Card 
                            key={result.account.account_id}
                            backgroundColor={result.success ? '#ffffff' : '#f5f5f5'}
                            opacity={result.success ? 1 : 0.7}
                          >
                            <XStack alignItems="center" gap={12}>
                              {/* Status Icon */}
                              <Text fontSize={20}>
                                {result.success ? '✓' : isSkipped ? '−' : '✗'}
                              </Text>
                              
                              {/* Account Info */}
                              <YStack flex={1} gap={2}>
                                <Text 
                                  fontSize={16} 
                                  fontWeight="600" 
                                  color={result.success ? '#2d3436' : '#636e72'}
                                >
                                  {result.account.name}
                                </Text>
                                {!result.success && result.error && (
                                  <Text fontSize={12} color="#c75c5c">
                                    {result.error}
                                  </Text>
                                )}
                              </YStack>
                              
                              {/* Balance & Type */}
                              {result.success && result.account.current_balance !== undefined && (
                                <YStack alignItems="flex-end" gap={2}>
                                  <Text 
                                    fontSize={16} 
                                    fontWeight="700" 
                                    color={isAsset ? '#4a7c59' : '#c75c5c'}
                                  >
                                    {formatCurrency(Math.abs(result.account.current_balance))}
                                  </Text>
                                  <Text fontSize={10} color="#636e72">
                                    {isAsset ? 'Asset' : 'Debt'}
                                  </Text>
                                </YStack>
                              )}
                            </XStack>
                          </Card>
                        );
                      })}
                    </YStack>
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
                  <XStack gap={12}>
                    <Button
                      flex={1}
                      variant="secondary"
                      onPress={handleViewAssets}
                    >
                      View Assets
                    </Button>
                    <Button
                      flex={1}
                      variant="primary"
                      onPress={handleDone}
                    >
                      Done
                    </Button>
                  </XStack>
                </YStack>
              </>
            )}
          </YStack>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
