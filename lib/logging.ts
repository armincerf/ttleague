import pino from "pino";
import posthog from "posthog-js";

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	redact: ["password", "secret"],
	customLevels: {
		track: 30, // Same level as info
	},
	formatters: {
		log(object) {
			console.log("log", object);
			if (object.track === true) {
				if (
					typeof object.eventName === "string" &&
					object.properties &&
					typeof object.properties === "object"
				) {
					const { distinctId, event, properties } = object;
					posthog.capture(object.eventName, {
						distinctId: object.distinctId || "anonymous",
						event,
						properties,
					});

					// Return modified object for logging
					return {
						distinctId,
						event,
						...properties,
						analytics: true, // Add marker that this was tracked
					};
				}
			}

			return object;
		},
	},
});

export default logger;
