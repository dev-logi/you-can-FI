/**
 * Transactions Screen
 * 
 * Shows all transactions with search, filters, and category breakdown.
 * Features: time period filter, account filter, category details, transaction editing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Spinner, Input, Sheet } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl, TextInput, Modal } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Card } from '../../src/shared/components';
import { 
  TransactionService, 
  Transaction, 
  TransactionListResponse,
  MerchantSummary,
  MerchantListResponse,
  ConnectedAccount,
  PlaidApiService,
} from '../../src/api/services';
import { 
  SpendingService, 
  RecurringTransaction,
  RecurringTransactionsResponse,
} from '../../src/api/services';
import { formatCurrency } from '../../src/shared/utils';
import { usePlaidStore } from '../../src/features/plaid/store';

type ViewMode = 'all' | 'merchants' | 'recurring';

// Time period options
type TimePeriod = 'this_month' | 'last_month' | 'last_30' | 'last_90' | 'this_year' | 'all';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'last_90', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

// Helper to get date range for a time period
function getDateRange(period: TimePeriod): { start_date?: string; end_date?: string } {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  switch (period) {
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start_date: formatDate(start), end_date: formatDate(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start_date: formatDate(start), end_date: formatDate(end) };
    }
    case 'last_30': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start_date: formatDate(start), end_date: formatDate(today) };
    }
    case 'last_90': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      return { start_date: formatDate(start), end_date: formatDate(today) };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start_date: formatDate(start), end_date: formatDate(today) };
    }
    case 'all':
    default:
      return {};
  }
}

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
  'LOAN_PAYMENTS': '🏦',
  'BANK_FEES': '🏛️',
  'GENERAL_SERVICES': '🔧',
  'HOME_IMPROVEMENT': '🔨',
  'GOVERNMENT_AND_NON_PROFIT': '🏛️',
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  'FOOD_AND_DRINK': 'Food & Dining',
  'ENTERTAINMENT': 'Entertainment',
  'TRANSPORTATION': 'Transportation',
  'GENERAL_MERCHANDISE': 'Shopping',
  'RENT_AND_UTILITIES': 'Housing & Utilities',
  'TRAVEL': 'Travel',
  'MEDICAL': 'Healthcare',
  'PERSONAL_CARE': 'Personal Care',
  'INCOME': 'Income',
  'TRANSFER_IN': 'Transfer In',
  'TRANSFER_OUT': 'Transfer Out',
  'LOAN_PAYMENTS': 'Loan Payments',
  'BANK_FEES': 'Bank Fees',
  'GENERAL_SERVICES': 'Services',
  'HOME_IMPROVEMENT': 'Home Improvement',
  'GOVERNMENT_AND_NON_PROFIT': 'Government',
};

export default function TransactionsScreen() {
  const router = useRouter();
  const { connectedAccounts, refreshConnectedAccounts } = usePlaidStore();
  
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
  
  // Filter state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Transaction detail modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRange(timePeriod);
      const response = await TransactionService.getTransactions({
        search: searchQuery || undefined,
        connected_account_id: selectedAccountId || undefined,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
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
  }, [searchQuery, timePeriod, selectedAccountId]);

  const fetchMerchants = useCallback(async () => {
    try {
      const dateRange = getDateRange(timePeriod);
      const response = await TransactionService.getMerchants({ 
        limit: 50,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      });
      setMerchants(response.merchants);
    } catch (err: any) {
      console.error('[Transactions] Error fetching merchants:', err);
    }
  }, [timePeriod]);

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
    refreshConnectedAccounts();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchTransactions(false);
    fetchMerchants();
  }, [timePeriod, selectedAccountId]);

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

  // Handle transaction selection
  const handleTransactionPress = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setEditCategory(txn.user_category || txn.category_primary || '');
    setEditNotes(txn.user_notes || '');
  };

  // Save transaction changes
  const handleSaveTransaction = async () => {
    if (!selectedTransaction) return;
    
    setIsUpdating(true);
    try {
      await TransactionService.updateTransaction(selectedTransaction.id, {
        user_category: editCategory || undefined,
        user_notes: editNotes || undefined,
      });
      
      // Refresh transactions
      await fetchTransactions(false);
      setSelectedTransaction(null);
    } catch (err: any) {
      console.error('[Transactions] Error updating:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (timePeriod !== 'this_month') count++;
    if (selectedAccountId) count++;
    return count;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return '💳';
    return CATEGORY_ICONS[category] || '💳';
  };

  const getCategoryName = (category?: string) => {
    if (!category) return 'Uncategorized';
    return CATEGORY_NAMES[category] || category.replace(/_/g, ' ').toLowerCase();
  };

  const formatDetailedCategory = (primary?: string, detailed?: string) => {
    const primaryName = getCategoryName(primary);
    if (detailed && detailed !== primary) {
      const detailedName = detailed.replace(/_/g, ' ').toLowerCase();
      // Avoid redundancy like "Food & Dining • food and drink"
      if (detailedName !== primaryName.toLowerCase()) {
        return `${primaryName} • ${detailedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
      }
    }
    return primaryName;
  };

  const renderTransactionRow = (txn: Transaction) => {
    const isIncome = txn.amount < 0;
    const displayAmount = Math.abs(txn.amount);
    const displayCategory = txn.user_category || txn.category_primary;
    
    return (
      <Pressable key={txn.id} onPress={() => handleTransactionPress(txn)}>
        <XStack
          paddingVertical={12}
          paddingHorizontal={16}
          backgroundColor="#fff"
          borderBottomWidth={1}
          borderColor="#f0f0f0"
          alignItems="center"
        >
          <Text fontSize={24} marginRight={12}>
            {getCategoryIcon(displayCategory)}
          </Text>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="500" color="#111827" numberOfLines={1}>
              {txn.merchant_name || txn.name}
            </Text>
            <Text fontSize={12} color="#9ca3af" numberOfLines={1}>
              {formatDate(txn.date)} • {formatDetailedCategory(displayCategory, txn.category_detailed)}
            </Text>
            {txn.user_notes && (
              <Text fontSize={11} color="#6b7280" numberOfLines={1} marginTop={2}>
                📝 {txn.user_notes}
              </Text>
            )}
          </YStack>
          <YStack alignItems="flex-end">
            <Text
              fontSize={14}
              fontWeight="600"
              color={isIncome ? '#059669' : '#111827'}
            >
              {isIncome ? '+' : '-'}{formatCurrency(displayAmount)}
            </Text>
            {txn.pending && (
              <Text fontSize={10} color="#f59e0b">Pending</Text>
            )}
          </YStack>
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

        {/* Filters Row */}
        <Animated.View entering={FadeInDown.delay(175).springify()}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ marginBottom: 12 }}
          >
            {/* Time Period Filter */}
            <Pressable onPress={() => setShowFilters(true)}>
              <XStack
                backgroundColor={timePeriod !== 'this_month' ? '#e0f2fe' : '#fff'}
                borderRadius={20}
                paddingVertical={8}
                paddingHorizontal={14}
                borderWidth={1}
                borderColor={timePeriod !== 'this_month' ? '#0ea5e9' : '#e5e7eb'}
                alignItems="center"
                gap={6}
              >
                <Text fontSize={13} color={timePeriod !== 'this_month' ? '#0369a1' : '#6b7280'}>
                  📅 {TIME_PERIODS.find(p => p.value === timePeriod)?.label}
                </Text>
                <Text fontSize={10} color="#9ca3af">▼</Text>
              </XStack>
            </Pressable>

            {/* Account Filter */}
            {connectedAccounts.length > 0 && (
              <Pressable onPress={() => setShowFilters(true)}>
                <XStack
                  backgroundColor={selectedAccountId ? '#e0f2fe' : '#fff'}
                  borderRadius={20}
                  paddingVertical={8}
                  paddingHorizontal={14}
                  borderWidth={1}
                  borderColor={selectedAccountId ? '#0ea5e9' : '#e5e7eb'}
                  alignItems="center"
                  gap={6}
                >
                  <Text fontSize={13} color={selectedAccountId ? '#0369a1' : '#6b7280'}>
                    🏦 {selectedAccountId 
                      ? connectedAccounts.find(a => a.id === selectedAccountId)?.account_name || 'Account'
                      : 'All Accounts'}
                  </Text>
                  <Text fontSize={10} color="#9ca3af">▼</Text>
                </XStack>
              </Pressable>
            )}

            {/* Clear Filters */}
            {getActiveFilterCount() > 0 && (
              <Pressable 
                onPress={() => {
                  setTimePeriod('this_month');
                  setSelectedAccountId(null);
                }}
              >
                <XStack
                  backgroundColor="#fef2f2"
                  borderRadius={20}
                  paddingVertical={8}
                  paddingHorizontal={14}
                  borderWidth={1}
                  borderColor="#fecaca"
                  alignItems="center"
                >
                  <Text fontSize={13} color="#dc2626">
                    ✕ Clear ({getActiveFilterCount()})
                  </Text>
                </XStack>
              </Pressable>
            )}
          </ScrollView>
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

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowFilters(false)}
        >
          <Pressable onPress={() => {}}>
            <YStack
              backgroundColor="#fff"
              borderTopLeftRadius={20}
              borderTopRightRadius={20}
              paddingTop={20}
              paddingBottom={40}
              paddingHorizontal={20}
            >
              <XStack justifyContent="space-between" alignItems="center" marginBottom={20}>
                <Text fontSize={18} fontWeight="700" color="#111827">Filters</Text>
                <Pressable onPress={() => setShowFilters(false)}>
                  <Text fontSize={24} color="#9ca3af">×</Text>
                </Pressable>
              </XStack>

              {/* Time Period */}
              <Text fontSize={14} fontWeight="600" color="#374151" marginBottom={10}>
                Time Period
              </Text>
              <YStack gap={8} marginBottom={20}>
                {TIME_PERIODS.map((period) => (
                  <Pressable
                    key={period.value}
                    onPress={() => setTimePeriod(period.value)}
                  >
                    <XStack
                      backgroundColor={timePeriod === period.value ? '#e0f2fe' : '#f9fafb'}
                      borderRadius={10}
                      padding={14}
                      borderWidth={1}
                      borderColor={timePeriod === period.value ? '#0ea5e9' : '#e5e7eb'}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text 
                        fontSize={14} 
                        color={timePeriod === period.value ? '#0369a1' : '#374151'}
                        fontWeight={timePeriod === period.value ? '600' : '400'}
                      >
                        {period.label}
                      </Text>
                      {timePeriod === period.value && (
                        <Text color="#0ea5e9">✓</Text>
                      )}
                    </XStack>
                  </Pressable>
                ))}
              </YStack>

              {/* Account Filter */}
              {connectedAccounts.length > 0 && (
                <>
                  <Text fontSize={14} fontWeight="600" color="#374151" marginBottom={10}>
                    Account
                  </Text>
                  <YStack gap={8} marginBottom={20}>
                    <Pressable onPress={() => setSelectedAccountId(null)}>
                      <XStack
                        backgroundColor={!selectedAccountId ? '#e0f2fe' : '#f9fafb'}
                        borderRadius={10}
                        padding={14}
                        borderWidth={1}
                        borderColor={!selectedAccountId ? '#0ea5e9' : '#e5e7eb'}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text 
                          fontSize={14} 
                          color={!selectedAccountId ? '#0369a1' : '#374151'}
                          fontWeight={!selectedAccountId ? '600' : '400'}
                        >
                          All Accounts
                        </Text>
                        {!selectedAccountId && (
                          <Text color="#0ea5e9">✓</Text>
                        )}
                      </XStack>
                    </Pressable>
                    {connectedAccounts.map((account) => (
                      <Pressable
                        key={account.id}
                        onPress={() => setSelectedAccountId(account.id)}
                      >
                        <XStack
                          backgroundColor={selectedAccountId === account.id ? '#e0f2fe' : '#f9fafb'}
                          borderRadius={10}
                          padding={14}
                          borderWidth={1}
                          borderColor={selectedAccountId === account.id ? '#0ea5e9' : '#e5e7eb'}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <YStack flex={1}>
                            <Text 
                              fontSize={14} 
                              color={selectedAccountId === account.id ? '#0369a1' : '#374151'}
                              fontWeight={selectedAccountId === account.id ? '600' : '400'}
                            >
                              {account.account_name}
                            </Text>
                            <Text fontSize={12} color="#9ca3af">
                              {account.institution_name}
                            </Text>
                          </YStack>
                          {selectedAccountId === account.id && (
                            <Text color="#0ea5e9">✓</Text>
                          )}
                        </XStack>
                      </Pressable>
                    ))}
                  </YStack>
                </>
              )}

              <Pressable onPress={() => setShowFilters(false)}>
                <YStack
                  backgroundColor="#1e3a5f"
                  borderRadius={10}
                  padding={16}
                  alignItems="center"
                >
                  <Text fontSize={16} fontWeight="600" color="#fff">
                    Apply Filters
                  </Text>
                </YStack>
              </Pressable>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        visible={selectedTransaction !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setSelectedTransaction(null)}
        >
          <Pressable onPress={() => {}}>
            <YStack
              backgroundColor="#fff"
              borderTopLeftRadius={20}
              borderTopRightRadius={20}
              paddingTop={20}
              paddingBottom={40}
              paddingHorizontal={20}
              maxHeight="85%"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedTransaction && (
                  <>
                    {/* Header */}
                    <XStack justifyContent="space-between" alignItems="flex-start" marginBottom={20}>
                      <YStack flex={1}>
                        <Text fontSize={14} color="#9ca3af" marginBottom={4}>
                          {formatFullDate(selectedTransaction.date)}
                        </Text>
                        <Text fontSize={20} fontWeight="700" color="#111827" numberOfLines={2}>
                          {selectedTransaction.merchant_name || selectedTransaction.name}
                        </Text>
                      </YStack>
                      <Pressable onPress={() => setSelectedTransaction(null)}>
                        <Text fontSize={24} color="#9ca3af">×</Text>
                      </Pressable>
                    </XStack>

                    {/* Amount */}
                    <YStack 
                      backgroundColor="#f9fafb" 
                      borderRadius={12} 
                      padding={16} 
                      marginBottom={20}
                      alignItems="center"
                    >
                      <Text 
                        fontSize={36} 
                        fontWeight="700" 
                        color={selectedTransaction.amount < 0 ? '#059669' : '#111827'}
                      >
                        {selectedTransaction.amount < 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(selectedTransaction.amount))}
                      </Text>
                      {selectedTransaction.pending && (
                        <XStack 
                          backgroundColor="#fef3c7" 
                          paddingHorizontal={10} 
                          paddingVertical={4} 
                          borderRadius={12}
                          marginTop={8}
                        >
                          <Text fontSize={12} color="#b45309">Pending</Text>
                        </XStack>
                      )}
                    </YStack>

                    {/* Details */}
                    <YStack gap={12} marginBottom={20}>
                      <XStack justifyContent="space-between">
                        <Text fontSize={14} color="#9ca3af">Category</Text>
                        <XStack alignItems="center" gap={6}>
                          <Text fontSize={18}>
                            {getCategoryIcon(selectedTransaction.user_category || selectedTransaction.category_primary)}
                          </Text>
                          <Text fontSize={14} color="#374151">
                            {formatDetailedCategory(
                              selectedTransaction.user_category || selectedTransaction.category_primary, 
                              selectedTransaction.category_detailed
                            )}
                          </Text>
                        </XStack>
                      </XStack>

                      {selectedTransaction.payment_channel && (
                        <XStack justifyContent="space-between">
                          <Text fontSize={14} color="#9ca3af">Payment Method</Text>
                          <Text fontSize={14} color="#374151">
                            {selectedTransaction.payment_channel.charAt(0).toUpperCase() + 
                             selectedTransaction.payment_channel.slice(1)}
                          </Text>
                        </XStack>
                      )}

                      {(selectedTransaction.location_city || selectedTransaction.location_region) && (
                        <XStack justifyContent="space-between">
                          <Text fontSize={14} color="#9ca3af">Location</Text>
                          <Text fontSize={14} color="#374151">
                            {[selectedTransaction.location_city, selectedTransaction.location_region]
                              .filter(Boolean).join(', ')}
                          </Text>
                        </XStack>
                      )}
                    </YStack>

                    {/* Edit Section */}
                    <YStack 
                      backgroundColor="#f9fafb" 
                      borderRadius={12} 
                      padding={16}
                      marginBottom={20}
                    >
                      <Text fontSize={14} fontWeight="600" color="#374151" marginBottom={12}>
                        Customize
                      </Text>

                      {/* Category Override */}
                      <YStack marginBottom={16}>
                        <Text fontSize={12} color="#9ca3af" marginBottom={6}>
                          Category (leave blank to use auto-detected)
                        </Text>
                        <TextInput
                          value={editCategory}
                          onChangeText={setEditCategory}
                          placeholder={selectedTransaction.category_primary || 'Enter category...'}
                          placeholderTextColor="#9ca3af"
                          style={{
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 14,
                            color: '#111827',
                          }}
                        />
                      </YStack>

                      {/* Notes */}
                      <YStack>
                        <Text fontSize={12} color="#9ca3af" marginBottom={6}>
                          Notes
                        </Text>
                        <TextInput
                          value={editNotes}
                          onChangeText={setEditNotes}
                          placeholder="Add a note..."
                          placeholderTextColor="#9ca3af"
                          multiline
                          numberOfLines={3}
                          style={{
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 14,
                            color: '#111827',
                            minHeight: 80,
                            textAlignVertical: 'top',
                          }}
                        />
                      </YStack>
                    </YStack>

                    {/* Save Button */}
                    <Pressable 
                      onPress={handleSaveTransaction}
                      disabled={isUpdating}
                    >
                      <YStack
                        backgroundColor={isUpdating ? '#9ca3af' : '#1e3a5f'}
                        borderRadius={10}
                        padding={16}
                        alignItems="center"
                      >
                        {isUpdating ? (
                          <Spinner size="small" color="#fff" />
                        ) : (
                          <Text fontSize={16} fontWeight="600" color="#fff">
                            Save Changes
                          </Text>
                        )}
                      </YStack>
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
