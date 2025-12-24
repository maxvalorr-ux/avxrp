const CryptoJS = require('crypto-js');
try {
    const input = "test";
    const hash = CryptoJS.algo.Whirlpool.create().finalize(input).toString();
    console.log('Whirlpool test:', hash);
} catch (e) {
    console.error('Whirlpool test failed:', e.message);
}
