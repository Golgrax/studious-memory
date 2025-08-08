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


            // Setup the theme toggle
            this.setupThemeToggle();

            Chart.defaults.color = Utils.Storage.get('theme') === 'dark' ? '#d1d5db' : '#6b7280';
            
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

        const backToTopButton = Utils.DOM.get('back-to-top');
        if (backToTopButton) {
            window.onscroll = () => {
                if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                    backToTopButton.style.display = 'flex';
                } else {
                    backToTopButton.style.display = 'none';
                }
            };
            backToTopButton.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
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

    setupThemeToggle() {
        const toggle = Utils.DOM.get('dark-mode-toggle');
        if (!toggle) return;

        const currentTheme = Utils.Storage.get('theme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            toggle.checked = true;
        }
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                Utils.Storage.set('theme', 'dark');
                if (this.state.weatherMap) {
                    this.state.weatherMap.removeLayer(this.lightMap);
                    this.state.weatherMap.addLayer(this.darkMap);
                }
            } else {
                document.body.classList.remove('dark-mode');
                Utils.Storage.set('theme', 'light');
                if (this.state.weatherMap) {
                    this.state.weatherMap.removeLayer(this.darkMap);
                    this.state.weatherMap.addLayer(this.lightMap);
                }
            }
            this.updateCharts();
        });
    }

    initializeCharts() {
        this.charts = {}; // Reset charts object

        const createChartConfig = (type, title) => ({
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: title,
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: type === 'pie' ? 'top' : 'none',
                    labels: {
                        // This tells the legend (e.g., in the pie chart) to use light text
                        color: '#d1d5db' // Corresponds to var(--gray-500)
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    ticks: { color: '#9ca3af' }, // var(--gray-400)
                    grid: { color: 'rgba(156, 163, 175, 0.1)' }
                },
                x: {
                    ticks: { color: '#9ca3af' }, // var(--gray-400)
                    grid: { color: 'rgba(156, 163, 175, 0.1)' }
                }
            }
        }
        });

        const getCanvasContext = (id) => {
            const canvas = Utils.DOM.get(id);
            return canvas ? canvas.getContext('2d') : null;
        };

        const regionCtx = getCanvasContext('region-canvas');
        if (regionCtx) {
            this.charts.region = new Chart(regionCtx, createChartConfig('bar', 'Alerts by Region'));
        }

        const severityCtx = getCanvasContext('severity-canvas');
        if (severityCtx) {
            this.charts.severity = new Chart(severityCtx, createChartConfig('pie', 'Alerts by Severity'));
        }
        
        const timelineCtx = getCanvasContext('timeline-canvas');
        if (timelineCtx) {
            this.charts.timeline = new Chart(timelineCtx, createChartConfig('line', 'Alerts in last 24H'));
        }

        const patternCtx = getCanvasContext('pattern-canvas');
        if (patternCtx) {
            this.charts.pattern = new Chart(patternCtx, createChartConfig('bar', 'Alerts by Type'));
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
        this.checkCriticalAlerts();
    }

    updateStats() {
        const stats = this.analytics.getStats();
        
        // Update stat cards
        const totalCount = Utils.DOM.get('total-count');
        const severeCount = Utils.DOM.get('severe-count');
        const moderateCount = Utils.DOM.get('moderate-count');
        const minorCount = Utils.DOM.get('minor-count');
        const regionsCount = Utils.DOM.get('regions-count');

        if (totalCount) totalCount.textContent = stats.total;
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
        const severityClass = alert.severity || 'moderate';

        const card = Utils.DOM.create('div', {
            className: `alert-card ${severityClass}`,
            'data-alert-id': alert.id
        });
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

    const createDetailItem = (icon, label, value) => `
        <div class="alert-detail-item">
            <i class="fas fa-${icon}"></i>
            <div class="alert-detail-item-content">
                <div class="label">${label}</div>
                <div class="value">${Utils.String.capitalize(value || 'N/A')}</div>
            </div>
        </div>
    `;

    // --- NEW PARSING LOGIC START ---
    let mainDescription = '';
    let watercoursesHTML = '';
    if (info.description) {
        const separator = 'WATERCOURSES LIKELY TO BE AFFECTED :';
        const parts = info.description.split(separator);
        mainDescription = `<p class="alert-detail-main-desc">${parts[0].trim()}</p>`;

        if (parts[1]) {
            const watercourses = parts[1].trim().split('+').filter(line => line.trim());
            watercoursesHTML = `
                <ul class="watercourses-list">
                    ${watercourses.map(line => {
                        // Replace **Province** with <strong>Province</strong>
                        const formattedLine = line.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        return `<li class="watercourses-item">${formattedLine}</li>`;
                    }).join('')}
                </ul>
            `;
        }
    }

    // Format instructions text to make specific parts bold
    let instructionHTML = info.instruction || '';
    instructionHTML = instructionHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // --- NEW PARSING LOGIC END ---

    container.innerHTML = `
        <div class="alert-detail-grid">
            ${createDetailItem('shield-alt', 'Severity', info.severity || alert.severity)}
            ${createDetailItem('bullhorn', 'Urgency', info.urgency || 'Unknown')}
            ${createDetailItem('check-circle', 'Certainty', info.certainty || 'Unknown')}
            ${createDetailItem('tag', 'Event', info.event || alert.alertType)}
        </div>
        
        <div class="alert-detail-section">
            <h3 class="alert-detail-section-title"><i class="fas fa-info-circle"></i> Description</h3>
            <div class="alert-detail-description">
                ${mainDescription}
                ${watercoursesHTML}
            </div>
            </div>
            
            ${instructionHTML ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title"><i class="fas fa-directions"></i> Instructions</h3>
                    <div class="alert-detail-instruction">${instructionHTML}</div>
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

        // Chart Colors
        const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        const severityColors = {
            extreme: '#dc2626',
            severe: '#ea580c',
            moderate: '#d97706',
            minor: '#16a34a'
        };
        
        // 1. Region Chart (Bar)
        if (this.charts.region) {
            const regionLabels = Object.keys(regionData).slice(0, 10);
            const regionValues = regionLabels.map(region => regionData[region].length);
            
            this.charts.region.data.labels = regionLabels;
            this.charts.region.data.datasets[0].data = regionValues;
            this.charts.region.data.datasets[0].backgroundColor = regionLabels.map((_, i) => chartColors[i % chartColors.length]);
            this.charts.region.update();
        }

        // 2. Severity Chart (Pie)
        if (this.charts.severity) {
            const severityLabels = Object.keys(severityData);
            const severityValues = severityLabels.map(severity => severityData[severity].length);
            
            this.charts.severity.data.labels = severityLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1));
            this.charts.severity.data.datasets[0].data = severityValues;
            this.charts.severity.data.datasets[0].backgroundColor = severityLabels.map(s => severityColors[s] || '#6b7280');
            this.charts.severity.update();
        }
        
        // 3. Timeline Chart (Line)
        if (this.charts.timeline) {
            const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
            const hourlyData = Array(24).fill(0);
            
            this.state.alerts.forEach(alert => {
                const alertHour = new Date(alert.updated).getHours();
                hourlyData[alertHour]++;
            });

            this.charts.timeline.data.labels = hours;
            this.charts.timeline.data.datasets[0].data = hourlyData;
            this.charts.timeline.data.datasets[0].borderColor = chartColors[0];
            this.charts.timeline.data.datasets[0].backgroundColor = 'rgba(59, 130, 246, 0.1)';
            this.charts.timeline.data.datasets[0].fill = true;
            this.charts.timeline.update();
        }

        // 4. Alert Type Chart (Bar)
        if (this.charts.pattern) {
            const typeLabels = Object.keys(stats.alertTypes);
            const typeValues = typeLabels.map(type => stats.alertTypes[type]);
            
            this.charts.pattern.data.labels = typeLabels;
            this.charts.pattern.data.datasets[0].data = typeValues;
            this.charts.pattern.data.datasets[0].backgroundColor = typeLabels.map((_, i) => chartColors[i % chartColors.length]);
            this.charts.pattern.update();
        }
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

