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
        const [rows] = await connection.execute('SELECT username, password FROM users LIMIT 1');
        if (rows.length > 0) {
            console.log('Sample User:', rows[0].username);
            console.log('Password Length:', rows[0].password.length);
            console.log('Password Start:', rows[0].password.substring(0, 8));
        } else {
            console.log('No users found in table.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
