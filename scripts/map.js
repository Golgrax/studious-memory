// Bayanihan Weather Alert - Map Functionality

/**
 * Map functionality for visualizing weather alerts
 * This is a simplified implementation that can be enhanced with actual mapping libraries
 */

class WeatherMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = Utils.DOM.get(containerId);
        this.alerts = [];
        this.regions = this.getPhilippineRegions();
        this.isInitialized = false;
    }

    /**
     * Initialize the map
     */
    async init() {
        if (!this.container) {
            console.error('Map container not found');
            return;
        }

        try {
            await this.createMap();
            this.isInitialized = true;
            console.log('Weather map initialized successfully');
        } catch (error) {
            Utils.ErrorUtils.log(error, 'WeatherMap.init');
            this.showMapError();
        }
    }

    /**
     * Create the map visualization
     */
    async createMap() {
        // Clear existing content
        this.container.innerHTML = '';

        // Create SVG map container
        const mapSvg = this.createSvgMap();
        this.container.appendChild(mapSvg);

        // Add interaction handlers
        this.addMapInteractions();
    }

    /**
     * Create SVG-based map of the Philippines
     * @returns {SVGElement}
     */
    createSvgMap() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 800 600');
        svg.setAttribute('class', 'philippines-map');
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Create simplified regions (this would normally use actual geographic data)
        this.regions.forEach((region, index) => {
            const regionElement = this.createRegionElement(region, index);
            svg.appendChild(regionElement);
        });

        return svg;
    }

    /**
     * Create a region element for the map
     * @param {Object} region - Region data
     * @param {number} index - Region index
     * @returns {SVGElement}
     */
    createRegionElement(region, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'region-group');
        group.setAttribute('data-region', region.code);

        // Create simplified region shape (rectangle for demo)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const cols = 4;
        const rows = Math.ceil(this.regions.length / cols);
        const width = 180;
        const height = 120;
        const x = (index % cols) * (width + 20) + 20;
        const y = Math.floor(index / cols) * (height + 20) + 20;

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', '8');
        rect.setAttribute('class', 'region-shape');
        rect.setAttribute('fill', '#e5e7eb');
        rect.setAttribute('stroke', '#9ca3af');
        rect.setAttribute('stroke-width', '2');

        // Create region label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2 - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'region-label');
        text.setAttribute('fill', '#374151');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '600');
        text.textContent = region.name;

        // Create alert count indicator
        const alertCount = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        alertCount.setAttribute('x', x + width / 2);
        alertCount.setAttribute('y', y + height / 2 + 15);
        alertCount.setAttribute('text-anchor', 'middle');
        alertCount.setAttribute('class', 'alert-count');
        alertCount.setAttribute('fill', '#6b7280');
        alertCount.setAttribute('font-size', '10');
        alertCount.textContent = '0 alerts';

        group.appendChild(rect);
        group.appendChild(text);
        group.appendChild(alertCount);

        return group;
    }

    /**
     * Add map interactions
     */
    addMapInteractions() {
        const regionGroups = this.container.querySelectorAll('.region-group');
        
        regionGroups.forEach(group => {
            const regionCode = group.getAttribute('data-region');
            const regionShape = group.querySelector('.region-shape');
            
            // Hover effects
            group.addEventListener('mouseenter', () => {
                regionShape.setAttribute('fill', '#ddd6fe');
                regionShape.setAttribute('stroke', '#8b5cf6');
                group.style.cursor = 'pointer';
                this.showRegionTooltip(group, regionCode);
            });

            group.addEventListener('mouseleave', () => {
                const alertCount = this.getRegionAlertCount(regionCode);
                const fillColor = this.getRegionColor(alertCount);
                regionShape.setAttribute('fill', fillColor);
                regionShape.setAttribute('stroke', '#9ca3af');
                this.hideRegionTooltip();
            });

            // Click handler
            group.addEventListener('click', () => {
                this.showRegionDetails(regionCode);
            });
        });
    }

    /**
     * Update map with alert data
     * @param {Array} alerts - Array of alert objects
     */
    updateAlerts(alerts) {
        this.alerts = alerts;
        
        if (!this.isInitialized) return;

        // Update each region
        this.regions.forEach(region => {
            this.updateRegionDisplay(region.code);
        });
    }

    /**
     * Update region display based on alerts
     * @param {string} regionCode - Region code
     */
    updateRegionDisplay(regionCode) {
        const regionGroup = this.container.querySelector(`[data-region="${regionCode}"]`);
        if (!regionGroup) return;

        const regionShape = regionGroup.querySelector('.region-shape');
        const alertCountElement = regionGroup.querySelector('.alert-count');
        
        const alertCount = this.getRegionAlertCount(regionCode);
        const maxSeverity = this.getRegionMaxSeverity(regionCode);
        
        // Update color based on severity
        const fillColor = this.getRegionColor(alertCount, maxSeverity);
        regionShape.setAttribute('fill', fillColor);
        
        // Update alert count
        const countText = alertCount === 0 ? 'No alerts' : 
                         alertCount === 1 ? '1 alert' : `${alertCount} alerts`;
        alertCountElement.textContent = countText;
        
        // Add severity indicator
        if (maxSeverity && alertCount > 0) {
            regionShape.setAttribute('stroke', this.getSeverityColor(maxSeverity));
            regionShape.setAttribute('stroke-width', '3');
        } else {
            regionShape.setAttribute('stroke', '#9ca3af');
            regionShape.setAttribute('stroke-width', '2');
        }
    }

    /**
     * Get alert count for a region
     * @param {string} regionCode - Region code
     * @returns {number}
     */
    getRegionAlertCount(regionCode) {
        const regionName = this.getRegionName(regionCode);
        return this.alerts.filter(alert => 
            alert.region.toLowerCase().includes(regionName.toLowerCase()) ||
            alert.title.toLowerCase().includes(regionName.toLowerCase())
        ).length;
    }

    /**
     * Get maximum severity for a region
     * @param {string} regionCode - Region code
     * @returns {string|null}
     */
    getRegionMaxSeverity(regionCode) {
        const regionName = this.getRegionName(regionCode);
        const regionAlerts = this.alerts.filter(alert => 
            alert.region.toLowerCase().includes(regionName.toLowerCase()) ||
            alert.title.toLowerCase().includes(regionName.toLowerCase())
        );

        if (regionAlerts.length === 0) return null;

        const severityOrder = ['extreme', 'severe', 'moderate', 'minor'];
        for (const severity of severityOrder) {
            if (regionAlerts.some(alert => alert.severity === severity)) {
                return severity;
            }
        }

        return 'moderate';
    }

    /**
     * Get region color based on alert count and severity
     * @param {number} alertCount - Number of alerts
     * @param {string} maxSeverity - Maximum severity level
     * @returns {string}
     */
    getRegionColor(alertCount, maxSeverity = null) {
        if (alertCount === 0) return '#e5e7eb'; // Gray

        switch (maxSeverity) {
            case 'extreme':
                return '#fecaca'; // Light red
            case 'severe':
                return '#fed7aa'; // Light orange
            case 'moderate':
                return '#fef3c7'; // Light yellow
            case 'minor':
                return '#dcfce7'; // Light green
            default:
                return '#ddd6fe'; // Light purple
        }
    }

    /**
     * Get severity color
     * @param {string} severity - Severity level
     * @returns {string}
     */
    getSeverityColor(severity) {
        switch (severity) {
            case 'extreme':
                return '#dc2626'; // Red
            case 'severe':
                return '#ea580c'; // Orange
            case 'moderate':
                return '#d97706'; // Yellow
            case 'minor':
                return '#16a34a'; // Green
            default:
                return '#8b5cf6'; // Purple
        }
    }

    /**
     * Show region tooltip
     * @param {Element} regionGroup - Region group element
     * @param {string} regionCode - Region code
     */
    showRegionTooltip(regionGroup, regionCode) {
        const regionName = this.getRegionName(regionCode);
        const alertCount = this.getRegionAlertCount(regionCode);
        const maxSeverity = this.getRegionMaxSeverity(regionCode);

        // Remove existing tooltip
        this.hideRegionTooltip();

        // Create tooltip
        const tooltip = Utils.DOM.create('div', {
            className: 'map-tooltip',
            innerHTML: `
                <div class="tooltip-title">${regionName}</div>
                <div class="tooltip-content">
                    <div class="tooltip-alerts">${alertCount} active alert${alertCount !== 1 ? 's' : ''}</div>
                    ${maxSeverity ? `<div class="tooltip-severity">Max severity: ${Utils.StringUtils.capitalize(maxSeverity)}</div>` : ''}
                </div>
            `
        });

        // Position tooltip
        const rect = regionGroup.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        tooltip.style.position = 'absolute';
        tooltip.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - containerRect.top - 10) + 'px';
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        tooltip.style.zIndex = '1000';

        this.container.style.position = 'relative';
        this.container.appendChild(tooltip);
    }

    /**
     * Hide region tooltip
     */
    hideRegionTooltip() {
        const existingTooltip = this.container.querySelector('.map-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    /**
     * Show region details
     * @param {string} regionCode - Region code
     */
    showRegionDetails(regionCode) {
        const regionName = this.getRegionName(regionCode);
        const regionAlerts = this.alerts.filter(alert => 
            alert.region.toLowerCase().includes(regionName.toLowerCase()) ||
            alert.title.toLowerCase().includes(regionName.toLowerCase())
        );

        // Trigger custom event for region selection
        const event = new CustomEvent('regionSelected', {
            detail: {
                regionCode,
                regionName,
                alerts: regionAlerts
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Show map error
     */
    showMapError() {
        this.container.innerHTML = `
            <div class="map-error">
                <div class="error-icon">🗺️</div>
                <h3>Map Unavailable</h3>
                <p>Unable to load the interactive map. Please try refreshing the page.</p>
                <button class="retry-btn" onclick="weatherMap.init()">Retry</button>
            </div>
        `;
    }

    /**
     * Get region name by code
     * @param {string} code - Region code
     * @returns {string}
     */
    getRegionName(code) {
        const region = this.regions.find(r => r.code === code);
        return region ? region.name : code;
    }

    /**
     * Get Philippine regions data
     * @returns {Array}
     */
    getPhilippineRegions() {
        return [
            { code: 'ncr', name: 'NCR' },
            { code: 'car', name: 'CAR' },
            { code: 'region1', name: 'Region 1' },
            { code: 'region2', name: 'Region 2' },
            { code: 'region3', name: 'Region 3' },
            { code: 'region4a', name: 'Region 4-A' },
            { code: 'region4b', name: 'Region 4-B' },
            { code: 'region5', name: 'Region 5' },
            { code: 'region6', name: 'Region 6' },
            { code: 'region7', name: 'Region 7' },
            { code: 'region8', name: 'Region 8' },
            { code: 'region9', name: 'Region 9' },
            { code: 'region10', name: 'Region 10' },
            { code: 'region11', name: 'Region 11' },
            { code: 'region12', name: 'Region 12' },
            { code: 'region13', name: 'Region 13' },
            { code: 'barmm', name: 'BARMM' }
        ];
    }

    /**
     * Resize map to fit container
     */
    resize() {
        if (this.isInitialized) {
            // Map will automatically resize due to SVG viewBox
            console.log('Map resized');
        }
    }

    /**
     * Destroy map instance
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isInitialized = false;
    }
}

// Simple chart functionality for analytics
class WeatherCharts {
    constructor() {
        this.charts = {};
    }

    /**
     * Create a simple bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    createBarChart(canvasId, data, options = {}) {
        const canvas = Utils.DOM.get(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { labels, values } = data;
        const { title = '', colors = [] } = options;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / labels.length * 0.8;
        const maxValue = Math.max(...values);

        // Draw bars
        labels.forEach((label, index) => {
            const value = values[index];
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (index * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
            const y = canvas.height - padding - barHeight;

            // Draw bar
            ctx.fillStyle = colors[index] || '#3b82f6';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw label
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 20);

            // Draw value
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });

        // Draw title
        if (title) {
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 20);
        }

        this.charts[canvasId] = { type: 'bar', data, options };
    }

    /**
     * Create a simple pie chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    createPieChart(canvasId, data, options = {}) {
        const canvas = Utils.DOM.get(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { labels, values } = data;
        const { title = '', colors = [] } = options;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        const total = values.reduce((sum, value) => sum + value, 0);

        let currentAngle = -Math.PI / 2; // Start from top

        // Draw pie slices
        labels.forEach((label, index) => {
            const value = values[index];
            const sliceAngle = (value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index] || this.getDefaultColor(index);
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw title
        if (title) {
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, centerX, 20);
        }

        this.charts[canvasId] = { type: 'pie', data, options };
    }

    /**
     * Create a simple line chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    createLineChart(canvasId, data, options = {}) {
        const canvas = Utils.DOM.get(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { labels, values } = data;
        const { title = '', color = '#3b82f6' } = options;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const valueRange = maxValue - minValue || 1;

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        labels.forEach((label, index) => {
            const value = values[index];
            const x = padding + (index / (labels.length - 1)) * chartWidth;
            const y = canvas.height - padding - ((value - minValue) / valueRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw point
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = color;
        });

        ctx.stroke();

        // Draw labels
        labels.forEach((label, index) => {
            const x = padding + (index / (labels.length - 1)) * chartWidth;
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, canvas.height - padding + 20);
        });

        // Draw title
        if (title) {
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 20);
        }

        this.charts[canvasId] = { type: 'line', data, options };
    }

    /**
     * Get default color for chart elements
     * @param {number} index - Element index
     * @returns {string}
     */
    getDefaultColor(index) {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];
        return colors[index % colors.length];
    }

    /**
     * Update chart data
     * @param {string} canvasId - Canvas element ID
     * @param {Object} newData - New chart data
     */
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        const { type, options } = chart;
        
        switch (type) {
            case 'bar':
                this.createBarChart(canvasId, newData, options);
                break;
            case 'pie':
                this.createPieChart(canvasId, newData, options);
                break;
            case 'line':
                this.createLineChart(canvasId, newData, options);
                break;
        }
    }

    /**
     * Destroy all charts
     */
    destroy() {
        Object.keys(this.charts).forEach(canvasId => {
            const canvas = Utils.DOM.get(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
        this.charts = {};
    }
}

// Create global instances
window.WeatherMap = WeatherMap;
window.WeatherCharts = new WeatherCharts();

