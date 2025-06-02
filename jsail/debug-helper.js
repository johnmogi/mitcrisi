/**
 * Direct debugging helper for Mitnafun calendar styling
 * This script provides functionality required for the calendar to work correctly
 * The visual elements are hidden in production but can be enabled for debugging
 */
(function() {
    // Silent mode - only log if explicitly enabled
    const DEBUG_VISIBLE = false; // Set to true to show debug panel and logs
    
    console.log(DEBUG_VISIBLE ? "🔎 DEBUG HELPER LOADED (VISIBLE MODE)" : "🔎 DEBUG HELPER LOADED (SILENT MODE)");
    
    // Create required functionality without visible UI
    const debugFunctions = {
        logCalendarState: function() {
            if (!DEBUG_VISIBLE) return;
            
            console.log("Calendar state:", {
                selectedDates: window.selectedDates || [],
                datesConfirmed: window.datesConfirmed || false,
                validationMessage: $('#date-validation-message').text()
            });
        },
        
        applyCalendarClasses: function() {
            // This function runs silently and helps with RTL calendar functionality
            try {
                // Force calendar day cells to have proper RTL/LTR properties
                $('.day-cell').each(function() {
                    $(this).attr('dir', 'auto');
                });
                
                // Make sure the calendar container has required properties
                $('.calendar-container, .air-datepicker-wrapper').each(function() {
                    $(this).attr('aria-live', 'polite');
                });
            } catch (e) {
                if (DEBUG_VISIBLE) console.error("Error in applyCalendarClasses:", e);
            }
        },
        
        forceStyleFix: function() {
            try {
                // Fix calendar selection issues
                if (window.selectedDates && window.selectedDates.length > 0) {
                    const dates = window.selectedDates.map(d => new Date(d));
                    dates.sort((a, b) => a - b);
                    
                    // Apply CSS directly to fix styling
                    if (window.mitnafunEmergencyFixes && typeof window.mitnafunEmergencyFixes.forceCalendarStyling === 'function') {
                        window.mitnafunEmergencyFixes.forceCalendarStyling();
                    }
                }
            } catch (e) {
                if (DEBUG_VISIBLE) console.error("Error in forceStyleFix:", e);
            }
        },
        
        hideShabbatErrors: function() {
            try {
                // Remove Shabbat error messages anywhere they appear
                $(".validation-message.error:contains('לא ניתן להזמין לשבת')").hide();
                $(".validation-message:contains('מערכת סגורה')").hide();
                $("#date-validation-message:contains('לא ניתן להזמין לשבת')").hide();
                
                // If there's any validation message with Shabbat text, remove it
                $(".validation-message, #date-validation-message").each(function() {
                    var text = $(this).text();
                    if (text.indexOf('לא ניתן להזמין לשבת') >= 0 || 
                        text.indexOf('מערכת סגורה') >= 0) {
                        $(this).hide();
                    }
                });
            } catch (e) {
                if (DEBUG_VISIBLE) console.error("Error in hideShabbatErrors:", e);
            }
        }
    };
    
    // Run our essential functions silently
    debugFunctions.applyCalendarClasses();
    
    // Set up event handlers
    $(document).on('click', '.day-cell', function() {
        setTimeout(debugFunctions.applyCalendarClasses, 50);
        setTimeout(debugFunctions.forceStyleFix, 100);
        setTimeout(debugFunctions.hideShabbatErrors, 150);
    });
    
    // Periodically check for Shabbat errors
    setInterval(debugFunctions.hideShabbatErrors, 1000);
    
    // Make functions globally available but not visible in console unless debug is on
    if (DEBUG_VISIBLE) {
        // Create a debug panel for visual debugging when enabled
        const debugPanel = document.createElement('div');
        debugPanel.id = 'mitnafun-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 350px;
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #0f0;
            z-index: 9999;
            border-radius: 5px;
        `;
        
        // Add a header with controls
        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>🔎 Calendar Debug</span>
                <span style="cursor: pointer;" id="mitnafun-debug-close">✖</span>
            </div>
            <div id="mitnafun-debug-content" style="margin-bottom: 10px;"></div>
            <button id="mitnafun-debug-force-styling" style="margin-right: 5px; padding: 2px 5px;">Force Styling</button>
            <button id="mitnafun-debug-clear" style="padding: 2px 5px;">Clear</button>
        `;
        
        // Add to document when fully loaded
        $(document).ready(function() {
            $('body').append(debugPanel);
            
            // Close button functionality
            $('#mitnafun-debug-close').on('click', function() {
                $('#mitnafun-debug-panel').hide();
            });
            
            // Force styling button
            $('#mitnafun-debug-force-styling').on('click', function() {
                if (window.mitnafunEmergencyFixes && typeof window.mitnafunEmergencyFixes.forceCalendarStyling === 'function') {
                    window.mitnafunEmergencyFixes.forceCalendarStyling();
                    log('Force styling applied');
                } else {
                    log('Emergency fixes not available');
                }
            });
            
            // Clear log button
            $('#mitnafun-debug-clear').on('click', function() {
                $('#mitnafun-debug-content').html('');
            });
        });
        
        // Log function for the debug panel
        function log(message, data) {
            const timestamp = new Date().toLocaleTimeString();
            const content = $('#mitnafun-debug-content');
            const msg = typeof data !== 'undefined' 
                ? `<div>[${timestamp}] ${message} ${JSON.stringify(data)}</div>` 
                : `<div>[${timestamp}] ${message}</div>`;
                
            content.append(msg);
            content.scrollTop(content.prop('scrollHeight'));
            console.log(message, data);
        }
        
        // Make debug functions available globally
        window.mitnafunDebugHelpers = debugFunctions;
        window.mitnafunDebugLog = log;
        window.mitnafunDebug = {
            log: log,
            inspect: debugFunctions.logCalendarState,
            fix: debugFunctions.forceStyleFix,
            hideErrors: debugFunctions.hideShabbatErrors
        };
    } else {
        // Silent mode - make the helpers available but invisible
        window.mitnafunDebugHelpers = {
            ...debugFunctions,
            log: function() {} // No-op log function
        };
        window.mitnafunDebug = {
            log: function() {},
            inspect: debugFunctions.logCalendarState,
            fix: debugFunctions.forceStyleFix,
            hideErrors: debugFunctions.hideShabbatErrors
        };
    }
})();
