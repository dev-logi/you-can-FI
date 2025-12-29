/**
 * Connected Accounts Screen
 * 
 * Displays all Plaid connected accounts and allows syncing/disconnecting.
 */

import React, { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Alert, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { usePlaidStore } from '../../src/features/plaid/store';
import { formatDateTime } from '../../src/shared/utils';

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const { connectedAccounts, refreshConnectedAccounts, syncAccount, disconnectAccount, isLoading } = usePlaidStore();

  useFocusEffect(
    useCallback(() => {
      refreshConnectedAccounts();
    }, [])
  );

  const handleSync = async (accountId: string) => {
    try {
      await syncAccount(accountId);
      Alert.alert('Success', 'Account synced successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync account.');
    }
  };

  const handleDisconnect = (accountId: string, accountName: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect "${accountName}"? This will remove all associated synced data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectAccount(accountId);
              Alert.alert('Success', 'Account disconnected successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect account.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <XStack
            padding={24}
            paddingBottom={16}
            justifyContent="space-between"
            alignItems="center"
          >
            <Pressable onPress={() => router.back()}>
              <Text fontSize={16} color="#1e3a5f">
                ← Back
              </Text>
            </Pressable>
            <Text fontSize={20} fontWeight="700" color="#2d3436">
              Connected Accounts
            </Text>
            <YStack width={40} /> {/* Spacer */}
          </XStack>
        </Animated.View>

        <ScrollView
          flex={1}
          paddingHorizontal={24}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshConnectedAccounts}
              tintColor="#1e3a5f"
            />
          }
        >
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {connectedAccounts.length === 0 ? (
              <Card marginTop={24}>
                <YStack alignItems="center" padding={32} gap={16}>
                  <Text fontSize={48}>🔗</Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    No bank accounts connected yet.
                  </Text>
                  <Button
                    variant="primary"
                    onPress={() => router.push('/(main)/index')} // Go to dashboard to connect
                  >
                    Connect Account
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap={16} paddingBottom={100}>
                {connectedAccounts.map((account) => (
                  <Card key={account.id}>
                    <YStack gap={8}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={18} fontWeight="700" color="#2d3436">
                          {account.institution_name}
                        </Text>
                        <YStack
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={12}
                          backgroundColor={account.is_active ? '#e8f5e9' : '#ffe0b2'}
                        >
                          <Text fontSize={12} fontWeight="600" color={account.is_active ? '#4a7c59' : '#ff9800'}>
                            {account.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </YStack>
                      </XStack>
                      <Text fontSize={16} color="#636e72">
                        {account.account_name} ({account.account_type} {account.account_subtype})
                      </Text>
                      {account.last_synced_at && (
                        <Text fontSize={12} color="#636e72">
                          Last Synced: {formatDateTime(account.last_synced_at)}
                        </Text>
                      )}
                      {account.last_sync_error && (
                        <Text fontSize={12} color="#c75c5c">
                          Sync Error: {account.last_sync_error}
                        </Text>
                      )}
                      <XStack gap={12} marginTop={8}>
                        <Button
                          flex={1}
                          variant="secondary"
                          size="small"
                          onPress={() => handleSync(account.id)}
                          disabled={isLoading}
                        >
                          Sync Now
                        </Button>
                        <Button
                          flex={1}
                          variant="danger"
                          size="small"
                          onPress={() => handleDisconnect(account.id, account.account_name)}
                          disabled={isLoading}
                        >
                          Disconnect
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                ))}
              </YStack>
            )}
          </Animated.View>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}

