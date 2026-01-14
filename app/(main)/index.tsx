/**
 * Dashboard Screen
 * 
 * Main view showing net worth and breakdown.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView as TamaguiScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl, Dimensions, NativeScrollEvent, NativeSyntheticEvent, View, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card, PieChart, BreakdownCategoriesModal } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { useAuthStore } from '../../src/features/auth/store';
import { formatCurrency, formatPercentage } from '../../src/shared/utils';
import type { PieChartData } from '../../src/shared/components';
import { PlaidLinkButton } from '../../src/features/plaid/components/PlaidLinkButton';
import { PlaidAccountsModal } from '../../src/features/plaid/components/PlaidAccountsModal';
import { usePlaidStore } from '../../src/features/plaid/store';
import type { PlaidAccountInfo } from '../../src/api/services/plaidService';
import { SpendingService, CashFlowSummaryResponse } from '../../src/api/services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;
const PEEK_WIDTH = 24; // Show peek of next card
const CARD_GAP = 12;
const CAROUSEL_CARD_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2) - PEEK_WIDTH;
const SNAP_INTERVAL = CAROUSEL_CARD_WIDTH + CARD_GAP;
const CARD_SPACING = CARD_PADDING * 2; // For other components

// Carousel card styles
const CARD_TITLES = ['Net Worth', 'Cash Flow', 'Assets', 'Liabilities'];

export default function DashboardScreen() {
  const router = useRouter();
  const {
    summary,
    assets,
    liabilities,
    assetBreakdown,
    liabilityBreakdown,
    isLoading,
    refresh,
  } = useNetWorthStore();
  const { signOut, user } = useAuthStore();

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  // Cash flow data for snapshot card
  const [cashFlowData, setCashFlowData] = useState<CashFlowSummaryResponse | null>(null);

  // Modal state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showPlaidAccountsModal, setShowPlaidAccountsModal] = useState(false);
  const [plaidAccountsToLink, setPlaidAccountsToLink] = useState<PlaidAccountInfo[]>([]);
  const [plaidInstitutionName, setPlaidInstitutionName] = useState<string | undefined>(undefined);
  
  // Plaid store for connected accounts count
  const { connectedAccounts, refreshConnectedAccounts } = usePlaidStore();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  // Refresh data when screen is focused
  // Fetch cash flow data
  const fetchCashFlow = useCallback(async () => {
    try {
      const data = await SpendingService.getCashFlow(1); // Current month only
      setCashFlowData(data);
    } catch (err) {
      console.log('[Dashboard] Cash flow fetch failed (may not have transactions yet)');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshConnectedAccounts();
      fetchCashFlow();
    }, [fetchCashFlow])
  );

  const netWorthColor = (summary?.netWorth ?? 0) >= 0 ? '#4a7c59' : '#c75c5c';

  // Convert breakdown data to pie chart format
  const assetChartData: PieChartData[] = assetBreakdown.map((item) => ({
    label: item.label,
    value: item.value,
    percentage: item.percentage,
    color: item.color,
  }));

  const liabilityChartData: PieChartData[] = liabilityBreakdown.map((item) => ({
    label: item.label,
    value: item.value,
    percentage: item.percentage,
    color: item.color,
  }));

  // Determine which cards to show
  const breakdownCards = [];
  if (assets.length > 0 && assetChartData.length > 0) {
    breakdownCards.push({
      type: 'asset' as const,
      data: assetChartData,
    });
  }
  if (liabilities.length > 0 && liabilityChartData.length > 0) {
    breakdownCards.push({
      type: 'liability' as const,
      data: liabilityChartData,
    });
  }

  // Handle scroll to update active index
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SNAP_INTERVAL);
    setActiveIndex(index);
  };

  // Handle dot press to scroll to card
  const handleDotPress = (index: number) => {
    carouselRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#1e3a5f"
          />
        }
      >
        <YStack padding={24} gap={24}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize={14} color="#636e72">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text
                  fontSize={28}
                  fontWeight="700"
                  color="#2d3436"
                  fontFamily="$heading"
                >
                  Dashboard
                </Text>
              </YStack>
              <XStack gap={8} alignItems="center">
                {user && (
                  <Pressable onPress={handleLogout}>
                    <Text fontSize={12} color="#636e72">
                      Logout
                    </Text>
                  </Pressable>
                )}
                <YStack
                  width={48}
                  height={48}
                  borderRadius={24}
                  backgroundColor="#1e3a5f"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={24}>💰</Text>
                </YStack>
              </XStack>
            </XStack>
          </Animated.View>

          {/* Dashboard Carousel */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <YStack gap={16}>
              <ScrollView
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                style={{ marginHorizontal: -CARD_PADDING }}
                contentContainerStyle={{ paddingHorizontal: CARD_PADDING }}
              >
                {/* Card 1: Net Worth */}
                <View style={{ 
                  width: CAROUSEL_CARD_WIDTH, 
                  marginRight: CARD_GAP,
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#1e3a5f',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                }}>
                  <YStack 
                    backgroundColor="#1e3a5f"
                    padding={20}
                    minHeight={180}
                  >
                    <XStack alignItems="center" gap={8} marginBottom={12}>
                      <Text fontSize={18}>💰</Text>
                      <Text fontSize={13} color="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing={1}>
                        NET WORTH
                      </Text>
                    </XStack>
                    <Text
                      fontSize={38}
                      fontWeight="700"
                      color="#fff"
                      fontFamily="$heading"
                      marginBottom={16}
                    >
                      {formatCurrency(summary?.netWorth ?? 0)}
                    </Text>
                    <XStack gap={24}>
                      <YStack>
                        <Text fontSize={11} color="rgba(255,255,255,0.6)">Assets</Text>
                        <Text fontSize={16} fontWeight="600" color="#7ed6a6">
                          {formatCurrency(summary?.totalAssets ?? 0)}
                        </Text>
                      </YStack>
                      <YStack>
                        <Text fontSize={11} color="rgba(255,255,255,0.6)">Liabilities</Text>
                        <Text fontSize={16} fontWeight="600" color="#ff9b9b">
                          {formatCurrency(summary?.totalLiabilities ?? 0)}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>
                </View>

                {/* Card 2: Cash Flow Snapshot */}
                <Pressable 
                  onPress={() => router.push('/(main)/spending')} 
                  style={{ 
                    width: CAROUSEL_CARD_WIDTH, 
                    marginRight: CARD_GAP,
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#2d4a6f',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <YStack 
                    backgroundColor="#2d4a6f"
                    padding={20}
                    minHeight={180}
                  >
                    <XStack alignItems="center" gap={8} marginBottom={12}>
                      <Text fontSize={18}>📊</Text>
                      <Text fontSize={13} color="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing={1}>
                        THIS MONTH
                      </Text>
                    </XStack>
                    {cashFlowData ? (
                      <>
                        <Text
                          fontSize={38}
                          fontWeight="700"
                          color={cashFlowData.net_cash_flow >= 0 ? '#7ed6a6' : '#ff9b9b'}
                          fontFamily="$heading"
                          marginBottom={16}
                        >
                          {cashFlowData.net_cash_flow >= 0 ? '+' : ''}{formatCurrency(cashFlowData.net_cash_flow)}
                        </Text>
                        <XStack gap={20}>
                          <YStack>
                            <Text fontSize={11} color="rgba(255,255,255,0.6)">Income</Text>
                            <Text fontSize={15} fontWeight="600" color="#7ed6a6">
                              +{formatCurrency(cashFlowData.total_income)}
                            </Text>
                          </YStack>
                          <YStack>
                            <Text fontSize={11} color="rgba(255,255,255,0.6)">Spent</Text>
                            <Text fontSize={15} fontWeight="600" color="#ff9b9b">
                              -{formatCurrency(cashFlowData.total_expenses)}
                            </Text>
                          </YStack>
                          <YStack>
                            <Text fontSize={11} color="rgba(255,255,255,0.6)">
                              {cashFlowData.savings_rate >= 0 ? 'Saved' : 'Over'}
                            </Text>
                            <Text fontSize={15} fontWeight="600" color={cashFlowData.savings_rate >= 0 ? '#a0d4ff' : '#ff9b9b'}>
                              {cashFlowData.savings_rate >= 0 
                                ? `${Math.min(cashFlowData.savings_rate, 100).toFixed(0)}%`
                                : `${Math.abs(Math.max(cashFlowData.savings_rate, -100)).toFixed(0)}%`
                              }
                            </Text>
                          </YStack>
                        </XStack>
                      </>
                    ) : (
                      <YStack alignItems="center" justifyContent="center" flex={1}>
                        <Text fontSize={36}>💸</Text>
                        <Text fontSize={14} color="rgba(255,255,255,0.7)" textAlign="center" marginTop={8}>
                          Connect accounts to see cash flow
                        </Text>
                      </YStack>
                    )}
                  </YStack>
                </Pressable>

                {/* Card 3: Assets Breakdown */}
                <Pressable 
                  onPress={() => router.push('/(main)/assets')} 
                  style={{ 
                    width: CAROUSEL_CARD_WIDTH, 
                    marginRight: CARD_GAP,
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#1e4a4a',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <YStack 
                    backgroundColor="#1e4a4a"
                    padding={20}
                    minHeight={180}
                  >
                    <XStack alignItems="center" justifyContent="space-between" marginBottom={12}>
                      <XStack alignItems="center" gap={8}>
                        <Text fontSize={18}>📈</Text>
                        <Text fontSize={13} color="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing={1}>
                          ASSETS
                        </Text>
                      </XStack>
                      <Text fontSize={18} fontWeight="700" color="#7ed6a6">
                        {formatCurrency(summary?.totalAssets ?? 0)}
                      </Text>
                    </XStack>
                    {assetBreakdown.length > 0 ? (
                      <YStack gap={10} flex={1}>
                        {assetBreakdown.slice(0, 4).map((item, idx) => (
                          <XStack key={idx} justifyContent="space-between" alignItems="center">
                            <XStack gap={8} alignItems="center" flex={1}>
                              <YStack width={8} height={8} borderRadius={4} backgroundColor={item.color} />
                              <Text fontSize={13} color="rgba(255,255,255,0.85)" numberOfLines={1} flex={1}>
                                {item.label}
                              </Text>
                            </XStack>
                            <Text fontSize={13} fontWeight="600" color="#7ed6a6">
                              {formatCurrency(item.value)}
                            </Text>
                          </XStack>
                        ))}
                        {assetBreakdown.length > 4 && (
                          <Text fontSize={11} color="rgba(255,255,255,0.5)" textAlign="right">
                            +{assetBreakdown.length - 4} more →
                          </Text>
                        )}
                      </YStack>
                    ) : (
                      <YStack alignItems="center" justifyContent="center" flex={1}>
                        <Text fontSize={14} color="rgba(255,255,255,0.7)">No assets yet</Text>
                      </YStack>
                    )}
                  </YStack>
                </Pressable>

                {/* Card 4: Liabilities Breakdown */}
                <Pressable 
                  onPress={() => router.push('/(main)/liabilities')} 
                  style={{ 
                    width: CAROUSEL_CARD_WIDTH,
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#4a2a3a',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <YStack 
                    backgroundColor="#4a2a3a"
                    padding={20}
                    minHeight={180}
                  >
                    <XStack alignItems="center" justifyContent="space-between" marginBottom={12}>
                      <XStack alignItems="center" gap={8}>
                        <Text fontSize={18}>💳</Text>
                        <Text fontSize={13} color="rgba(255,255,255,0.7)" fontWeight="600" letterSpacing={1}>
                          LIABILITIES
                        </Text>
                      </XStack>
                      <Text fontSize={18} fontWeight="700" color="#ff9b9b">
                        {formatCurrency(summary?.totalLiabilities ?? 0)}
                      </Text>
                    </XStack>
                    {liabilityBreakdown.length > 0 ? (
                      <YStack gap={10} flex={1}>
                        {liabilityBreakdown.slice(0, 4).map((item, idx) => (
                          <XStack key={idx} justifyContent="space-between" alignItems="center">
                            <XStack gap={8} alignItems="center" flex={1}>
                              <YStack width={8} height={8} borderRadius={4} backgroundColor={item.color} />
                              <Text fontSize={13} color="rgba(255,255,255,0.85)" numberOfLines={1} flex={1}>
                                {item.label}
                              </Text>
                            </XStack>
                            <Text fontSize={13} fontWeight="600" color="#ff9b9b">
                              {formatCurrency(item.value)}
                            </Text>
                          </XStack>
                        ))}
                        {liabilityBreakdown.length > 4 && (
                          <Text fontSize={11} color="rgba(255,255,255,0.5)" textAlign="right">
                            +{liabilityBreakdown.length - 4} more →
                          </Text>
                        )}
                      </YStack>
                    ) : (
                      <YStack alignItems="center" justifyContent="center" flex={1}>
                        <Text fontSize={14} color="rgba(255,255,255,0.7)">No liabilities</Text>
                      </YStack>
                    )}
                  </YStack>
                </Pressable>
              </ScrollView>

              {/* Modern Pill Pagination */}
              <XStack justifyContent="center" gap={6}>
                {CARD_TITLES.map((title, index) => (
                  <Pressable key={index} onPress={() => handleDotPress(index)}>
                    <YStack
                      paddingHorizontal={activeIndex === index ? 12 : 0}
                      paddingVertical={4}
                      borderRadius={12}
                      backgroundColor={activeIndex === index ? '#1e3a5f' : 'transparent'}
                      minWidth={activeIndex === index ? 'auto' : 8}
                      height={activeIndex === index ? 'auto' : 8}
                      justifyContent="center"
                      alignItems="center"
                    >
                      {activeIndex === index ? (
                        <Text fontSize={11} color="#fff" fontWeight="600">
                          {title}
                        </Text>
                      ) : (
                        <YStack width={8} height={8} borderRadius={4} backgroundColor="#d0d0d0" />
                      )}
                    </YStack>
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          </Animated.View>

          {/* Breakdown Cards Carousel - HIDDEN TEMPORARILY */}
          {false && breakdownCards.length > 0 && (
            <Animated.View entering={FadeInUp.delay(250).springify()}>
              <YStack gap={16}>
                {/* Carousel */}
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  snapToInterval={SNAP_INTERVAL}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingLeft: CARD_PADDING,
                    paddingRight: CARD_PADDING,
                  }}
                >
                  {breakdownCards.map((card, cardIndex) => (
                    <View
                      key={cardIndex}
                      style={{
                        width: CARD_WIDTH,
                        marginRight: cardIndex < breakdownCards.length - 1 ? CARD_SPACING : 0,
                      }}
                    >
                      <Card>
                        <YStack gap={16}>
                          <Text fontSize={18} fontWeight="700" color="#2d3436">
                            {card.type === 'asset' ? 'Asset Breakdown' : 'Liability Breakdown'}
                          </Text>

                          <XStack justifyContent="center" paddingVertical={8}>
                            <PieChart
                              data={card.data}
                              size={200}
                              showLabels={true}
                              showPercentages={true}
                            />
                          </XStack>

                          <YStack gap={8} marginTop={8}>
                            {card.data.slice(0, 5).map((item, index) => (
                              <XStack
                                key={index}
                                justifyContent="space-between"
                                alignItems="center"
                                paddingVertical={4}
                              >
                                <XStack gap={8} alignItems="center" flex={1}>
                                  <YStack
                                    width={12}
                                    height={12}
                                    borderRadius={6}
                                    backgroundColor={item.color}
                                  />
                                  <Text fontSize={14} color="#2d3436" flex={1} numberOfLines={1}>
                                    {item.label}
                                  </Text>
                                </XStack>
                                <XStack gap={4} alignItems="center">
                                  <Text
                                    fontSize={14}
                                    fontWeight="700"
                                    color={card.type === 'asset' ? '#4a7c59' : '#c75c5c'}
                                    width={85}
                                    textAlign="right"
                                  >
                                    {formatCurrency(item.value)}
                                  </Text>
                                  <Text
                                    fontSize={12}
                                    color="#636e72"
                                    width={42}
                                    textAlign="right"
                                  >
                                    {formatPercentage(item.percentage)}
                                  </Text>
                                </XStack>
                              </XStack>
                            ))}
                            {card.data.length > 5 && (
                              <Pressable
                                onPress={() => {
                                  if (card.type === 'asset') {
                                    setShowAssetModal(true);
                                  } else {
                                    setShowLiabilityModal(true);
                                  }
                                }}
                                style={{ marginTop: 8 }}
                              >
                                <Text
                                  fontSize={12}
                                  color="#1e3a5f"
                                  textAlign="center"
                                  fontWeight="600"
                                >
                                  +{card.data.length - 5} more categories
                                </Text>
                              </Pressable>
                            )}
                          </YStack>
                        </YStack>
                      </Card>
                    </View>
                  ))}
                </ScrollView>

                {/* Dot Indicators */}
                {breakdownCards.length > 1 && (
                  <XStack justifyContent="center" gap={8} paddingVertical={8}>
                    {breakdownCards.map((_, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleDotPress(index)}
                      >
                        <YStack
                          width={index === activeIndex ? 24 : 8}
                          height={8}
                          borderRadius={4}
                          backgroundColor={index === activeIndex ? '#1e3a5f' : '#d0d0d0'}
                        />
                      </Pressable>
                    ))}
                  </XStack>
                )}
              </YStack>
            </Animated.View>
          )}

          {/* Connect Bank Account Button */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <YStack gap={8}>
              <PlaidLinkButton
                onSuccess={(publicToken: string, metadata: any) => {
                  console.log('[Dashboard] Plaid Link Success');
                  // Accounts are already exchanged by PlaidLinkButton and passed in metadata
                  if (metadata.accounts && metadata.accounts.length > 0) {
                    setPlaidAccountsToLink(metadata.accounts);
                    setPlaidInstitutionName(metadata.institution?.name);
                    setShowPlaidAccountsModal(true);
                  }
                }}
                onError={(error: any) => {
                  console.error('[Dashboard] Plaid Link Error:', error);
                }}
                onExit={() => {
                  console.log('[Dashboard] Plaid Link exited');
                }}
              />
              {/* Connection count indicator - useful for future subscription limits */}
              {connectedAccounts.length > 0 && (
                <Pressable onPress={() => router.push('/(main)/connected-accounts')}>
                  <XStack justifyContent="center" alignItems="center" gap={6}>
                    <YStack width={8} height={8} borderRadius={4} backgroundColor="#4a7c59" />
                    <Text fontSize={12} color="#636e72">
                      {connectedAccounts.length} {connectedAccounts.length === 1 ? 'account' : 'accounts'} connected
                    </Text>
                    <Text fontSize={12} color="#1e3a5f">→</Text>
                  </XStack>
                </Pressable>
              )}
            </YStack>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <YStack gap={12}>
              <XStack gap={12}>
                <Button
                  flex={1}
                  variant="primary"
                  size="small"
                  onPress={() => router.push('/(main)/add-asset')}
                >
                  + Add Asset
                </Button>
                <Button
                  flex={1}
                  variant="secondary"
                  size="small"
                  onPress={() => router.push('/(main)/add-liability')}
                >
                  + Add Liability
                </Button>
              </XStack>
              <Pressable onPress={() => router.push('/(main)/spending')}>
                <Card>
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap={12} alignItems="center">
                      <Text fontSize={24}>💸</Text>
                      <YStack>
                        <Text fontSize={15} fontWeight="600" color="#2d3436">
                          Spending & Cash Flow
                        </Text>
                        <Text fontSize={12} color="#636e72">
                          Track expenses and income
                        </Text>
                      </YStack>
                    </XStack>
                    <Text fontSize={16} color="#1e3a5f">→</Text>
                  </XStack>
                </Card>
              </Pressable>
            </YStack>
          </Animated.View>

          {/* Assets Section */}
          <Animated.View entering={FadeInUp.delay(450).springify()}>
            <YStack gap={16}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={18} fontWeight="700" color="#2d3436">
                  Assets
                </Text>
                <Pressable onPress={() => router.push('/(main)/assets')}>
                  <Text fontSize={14} color="#1e3a5f">
                    See all →
                  </Text>
                </Pressable>
              </XStack>

              {assets.length === 0 ? (
                <Card>
                  <YStack alignItems="center" padding={16} gap={8}>
                    <Text fontSize={32}>📈</Text>
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      No assets yet. Add your first asset to start tracking.
                    </Text>
                  </YStack>
                </Card>
              ) : (
                <YStack gap={12}>
                  {assetBreakdown.slice(0, 4).map((item) => (
                    <Card key={item.category}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap={12} alignItems="center">
                          <YStack
                            width={12}
                            height={12}
                            borderRadius={6}
                            backgroundColor={item.color}
                          />
                          <Text fontSize={16} color="#2d3436">
                            {item.label}
                          </Text>
                        </XStack>
                        <Text fontSize={16} fontWeight="600" color="#4a7c59">
                          {formatCurrency(item.value)}
                        </Text>
                      </XStack>
                    </Card>
                  ))}
                </YStack>
              )}
            </YStack>
          </Animated.View>

          {/* Liabilities Section */}
          <Animated.View entering={FadeInUp.delay(550).springify()}>
            <YStack gap={16}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={18} fontWeight="700" color="#2d3436">
                  Liabilities
                </Text>
                <Pressable onPress={() => router.push('/(main)/liabilities')}>
                  <Text fontSize={14} color="#1e3a5f">
                    See all →
                  </Text>
                </Pressable>
              </XStack>

              {liabilities.length === 0 ? (
                <Card>
                  <YStack alignItems="center" padding={16} gap={8}>
                    <Text fontSize={32}>✨</Text>
                    <Text fontSize={14} color="#636e72" textAlign="center">
                      No liabilities. Great job staying debt-free!
                    </Text>
                  </YStack>
                </Card>
              ) : (
                <YStack gap={12}>
                  {liabilityBreakdown.slice(0, 4).map((item) => (
                    <Card key={item.category}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap={12} alignItems="center">
                          <YStack
                            width={12}
                            height={12}
                            borderRadius={6}
                            backgroundColor={item.color}
                          />
                          <Text fontSize={16} color="#2d3436">
                            {item.label}
                          </Text>
                        </XStack>
                        <Text fontSize={16} fontWeight="600" color="#c75c5c">
                          {formatCurrency(item.value)}
                        </Text>
                      </XStack>
                    </Card>
                  ))}
                </YStack>
              )}
            </YStack>
          </Animated.View>

          {/* Phase 2/3 Preview Cards */}
          <Animated.View entering={FadeInUp.delay(650).springify()}>
            <YStack gap={12}>
              <Card variant="highlighted">
                <XStack gap={12} alignItems="center">
                  <Text fontSize={32}>📊</Text>
                  <YStack flex={1}>
                    <Text fontSize={16} fontWeight="600" color="#2d3436">
                      Budget & Spending
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      Coming in Phase 2
                    </Text>
                  </YStack>
                </XStack>
              </Card>

              <Card variant="highlighted">
                <XStack gap={12} alignItems="center">
                  <Text fontSize={32}>🎯</Text>
                  <YStack flex={1}>
                    <Text fontSize={16} fontWeight="600" color="#2d3436">
                      Financial Independence
                    </Text>
                    <Text fontSize={14} color="#636e72">
                      Coming in Phase 3
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            </YStack>
          </Animated.View>
        </YStack>
      </ScrollView>

      {/* Modals */}
      <BreakdownCategoriesModal
        visible={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        title="All Asset Categories"
        data={assetChartData}
        valueColor="#4a7c59"
      />

      <BreakdownCategoriesModal
        visible={showLiabilityModal}
        onClose={() => setShowLiabilityModal(false)}
        title="All Liability Categories"
        data={liabilityChartData}
        valueColor="#c75c5c"
      />

      <PlaidAccountsModal
        visible={showPlaidAccountsModal}
        accounts={plaidAccountsToLink}
        institutionName={plaidInstitutionName}
        onClose={() => {
          setShowPlaidAccountsModal(false);
          setPlaidAccountsToLink([]);
          setPlaidInstitutionName(undefined);
        }}
        onComplete={() => {
          setShowPlaidAccountsModal(false);
          setPlaidAccountsToLink([]);
          setPlaidInstitutionName(undefined);
          refresh(); // Refresh net worth data after linking
        }}
      />
    </SafeAreaView>
  );
}
