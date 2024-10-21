echo "Seeding local database..."
echo "Current location: $(pwd)"

bunx triplit seed run mockData --token $TRIPLIT_SERVICE_TOKEN --remote http://localhost:6543
