module.exports = {
    host: 'localhost',
    port: 5432,
    user: process.env.USER,
    database: process.env.USER,
    password: null,
    patchTableName: 'db_patch'
};