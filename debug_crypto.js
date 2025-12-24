const CryptoJS = require('crypto-js');
console.log('Available Algos:', Object.keys(CryptoJS.algo || {}));
console.log('Available Top Level:', Object.keys(CryptoJS).filter(k => typeof CryptoJS[k] === 'function'));
