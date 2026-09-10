import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const schema = new URL(process.env.DATABASE_URL).searchParams.get('schema') || 'public';
const quotedSchema = '"' + schema.replaceAll('"', '""') + '"';
try {
  const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = ${schema} AND table_name = 'Config' AND column_name = 'integrations'`;
  const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = ${schema} AND table_name IN ('NotificationEvent', 'NotificationDelivery')`;
  if (columns.length === 1 && tables.length === 2) console.log('Notification migration already applied');
  else {
    if (columns.length || tables.length) throw new Error('Partial notification schema detected; inspect before applying migration');
    const sql = await readFile(new URL('../packages/database/prisma/changes/20260910_notifications.sql', import.meta.url), 'utf8');
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${quotedSchema}`);
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
    }, { timeout: 30000 });
    console.log('Notification migration applied (additive, transactional)');
  }
} finally { await prisma.$disconnect(); }
