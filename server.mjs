#!/usr/bin/env node
// Enhanced server startup with better error handling
// Handles port conflicts and provides clear error messages

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { createServer } from 'net';

const DEFAULT_PORT = 8888;
const FALLBACK_PORTS = [8889, 8890, 8891, 8892];

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find the first available port from a list
 */
async function findAvailablePort(ports) {
  for (const port of ports) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Kill any existing process on the given port
 */
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const lsof = spawn('lsof', ['-ti', `:${port}`]);
    let pids = '';
    
    lsof.stdout.on('data', (data) => {
      pids += data.toString();
    });
    
    lsof.on('close', (code) => {
      if (code === 0 && pids.trim()) {
        const pidList = pids.trim().split('\n');
        console.log(`🔄 Killing existing processes on port ${port}: ${pidList.join(', ')}`);
        
        pidList.forEach(pid => {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
          } catch (error) {
            console.warn(`⚠️  Could not kill process ${pid}:`, error.message);
          }
        });
        
        // Give processes time to shut down
        setTimeout(resolve, 2000);
      } else {
        resolve();
      }
    });
    
    lsof.on('error', () => {
      // lsof not available or other error, just continue
      resolve();
    });
  });
}

/**
 * Start the Astro server
 */
function startAstroServer(port, isProduction = false) {
  return new Promise((resolve, reject) => {
    const command = isProduction ? 'node' : 'astro';
    const args = isProduction 
      ? ['dist/server/entry.mjs'] 
      : ['dev', '--port', port.toString(), '--host'];
    
    console.log(`🚀 Starting server on port ${port}...`);
    
    const astro = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: port.toString()
      }
    });
    
    astro.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(`Command not found: ${command}. Make sure dependencies are installed.`));
      } else {
        reject(error);
      }
    });
    
    astro.on('exit', (code, signal) => {
      if (signal) {
        console.log(`🛑 Server stopped by signal: ${signal}`);
      } else if (code !== 0) {
        reject(new Error(`Server exited with code: ${code}`));
      }
    });
    
    // Consider it started if it doesn't exit immediately
    setTimeout(() => resolve(astro), 1000);
  });
}

/**
 * Main startup logic
 */
async function main() {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--production') || process.env.NODE_ENV === 'production';
  const forceKill = args.includes('--kill');
  
  console.log('🏠 marl0.space server startup');
  console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`);
  
  // Check if build exists for production mode
  if (isProduction && !existsSync('dist/server/entry.mjs')) {
    console.error('❌ Production build not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  let targetPort = DEFAULT_PORT;
  
  // Check if default port is available
  const isDefaultAvailable = await isPortAvailable(DEFAULT_PORT);
  
  if (!isDefaultAvailable) {
    console.log(`⚠️  Port ${DEFAULT_PORT} is in use.`);
    
    if (forceKill) {
      console.log('🔄 Attempting to kill existing processes...');
      await killProcessOnPort(DEFAULT_PORT);
      
      // Check again after killing
      const isNowAvailable = await isPortAvailable(DEFAULT_PORT);
      if (isNowAvailable) {
        console.log('✅ Port cleared successfully.');
        targetPort = DEFAULT_PORT;
      } else {
        console.log('❌ Port still in use after cleanup attempt.');
      }
    }
    
    if (targetPort !== DEFAULT_PORT) {
      // Find an alternative port
      const availablePort = await findAvailablePort(FALLBACK_PORTS);
      if (availablePort) {
        console.log(`📍 Using alternative port: ${availablePort}`);
        targetPort = availablePort;
      } else {
        console.error('❌ No available ports found. Please free up a port or use --kill option.');
        process.exit(1);
      }
    }
  } else {
    console.log(`✅ Port ${DEFAULT_PORT} is available.`);
  }
  
  try {
    await startAstroServer(targetPort, isProduction);
  } catch (error) {
    if (error.message.includes('EADDRINUSE')) {
      console.error(`❌ Port conflict error: ${error.message}`);
      console.log('💡 Try running with --kill to terminate existing processes');
      console.log('💡 Or run: lsof -ti :8888 | xargs kill');
    } else {
      console.error('❌ Server startup failed:', error.message);
    }
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions to prevent unhandled rejections
process.on('uncaughtException', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port conflict: ${error.message}`);
    console.log('💡 Try running with --kill to terminate existing processes');
  } else {
    console.error('❌ Uncaught exception:', error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});