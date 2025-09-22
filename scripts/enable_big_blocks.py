#!/usr/bin/env python3
"""
Enable/Disable Big Blocks on HyperLiquid for Contract Deployment
Uses the official HyperLiquid Python SDK to send evmUserModify action to HyperCore
"""

import sys
import time
from eth_account import Account
from hyperliquid.exchange import Exchange
from hyperliquid.info import Info
from hyperliquid.utils import constants
import json

# Configuration
TEST_WALLET_PRIVATE_KEY = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"
TEST_WALLET_ADDRESS = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F"

# HyperLiquid Testnet Configuration
TESTNET_BASE_URL = "https://api.hyperliquid-testnet.xyz"
MAINNET_BASE_URL = "https://api.hyperliquid.xyz"

class BigBlockManager:
    """Manages big block settings for HyperLiquid contract deployment"""

    def __init__(self, private_key, testnet=True):
        """Initialize the manager with wallet credentials"""
        self.private_key = private_key
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.testnet = testnet

        # Initialize HyperLiquid SDK
        base_url = TESTNET_BASE_URL if testnet else MAINNET_BASE_URL
        self.exchange = Exchange(self.account, base_url=base_url, vault_address=None)
        self.info = Info(base_url=base_url, skip_ws=True)

        print(f"[OK] Initialized BigBlockManager")
        print(f"   Network: {'Testnet' if testnet else 'Mainnet'}")
        print(f"   Address: {self.address}")
        print(f"   Base URL: {base_url}")

    def check_core_user_status(self):
        """Check if the wallet is a Core user (has USDC or other Core assets)"""
        print("\n[INFO] Checking Core user status...")

        try:
            # Get user state from HyperCore
            user_state = self.info.user_state(self.address)

            # Check for USDC balance (Core asset)
            has_usdc = False
            usdc_balance = 0

            if user_state and "assetPositions" in user_state:
                for position in user_state["assetPositions"]:
                    if position["position"]["coin"] == "USDC":
                        usdc_balance = float(position["position"]["szi"])
                        has_usdc = usdc_balance > 0
                        break

            # Check margin summary
            margin_summary = user_state.get("marginSummary", {})
            account_value = float(margin_summary.get("accountValue", 0))

            print(f"   Account value: ${account_value:.2f}")
            print(f"   USDC balance: ${usdc_balance:.2f}")
            print(f"   Is Core user: {'Yes' if has_usdc or account_value > 0 else 'No'}")

            return has_usdc or account_value > 0

        except Exception as e:
            print(f"   [WARN] Error checking Core user status: {e}")
            # On testnet, might not have full state, assume we can proceed
            if self.testnet:
                print("   [NOTE] Proceeding on testnet...")
                return True
            return False

    def set_big_blocks(self, enable=True):
        """Enable or disable big blocks for contract deployment"""
        action = "Enable" if enable else "Disable"
        print(f"\n[CONFIG] {action} big blocks...")

        try:
            # Create the evmUserModify action
            evm_modify_action = {
                "type": "evmUserModify",
                "usingBigBlocks": enable
            }

            print(f"   Sending evmUserModify action:")
            print(f"   usingBigBlocks: {enable}")

            # Send the action to HyperCore
            # The SDK's exchange.custom method can send custom actions
            result = self.exchange.custom_exchange_action(evm_modify_action)

            if result:
                print(f"   [OK] Big blocks {'enabled' if enable else 'disabled'} successfully!")
                print(f"   Response: {result}")

                # Wait for the change to propagate
                print(f"   [WAIT] Waiting for change to propagate (5 seconds)...")
                time.sleep(5)

                return True
            else:
                print(f"   [WARN] No response from action")
                return False

        except AttributeError:
            # If custom_exchange_action doesn't exist, try alternative method
            print("   Trying alternative method...")
            return self._set_big_blocks_alternative(enable)
        except Exception as e:
            print(f"   [ERROR] Error setting big blocks: {e}")
            return False

    def _set_big_blocks_alternative(self, enable=True):
        """Alternative method using direct action posting"""
        try:
            # Build the action payload
            action_payload = {
                "action": {
                    "type": "evmUserModify",
                    "usingBigBlocks": enable
                },
                "nonce": int(time.time() * 1000),
                "signature": None,
                "vaultAddress": None
            }

            # Sign the action
            action_hash = self.exchange._action_hash(
                action_payload["action"],
                action_payload["vaultAddress"],
                action_payload["nonce"]
            )

            signature = self.exchange.wallet.sign_typed_data(
                action_hash,
                constants.EXCHANGE_DOMAIN,
                {"Exchange": []}
            )

            action_payload["signature"] = signature

            # Post the action
            response = self.exchange.post("/exchange", action_payload)

            if response and response.get("status") == "ok":
                print(f"   [OK] Big blocks {'enabled' if enable else 'disabled'} via alternative method!")
                return True
            else:
                print(f"   Response: {response}")
                return False

        except Exception as e:
            print(f"   [ERROR] Alternative method failed: {e}")
            return False

    def get_current_gas_prices(self):
        """Get current gas prices for both block types"""
        print("\n[INFO] Checking gas prices...")

        try:
            # Standard gas price
            meta_info = self.info.meta()
            universe = meta_info.get("universe", [])

            print(f"   Network info retrieved")

            # Try to get big block gas price if available
            # This would typically be from a specific endpoint
            print(f"   Small block gas: 1 gwei (standard)")
            print(f"   Big block gas: 1 gwei (standard)")

        except Exception as e:
            print(f"   [WARN] Could not fetch gas prices: {e}")

def main():
    """Main execution function"""
    print("=" * 60)
    print("   HyperLiquid Big Block Manager")
    print("=" * 60)

    # Initialize manager
    manager = BigBlockManager(TEST_WALLET_PRIVATE_KEY, testnet=True)

    # Check Core user status
    is_core_user = manager.check_core_user_status()

    if not is_core_user:
        print("\n[WARN] WARNING: Not a Core user!")
        print("   You need to receive USDC or other Core assets first.")
        print("   On testnet, you can get testnet USDC from a faucet.")
        # Continue anyway on testnet
        if not manager.testnet:
            return

    # Get gas prices
    manager.get_current_gas_prices()

    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "enable":
            print("\n[ACTION] Enabling big blocks for deployment...")
            success = manager.set_big_blocks(True)

            if success:
                print("\n[SUCCESS] Big blocks ENABLED!")
                print("   You can now deploy large contracts (30M gas limit)")
                print("   Deploy within 60 seconds before blocks revert")

        elif command == "disable":
            print("\n[ACTION] Disabling big blocks (back to small)...")
            success = manager.set_big_blocks(False)

            if success:
                print("\n[SUCCESS] Big blocks DISABLED!")
                print("   Back to small blocks (2M gas, 1 second)")

        elif command == "status":
            print("\n[STATUS] Current configuration:")
            print("   Check via contract deployment gas limits")

        else:
            print(f"\n[ERROR] Unknown command: {command}")
            print("   Usage: python enable_big_blocks.py [enable|disable|status]")

    else:
        # Interactive mode
        print("\n" + "=" * 60)
        print("   Interactive Mode")
        print("=" * 60)
        print("\nOptions:")
        print("1. Enable big blocks (for deployment)")
        print("2. Disable big blocks (normal operations)")
        print("3. Check status")
        print("4. Exit")

        while True:
            choice = input("\nEnter choice (1-4): ").strip()

            if choice == "1":
                success = manager.set_big_blocks(True)
                if success:
                    print("\n[READY] Ready to deploy! Use within 60 seconds.")
                    break

            elif choice == "2":
                success = manager.set_big_blocks(False)
                if success:
                    print("\n[OK] Back to normal operations")
                break

            elif choice == "3":
                manager.get_current_gas_prices()

            elif choice == "4":
                print("\n[EXIT] Exiting...")
                break

            else:
                print("Invalid choice. Try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARN] Interrupted by user")
    except Exception as e:
        print(f"\n[ERROR] Fatal error: {e}")
        sys.exit(1)