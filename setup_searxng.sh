#!/bin/bash
echo "Setting up local SearXNG instance..."

# Ensure Docker Compose is in PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Create searxng directory if it doesn't exist
mkdir -p searxng

# Generate a random secret key for production use
SECRET_KEY=$(openssl rand -hex 32)

# Create settings.yml with generated secret
cat > searxng/settings.yml << EOF
use_default_settings: true
server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "$SECRET_KEY"
  
search:
  safe_search: 0
  autocomplete: ""
  default_lang: "en"
  formats:
    - html
    - json

engines:
  - name: google
    disabled: false
  - name: bing
    disabled: false
  - name: duckduckgo
    disabled: false
  - name: startpage
    disabled: false

outgoing:
  request_timeout: 10.0
  useragent_suffix: ""
  max_request_timeout: 20.0
EOF

echo "Starting SearXNG container..."
docker compose up

echo "Waiting for SearXNG to start..."
sleep 10

echo "Testing SearXNG instance..."
curl -s "http://localhost:8080/search?q=test&format=json" | jq .

echo "SearXNG setup complete!"
echo "Access at: http://localhost:8080"
echo "API endpoint: http://localhost:8080/search?q=YOUR_QUERY&format=json"
