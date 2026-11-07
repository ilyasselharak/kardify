/**
 * Grants (or revokes) the ADMIN role from the command line — used to create the first admin.
 *   npm run admin:promote -- you@example.com
 *   npm run admin:promote -- you@example.com --revoke
 */
import { PrismaService } from '../prisma/prisma.service.js';

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
const revoke = args.includes('--revoke');

if (!email) {
  console.error('Usage: npm run admin:promote -- <email> [--revoke]');
  process.exit(1);
}

const prisma = new PrismaService();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Register the account first.`);
    process.exitCode = 1;
  } else {
    await prisma.user.update({
      where: { id: user.id },
      // Admins created from the CLI are trusted: mark verified and lift any suspension.
      data: revoke ? { role: 'USER' } : { role: 'ADMIN', emailVerified: true, suspendedAt: null },
    });
    await prisma.adminAuditLog.create({
      data: { adminEmail: 'cli', action: revoke ? 'user.demote' : 'user.promote', targetType: 'user', targetId: user.id, meta: { email, source: 'cli' } },
    });
    console.log(`${email} is now ${revoke ? 'a regular user' : 'an ADMIN'}.`);
  }
} finally {
  await prisma.$disconnect();
}
