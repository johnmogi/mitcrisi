/**
 * Early Return Handler - Enforces early return times before a booking starts
 * This script identifies dates before booked periods and shows appropriate notices
 * about required early returns when those dates are selected.
 */
jQuery(document).ready(function($) {
    console.log('Early Return Handler loaded');
    
    // Run after a short delay to ensure calendar is loaded
    setTimeout(initEarlyReturnHandler, 500);
    
    // Also run when calendar might be re-initialized
    $(document).on('calendar-initialized', initEarlyReturnHandler);
    
    /**
     * Initialize the early return handler
     */
    function initEarlyReturnHandler() {
        console.log('Initializing early return handler');
        
        // Process booked date ranges to identify early return dates
        processEarlyReturnDates();
        
        // Add necessary styles
        addEarlyReturnStyles();
        
        // Set up event handlers
        setupEventHandlers();
    }
    
    /**
     * Process booked date ranges to identify days before bookings start
     * These will require early return if selected
     */
    function processEarlyReturnDates() {
        // Create/reset early return dates array
        window.earlyReturnDates = window.earlyReturnDates || [];
        
        // Check if we have bookedDates in the global scope
        if (!window.bookedDates || !Array.isArray(window.bookedDates)) {
            console.log('No booked dates found');
            return;
        }
        
        console.log('Processing early return dates from booked dates:', window.bookedDates);
        
        // Process each date range
        window.bookedDates.forEach(function(dateRange) {
            // Skip if not a valid date range
            if (!dateRange || typeof dateRange !== 'string' || !dateRange.includes(' - ')) {
                return;
            }
            
            // Extract start date from the range
            const startDateStr = dateRange.split(' - ')[0];
            if (!startDateStr) return;
            
            try {
                // Parse start date (DD.MM.YYYY format)
                const [startDay, startMonth, startYear] = startDateStr.split('.');
                const startDate = new Date(startYear, startMonth - 1, startDay);
                
                // Get the day before the start date
                const dayBeforeStart = new Date(startDate);
                dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
                // If the day before start is Saturday (weekend), shift to Sunday
                if (dayBeforeStart.getDay() === 6) {
                    dayBeforeStart.setDate(dayBeforeStart.getDate() + 1);
                }
                
                // Format for ISO date (local)
                const dayBeforeISO = `${dayBeforeStart.getFullYear()}-${String(dayBeforeStart.getMonth()+1).padStart(2,'0')}-${String(dayBeforeStart.getDate()).padStart(2,'0')}`;
                
                // Add to early return dates array if not already there
                if (!window.earlyReturnDates.includes(dayBeforeISO)) {
                    window.earlyReturnDates.push(dayBeforeISO);
                }
            } catch (e) {
                console.error('Error processing early return date:', startDateStr, e);
            }
        });
        
        console.log('Identified early return dates:', window.earlyReturnDates);
        
        // Update calendar UI to indicate early return dates
        updateCalendarUI();
    }
    
    /**
     * Update the calendar UI to mark early return dates
     */
    function updateCalendarUI() {
        // Find all day cells in the calendar
        $('.fallback-calendar .day-cell').each(function() {
            const $cell = $(this);
            const dateISO = $cell.attr('data-date');
            
            // Skip if no date attribute or not an early return date
            if (!dateISO || !window.earlyReturnDates.includes(dateISO)) {
                return;
            }
            
            // Mark as an early return date
            $cell.addClass('early-return-date');
            $cell.attr('data-early-return', 'true');
            
            // Make sure it's selectable (it should already be selectable as it's not a reserved date)
            $cell.attr('data-selectable', 'true');
        });
        
        // Update the calendar legend to include early return dates
        if ($('.calendar-legend .legend-item:contains("החזרה מוקדמת")').length === 0) {
            $('.calendar-legend').append(`
                <div class="legend-item">
                    <span class="legend-color early-return"></span> החזרה מוקדמת (עד 09:00)
                </div>
            `);
        }
    }
    
    /**
     * Set up event handlers for early return dates
     */
    function setupEventHandlers() {
        // Monitor date selection to show early return notice
        $(document).on('click', '.day-cell[data-early-return="true"]', function() {
            showEarlyReturnNotice();
        });
        
        // Also check when validating the date range
        if (typeof window.validateDateRange === 'function') {
            const originalValidateFunction = window.validateDateRange;
            
            window.validateDateRange = function() {
                const result = originalValidateFunction();
                
                // If validation passed, check if we need to show early return notice
                if (result && window.selectedEndDate) {
                    const endDateISO = window.selectedEndDate.toISOString().split('T')[0];
                    
                    if (window.earlyReturnDates && window.earlyReturnDates.includes(endDateISO)) {
                        showEarlyReturnNotice();
                    } else {
                        hideEarlyReturnNotice();
                    }
                }
                
                return result;
            };
        }
        
        // Reset notices on selecting other dates (non-early-return)
        $(document).on('click', '.day-cell:not([data-early-return="true"])', function() {
            hideEarlyReturnNotice();
            // Show general return-time notice
            $('#return-time-notice').show();
            // Hide same-day booking errors
            $('.same-day-booking-error').hide();
        });
    }
    
    /**
     * Show the notice for early return requirement
     */
    function showEarlyReturnNotice() {
        // Create the notice if it doesn't exist
        if ($('#early-return-notice').length === 0) {
            $('.fallback-calendar').after(`
                <div id="early-return-notice" style="margin: 15px 0; padding: 12px; background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px;">
                    <strong style="color: #0d47a1;">שימו לב!</strong> עבור תאריך זה יש הזמנה למחרת.
                    <div style="margin-top: 5px;">יש להחזיר את הציוד <strong>עד השעה 09:00</strong> בבוקר.</div>
                </div>
            `);
        }
        // Show the notice
        $('#early-return-notice').show();
        // Hide general return-time notice when early return applies
        $('#return-time-notice').hide();
    }
    
    /**
     * Hide the early return notice
     */
    function hideEarlyReturnNotice() {
        $('#early-return-notice').hide();
        // Redisplay general return-time notice when early return does not apply
        $('#return-time-notice').show();
    }
    
    /**
     * Add CSS styles for early return dates
     */
    function addEarlyReturnStyles() {
        // Create a style element if it doesn't exist
        if ($('#early-return-styles').length === 0) {
            $('head').append('<style id="early-return-styles"></style>');
        }
        
        // Define the CSS
        const css = `
            .day-cell.early-return-date {
                background-color: #e3f2fd;
                color: #0d47a1;
                cursor: pointer;
                position: relative;
            }
            
            .day-cell.early-return-date::after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 8px 8px 0 0;
                border-color: #2196f3 transparent transparent transparent;
            }
            
            .legend-color.early-return {
                background-color: #e3f2fd;
                border: 1px solid #90caf9;
            }
        `;
        
        // Add the CSS to the style element
        $('#early-return-styles').html(css);
    }
});
