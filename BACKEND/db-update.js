require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDb() {
    console.log("Connecting to DB:", process.env.DB_HOST);
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });

        // Add profile_picture to users
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN profile_picture MEDIUMTEXT');
            console.log('Successfully added profile_picture to users.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column profile_picture already exists.');
            } else {
                console.error('Error adding profile_picture:', err.message);
            }
        }

        console.log('Database update finished.');
        process.exit(0);
    } catch (err) {
        console.error("Connection failed", err);
        process.exit(1);
    }
}

updateDb();
