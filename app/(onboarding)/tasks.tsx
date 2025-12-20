/**
 * Data Entry Tasks Screen
 * 
 * Shows a checklist of items to enter values for.
 * User can fill in or skip each item.
 */

import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, ProgressBar, Input, CurrencyInput } from '../../src/shared/components/index';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { DataEntryTask, AssetCategory, LiabilityCategory } from '../../src/shared/types';
import { ASSET_CATEGORY_CONFIG, LIABILITY_CATEGORY_CONFIG } from '../../src/features/netWorth/service';
import { OnboardingApiService } from '../../src/api/services/onboardingService';

export default function TasksScreen() {
  const router = useRouter();
  const { state, completeTask, skipTask, isLoading, goToStep, init } = useOnboardingStore();

  // Refresh state when screen comes into focus to ensure we have latest tasks
  useFocusEffect(
    useCallback(() => {
      const refreshState = async () => {
        try {
          // If state is not initialized, initialize it
          if (!state) {
            await init();
          } else {
            // Otherwise, refresh to get latest tasks from backend
            const freshState = await OnboardingApiService.getState();
            if (freshState) {
              useOnboardingStore.setState({ state: freshState });
            }
          }
        } catch (error) {
          console.error('[TasksScreen] Failed to refresh state:', error);
        }
      };
      refreshState();
    }, [state, init])
  );
  const [activeTask, setActiveTask] = useState<DataEntryTask | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskValue, setTaskValue] = useState(0);
  const [taskInterestRate, setTaskInterestRate] = useState(0);

  const tasks = state?.tasks ?? [];
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const handleTaskPress = (task: DataEntryTask) => {
    setActiveTask(task);
    setTaskName(task.defaultName);
    setTaskValue(0);
    setTaskInterestRate(0);
  };

  const handleSaveTask = async () => {
    if (!activeTask) return;

    await completeTask(activeTask.id, {
      name: taskName,
      value: taskValue,
      interestRate: activeTask.type === 'liability' ? taskInterestRate : undefined,
    });

    setActiveTask(null);
  };

  const handleSkipTask = async () => {
    if (!activeTask) return;
    await skipTask(activeTask.id);
    setActiveTask(null);
  };

  const handleContinue = async () => {
    await goToStep('review');
    router.push('/(onboarding)/review');
  };

  const getCategoryLabel = (task: DataEntryTask): string => {
    if (task.type === 'asset') {
      const config = ASSET_CATEGORY_CONFIG[task.category as AssetCategory];
      return config?.label ?? task.category;
    }
    const config = LIABILITY_CATEGORY_CONFIG[task.category as LiabilityCategory];
    return config?.label ?? task.category;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }}>
      <YStack flex={1} padding={24}>
        {/* Progress */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ProgressBar progress={90} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <YStack gap={8} marginTop={24}>
            <Text
              fontSize={28}
              fontWeight="700"
              color="#2d3436"
              fontFamily="$heading"
            >
              Enter your values
            </Text>
            <Text fontSize={16} color="#636e72">
              Tap each item to add details. You can skip and add them later.
            </Text>
          </YStack>
        </Animated.View>

        {/* Task List */}
        <ScrollView flex={1} marginTop={24} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            {tasks.length === 0 ? (
              <Card>
                <YStack alignItems="center" padding={24} gap={12}>
                  <Text fontSize={48}>📋</Text>
                  <Text fontSize={16} color="#636e72" textAlign="center">
                    No items to add. You can always add assets and liabilities from the dashboard.
                  </Text>
                </YStack>
              </Card>
            ) : (
              <YStack gap={16}>
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <YStack gap={12}>
                    <Text fontSize={14} fontWeight="600" color="#636e72">
                      TO DO ({pendingTasks.length})
                    </Text>
                    {pendingTasks.map((task) => (
                      <Pressable key={task.id} onPress={() => handleTaskPress(task)}>
                        <Card pressable>
                          <XStack alignItems="center" gap={12}>
                            <YStack
                              width={40}
                              height={40}
                              borderRadius={20}
                              backgroundColor={task.type === 'asset' ? '#e8f5e9' : '#ffebee'}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize={20}>
                                {task.type === 'asset' ? '📈' : '📉'}
                              </Text>
                            </YStack>
                            <YStack flex={1}>
                              <Text fontSize={16} fontWeight="600" color="#2d3436">
                                {task.defaultName}
                              </Text>
                              <Text fontSize={14} color="#636e72">
                                {getCategoryLabel(task)}
                              </Text>
                            </YStack>
                            <Text fontSize={16} color="#1e3a5f">›</Text>
                          </XStack>
                        </Card>
                      </Pressable>
                    ))}
                  </YStack>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <YStack gap={12}>
                    <Text fontSize={14} fontWeight="600" color="#636e72">
                      COMPLETED ({completedTasks.length})
                    </Text>
                    {completedTasks.map((task) => (
                      <Card key={task.id} variant="success">
                        <XStack alignItems="center" gap={12}>
                          <YStack
                            width={40}
                            height={40}
                            borderRadius={20}
                            backgroundColor="#4a7c59"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize={16} color="#ffffff">✓</Text>
                          </YStack>
                          <YStack flex={1}>
                            <Text fontSize={16} fontWeight="600" color="#2d3436">
                              {task.defaultName}
                            </Text>
                            <Text fontSize={14} color="#636e72">
                              {task.entityId ? 'Added' : 'Skipped'}
                            </Text>
                          </YStack>
                        </XStack>
                      </Card>
                    ))}
                  </YStack>
                )}
              </YStack>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Button
            variant="primary"
            fullWidth
            onPress={handleContinue}
          >
            {pendingTasks.length > 0 ? 'Skip Remaining & Continue' : 'Continue to Review'}
          </Button>
        </Animated.View>
      </YStack>

      {/* Task Entry Modal */}
      <Modal
        visible={activeTask !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveTask(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          <YStack
            flex={1}
            backgroundColor="rgba(0,0,0,0.5)"
            justifyContent="flex-end"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <YStack
                backgroundColor="#ffffff"
                borderTopLeftRadius={24}
                borderTopRightRadius={24}
                padding={24}
                gap={20}
              >
                {/* Modal Header */}
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={20} fontWeight="700" color="#2d3436" flex={1}>
                    {activeTask?.defaultName}
                  </Text>
                  <Pressable onPress={() => setActiveTask(null)}>
                    <Text fontSize={24} color="#636e72">×</Text>
                  </Pressable>
                </XStack>

                {/* Form */}
                <Input
                  label="Name"
                  placeholder="e.g., Chase Checking"
                  value={taskName}
                  onChangeText={setTaskName}
                />

                <CurrencyInput
                  label={activeTask?.type === 'asset' ? 'Current Value' : 'Current Balance'}
                  value={taskValue}
                  onChangeValue={setTaskValue}
                  placeholder="0"
                />

                {activeTask?.type === 'liability' && (
                  <Input
                    label="Interest Rate (%)"
                    placeholder="e.g., 6.5"
                    keyboardType="decimal-pad"
                    value={taskInterestRate > 0 ? taskInterestRate.toString() : ''}
                    onChangeText={(text) => setTaskInterestRate(parseFloat(text) || 0)}
                    helperText="Optional"
                  />
                )}

                {/* Actions */}
                <YStack gap={12} marginTop={8}>
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={handleSaveTask}
                    loading={isLoading}
                    disabled={!taskName || taskValue <= 0}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onPress={handleSkipTask}
                  >
                    Skip this item
                  </Button>
                </YStack>
              </YStack>
            </ScrollView>
          </YStack>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

