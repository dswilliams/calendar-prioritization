const axios = require('axios');

const SEARXNG_CONFIG = {
  instances: [
    "http://localhost:8080"  // Local instance only
  ],
  timeout: 15000,  // 15 seconds
  max_results: 20,  // Can request more from local instance
  retry_attempts: 2,  // Fewer retries needed for local
  health_check_interval: 60000,  // Check health less frequently
  user_agent: "CalendarPrioritizer/1.0"
};

class SearXNGClient {
  constructor() {
    this.instance = {
      url: SEARXNG_CONFIG.instances[0],
      status: 'healthy',
      lastChecked: Date.now(),
      responseTimes: [],
      successRate: 1.0
    };
    // Start periodic health checks for the single instance
    this.healthCheckIntervalId = setInterval(() => this.healthCheck(), SEARXNG_CONFIG.health_check_interval);
  }

  // Add a method to close the health check interval when the client is no longer needed
  close() {
    clearInterval(this.healthCheckIntervalId);
  }

  async search(query, params = {}) {
    const defaultParams = {
      categories: 'general',
      engines: 'google,bing,duckduckgo',
      language: 'en',
      format: 'json'
    };

    const searchParams = new URLSearchParams({
      ...defaultParams,
      ...params,
      q: query
    });

    const instance = this.instance; // Always use the single local instance

    for (let attempt = 0; attempt < SEARXNG_CONFIG.retry_attempts; attempt++) {
      const url = `${instance.url}/search?${searchParams.toString()}`;

      try {
        const startTime = Date.now();
        const response = await axios.get(url, {
          timeout: SEARXNG_CONFIG.timeout,
          headers: { 'User-Agent': SEARXNG_CONFIG.user_agent }
        });
        const responseTime = Date.now() - startTime;

        // Check for valid JSON response
        if (typeof response.data !== 'object' || response.data === null) {
          throw new Error('Invalid JSON response from SearXNG instance');
        }

        this.updateInstanceStats(instance, true, responseTime);
        return response.data;
      } catch (error) {
        let errorMessage = error.message;
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            errorMessage = `Timeout after ${SEARXNG_CONFIG.timeout / 1000} seconds`;
          } else if (error.response) {
            errorMessage = `HTTP error ${error.response.status}: ${error.response.statusText}`;
          } else if (error.request) {
            errorMessage = `No response received: ${error.message}`;
          }
        }
        console.error(`[SearXNGClient] Error with local instance ${instance.url}: ${errorMessage}`);
        this.updateInstanceStats(instance, false, 0);
        if (attempt === SEARXNG_CONFIG.retry_attempts - 1) {
          throw new Error(`Search failed after ${SEARXNG_CONFIG.retry_attempts} attempts: ${errorMessage}`);
        }
      }
    }
  }

  // Simplified for single instance
  updateInstanceStats(instance, success, responseTime) {
    const now = Date.now();
    instance.lastChecked = now;

    if (success) {
      instance.responseTimes.push(responseTime);
      if (instance.responseTimes.length > 10) {
        instance.responseTimes.shift();
      }
      instance.successRate = Math.min(1.0, instance.successRate + 0.2);
      instance.status = 'healthy';
    } else {
      instance.successRate = Math.max(0.0, instance.successRate - 0.3);
      if (instance.successRate < 0.5) {
        instance.status = 'unhealthy';
      }
    }
    console.log(`[SearXNGClient] Local instance ${instance.url} status: ${instance.status}, Success Rate: ${instance.successRate.toFixed(2)}`);
  }

  // Simplified health check for single instance
  async healthCheck() {
    const instance = this.instance;
    const now = Date.now();
    // Only re-check if unhealthy or if it's time for a scheduled check
    if (instance.status === 'unhealthy' || (now - instance.lastChecked > SEARXNG_CONFIG.health_check_interval)) {
      console.log(`[SearXNGClient] Performing scheduled health check for local instance ${instance.url}`);
      try {
        await axios.get(`${instance.url}/search?q=test&format=json`, {
          timeout: SEARXNG_CONFIG.timeout,
          headers: { 'User-Agent': SEARXNG_CONFIG.user_agent }
        });
        this.updateInstanceStats(instance, true, 0);
      } catch (error) {
        this.updateInstanceStats(instance, false, 0);
      }
    }
  }
}

module.exports = { SearXNGClient, SEARXNG_CONFIG };
