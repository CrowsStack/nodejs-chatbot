const { spawn } = require('child_process');
const path = require('path');

function startProcess(scriptName, name) {
    const process = spawn('node', [scriptName], {
        stdio: 'pipe',
        shell: true
    });

    process.stdout.on('data', (data) => {
        console.log(`[${name}] ${data}`);
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
const dataServer = startProcess('data-server.js', 'DataServer');

// Start main server
console.log('Starting main server...');
const mainServer = startProcess('server.js', 'MainServer');

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down all servers...');
    scraper.kill();
    dataServer.kill();
    mainServer.kill();
    process.exit(0);
});
