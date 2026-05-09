// prisma.js — single shared Prisma client instance for the entire backend.
// Import this in every route and utility file instead of creating separate database connections.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;

