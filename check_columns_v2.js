const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: '51.38.205.167',
        user: 'u1393_wbWhTMkaxv',
        password: 'BWffr+ICPyhsZu.mbVtnvB0d',
        database: 's1393_db1766571131960',
        port: 3306
    });

    try {
        const [rows] = await connection.execute('DESCRIBE users');
        const columns = rows.map(r => r.Field);
        console.log('Search results:');
        ['money', 'score', 'level', 'skin', 'online', 'username', 'uid'].forEach(col => {
            console.log(`${col}: ${columns.includes(col)}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
