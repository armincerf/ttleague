#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

SRC_DIR="$DIR/.."

echo "Starting schema update process... \n"
echo "Target triplit environment: ${CONTEXT:-local} \n"
echo "cd-ing into '$SRC_DIR' directory \n"

# Move to src directory
cd $SRC_DIR

execute_migration_command() {
  local service_token=$1
  local db_url=$2

  echo "Service Token: $service_token"
  echo "Triplit URL: $db_url"

  if [[ -z "$service_token" || -z "$db_url" ]]; then
    echo "Environment variables not set. Exiting."
    exit 1
  fi

  echo "Pushing schema..."
	bun run triplit schema push --token "$service_token" --remote "$db_url" --schemaPath ./triplit/schema.ts
}

if [[ -z "${TRIPLIT_SERVICE_TOKEN}" || -z "${NEXT_PUBLIC_TRIPLIT_SERVER_URL}" ]]; then
  echo "Environment variables not set, using defaults"
  TRIPLIT_SERVICE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoibG9jYWwtcHJvamVjdC1pZCJ9.8Z76XXPc9esdlZb2b7NDC7IVajNXKc4eVcPsO7Ve0ug"
  NEXT_PUBLIC_TRIPLIT_SERVER_URL="http://localhost:6543"

  execute_migration_command "$TRIPLIT_SERVICE_TOKEN" "$NEXT_PUBLIC_TRIPLIT_SERVER_URL"
else
  echo "Environment variables are already set, using existing values..."
  execute_migration_command "$TRIPLIT_SERVICE_TOKEN" "$NEXT_PUBLIC_TRIPLIT_SERVER_URL"
fi
