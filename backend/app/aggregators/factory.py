"""
Aggregator Factory

Factory for creating and managing aggregator provider instances.
Provides routing logic to select the best provider for a given institution.
"""

from typing import Dict, Optional, Set

from app.aggregators.base import AggregatorType, AggregatorProvider


class AggregatorFactory:
    """
    Factory for creating aggregator provider instances.
    
    Uses a singleton pattern to cache provider instances.
    Provides institution routing logic to select the best provider.
    
    Usage:
        # Get a specific provider
        plaid = AggregatorFactory.get_provider(AggregatorType.PLAID)
        
        # Get the best provider for an institution
        provider = AggregatorFactory.get_provider_for_institution("Fidelity")
    """
    
    _providers: Dict[AggregatorType, AggregatorProvider] = {}
    
    # Institutions that require Finicity (Plaid has limited/no support)
    FINICITY_INSTITUTIONS: Set[str] = {
        'Fidelity',
        'Fidelity Investments',
        'Fidelity NetBenefits',
        'Fidelity 401k',
    }
    
    # Institutions that require MX
    MX_INSTITUTIONS: Set[str] = {
        'USAA',
    }
    
    # Institutions that require Yodlee
    YODLEE_INSTITUTIONS: Set[str] = set()
    
    @classmethod
    def get_provider(cls, provider_type: AggregatorType) -> AggregatorProvider:
        """
        Get or create a provider instance.
        
        Args:
            provider_type: The type of aggregator to get
            
        Returns:
            AggregatorProvider instance
            
        Raises:
            ValueError: If provider type is not implemented
        """
        if provider_type not in cls._providers:
            if provider_type == AggregatorType.PLAID:
                from app.aggregators.plaid_provider import PlaidProvider
                cls._providers[provider_type] = PlaidProvider()
            elif provider_type == AggregatorType.FINICITY:
                # TODO: Implement FinicityProvider
                raise ValueError(
                    f"Provider {provider_type.value} is not yet implemented. "
                    "Coming soon!"
                )
            elif provider_type == AggregatorType.YODLEE:
                # TODO: Implement YodleeProvider
                raise ValueError(
                    f"Provider {provider_type.value} is not yet implemented. "
                    "Coming soon!"
                )
            elif provider_type == AggregatorType.MX:
                # TODO: Implement MXProvider
                raise ValueError(
                    f"Provider {provider_type.value} is not yet implemented. "
                    "Coming soon!"
                )
            elif provider_type == AggregatorType.AKOYA:
                # TODO: Implement AkoyaProvider
                raise ValueError(
                    f"Provider {provider_type.value} is not yet implemented. "
                    "Coming soon!"
                )
            else:
                raise ValueError(f"Unknown provider type: {provider_type}")
        
        return cls._providers[provider_type]
    
    @classmethod
    def get_provider_for_institution(
        cls, 
        institution_name: str,
        institution_id: Optional[str] = None
    ) -> AggregatorProvider:
        """
        Get the best provider for a given institution.
        
        Logic:
        1. Check if institution requires a specific provider
        2. Fall back to default (Plaid)
        
        Args:
            institution_name: Human-readable institution name
            institution_id: Optional provider-specific institution ID
            
        Returns:
            AggregatorProvider that supports the institution
        """
        # Normalize institution name for comparison
        normalized_name = institution_name.strip()
        
        # Check Finicity-only institutions
        if normalized_name in cls.FINICITY_INSTITUTIONS:
            try:
                return cls.get_provider(AggregatorType.FINICITY)
            except ValueError:
                # Finicity not implemented yet, fall back to Plaid
                print(f"[AggregatorFactory] Finicity not available for {normalized_name}, using Plaid")
        
        # Check MX-only institutions
        if normalized_name in cls.MX_INSTITUTIONS:
            try:
                return cls.get_provider(AggregatorType.MX)
            except ValueError:
                # MX not implemented yet, fall back to Plaid
                print(f"[AggregatorFactory] MX not available for {normalized_name}, using Plaid")
        
        # Check Yodlee-only institutions
        if normalized_name in cls.YODLEE_INSTITUTIONS:
            try:
                return cls.get_provider(AggregatorType.YODLEE)
            except ValueError:
                # Yodlee not implemented yet, fall back to Plaid
                print(f"[AggregatorFactory] Yodlee not available for {normalized_name}, using Plaid")
        
        # Default to Plaid
        return cls.get_provider(AggregatorType.PLAID)
    
    @classmethod
    def get_default_provider(cls) -> AggregatorProvider:
        """
        Get the default provider (Plaid).
        
        Returns:
            The default AggregatorProvider (Plaid)
        """
        return cls.get_provider(AggregatorType.PLAID)
    
    @classmethod
    def get_available_providers(cls) -> list[AggregatorType]:
        """
        Get list of available (implemented) provider types.
        
        Returns:
            List of AggregatorType that are currently available
        """
        available = []
        for provider_type in AggregatorType:
            try:
                cls.get_provider(provider_type)
                available.append(provider_type)
            except ValueError:
                pass
        return available
    
    @classmethod
    def clear_cache(cls) -> None:
        """Clear the provider cache (useful for testing)."""
        cls._providers.clear()
