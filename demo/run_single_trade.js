#!/usr/bin/env node

/**
 * Automated script to run single trade demo
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demo = spawn('node', ['cli_demo.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'inherit', 'inherit']
});

// Wait a bit for the demo to start
setTimeout(() => {
    // Navigate down 3 times to option 4
    demo.stdin.write('\x1B[B'); // Down arrow
    setTimeout(() => {
        demo.stdin.write('\x1B[B'); // Down arrow
        setTimeout(() => {
            demo.stdin.write('\x1B[B'); // Down arrow
            setTimeout(() => {
                demo.stdin.write('\n'); // Enter to select
            }, 100);
        }, 100);
    }, 100);
}, 2000);

demo.on('close', (code) => {
    console.log(`Demo exited with code ${code}`);
});