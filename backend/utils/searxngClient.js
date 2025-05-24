const axios = require('axios');

const SEARXNG_CONFIG = {
  instances: [
    "https://search.bus-hit.me",
    "https://searx.be",
    "https://search.sapti.me"
  ],
  timeout: 10000,  // 10 seconds
  max_results: 10,
  retry_attempts: 3,
  health_check_interval: 300000,  // 5 minutes
  user_agent: "CalendarPrioritizer/1.0"
};

class SearXNGClient {
  constructor() {
    this.instances = SEARXNG_CONFIG.instances.map(instance => ({
      url: instance,
      status: 'healthy',
      lastChecked: 0,
      responseTimes: [],
      successRate: 1.0
    }));
    this.currentInstanceIndex = 0;
    // Start periodic health checks
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

    for (let attempt = 0; attempt < SEARXNG_CONFIG.retry_attempts; attempt++) {
      const instance = this.getNextInstance();
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
        console.error(`[SearXNGClient] Error with instance ${instance.url}: ${errorMessage}`);
        this.updateInstanceStats(instance, false, 0);
        if (attempt === SEARXNG_CONFIG.retry_attempts - 1) {
          throw new Error(`Search failed after ${SEARXNG_CONFIG.retry_attempts} attempts: ${errorMessage}`);
        }
      }
    }
  }

  getNextInstance() {
    const healthyInstances = this.instances.filter(instance => instance.status === 'healthy');
    if (healthyInstances.length === 0) {
      // If no healthy instances, try to reactivate an unhealthy one for a health check
      const now = Date.now();
      for (const instance of this.instances) {
        if (instance.status === 'unhealthy' && (now - instance.lastChecked > SEARXNG_CONFIG.health_check_interval)) {
          console.log(`[SearXNGClient] Attempting to re-check unhealthy instance: ${instance.url}`);
          instance.status = 'checking'; // Temporarily mark as checking
          this.currentInstanceIndex = this.instances.indexOf(instance); // Set as current to try this one
          return instance;
        }
      }
      throw new Error('No healthy or re-checkable instances available');
    }

    // Simple round-robin among healthy instances
    const nextInstance = healthyInstances[this.currentInstanceIndex % healthyInstances.length];
    this.currentInstanceIndex = (this.currentInstanceIndex + 1) % healthyInstances.length;
    return nextInstance;
  }

  updateInstanceStats(instance, success, responseTime) {
    const now = Date.now();
    instance.lastChecked = now;

    if (success) {
      instance.responseTimes.push(responseTime);
      if (instance.responseTimes.length > 10) {
        instance.responseTimes.shift();
      }
      // Increase success rate more aggressively on success
      instance.successRate = Math.min(1.0, instance.successRate + 0.2);
      instance.status = 'healthy'; // Mark as healthy on success
    } else {
      // Decrease success rate more aggressively on failure
      instance.successRate = Math.max(0.0, instance.successRate - 0.3);
      if (instance.successRate < 0.5) {
        instance.status = 'unhealthy';
      }
    }
    console.log(`[SearXNGClient] Instance ${instance.url} status: ${instance.status}, Success Rate: ${instance.successRate.toFixed(2)}`);
  }

  async healthCheck() {
    const now = Date.now();
    for (const instance of this.instances) {
      // Only re-check unhealthy instances after their interval, or if they are 'checking'
      if (instance.status === 'unhealthy' && (now - instance.lastChecked > SEARXNG_CONFIG.health_check_interval)) {
        console.log(`[SearXNGClient] Performing scheduled health check for ${instance.url}`);
        try {
          await axios.get(`${instance.url}/search?q=test&format=json`, {
            timeout: SEARXNG_CONFIG.timeout,
            headers: { 'User-Agent': SEARXNG_CONFIG.user_agent }
          });
          this.updateInstanceStats(instance, true, 0); // Treat health check as a success
        } catch (error) {
          this.updateInstanceStats(instance, false, 0); // Treat health check as a failure
        }
      }
    }
  }
}

module.exports = { SearXNGClient, SEARXNG_CONFIG };
