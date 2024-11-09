#!/usr/bin/env tsx

import { TriplitClient } from "@triplit/client";
import { prompt } from "enquirer";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { schema, User } from "../triplit/schema";

type ConnectionDetails = {
	serverUrl: string;
	serviceToken: string;
};

type SavedConfig = {
	source?: ConnectionDetails;
	destination?: ConnectionDetails;
};

type CollectionsInput = {
	collections: string;
};

type SchemaCollections = keyof typeof schema;

const CONFIG_PATH = join(process.cwd(), ".triplit-migration-config.json");

function loadSavedConfig(): SavedConfig {
	try {
		if (existsSync(CONFIG_PATH)) {
			const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
			return config as SavedConfig;
		}
	} catch (error) {
		console.warn("Failed to load saved config:", error);
	}
	return {};
}

function saveConfig(type: "source" | "destination", config: ConnectionDetails) {
	try {
		const existingConfig = loadSavedConfig();
		const newConfig = {
			...existingConfig,
			[type]: config,
		};
		writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
	} catch (error) {
		console.warn("Failed to save config:", error);
	}
}

const getConnectionDetails = async (
	label: "source" | "destination",
): Promise<ConnectionDetails> => {
	const savedConfig = loadSavedConfig();
	const initialValues = savedConfig[label] ?? ({} as ConnectionDetails);

	const response = await prompt<ConnectionDetails>([
		{
			type: "input",
			name: "serverUrl",
			message: `Enter the ${label} Triplit server URL:`,
			required: true,
			initial: initialValues.serverUrl,
		},
		{
			type: "password",
			name: "serviceToken",
			message: `Enter the ${label} service token:`,
			required: true,
			initial: initialValues.serviceToken,
		},
	]);

	saveConfig(label, response);
	return response;
};

const getCollections = async (): Promise<("matches" | "users" | "games")[]> => {
	const validCollections = Object.keys(schema);

	const response = await prompt<CollectionsInput>({
		type: "input",
		name: "collections",
		message: `Enter collection names (comma-separated)\nValid collections: ${validCollections.join(", ")}`,
		required: true,
		validate: (value: string) => {
			const collections = value.split(",").map((c) => c.trim());
			if (collections.length === 0)
				return "At least one collection is required";

			const invalidCollections = collections.filter(
				(c) => !validCollections.includes(c),
			);
			if (invalidCollections.length > 0) {
				return `Invalid collections: ${invalidCollections.join(", ")}`;
			}
			return true;
		},
	});

	return response.collections
		.split(",")
		.map((c) => c.trim()) as SchemaCollections[];
};

const migrateCollection = async (
	sourceClient: TriplitClient<typeof schema>,
	destClient: TriplitClient<typeof schema>,
	collectionName: "users",
) => {
	try {
		console.log(`\nStarting migration of ${collectionName}...`);

		const query = sourceClient.query(collectionName).build();
		const records = await sourceClient.fetch(query);
		console.log(`Fetched ${records.length} records`);

		if (records.length > 0) {
			console.log("First record sample:", JSON.stringify(records[0], null, 2));

			await destClient.transact(async (tx) => {
				for (const record of records) {
					try {
						await tx.insert(collectionName, record);
					} catch (insertError) {
						console.error(
							`Failed to insert record in ${collectionName}:`,
							JSON.stringify(record, null, 2),
							"\nError:",
							insertError,
						);
					}
				}
			});
			// wait 10 seconds
			await new Promise((resolve) => setTimeout(resolve, 100));

			console.log(`Completed migration of ${collectionName}`);
		}
	} catch (error) {
		console.error(`Error migrating ${collectionName}:`, error);
		return false;
	}
	return true;
};

const run = async () => {
	console.log("🚀 Triplit Migration Tool\n");

	const oldDetails = await getConnectionDetails("source");
	const newDetails = await getConnectionDetails("destination");
	const collections = await getCollections();

	const oldTriplitClient = new TriplitClient({
		schema,
		serverUrl: oldDetails.serverUrl,
		token: oldDetails.serviceToken,
	});

	const newTriplitClient = new TriplitClient({
		schema,
		serverUrl: newDetails.serverUrl,
		token: newDetails.serviceToken,
	});

	let hasErrors = false;
	for (const collection of collections) {
		const success = await migrateCollection(
			oldTriplitClient,
			newTriplitClient,
			collection,
		);
		if (!success) hasErrors = true;
	}

	if (hasErrors) {
		console.log("\n⚠️ Migration completed with some errors.");
		process.exit(1);
	} else {
		console.log("\n✅ Migration completed successfully.");
		process.exit(0);
	}
};

run().catch((error) => {
	console.error("\n❌ Migration failed:", error);
	process.exit(1);
});
