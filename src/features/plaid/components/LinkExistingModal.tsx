/**
 * Link Existing Modal
 * 
 * Modal for connecting an existing asset or liability to a Plaid account.
 * User opens Plaid Link, then selects which Plaid account to link.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../../shared/components';
import { PlaidLinkButton } from './PlaidLinkButton';
import { usePlaidStore } from '../store';
import { useNetWorthStore } from '../../netWorth/store';
import type { PlaidAccountInfo } from '../../../api/services/plaidService';
import { formatCurrency } from '../../../shared/utils';

interface LinkExistingModalProps {
  visible: boolean;
  entityId: string;
  entityName: string;
  entityType: 'asset' | 'liability';
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'connect' | 'select';

export function LinkExistingModal({
  visible,
  entityId,
  entityName,
  entityType,
  onClose,
  onSuccess,
}: LinkExistingModalProps) {
  const { linkAccount, isLoading } = usePlaidStore();
  const { refresh } = useNetWorthStore();
  
  const [step, setStep] = useState<Step>('connect');
  const [availableAccounts, setAvailableAccounts] = useState<PlaidAccountInfo[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setStep('connect');
      setAvailableAccounts([]);
      setSelectedAccountId(null);
      setError(null);
    }
  }, [visible]);

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    console.log('[LinkExistingModal] Plaid success, accounts:', metadata.accounts);
    setError(null);
    
    if (metadata.accounts && metadata.accounts.length > 0) {
      // Filter accounts by type (assets or liabilities)
      const filteredAccounts = metadata.accounts.filter(
        (acc: PlaidAccountInfo) => entityType === 'asset' ? acc.is_asset : !acc.is_asset
      );
      
      if (filteredAccounts.length > 0) {
        setAvailableAccounts(filteredAccounts);
        setInstitutionName(metadata.institution?.name || 'Bank');
        setStep('select');
      } else {
        const typeLabel = entityType === 'asset' ? 'asset' : 'liability';
        setError(`No ${typeLabel} accounts found. The connected accounts are a different type.`);
      }
    } else {
      setError('No accounts found from the bank connection.');
    }
  };

  const handlePlaidError = (err: any) => {
    console.error('[LinkExistingModal] Plaid error:', err);
    setError(err?.message || 'Failed to connect bank');
  };

  const handleLink = async () => {
    if (!selectedAccountId) return;
    
    setIsLinking(true);
    setError(null);
    
    try {
      await linkAccount({
        connected_account_id: selectedAccountId,
        entity_id: entityId,
        entity_type: entityType,
      });
      
      await refresh();
      onSuccess();
    } catch (err: any) {
      let errorMessage = 'Failed to link account';
      if (typeof err?.detail === 'string') {
        errorMessage = err.detail;
      } else if (Array.isArray(err?.detail) && err.detail.length > 0) {
        errorMessage = err.detail[0]?.msg || 'Validation error';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const getAccountTypeLabel = (account: PlaidAccountInfo) => {
    const parts = [account.type];
    if (account.subtype) parts.push(account.subtype);
    if (account.mask) parts.push(`•••• ${account.mask}`);
    return parts.join(' • ');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
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
                Link Financial Account
              </Text>
              <Text fontSize={14} color="#636e72" marginTop={4}>
                Link "{entityName}" to auto-sync
              </Text>
            </YStack>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text fontSize={24} color="#636e72">×</Text>
            </Pressable>
          </XStack>

          <ScrollView flex={1} contentContainerStyle={{ padding: 24 }}>
            {step === 'connect' ? (
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={24}>
                  <Card padding={20}>
                    <YStack gap={16} alignItems="center">
                      <Text fontSize={48}>🏦</Text>
                      <YStack gap={8} alignItems="center">
                        <Text fontSize={18} fontWeight="600" color="#2d3436" textAlign="center">
                          Link your account to sync {entityName}
                        </Text>
                        <Text fontSize={14} color="#636e72" textAlign="center">
                          We'll securely connect to your bank and let you choose which account to link.
                        </Text>
                      </YStack>
                      
                      <YStack width="100%" marginTop={8}>
                        <PlaidLinkButton
                          onSuccess={handlePlaidSuccess}
                          onError={handlePlaidError}
                          onExit={() => {}}
                        />
                      </YStack>
                    </YStack>
                  </Card>

                  {error && (
                    <Card variant="warning">
                      <Text fontSize={14} color="#d4a84b" textAlign="center">
                        {error}
                      </Text>
                    </Card>
                  )}

                  <YStack gap={8}>
                    <XStack gap={8} alignItems="center">
                      <Text fontSize={12} color="#4a7c59">✓</Text>
                      <Text fontSize={12} color="#636e72">Bank-level security</Text>
                    </XStack>
                    <XStack gap={8} alignItems="center">
                      <Text fontSize={12} color="#4a7c59">✓</Text>
                      <Text fontSize={12} color="#636e72">Your credentials are never stored</Text>
                    </XStack>
                    <XStack gap={8} alignItems="center">
                      <Text fontSize={12} color="#4a7c59">✓</Text>
                      <Text fontSize={12} color="#636e72">Disconnect anytime</Text>
                    </XStack>
                  </YStack>
                </YStack>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={16}>
                  <Text fontSize={18} fontWeight="600" color="#2d3436">
                    Select an account from {institutionName}
                  </Text>
                  <Text fontSize={14} color="#636e72">
                    Choose which account to link to "{entityName}"
                  </Text>

                  <YStack gap={12} marginTop={8}>
                    {availableAccounts.map((account) => (
                      <Pressable
                        key={account.account_id}
                        onPress={() => setSelectedAccountId(account.account_id)}
                      >
                        <Card
                          backgroundColor={selectedAccountId === account.account_id ? '#f0f7ff' : '#ffffff'}
                          borderWidth={selectedAccountId === account.account_id ? 2 : 1}
                          borderColor={selectedAccountId === account.account_id ? '#1e3a5f' : '#e0e0e0'}
                        >
                          <XStack justifyContent="space-between" alignItems="center">
                            <YStack flex={1} gap={4}>
                              <Text fontSize={16} fontWeight="600" color="#2d3436">
                                {account.name}
                              </Text>
                              <Text fontSize={14} color="#636e72">
                                {getAccountTypeLabel(account)}
                              </Text>
                            </YStack>
                            {account.current_balance !== undefined && account.current_balance !== null && (
                              <Text
                                fontSize={18}
                                fontWeight="700"
                                color={account.is_asset ? '#4a7c59' : '#c75c5c'}
                              >
                                {formatCurrency(Math.abs(account.current_balance))}
                              </Text>
                            )}
                          </XStack>
                        </Card>
                      </Pressable>
                    ))}
                  </YStack>

                  {error && (
                    <Card variant="warning">
                      <Text fontSize={14} color="#d4a84b" textAlign="center">
                        {error}
                      </Text>
                    </Card>
                  )}
                </YStack>
              </Animated.View>
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
            {step === 'select' && (
              <Button
                variant="primary"
                fullWidth
                onPress={handleLink}
                loading={isLinking || isLoading}
                disabled={!selectedAccountId || isLinking}
              >
                Link Account
              </Button>
            )}
            <Button
              variant="ghost"
              fullWidth
              onPress={onClose}
            >
              Cancel
            </Button>
          </YStack>
        </YStack>
      </SafeAreaView>
    </Modal>
  );
}
