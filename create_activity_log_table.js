
const mysql = require('mysql2/promise');

async function createActivityLogTable() {
    const connection = await mysql.createConnection({
        host: '51.38.205.167',
        user: 'u1393_wbWhTMkaxv',
        password: 'BWffr+ICPyhsZu.mbVtnvB0d',
        database: 's1393_db1766571131960',
        port: 3306,
        connectTimeout: 20000
    });

    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS city_activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INT NOT NULL,
                activity_type VARCHAR(255) NOT NULL,
                description TEXT,
                FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
            );
        `);
        console.log('Table city_activity_log created or already exists.');
    } catch (err) {
        console.error('Error creating city_activity_log table:', err.message);
    } finally {
        await connection.end();
    }
}

createActivityLogTable();

