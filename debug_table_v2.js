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
        rows.forEach(row => {
            console.log(row.Field);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
