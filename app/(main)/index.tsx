/**
 * Dashboard Screen
 * 
 * Main view showing net worth and breakdown.
 */

import React, { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { formatCurrency } from '../../src/shared/utils';

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

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const netWorthColor = (summary?.netWorth ?? 0) >= 0 ? '#4a7c59' : '#c75c5c';

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
          </Animated.View>

          {/* Net Worth Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <Card>
              <YStack alignItems="center" gap={12}>
                <Text fontSize={14} color="#636e72">
                  NET WORTH
                </Text>
                <Text
                  fontSize={48}
                  fontWeight="700"
                  color={netWorthColor}
                  fontFamily="$heading"
                >
                  {formatCurrency(summary?.netWorth ?? 0)}
                </Text>
                <XStack gap={24}>
                  <YStack alignItems="center">
                    <Text fontSize={12} color="#636e72">
                      Assets
                    </Text>
                    <Text fontSize={16} fontWeight="600" color="#4a7c59">
                      {formatCurrency(summary?.totalAssets ?? 0)}
                    </Text>
                  </YStack>
                  <YStack alignItems="center">
                    <Text fontSize={12} color="#636e72">
                      Liabilities
                    </Text>
                    <Text fontSize={16} fontWeight="600" color="#c75c5c">
                      {formatCurrency(summary?.totalLiabilities ?? 0)}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
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
          </Animated.View>

          {/* Assets Section */}
          <Animated.View entering={FadeInUp.delay(400).springify()}>
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
          <Animated.View entering={FadeInUp.delay(500).springify()}>
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
          <Animated.View entering={FadeInUp.delay(600).springify()}>
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
    </SafeAreaView>
  );
}

