let appPromise: Promise<any> | undefined;

const getApp = (): Promise<any> => {
	if (!appPromise) {
		appPromise = import("../src/app.js").then(({ default: app }) => app);
	}

	return appPromise;
};

export default async function handler(req: any, res: any): Promise<void> {
	if ((req.method === "GET" || req.method === "HEAD") && (req.url === "/" || req.url === "")) {
		res.statusCode = 200;
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({
			success: true,
			message: "E-Commerce API is running",
			version: "1.0.0",
			docs: "/api/v1",
		}));
		return;
	}

	const app = await getApp();
	await app(req, res);
}