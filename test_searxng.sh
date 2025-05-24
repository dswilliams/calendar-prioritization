#!/bin/bash
echo "Testing local SearXNG instance..."

# Test basic connectivity
echo "1. Testing basic connectivity..."
if curl -s -f "http://localhost:8080/" > /dev/null; then
    echo "✓ SearXNG is accessible"
else
    echo "✗ SearXNG is not accessible"
    exit 1
fi

# Test search functionality
echo "2. Testing search functionality..."
RESPONSE=$(curl -s "http://localhost:8080/search?q=test&format=json")
if echo "$RESPONSE" | jq -e '.results' > /dev/null 2>&1; then
    echo "✓ Search API is working"
    echo "✓ Found $(echo "$RESPONSE" | jq '.results | length') results"
else
    echo "✗ Search API is not working properly"
    echo "Response: $RESPONSE"
    exit 1
fi

# Test specific search engines
echo "3. Testing search engines..."
for engine in "google" "bing" "duckduckgo"; do
    RESPONSE=$(curl -s "http://localhost:8080/search?q=test&format=json&engines=$engine")
    if echo "$RESPONSE" | jq -e '.results[0]' > /dev/null 2>&1; then
        echo "✓ $engine is working"
    else
        echo "⚠ $engine may not be working"
    fi
done

echo "All tests completed!"
