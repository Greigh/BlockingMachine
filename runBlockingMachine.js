'use strict';
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the output file path
const outputFilePath = path.join(__dirname, 'output.txt');

// Clear the output file before every run
fs.writeFileSync(outputFilePath, '', 'utf8');

// Function to run the BlockingMachine script with optional debug flag
function runBlockingMachine(debug) {
    const command = debug ? 'node BlockingMachine.js -debug' : 'node BlockingMachine.js';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            fs.appendFileSync(outputFilePath, `Error: ${error.message}\n`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            fs.appendFileSync(outputFilePath, `Stderr: ${stderr}\n`);
        }

        if (debug === true) {
            console.log(`Stdout: ${stdout}`);
            fs.appendFileSync(outputFilePath, stdout);
            console.log(`Output written to ${outputFilePath}`);
        }
    });
}

// Check for -debug flag in command line arguments
const debug = process.argv.includes('-debug');

// Run the BlockingMachine script
runBlockingMachine(debug);
