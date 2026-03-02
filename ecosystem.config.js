module.exports = {
    apps: [
        {
            name: 'interviewer-api',
            script: './server.js',
            cwd: '/var/www/interviewer/backend',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            watch: false,
            restart_delay: 3000,
            max_restarts: 10,
        }
    ]
};
