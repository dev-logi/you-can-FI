/**
 * Transactions Screen
 * 
 * Shows all transactions with search, filters, and category breakdown.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Spinner, Input } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Card } from '../../src/shared/components';
import { 
  TransactionService, 
  Transaction, 
  TransactionListResponse,
  MerchantSummary,
  MerchantListResponse,
} from '../../src/api/services';
import { 
  SpendingService, 
  RecurringTransaction,
  RecurringTransactionsResponse,
} from '../../src/api/services';
import { formatCurrency } from '../../src/shared/utils';

type ViewMode = 'all' | 'merchants' | 'recurring';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  'FOOD_AND_DRINK': '🍔',
  'ENTERTAINMENT': '🎬',
  'TRANSPORTATION': '🚗',
  'GENERAL_MERCHANDISE': '🛒',
  'RENT_AND_UTILITIES': '🏠',
  'TRAVEL': '✈️',
  'MEDICAL': '🏥',
  'PERSONAL_CARE': '💅',
  'INCOME': '💰',
  'TRANSFER_IN': '↩️',
  'TRANSFER_OUT': '↪️',
};

export default function TransactionsScreen() {
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [recurringTotal, setRecurringTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      const response = await TransactionService.getTransactions({
        search: searchQuery || undefined,
        limit: 100,
      });
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (err: any) {
      console.error('[Transactions] Error fetching:', err);
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  const fetchMerchants = useCallback(async () => {
    try {
      const response = await TransactionService.getMerchants({ limit: 50 });
      setMerchants(response.merchants);
    } catch (err: any) {
      console.error('[Transactions] Error fetching merchants:', err);
    }
  }, []);

  const fetchRecurring = useCallback(async () => {
    try {
      const response = await SpendingService.getRecurring();
      setRecurring(response.recurring);
      setRecurringTotal(response.estimated_monthly_total);
    } catch (err: any) {
      console.error('[Transactions] Error fetching recurring:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchMerchants();
    fetchRecurring();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === 'all') {
        fetchTransactions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions(false);
    fetchMerchants();
    fetchRecurring();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return '💳';
    return CATEGORY_ICONS[category] || '💳';
  };

  const renderTransactionRow = (txn: Transaction) => {
    const isIncome = txn.amount < 0;
    const displayAmount = Math.abs(txn.amount);
    
    return (
      <Pressable key={txn.id}>
        <XStack
          paddingVertical={12}
          paddingHorizontal={16}
          backgroundColor="#fff"
          borderBottomWidth={1}
          borderColor="#f0f0f0"
          alignItems="center"
        >
          <Text fontSize={24} marginRight={12}>
            {getCategoryIcon(txn.category_primary)}
          </Text>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="500" color="#111827" numberOfLines={1}>
              {txn.merchant_name || txn.name}
            </Text>
            <Text fontSize={12} color="#9ca3af">
              {formatDate(txn.date)} • {txn.category_primary?.replace(/_/g, ' ').toLowerCase() || 'Uncategorized'}
            </Text>
          </YStack>
          <Text
            fontSize={14}
            fontWeight="600"
            color={isIncome ? '#059669' : '#111827'}
          >
            {isIncome ? '+' : '-'}{formatCurrency(displayAmount)}
          </Text>
        </XStack>
      </Pressable>
    );
  };

  const renderMerchantRow = (merchant: MerchantSummary) => (
    <XStack
      key={merchant.merchant_name}
      paddingVertical={12}
      paddingHorizontal={16}
      backgroundColor="#fff"
      borderBottomWidth={1}
      borderColor="#f0f0f0"
      alignItems="center"
    >
      <Text fontSize={24} marginRight={12}>
        {getCategoryIcon(merchant.category)}
      </Text>
      <YStack flex={1}>
        <Text fontSize={14} fontWeight="500" color="#111827" numberOfLines={1}>
          {merchant.merchant_name}
        </Text>
        <Text fontSize={12} color="#9ca3af">
          {merchant.transaction_count} transactions
        </Text>
      </YStack>
      <Text fontSize={14} fontWeight="600" color="#111827">
        {formatCurrency(merchant.total_amount)}
      </Text>
    </XStack>
  );

  const renderRecurringRow = (item: RecurringTransaction) => (
    <XStack
      key={item.merchant_name}
      paddingVertical={12}
      paddingHorizontal={16}
      backgroundColor="#fff"
      borderBottomWidth={1}
      borderColor="#f0f0f0"
      alignItems="center"
    >
      <YStack
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor={item.is_subscription ? '#dbeafe' : '#f3f4f6'}
        alignItems="center"
        justifyContent="center"
        marginRight={12}
      >
        <Text fontSize={18}>
          {item.is_subscription ? '🔄' : '📅'}
        </Text>
      </YStack>
      <YStack flex={1}>
        <Text fontSize={14} fontWeight="500" color="#111827" numberOfLines={1}>
          {item.merchant_name}
        </Text>
        <Text fontSize={12} color="#9ca3af">
          {item.frequency} • Last: {formatDate(item.last_date)}
        </Text>
      </YStack>
      <YStack alignItems="flex-end">
        <Text fontSize={14} fontWeight="600" color="#111827">
          {formatCurrency(item.average_amount)}
        </Text>
        <Text fontSize={11} color="#9ca3af">
          /{item.frequency === 'monthly' ? 'mo' : item.frequency === 'weekly' ? 'wk' : 'yr'}
        </Text>
      </YStack>
    </XStack>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="#1e3a5f" />
          <Text fontSize={14} color="#636e72" marginTop={12}>
            Loading transactions...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <XStack
            padding={20}
            paddingBottom={12}
            justifyContent="space-between"
            alignItems="center"
          >
            <Pressable onPress={() => router.back()}>
              <Text fontSize={16} color="#1e3a5f">
                ← Back
              </Text>
            </Pressable>
            <Text fontSize={20} fontWeight="700" color="#111827">
              Transactions
            </Text>
            <YStack width={50} />
          </XStack>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <YStack paddingHorizontal={20} paddingBottom={12}>
            <XStack
              backgroundColor="#fff"
              borderRadius={10}
              borderWidth={1}
              borderColor="#e5e7eb"
              paddingHorizontal={12}
              alignItems="center"
            >
              <Text fontSize={16} color="#9ca3af" marginRight={8}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
                placeholderTextColor="#9ca3af"
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#111827',
                }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Text fontSize={16} color="#9ca3af">✕</Text>
                </Pressable>
              )}
            </XStack>
          </YStack>
        </Animated.View>

        {/* View Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <XStack paddingHorizontal={20} paddingBottom={16} gap={8}>
            {(['all', 'merchants', 'recurring'] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={{ flex: 1 }}
              >
                <YStack
                  paddingVertical={10}
                  borderRadius={8}
                  backgroundColor={viewMode === mode ? '#1e3a5f' : '#fff'}
                  borderWidth={1}
                  borderColor={viewMode === mode ? '#1e3a5f' : '#e5e7eb'}
                  alignItems="center"
                >
                  <Text
                    fontSize={13}
                    fontWeight="600"
                    color={viewMode === mode ? '#fff' : '#6b7280'}
                  >
                    {mode === 'all' ? 'All' : mode === 'merchants' ? 'Merchants' : 'Recurring'}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </Animated.View>

        {/* Content */}
        <ScrollView
          flex={1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1e3a5f"
            />
          }
        >
          {error && (
            <YStack padding={20}>
              <Card>
                <Text color="#dc2626" textAlign="center">{error}</Text>
              </Card>
            </YStack>
          )}

          {viewMode === 'all' && (
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <YStack>
                <XStack paddingHorizontal={20} paddingBottom={8}>
                  <Text fontSize={12} color="#9ca3af">
                    {total} transactions
                  </Text>
                </XStack>
                <YStack backgroundColor="#fff" borderRadius={12} marginHorizontal={20} overflow="hidden">
                  {transactions.length > 0 ? (
                    transactions.map(renderTransactionRow)
                  ) : (
                    <YStack padding={40} alignItems="center">
                      <Text fontSize={32}>📭</Text>
                      <Text fontSize={14} color="#6b7280" marginTop={8}>
                        No transactions found
                      </Text>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Animated.View>
          )}

          {viewMode === 'merchants' && (
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <YStack>
                <XStack paddingHorizontal={20} paddingBottom={8}>
                  <Text fontSize={12} color="#9ca3af">
                    Top {merchants.length} merchants by spending
                  </Text>
                </XStack>
                <YStack backgroundColor="#fff" borderRadius={12} marginHorizontal={20} overflow="hidden">
                  {merchants.length > 0 ? (
                    merchants.map(renderMerchantRow)
                  ) : (
                    <YStack padding={40} alignItems="center">
                      <Text fontSize={32}>🏪</Text>
                      <Text fontSize={14} color="#6b7280" marginTop={8}>
                        No merchant data yet
                      </Text>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Animated.View>
          )}

          {viewMode === 'recurring' && (
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <YStack>
                {/* Summary Card */}
                <YStack paddingHorizontal={20} paddingBottom={16}>
                  <Card>
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack>
                        <Text fontSize={12} color="#9ca3af">Est. Monthly Recurring</Text>
                        <Text fontSize={24} fontWeight="700" color="#111827">
                          {formatCurrency(recurringTotal)}
                        </Text>
                      </YStack>
                      <YStack
                        width={48}
                        height={48}
                        borderRadius={24}
                        backgroundColor="#dbeafe"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={24}>🔄</Text>
                      </YStack>
                    </XStack>
                  </Card>
                </YStack>

                <XStack paddingHorizontal={20} paddingBottom={8}>
                  <Text fontSize={12} color="#9ca3af">
                    {recurring.length} recurring transactions detected
                  </Text>
                </XStack>
                <YStack backgroundColor="#fff" borderRadius={12} marginHorizontal={20} overflow="hidden">
                  {recurring.length > 0 ? (
                    recurring.map(renderRecurringRow)
                  ) : (
                    <YStack padding={40} alignItems="center">
                      <Text fontSize={32}>📅</Text>
                      <Text fontSize={14} color="#6b7280" marginTop={8}>
                        No recurring transactions detected
                      </Text>
                      <Text fontSize={12} color="#9ca3af" marginTop={4} textAlign="center">
                        We'll detect patterns after more transactions sync
                      </Text>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Animated.View>
          )}

          <YStack height={40} />
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
