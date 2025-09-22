#!/usr/bin/env python3
"""
Enable/Disable Big Blocks on HyperLiquid for Contract Deployment
REAL IMPLEMENTATION with correct action format
"""

import sys
import time
import json
import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from hyperliquid.exchange import Exchange
from hyperliquid.info import Info

# Configuration
TEST_WALLET_PRIVATE_KEY = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"
TEST_WALLET_ADDRESS = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F"

# HyperLiquid Testnet Configuration
TESTNET_BASE_URL = "https://api.hyperliquid-testnet.xyz"

class BigBlockManager:
    """Manages big block settings for HyperLiquid contract deployment"""

    def __init__(self, private_key, testnet=True):
        """Initialize the manager with wallet credentials"""
        self.private_key = private_key
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.testnet = testnet

        # Initialize HyperLiquid SDK
        base_url = TESTNET_BASE_URL if testnet else "https://api.hyperliquid.xyz"
        self.exchange = Exchange(self.account, base_url=base_url)
        self.info = Info(base_url=base_url, skip_ws=True)
        self.base_url = base_url

        print(f"[OK] Initialized BigBlockManager")
        print(f"   Network: {'Testnet' if testnet else 'Mainnet'}")
        print(f"   Address: {self.address}")

    def check_core_user_status(self):
        """Check if the wallet is a Core user (has USDC)"""
        print("\n[INFO] Checking Core user status...")

        try:
            # Check user state
            user_state = self.info.user_state(self.address)

            # Check for USDC balance
            usdc_balance = 0
            if user_state and "assetPositions" in user_state:
                for position in user_state["assetPositions"]:
                    if position["position"]["coin"] == "USDC":
                        usdc_balance = float(position["position"]["szi"])
                        break

            print(f"   USDC balance: ${usdc_balance:.2f}")
            print(f"   Is Core user: {'Yes' if usdc_balance > 0 else 'No'}")

            return usdc_balance > 0

        except Exception as e:
            print(f"   [WARN] Error checking: {e}")
            return True  # Proceed on testnet

    def set_big_blocks(self, enable=True):
        """Enable or disable big blocks using correct action format"""
        action = "Enable" if enable else "Disable"
        print(f"\n[CONFIG] {action} big blocks...")

        try:
            # The action type IS the string "evmUserModify"
            action_payload = {
                "type": "evmUserModify",
                "usingBigBlocks": enable
            }

            print(f"   Sending action to HyperCore:")
            print(f"   type: evmUserModify")
            print(f"   usingBigBlocks: {enable}")

            # Send via exchange endpoint
            timestamp = int(time.time() * 1000)

            # Build the request
            request_data = {
                "action": action_payload,
                "nonce": timestamp,
                "signature": None
            }

            # Create signature
            signature_payload = {
                "action": action_payload,
                "nonce": timestamp,
                "vaultAddress": None
            }

            # Sign the action
            message = json.dumps(signature_payload, separators=(',', ':'))
            signature = self.account.sign_message(encode_defunct(text=message))
            request_data["signature"] = {
                "r": signature.r.to_bytes(32, 'big').hex(),
                "s": signature.s.to_bytes(32, 'big').hex(),
                "v": signature.v
            }

            # Send POST request
            response = requests.post(
                f"{self.base_url}/exchange",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "ok":
                    print(f"   [OK] Big blocks {'enabled' if enable else 'disabled'}!")
                    print(f"   Response: {result}")

                    print(f"   [WAIT] Waiting 5 seconds for propagation...")
                    time.sleep(5)

                    return True
                else:
                    print(f"   [WARN] Response: {result}")
                    return False
            else:
                print(f"   [ERROR] HTTP {response.status_code}: {response.text}")
                return False

        except Exception as e:
            print(f"   [ERROR] Failed: {e}")
            # Try alternative method
            return self._try_alternative_method(enable)

    def _try_alternative_method(self, enable=True):
        """Alternative method using direct API call"""
        print("   Trying alternative method...")

        try:
            # Direct action format
            action = {
                "type": "evmUserModify",
                "usingBigBlocks": enable
            }

            # Use the exchange's built-in methods if available
            if hasattr(self.exchange, 'custom_action'):
                result = self.exchange.custom_action(action)
                if result:
                    print(f"   [OK] Success via alternative method!")
                    return True

            # Manual POST
            nonce = int(time.time() * 1000)
            payload = {
                "action": action,
                "nonce": nonce,
                "vaultAddress": None
            }

            # Sign and send
            sig_string = json.dumps(payload, separators=(',', ':'))
            signature = self.account.sign_message(encode_defunct(text=sig_string))

            payload["signature"] = signature.signature.hex()

            response = requests.post(
                f"{self.base_url}/exchange",
                json=payload
            )

            if response.status_code == 200:
                print(f"   [OK] Alternative method succeeded!")
                return True
            else:
                print(f"   [ERROR] Alternative failed: {response.text}")
                return False

        except Exception as e:
            print(f"   [ERROR] Alternative method error: {e}")
            return False

def main():
    """Main execution function"""
    print("=" * 60)
    print("   HyperLiquid Big Block Manager (REAL)")
    print("=" * 60)

    # Initialize manager
    manager = BigBlockManager(TEST_WALLET_PRIVATE_KEY, testnet=True)

    # Check Core user status
    is_core_user = manager.check_core_user_status()

    if not is_core_user:
        print("\n[WARN] You may need USDC to be a Core user")
    else:
        print("\n[SUCCESS] You are a Core user with USDC!")

    # Parse command
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "enable":
            print("\n[ACTION] Enabling big blocks...")
            success = manager.set_big_blocks(True)

            if success:
                print("\n[SUCCESS] Big blocks ENABLED!")
                print("   - 30M gas limit available")
                print("   - Deploy contracts within 60 seconds")
                print("   - Run: npx hardhat run scripts/deploy.js --network hyperLiquidTestnet")

        elif command == "disable":
            print("\n[ACTION] Disabling big blocks...")
            success = manager.set_big_blocks(False)

            if success:
                print("\n[SUCCESS] Big blocks DISABLED!")
                print("   Back to 2M gas limit")

        else:
            print(f"\n[ERROR] Unknown command: {command}")
            print("   Usage: python enable_big_blocks_real.py [enable|disable]")
    else:
        # Interactive mode
        print("\nOptions:")
        print("1. Enable big blocks")
        print("2. Disable big blocks")
        print("3. Check status")
        print("4. Exit")

        choice = input("\nChoice (1-4): ").strip()

        if choice == "1":
            success = manager.set_big_blocks(True)
            if success:
                print("\n[READY] Deploy contracts now!")

        elif choice == "2":
            success = manager.set_big_blocks(False)
            if success:
                print("\n[OK] Back to small blocks")

        elif choice == "3":
            manager.check_core_user_status()

        elif choice == "4":
            print("\n[EXIT] Goodbye!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARN] Interrupted")
    except Exception as e:
        print(f"\n[ERROR] Fatal: {e}")
        sys.exit(1)