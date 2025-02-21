'use strict';
const { updateAllLists, ensureFiltersFileExists } = require('./BlockingMachine');

(async () => {
    const debug = process.argv.includes('-debug');
    console.log('Starting script');
    await ensureFiltersFileExists();
    await updateAllLists(debug);
    console.log('Script finished');
})();