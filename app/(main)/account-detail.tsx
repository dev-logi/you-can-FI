/**
 * Account Detail Screen
 * 
 * Shows detailed information about an asset or liability,
 * including transactions synced from Plaid.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl, SectionList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { TransactionService, Transaction, TransactionListResponse } from '../../src/api/services/transactionService';
import { formatCurrency } from '../../src/shared/utils';

interface TransactionSection {
  title: string;
  data: Transaction[];
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    type: 'asset' | 'liability';
  }>();
  
  const { assets, liabilities, refresh: refreshNetWorth } = useNetWorthStore();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Find the account
  const account = params.type === 'asset' 
    ? assets.find(a => a.id === params.id)
    : liabilities.find(l => l.id === params.id);
  
  const isConnected = account?.isConnected && account?.connectedAccountId;
  
  // Fetch transactions
  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (!account?.connectedAccountId) {
      setIsLoading(false);
      return;
    }
    
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AccountDetail] Fetching transactions for:', account.connectedAccountId);
      const response = await TransactionService.getAccountTransactions(
        account.connectedAccountId,
        100,
        0
      );
      console.log('[AccountDetail] Received', response.transactions.length, 'transactions');
      setTransactions(response.transactions);
      setHasMore(response.total > response.transactions.length);
    } catch (err: any) {
      console.error('[AccountDetail] Error fetching transactions:', err);
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [account?.connectedAccountId]);
  
  // Sync transactions from Plaid
  const handleSync = async () => {
    if (!account?.connectedAccountId) return;
    
    setIsSyncing(true);
    setError(null);
    
    try {
      console.log('[AccountDetail] Syncing transactions...');
      const result = await TransactionService.syncAccount(account.connectedAccountId);
      console.log('[AccountDetail] Sync result:', result);
      
      // Refresh transactions after sync
      await fetchTransactions(false);
      
      // Also refresh net worth in case balance changed
      await refreshNetWorth();
    } catch (err: any) {
      console.error('[AccountDetail] Sync error:', err);
      setError(err?.message || 'Failed to sync transactions');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTransactions(false);
    }, [fetchTransactions])
  );
  
  // Group transactions by date
  const groupedTransactions: TransactionSection[] = React.useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(txn);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([title, data]) => ({ title, data }));
  }, [transactions]);
  
  if (!account) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding={24}>
          <Text fontSize={48}>🔍</Text>
          <Text fontSize={16} color="#636e72" textAlign="center" marginTop={16}>
            Account not found
          </Text>
          <Button variant="secondary" onPress={() => router.back()} marginTop={24}>
            Go Back
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }
  
  const isAsset = params.type === 'asset';
  const valueColor = isAsset ? '#4a7c59' : '#c75c5c';
  const value = isAsset ? (account as any).value : (account as any).balance;
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        {/* Header */}
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
            <Text fontSize={18} fontWeight="700" color="#2d3436" flex={1} textAlign="center">
              {account.name}
            </Text>
            <YStack width={50} /> {/* Spacer for alignment */}
          </XStack>
        </Animated.View>
        
        {/* Account Summary Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <YStack paddingHorizontal={24} marginBottom={16}>
            <Card>
              <YStack gap={12}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontSize={14} color="#636e72">
                      Current {isAsset ? 'Value' : 'Balance'}
                    </Text>
                    <Text fontSize={32} fontWeight="700" color={valueColor}>
                      {formatCurrency(value)}
                    </Text>
                  </YStack>
                  {isConnected && (
                    <YStack alignItems="flex-end">
                      <YStack
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={8}
                        backgroundColor="#e8f5e9"
                      >
                        <Text fontSize={10} fontWeight="600" color="#4a7c59">
                          CONNECTED
                        </Text>
                      </YStack>
                      {account.lastSyncedAt && (
                        <Text fontSize={11} color="#636e72" marginTop={4}>
                          Synced: {new Date(account.lastSyncedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </YStack>
                  )}
                </XStack>
                
                {isConnected && (
                  <Button
                    variant="secondary"
                    size="small"
                    onPress={handleSync}
                    loading={isSyncing}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Syncing...' : '↻ Sync Transactions'}
                  </Button>
                )}
              </YStack>
            </Card>
          </YStack>
        </Animated.View>
        
        {/* Transactions Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ flex: 1 }}>
          <YStack paddingHorizontal={24} marginBottom={8}>
            <Text fontSize={18} fontWeight="700" color="#2d3436">
              Transactions
            </Text>
          </YStack>
          
          {!isConnected ? (
            <YStack flex={1} paddingHorizontal={24}>
              <Card>
                <YStack alignItems="center" padding={24} gap={12}>
                  <Text fontSize={40}>🔗</Text>
                  <Text fontSize={14} color="#636e72" textAlign="center">
                    Connect this account to Plaid to see transactions
                  </Text>
                </YStack>
              </Card>
            </YStack>
          ) : isLoading ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" color="#1e3a5f" />
              <Text fontSize={14} color="#636e72" marginTop={12}>
                Loading transactions...
              </Text>
            </YStack>
          ) : error ? (
            <YStack flex={1} paddingHorizontal={24}>
              <Card>
                <YStack alignItems="center" padding={24} gap={12}>
                  <Text fontSize={40}>⚠️</Text>
                  <Text fontSize={14} color="#c75c5c" textAlign="center">
                    {error}
                  </Text>
                  <Button variant="secondary" size="small" onPress={() => fetchTransactions()}>
                    Try Again
                  </Button>
                </YStack>
              </Card>
            </YStack>
          ) : transactions.length === 0 ? (
            <YStack flex={1} paddingHorizontal={24}>
              <Card>
                <YStack alignItems="center" padding={24} gap={12}>
                  <Text fontSize={40}>📭</Text>
                  <Text fontSize={14} color="#636e72" textAlign="center">
                    No transactions yet. Tap "Sync Transactions" to fetch from your bank.
                  </Text>
                  <Button variant="primary" size="small" onPress={handleSync} loading={isSyncing}>
                    Sync Now
                  </Button>
                </YStack>
              </Card>
            </YStack>
          ) : (
            <SectionList
              sections={groupedTransactions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={isSyncing}
                  onRefresh={handleSync}
                  tintColor="#1e3a5f"
                />
              }
              renderSectionHeader={({ section: { title } }) => (
                <YStack paddingVertical={12} backgroundColor="#faf8f5">
                  <Text fontSize={13} fontWeight="600" color="#636e72">
                    {title}
                  </Text>
                </YStack>
              )}
              renderItem={({ item: txn }) => (
                <TransactionRow transaction={txn} isAsset={isAsset} />
              )}
            />
          )}
        </Animated.View>
      </YStack>
    </SafeAreaView>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  isAsset: boolean;
}

function TransactionRow({ transaction, isAsset }: TransactionRowProps) {
  // Plaid amounts: positive = money leaving account, negative = money entering
  // For assets (bank accounts): positive = expense, negative = income
  // For liabilities (credit cards): positive = charge, negative = payment/refund
  const isExpense = transaction.amount > 0;
  const displayAmount = Math.abs(transaction.amount);
  const amountColor = isExpense ? '#c75c5c' : '#4a7c59';
  const amountPrefix = isExpense ? '-' : '+';
  
  const categoryLabel = transaction.category_primary 
    ? transaction.category_primary.replace(/_/g, ' ').toLowerCase()
    : 'uncategorized';
  
  return (
    <Card marginBottom={8}>
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1} marginRight={12}>
          <Text fontSize={15} fontWeight="600" color="#2d3436" numberOfLines={1}>
            {transaction.merchant_name || transaction.name}
          </Text>
          <Text fontSize={12} color="#636e72" textTransform="capitalize" marginTop={2}>
            {categoryLabel}
          </Text>
          {transaction.pending && (
            <YStack
              marginTop={4}
              paddingHorizontal={6}
              paddingVertical={2}
              borderRadius={4}
              backgroundColor="#fff3cd"
              alignSelf="flex-start"
            >
              <Text fontSize={10} fontWeight="600" color="#856404">
                PENDING
              </Text>
            </YStack>
          )}
        </YStack>
        <YStack alignItems="flex-end">
          <Text fontSize={16} fontWeight="700" color={amountColor}>
            {amountPrefix}{formatCurrency(displayAmount)}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}
