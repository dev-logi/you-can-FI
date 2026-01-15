/**
 * Add Asset Screen
 * 
 * Modal for adding a new asset.
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
import { AssetCategory } from '../../src/shared/types';
import { ASSET_CATEGORY_CONFIG, getAssetCategoryLabel } from '../../src/features/netWorth/service';
import { isAssetCategoryItemizable, getAssetItemizationLabel, getAssetAdditionalItemizationLabel } from '../../src/shared/utils/itemization';
import type { PlaidAccountInfo } from '../../src/api/services/plaidService';

const ASSET_CATEGORIES: Array<{ value: AssetCategory; label: string }> = [
  { value: 'cash', label: 'Cash & Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'retirement_401k', label: '401(k) / 403(b)' },
  { value: 'retirement_ira', label: 'Traditional IRA' },
  { value: 'retirement_roth', label: 'Roth IRA' },
  { value: 'retirement_hsa', label: 'HSA' },
  { value: 'retirement_pension', label: 'Pension' },
  { value: 'retirement_other', label: 'Other Retirement' },
  { value: 'brokerage', label: 'Brokerage / Investments' },
  { value: 'real_estate_primary', label: 'Primary Residence' },
  { value: 'real_estate_rental', label: 'Rental Property' },
  { value: 'real_estate_land', label: 'Land' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'business', label: 'Business' },
  { value: 'valuables', label: 'Valuables' },
  { value: 'other', label: 'Other' },
];

export default function AddAssetScreen() {
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
  const { addAsset, isLoading, error, assets, refresh } = useNetWorthStore();
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
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [count, setCount] = useState(1);
  const [showCountModal, setShowCountModal] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
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
        const balance = parseFloat(params.plaidBalance);
        if (!isNaN(balance)) {
          setValue(Math.abs(balance)); // Use absolute value for assets
        }
      }
      
      // Pre-select category if provided
      if (params.plaidCategory) {
        const matchingCategory = ASSET_CATEGORIES.find(
          c => c.value === params.plaidCategory
        );
        if (matchingCategory) {
          setCategory(matchingCategory.value);
          setStep('details'); // Skip to details since we have category
        }
      }
    }
  }, [params.plaidAccountId, params.plaidName, params.plaidCategory, params.plaidBalance]);

  const handleCategorySelect = (cat: AssetCategory) => {
    setCategory(cat);
    // Pre-fill name with category label
    const categoryConfig = ASSET_CATEGORIES.find((c) => c.value === cat);
    setName(categoryConfig?.label ?? '');
    
    // Check if category supports itemization
    if (isAssetCategoryItemizable(cat)) {
      // Check if there are existing items for this category
      const existingItems = assets.filter(a => a.category === cat);
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
      const assetItems = items as Array<{ name: string; value: number }>;
      for (const item of assetItems) {
        await addAsset({
          category: category!,
          name: item.name,
          value: item.value,
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to add assets:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add assets. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!category) return;
    setLocalError(null);

    try {
      const asset = await addAsset({
        category,
        name,
        value,
      });
      
      // If this asset was created from a Plaid account, link them
      if (plaidAccountId && asset?.id) {
        try {
          await linkAccount({
            connected_account_id: plaidAccountId,
            entity_id: asset.id,
            entity_type: 'asset',
          });
          console.log('[AddAsset] Linked Plaid account to new asset');
        } catch (linkError: any) {
          console.error('[AddAsset] Failed to link Plaid account:', linkError);
          // Don't fail the whole operation if linking fails
        }
      }
      
      router.back();
    } catch (error: any) {
      console.error('Failed to add asset:', error);
      const errorMessage = error?.detail || error?.message || 'Failed to add asset. Please try again.';
      setLocalError(errorMessage);
    }
  };

  const categoryLabel = category ? getAssetCategoryLabel(category) : '';
  const defaultName = category ? ASSET_CATEGORIES.find((c) => c.value === category)?.label ?? '' : '';
  const existingAssets = category ? assets.filter(a => a.category === category) : [];

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
                Add Asset
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
                      Add Asset
                    </Text>
                    <Text fontSize={16} color="#636e72">
                      Choose how you'd like to add your asset
                    </Text>
                  </YStack>

                  {/* Connect Bank Option */}
                  <Pressable onPress={() => {}}>
                    <Card
                      padding={20}
                      backgroundColor="#f0f7ff"
                      borderWidth={2}
                      borderColor="#1e3a5f"
                    >
                      <YStack gap={12}>
                        <XStack gap={12} alignItems="center">
                          <Text fontSize={28}>🏦</Text>
                          <YStack flex={1}>
                            <Text fontSize={18} fontWeight="700" color="#1e3a5f">
                              Link Financial Accounts
                            </Text>
                            <Text fontSize={14} color="#636e72" marginTop={2}>
                              Auto-sync checking, savings, investments & more
                            </Text>
                          </YStack>
                        </XStack>
                        
                        <YStack gap={8} marginTop={8}>
                          <PlaidLinkButton
                            onSuccess={(publicToken: string, metadata: any) => {
                              console.log('[AddAsset] Plaid success, accounts:', metadata.accounts);
                              if (metadata.accounts && metadata.accounts.length > 0) {
                                // Filter to only show asset accounts
                                const assetAccounts = metadata.accounts.filter(
                                  (acc: PlaidAccountInfo) => acc.is_asset
                                );
                                if (assetAccounts.length > 0) {
                                  setPlaidAccountsToLink(assetAccounts);
                                  setPlaidInstitutionName(metadata.institution?.name);
                                  setShowPlaidAccountsModal(true);
                                } else {
                                  // No asset accounts found, show message
                                  setLocalError('No asset accounts found. The connected accounts may be liabilities (credit cards, loans).');
                                }
                              }
                            }}
                            onError={(error) => {
                              console.error('[AddAsset] Plaid error:', error);
                              setLocalError(error?.message || 'Failed to connect bank');
                            }}
                            onExit={() => {
                              console.log('[AddAsset] Plaid exit');
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
                    What type of asset?
                  </Text>

                  <YStack gap={12}>
                    {ASSET_CATEGORIES.map((cat) => (
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
                existingAssets={existingAssets}
                category={category!}
                categoryLabel={categoryLabel}
                isLiability={false}
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
                isLiability={false}
                onSave={handleMultiItemSave}
                onCancel={() => {
                  if (existingAssets.length > 0) {
                    setStep('existing');
                  } else {
                    setStep('category');
                  }
                  setCount(1);
                }}
                isLoading={isLoading}
                existingCount={existingAssets.length}
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
                      Asset Details
                    </Text>
                  </YStack>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <YStack gap={20} marginBottom={24}>
                    <Input
                      label="Name"
                      placeholder="e.g., Chase Checking"
                      value={name}
                      onChangeText={setName}
                    />

                    <CurrencyInput
                      label="Current Value"
                      value={value}
                      onChangeValue={setValue}
                      placeholder="0"
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
                      disabled={!name || value <= 0}
                    >
                      Add Asset
                    </Button>
                  </YStack>
                </Animated.View>
              </ScrollView>
            )
          )}
        </YStack>
      </KeyboardAvoidingView>

      {/* Count Input Modal */}
      {category && isAssetCategoryItemizable(category) && (
        <CountInputModal
          visible={showCountModal}
          title={(assets.filter(a => a.category === category).length > 0)
            ? getAssetAdditionalItemizationLabel(category)
            : getAssetItemizationLabel(category)}
          subtitle="You'll be able to enter details for each account separately"
          onClose={() => {
            setShowCountModal(false);
            if (existingAssets.length > 0) {
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

