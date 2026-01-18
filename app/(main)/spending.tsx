/**
 * Spending Dashboard Screen
 * 
 * Shows spending summary with category breakdown and cash flow.
 * Features: time period filter, exclude transfers toggle.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, Spinner, Switch } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl, Dimensions, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { SpendingService, SpendingSummaryResponse, CashFlowSummaryResponse, CategorySpending } from '../../src/api/services';
import { formatCurrency } from '../../src/shared/utils';

type ViewMode = 'spending' | 'cashflow';

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

const screenWidth = Dimensions.get('window').width;

export default function SpendingScreen() {
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<ViewMode>('spending');
  const [spendingData, setSpendingData] = useState<SpendingSummaryResponse | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  const [excludeTransfers, setExcludeTransfers] = useState(true);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRange(timePeriod);
      const [spending, cashFlow] = await Promise.all([
        SpendingService.getSummary(dateRange.start_date, dateRange.end_date),
        SpendingService.getCashFlow(6, excludeTransfers),
      ]);
      
      setSpendingData(spending);
      setCashFlowData(cashFlow);
    } catch (err: any) {
      console.error('[Spending] Error fetching data:', err);
      setError(err?.message || 'Failed to load spending data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timePeriod, excludeTransfers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="#1e3a5f" />
          <Text fontSize={14} color="#636e72" marginTop={12}>
            Loading spending data...
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
              {viewMode === 'spending' ? 'Spending' : 'Cash Flow'}
            </Text>
            <YStack width={50} />
          </XStack>
        </Animated.View>

        {/* View Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <XStack paddingHorizontal={24} paddingBottom={12}>
            <XStack
              flex={1}
              backgroundColor="#f0f2f5"
              borderRadius={12}
              padding={4}
            >
              <Pressable
                onPress={() => setViewMode('spending')}
                style={{ flex: 1 }}
              >
                <YStack
                  backgroundColor={viewMode === 'spending' ? '#ffffff' : 'transparent'}
                  borderRadius={10}
                  paddingVertical={10}
                  alignItems="center"
                  shadowColor={viewMode === 'spending' ? '#000' : 'transparent'}
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={viewMode === 'spending' ? 0.1 : 0}
                  shadowRadius={2}
                >
                  <Text
                    fontSize={14}
                    fontWeight={viewMode === 'spending' ? '600' : '500'}
                    color={viewMode === 'spending' ? '#1e3a5f' : '#636e72'}
                  >
                    Spending
                  </Text>
                </YStack>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('cashflow')}
                style={{ flex: 1 }}
              >
                <YStack
                  backgroundColor={viewMode === 'cashflow' ? '#ffffff' : 'transparent'}
                  borderRadius={10}
                  paddingVertical={10}
                  alignItems="center"
                  shadowColor={viewMode === 'cashflow' ? '#000' : 'transparent'}
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={viewMode === 'cashflow' ? 0.1 : 0}
                  shadowRadius={2}
                >
                  <Text
                    fontSize={14}
                    fontWeight={viewMode === 'cashflow' ? '600' : '500'}
                    color={viewMode === 'cashflow' ? '#1e3a5f' : '#636e72'}
                  >
                    Cash Flow
                  </Text>
                </YStack>
              </Pressable>
            </XStack>
          </XStack>
        </Animated.View>

        {/* Filters Row */}
        <Animated.View entering={FadeInDown.delay(175).springify()}>
          <XStack paddingHorizontal={24} paddingBottom={16} gap={10} alignItems="center">
            {/* Time Period Picker */}
            <Pressable onPress={() => setShowPeriodPicker(true)} style={{ flex: 1 }}>
              <XStack
                backgroundColor={timePeriod !== 'this_month' ? '#e0f2fe' : '#fff'}
                borderRadius={10}
                paddingVertical={10}
                paddingHorizontal={14}
                borderWidth={1}
                borderColor={timePeriod !== 'this_month' ? '#0ea5e9' : '#e5e7eb'}
                justifyContent="space-between"
                alignItems="center"
              >
                <XStack alignItems="center" gap={8}>
                  <Text fontSize={16}>📅</Text>
                  <Text 
                    fontSize={14} 
                    fontWeight="500"
                    color={timePeriod !== 'this_month' ? '#0369a1' : '#374151'}
                  >
                    {TIME_PERIODS.find(p => p.value === timePeriod)?.label}
                  </Text>
                </XStack>
                <Text fontSize={10} color="#9ca3af">▼</Text>
              </XStack>
            </Pressable>

            {/* Exclude Transfers Toggle (only in cashflow view) */}
            {viewMode === 'cashflow' && (
              <Pressable 
                onPress={() => setExcludeTransfers(!excludeTransfers)}
              >
                <XStack
                  backgroundColor={excludeTransfers ? '#e0f2fe' : '#fff'}
                  borderRadius={10}
                  paddingVertical={10}
                  paddingHorizontal={14}
                  borderWidth={1}
                  borderColor={excludeTransfers ? '#0ea5e9' : '#e5e7eb'}
                  alignItems="center"
                  gap={8}
                >
                  <Text fontSize={14} color={excludeTransfers ? '#0369a1' : '#6b7280'}>
                    {excludeTransfers ? '✓' : '○'} Hide Transfers
                  </Text>
                </XStack>
              </Pressable>
            )}
          </XStack>
        </Animated.View>

        {/* Content */}
        <ScrollView
          flex={1}
          paddingHorizontal={24}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1e3a5f"
            />
          }
        >
          {error ? (
            <Card marginTop={24}>
              <YStack alignItems="center" padding={24} gap={12}>
                <Text fontSize={40}>⚠️</Text>
                <Text fontSize={14} color="#c75c5c" textAlign="center">
                  {error}
                </Text>
                <Button variant="secondary" size="small" onPress={() => fetchData()}>
                  Try Again
                </Button>
              </YStack>
            </Card>
          ) : viewMode === 'spending' ? (
            <SpendingView data={spendingData} formatDate={formatDate} />
          ) : (
            <CashFlowView data={cashFlowData} formatMonth={formatMonth} />
          )}
          
          <YStack height={100} />
        </ScrollView>
      </YStack>

      {/* Time Period Picker Modal */}
      <Modal
        visible={showPeriodPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPeriodPicker(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowPeriodPicker(false)}
        >
          <Pressable onPress={() => {}}>
            <YStack
              backgroundColor="#fff"
              borderTopLeftRadius={20}
              borderTopRightRadius={20}
              paddingTop={20}
              paddingBottom={40}
              paddingHorizontal={24}
            >
              <XStack justifyContent="space-between" alignItems="center" marginBottom={20}>
                <Text fontSize={18} fontWeight="700" color="#111827">Select Time Period</Text>
                <Pressable onPress={() => setShowPeriodPicker(false)}>
                  <Text fontSize={24} color="#9ca3af">×</Text>
                </Pressable>
              </XStack>

              <YStack gap={8}>
                {TIME_PERIODS.map((period) => (
                  <Pressable
                    key={period.value}
                    onPress={() => {
                      setTimePeriod(period.value);
                      setShowPeriodPicker(false);
                    }}
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
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ========== Spending View ==========

function SpendingView({ 
  data, 
  formatDate 
}: { 
  data: SpendingSummaryResponse | null;
  formatDate: (d: string) => string;
}) {
  const router = useRouter();
  
  if (!data) return null;

  const changeColor = data.spending_change_percent !== undefined
    ? data.spending_change_percent > 0 ? '#c75c5c' : '#4a7c59'
    : '#636e72';
  
  const changePrefix = data.spending_change_percent !== undefined
    ? data.spending_change_percent > 0 ? '↑' : '↓'
    : '';

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <YStack gap={20} paddingBottom={20}>
        {/* Summary Card */}
        <Card>
          <YStack alignItems="center" gap={8}>
            <Text fontSize={14} color="#636e72">
              {formatDate(data.start_date)} - {formatDate(data.end_date)}
            </Text>
            <Text fontSize={36} fontWeight="700" color="#c75c5c">
              {formatCurrency(data.total_spending)}
            </Text>
            {data.spending_change_percent !== undefined && (
              <XStack gap={4} alignItems="center">
                <Text fontSize={14} color={changeColor} fontWeight="600">
                  {changePrefix} {Math.abs(data.spending_change_percent).toFixed(1)}%
                </Text>
                <Text fontSize={14} color="#636e72">
                  vs last period
                </Text>
              </XStack>
            )}
            <Text fontSize={12} color="#636e72" marginTop={4}>
              {data.transaction_count} transactions across {data.category_count} categories
            </Text>
          </YStack>
        </Card>

        {/* Category Breakdown */}
        <YStack gap={12}>
          <Text fontSize={16} fontWeight="600" color="#2d3436">
            By Category
          </Text>
          
          {data.categories.length === 0 ? (
            <Card>
              <YStack alignItems="center" padding={24}>
                <Text fontSize={40}>📊</Text>
                <Text fontSize={14} color="#636e72" textAlign="center" marginTop={8}>
                  No spending data for this period.
                </Text>
              </YStack>
            </Card>
          ) : (
            data.categories.map((category) => (
              <CategoryRow key={category.category} category={category} />
            ))
          )}
        </YStack>

        {/* View All Transactions */}
        <Pressable onPress={() => router.push('/(main)/transactions')}>
          <Card>
            <XStack justifyContent="center" alignItems="center" gap={8}>
              <Text fontSize={14} fontWeight="600" color="#1e3a5f">
                View All Transactions
              </Text>
              <Text fontSize={14} color="#1e3a5f">→</Text>
            </XStack>
          </Card>
        </Pressable>
      </YStack>
    </Animated.View>
  );
}

function CategoryRow({ category }: { category: CategorySpending }) {
  return (
    <Card>
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap={12} alignItems="center" flex={1}>
          <Text fontSize={24}>{category.icon}</Text>
          <YStack flex={1}>
            <Text fontSize={15} fontWeight="600" color="#2d3436">
              {category.display_name}
            </Text>
            <Text fontSize={12} color="#636e72">
              {category.transaction_count} transactions
            </Text>
          </YStack>
        </XStack>
        <YStack alignItems="flex-end">
          <Text fontSize={16} fontWeight="700" color="#c75c5c">
            {formatCurrency(category.amount)}
          </Text>
          <Text fontSize={12} color="#636e72">
            {category.percentage.toFixed(1)}%
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}

// ========== Cash Flow View ==========

function CashFlowView({ 
  data,
  formatMonth,
}: { 
  data: CashFlowSummaryResponse | null;
  formatMonth: (m: string) => string;
}) {
  if (!data) return null;

  const isPositive = data.net_cash_flow >= 0;
  const netColor = isPositive ? '#4a7c59' : '#c75c5c';

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <YStack gap={20} paddingBottom={20}>
        {/* Summary Card */}
        <Card>
          <YStack gap={16}>
            {/* Income */}
            <YStack gap={4}>
              <Text fontSize={14} color="#636e72">Income</Text>
              <XStack alignItems="center" gap={8}>
                <Text fontSize={24} fontWeight="700" color="#4a7c59">
                  +{formatCurrency(data.total_income)}
                </Text>
              </XStack>
              {/* Progress bar */}
              <YStack
                height={8}
                backgroundColor="#e8f5e9"
                borderRadius={4}
                overflow="hidden"
              >
                <YStack
                  height="100%"
                  width="100%"
                  backgroundColor="#4a7c59"
                  borderRadius={4}
                />
              </YStack>
            </YStack>

            {/* Expenses */}
            <YStack gap={4}>
              <Text fontSize={14} color="#636e72">Expenses</Text>
              <XStack alignItems="center" gap={8}>
                <Text fontSize={24} fontWeight="700" color="#c75c5c">
                  -{formatCurrency(data.total_expenses)}
                </Text>
              </XStack>
              {/* Progress bar relative to income */}
              <YStack
                height={8}
                backgroundColor="#fce4ec"
                borderRadius={4}
                overflow="hidden"
              >
                <YStack
                  height="100%"
                  width={`${Math.min((data.total_expenses / data.total_income) * 100, 100)}%`}
                  backgroundColor="#c75c5c"
                  borderRadius={4}
                />
              </YStack>
            </YStack>

            {/* Divider */}
            <YStack height={1} backgroundColor="#f0f2f5" />

            {/* Net Cash Flow */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={16} fontWeight="600" color="#2d3436">
                Net Cash Flow
              </Text>
              <YStack alignItems="flex-end">
                <Text fontSize={24} fontWeight="700" color={netColor}>
                  {isPositive ? '+' : ''}{formatCurrency(data.net_cash_flow)}
                </Text>
                <Text fontSize={12} color="#636e72">
                  {data.savings_rate.toFixed(1)}% savings rate
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Monthly History */}
        <YStack gap={12}>
          <Text fontSize={16} fontWeight="600" color="#2d3436">
            Monthly History
          </Text>
          
          {data.monthly_history.length === 0 ? (
            <Card>
              <YStack alignItems="center" padding={24}>
                <Text fontSize={40}>📈</Text>
                <Text fontSize={14} color="#636e72" textAlign="center" marginTop={8}>
                  No history available yet.
                </Text>
              </YStack>
            </Card>
          ) : (
            <Card>
              <YStack gap={12}>
                {data.monthly_history.map((month, index) => {
                  const monthPositive = month.net >= 0;
                  return (
                    <YStack key={month.month}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={14} fontWeight="600" color="#2d3436">
                          {formatMonth(month.month)}
                        </Text>
                        <XStack gap={16}>
                          <Text fontSize={13} color="#4a7c59">
                            +{formatCurrency(month.income)}
                          </Text>
                          <Text fontSize={13} color="#c75c5c">
                            -{formatCurrency(month.expenses)}
                          </Text>
                          <Text 
                            fontSize={13} 
                            fontWeight="600"
                            color={monthPositive ? '#4a7c59' : '#c75c5c'}
                          >
                            {monthPositive ? '+' : ''}{formatCurrency(month.net)}
                          </Text>
                        </XStack>
                      </XStack>
                      {index < data.monthly_history.length - 1 && (
                        <YStack height={1} backgroundColor="#f0f2f5" marginTop={12} />
                      )}
                    </YStack>
                  );
                })}
              </YStack>
            </Card>
          )}
        </YStack>

        {/* Top Income Sources */}
        {data.income_sources.length > 0 && (
          <YStack gap={12}>
            <Text fontSize={16} fontWeight="600" color="#2d3436">
              Top Income Sources
            </Text>
            {data.income_sources.map((source) => (
              <Card key={source.name}>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontSize={15} fontWeight="600" color="#2d3436" numberOfLines={1}>
                      {source.name}
                    </Text>
                    <Text fontSize={12} color="#636e72">
                      {source.transaction_count} deposits
                    </Text>
                  </YStack>
                  <Text fontSize={16} fontWeight="700" color="#4a7c59">
                    +{formatCurrency(source.amount)}
                  </Text>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      </YStack>
    </Animated.View>
  );
}
