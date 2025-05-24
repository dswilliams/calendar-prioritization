#!/bin/bash

# Function to check if docker compose is available
check_docker_compose() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        echo "Error: Docker Compose is not available"
        exit 1
    fi
}

case $1 in
    "start")
        echo "Starting SearXNG..."
        check_docker_compose
        docker compose up -d
        sleep 5
        if [ ! -f "./test_searxng.sh" ]; then
            echo "Warning: test_searxng.sh not found, skipping tests"
        else
            ./test_searxng.sh
        fi
        ;;
    "stop")
        echo "Stopping SearXNG..."
        check_docker_compose
        docker compose down
        ;;
    "restart")
        echo "Restarting SearXNG..."
        check_docker_compose
        docker compose restart
        ;;
    "logs")
        echo "Viewing SearXNG logs..."
        check_docker_compose
        docker compose logs -f
        ;;
    "test")
        echo "Running SearXNG tests..."
        if [ ! -f "./test_searxng.sh" ]; then
            echo "Error: test_searxng.sh not found"
            exit 1
        fi
        ./test_searxng.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|test}"
        exit 1
        ;;
esac
