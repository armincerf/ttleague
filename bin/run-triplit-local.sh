#!/bin/bash

echo "TRIPLIT_EXTERNAL_JWT_SECRET: $TRIPLIT_EXTERNAL_JWT_SECRET"

# Make sure the JWT secret is not empty
if [[ -z "$TRIPLIT_EXTERNAL_JWT_SECRET" ]]; then
    echo "TRIPLIT_EXTERNAL_JWT_SECRET is not set in .env.local. Exiting."
    exit 1
fi

# Run the triplit dev command
bunx triplit dev --schemaPath triplit/schema.ts
