import pino from "pino";

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	redact: ["password", "secret"],
});

export default logger;
