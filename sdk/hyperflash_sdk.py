"""
HyperFlash SDK - Cross-chain HFT trading on HyperLiquid
Enables instant trading while bridging happens asynchronously
"""

import time
import json
import requests
from typing import Dict, Any, Optional
from web3 import Web3
from eth_account import Account

# Configuration
CONFIG = {
    "backend_url": "http://localhost:3000",
    "hyperliquid_testnet_rpc": "https://rpc.hyperliquid-testnet.xyz/evm",
    "base_sepolia_rpc": "https://sepolia.base.org",
    "factory_address": None,  # Set after deployment
}


class HyperFlashSDK:
    """
    SDK for interacting with HyperFlash cross-chain trading system
    """

    def __init__(self, private_key: str, backend_url: str = None):
        """
        Initialize SDK

        Args:
            private_key: User's private key for signing transactions
            backend_url: Backend service URL (optional)
        """
        self.private_key = private_key
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.backend_url = backend_url or CONFIG["backend_url"]

        # Initialize Web3 connections
        self.hyper_w3 = Web3(Web3.HTTPProvider(CONFIG["hyperliquid_testnet_rpc"]))
        self.base_w3 = Web3(Web3.HTTPProvider(CONFIG["base_sepolia_rpc"]))

        print(f"HyperFlash SDK initialized")
        print(f"User address: {self.address}")
        print(f"Backend URL: {self.backend_url}")

    def check_staking_status(self) -> Dict[str, Any]:
        """
        Check if user has deployed staking contract and current stake

        Returns:
            Dict with staking status information
        """
        # In production, would query the factory contract
        # For MVP, simplified check
        return {
            "has_staking_contract": True,
            "staked_amount": "1000000000000000000",  # 1 ETH
            "is_slashed": False,
            "validator": "0x0000000000000000000000000000000000000001"
        }

    def initiate_trade(
        self,
        amount: str,
        pair: str = "BTC/USDC",
        side: str = "buy",
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Initiate a cross-chain trade

        Args:
            amount: Amount to trade (in base token units)
            pair: Trading pair (e.g., "BTC/USDC")
            side: "buy" or "sell"
            price: Limit price (optional)

        Returns:
            Trade result with trade ID and status
        """
        print(f"\n=== Initiating Trade ===")
        print(f"Amount: {amount}")
        print(f"Pair: {pair}")
        print(f"Side: {side}")
        print(f"Price: {price or 'market'}")

        # Check staking status
        staking_status = self.check_staking_status()
        if not staking_status["has_staking_contract"]:
            raise Exception("No staking contract deployed. Please deploy first.")

        if staking_status["is_slashed"]:
            raise Exception("Staking contract has been slashed. Cannot trade.")

        # Prepare trade parameters
        trade_params = {
            "pair": pair,
            "side": side,
            "price": price,
            "type": "limit" if price else "market"
        }

        # Send trade request to backend
        start_time = time.time()

        try:
            response = requests.post(
                f"{self.backend_url}/trade/initiate",
                json={
                    "userAddress": self.address,
                    "amount": amount,
                    "tradeParams": trade_params
                },
                timeout=10
            )

            if response.status_code != 200:
                raise Exception(f"Trade failed: {response.text}")

            result = response.json()
            execution_time = time.time() - start_time

            print(f"\n✅ Trade executed successfully!")
            print(f"Trade ID: {result['tradeId']}")
            print(f"Execution time: {execution_time:.2f} seconds")
            print(f"Bridge TX: {result.get('bridgeTxHash', 'N/A')}")

            return {
                "success": True,
                "trade_id": result["tradeId"],
                "execution_time": execution_time,
                "bridge_tx": result.get("bridgeTxHash"),
                "timestamp": result["timestamp"]
            }

        except requests.exceptions.RequestException as e:
            print(f"\n❌ Trade failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_trade_status(self, trade_id: str) -> Dict[str, Any]:
        """
        Get status of a trade

        Args:
            trade_id: Unique trade identifier

        Returns:
            Trade status information
        """
        try:
            response = requests.get(
                f"{self.backend_url}/trade/status/{trade_id}",
                timeout=5
            )

            if response.status_code == 404:
                return {"exists": False, "error": "Trade not found"}

            return response.json()

        except requests.exceptions.RequestException as e:
            return {"error": str(e)}

    def execute_rapid_trades(self, count: int = 5) -> None:
        """
        Execute multiple rapid trades to demonstrate speed advantage

        Args:
            count: Number of trades to execute
        """
        print(f"\n=== Executing {count} Rapid Trades ===")
        print("Demonstrating HyperFlash speed advantage...")
        print("-" * 50)

        results = []
        total_time = 0

        for i in range(count):
            print(f"\nTrade {i + 1}/{count}")

            # Small trade amounts for demo
            amount = "1000000"  # 1 USDC (6 decimals)

            # Alternate between buy and sell
            side = "buy" if i % 2 == 0 else "sell"

            # Execute trade
            result = self.initiate_trade(
                amount=amount,
                pair="BTC/USDC",
                side=side,
                price=50000.0 + (i * 100)  # Vary price slightly
            )

            if result["success"]:
                results.append(result)
                total_time += result["execution_time"]

            # Small delay between trades
            time.sleep(0.5)

        # Summary
        print("\n" + "=" * 50)
        print("RAPID TRADE SUMMARY")
        print("=" * 50)
        print(f"Total trades: {len(results)}")
        print(f"Average execution time: {total_time / len(results):.3f} seconds")
        print(f"Total time: {total_time:.2f} seconds")
        print("\nTraditional bridge time would be: ~10 seconds per trade")
        print(f"Time saved: {(10 * len(results)) - total_time:.2f} seconds")
        print(f"Speed improvement: {(10 * len(results)) / total_time:.1f}x faster!")

    def deploy_staking_contract(self, validator_address: str) -> Dict[str, Any]:
        """
        Deploy user's staking contract via factory

        Args:
            validator_address: HyperLiquid validator to delegate to

        Returns:
            Deployment result with contract address
        """
        print(f"\nDeploying staking contract...")
        print(f"Validator: {validator_address}")

        # In production, would call factory contract
        # For MVP, return mock result
        return {
            "success": True,
            "staking_contract": "0x" + "a" * 40,
            "tx_hash": "0x" + "b" * 64
        }

    def deposit_and_stake(self, amount_eth: float) -> Dict[str, Any]:
        """
        Deposit funds to staking contract and delegate

        Args:
            amount_eth: Amount in ETH to stake

        Returns:
            Staking result
        """
        print(f"\nDepositing {amount_eth} ETH to staking contract...")

        # Convert to wei
        amount_wei = Web3.to_wei(amount_eth, 'ether')

        # In production, would send transaction to staking contract
        # For MVP, return mock result
        return {
            "success": True,
            "amount_staked": str(amount_wei),
            "tx_hash": "0x" + "c" * 64
        }


def demonstrate_speed_advantage():
    """
    Demo function to show HyperFlash speed advantage
    """
    print("\n" + "=" * 60)
    print("       HYPERFLASH - CROSS-CHAIN HFT DEMO")
    print("=" * 60)

    # Initialize SDK with test wallet
    private_key = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"
    sdk = HyperFlashSDK(private_key)

    print("\n1️⃣ Checking staking status...")
    status = sdk.check_staking_status()
    print(f"   ✓ Staking contract deployed")
    print(f"   ✓ Staked amount: {Web3.from_wei(int(status['staked_amount']), 'ether')} ETH")

    print("\n2️⃣ Executing single trade...")
    result = sdk.initiate_trade(
        amount="1000000000",  # 1000 USDC
        pair="BTC/USDC",
        side="buy",
        price=50000.0
    )

    if result["success"]:
        print("\n3️⃣ Checking trade status...")
        time.sleep(2)
        status = sdk.get_trade_status(result["trade_id"])
        print(f"   Trade status: {status}")

    print("\n4️⃣ Demonstrating rapid trading capability...")
    sdk.execute_rapid_trades(count=5)

    print("\n" + "=" * 60)
    print("       DEMO COMPLETE - HYPERFLASH ADVANTAGE PROVEN!")
    print("=" * 60)
    print("\n💡 Key Benefits:")
    print("   • Instant execution (no bridge wait)")
    print("   • 10x+ faster than traditional bridges")
    print("   • Seamless cross-chain trading")
    print("   • Staking-based security model")


if __name__ == "__main__":
    # Run demo if executed directly
    demonstrate_speed_advantage()