require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// This is the Singleton. It is the ONLY place 'new PrismaClient()' should exist.
const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;