//crypto.js
const crypto = require('crypto');
const { NOT_MY_KEY } = process.env;

// Encrypt function
function encrypt(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', NOT_MY_KEY, crypto.randomBytes(16));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decrypt function
function decrypt(text) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', NOT_MY_KEY, crypto.randomBytes(16));
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Usage example
const encryptedPrivateKey = encrypt('myPrivateData');
console.log('Encrypted:', encryptedPrivateKey);
const decryptedPrivateKey = decrypt(encryptedPrivateKey);
console.log('Decrypted:', decryptedPrivateKey);
