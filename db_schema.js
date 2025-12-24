const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: '51.38.205.167',
        user: 'u1393_wbWhTMkaxv',
        password: 'BWffr+ICPyhsZu.mbVtnvB0d',
        database: 's1393_db1766571131960',
        port: 3306,
        connectTimeout: 20000
    });

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        const names = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', names.join(', '));

        for (const name of names) {
            if (['users', 'inventory', 'warnings', 'whitelist', 'player_items'].some(k => name.toLowerCase().includes(k))) {
                const [cols] = await connection.execute(`DESCRIBE ${name}`);
                console.log(`\nTable: ${name}\nColumns: ${cols.map(c => c.Field).join(', ')}`);
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
