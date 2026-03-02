const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('Usage: node hash-password.js <your_password>');
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('--------------------------------------------------');
    console.log('Plain Text:', password);
    console.log('BCrypt Hash:', hash);
    console.log('--------------------------------------------------');
    console.log('Copy the BCrypt Hash and paste it into your Google Sheet.');
});
