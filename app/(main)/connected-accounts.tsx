/**
 * Connected Accounts Screen
 * 
 * Displays all connected Plaid accounts with sync status and management options.
 */

import React, { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { usePlaidStore } from '../../src/features/plaid/store';
import { formatCurrency } from '../../src/shared/utils';

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const {
    connectedAccounts,
    isLoading,
    error,
    refreshConnectedAccounts,
    syncAllAccounts,
    syncAccount,
    disconnectAccount,
  } = usePlaidStore();

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshConnectedAccounts();
    }, [])
  );

  const handleSyncAll = async () => {
    try {
      const response = await syncAllAccounts();
      if (response.success) {
        // Refresh net worth data after sync
        // This will be handled by the net worth store refresh
      }
    } catch (error) {
      console.error('[ConnectedAccountsScreen] Sync all error:', error);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      await syncAccount(accountId);
      // Refresh net worth data after sync
    } catch (error) {
      console.error('[ConnectedAccountsScreen] Sync account error:', error);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnectAccount(accountId);
    } catch (error) {
      console.error('[ConnectedAccountsScreen] Disconnect error:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshConnectedAccounts}
            tintColor="#1e3a5f"
          />
        }
      >
        <YStack padding={24} gap={24}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize={28} fontWeight="700" color="#2d3436" fontFamily="$heading">
                  Connected Accounts
                </Text>
                <Text fontSize={14} color="#636e72" marginTop={4}>
                  Manage your bank account connections
                </Text>
              </YStack>
            </XStack>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Card variant="warning">
              <Text color="#d4a84b" fontSize={14}>
                {error}
              </Text>
            </Card>
          )}

          {/* Sync All Button */}
          {connectedAccounts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Button
                variant="secondary"
                fullWidth
                onPress={handleSyncAll}
                loading={isLoading}
              >
                Sync All Accounts
              </Button>
            </Animated.View>
          )}

          {/* Connected Accounts List */}
          {connectedAccounts.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card>
                <YStack alignItems="center" padding={32} gap={16}>
                  <Text fontSize={48}>🏦</Text>
                  <YStack alignItems="center" gap={8}>
                    <Text fontSize={18} fontWeight="600" color="#2d3436">
                      No Connected Accounts
                    </Text>
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      Connect your bank accounts to automatically sync balances
                    </Text>
                  </YStack>
                  <Button
                    variant="primary"
                    onPress={() => router.push('/(main)/add-asset')}
                    marginTop={8}
                  >
                    Connect Account
                  </Button>
                </YStack>
              </Card>
            </Animated.View>
          ) : (
            <YStack gap={16}>
              {connectedAccounts.map((account, index) => (
                <Animated.View
                  key={account.id}
                  entering={FadeInDown.delay(200 + index * 50).springify()}
                >
                  <Card>
                    <YStack gap={16}>
                      {/* Account Header */}
                      <XStack justifyContent="space-between" alignItems="flex-start">
                        <YStack flex={1} gap={4}>
                          <Text fontSize={18} fontWeight="600" color="#2d3436">
                            {account.account_name}
                          </Text>
                          <Text fontSize={14} color="#636e72">
                            {account.institution_name}
                          </Text>
                          <Text fontSize={12} color="#636e72">
                            {account.account_type}
                            {account.account_subtype ? ` • ${account.account_subtype}` : ''}
                          </Text>
                        </YStack>
                        <YStack
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={12}
                          backgroundColor={account.is_active ? '#e8f5e9' : '#ffebee'}
                        >
                          <Text
                            fontSize={12}
                            fontWeight="600"
                            color={account.is_active ? '#4a7c59' : '#c75c5c'}
                          >
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Sync Status */}
                      <YStack gap={8} paddingTop={8} borderTopWidth={1} borderTopColor="#f0f0f0">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontSize={14} color="#636e72">
                            Last synced
                          </Text>
                          <Text fontSize={14} fontWeight="600" color="#2d3436">
                            {formatDate(account.last_synced_at)}
                          </Text>
                        </XStack>
                        {account.last_sync_error && (
                          <Card variant="warning" padding={12}>
                            <Text fontSize={12} color="#d4a84b">
                              {account.last_sync_error}
                            </Text>
                          </Card>
                        )}
                      </YStack>

                      {/* Actions */}
                      <XStack gap={12} marginTop={8}>
                        <Button
                          flex={1}
                          variant="secondary"
                          size="small"
                          onPress={() => handleSyncAccount(account.id)}
                          loading={isLoading}
                        >
                          Sync Now
                        </Button>
                        <Button
                          flex={1}
                          variant="danger"
                          size="small"
                          onPress={() => handleDisconnect(account.id)}
                          loading={isLoading}
                        >
                          Disconnect
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                </Animated.View>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

