import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Reuse a single Prisma client in serverless/runtime hot-reloads to avoid
// creating too many pools and reduce cold-start connection stalls.
const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

const createPrismaClient = () => {
	const adapter = new PrismaPg({
		connectionString,
		connectionTimeoutMillis: 10_000,
		idleTimeoutMillis: 10_000,
		max: 5,
	});

	return new PrismaClient({ adapter });
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export { prisma };