"""
HyperLiquid Trade Executor

This module handles the actual execution of trades on HyperLiquid.
It uses the vault/subaccount model where:
- Master account (backend) signs transactions
- Shared EOA (vault) executes trades
"""

from hyperliquid.exchange import Exchange
from hyperliquid.info import Info
from hyperliquid.utils import constants
import time
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TradeExecutor:
    """
    Executes trades on HyperLiquid using the shared EOA as a vault.

    The shared EOA acts as a vault/subaccount that:
    - Holds pre-funded liquidity (USDC, HYPE)
    - Executes trades immediately without waiting for bridge
    - Settles back to users after trades complete
    """

    def __init__(self, network: str = 'mainnet'):
        """
        Initialize the trade executor.

        Args:
            network: 'mainnet' or 'testnet'
        """
        # Get keys from environment
        self.master_private_key = os.getenv('MASTER_PRIVATE_KEY')
        self.shared_eoa_address = os.getenv('SHARED_EOA_ADDRESS')

        if not self.master_private_key or not self.shared_eoa_address:
            raise ValueError("Missing MASTER_PRIVATE_KEY or SHARED_EOA_ADDRESS in .env")

        # Set up network
        if network == 'mainnet':
            base_url = constants.MAINNET_API_URL
        else:
            base_url = constants.TESTNET_API_URL

        # Initialize Exchange with vault address
        # Master account signs, shared EOA executes
        self.exchange = Exchange(
            wallet=self.master_private_key,  # Master signs
            base_url=base_url,
            vault_address=self.shared_eoa_address  # Shared EOA executes
        )

        # Initialize Info for market data
        self.info = Info(base_url=base_url)

        print(f"[OK] Trade executor initialized")
        print(f"    Network: {network}")
        print(f"    Vault (Shared EOA): {self.shared_eoa_address}")

    def execute_trade(
        self,
        trade_id: str,
        pair: str,
        side: str,
        amount: float,
        price: Optional[float] = None,
        trade_type: str = 'market'
    ) -> Dict[str, Any]:
        """
        Execute a trade on HyperLiquid.

        Args:
            trade_id: Unique identifier for this trade
            pair: Trading pair (e.g., "BTC/USDC")
            side: "buy" or "sell"
            amount: Amount to trade
            price: Limit price (optional)
            trade_type: "market" or "limit"

        Returns:
            Trade execution result
        """
        print(f"\n[TRADE] Executing trade {trade_id}")
        print(f"    Pair: {pair}")
        print(f"    Side: {side}")
        print(f"    Amount: {amount}")
        print(f"    Type: {trade_type}")

        start_time = time.time()

        try:
            # Parse the trading pair
            # HyperLiquid uses coin symbol only (e.g., "BTC" not "BTC/USDC")
            coin = pair.split('/')[0]

            # Determine order type
            if trade_type == 'market':
                # Market order
                order_type = {"market": {}}
                limit_px = None
            else:
                # Limit order
                if not price:
                    raise ValueError("Limit order requires price")
                order_type = {"limit": {"tif": "Gtc"}}  # Good till cancelled
                limit_px = price

            # Execute the trade
            # The SDK handles vault_address internally
            result = self.exchange.order(
                coin=coin,
                is_buy=(side.lower() == 'buy'),
                sz=amount,
                limit_px=limit_px,
                order_type=order_type,
                cloid=trade_id  # Client order ID for tracking
            )

            execution_time = (time.time() - start_time) * 1000  # Convert to ms

            if result and 'status' in result:
                if result['status'] == 'ok':
                    print(f"[OK] Trade executed successfully in {execution_time:.0f}ms")
                    print(f"    Order ID: {result.get('response', {}).get('oid')}")

                    return {
                        'success': True,
                        'trade_id': trade_id,
                        'order_id': result.get('response', {}).get('oid'),
                        'execution_time': execution_time,
                        'raw_response': result
                    }
                else:
                    print(f"[ERROR] Trade failed: {result}")
                    return {
                        'success': False,
                        'trade_id': trade_id,
                        'error': result.get('response', 'Unknown error'),
                        'execution_time': execution_time
                    }
            else:
                print(f"[ERROR] Unexpected response: {result}")
                return {
                    'success': False,
                    'trade_id': trade_id,
                    'error': 'Invalid response from exchange',
                    'execution_time': execution_time
                }

        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            print(f"[ERROR] Trade execution failed: {e}")
            return {
                'success': False,
                'trade_id': trade_id,
                'error': str(e),
                'execution_time': execution_time
            }

    def get_vault_balance(self) -> Dict[str, Any]:
        """
        Get the current balance of the shared EOA (vault).

        Returns:
            Balance information for the vault
        """
        try:
            # Get account state for the vault
            user_state = self.info.user_state(self.shared_eoa_address)

            if user_state and 'balances' in user_state:
                balances = user_state['balances']
                print(f"[INFO] Vault balances:")
                for balance in balances:
                    print(f"    {balance['coin']}: {balance['total']}")

                return {
                    'success': True,
                    'balances': balances,
                    'address': self.shared_eoa_address
                }
            else:
                return {
                    'success': False,
                    'error': 'Could not fetch vault balance'
                }

        except Exception as e:
            print(f"[ERROR] Failed to get vault balance: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_order_status(self, trade_id: str) -> Dict[str, Any]:
        """
        Get the status of a specific order by client order ID.

        Args:
            trade_id: The client order ID (trade_id)

        Returns:
            Order status information
        """
        try:
            # Get open orders for the vault
            open_orders = self.exchange.get_open_orders()

            # Find order by cloid
            for order in open_orders:
                if order.get('cloid') == trade_id:
                    return {
                        'success': True,
                        'trade_id': trade_id,
                        'status': 'open',
                        'order': order
                    }

            # If not in open orders, check fills
            fills = self.info.user_fills(self.shared_eoa_address)
            for fill in fills:
                if fill.get('cloid') == trade_id:
                    return {
                        'success': True,
                        'trade_id': trade_id,
                        'status': 'filled',
                        'fill': fill
                    }

            return {
                'success': True,
                'trade_id': trade_id,
                'status': 'not_found'
            }

        except Exception as e:
            print(f"[ERROR] Failed to get order status: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def cancel_order(self, trade_id: str, coin: str) -> Dict[str, Any]:
        """
        Cancel an open order.

        Args:
            trade_id: The client order ID
            coin: The coin symbol (e.g., "BTC")

        Returns:
            Cancellation result
        """
        try:
            result = self.exchange.cancel(
                coin=coin,
                cloid=trade_id
            )

            if result and result.get('status') == 'ok':
                print(f"[OK] Order {trade_id} cancelled successfully")
                return {
                    'success': True,
                    'trade_id': trade_id,
                    'result': result
                }
            else:
                print(f"[ERROR] Failed to cancel order: {result}")
                return {
                    'success': False,
                    'trade_id': trade_id,
                    'error': result
                }

        except Exception as e:
            print(f"[ERROR] Failed to cancel order: {e}")
            return {
                'success': False,
                'trade_id': trade_id,
                'error': str(e)
            }


# Test function
if __name__ == "__main__":
    # Test the trade executor
    print("Testing HyperLiquid Trade Executor...")

    # Initialize executor (testnet for testing)
    executor = TradeExecutor(network='testnet')

    # Check vault balance
    print("\n1. Checking vault balance...")
    balance = executor.get_vault_balance()

    # Execute a test trade (small market order)
    print("\n2. Executing test trade...")
    test_trade = executor.execute_trade(
        trade_id=f"test_{int(time.time())}",
        pair="BTC/USDC",
        side="buy",
        amount=0.0001,  # Very small amount for testing
        trade_type="market"
    )

    if test_trade['success']:
        print(f"Test trade successful! Execution time: {test_trade['execution_time']}ms")
    else:
        print(f"Test trade failed: {test_trade.get('error')}")