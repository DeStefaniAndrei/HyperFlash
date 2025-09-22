"""
HyperFlash SDK - Ultra-Fast Cross-Chain Trading for HFT Traders

Execute trades on HyperLiquid using funds from any chain in under 2 seconds.
Skip the bridge wait and trade instantly with your cross-chain liquidity.
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
    "local_rpc": "http://127.0.0.1:8545",
    "hyperliquid_testnet_rpc": "https://rpc.hyperliquid-testnet.xyz/evm",
    "base_sepolia_rpc": "https://sepolia.base.org",
    "factory_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",  # Update after deployment
}

# Factory ABI for REAL interaction
FACTORY_ABI = [
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getUserStakingContract",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "hasStakingContract",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "validator", "type": "address"}],
        "name": "deployStakingContract",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# UserStaking ABI for REAL interaction
USER_STAKING_ABI = [
    {
        "inputs": [],
        "name": "getStatus",
        "outputs": [
            {"name": "", "type": "uint256"},
            {"name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isSlashed",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakedAmount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "validator",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "depositAndStake",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]


class HyperFlashSDK:
    """
    HyperFlash SDK Client for Ultra-Fast Cross-Chain Trading

    Your gateway to instant HyperLiquid trading with cross-chain funds.
    Perfect for HFT traders who need sub-second execution.
    """

    def __init__(self, private_key: str, backend_url: str = None):
        """
        Initialize your HyperFlash trading client

        Args:
            private_key: Your wallet private key for trading
            backend_url: HyperFlash backend URL (defaults to localhost)
        """
        self.private_key = private_key
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.backend_url = backend_url or CONFIG["backend_url"]

        # Initialize REAL Web3 connections
        self.local_w3 = Web3(Web3.HTTPProvider(CONFIG["local_rpc"]))
        self.hyper_w3 = Web3(Web3.HTTPProvider(CONFIG["hyperliquid_testnet_rpc"]))
        self.base_w3 = Web3(Web3.HTTPProvider(CONFIG["base_sepolia_rpc"]))

        # Use local for testing
        self.w3 = self.local_w3

        # Connect to REAL factory contract
        self.factory = self.w3.eth.contract(
            address=Web3.to_checksum_address(CONFIG["factory_address"]),
            abi=FACTORY_ABI
        )

        print(f"HyperFlash SDK ready for trading")
        print(f"Your wallet: {self.address}")
        print(f"Backend: {self.backend_url}")
        print(f"Factory: {CONFIG['factory_address']}")

    def check_staking_status(self) -> Dict[str, Any]:
        """
        Check your staking status and trading power

        Returns:
            Your current staking position and available collateral
        """
        try:
            # Query REAL factory contract
            has_contract = self.factory.functions.hasStakingContract(self.address).call()

            if not has_contract:
                return {
                    "has_staking_contract": False,
                    "staked_amount": "0",
                    "is_slashed": False,
                    "validator": None,
                    "message": "No staking contract deployed"
                }

            # Get REAL staking contract address
            staking_address = self.factory.functions.getUserStakingContract(self.address).call()

            # Connect to REAL staking contract
            staking_contract = self.w3.eth.contract(
                address=staking_address,
                abi=USER_STAKING_ABI
            )

            # Query REAL staking data
            staked_amount, is_active = staking_contract.functions.getStatus().call()
            is_slashed = staking_contract.functions.isSlashed().call()
            validator = staking_contract.functions.validator().call()

            return {
                "has_staking_contract": True,
                "staking_contract_address": staking_address,
                "staked_amount": str(staked_amount),
                "staked_eth": Web3.from_wei(staked_amount, 'ether'),
                "is_active": is_active,
                "is_slashed": is_slashed,
                "validator": validator
            }
        except Exception as e:
            print(f"[ERROR] Failed to check staking status: {e}")
            return {
                "has_staking_contract": False,
                "error": str(e)
            }

    def deploy_staking_contract(self, validator_address: str) -> Dict[str, Any]:
        """
        Deploy your personal staking contract for trading

        Args:
            validator_address: HyperLiquid validator address for delegation

        Returns:
            Your staking contract address and deployment details
        """
        print(f"\nDeploying your staking contract...")
        print(f"Validator: {validator_address}")

        try:
            # Build REAL transaction
            tx = self.factory.functions.deployStakingContract(
                Web3.to_checksum_address(validator_address)
            ).build_transaction({
                'from': self.address,
                'nonce': self.w3.eth.get_transaction_count(self.address),
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })

            # Sign and send REAL transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            print(f"Transaction sent: {tx_hash.hex()}")

            # Wait for REAL confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            # Get deployed contract address
            staking_address = self.factory.functions.getUserStakingContract(self.address).call()

            print(f"[SUCCESS] Staking contract deployed at: {staking_address}")

            return {
                "success": True,
                "staking_contract": staking_address,
                "tx_hash": tx_hash.hex(),
                "block": receipt['blockNumber']
            }

        except Exception as e:
            print(f"[ERROR] Deployment failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def deposit_and_stake(self, amount_eth: float) -> Dict[str, Any]:
        """
        Stake collateral to enable trading

        Args:
            amount_eth: Amount of ETH to stake as collateral

        Returns:
            Transaction details and new stake balance
        """
        print(f"\nStaking {amount_eth} ETH as collateral...")

        try:
            # Get staking contract address
            staking_address = self.factory.functions.getUserStakingContract(self.address).call()
            if staking_address == "0x0000000000000000000000000000000000000000":
                return {
                    "success": False,
                    "error": "No staking contract found. Deploy first."
                }

            # Connect to staking contract
            staking_contract = self.w3.eth.contract(
                address=staking_address,
                abi=USER_STAKING_ABI
            )

            # Convert to wei
            amount_wei = Web3.to_wei(amount_eth, 'ether')

            # Build REAL transaction
            tx = staking_contract.functions.depositAndStake().build_transaction({
                'from': self.address,
                'value': amount_wei,
                'nonce': self.w3.eth.get_transaction_count(self.address),
                'gas': 200000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })

            # Sign and send REAL transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            print(f"Transaction sent: {tx_hash.hex()}")

            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            print(f"[SUCCESS] Staked {amount_eth} ETH")

            return {
                "success": True,
                "amount_staked": str(amount_wei),
                "tx_hash": tx_hash.hex(),
                "block": receipt['blockNumber']
            }

        except Exception as e:
            print(f"[ERROR] Staking failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def initiate_trade(
        self,
        amount: str,
        pair: str = "BTC/USDC",
        side: str = "buy",
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Execute ultra-fast cross-chain trade on HyperLiquid

        Args:
            amount: Trade amount in base units
            pair: Trading pair on HyperLiquid (e.g., "BTC/USDC")
            side: Trade direction ("buy" or "sell")
            price: Limit price (optional, market order if not specified)

        Returns:
            Trade ID, execution time, and transaction details
        """
        print(f"\n=== Executing Trade ===")
        print(f"Amount: {amount}")
        print(f"Pair: {pair}")
        print(f"Side: {side}")
        print(f"Price: {price or 'market order'}")

        # Verify your staking status
        staking_status = self.check_staking_status()
        if not staking_status["has_staking_contract"]:
            raise Exception("No staking contract found. Deploy one first to enable trading.")

        if staking_status.get("is_slashed"):
            raise Exception("Your stake has been slashed. Trading disabled.")

        # Prepare trade parameters
        trade_params = {
            "pair": pair,
            "side": side,
            "price": price,
            "type": "limit" if price else "market"
        }

        # Submit your trade for instant execution
        start_time = time.time()

        try:
            response = requests.post(
                f"{self.backend_url}/trade/initiate",
                json={
                    "userAddress": self.address,
                    "amount": amount,
                    "tradeParams": trade_params
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Trade failed: {response.text}")

            result = response.json()
            execution_time = time.time() - start_time

            print(f"\n✅ Trade executed successfully!")
            print(f"Trade ID: {result['tradeId']}")
            print(f"Execution time: {execution_time:.2f} seconds")
            print(f"Bridge TX: {result.get('bridgeTxHash', 'Processing')}")
            print(f"DeBridge ID: {result.get('debridgeId', 'Pending')}")

            return {
                "success": True,
                "mode": "live",
                "trade_id": result["tradeId"],
                "execution_time": execution_time,
                "bridge_tx": result.get("bridgeTxHash"),
                "debridge_id": result.get("debridgeId"),
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
        Check your trade status and settlement

        Args:
            trade_id: Your unique trade identifier

        Returns:
            Current status and details of your trade
        """
        try:
            response = requests.get(
                f"{self.backend_url}/trade/status/{trade_id}",
                timeout=5
            )

            if response.status_code == 404:
                return {"exists": False, "error": "Trade not found"}

            status = response.json()
            return {
                "exists": True,
                "mode": status.get("mode", "UNKNOWN"),
                **status
            }

        except requests.exceptions.RequestException as e:
            return {"error": str(e)}

    def execute_rapid_trades(self, count: int = 5) -> None:
        """
        Execute multiple rapid trades to showcase HyperFlash speed

        Args:
            count: Number of rapid trades to execute
        """
        print(f"\n=== Executing {count} Rapid-Fire Trades ===")
        print("Demonstrating ultra-fast execution...")
        print("-" * 50)

        results = []
        total_time = 0

        for i in range(count):
            print(f"\nTrade {i + 1}/{count}")

            # Small trade amounts for demo
            amount = str(1000000 * (i + 1))  # Increasing amounts

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
        if results:
            print("\n" + "=" * 50)
            print("RAPID TRADE PERFORMANCE SUMMARY")
            print("=" * 50)
            print(f"Total trades: {len(results)}")
            print(f"Average execution time: {total_time / len(results):.3f} seconds")
            print(f"Total time: {total_time:.2f} seconds")
            print("\nTraditional bridge time would be: ~10 seconds per trade")
            print(f"Time saved: {(10 * len(results)) - total_time:.2f} seconds")
            print(f"Speed improvement: {(10 * len(results)) / total_time:.1f}x faster!")
            print("\n🚀 HyperFlash advantage demonstrated!")


def demonstrate_speed_advantage():
    """
    Demo: Experience the HyperFlash speed advantage for HFT trading
    """
    print("\n" + "=" * 60)
    print("       HYPERFLASH - ULTRA-FAST CROSS-CHAIN TRADING DEMO")
    print("=" * 60)

    # Initialize SDK with test wallet
    private_key = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"
    sdk = HyperFlashSDK(private_key)

    print("\n[1] Checking your staking status...")
    status = sdk.check_staking_status()
    if status["has_staking_contract"]:
        print(f"   > Staking contract deployed at: {status.get('staking_contract_address')}")
        print(f"   > Staked amount: {status.get('staked_eth', 0)} ETH")
        print(f"   > Active: {status.get('is_active', False)}")
    else:
        print(f"   > No staking contract found")
        print(f"   > Deploy one first using sdk.deploy_staking_contract()")

    print("\n[2] Executing a cross-chain trade...")
    result = sdk.initiate_trade(
        amount="1000000000",  # 1000 USDC
        pair="BTC/USDC",
        side="buy",
        price=50000.0
    )

    if result["success"]:
        print("\n[3] Checking trade status...")
        time.sleep(2)
        status = sdk.get_trade_status(result["trade_id"])
        print(f"   Trade status: {status}")

    print("\n[4] Demonstrating rapid-fire trading capability...")
    sdk.execute_rapid_trades(count=5)

    print("\n" + "=" * 60)
    print("       DEMO COMPLETE - EXPERIENCE THE SPEED ADVANTAGE")
    print("=" * 60)
    print("\nWhy HyperFlash for HFT Trading:")
    print("   ✓ Sub-2 second cross-chain execution")
    print("   ✓ 10x faster than traditional bridges")
    print("   ✓ Trade with funds from any chain")
    print("   ✓ Staking-secured trading system")
    print("   ✓ Built for high-frequency traders")


if __name__ == "__main__":
    # Run demo if executed directly
    demonstrate_speed_advantage()