import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const sanitizeDatabaseUrl = (value: string | undefined) => {
	if (!value) {
		return value;
	}

	return value.trim().replace(/^['"]|['"]$/g, "");
};

const buildConnectionString = (value: string | undefined) => {
	const sanitizedValue = sanitizeDatabaseUrl(value);

	if (!sanitizedValue) {
		return sanitizedValue;
	}

	const databaseUrl = new URL(sanitizedValue);
	databaseUrl.searchParams.set("connection_limit", "1");

	return databaseUrl.toString();
};

const connectionString = buildConnectionString(process.env.DATABASE_URL);

if (!connectionString) {
	console.error("[db] DATABASE_URL is missing");
	throw new Error("DATABASE_URL is missing");
}

try {
	const databaseUrl = new URL(connectionString);
	console.log("[db] DATABASE_URL configured", {
		host: databaseUrl.hostname,
		port: databaseUrl.port || "5432",
		database: databaseUrl.pathname.replace(/^\//, "") || undefined,
		sanitized: connectionString !== process.env.DATABASE_URL,
		connectionLimit: databaseUrl.searchParams.get("connection_limit") ?? undefined,
	});
	if (databaseUrl.hostname === "base") {
		console.error("[db] DATABASE_URL host is set to 'base'. Fix the Vercel DATABASE_URL env var.");
	}
	if (databaseUrl.hostname === "localhost" || databaseUrl.hostname === "127.0.0.1") {
		console.warn("[db] DATABASE_URL points to a local host. Vercel cannot use a local database URL.");
	}
	if (!/^postgres(ql)?:$/i.test(databaseUrl.protocol)) {
		console.warn("[db] DATABASE_URL uses a non-Postgres protocol", { protocol: databaseUrl.protocol });
	}

} catch (error) {
	console.error("[db] DATABASE_URL is invalid", {
		message: error instanceof Error ? error.message : String(error),
	});
}

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
		max: 1,
	});

	return new PrismaClient({
		adapter,
		log: [
			{ emit: "event", level: "query" },
			{ emit: "event", level: "warn" },
			{ emit: "event", level: "error" },
		],
	});
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

const prismaWithEvents = prisma as any;

if (typeof prismaWithEvents.$on === "function") {
	prismaWithEvents.$on("query", (event: any) => {
		console.log("[db][query]", {
			query: event.query,
			duration: event.duration,
			params: event.params,
			timestamp: new Date().toISOString(),
		});
	});

	prismaWithEvents.$on("warn", (event: any) => {
		console.warn("[db] Prisma warning", event);
	});

	prismaWithEvents.$on("error", (event: any) => {
		console.error("[db] Prisma error", event);
	});
}

globalForPrisma.prisma = prisma;

export { prisma };