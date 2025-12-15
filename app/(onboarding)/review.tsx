/**
 * Review Screen
 * 
 * Shows net worth summary before completing onboarding.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card, ProgressBar } from '../../src/shared/components';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { NetWorthApiService } from '../../src/api/services/netWorthService';
import { NetWorthSummary, CategoryBreakdown } from '../../src/shared/types';
import { formatCurrency } from '../../src/shared/utils';

export default function ReviewScreen() {
  const router = useRouter();
  const { completeOnboarding, isLoading } = useOnboardingStore();
  const [summary, setSummary] = useState<NetWorthSummary | null>(null);
  const [assetBreakdown, setAssetBreakdown] = useState<CategoryBreakdown[]>([]);
  const [liabilityBreakdown, setLiabilityBreakdown] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [summaryData, assetData, liabilityData] = await Promise.all([
      NetWorthApiService.calculate(),
      NetWorthApiService.getAssetBreakdown(),
      NetWorthApiService.getLiabilityBreakdown(),
    ]);

    setSummary(summaryData);
    setAssetBreakdown(assetData);
    setLiabilityBreakdown(liabilityData);
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/(main)');
  };

  const netWorthColor = (summary?.netWorth ?? 0) >= 0 ? '#4a7c59' : '#c75c5c';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1} padding={24}>
        {/* Progress */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ProgressBar progress={100} />
        </Animated.View>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <YStack gap={8} marginTop={24} alignItems="center">
              <Text
                fontSize={28}
                fontWeight="700"
                color="#2d3436"
                fontFamily="$heading"
                textAlign="center"
              >
                Your Net Worth
              </Text>
              <Text fontSize={16} color="#636e72" textAlign="center">
                Here's your financial snapshot
              </Text>
            </YStack>
          </Animated.View>

          {/* Net Worth Card */}
          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <Card marginTop={32}>
              <YStack alignItems="center" gap={8}>
                <Text fontSize={14} color="#636e72">
                  NET WORTH
                </Text>
                <Text
                  fontSize={40}
                  fontWeight="700"
                  color={netWorthColor}
                  fontFamily="$heading"
                >
                  {formatCurrency(summary?.netWorth ?? 0)}
                </Text>
              </YStack>
            </Card>
          </Animated.View>

          {/* Assets & Liabilities */}
          <Animated.View entering={FadeInUp.delay(500).springify()}>
            <XStack gap={16} marginTop={16}>
              {/* Assets */}
              <Card flex={1}>
                <YStack alignItems="center" gap={4}>
                  <Text fontSize={12} color="#636e72">
                    ASSETS
                  </Text>
                  <Text
                    fontSize={20}
                    fontWeight="700"
                    color="#4a7c59"
                  >
                    {formatCurrency(summary?.totalAssets ?? 0)}
                  </Text>
                </YStack>
              </Card>

              {/* Liabilities */}
              <Card flex={1}>
                <YStack alignItems="center" gap={4}>
                  <Text fontSize={12} color="#636e72">
                    LIABILITIES
                  </Text>
                  <Text
                    fontSize={20}
                    fontWeight="700"
                    color="#c75c5c"
                  >
                    {formatCurrency(summary?.totalLiabilities ?? 0)}
                  </Text>
                </YStack>
              </Card>
            </XStack>
          </Animated.View>

          {/* Breakdown */}
          {(assetBreakdown.length > 0 || liabilityBreakdown.length > 0) && (
            <Animated.View entering={FadeInUp.delay(600).springify()}>
              <YStack gap={16} marginTop={24}>
                {/* Asset Breakdown */}
                {assetBreakdown.length > 0 && (
                  <Card>
                    <YStack gap={12}>
                      <Text fontSize={14} fontWeight="600" color="#636e72">
                        ASSETS BREAKDOWN
                      </Text>
                      {assetBreakdown.map((item) => (
                        <XStack
                          key={item.category}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <XStack gap={8} alignItems="center">
                            <YStack
                              width={12}
                              height={12}
                              borderRadius={6}
                              backgroundColor={item.color}
                            />
                            <Text fontSize={14} color="#2d3436">
                              {item.label}
                            </Text>
                          </XStack>
                          <Text fontSize={14} fontWeight="600" color="#2d3436">
                            {formatCurrency(item.value)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  </Card>
                )}

                {/* Liability Breakdown */}
                {liabilityBreakdown.length > 0 && (
                  <Card>
                    <YStack gap={12}>
                      <Text fontSize={14} fontWeight="600" color="#636e72">
                        LIABILITIES BREAKDOWN
                      </Text>
                      {liabilityBreakdown.map((item) => (
                        <XStack
                          key={item.category}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <XStack gap={8} alignItems="center">
                            <YStack
                              width={12}
                              height={12}
                              borderRadius={6}
                              backgroundColor={item.color}
                            />
                            <Text fontSize={14} color="#2d3436">
                              {item.label}
                            </Text>
                          </XStack>
                          <Text fontSize={14} fontWeight="600" color="#2d3436">
                            {formatCurrency(item.value)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  </Card>
                )}
              </YStack>
            </Animated.View>
          )}

          {/* Empty State */}
          {summary?.totalAssets === 0 && summary?.totalLiabilities === 0 && (
            <Animated.View entering={FadeInUp.delay(600).springify()}>
              <Card marginTop={24}>
                <YStack alignItems="center" padding={16} gap={12}>
                  <Text fontSize={48}>🎯</Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    You can add your assets and liabilities from the dashboard anytime.
                  </Text>
                </YStack>
              </Card>
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(700).springify()}>
          <YStack gap={12} marginTop={16}>
            <Button
              variant="primary"
              fullWidth
              onPress={handleComplete}
              loading={isLoading}
            >
              Go to Dashboard
            </Button>
            <Text fontSize={12} color="#a0a0a0" textAlign="center">
              You can update these values anytime
            </Text>
          </YStack>
        </Animated.View>
      </YStack>
    </SafeAreaView>
  );
}

