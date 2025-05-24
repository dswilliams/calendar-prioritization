#!/bin/bash
case $1 in
    "start")
        echo "Starting SearXNG..."
        # Ensure Docker Compose is in PATH
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
        docker compose up -d
        sleep 5
        ./test_searxng.sh
        ;;
    "stop")
        echo "Stopping SearXNG..."
        # Ensure Docker Compose is in PATH
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
        docker compose down
        ;;
    "restart")
        echo "Restarting SearXNG..."
        # Ensure Docker Compose is in PATH
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
        docker compose down
        docker compose up -d
        sleep 5
        ./test_searxng.sh
        ;;
    "logs")
        # Ensure Docker Compose is in PATH
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
        docker compose logs -f searxng
        ;;
    "test")
        ./test_searxng.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|test}"
        exit 1
        ;;
esac
