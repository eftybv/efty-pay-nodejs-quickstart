// examples/helpers.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: process.env.EFTY_PAY_API_KEY,
        exp: now + 600,
        iat: now,
        type: 2,
        iid: process.env.EFTY_PAY_INTEGRATOR_ID
    };

    return jwt.sign(payload, process.env.EFTY_PAY_API_SECRET, { algorithm: 'HS256' });
}

function generateRandomString(length = 5) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Uppercase letters
    const charactersLength = characters.length;
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return randomString;
}

module.exports = { generateToken, generateRandomString };