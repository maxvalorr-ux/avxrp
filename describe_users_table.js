
const mysql = require('mysql2/promise');

async function describeUsersTable() {
    const connection = await mysql.createConnection({
        host: '51.38.205.167',
        user: 'u1393_wbWhTMkaxv',
        password: 'BWffr+ICPyhsZu.mbVtnvB0d',
        database: 's1393_db1766571131960',
        port: 3306,
        connectTimeout: 20000
    });

    try {
        const [cols] = await connection.execute(`DESCRIBE users`);
        console.log('Users table columns:', cols.map(c => c.Field));
    } catch (err) {
        console.error('Error describing users table:', err.message);
    } finally {
        await connection.end();
    }
}

describeUsersTable();

