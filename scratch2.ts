import { prisma } from "./src/app/lib/prisma.js";
const accounts = await prisma.account.findMany({ select: { providerId: true } });
console.log(accounts.map(a => a.providerId));
