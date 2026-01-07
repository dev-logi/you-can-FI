/**
 * Account Linking Modal Component
 * 
 * Modal that appears after connecting a Plaid account, allowing users to:
 * 1. Link to an existing asset/liability
 * 2. Create a new asset/liability
 */

import React, { useState } from 'react';
import { Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Button, Card } from '../../../shared/components';
import { usePlaidStore } from '../store';
import { useNetWorthStore } from '../../netWorth/store';
import type { PlaidAccountInfo, LinkAccountRequest } from '../../../api/services/plaidService';
import { formatCurrency } from '../../../shared/utils';

interface AccountLinkingModalProps {
  visible: boolean;
  account: PlaidAccountInfo | null;
  onClose: () => void;
  onComplete: () => void;
}

export function AccountLinkingModal({
  visible,
  account,
  onClose,
  onComplete,
}: AccountLinkingModalProps) {
  const router = useRouter();
  const { linkAccount, isLoading } = usePlaidStore();
  const { assets, liabilities } = useNetWorthStore();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [action, setAction] = useState<'link' | 'create'>('link');
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  // Filter existing assets/liabilities that could match
  const matchingEntities = account.is_asset
    ? assets.filter((a) => a.category === account.suggested_category)
    : liabilities.filter((l) => l.category === account.suggested_category);

  const handleLink = async () => {
    if (!selectedEntityId || !account) return;

    setError(null);
    try {
      console.log('[AccountLinkingModal] Linking account:', {
        connected_account_id: account.account_id,
        entity_id: selectedEntityId,
        entity_type: account.is_asset ? 'asset' : 'liability',
      });
      const request: LinkAccountRequest = {
        connected_account_id: account.account_id,
        entity_id: selectedEntityId,
        entity_type: account.is_asset ? 'asset' : 'liability',
      };
      await linkAccount(request);
      console.log('[AccountLinkingModal] Link successful');
      onComplete();
    } catch (err: any) {
      console.error('[AccountLinkingModal] Link error:', err);
      // Handle different error formats (string, array of validation errors, etc.)
      let errorMessage = 'Failed to link account';
      if (typeof err?.detail === 'string') {
        errorMessage = err.detail;
      } else if (Array.isArray(err?.detail) && err.detail.length > 0) {
        errorMessage = err.detail[0]?.msg || 'Validation error';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleCreate = () => {
    // Close the modal first
    onClose();
    
    // Navigate to add asset/liability screen with pre-filled Plaid data
    const route = account.is_asset ? '/(main)/add-asset' : '/(main)/add-liability';
    router.push({
      pathname: route,
      params: {
        plaidAccountId: account.account_id,
        plaidName: account.name,
        plaidCategory: account.suggested_category || '',
        plaidType: account.type || '',
        plaidSubtype: account.subtype || '',
      },
    });
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
              <Text fontSize={20} fontWeight="700" color="#2d3436">
                Link Account
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text fontSize={24} color="#636e72">×</Text>
              </Pressable>
            </XStack>

            {/* Content */}
            <ScrollView
              flex={1}
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <YStack gap={24}>
                {/* Account Info */}
                <Card>
                  <YStack gap={8}>
                    <Text fontSize={16} fontWeight="600" color="#2d3436">
                      {account.name}
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      {account.type} {account.subtype ? `• ${account.subtype}` : ''}
                      {account.mask ? ` • •••• ${account.mask}` : ''}
                    </Text>
                    {account.suggested_category && (
                      <Text fontSize={12} color="#1e3a5f" marginTop={4}>
                        Suggested category: {account.suggested_category}
                      </Text>
                    )}
                  </YStack>
                </Card>

                {/* Action Selection */}
                <YStack gap={16}>
                  <Text fontSize={18} fontWeight="600" color="#2d3436">
                    What would you like to do?
                  </Text>

                  {/* Link to Existing */}
                  <Pressable onPress={() => setAction('link')}>
                    <Card
                      backgroundColor={action === 'link' ? '#f0f7ff' : '#ffffff'}
                      borderWidth={action === 'link' ? 2 : 1}
                      borderColor={action === 'link' ? '#1e3a5f' : '#e0e0e0'}
                    >
                      <YStack gap={8}>
                        <Text fontSize={16} fontWeight="600" color="#2d3436">
                          Link to Existing {account.is_asset ? 'Asset' : 'Liability'}
                        </Text>
                        <Text fontSize={14} color="#636e72">
                          Connect this account to an existing entry
                        </Text>
                      </YStack>
                    </Card>
                  </Pressable>

                  {/* Create New */}
                  <Pressable onPress={() => setAction('create')}>
                    <Card
                      backgroundColor={action === 'create' ? '#f0f7ff' : '#ffffff'}
                      borderWidth={action === 'create' ? 2 : 1}
                      borderColor={action === 'create' ? '#1e3a5f' : '#e0e0e0'}
                    >
                      <YStack gap={8}>
                        <Text fontSize={16} fontWeight="600" color="#2d3436">
                          Create New {account.is_asset ? 'Asset' : 'Liability'}
                        </Text>
                        <Text fontSize={14} color="#636e72">
                          Create a new entry for this account
                        </Text>
                      </YStack>
                    </Card>
                  </Pressable>
                </YStack>

                {/* Existing Entities List (if linking) */}
                {action === 'link' && matchingEntities.length > 0 && (
                  <YStack gap={12}>
                    <Text fontSize={16} fontWeight="600" color="#2d3436">
                      Select an existing {account.is_asset ? 'asset' : 'liability'}:
                    </Text>
                    {matchingEntities.map((entity) => (
                      <Pressable
                        key={entity.id}
                        onPress={() => setSelectedEntityId(entity.id)}
                      >
                        <Card
                          backgroundColor={selectedEntityId === entity.id ? '#f0f7ff' : '#ffffff'}
                          borderWidth={selectedEntityId === entity.id ? 2 : 1}
                          borderColor={selectedEntityId === entity.id ? '#1e3a5f' : '#e0e0e0'}
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
                              color={account.is_asset ? '#4a7c59' : '#c75c5c'}
                            >
                              {formatCurrency(
                                account.is_asset
                                  ? (entity as any).value
                                  : (entity as any).balance
                              )}
                            </Text>
                          </XStack>
                        </Card>
                      </Pressable>
                    ))}
                  </YStack>
                )}

                {action === 'link' && matchingEntities.length === 0 && (
                  <Card variant="highlighted">
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      No existing {account.is_asset ? 'assets' : 'liabilities'} found in this category.
                      You can create a new one instead.
                    </Text>
                  </Card>
                )}
              </YStack>
            </ScrollView>

            {/* Footer */}
            <YStack padding={24} gap={12} borderTopWidth={1} borderTopColor="#e0e0e0" backgroundColor="#ffffff">
              {error && (
                <Text fontSize={12} color="#c75c5c" textAlign="center">
                  {error}
                </Text>
              )}
              {action === 'link' ? (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleLink}
                  loading={isLoading}
                  disabled={!selectedEntityId || matchingEntities.length === 0}
                >
                  Link Account
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleCreate}
                  loading={isLoading}
                >
                  Create New {account.is_asset ? 'Asset' : 'Liability'}
                </Button>
              )}
              <Button variant="ghost" fullWidth onPress={onClose}>
                Cancel
              </Button>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

