const { spawn } = require('child_process');
const path = require('path');

function startProcess(scriptName, name, onStart) {
    const process = spawn('node', [scriptName], {
        stdio: 'pipe',
        shell: true
    });

    process.stdout.on('data', (data) => {
        console.log(`[${name}] ${data}`);
        // Check for specific output indicating the server is running
        if (data.toString().includes('Data server is running on port')) {
            if (onStart) onStart(); // Call the onStart callback if provided
        }
    });

    process.stderr.on('data', (data) => {
        console.error(`[${name} Error] ${data}`);
    });

    process.on('close', (code) => {
        console.log(`[${name}] exited with code ${code}`);
    });

    return process;
}

// Start background scraper
console.log('Starting background scraper...');
const scraper = startProcess('background-scraper.js', 'Scraper');

// Start data server
console.log('Starting data server...');
const dataServer = startProcess('data-server.js', 'DataServer', () => {
    console.log('Data server started successfully. Now starting the main server...');
    // Start main server only after the data server is confirmed to be running
    const mainServer = startProcess('server.js', 'MainServer');
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down all servers...');
    scraper.kill();
    dataServer.kill();
    process.exit(0);
});