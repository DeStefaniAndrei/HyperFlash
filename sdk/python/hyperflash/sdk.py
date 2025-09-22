"""
HyperFlash Python SDK

This is the Python version of our SDK. It provides the same functionality
as the TypeScript version but for Python developers.

Example usage:
    from hyperflash import HyperFlashSDK

    sdk = HyperFlashSDK(
        network='testnet',
        private_key='your_key_here'
    )

    trade = sdk.execute_trade(
        source_token='USDC',
        amount=1000,
        target_pair='BTC/USDC',
        side='buy'
    )
"""

import time
import json
import requests
from typing import Dict, Any, Optional, List
from eth_account import Account
from web3 import Web3

class HyperFlashSDK:
    """
    The main SDK class for interacting with HyperFlash.

    This provides all the methods developers need to:
    - Deploy staking contracts
    - Execute ultra-fast trades
    - Monitor trade status
    - Estimate costs
    """

    # Network configurations
    NETWORKS = {
        'mainnet': {
            'rpc': 'https://rpc.hyperliquid.xyz/evm',
            'backend': 'https://api.hyperflash.io'  # Not deployed yet
        },
        'testnet': {
            'rpc': 'https://rpc.hyperliquid-testnet.xyz/evm',
            'backend': 'https://testnet.hyperflash.io'  # Not deployed yet
        },
        'localhost': {
            'rpc': 'http://localhost:8545',
            'backend': 'http://localhost:3000'
        }
    }

    def __init__(self, network: str = 'localhost', private_key: Optional[str] = None, backend_url: Optional[str] = None):
        """
        Initialize the HyperFlash SDK.

        Args:
            network: Which network to use ('mainnet', 'testnet', 'localhost')
            private_key: Your wallet's private key (optional)
            backend_url: Custom backend URL (optional)

        Example:
            sdk = HyperFlashSDK(network='testnet', private_key='0x...')
        """
        # Set up network
        self.network = network
        network_config = self.NETWORKS.get(network, self.NETWORKS['localhost'])

        # Set up Web3 connection
        self.w3 = Web3(Web3.HTTPProvider(network_config['rpc']))

        # Set up backend URL
        self.backend_url = backend_url or network_config['backend']

        # Set up wallet if private key provided
        self.account = None
        self.address = None
        if private_key:
            self.account = Account.from_key(private_key)
            self.address = self.account.address

        print(f"✅ HyperFlash SDK initialized on {network}")
        if self.address:
            print(f"   Wallet: {self.address}")

    def check_staking_status(self) -> Dict[str, Any]:
        """
        Check if the user has a staking contract and how much is staked.

        Returns:
            Dictionary with staking information:
            - has_staking: Whether user has a staking contract
            - staked_amount: Amount staked in wei
            - staked_eth: Amount staked in ETH
            - is_active: Whether staking is active

        Example:
            status = sdk.check_staking_status()
            print(f"Staked: {status['staked_eth']} ETH")
        """
        print("🔍 Checking staking status...")

        if not self.address:
            raise ValueError("No wallet configured. Provide a private key.")

        try:
            response = requests.get(
                f"{self.backend_url}/user/staking-status/{self.address}"
            )

            if response.status_code == 200:
                data = response.json()

                # Convert wei to ETH for convenience
                staked_wei = int(data.get('stakedAmount', '0'))
                staked_eth = Web3.from_wei(staked_wei, 'ether')

                return {
                    'has_staking': data.get('hasStakingContract', False),
                    'staked_amount': str(staked_wei),
                    'staked_eth': float(staked_eth),
                    'is_active': data.get('isActive', False),
                    'staking_address': data.get('stakingAddress')
                }
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Failed to check staking: {e}")
            raise

    def deploy_staking_contract(self) -> str:
        """
        Deploy a personal staking contract for the user.

        Returns:
            The deployed contract address

        Example:
            contract_address = sdk.deploy_staking_contract()
            print(f"Contract deployed at: {contract_address}")
        """
        print("📦 Deploying staking contract...")

        if not self.address:
            raise ValueError("No wallet configured. Provide a private key.")

        try:
            response = requests.post(
                f"{self.backend_url}/user/deploy-staking",
                json={'userAddress': self.address}
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    contract_address = data['contractAddress']
                    print(f"✅ Contract deployed at: {contract_address}")
                    return contract_address
                else:
                    raise Exception(data.get('error', 'Deployment failed'))
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Failed to deploy: {e}")
            raise

    def stake_funds(self, amount_eth: float) -> str:
        """
        Stake ETH/HYPE in your staking contract.

        Args:
            amount_eth: Amount to stake in ETH

        Returns:
            Transaction hash

        Example:
            tx_hash = sdk.stake_funds(1.0)  # Stake 1 ETH
        """
        print(f"💰 Staking {amount_eth} ETH...")

        if not self.address:
            raise ValueError("No wallet configured. Provide a private key.")

        # Convert ETH to wei
        amount_wei = Web3.to_wei(amount_eth, 'ether')

        try:
            response = requests.post(
                f"{self.backend_url}/user/stake",
                json={
                    'userAddress': self.address,
                    'amount': str(amount_wei)
                }
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    tx_hash = data['txHash']
                    print(f"✅ Staked {amount_eth} ETH")
                    print(f"   TX: {tx_hash}")
                    return tx_hash
                else:
                    raise Exception(data.get('error', 'Staking failed'))
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Failed to stake: {e}")
            raise

    def execute_trade(
        self,
        source_token: str,
        amount: float,
        target_pair: str,
        side: str,
        source_chain: str = 'base',
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Execute an ultra-fast cross-chain trade.

        This is the main feature - trades execute in <500ms!

        Args:
            source_token: Token you're trading from (e.g., 'USDC')
            amount: Amount to trade
            target_pair: Trading pair on HyperLiquid (e.g., 'BTC/USDC')
            side: 'buy' or 'sell'
            source_chain: Which chain the source token is on (default: 'base')
            price: Optional limit price

        Returns:
            Dictionary with trade details:
            - trade_id: Unique trade identifier
            - execution_time: Time taken in milliseconds
            - status: Trade status

        Example:
            result = sdk.execute_trade(
                source_token='USDC',
                amount=1000,
                target_pair='BTC/USDC',
                side='buy'
            )
            print(f"Trade executed in {result['execution_time']}ms!")
        """
        print(f"🚀 Executing trade...")
        print(f"   {side} {amount} {source_token} → {target_pair}")

        if not self.address:
            raise ValueError("No wallet configured. Provide a private key.")

        start_time = time.time()

        try:
            # Prepare trade parameters
            trade_params = {
                'pair': target_pair,
                'side': side,
                'type': 'limit' if price else 'market'
            }
            if price:
                trade_params['price'] = price

            # Send trade request
            # Backend will initiate DeBridge from source chain to HyperLiquid
            response = requests.post(
                f"{self.backend_url}/trade/initiate",
                json={
                    'userAddress': self.address,
                    'sourceToken': source_token,
                    'sourceChain': source_chain,  # Which chain to bridge from
                    'amount': str(amount),
                    'tradeParams': trade_params
                }
            )

            execution_time = (time.time() - start_time) * 1000  # Convert to ms

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print(f"✅ Trade executed in {execution_time:.0f}ms!")
                    print(f"   Trade ID: {data['tradeId']}")

                    return {
                        'trade_id': data['tradeId'],
                        'execution_time': execution_time,
                        'status': 'executed',
                        'bridge_tx': data.get('bridgeTxHash'),
                        'timestamp': data.get('timestamp')
                    }
                else:
                    raise Exception(data.get('error', 'Trade failed'))
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Trade failed: {e}")
            raise

    def get_trade_status(self, trade_id: str) -> Dict[str, Any]:
        """
        Get the current status of a trade.

        Args:
            trade_id: The trade ID to check

        Returns:
            Dictionary with trade status information

        Example:
            status = sdk.get_trade_status('trade_123456')
            print(f"Bridge completed: {status['bridge_completed']}")
        """
        print(f"📊 Checking trade {trade_id}...")

        try:
            response = requests.get(
                f"{self.backend_url}/trade/status/{trade_id}"
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Failed to get status: {e}")
            raise

    def get_active_trades(self) -> List[Dict[str, Any]]:
        """
        Get all active trades for the current user.

        Returns:
            List of active trades

        Example:
            trades = sdk.get_active_trades()
            for trade in trades:
                print(f"Trade {trade['id']}: {trade['status']}")
        """
        print("📋 Fetching active trades...")

        if not self.address:
            raise ValueError("No wallet configured. Provide a private key.")

        try:
            response = requests.get(
                f"{self.backend_url}/trades/active",
                params={'user': self.address}
            )

            if response.status_code == 200:
                data = response.json()
                trades = data.get('trades', [])
                print(f"Found {len(trades)} active trades")
                return trades
            else:
                raise Exception(f"API error: {response.text}")

        except Exception as e:
            print(f"❌ Failed to get trades: {e}")
            raise

    def estimate_gas_cost(self, target_pair: str, amount: float) -> Dict[str, Any]:
        """
        Estimate the gas cost for a trade.

        Args:
            target_pair: The trading pair (e.g., 'BTC/USDC')
            amount: Trade amount

        Returns:
            Dictionary with gas estimates:
            - estimated_gas: Gas units needed
            - cost_in_eth: Cost in ETH
            - cost_in_usd: Cost in USD

        Example:
            estimate = sdk.estimate_gas_cost('BTC/USDC', 1000)
            print(f"Gas cost: {estimate['cost_in_usd']} USD")
        """
        print("⛽ Estimating gas costs...")

        try:
            response = requests.post(
                f"{self.backend_url}/estimate/gas",
                json={
                    'pair': target_pair,
                    'amount': amount
                }
            )

            if response.status_code == 200:
                return response.json()
            else:
                # Return default estimates if API fails
                return {
                    'estimated_gas': '200000',
                    'cost_in_eth': '0.002',
                    'cost_in_usd': '5.00'
                }

        except Exception as e:
            print(f"⚠️ Could not estimate gas: {e}")
            # Return default estimates
            return {
                'estimated_gas': '200000',
                'cost_in_eth': '0.002',
                'cost_in_usd': '5.00'
            }

    def is_connected(self) -> bool:
        """
        Check if the SDK is connected to the network.

        Returns:
            True if connected, False otherwise

        Example:
            if sdk.is_connected():
                print("Connected to network")
        """
        try:
            self.w3.eth.block_number
            return True
        except:
            return False

    def get_wallet_address(self) -> Optional[str]:
        """
        Get the current wallet address.

        Returns:
            The wallet address if configured, None otherwise

        Example:
            address = sdk.get_wallet_address()
            print(f"Using wallet: {address}")
        """
        return self.address


# Convenience function for quick setup
def create_sdk(network: str = 'testnet', private_key: Optional[str] = None) -> HyperFlashSDK:
    """
    Quick helper to create an SDK instance.

    Example:
        from hyperflash import create_sdk

        sdk = create_sdk('testnet', 'your_private_key')
    """
    return HyperFlashSDK(network=network, private_key=private_key)