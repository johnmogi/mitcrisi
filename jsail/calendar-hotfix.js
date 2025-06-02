/**
 * Ultra-aggressive calendar styling fix for MitnaFun rental calendar
 * This script ensures date selection highlighting always works, even with error messages
 * Works with both fallback calendar and Air Datepicker
 */
jQuery(document).ready(function($) {
    // Configuration
    const DEBUG = false; // Set to true to enable console logging
    const APPLY_INTERVAL = 500; // Check and apply styling every 500ms
    
    // Debug helper function
    function log(message, data) {
        if (DEBUG) {
            if (data) {
                console.log(`[CALENDAR-FIX] ${message}`, data);
            } else {
                console.log(`[CALENDAR-FIX] ${message}`);
            }
        }
    }
    
    log("Calendar fix loaded");
    
    // Global CSS for calendar styles
    const CALENDAR_CSS = `
        /* Start and end date styling */
        .day-cell.selected, 
        .day-cell.start-date, 
        .day-cell.end-date,
        .day-cell.selected-start,
        .day-cell.selected-end {
            background-color: #2196F3 !important;
            color: white !important;
            font-weight: bold !important;
            border-radius: 50% !important;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.4) !important;
            border: 2px solid white !important;
            position: relative !important;
            z-index: 5 !important;
        }
        
        /* In-range styling */
        .day-cell.in-range {
            background-color: rgba(33, 150, 243, 0.2) !important;
            color: #333 !important;
            border: 1px solid rgba(33, 150, 243, 0.3) !important;
        }
        
        /* Error styling */
        .day-cell.error-selection {
            background-color: #ffeeee !important;
            color: #c00 !important;
            border: 2px solid #ffaaaa !important;
            animation: errorPulse 2s infinite;
        }
        
        @keyframes errorPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    
    // Inject our CSS
    $('head').append(`<style id="calendar-hotfix-styles">${CALENDAR_CSS}</style>`);
    log("CSS injected");
    
    // Main styling function that works regardless of error state
    function applyCalendarHighlighting() {
        try {
            // Get selected dates (if any)
            if (!window.selectedDates || window.selectedDates.length === 0) {
                return; // Nothing to do
            }
            
            log("Applying highlighting to selected dates", window.selectedDates);
            
            // Get dates in a usable format
            const dates = window.selectedDates.map(d => new Date(d));
            dates.sort((a, b) => a - b); // Sort in ascending order
            
            // Format for data-date attribute lookup
            const formattedDates = dates.map(d => {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            });
            
            const startDate = formattedDates[0];
            const endDate = formattedDates.length > 1 ? formattedDates[formattedDates.length - 1] : startDate;
            
            // Check for error message
            const hasError = $('#date-validation-message').hasClass('error') && 
                            $('#date-validation-message').is(':visible');
            
            // Apply styling based on error state
            $('.day-cell').each(function() {
                const cellDate = $(this).attr('data-date');
                if (!cellDate) return;
                
                // Clear existing styles first (but don't touch non-date related classes)
                $(this).removeClass('selected selected-start selected-end in-range error-selection');
                
                if (hasError) {
                    // Apply error styling to selected dates
                    if (formattedDates.includes(cellDate)) {
                        $(this).addClass('selected error-selection');
                    }
                } else {
                    // Apply normal styling
                    if (cellDate === startDate) {
                        $(this).addClass('selected start-date');
                    } else if (cellDate === endDate && startDate !== endDate) {
                        $(this).addClass('selected end-date');
                    } else if (cellDate > startDate && cellDate < endDate) {
                        $(this).addClass('in-range');
                    }
                }
            });
            
            log("Highlighting applied successfully");
        } catch (e) {
            if (DEBUG) console.error("Error in applyCalendarHighlighting", e);
        }
    }
    
    // Function to specifically remove Shabbat error messages
    function removeShabbatErrorMessages() {
        log("Removing Shabbat error messages");
        
        // Target specific Shabbat error messages by content
        $(".validation-message, #date-validation-message").each(function() {
            var text = $(this).text();
            if (text.includes('לא ניתן להזמין לשבת') || 
                text.includes('מערכת סגורה')) {
                log("Found and removing Shabbat error: " + text);
                $(this).hide();
                $(this).css('display', 'none !important');
                $(this).attr('data-resolved', 'true');
                
                // Also remove related error styling
                $('.day-cell.error-selection').removeClass('error-selection');
            }
        });
    }
    
    // Setup event handlers for calendar interactions
    function setupEventHandlers() {
        log("Setting up calendar event handlers");
        
        // Handle date selection events
        $(document).on('click', '.day-cell:not(.disabled)', function() {
            setTimeout(applyCalendarHighlighting, 10);
            setTimeout(applyCalendarHighlighting, 100);
        });
        
        // Handle month navigation
        $(document).on('click', '.calendar-nav-prev, .calendar-nav-next', function() {
            setTimeout(applyCalendarHighlighting, 10);
            setTimeout(applyCalendarHighlighting, 100);
        });
        
        // Handle range changes and remove Shabbat error messages
        $(document).on('change', '.datepicker-input, [name="start_date"], [name="end_date"]', function() {
            setTimeout(applyCalendarHighlighting, 10);
            setTimeout(applyCalendarHighlighting, 100);
            setTimeout(removeShabbatErrorMessages, 10);
            setTimeout(removeShabbatErrorMessages, 100);
        });
        
        // Remove the error message specifically for Shabbat bookings
        $(document).on('DOMNodeInserted', '.validation-message, #date-validation-message', function() {
            removeShabbatErrorMessages();
        });
    }
    
    // Apply styling periodically to ensure it's always visible
    function setupPeriodicCheck() {
        log("Setting up periodic check");
        
        // Initial application
        setTimeout(applyCalendarHighlighting, 100);
        setTimeout(applyCalendarHighlighting, 500);
        setTimeout(applyCalendarHighlighting, 1000);
        
        // Periodic application
        setInterval(applyCalendarHighlighting, APPLY_INTERVAL);
    }
    
    // Initialize
    function init() {
        log("Initializing");
        setupEventHandlers();
        setupPeriodicCheck();
        
        // Make the function globally available for manual application
        window.applyCalendarHighlighting = applyCalendarHighlighting;
    }
    
    // Start the fix
    init();
    log("Calendar fix initialized successfully");
});
