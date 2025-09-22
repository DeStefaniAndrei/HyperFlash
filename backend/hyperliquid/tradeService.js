/**
 * HyperLiquid Trade Service
 *
 * This service wraps the Python trade executor and provides
 * a JavaScript interface for the backend server.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HyperLiquidTradeService {
    constructor() {
        this.pythonPath = 'python';
        this.executorPath = path.join(__dirname, 'trade_executor.py');
        this.isInitialized = false;
    }

    /**
     * Initialize the trade service
     * This checks if the Python executor is working
     */
    async initialize() {
        console.log('[HyperLiquid] Initializing trade service...');

        try {
            // Test Python installation and HyperLiquid SDK
            const testResult = await this.executePythonCommand('test_connection');

            if (testResult.success) {
                this.isInitialized = true;
                console.log('[HyperLiquid] Trade service initialized successfully');
                return true;
            } else {
                console.error('[HyperLiquid] Failed to initialize:', testResult.error);
                return false;
            }
        } catch (error) {
            console.error('[HyperLiquid] Initialization error:', error);
            return false;
        }
    }

    /**
     * Execute a trade on HyperLiquid
     *
     * @param {string} tradeId - Unique trade identifier
     * @param {Object} tradeParams - Trading parameters
     * @returns {Promise<Object>} Trade execution result
     */
    async executeTrade(tradeId, tradeParams) {
        console.log(`[HyperLiquid] Executing trade ${tradeId}`);

        const command = {
            action: 'execute_trade',
            trade_id: tradeId,
            pair: tradeParams.pair || 'BTC/USDC',
            side: tradeParams.side || 'buy',
            amount: parseFloat(tradeParams.amount) || 0.01,
            price: tradeParams.price ? parseFloat(tradeParams.price) : null,
            trade_type: tradeParams.type || 'market'
        };

        try {
            const result = await this.executePythonCommand(command);

            if (result.success) {
                console.log(`[HyperLiquid] Trade executed in ${result.execution_time}ms`);
                return {
                    success: true,
                    orderId: result.order_id,
                    executionTime: result.execution_time,
                    tradeId: tradeId
                };
            } else {
                console.error(`[HyperLiquid] Trade failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error,
                    tradeId: tradeId
                };
            }
        } catch (error) {
            console.error(`[HyperLiquid] Trade execution error:`, error);
            return {
                success: false,
                error: error.message,
                tradeId: tradeId
            };
        }
    }

    /**
     * Get vault (shared EOA) balance
     *
     * @returns {Promise<Object>} Balance information
     */
    async getVaultBalance() {
        const command = {
            action: 'get_vault_balance'
        };

        try {
            const result = await this.executePythonCommand(command);
            return result;
        } catch (error) {
            console.error('[HyperLiquid] Failed to get vault balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order status by trade ID
     *
     * @param {string} tradeId - The trade ID to check
     * @returns {Promise<Object>} Order status
     */
    async getOrderStatus(tradeId) {
        const command = {
            action: 'get_order_status',
            trade_id: tradeId
        };

        try {
            const result = await this.executePythonCommand(command);
            return result;
        } catch (error) {
            console.error('[HyperLiquid] Failed to get order status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancel an open order
     *
     * @param {string} tradeId - The trade ID to cancel
     * @param {string} coin - The coin symbol
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelOrder(tradeId, coin) {
        const command = {
            action: 'cancel_order',
            trade_id: tradeId,
            coin: coin
        };

        try {
            const result = await this.executePythonCommand(command);
            return result;
        } catch (error) {
            console.error('[HyperLiquid] Failed to cancel order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute a Python command and return the result
     *
     * @param {Object} command - Command to execute
     * @returns {Promise<Object>} Command result
     */
    executePythonCommand(command) {
        return new Promise((resolve, reject) => {
            // Create Python script that imports and uses the executor
            const pythonScript = `
import json
import sys
import os
sys.path.insert(0, '${__dirname.replace(/\\/g, '\\\\')}')

from trade_executor import TradeExecutor

# Initialize executor (use environment to determine network)
network = os.getenv('HYPERLIQUID_NETWORK', 'testnet')
executor = TradeExecutor(network=network)

# Parse command
command = json.loads('''${JSON.stringify(command)}''')

# Execute command
try:
    if command.get('action') == 'test_connection':
        result = {'success': True, 'message': 'Connection successful'}
    elif command['action'] == 'execute_trade':
        result = executor.execute_trade(
            trade_id=command['trade_id'],
            pair=command['pair'],
            side=command['side'],
            amount=command['amount'],
            price=command.get('price'),
            trade_type=command.get('trade_type', 'market')
        )
    elif command['action'] == 'get_vault_balance':
        result = executor.get_vault_balance()
    elif command['action'] == 'get_order_status':
        result = executor.get_order_status(command['trade_id'])
    elif command['action'] == 'cancel_order':
        result = executor.cancel_order(command['trade_id'], command['coin'])
    else:
        result = {'success': False, 'error': f"Unknown action: {command.get('action')}"}

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

            // Execute Python script
            const pythonProcess = spawn(this.pythonPath, ['-c', pythonScript]);

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error:', error);
                    reject(new Error(error || 'Python script failed'));
                } else {
                    try {
                        // Parse the last line as JSON (ignore print statements)
                        const lines = output.trim().split('\n');
                        const lastLine = lines[lines.length - 1];
                        const result = JSON.parse(lastLine);
                        resolve(result);
                    } catch (parseError) {
                        console.error('Failed to parse Python output:', output);
                        reject(new Error('Failed to parse Python output'));
                    }
                }
            });

            pythonProcess.on('error', (err) => {
                reject(err);
            });
        });
    }
}

export default HyperLiquidTradeService;