import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const candidates = [
	resolve(process.cwd(), "dist/server.js"),
	resolve(process.cwd(), "../dist/server.js"),
];

for (const candidate of candidates) {
	if (existsSync(candidate)) {
		await import(pathToFileURL(candidate).href);
		break;
	}
}
