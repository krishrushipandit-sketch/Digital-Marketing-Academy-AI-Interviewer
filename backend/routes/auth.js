const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readSheet } = require('../services/sheets');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// User Login (Student)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const students = await readSheet('Students');
        const normalizedEmail = (email || '').trim().toLowerCase();
        const student = students.find(s => (s.Email || '').trim().toLowerCase() === normalizedEmail);

        if (!student) return res.status(401).json({ message: 'Invalid credentials' });

        const dbPassword = (student.Password || student.PasswordHash || '').toString().trim();
        const inputPassword = (password || '').toString().trim();
        const isMatch = (inputPassword === dbPassword);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { email: student.Email, name: student.Name, batchCode: student.BatchCode, role: 'student' },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { email: student.Email, name: student.Name, batchCode: student.BatchCode, role: 'student' } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admins = await readSheet('Admins');
        const normalizedEmail = (email || '').trim().toLowerCase();
        const admin = admins.find(a => (a.Email || '').trim().toLowerCase() === normalizedEmail);

        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const dbPassword = (admin.Password || admin.PasswordHash || '').toString().trim();
        const inputPassword = (password || '').toString().trim();
        const isMatch = (inputPassword === dbPassword);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { email: admin.Email, name: admin.Name, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { email: admin.Email, name: admin.Name, role: 'admin' } });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
