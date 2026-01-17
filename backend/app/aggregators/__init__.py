"""
Aggregators Module

Provides an abstraction layer for multiple financial data aggregators
(Plaid, Finicity, Yodlee, MX, etc.) allowing the application to work
with any provider through a unified interface.
"""

from app.aggregators.base import (
    AggregatorType,
    AggregatorProvider,
    AccountInfo,
    TransactionInfo,
    HoldingInfo,
    SecurityInfo,
    LinkTokenResult,
    ExchangeTokenResult,
    TransactionSyncResult,
)
from app.aggregators.factory import AggregatorFactory

__all__ = [
    'AggregatorType',
    'AggregatorProvider',
    'AccountInfo',
    'TransactionInfo',
    'HoldingInfo',
    'SecurityInfo',
    'LinkTokenResult',
    'ExchangeTokenResult',
    'TransactionSyncResult',
    'AggregatorFactory',
]
