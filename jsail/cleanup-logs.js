/**
 * PRODUCTION Log Cleanup Utility for Mitnafun Calendar System
 * This script completely disables most console logs for production environment
 * Version 2.0 - AGGRESSIVE PRODUCTION MODE
 */
(function() {
    'use strict';
    
    // Create a simple logger with different levels that suppresses most output in production
    window.mitnafunLogger = {
        // Log levels
        ERROR: 10,
        WARNING: 20,
        INFO: 30,
        DEBUG: 40,
        
        // Production mode - set to ERROR level only
        level: 10, // Only show errors in production
        
        // Prefix for all logs
        prefix: '[Mitnafun] ',
        
        // Log methods
        error: function(message, ...args) {
            if (this.level >= this.ERROR) {
                console.error(this.prefix + message, ...args);
            }
        },
        
        warn: function(message, ...args) {
            if (this.level >= this.WARNING) {
                // Suppress all warnings in production
                // console.warn(this.prefix + message, ...args);
            }
        },
        
        info: function(message, ...args) {
            if (this.level >= this.INFO) {
                // Suppress all info logs in production
                // console.log(this.prefix + message, ...args);
            }
        },
        
        debug: function(message, ...args) {
            // All debug logs suppressed in production
        },
        
        // For development only - no effect in production
        setDebugMode: function(enabled) {
            // Do nothing in production mode
        }
    };
    
    // Keep track of allowed critical logs
    const ALLOWED_CRITICAL_LOGS = [
        'CRITICAL ERROR',
        'Payment failed',
        'Checkout error',
        'API error',
        'Failed to load'
    ];
    
    // Execute immediately
    function initProductionLoggingMode() {
        // Check if we're in a debug mode - preserve logs if explicitly set
        const isDebugMode = 
            window.mitnafunFrontend && 
            window.mitnafunFrontend.debugMode === true;
        
        if (!isDebugMode) {
            // Store original methods
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            const originalInfo = console.info;
            const originalDebug = console.debug;
            
            // Replace console.log with silent version
            console.log = function(message, ...args) {
                // Only allow critical error messages
                const isCritical = ALLOWED_CRITICAL_LOGS.some(criticalText => 
                    typeof message === 'string' && message.includes(criticalText)
                );
                
                // Log 404 errors to help debug missing assets
                const is404Error = 
                    typeof message === 'string' && 
                    (message.includes('404') || message.includes('Failed to load resource'));
                
                if (isCritical || is404Error) {
                    originalLog.apply(console, [message, ...args]);
                }
                // All other logs are suppressed
            };
            
            // Suppress other console methods too
            console.warn = function(message, ...args) {
                // Only allow critical warnings
                const isCritical = ALLOWED_CRITICAL_LOGS.some(criticalText => 
                    typeof message === 'string' && message.includes(criticalText)
                );
                
                if (isCritical) {
                    originalWarn.apply(console, [message, ...args]);
                }
                // All other warnings are suppressed
            };
            
            // Keep errors visible but filter out non-critical ones
            console.error = function(message, ...args) {
                // Allow all errors through in production, but filter out some common ones
                const isIgnoredError = 
                    (typeof message === 'string' && 
                    (message.includes('jQuery Migrate') || 
                     message.includes('datepicker') || 
                     message.includes('is not a function')));
                
                if (!isIgnoredError) {
                    originalError.apply(console, [message, ...args]);
                }
            };
            
            // Completely suppress info and debug
            console.info = function() {};
            console.debug = function() {};
        }
    }
    
    // Run immediately and again when DOM is ready
    initProductionLoggingMode();
    
    document.addEventListener('DOMContentLoaded', initProductionLoggingMode);
})();
