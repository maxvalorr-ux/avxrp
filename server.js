const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'applications.json');
const JWT_SECRET = "SUPER_SECRET_KEY";

const transporter = nodemailer.createTransport({
    host: 'pro.eu.turbo-smtp.com',
    port: 465,
    secure: true,
    auth: {
        user: '7300afb32658643ca2b5',
        pass: 'Upyna4rFcu7s6DSfmWwh'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// MySQL Connection Pool
const DB_CONFIG = {
    host: '51.38.205.167',
    user: 'u1393_wbWhTMkaxv',
    password: 'BWffr+ICPyhsZu.mbVtnvB0d',
    database: 's1393_db1766571131960',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;
(async () => {
    try {
        pool = await mysql.createPool(DB_CONFIG);
        console.log("MySQL connected and pool created");
    } catch (err) {
        console.error("MySQL Connection Error:", err.message);
    }
})();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Fixed Game Password Hashing (SHA-512 CAPITAL + Fallbacks)
function checkGamePassword(input, storedHash) {
    if (!storedHash) return false;

    const normalizedStored = storedHash.trim().toUpperCase();

    // 1. Try SHA-512 (Requested CAPITAL Format)
    const sha512Hash = crypto.createHash('sha512').update(input).digest('hex').toUpperCase();
    if (sha512Hash === normalizedStored) return true;

    // 2. Try SHA-256
    const sha256Hash = crypto.createHash('sha256').update(input).digest('hex').toUpperCase();
    if (sha256Hash === normalizedStored) return true;

    // 3. Try Whirlpool (Legacy Fallback)
    try {
        const Whirlpool = require('crypto-js/whirlpool');
        const whirlpoolHash = Whirlpool(input).toString().toUpperCase();
        if (whirlpoolHash === normalizedStored) return true;
    } catch (e) {
        // Whirlpool might not be installed or erroring
    }

    // 4. Try plain text comparison
    if (input.toUpperCase() === normalizedStored) return true;

    return false;
}

// 🔐 LOGIN (Allow Multiple Logins)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Query user using 'username' column
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ? LIMIT 1",
            [username.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = rows[0];
        let isValid = false;

        // Check password type
        const storedHash = user.password.trim();

        if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || (storedHash.length < 32 && storedHash.length > 0)) {
            // Likely Bcrypt or legacy short plain text
            try {
                if (storedHash.startsWith('$')) {
                    isValid = await bcrypt.compare(password, storedHash);
                } else {
                    isValid = checkGamePassword(password, storedHash);
                }
            } catch (e) {
                isValid = checkGamePassword(password, storedHash);
            }
        } else {
            // Game hashed passwords (SHA-512, SHA-256, Whirlpool)
            isValid = checkGamePassword(password, storedHash);
        }

        if (!isValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token - No restrictions on multiple logins
        const token = jwt.sign(
            { id: user.uid, username: user.username },
            JWT_SECRET,
            { expiresIn: "7d" } // Extended session
        );

        console.log(`User logged in: ${user.username}`);

        res.json({
            message: "Login successful",
            token,
            user: { username: user.username, uid: user.uid }
        });
    } catch (error) {
        console.error('Login API Error:', error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 🛡️ AUTH MIDDLEWARE
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// 📊 USER DATA (GET /api/me)
// Middleware to Admin Only
const isAdmin = async (req, res, next) => {
    try {
        const [rows] = await pool.query("SELECT adminlevel FROM users WHERE uid = ?", [req.user.id]);
        if (rows.length > 0 && rows[0].adminlevel > 0) {
            next();
        } else {
            res.status(403).json({ error: "Access denied. Admin authority required." });
        }
    } catch (error) {
        res.status(500).json({ error: "Auth Error" });
    }
};

app.get('/api/me/assets', authenticateToken, async (req, res) => {
    try {
        const [vehicles] = await pool.query("SELECT id, modelid FROM vehicles WHERE ownerid = ?", [req.user.id]);
        const [user] = await pool.query("SELECT materials, pot, crack, meth, painkillers, seeds FROM users WHERE uid = ?", [req.user.id]);

        const inventory = [];
        const u = user[0];
        if (u.materials > 0) inventory.push({ name: 'Materials', amount: u.materials, type: 'item' });
        if (u.pot > 0) inventory.push({ name: 'Pot', amount: u.pot, type: 'drug' });
        if (u.crack > 0) inventory.push({ name: 'Crack', amount: u.crack, type: 'drug' });
        if (u.meth > 0) inventory.push({ name: 'Meth', amount: u.meth, type: 'drug' });
        if (u.painkillers > 0) inventory.push({ name: 'Painkillers', amount: u.painkillers, type: 'drug' });
        if (u.seeds > 0) inventory.push({ name: 'Seeds', amount: u.seeds, type: 'item' });

        res.json({ vehicles, inventory });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                uid, username, level, exp, skin, cash, bank, XENO, gender, age, 
                regdate, lastlogin, minutes, hours, adminlevel, helperlevel, 
                warnings, dmwarnings, wantedlevel, 
                materials, pot, crack, meth, painkillers, seeds, walkietalkie, 
                boombox, mp3player, laptop, flashlight, candy, bandage, medkit,
                plastic, steel, metalScrap, copper, glass, rubber,
                carlicense, gunlicense, vippackage, viptime,
                faction, gang, factionrank, gangrank
            FROM users WHERE uid = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];

        // Fetch whitelist status from applications.json
        let whitelistStatus = 'Not Applied';
        if (fs.existsSync(DB_FILE)) {
            const apps = JSON.parse(fs.readFileSync(DB_FILE));
            const userApp = apps.find(a => a.discordUser === user.username || a.fullName === user.username); // Fallback matching
            if (userApp) {
                whitelistStatus = userApp.status;
            }
        }

        res.json({ ...user, whitelistStatus });
    } catch (error) {
        console.error('Fetch User (/api/me) Error:', error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 🏙️ CITY ACTIVITY LOG
app.post('/api/activity/log', authenticateToken, async (req, res) => {
    const { activity_type, description } = req.body;
    const user_id = req.user.id; // User ID from JWT token

    if (!activity_type || !description) {
        return res.status(400).json({ error: "Activity type and description are required" });
    }

    try {
        await pool.execute(
            "INSERT INTO city_activity_log (user_id, activity_type, description) VALUES (?, ?, ?)",
            [user_id, activity_type, description]
        );
        res.status(201).json({ message: "Activity logged successfully" });
    } catch (error) {
        console.error('Log Activity API Error:', error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

app.get('/api/activity/feed', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                cal.timestamp,
                u.username,
                cal.activity_type,
                cal.description
            FROM city_activity_log cal
            JOIN users u ON cal.user_id = u.uid
            ORDER BY cal.timestamp DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        console.error('Fetch Activity Feed API Error:', error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 📝 REGISTER (Game Compatible - uses Whirlpool)
app.post('/api/register', async (req, res) => {
    const { username, password, email, gender, age, skin } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const [rows] = await pool.execute('SELECT username FROM users WHERE username = ?', [username.trim()]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'User with this username already exists.' });
        }

        // Generate SHA-512 CAPITAL hash as requested
        const hashedPassword = crypto.createHash('sha512').update(password).digest('hex').toUpperCase();

        // Detailed insertion including game-compatible defaults
        await pool.execute(
            `INSERT INTO users (
                username, password, email, gender, age, skin, 
                regdate, level, cash, bank, hpammo, arammo, 
                upgradepoints, setup
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1, 5000, 10000, 0, 0, 0, 1)`,
            [
                username.trim(),
                hashedPassword,
                email || '',
                gender || 0,
                age || 21,
                skin || 0
            ]
        );

        res.status(201).json({ message: 'Account created successfully.' });
    } catch (error) {
        console.error('Register API Error:', error.message, error.stack);
        res.status(500).json({ message: 'Internal Server Error.', details: error.message });
    }
});

// 📋 WHITELIST APPLICATION
app.post('/api/apply', (req, res) => {
    const application = req.body;

    if (!application.fullName || !application.discordUser || !application.discordId) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
        const data = JSON.parse(fs.readFileSync(DB_FILE));
        application.id = Date.now().toString();
        application.status = 'pending';
        data.push(application);
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

        // Send to Discord Webhook
        const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1453346937632718901/0TGIRd4-J9T0r76t0tZ8vSryUl2Ez18MJSnzSlmXBMl1g2KdSG875QUVoUyEvkJUit8V';

        const embed = {
            title: 'New Whitelist Application',
            color: 0x753ada,
            fields: [
                { name: 'Full Name', value: application.fullName, inline: true },
                { name: 'Discord User', value: application.discordUser, inline: true },
                { name: 'Discord ID', value: application.discordId, inline: true },
                { name: 'Age', value: application.age, inline: true },
                { name: 'Country', value: application.country, inline: true },
                { name: 'Roleplay Experience', value: application.experience || 'None' },
                { name: 'Reason for Joining', value: application.reason }
            ],
            footer: { text: 'Avox RP | Whitelist System' },
            timestamp: new Date()
        };

        fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(err => console.error('Discord Webhook Error:', err));

        res.status(200).json({ message: 'Application submitted successfully.' });
    } catch (error) {
        console.error('Whitelist API Error:', error.message, error.stack);
        res.status(500).json({ message: 'Internal Server Error.', details: error.message });
    }
});

// 🔑 FORGOT PASSWORD
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        const [users] = await pool.query('SELECT username FROM users WHERE email = ? LIMIT 1', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'No account associated with this email.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await pool.execute('UPDATE users SET resetToken = ?, resetExpires = ? WHERE email = ?', [token, expires, email]);

        const resetLink = `http://localhost:8080/reset-password.html?token=${token}`;

        const mailOptions = {
            from: '"AVOX RP Security" <noreply@turbo-smtp.com>',
            to: email,
            subject: 'Password Reset Request | AVOX RP',
            html: `
                <div style="background: #0a041f; color: #fff; padding: 40px; font-family: sans-serif; border-radius: 20px;">
                    <h2 style="color: #7d4cfc;">Identity Recovery</h2>
                    <p>A password reset has been requested for your AVOX RP account.</p>
                    <p>To initialize the reset process, click the button below:</p>
                    <a href="${resetLink}" style="display: inline-block; background: #7d4cfc; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0;">Reset Passkey</a>
                    <p style="color: #94a3b8; font-size: 0.8rem;">This link will expire in 1 hour. If you did not request this, ignore this email.</p>
                </div>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Recovery email sent to:', email, 'ID:', info.messageId);
            res.json({ message: 'Reset link sent to your email.' });
        } catch (mailError) {
            console.error('SMTP Detailed Error:', mailError);
            res.status(500).json({
                message: 'Mail system error. Please contact staff.',
                details: mailError.message,
                code: mailError.code
            });
        }

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 🔑 RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Missing data.' });

    try {
        const [users] = await pool.query('SELECT uid FROM users WHERE resetToken = ? AND resetExpires > NOW() LIMIT 1', [token]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        const hashedPassword = crypto.createHash('sha512').update(newPassword).digest('hex').toUpperCase();

        await pool.execute('UPDATE users SET password = ?, resetToken = NULL, resetExpires = NULL WHERE resetToken = ?', [hashedPassword, token]);

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- 🛠️ ADMIN SYSTEM ---
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT uid, username, email, level, adminlevel, XENO, cash, lastlogin FROM users ORDER BY uid DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/action', authenticateToken, isAdmin, async (req, res) => {
    const { targetUid, action, value } = req.body;
    try {
        if (action === 'ban') {
            await pool.execute("INSERT INTO bans (username, ip, bannedby, reason) SELECT username, ip, ?, 'Banned by Admin' FROM users WHERE uid = ?", [req.user.name, targetUid]);
            res.json({ message: 'User banned successfully' });
        } else if (action === 'unban') {
            const [user] = await pool.query("SELECT username FROM users WHERE uid = ?", [targetUid]);
            await pool.execute("DELETE FROM bans WHERE username = ?", [user[0].username]);
            res.json({ message: 'User unbanned' });
        } else if (action === 'addXeno') {
            await pool.execute("UPDATE users SET XENO = XENO + ? WHERE uid = ?", [parseInt(value), targetUid]);
            res.json({ message: `Added ${value} XENO` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/generate-code', authenticateToken, isAdmin, async (req, res) => {
    const { code, amount } = req.body;
    try {
        await pool.execute("INSERT INTO xeno_codes (code, amount) VALUES (?, ?)", [code, amount]);
        res.json({ message: 'Code generated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Code might already exist' });
    }
});

// --- 💰 XENO SYSTEM ---
app.post('/api/xeno/redeem', authenticateToken, async (req, res) => {
    const { code } = req.body;
    try {
        const [rows] = await pool.query("SELECT * FROM xeno_codes WHERE code = ? AND is_used = 0", [code]);
        if (rows.length === 0) return res.status(400).json({ error: 'Invalid or already used code' });

        const amount = rows[0].amount;
        await pool.execute("UPDATE users SET XENO = XENO + ? WHERE uid = ?", [amount, req.user.id]);
        await pool.execute("UPDATE xeno_codes SET is_used = 1, used_by_uid = ? WHERE code = ?", [req.user.id, code]);

        res.json({ message: `Success! You redeemed ${amount} XENO coins.`, newBalance: amount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 🛒 MARKETPLACE ---
app.get('/api/marketplace', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, u.username as seller_name 
            FROM marketplace m 
            JOIN users u ON m.seller_uid = u.uid 
            WHERE m.status = 'active' ORDER BY m.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/marketplace/list', authenticateToken, async (req, res) => {
    const { item_type, item_id, item_name, price } = req.body;
    try {
        // Anti-scam: Verify ownership before listing (simplified)
        // In a real scenario, check if req.user.id owns the vehicle/item
        await pool.execute(
            "INSERT INTO marketplace (seller_uid, item_type, item_id, item_name, price) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, item_type, item_id, item_name, price]
        );
        res.json({ message: 'Item listed successfully on XENO marketplace' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/marketplace/buy', authenticateToken, async (req, res) => {
    const { listingId } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [listing] = await connection.query("SELECT * FROM marketplace WHERE id = ? AND status = 'active' FOR UPDATE", [listingId]);
        if (listing.length === 0) throw new Error('Listing no longer active');

        const [buyer] = await connection.query("SELECT XENO FROM users WHERE uid = ?", [req.user.id]);
        if (buyer[0].XENO < listing[0].price) throw new Error('Insufficient XENO coins');

        // Transfer Coins
        await connection.execute("UPDATE users SET XENO = XENO - ? WHERE uid = ?", [listing[0].price, req.user.id]);
        await connection.execute("UPDATE users SET XENO = XENO + ? WHERE uid = ?", [listing[0].price, listing[0].seller_uid]);

        // Transfer Item (Example for vehicle)
        if (listing[0].item_type === 'vehicle') {
            await connection.execute("UPDATE vehicles SET ownerid = ? WHERE id = ?", [req.user.id, listing[0].item_id]);
        }

        // Close Listing
        await connection.execute("UPDATE marketplace SET status = 'sold' WHERE id = ?", [listingId]);

        await connection.commit();
        res.json({ message: 'Purchase complete! Transaction secured by XENO escrow.' });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
