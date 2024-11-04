#!/bin/bash
LOCAL_DATABASE_URL="./db" bun run triplit dev -s sqlite -i  --dbPort 6900 --schemaPath ../triplit/schema.ts
