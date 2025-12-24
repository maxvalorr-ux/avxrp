const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        host: '51.38.205.167',
        user: 'u1393_wbWhTMkaxv',
        password: 'BWffr+ICPyhsZu.mbVtnvB0d',
        database: 's1393_db1766571131960',
        port: 3306,
        connectTimeout: 10000
    });

    try {
        console.log('Fetching tables...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables:', tables);

        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\nColumns for ${tableName}:`);
            const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
            console.table(columns.map(c => c.Field));
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
