/**
 * Add Liability Screen
 * 
 * Modal for adding a new liability.
 * Supports both Plaid (bank connection) and manual entry.
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Input, CurrencyInput, OptionButton, CountInputModal, MultiItemForm, ExistingItemsView } from '../../src/shared/components';
import { useNetWorthStore } from '../../src/features/netWorth/store';
import { usePlaidStore } from '../../src/features/plaid/store';
import { PlaidLinkButton } from '../../src/features/plaid/components/PlaidLinkButton';
import { PlaidAccountsModal } from '../../src/features/plaid/components/PlaidAccountsModal';
import { LiabilityCategory } from '../../src/shared/types';
import { getLiabilityCategoryLabel } from '../../src/features/netWorth/service';
import { isLiabilityCategoryItemizable, getLiabilityItemizationLabel, getLiabilityAdditionalItemizationLabel } from '../../src/shared/utils/itemization';
import type { PlaidAccountInfo } from '../../src/api/services/plaidService';

// Types for multi-item form
type AssetItemData = {
  name: string;
  value: number;
};

type LiabilityItemData = {
  name: string;
  balance: number;
  interestRate?: number;
};

const LIABILITY_CATEGORIES: Array<{ value: LiabilityCategory; label: string }> = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'other', label: 'Other Debt' },
];

export default function AddLiabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plaidAccountId?: string;
    plaidName?: string;
    plaidCategory?: string;
    plaidType?: string;
    plaidSubtype?: string;
    plaidBalance?: string;
    method?: string; // 'manual' to skip method selection
  }>();
  const { addLiability, isLoading, error, liabilities, refresh } = useNetWorthStore();
  const { linkAccount, connectedAccounts } = usePlaidStore();

  // Determine initial step based on params
  const getInitialStep = () => {
    // If coming from Plaid flow with account data, skip to category
    if (params.plaidAccountId) return 'category';
    // If method=manual passed, skip method selection
    if (params.method === 'manual') return 'category';
    return 'method';
  };

  const [step, setStep] = useState<'method' | 'category' | 'existing' | 'count' | 'details'>(getInitialStep);
  const [category, setCategory] = useState<LiabilityCategory | null>(null);
  const [count, setCount] = useState(1);
  const [showCountModal, setShowCountModal] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [interestRate, setInterestRate] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [plaidAccountId, setPlaidAccountId] = useState<string | null>(null);
  
  // Plaid flow state
  const [showPlaidAccountsModal, setShowPlaidAccountsModal] = useState(false);
  const [plaidAccountsToLink, setPlaidAccountsToLink] = useState<PlaidAccountInfo[]>([]);
  const [plaidInstitutionName, setPlaidInstitutionName] = useState<string | undefined>();

  // Pre-fill from Plaid data if coming from account linking
  useEffect(() => {
    if (params.plaidAccountId) {
      setPlaidAccountId(params.plaidAccountId);
      
      // Pre-fill name from Plaid
      if (params.plaidName) {
        setName(params.plaidName);
      }
      
      // Pre-fill balance from Plaid (auto-sync the value!)
      if (params.plaidBalance) {
        const plaidBal = parseFloat(params.plaidBalance);
        if (!isNaN(plaidBal)) {
          setBalance(Math.abs(plaidBal)); // Use absolute value for liabilities
        }
      }
      
      // Pre-select category if provided
      if (params.plaidCategory) {
        const matchingCategory = LIABILITY_CATEGORIES.find(
          c => c.value === params.plaidCategory
        );
        if (matchingCategory) {
          setCategory(matchingCategory.value);
          setStep('details'); // Skip to details since we have category
        }
      }
    }
  }, [params.plaidAccountId, params.plaidName, params.plaidCategory, params.plaidBalance]);

  const handleCategorySelect = (cat: LiabilityCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = LIABILITY_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    
    // Check if category supports itemization
    if (isLiabilityCategoryItemizable(cat)) {
      // Check if there are existing items for this category
      const existingItems = liabilities.filter(l => l.category === cat);
      if (existingItems.length > 0) {
        // Show existing items first
        setStep('existing');
      } else {
        // No existing items, show count modal
        setShowCountModal(true);
      }
    } else {
      setStep('details');
    }
  };

  const handleCountConfirm = (selectedCount: number) => {
    setCount(selectedCount);
    setShowCountModal(false);
    setStep('details');
  };

  const handleAddMore = () => {
    // Show count modal to add more items
    setShowCountModal(true);
  };

  const handleMultiItemSave = async (items: any[]) => {
    setLocalError(null);
    try {
      // Create all items sequentially
      const liabilityItems = items as LiabilityItemData[];
      for (const item of liabilityItems) {
        await addLiability({
          category: category!,
          name: item.name,
          balance: item.balance,
          interestRate: item.interestRate,
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to add liabilities:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add liabilities. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!category) return;
    setLocalError(null);

    try {
      const liability = await addLiability({
        category,
        name,
        balance,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
      });
      
      // If this liability was created from a Plaid account, link them
      if (plaidAccountId && liability?.id) {
        try {
          await linkAccount({
            connected_account_id: plaidAccountId,
            entity_id: liability.id,
            entity_type: 'liability',
          });
          console.log('[AddLiability] Linked Plaid account to new liability');
        } catch (linkError: any) {
          console.error('[AddLiability] Failed to link Plaid account:', linkError);
          // Don't fail the whole operation if linking fails
        }
      }
      
      router.back();
    } catch (error: any) {
      console.error('Failed to add liability:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add liability. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const categoryLabel = category ? getLiabilityCategoryLabel(category) : '';
  const defaultName = category ? LIABILITY_CATEGORIES.find((c) => c.value === category)?.label ?? '' : '';
  const existingLiabilities = category ? liabilities.filter(l => l.category === category) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack
            padding={24}
            paddingBottom={16}
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="#e0ddd8"
            minHeight={56}
          >
            <Pressable onPress={() => router.back()} style={{ minWidth: 60 }}>
              <Text fontSize={16} color="#636e72">
                Cancel
              </Text>
            </Pressable>
            <XStack flex={1} justifyContent="center" alignItems="center">
              <Text 
                fontSize={18} 
                fontWeight="700" 
                color="#2d3436"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Add Liability
              </Text>
            </XStack>
            <XStack width={60} />
          </XStack>

          {step === 'method' ? (
            // Method Selection: Plaid vs Manual
            <ScrollView flex={1} padding={24}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={24}>
                  <YStack gap={8}>
                    <Text fontSize={24} fontWeight="700" color="#2d3436">
                      Add Liability
                    </Text>
                    <Text fontSize={16} color="#636e72">
                      Choose how you'd like to add your liability
                    </Text>
                  </YStack>

                  {/* Connect Bank Option */}
                  <Pressable onPress={() => {}}>
                    <Card
                      padding={20}
                      backgroundColor="#fff5f5"
                      borderWidth={2}
                      borderColor="#c75c5c"
                    >
                      <YStack gap={12}>
                        <XStack gap={12} alignItems="center">
                          <Text fontSize={28}>🏦</Text>
                          <YStack flex={1}>
                            <Text fontSize={18} fontWeight="700" color="#c75c5c">
                              Link Financial Accounts
                            </Text>
                            <Text fontSize={14} color="#636e72" marginTop={2}>
                              Auto-sync credit cards, loans & more
                            </Text>
                          </YStack>
                        </XStack>
                        
                        <YStack gap={8} marginTop={8}>
                          <PlaidLinkButton
                            onSuccess={(publicToken: string, metadata: any) => {
                              console.log('[AddLiability] Plaid success, accounts:', metadata.accounts);
                              if (metadata.accounts && metadata.accounts.length > 0) {
                                // Filter to only show liability accounts
                                const liabilityAccounts = metadata.accounts.filter(
                                  (acc: PlaidAccountInfo) => !acc.is_asset
                                );
                                if (liabilityAccounts.length > 0) {
                                  setPlaidAccountsToLink(liabilityAccounts);
                                  setPlaidInstitutionName(metadata.institution?.name);
                                  setShowPlaidAccountsModal(true);
                                } else {
                                  // No liability accounts found, show message
                                  setLocalError('No liability accounts found. The connected accounts may be assets (checking, savings).');
                                }
                              }
                            }}
                            onError={(error) => {
                              console.error('[AddLiability] Plaid error:', error);
                              setLocalError(error?.message || 'Failed to connect bank');
                            }}
                            onExit={() => {
                              console.log('[AddLiability] Plaid exit');
                            }}
                          />
                          
                          {connectedAccounts.length > 0 && (
                            <Text fontSize={12} color="#4a7c59" textAlign="center">
                              ✓ {connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} already connected
                            </Text>
                          )}
                        </YStack>
                      </YStack>
                    </Card>
                  </Pressable>

                  {/* Divider */}
                  <XStack alignItems="center" gap={16}>
                    <YStack flex={1} height={1} backgroundColor="#e0ddd8" />
                    <Text fontSize={14} color="#636e72">or</Text>
                    <YStack flex={1} height={1} backgroundColor="#e0ddd8" />
                  </XStack>

                  {/* Manual Entry Option */}
                  <Pressable onPress={() => setStep('category')}>
                    <Card padding={20}>
                      <XStack gap={12} alignItems="center">
                        <Text fontSize={28}>✍️</Text>
                        <YStack flex={1}>
                          <Text fontSize={18} fontWeight="600" color="#2d3436">
                            Add Manually
                          </Text>
                          <Text fontSize={14} color="#636e72" marginTop={2}>
                            Enter your own values
                          </Text>
                        </YStack>
                        <Text fontSize={20} color="#636e72">→</Text>
                      </XStack>
                    </Card>
                  </Pressable>

                  {/* Error display */}
                  {localError && (
                    <Card variant="warning">
                      <Text fontSize={14} color="#d4a84b" textAlign="center">
                        {localError}
                      </Text>
                    </Card>
                  )}
                </YStack>
              </Animated.View>
            </ScrollView>
          ) : step === 'category' ? (
            <ScrollView flex={1} padding={24}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={16}>
                  {/* Back to method selection */}
                  {!params.plaidAccountId && params.method !== 'manual' && (
                    <Pressable onPress={() => setStep('method')}>
                      <Text fontSize={14} color="#1e3a5f">
                        ← Back
                      </Text>
                    </Pressable>
                  )}
                  
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    What type of liability?
                  </Text>

                  <YStack gap={12}>
                    {LIABILITY_CATEGORIES.map((cat) => (
                      <OptionButton
                        key={cat.value}
                        label={cat.label}
                        selected={category === cat.value}
                        onPress={() => handleCategorySelect(cat.value)}
                        radio
                      />
                    ))}
                  </YStack>
                </YStack>
              </Animated.View>
            </ScrollView>
          ) : step === 'existing' ? (
            // Show existing items
            <ScrollView 
              flex={1} 
              contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <YStack gap={8} marginBottom={24}>
                  <Pressable onPress={() => setStep('category')}>
                    <Text fontSize={14} color="#1e3a5f">
                      ← Change category
                    </Text>
                  </Pressable>
                  <Text fontSize={20} fontWeight="700" color="#2d3436">
                    {categoryLabel}
                  </Text>
                </YStack>
              </Animated.View>

              <ExistingItemsView
                existingLiabilities={existingLiabilities}
                category={category!}
                categoryLabel={categoryLabel}
                isLiability={true}
                onAddMore={handleAddMore}
              />
            </ScrollView>
          ) : step === 'count' ? (
            // This step is handled by CountInputModal
            <YStack flex={1} />
          ) : (
            count > 1 ? (
              // Multi-item form
              <MultiItemForm
                count={count}
                category={category!}
                categoryLabel={categoryLabel}
                defaultName={defaultName}
                isLiability={true}
                onSave={handleMultiItemSave}
                onCancel={() => {
                  if (existingLiabilities.length > 0) {
                    setStep('existing');
                  } else {
                    setStep('category');
                  }
                  setCount(1);
                }}
                isLoading={isLoading}
                existingCount={existingLiabilities.length}
              />
            ) : (
              // Single item form
              <ScrollView 
                flex={1} 
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <YStack gap={8} marginBottom={24}>
                    <Pressable onPress={() => setStep('category')}>
                      <Text fontSize={14} color="#1e3a5f">
                        ← Change category
                      </Text>
                    </Pressable>
                    <Text fontSize={20} fontWeight="700" color="#2d3436">
                      Liability Details
                    </Text>
                  </YStack>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <YStack gap={20} marginBottom={24}>
                    <Input
                      label="Name"
                      placeholder="e.g., Chase Sapphire"
                      value={name}
                      onChangeText={setName}
                    />

                    <CurrencyInput
                      label="Current Balance"
                      value={balance}
                      onChangeValue={setBalance}
                      placeholder="0"
                    />

                    <Input
                      label="Interest Rate (%)"
                      placeholder="e.g., 18.99"
                      value={interestRate}
                      onChangeText={setInterestRate}
                      keyboardType="decimal-pad"
                      helperText="Optional"
                    />
                  </YStack>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <YStack gap={12}>
                    {(localError || error) && (
                      <Card variant="warning">
                        <Text fontSize={14} color="#d4a84b" textAlign="center">
                          {localError || error}
                        </Text>
                      </Card>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      onPress={handleSave}
                      loading={isLoading}
                      disabled={!name || balance <= 0}
                    >
                      Add Liability
                    </Button>
                  </YStack>
                </Animated.View>
              </ScrollView>
            )
          )}
        </YStack>
      </KeyboardAvoidingView>

      {/* Count Input Modal */}
      {category && isLiabilityCategoryItemizable(category) && (
        <CountInputModal
          visible={showCountModal}
          title={(liabilities.filter(l => l.category === category).length > 0)
            ? getLiabilityAdditionalItemizationLabel(category)
            : getLiabilityItemizationLabel(category)}
          subtitle="You'll be able to enter details for each account separately"
          onClose={() => {
            setShowCountModal(false);
            if (existingLiabilities.length > 0) {
              setStep('existing');
            } else {
              setStep('category');
            }
          }}
          onConfirm={handleCountConfirm}
          maxCount={50}
          minCount={1}
        />
      )}

      {/* Plaid Accounts Modal */}
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
          refresh();
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

