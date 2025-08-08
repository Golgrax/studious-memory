// Bayanihan Weather Alert - Modern JavaScript Application

// Application State
class AppState {
    constructor() {
        this.alerts = [];
        this.filteredAlerts = [];
        this.currentFilters = {
            region: '',
            severity: '',
            search: ''
        };
        this.isLoading = false;
        this.lastUpdate = null;
        this.updateInterval = null;
        this.weatherMap = null;
        this.mapLayers = [];
    }
}

// Utility Functions
const Utils = {
    // DOM utilities
    DOM: {
        get: (id) => document.getElementById(id),
        query: (selector) => document.querySelector(selector),
        queryAll: (selector) => document.querySelectorAll(selector),
        create: (tag, attributes = {}, content = '') => {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            if (content) element.textContent = content;
            return element;
        },
        show: (element) => {
            if (element) {
                element.style.display = '';
                element.classList.remove('hidden');
            }
        },
        hide: (element) => {
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        }
    },

    // Date utilities
    Date: {
        formatDate: (date) => {
            const d = new Date(date);
            return d.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        formatTime: (date) => {
            const d = new Date(date);
            return d.toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        },
        formatDateTime: (date) => {
            const d = new Date(date);
            return d.toLocaleString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        },
        getRelativeTime: (date) => {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            return Utils.Date.formatDate(date);
        }
    },

    // String utilities
    String: {
        capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
        truncate: (str, length = 100) => {
            if (str.length <= length) return str;
            return str.substring(0, length).trim() + '...';
        },
        stripHtml: (str) => {
            const div = document.createElement('div');
            div.innerHTML = str;
            return div.textContent || div.innerText || '';
        }
    },

    // Event utilities
    Event: {
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        throttle: (func, limit) => {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },

    // Storage utilities
    Storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
            }
        },
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
            }
        }
    }
};

// Weather API Handler
class WeatherAPI {
    constructor() {
        this.baseUrl = 'https://publicalert.pagasa.dost.gov.ph';
        // Use the relative path to your new serverless function
this.feedUrl = '/api/pagasa-proxy';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

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
            console.error('WeatherAPI.fetchAlerts error:', error);
            
            // Return cached data if available, even if expired
            if (this.cache.has(cacheKey)) {
                console.warn('Using expired cache due to fetch error');
                return this.cache.get(cacheKey).data;
            }
            
            throw new Error('Failed to fetch weather alerts. Please check your internet connection.');
        }
    }

    async fetchAlertDetails(capUrl) {
        const cacheKey = `alert-details-${capUrl}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const proxiedUrl = `/api/pagasa-proxy?url=${encodeURIComponent(capUrl)}`;
            const response = await this.fetchWithRetry(proxiedUrl);
            const xmlText = await response.text();
            const alertDetails = this.parseCapFile(xmlText);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: alertDetails,
                timestamp: Date.now()
            });
            
            return alertDetails;
        } catch (error) {
            console.error('WeatherAPI.fetchAlertDetails error:', error);
            throw new Error('Failed to fetch alert details.');
        }
    }

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
            console.error('WeatherAPI.parseAtomFeed error:', error);
            throw new Error('Failed to parse weather feed data.');
        }
    }

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
            console.error('WeatherAPI.parseCapFile error:', error);
            throw new Error('Failed to parse alert details.');
        }
    }

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

    extractRegionFromTitle(title) {
        const regionPatterns = [
            { pattern: /Region (\d+[A-B]?)/i, format: 'Region $1' },
            { pattern: /NCR/i, format: 'NCR' },
            { pattern: /CAR/i, format: 'CAR' },
            { pattern: /BARMM/i, format: 'BARMM' },
            { pattern: /CALABARZON/i, format: 'CALABARZON' },
            { pattern: /MIMAROPA/i, format: 'MIMAROPA' }
        ];

        for (const { pattern, format } of regionPatterns) {
            const match = title.match(pattern);
            if (match) {
                return format.replace('$1', match[1] || '');
            }
        }

        return 'Philippines';
    }

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

    getTextContent(parent, selector) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }

    isCacheValid(key) {
        if (!this.cache.has(key)) return false;
        
        const cached = this.cache.get(key);
        return (Date.now() - cached.timestamp) < this.cacheTimeout;
    }

    async fetchWithRetry(url, attempt = 1) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/xml, text/xml, */*',
                    'Cache-Control': 'no-cache'
                }
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Weather Analytics
class WeatherAnalytics {
    constructor() {
        this.alerts = [];
    }

    setAlerts(alerts) {
        this.alerts = alerts;
    }

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

    getAlertsByRegion() {
        return this.groupBy(this.alerts, 'region');
    }

    getAlertsBySeverity() {
        return this.groupBy(this.alerts, 'severity');
    }

    groupBy(arr, key) {
        return arr.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }
}

// Simple Chart Implementation
class SimpleChart {
    constructor(canvasId) {
        this.canvas = Utils.DOM.get(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    drawBarChart(data, options = {}) {
        if (!this.ctx) return;

        const { labels, values } = data;
        const { title = '', colors = [] } = options;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set canvas size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        const padding = 40;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;
        const barWidth = chartWidth / labels.length * 0.8;
        const maxValue = Math.max(...values);

        if (maxValue === 0) {
            this.drawNoDataMessage();
            return;
        }

        // Draw bars
        labels.forEach((label, index) => {
            const value = values[index];
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (index * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
            const y = this.canvas.height - padding - barHeight;

            // Draw bar
            this.ctx.fillStyle = colors[index] || '#3b82f6';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            // Draw label
            this.ctx.fillStyle = '#374151';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, x + barWidth / 2, this.canvas.height - padding + 20);

            // Draw value
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });

        // Draw title
        if (title) {
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = 'bold 14px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(title, this.canvas.width / 2, 25);
        }
    }

    drawPieChart(data, options = {}) {
        if (!this.ctx) return;

        const { labels, values } = data;
        const { colors = [] } = options;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set canvas size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        const total = values.reduce((sum, value) => sum + value, 0);

        if (total === 0) {
            this.drawNoDataMessage();
            return;
        }

        let currentAngle = -Math.PI / 2;

        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = colors[index] || `hsl(${index * 60}, 70%, 60%)`;
            this.ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            this.ctx.fillStyle = '#374151';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${labels[index]}: ${value}`, labelX, labelY);

            currentAngle += sliceAngle;
        });
    }

    drawNoDataMessage() {
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No data available', this.canvas.width / 2, this.canvas.height / 2);
    }
}

// Main Application Class
class BayanihanWeatherApp {
    constructor() {
        this.state = new AppState();
        this.weatherAPI = new WeatherAPI();
        this.analytics = new WeatherAnalytics();
        this.charts = {};
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadAlerts = this.loadAlerts.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
    }

    async init() {
        console.log('Initializing Bayanihan Weather Alert System...');
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize charts
            this.initializeCharts();

            // Initialize the map
            this.initializeMap();
            
            // Load initial data
            await this.loadAlerts();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('BayanihanWeatherApp.init error:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Filter controls
        this.setupFilters();
        
        // Refresh button
        const refreshBtn = Utils.DOM.get('refresh-alerts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAlerts(false));
        }
        
        // View toggle
        this.setupViewToggle();
        
        // Modal controls
        this.setupModal();
        
        // Critical banner close
        const bannerClose = Utils.DOM.get('banner-close');
        if (bannerClose) {
            bannerClose.addEventListener('click', () => {
                const banner = Utils.DOM.get('critical-banner');
                Utils.DOM.hide(banner);
            });
        }
        
        // Window resize
        window.addEventListener('resize', Utils.Event.throttle(() => {
            this.updateCharts();
        }, 250));
        
        // Visibility change (for pausing/resuming updates)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRefresh();
            } else {
                this.resumeAutoRefresh();
            }
        });
    }

    setupNavigation() {
        const navToggle = Utils.DOM.get('nav-toggle');
        const navMenu = Utils.DOM.get('nav-menu');
        const navLinks = Utils.DOM.queryAll('.nav-link');
        
        // Mobile menu toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
            });
        }
        
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = Utils.DOM.get(href.substring(1));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        
                        // Update active link
                        navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                        
                        // Close mobile menu
                        if (navMenu) navMenu.classList.remove('active');
                        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }

    setupFilters() {
        const regionFilter = Utils.DOM.get('region-filter');
        const severityFilter = Utils.DOM.get('severity-filter');
        const searchInput = Utils.DOM.get('alert-search');
        const resetBtn = Utils.DOM.get('reset-filters');
        
        // Debounced filter handlers
        const debouncedFilter = Utils.Event.debounce(() => {
            this.applyFilters();
        }, 300);
        
        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.state.currentFilters.region = e.target.value;
                debouncedFilter();
            });
        }
        
        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                this.state.currentFilters.severity = e.target.value;
                debouncedFilter();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.currentFilters.search = e.target.value;
                debouncedFilter();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    setupViewToggle() {
        const viewBtns = Utils.DOM.queryAll('.view-btn');
        const alertsContainer = Utils.DOM.get('alerts-container');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                
                // Update button states
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update container class
                if (alertsContainer) {
                    alertsContainer.className = view === 'list' ? 'alerts-grid list-view' : 'alerts-grid';
                }
            });
        });
    }

    setupModal() {
        const modal = Utils.DOM.get('alert-modal');
        const modalClose = Utils.DOM.get('modal-close');
        const modalCloseBtn = Utils.DOM.get('modal-close-btn');
        const modalOverlay = Utils.DOM.get('modal-overlay');
        
        const closeModal = () => {
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        };
        
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    initializeCharts() {
        this.charts = {
            region: new SimpleChart('region-canvas'),
            severity: new SimpleChart('severity-canvas'),
            timeline: new SimpleChart('timeline-canvas'),
            pattern: new SimpleChart('pattern-canvas')
        };
    }

    initializeMap() {
        // Prevent map from being initialized more than once
        if (this.state.weatherMap) return;

        try {
            // Center of the Philippines
            const mapCenter = [12.8797, 121.7740];
            const mapZoom = 6;

            this.state.weatherMap = L.map('weather-map').setView(mapCenter, mapZoom);

            // Add a tile layer (the map background)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.state.weatherMap);

            console.log('Map initialized successfully');

        } catch (error) {
            console.error('Failed to initialize map:', error);
            const mapContainer = Utils.DOM.get('weather-map');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="text-align: center; color: red;">Could not load map.</p>';
            }
        }
    }

    async loadAlerts(useCache = true) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        this.showLoadingState();
        this.updateConnectionStatus('connecting');
        
        try {
            const feedData = await this.weatherAPI.fetchAlerts(useCache);
            this.state.alerts = feedData.entries || [];
            
            // Update analytics
            this.analytics.setAlerts(this.state.alerts);
            
            // Apply current filters
            this.applyFilters();
            
            // Update display
            this.updateDisplay();
            
            // Update last refresh time
            this.updateLastRefreshTime();
            
            // Update connection status
            this.updateConnectionStatus('connected');
            
            console.log(`Loaded ${this.state.alerts.length} weather alerts`);
            
        } catch (error) {
            console.error('BayanihanWeatherApp.loadAlerts error:', error);
            this.updateConnectionStatus('error');
            
            if (this.state.alerts.length === 0) {
                this.showError('Unable to load weather alerts. Please check your internet connection.');
            }
        } finally {
            this.state.isLoading = false;
            this.hideLoadingState();
        }
    }

    applyFilters() {
        let filtered = [...this.state.alerts];
        
        // Region filter
        if (this.state.currentFilters.region) {
            filtered = filtered.filter(alert => 
                alert.region.toLowerCase().includes(this.state.currentFilters.region.toLowerCase()) ||
                alert.title.toLowerCase().includes(this.state.currentFilters.region.toLowerCase())
            );
        }
        
        // Severity filter
        if (this.state.currentFilters.severity) {
            filtered = filtered.filter(alert => 
                alert.severity === this.state.currentFilters.severity
            );
        }
        
        // Search filter
        if (this.state.currentFilters.search) {
            const searchTerm = this.state.currentFilters.search.toLowerCase();
            filtered = filtered.filter(alert => 
                alert.title.toLowerCase().includes(searchTerm) ||
                alert.region.toLowerCase().includes(searchTerm) ||
                alert.alertType.toLowerCase().includes(searchTerm)
            );
        }
        
        this.state.filteredAlerts = filtered;
        this.updateAlertsDisplay();
        
        // Save filters
        Utils.Storage.set('weather-filters', this.state.currentFilters);
    }

    resetFilters() {
        this.state.currentFilters = {
            region: '',
            severity: '',
            search: ''
        };
        
        // Reset form controls
        const regionFilter = Utils.DOM.get('region-filter');
        const severityFilter = Utils.DOM.get('severity-filter');
        const searchInput = Utils.DOM.get('alert-search');
        
        if (regionFilter) regionFilter.value = '';
        if (severityFilter) severityFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        // Apply filters
        this.applyFilters();
    }

    updateDisplay() {
        this.updateStats();
        this.updateAlertsDisplay();
        this.updateCharts();
        this.updateMapData();
        this.checkCriticalAlerts();
    }

    updateStats() {
        const stats = this.analytics.getStats();
        
        // Update stat cards
        const severeCount = Utils.DOM.get('severe-count');
        const moderateCount = Utils.DOM.get('moderate-count');
        const minorCount = Utils.DOM.get('minor-count');
        const regionsCount = Utils.DOM.get('regions-count');
        
        if (severeCount) severeCount.textContent = stats.severe;
        if (moderateCount) moderateCount.textContent = stats.moderate;
        if (minorCount) minorCount.textContent = stats.minor;
        if (regionsCount) regionsCount.textContent = stats.regions;
    }

    updateAlertsDisplay() {
        const container = Utils.DOM.get('alerts-container');
        const noAlertsState = Utils.DOM.get('no-alerts');
        
        if (!container) return;
        
        // Show/hide no alerts state
        if (this.state.filteredAlerts.length === 0) {
            Utils.DOM.hide(container);
            Utils.DOM.show(noAlertsState);
            return;
        }
        
        Utils.DOM.show(container);
        Utils.DOM.hide(noAlertsState);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create alert cards
        this.state.filteredAlerts.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            container.appendChild(alertCard);
        });
    }

    createAlertCard(alert) {
        const card = Utils.DOM.create('div', {
            className: 'alert-card',
            'data-alert-id': alert.id
        });
        
        const severityClass = alert.severity || 'moderate';
        const timeAgo = Utils.Date.getRelativeTime(alert.updated);
        const alertType = alert.alertType || 'Weather Advisory';
        
        card.innerHTML = `
            <div class="alert-card-header">
                <div class="alert-severity-badge ${severityClass}">
                    ${Utils.String.capitalize(severityClass)}
                </div>
                <h3 class="alert-title">${Utils.String.truncate(alert.title, 80)}</h3>
                <div class="alert-meta">
                    <div class="alert-time">
                        <i class="fas fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="alert-region">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${alert.region}</span>
                    </div>
                </div>
            </div>
            <div class="alert-card-body">
                <div class="alert-description">
                    ${alertType} issued for ${alert.region}. Click to view detailed information and affected areas.
                </div>
            </div>
            <div class="alert-card-footer">
                <div class="alert-expires">
                    Updated: ${Utils.Date.formatDateTime(alert.updated)}
                </div>
                <button class="alert-view-btn" data-alert-id="${alert.id}">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            </div>
        `;
        
        // Add click handlers
        const viewBtn = card.querySelector('.alert-view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAlertDetails(alert);
            });
        }
        
        card.addEventListener('click', () => {
            this.showAlertDetails(alert);
        });
        
        return card;
    }

    async showAlertDetails(alert) {
        const modal = Utils.DOM.get('alert-modal');
        const modalTitle = Utils.DOM.get('modal-title');
        const modalBody = Utils.DOM.get('modal-body');
        const pagasaLink = Utils.DOM.get('modal-pagasa-link');
        
        if (!modal || !modalBody) return;
        
        // Show modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Set title
        if (modalTitle) {
            modalTitle.textContent = alert.title;
        }
        
        // Set PAGASA link
        if (pagasaLink && alert.link) {
            pagasaLink.href = alert.link;
        }
        
        // Show loading state
        modalBody.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading alert details...</p>
            </div>
        `;
        
        try {
            // Try to fetch detailed information
            if (alert.link) {
                const alertDetails = await this.weatherAPI.fetchAlertDetails(alert.link);
                this.renderAlertDetails(modalBody, alert, alertDetails);
            } else {
                this.renderBasicAlertDetails(modalBody, alert);
            }
        } catch (error) {
            console.error('Error loading alert details:', error);
            this.renderBasicAlertDetails(modalBody, alert);
        }
    }

    renderAlertDetails(container, alert, details) {
        const info = details.info || {};
        
        container.innerHTML = `
            <div class="alert-detail-header">
                <div class="alert-detail-meta">
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Severity</div>
                        <div class="alert-detail-meta-value">${Utils.String.capitalize(info.severity || alert.severity)}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Urgency</div>
                        <div class="alert-detail-meta-value">${Utils.String.capitalize(info.urgency || 'Unknown')}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Certainty</div>
                        <div class="alert-detail-meta-value">${Utils.String.capitalize(info.certainty || 'Unknown')}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Event</div>
                        <div class="alert-detail-meta-value">${info.event || alert.alertType}</div>
                    </div>
                </div>
            </div>
            
            ${info.headline ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title">Headline</h3>
                    <div class="alert-detail-description">${info.headline}</div>
                </div>
            ` : ''}
            
            ${info.description ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title">Description</h3>
                    <div class="alert-detail-description">${info.description}</div>
                </div>
            ` : ''}
            
            ${info.instruction ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title">Instructions</h3>
                    <div class="alert-detail-instruction">${info.instruction}</div>
                </div>
            ` : ''}
            
            ${info.areas && info.areas.length > 0 ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title">Affected Areas</h3>
                    <div class="alert-detail-areas">
                        ${info.areas.map(area => `
                            <div class="alert-detail-area">
                                <div class="alert-detail-area-name">${area.areaDesc}</div>
                                ${area.polygons.length > 0 ? `
                                    <div class="alert-detail-area-coords">${area.polygons[0]}</div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    renderBasicAlertDetails(container, alert) {
        container.innerHTML = `
            <div class="alert-detail-header">
                <div class="alert-detail-meta">
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Alert Type</div>
                        <div class="alert-detail-meta-value">${alert.alertType}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Severity</div>
                        <div class="alert-detail-meta-value">${Utils.String.capitalize(alert.severity)}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Region</div>
                        <div class="alert-detail-meta-value">${alert.region}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Updated</div>
                        <div class="alert-detail-meta-value">${Utils.Date.formatDateTime(alert.updated)}</div>
                    </div>
                </div>
            </div>
            
            <div class="alert-detail-section">
                <h3 class="alert-detail-section-title">Alert Information</h3>
                <div class="alert-detail-description">
                    This is a ${alert.alertType.toLowerCase()} with ${alert.severity} severity level issued for ${alert.region}. 
                    For detailed information and instructions, please visit the official PAGASA website.
                </div>
            </div>
        `;
    }

    updateCharts() {
        if (!this.charts) return;

        const stats = this.analytics.getStats();
        const regionData = this.analytics.getAlertsByRegion();
        const severityData = this.analytics.getAlertsBySeverity();

        // Region chart
        if (this.charts.region) {
            const regionLabels = Object.keys(regionData).slice(0, 10); // Top 10 regions
            const regionValues = regionLabels.map(region => regionData[region].length);
            this.charts.region.drawBarChart({
                labels: regionLabels,
                values: regionValues
            }, {
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            });
        }

        // Severity chart
        if (this.charts.severity) {
            const severityLabels = Object.keys(severityData);
            const severityValues = severityLabels.map(severity => severityData[severity].length);
            const severityColors = severityLabels.map(severity => {
                switch (severity) {
                    case 'extreme': return '#dc2626';
                    case 'severe': return '#ea580c';
                    case 'moderate': return '#d97706';
                    case 'minor': return '#16a34a';
                    default: return '#6b7280';
                }
            });
            this.charts.severity.drawPieChart({
                labels: severityLabels,
                values: severityValues
            }, {
                colors: severityColors
            });
        }

        // Timeline chart (simplified)
        if (this.charts.timeline) {
            const hours = Array.from({length: 24}, (_, i) => i);
            const hourlyData = hours.map(hour => {
                const count = this.state.alerts.filter(alert => {
                    const alertHour = new Date(alert.updated).getHours();
                    return alertHour === hour;
                }).length;
                return count;
            });
            
            this.charts.timeline.drawBarChart({
                labels: hours.map(h => `${h}:00`),
                values: hourlyData
            }, {
                colors: ['#3b82f6']
            });
        }

        // Pattern chart (alert types)
        if (this.charts.pattern) {
            const typeLabels = Object.keys(stats.alertTypes);
            const typeValues = typeLabels.map(type => stats.alertTypes[type]);
            this.charts.pattern.drawBarChart({
                labels: typeLabels,
                values: typeValues
            }, {
                colors: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            });
        }
    }


    updateMapData() {
        if (!this.state.weatherMap) return; // Don't run if map isn't initialized

        // 1. Clear previous alert layers from the map
        this.state.mapLayers.forEach(layer => this.state.weatherMap.removeLayer(layer));
        this.state.mapLayers = [];

        // 2. Helper function to determine color based on severity
        const getSeverityColor = (severity) => {
            switch (severity) {
                case 'extreme': return '#dc2626';
                case 'severe': return '#ea580c';
                case 'moderate': return '#d97706';
                case 'minor': return '#16a34a';
                default: return '#6b7280';
            }
        };

        // 3. Loop through the filtered alerts and draw them
        this.state.filteredAlerts.forEach(alert => {
            // We need to fetch the details to get the polygon data
            if (alert.link) {
                const proxiedUrl = `/api/pagasa-proxy?url=${encodeURIComponent(alert.link)}`;
                fetch(proxiedUrl)
                    .then(response => response.text())
                    .then(xmlText => {
                        const details = this.weatherAPI.parseCapFile(xmlText);
                        
                        if (details.info && details.info.areas) {
                            details.info.areas.forEach(area => {
                                if (area.polygons && area.polygons.length > 0) {
                                    area.polygons.forEach(polygonStr => {
                                        // Convert "lat,lon lat,lon" string to array of [lat, lon]
                                        const coordinates = polygonStr.split(' ').map(pair => {
                                            const parts = pair.split(',');
                                            return [parseFloat(parts[0]), parseFloat(parts[1])];
                                        });

                                        // Create a Leaflet polygon
                                        const polygon = L.polygon(coordinates, {
                                            color: getSeverityColor(details.info.severity),
                                            weight: 2,
                                            fillOpacity: 0.5
                                        }).addTo(this.state.weatherMap);

                                        // Add a popup with info
                                        polygon.bindPopup(`<b>${details.info.event}</b><br>${area.areaDesc}`);

                                        // Store the layer so we can remove it later
                                        this.state.mapLayers.push(polygon);
                                    });
                                }
                            });
                        }
                    }).catch(err => console.error("Failed to fetch or draw alert details for map:", err));
            }
        });
    }

    checkCriticalAlerts() {
        const criticalAlerts = this.state.alerts.filter(alert => 
            alert.severity === 'extreme' || alert.severity === 'severe'
        );
        
        if (criticalAlerts.length > 0) {
            const banner = Utils.DOM.get('critical-banner');
            const message = Utils.DOM.get('critical-message');
            
            if (banner && message) {
                message.textContent = `${criticalAlerts.length} critical weather alert${criticalAlerts.length > 1 ? 's' : ''} detected. Please take necessary precautions.`;
                Utils.DOM.show(banner);
            }
        }
    }

    startAutoRefresh() {
        // Refresh every 5 minutes
        this.state.updateInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadAlerts(false);
            }
        }, 5 * 60 * 1000);
    }

    pauseAutoRefresh() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
            this.state.updateInterval = null;
        }
    }

    resumeAutoRefresh() {
        if (!this.state.updateInterval) {
            this.startAutoRefresh();
        }
    }

    showLoadingState() {
        const loadingState = Utils.DOM.get('alerts-loading');
        const refreshBtn = Utils.DOM.get('refresh-alerts');
        
        if (loadingState) Utils.DOM.show(loadingState);
        if (refreshBtn) refreshBtn.classList.add('loading');
    }

    hideLoadingState() {
        const loadingState = Utils.DOM.get('alerts-loading');
        const refreshBtn = Utils.DOM.get('refresh-alerts');
        
        if (loadingState) Utils.DOM.hide(loadingState);
        if (refreshBtn) refreshBtn.classList.remove('loading');
    }

    hideLoadingScreen() {
        const loadingScreen = Utils.DOM.get('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    updateConnectionStatus(status) {
        const statusDot = Utils.DOM.get('connection-status');
        const statusText = Utils.DOM.get('status-text');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            switch (status) {
                case 'connecting':
                    statusText.textContent = 'Connecting...';
                    break;
                case 'connected':
                    statusText.textContent = 'Connected';
                    break;
                case 'error':
                    statusText.textContent = 'Connection Error';
                    break;
            }
        }
    }

    updateLastRefreshTime() {
        const lastUpdateTime = Utils.DOM.get('last-update-time');
        if (lastUpdateTime) {
            const now = new Date();
            lastUpdateTime.textContent = Utils.Date.formatTime(now);
            lastUpdateTime.setAttribute('datetime', now.toISOString());
        }
        this.state.lastUpdate = new Date();
    }

    showError(message) {
        // Simple error display - could be enhanced with a toast system
        console.error(message);
        alert(message);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BayanihanWeatherApp();
    app.init();
    
    // Make app globally available for debugging
    window.weatherApp = app;
});

// Service Worker Registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

