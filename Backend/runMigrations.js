const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('migrate') && f.endsWith('.js') && f !== 'runMigrations.js');

console.log('Starting migrations...');
console.log('Files to migrate:', files);

files.forEach(file => {
    process.stdout.write(`Running ${file}... `);
    try {
        const output = execSync(`node ${file}`, { cwd: __dirname }).toString();
        process.stdout.write('DONE\n');
        if (output) console.log(output.trim());
    } catch (err) {
        process.stdout.write('FAILED\n');
        console.error(`Error running ${file}:`, err.message);
    }
});

console.log('All migrations completed!');
process.exit(0);
