// Bayanihan Weather Alert - Utility Functions

/**
 * Utility functions for the Bayanihan Weather Alert system
 */

// DOM utility functions
const DOM = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    get: (id) => document.getElementById(id),
    
    /**
     * Get elements by class name
     * @param {string} className - Class name
     * @returns {HTMLCollection}
     */
    getByClass: (className) => document.getElementsByClassName(className),
    
    /**
     * Query selector
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null}
     */
    query: (selector) => document.querySelector(selector),
    
    /**
     * Query selector all
     * @param {string} selector - CSS selector
     * @returns {NodeList}
     */
    queryAll: (selector) => document.querySelectorAll(selector),
    
    /**
     * Create element with attributes
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string} content - Inner content
     * @returns {HTMLElement}
     */
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
    
    /**
     * Show element
     * @param {HTMLElement} element - Element to show
     */
    show: (element) => {
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    },
    
    /**
     * Hide element
     * @param {HTMLElement} element - Element to hide
     */
    hide: (element) => {
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },
    
    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     */
    toggle: (element) => {
        if (element) {
            if (element.style.display === 'none' || element.classList.contains('hidden')) {
                DOM.show(element);
            } else {
                DOM.hide(element);
            }
        }
    }
};

// Date and time utilities
const DateUtils = {
    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @returns {string}
     */
    formatDate: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    /**
     * Format time to readable string
     * @param {Date|string} date - Date to format
     * @returns {string}
     */
    formatTime: (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    },
    
    /**
     * Format date and time to readable string
     * @param {Date|string} date - Date to format
     * @returns {string}
     */
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
    
    /**
     * Get relative time string (e.g., "2 hours ago")
     * @param {Date|string} date - Date to compare
     * @returns {string}
     */
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
        
        return DateUtils.formatDate(date);
    },
    
    /**
     * Check if date is expired
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    isExpired: (date) => {
        return new Date(date) < new Date();
    }
};

// String utilities
const StringUtils = {
    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    /**
     * Convert to title case
     * @param {string} str - String to convert
     * @returns {string}
     */
    toTitleCase: (str) => {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string}
     */
    truncate: (str, length = 100) => {
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + '...';
    },
    
    /**
     * Remove HTML tags from string
     * @param {string} str - String with HTML
     * @returns {string}
     */
    stripHtml: (str) => {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    },
    
    /**
     * Generate slug from string
     * @param {string} str - String to convert
     * @returns {string}
     */
    slugify: (str) => {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};

// Array utilities
const ArrayUtils = {
    /**
     * Remove duplicates from array
     * @param {Array} arr - Array to deduplicate
     * @returns {Array}
     */
    unique: (arr) => [...new Set(arr)],
    
    /**
     * Group array by key
     * @param {Array} arr - Array to group
     * @param {string|Function} key - Key to group by
     * @returns {Object}
     */
    groupBy: (arr, key) => {
        return arr.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },
    
    /**
     * Sort array by key
     * @param {Array} arr - Array to sort
     * @param {string} key - Key to sort by
     * @param {boolean} ascending - Sort order
     * @returns {Array}
     */
    sortBy: (arr, key, ascending = true) => {
        return [...arr].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    },
    
    /**
     * Filter array by search term
     * @param {Array} arr - Array to filter
     * @param {string} searchTerm - Search term
     * @param {Array} searchKeys - Keys to search in
     * @returns {Array}
     */
    search: (arr, searchTerm, searchKeys = []) => {
        if (!searchTerm) return arr;
        
        const term = searchTerm.toLowerCase();
        return arr.filter(item => {
            if (searchKeys.length === 0) {
                return JSON.stringify(item).toLowerCase().includes(term);
            }
            
            return searchKeys.some(key => {
                const value = key.split('.').reduce((obj, k) => obj?.[k], item);
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }
};

// Local storage utilities
const StorageUtils = {
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    },
    
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*}
     */
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    },
    
    /**
     * Clear all localStorage
     */
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }
};

// URL utilities
const UrlUtils = {
    /**
     * Get URL parameters
     * @returns {Object}
     */
    getParams: () => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },
    
    /**
     * Set URL parameter
     * @param {string} key - Parameter key
     * @param {string} value - Parameter value
     */
    setParam: (key, value) => {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    },
    
    /**
     * Remove URL parameter
     * @param {string} key - Parameter key
     */
    removeParam: (key) => {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }
};

// Event utilities
const EventUtils = {
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
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
    
    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function}
     */
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
};

// Validation utilities
const ValidationUtils = {
    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     * @returns {boolean}
     */
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean}
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Check if value is empty
     * @param {*} value - Value to check
     * @returns {boolean}
     */
    isEmpty: (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
};

// Animation utilities
const AnimationUtils = {
    /**
     * Fade in element
     * @param {HTMLElement} element - Element to animate
     * @param {number} duration - Animation duration in milliseconds
     */
    fadeIn: (element, duration = 300) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Fade out element
     * @param {HTMLElement} element - Element to animate
     * @param {number} duration - Animation duration in milliseconds
     */
    fadeOut: (element, duration = 300) => {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Slide down element
     * @param {HTMLElement} element - Element to animate
     * @param {number} duration - Animation duration in milliseconds
     */
    slideDown: (element, duration = 300) => {
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (targetHeight * progress) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Slide up element
     * @param {HTMLElement} element - Element to animate
     * @param {number} duration - Animation duration in milliseconds
     */
    slideUp: (element, duration = 300) => {
        const initialHeight = element.offsetHeight;
        element.style.height = initialHeight + 'px';
        element.style.overflow = 'hidden';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (initialHeight * (1 - progress)) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
            }
        };
        
        requestAnimationFrame(animate);
    }
};

// Error handling utilities
const ErrorUtils = {
    /**
     * Log error with context
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    log: (error, context = '') => {
        console.error(`[${context}] Error:`, error);
        
        // In production, you might want to send errors to a logging service
        if (window.location.hostname !== 'localhost') {
            // Example: Send to error tracking service
            // ErrorTrackingService.log(error, context);
        }
    },
    
    /**
     * Show user-friendly error message
     * @param {string} message - Error message
     * @param {string} type - Error type (error, warning, info)
     */
    showMessage: (message, type = 'error') => {
        // Create or update error message element
        let errorElement = DOM.get('error-message');
        if (!errorElement) {
            errorElement = DOM.create('div', {
                id: 'error-message',
                className: `error-message ${type}`,
                role: 'alert',
                'aria-live': 'polite'
            });
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.className = `error-message ${type}`;
        DOM.show(errorElement);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            AnimationUtils.fadeOut(errorElement);
        }, 5000);
    }
};

// Export utilities for use in other modules
window.Utils = {
    DOM,
    DateUtils,
    StringUtils,
    ArrayUtils,
    StorageUtils,
    UrlUtils,
    EventUtils,
    ValidationUtils,
    AnimationUtils,
    ErrorUtils
};

