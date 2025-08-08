// Bayanihan Weather Alert - API Handler

/**
 * API handler for PAGASA weather alerts
 */

class WeatherAPI {
    constructor() {
        this.baseUrl = 'https://publicalert.pagasa.dost.gov.ph';
        this.feedUrl = `${this.baseUrl}/feeds/`;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Fetch weather alerts from PAGASA feed
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Object>}
     */
    async fetchAlerts(useCache = true) {
        const cacheKey = 'weather-alerts';
        
        // Check cache first
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await this.fetchWithRetry(this.feedUrl);
            const xmlText = await response.text();
            const alerts = this.parseAtomFeed(xmlText);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: alerts,
                timestamp: Date.now()
            });
            
            return alerts;
        } catch (error) {
            Utils.ErrorUtils.log(error, 'WeatherAPI.fetchAlerts');
            
            // Return cached data if available, even if expired
            if (this.cache.has(cacheKey)) {
                console.warn('Using expired cache due to fetch error');
                return this.cache.get(cacheKey).data;
            }
            
            throw new Error('Failed to fetch weather alerts. Please check your internet connection.');
        }
    }

    /**
     * Fetch detailed alert information from CAP file
     * @param {string} capUrl - URL to CAP file
     * @returns {Promise<Object>}
     */
    async fetchAlertDetails(capUrl) {
        const cacheKey = `alert-details-${capUrl}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await this.fetchWithRetry(capUrl);
            const xmlText = await response.text();
            const alertDetails = this.parseCapFile(xmlText);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: alertDetails,
                timestamp: Date.now()
            });
            
            return alertDetails;
        } catch (error) {
            Utils.ErrorUtils.log(error, 'WeatherAPI.fetchAlertDetails');
            throw new Error('Failed to fetch alert details.');
        }
    }

    /**
     * Parse ATOM feed XML
     * @param {string} xmlText - XML content
     * @returns {Object}
     */
    parseAtomFeed(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid XML format');
            }

            const feed = {
                id: this.getTextContent(xmlDoc, 'id'),
                title: this.getTextContent(xmlDoc, 'title'),
                updated: this.getTextContent(xmlDoc, 'updated'),
                entries: []
            };

            const entries = xmlDoc.querySelectorAll('entry');
            entries.forEach(entry => {
                const alertEntry = {
                    id: this.getTextContent(entry, 'id'),
                    title: this.getTextContent(entry, 'title'),
                    updated: this.getTextContent(entry, 'updated'),
                    author: this.getTextContent(entry, 'author name'),
                    link: entry.querySelector('link')?.getAttribute('href'),
                    severity: this.extractSeverityFromTitle(this.getTextContent(entry, 'title')),
                    region: this.extractRegionFromTitle(this.getTextContent(entry, 'title')),
                    alertType: this.extractAlertTypeFromTitle(this.getTextContent(entry, 'title'))
                };
                feed.entries.push(alertEntry);
            });

            return feed;
        } catch (error) {
            Utils.ErrorUtils.log(error, 'WeatherAPI.parseAtomFeed');
            throw new Error('Failed to parse weather feed data.');
        }
    }

    /**
     * Parse CAP (Common Alerting Protocol) XML file
     * @param {string} xmlText - XML content
     * @returns {Object}
     */
    parseCapFile(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const alert = {
                identifier: this.getTextContent(xmlDoc, 'identifier'),
                sender: this.getTextContent(xmlDoc, 'sender'),
                sent: this.getTextContent(xmlDoc, 'sent'),
                status: this.getTextContent(xmlDoc, 'status'),
                msgType: this.getTextContent(xmlDoc, 'msgType'),
                scope: this.getTextContent(xmlDoc, 'scope'),
                info: {}
            };

            // Parse info section
            const infoElement = xmlDoc.querySelector('info');
            if (infoElement) {
                alert.info = {
                    category: this.getTextContent(infoElement, 'category'),
                    event: this.getTextContent(infoElement, 'event'),
                    responseType: this.getTextContent(infoElement, 'responseType'),
                    urgency: this.getTextContent(infoElement, 'urgency'),
                    severity: this.getTextContent(infoElement, 'severity'),
                    certainty: this.getTextContent(infoElement, 'certainty'),
                    expires: this.getTextContent(infoElement, 'expires'),
                    senderName: this.getTextContent(infoElement, 'senderName'),
                    headline: this.getTextContent(infoElement, 'headline'),
                    description: this.getTextContent(infoElement, 'description'),
                    instruction: this.getTextContent(infoElement, 'instruction'),
                    web: this.getTextContent(infoElement, 'web'),
                    contact: this.getTextContent(infoElement, 'contact'),
                    areas: []
                };

                // Parse area information
                const areas = infoElement.querySelectorAll('area');
                areas.forEach(area => {
                    const areaInfo = {
                        areaDesc: this.getTextContent(area, 'areaDesc'),
                        polygons: [],
                        geocodes: []
                    };

                    // Parse polygons
                    const polygons = area.querySelectorAll('polygon');
                    polygons.forEach(polygon => {
                        areaInfo.polygons.push(polygon.textContent.trim());
                    });

                    // Parse geocodes
                    const geocodes = area.querySelectorAll('geocode');
                    geocodes.forEach(geocode => {
                        areaInfo.geocodes.push({
                            valueName: this.getTextContent(geocode, 'valueName'),
                            value: this.getTextContent(geocode, 'value')
                        });
                    });

                    alert.info.areas.push(areaInfo);
                });
            }

            return alert;
        } catch (error) {
            Utils.ErrorUtils.log(error, 'WeatherAPI.parseCapFile');
            throw new Error('Failed to parse alert details.');
        }
    }

    /**
     * Extract severity level from alert title
     * @param {string} title - Alert title
     * @returns {string}
     */
    extractSeverityFromTitle(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('extreme')) return 'extreme';
        if (titleLower.includes('severe')) return 'severe';
        if (titleLower.includes('moderate')) return 'moderate';
        if (titleLower.includes('minor')) return 'minor';
        
        // Default based on alert type
        if (titleLower.includes('warning')) return 'severe';
        if (titleLower.includes('advisory')) return 'moderate';
        if (titleLower.includes('watch')) return 'minor';
        
        return 'moderate';
    }

    /**
     * Extract region from alert title
     * @param {string} title - Alert title
     * @returns {string}
     */
    extractRegionFromTitle(title) {
        const regionPatterns = [
            { pattern: /Region (\d+[A-B]?)/i, format: 'Region $1' },
            { pattern: /NCR/i, format: 'NCR' },
            { pattern: /CAR/i, format: 'CAR' },
            { pattern: /BARMM/i, format: 'BARMM' },
            { pattern: /CALABARZON/i, format: 'CALABARZON' },
            { pattern: /MIMAROPA/i, format: 'MIMAROPA' },
            { pattern: /Ilocos Region/i, format: 'Ilocos Region' },
            { pattern: /Cagayan Valley/i, format: 'Cagayan Valley' },
            { pattern: /Central Luzon/i, format: 'Central Luzon' },
            { pattern: /Bicol Region/i, format: 'Bicol Region' },
            { pattern: /Western Visayas/i, format: 'Western Visayas' },
            { pattern: /Central Visayas/i, format: 'Central Visayas' },
            { pattern: /Eastern Visayas/i, format: 'Eastern Visayas' },
            { pattern: /Zamboanga Peninsula/i, format: 'Zamboanga Peninsula' },
            { pattern: /Northern Mindanao/i, format: 'Northern Mindanao' },
            { pattern: /Davao Region/i, format: 'Davao Region' },
            { pattern: /SOCCSKSARGEN/i, format: 'SOCCSKSARGEN' },
            { pattern: /Caraga/i, format: 'Caraga' },
            { pattern: /Cordillera Administrative Region/i, format: 'CAR' },
            { pattern: /Bangsamoro Autonomous Region/i, format: 'BARMM' }
        ];

        for (const { pattern, format } of regionPatterns) {
            const match = title.match(pattern);
            if (match) {
                return format.replace('$1', match[1] || '');
            }
        }

        return 'Unknown Region';
    }

    /**
     * Extract alert type from title
     * @param {string} title - Alert title
     * @returns {string}
     */
    extractAlertTypeFromTitle(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('gfa') || titleLower.includes('flood advisory')) return 'Flood Advisory';
        if (titleLower.includes('tropical cyclone')) return 'Tropical Cyclone';
        if (titleLower.includes('rainfall warning')) return 'Rainfall Warning';
        if (titleLower.includes('thunderstorm')) return 'Thunderstorm Advisory';
        if (titleLower.includes('wind warning')) return 'Wind Warning';
        if (titleLower.includes('storm surge')) return 'Storm Surge Warning';
        
        return 'Weather Advisory';
    }

    /**
     * Get text content from XML element
     * @param {Element} parent - Parent element
     * @param {string} selector - Element selector
     * @returns {string}
     */
    getTextContent(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Check if cache is valid
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    isCacheValid(key) {
        if (!this.cache.has(key)) return false;
        
        const cached = this.cache.get(key);
        return (Date.now() - cached.timestamp) < this.cacheTimeout;
    }

    /**
     * Fetch with retry logic
     * @param {string} url - URL to fetch
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, attempt = 1) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/xml, text/xml, */*',
                    'Cache-Control': 'no-cache'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (attempt < this.retryAttempts) {
                console.warn(`Fetch attempt ${attempt} failed, retrying...`);
                await this.delay(this.retryDelay * attempt);
                return this.fetchWithRetry(url, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            timeout: this.cacheTimeout
        };
    }
}

// Statistics and analytics functions
class WeatherAnalytics {
    constructor() {
        this.alerts = [];
    }

    /**
     * Set alerts data for analysis
     * @param {Array} alerts - Array of alert objects
     */
    setAlerts(alerts) {
        this.alerts = alerts;
    }

    /**
     * Get alert statistics
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.alerts.length,
            severe: 0,
            moderate: 0,
            minor: 0,
            regions: new Set(),
            alertTypes: {},
            recentAlerts: 0
        };

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        this.alerts.forEach(alert => {
            // Count by severity
            switch (alert.severity) {
                case 'extreme':
                case 'severe':
                    stats.severe++;
                    break;
                case 'moderate':
                    stats.moderate++;
                    break;
                case 'minor':
                    stats.minor++;
                    break;
            }

            // Count regions
            stats.regions.add(alert.region);

            // Count alert types
            stats.alertTypes[alert.alertType] = (stats.alertTypes[alert.alertType] || 0) + 1;

            // Count recent alerts
            if (new Date(alert.updated) > oneDayAgo) {
                stats.recentAlerts++;
            }
        });

        stats.regions = stats.regions.size;
        return stats;
    }

    /**
     * Get alerts by region
     * @returns {Object}
     */
    getAlertsByRegion() {
        return Utils.ArrayUtils.groupBy(this.alerts, 'region');
    }

    /**
     * Get alerts by severity
     * @returns {Object}
     */
    getAlertsBySeverity() {
        return Utils.ArrayUtils.groupBy(this.alerts, 'severity');
    }

    /**
     * Get alerts by type
     * @returns {Object}
     */
    getAlertsByType() {
        return Utils.ArrayUtils.groupBy(this.alerts, 'alertType');
    }

    /**
     * Get timeline data for charts
     * @param {number} hours - Number of hours to include
     * @returns {Array}
     */
    getTimelineData(hours = 24) {
        const now = new Date();
        const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
        
        const timeline = [];
        for (let i = 0; i < hours; i++) {
            const hourStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            
            const alertsInHour = this.alerts.filter(alert => {
                const alertTime = new Date(alert.updated);
                return alertTime >= hourStart && alertTime < hourEnd;
            });

            timeline.push({
                hour: hourStart.getHours(),
                count: alertsInHour.length,
                alerts: alertsInHour
            });
        }

        return timeline;
    }
}

// Create global instances
window.WeatherAPI = new WeatherAPI();
window.WeatherAnalytics = new WeatherAnalytics();

