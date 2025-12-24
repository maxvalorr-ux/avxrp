const mysql = require('mysql2/promise');
const fs = require('fs');

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
        let output = "";
        const [tables] = await connection.execute('SHOW TABLES');
        const names = tables.map(t => Object.values(t)[0]);
        output += 'Tables: ' + names.join(', ') + '\n\n';

        for (const name of names) {
            const [cols] = await connection.execute(`DESCRIBE ${name}`);
            output += `Table: ${name}\nColumns: ${cols.map(c => c.Field).join(', ')}\n\n`;
        }
        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

check();
