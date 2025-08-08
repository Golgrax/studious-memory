// Bayanihan Weather Alert - Main Application

/**
 * Main application controller
 */

class BayanihanWeatherApp {
    constructor() {
        this.alerts = [];
        this.filteredAlerts = [];
        this.currentFilters = {
            region: '',
            severity: '',
            search: ''
        };
        this.updateInterval = null;
        this.isLoading = false;
        this.weatherMap = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadAlerts = this.loadAlerts.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        // this.handleFilterChange = this.handleFilterChange.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Bayanihan Weather Alert System...');
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize components
            await this.initializeComponents();
            
            // Load initial data
            await this.loadAlerts();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            console.log('Application initialized successfully');
        } catch (error) {
            Utils.ErrorUtils.log(error, 'BayanihanWeatherApp.init');
            Utils.ErrorUtils.showMessage('Failed to initialize the application. Please refresh the page.', 'error');
        }
    }

    /**
     * Setup event listeners
     */
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
        const bannerClose = Utils.DOM.query('.banner-close');
        if (bannerClose) {
            bannerClose.addEventListener('click', () => {
                const banner = Utils.DOM.get('critical-banner');
                Utils.DOM.hide(banner);
            });
        }
        
        // Region selection from map
        document.addEventListener('regionSelected', (event) => {
            this.handleRegionSelection(event.detail);
        });
        
        // Window resize
        window.addEventListener('resize', Utils.EventUtils.throttle(() => {
            if (this.weatherMap) {
                this.weatherMap.resize();
            }
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

    /**
     * Setup navigation
     */
    setupNavigation() {
        const navToggle = Utils.DOM.query('.nav-toggle');
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

    /**
     * Setup filter controls
     */
    setupFilters() {
        const regionFilter = Utils.DOM.get('region-filter');
        const severityFilter = Utils.DOM.get('severity-filter');
        const searchInput = Utils.DOM.get('alert-search');
        const resetBtn = Utils.DOM.get('reset-filters');
        
        // Debounced filter handlers
        const debouncedFilter = Utils.EventUtils.debounce(() => {
            this.applyFilters();
        }, 300);
        
        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.currentFilters.region = e.target.value;
                debouncedFilter();
            });
        }
        
        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                this.currentFilters.severity = e.target.value;
                debouncedFilter();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                debouncedFilter();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    /**
     * Setup view toggle
     */
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

    /**
     * Setup modal controls
     */
    setupModal() {
        const modal = Utils.DOM.get('alert-modal');
        const modalClose = Utils.DOM.id('modal-close');
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

    /**
     * Initialize components
     */
    async initializeComponents() {
        // Initialize weather map
        this.weatherMap = new WeatherMap('weather-map');
        await this.weatherMap.init();
        
        // Load saved filters
        this.loadSavedFilters();
    }

    /**
     * Load weather alerts
     * @param {boolean} useCache - Whether to use cached data
     */
    async loadAlerts(useCache = true) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        this.updateConnectionStatus('connecting');
        
        try {
            const feedData = await WeatherAPI.fetchAlerts(useCache);
            this.alerts = feedData.entries || [];
            
            // Update analytics
            WeatherAnalytics.setAlerts(this.alerts);
            
            // Apply current filters
            this.applyFilters();
            
            // Update display
            this.updateDisplay();
            
            // Update last refresh time
            this.updateLastRefreshTime();
            
            // Update connection status
            this.updateConnectionStatus('connected');
            
            console.log(`Loaded ${this.alerts.length} weather alerts`);
            
        } catch (error) {
            Utils.ErrorUtils.log(error, 'BayanihanWeatherApp.loadAlerts');
            this.updateConnectionStatus('error');
            
            if (this.alerts.length === 0) {
                Utils.ErrorUtils.showMessage('Unable to load weather alerts. Please check your internet connection.', 'error');
            }
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Apply current filters to alerts
     */
    applyFilters() {
        let filtered = [...this.alerts];
        
        // Region filter
        if (this.currentFilters.region) {
            filtered = filtered.filter(alert => 
                alert.region.toLowerCase().includes(this.currentFilters.region.toLowerCase()) ||
                alert.title.toLowerCase().includes(this.currentFilters.region.toLowerCase())
            );
        }
        
        // Severity filter
        if (this.currentFilters.severity) {
            filtered = filtered.filter(alert => 
                alert.severity === this.currentFilters.severity
            );
        }
        
        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(alert => 
                alert.title.toLowerCase().includes(searchTerm) ||
                alert.region.toLowerCase().includes(searchTerm) ||
                alert.alertType.toLowerCase().includes(searchTerm)
            );
        }
        
        this.filteredAlerts = filtered;
        this.updateAlertsDisplay();
        
        // Save filters
        this.saveFilters();
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.currentFilters = {
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

    /**
     * Update main display
     */
    updateDisplay() {
        this.updateStats();
        this.updateAlertsDisplay();
        this.updateMap();
        this.updateCharts();
        this.checkCriticalAlerts();
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = WeatherAnalytics.getStats();
        
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

    /**
     * Update alerts display
     */
    updateAlertsDisplay() {
        const container = Utils.DOM.get('alerts-container');
        const noAlertsState = Utils.DOM.get('no-alerts');
        
        if (!container) return;
        
        // Show/hide no alerts state
        if (this.filteredAlerts.length === 0) {
            Utils.DOM.hide(container);
            Utils.DOM.show(noAlertsState);
            return;
        }
        
        Utils.DOM.show(container);
        Utils.DOM.hide(noAlertsState);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create alert cards
        this.filteredAlerts.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            container.appendChild(alertCard);
        });
    }

    /**
     * Create alert card element
     * @param {Object} alert - Alert data
     * @returns {HTMLElement}
     */
    createAlertCard(alert) {
        const card = Utils.DOM.create('div', {
            className: 'alert-card',
            'data-alert-id': alert.id
        });
        
        const severityClass = alert.severity || 'moderate';
        const timeAgo = Utils.DateUtils.getRelativeTime(alert.updated);
        const alertType = alert.alertType || 'Weather Advisory';
        
        card.innerHTML = `
            <div class="alert-card-header">
                <div class="alert-severity-badge ${severityClass}">
                    ${Utils.StringUtils.capitalize(severityClass)}
                </div>
                <h3 class="alert-title">${Utils.StringUtils.truncate(alert.title, 80)}</h3>
                <div class="alert-meta">
                    <div class="alert-time">
                        <span>🕒</span>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="alert-region">
                        <span>📍</span>
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
                    Updated: ${Utils.DateUtils.formatDateTime(alert.updated)}
                </div>
                <button class="alert-view-btn" data-alert-id="${alert.id}">
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

    /**
     * Show alert details in modal
     * @param {Object} alert - Alert data
     */
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
            // Fetch detailed information
            const alertDetails = await WeatherAPI.fetchAlertDetails(alert.link);
            
            // Update modal content
            modalBody.innerHTML = this.createAlertDetailsContent(alert, alertDetails);
            
        } catch (error) {
            Utils.ErrorUtils.log(error, 'BayanihanWeatherApp.showAlertDetails');
            modalBody.innerHTML = `
                <div class="alert-detail-error">
                    <h3>Unable to Load Details</h3>
                    <p>Sorry, we couldn't load the detailed information for this alert. Please try again or visit the PAGASA website directly.</p>
                </div>
            `;
        }
    }

    /**
     * Create alert details content
     * @param {Object} alert - Basic alert data
     * @param {Object} details - Detailed alert data
     * @returns {string}
     */
    createAlertDetailsContent(alert, details) {
        const info = details.info || {};
        const areas = info.areas || [];
        
        return `
            <div class="alert-detail-header">
                <div class="alert-detail-meta">
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Severity</div>
                        <div class="alert-detail-meta-value">${Utils.StringUtils.capitalize(info.severity || alert.severity)}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Urgency</div>
                        <div class="alert-detail-meta-value">${Utils.StringUtils.capitalize(info.urgency || 'Unknown')}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Certainty</div>
                        <div class="alert-detail-meta-value">${Utils.StringUtils.capitalize(info.certainty || 'Unknown')}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Response</div>
                        <div class="alert-detail-meta-value">${Utils.StringUtils.capitalize(info.responseType || 'Monitor')}</div>
                    </div>
                </div>
            </div>
            
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
            
            ${areas.length > 0 ? `
                <div class="alert-detail-section">
                    <h3 class="alert-detail-section-title">Affected Areas</h3>
                    <div class="alert-detail-areas">
                        ${areas.map(area => `
                            <div class="alert-detail-area">
                                <div class="alert-detail-area-name">${area.areaDesc}</div>
                                ${area.polygons.length > 0 ? `
                                    <div class="alert-detail-area-coords">
                                        Geographic coordinates available
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="alert-detail-section">
                <h3 class="alert-detail-section-title">Alert Information</h3>
                <div class="alert-detail-meta">
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Issued</div>
                        <div class="alert-detail-meta-value">${Utils.DateUtils.formatDateTime(details.sent || alert.updated)}</div>
                    </div>
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Sender</div>
                        <div class="alert-detail-meta-value">${info.senderName || details.sender || 'PAGASA-DOST'}</div>
                    </div>
                    ${info.expires ? `
                        <div class="alert-detail-meta-item">
                            <div class="alert-detail-meta-label">Expires</div>
                            <div class="alert-detail-meta-value">${Utils.DateUtils.formatDateTime(info.expires)}</div>
                        </div>
                    ` : ''}
                    <div class="alert-detail-meta-item">
                        <div class="alert-detail-meta-label">Status</div>
                        <div class="alert-detail-meta-value">${Utils.StringUtils.capitalize(details.status || 'Active')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update map with current alerts
     */
    updateMap() {
        if (this.weatherMap) {
            this.weatherMap.updateAlerts(this.alerts);
        }
    }

    /**
     * Update analytics charts
     */
    updateCharts() {
        const stats = WeatherAnalytics.getStats();
        const regionData = WeatherAnalytics.getAlertsByRegion();
        const severityData = WeatherAnalytics.getAlertsBySeverity();
        const timelineData = WeatherAnalytics.getTimelineData(24);
        
        // Region chart
        if (Object.keys(regionData).length > 0) {
            const regionLabels = Object.keys(regionData).slice(0, 8); // Top 8 regions
            const regionValues = regionLabels.map(region => regionData[region].length);
            
            WeatherCharts.createBarChart('region-canvas', {
                labels: regionLabels,
                values: regionValues
            }, {
                title: 'Alerts by Region',
                colors: regionValues.map((_, index) => WeatherCharts.getDefaultColor(index))
            });
        }
        
        // Severity chart
        if (Object.keys(severityData).length > 0) {
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
            
            WeatherCharts.createPieChart('severity-canvas', {
                labels: severityLabels.map(s => Utils.StringUtils.capitalize(s)),
                values: severityValues
            }, {
                title: 'Severity Distribution',
                colors: severityColors
            });
        }
        
        // Timeline chart
        if (timelineData.length > 0) {
            const timelineLabels = timelineData.map(item => `${item.hour}:00`);
            const timelineValues = timelineData.map(item => item.count);
            
            WeatherCharts.createLineChart('timeline-canvas', {
                labels: timelineLabels,
                values: timelineValues
            }, {
                title: '24-Hour Alert Timeline',
                color: '#3b82f6'
            });
        }
        
        // Pattern analysis (simplified)
        const patternData = {
            labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
            values: [0, 0, 0, 0]
        };
        
        this.alerts.forEach(alert => {
            const hour = new Date(alert.updated).getHours();
            if (hour >= 6 && hour < 12) patternData.values[0]++;
            else if (hour >= 12 && hour < 18) patternData.values[1]++;
            else if (hour >= 18 && hour < 24) patternData.values[2]++;
            else patternData.values[3]++;
        });
        
        WeatherCharts.createBarChart('pattern-canvas', patternData, {
            title: 'Alert Patterns by Time of Day',
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e']
        });
    }

    /**
     * Check for critical alerts and show banner
     */
    checkCriticalAlerts() {
        const criticalAlerts = this.alerts.filter(alert => 
            alert.severity === 'extreme' || alert.severity === 'severe'
        );
        
        const banner = Utils.DOM.get('critical-banner');
        const message = Utils.DOM.get('critical-message');
        
        if (criticalAlerts.length > 0 && banner && message) {
            const alertText = criticalAlerts.length === 1 
                ? `${criticalAlerts[0].title}`
                : `${criticalAlerts.length} severe weather alerts are currently active.`;
            
            message.textContent = alertText;
            Utils.DOM.show(banner);
        }
    }

    /**
     * Handle region selection from map
     * @param {Object} regionData - Selected region data
     */
    handleRegionSelection(regionData) {
        const { regionName, alerts } = regionData;
        
        // Update region filter
        const regionFilter = Utils.DOM.get('region-filter');
        if (regionFilter) {
            // Find matching option
            const options = regionFilter.querySelectorAll('option');
            for (const option of options) {
                if (option.textContent.toLowerCase().includes(regionName.toLowerCase())) {
                    regionFilter.value = option.value;
                    this.currentFilters.region = option.value;
                    break;
                }
            }
        }
        
        // Apply filters and scroll to alerts section
        this.applyFilters();
        
        const alertsSection = Utils.DOM.get('alerts');
        if (alertsSection) {
            alertsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingState = Utils.DOM.get('alerts-loading');
        const refreshBtn = Utils.DOM.get('refresh-alerts');
        
        Utils.DOM.show(loadingState);
        
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingState = Utils.DOM.get('alerts-loading');
        const refreshBtn = Utils.DOM.get('refresh-alerts');
        
        Utils.DOM.hide(loadingState);
        
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }

    /**
     * Update connection status
     * @param {string} status - Connection status (connected, connecting, error)
     */
    updateConnectionStatus(status) {
        const statusDot = Utils.DOM.get('connection-status');
        const statusText = Utils.DOM.get('status-text');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            switch (status) {
                case 'connected':
                    statusText.textContent = 'Connected';
                    break;
                case 'connecting':
                    statusText.textContent = 'Updating...';
                    break;
                case 'error':
                    statusText.textContent = 'Connection Error';
                    break;
                default:
                    statusText.textContent = 'Unknown';
            }
        }
    }

    /**
     * Update last refresh time
     */
    updateLastRefreshTime() {
        const lastUpdateElement = Utils.DOM.get('last-update-time');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = Utils.DateUtils.formatTime(now);
            lastUpdateElement.setAttribute('datetime', now.toISOString());
        }
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Refresh every 15 minutes
        this.updateInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadAlerts(false);
            }
        }, 15 * 60 * 1000);
    }

    /**
     * Pause auto-refresh
     */
    pauseAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Resume auto-refresh
     */
    resumeAutoRefresh() {
        if (!this.updateInterval) {
            this.startAutoRefresh();
        }
    }

    /**
     * Save current filters to localStorage
     */
    saveFilters() {
        Utils.StorageUtils.set('weather-filters', this.currentFilters);
    }

    /**
     * Load saved filters from localStorage
     */
    loadSavedFilters() {
        const savedFilters = Utils.StorageUtils.get('weather-filters', {});
        
        this.currentFilters = {
            region: savedFilters.region || '',
            severity: savedFilters.severity || '',
            search: savedFilters.search || ''
        };
        
        // Update form controls
        const regionFilter = Utils.DOM.get('region-filter');
        const severityFilter = Utils.DOM.get('severity-filter');
        const searchInput = Utils.DOM.get('alert-search');
        
        if (regionFilter && this.currentFilters.region) {
            regionFilter.value = this.currentFilters.region;
        }
        if (severityFilter && this.currentFilters.severity) {
            severityFilter.value = this.currentFilters.severity;
        }
        if (searchInput && this.currentFilters.search) {
            searchInput.value = this.currentFilters.search;
        }
    }

    /**
     * Destroy the application
     */
    destroy() {
        // Clear intervals
        this.pauseAutoRefresh();
        
        // Destroy components
        if (this.weatherMap) {
            this.weatherMap.destroy();
        }
        
        WeatherCharts.destroy();
        
        // Clear cache
        WeatherAPI.clearCache();
        
        console.log('Application destroyed');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bayanihanApp = new BayanihanWeatherApp();
    window.bayanihanApp.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.bayanihanApp) {
        window.bayanihanApp.destroy();
    }
});

