/**
 * Return Date Handler - Allows booking on last day of a rental period
 * This script enhances the calendar to make the last day of bookings selectable
 * with a special warning notice about possible delays.
 */
jQuery(document).ready(function($) {
    console.log('Return Date Handler loaded');
    
    // Run after a short delay to ensure calendar is loaded
    setTimeout(initReturnDateHandler, 500);
    
    // Also run when calendar might be re-initialized
    $(document).on('calendar-initialized', initReturnDateHandler);
    
    /**
     * Initialize the return date handler
     */
    function initReturnDateHandler() {
        console.log('Initializing return date handler');
        
        // Process booked date ranges to identify return dates
        processReturnDates();
        
        // Add necessary styles
        addReturnDateStyles();
        
        // Set up event handlers
        setupEventHandlers();
    }
    
    /**
     * Process booked date ranges to identify the last day of each booking
     * These days are marked as return dates and made selectable
     */
    function processReturnDates() {
        // Reset return dates array
        window.returnDates = window.returnDates || [];
        
        // Check if we have bookedDates in the global scope
        if (!window.bookedDates || !Array.isArray(window.bookedDates)) {
            console.log('No booked dates found');
            return;
        }
        
        console.log('Processing return dates from booked dates:', window.bookedDates);
        
        // Process each date range
        window.bookedDates.forEach(function(dateRange) {
            // Skip if not a valid date range
            if (!dateRange || typeof dateRange !== 'string' || !dateRange.includes(' - ')) {
                return;
            }
            
            // Extract end date from the range
            const endDateStr = dateRange.split(' - ')[1];
            if (!endDateStr) return;
            
            try {
                // Parse end date (DD.MM.YYYY format)
                const [endDay, endMonth, endYear] = endDateStr.split('.');
                const endDate = new Date(endYear, endMonth - 1, endDay);
                
                // Format for ISO date (local)
                const endDateISO = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
                
                // Add to return dates array if not already there
                if (!window.returnDates.includes(endDateISO)) {
                    window.returnDates.push(endDateISO);
                }
            } catch (e) {
                console.error('Error processing return date:', endDateStr, e);
            }
        });
        
        console.log('Identified return dates:', window.returnDates);
        
        // Update calendar UI to show return dates
        updateCalendarUI();
    }
    
    /**
     * Update the calendar UI to show return dates
     */
    function updateCalendarUI() {
        // Find all day cells in the calendar
        $('.fallback-calendar .day-cell').each(function() {
            const $cell = $(this);
            const dateISO = $cell.attr('data-date');
            
            // Skip if no date attribute or not a return date
            if (!dateISO || !window.returnDates.includes(dateISO)) {
                return;
            }
            
            // Mark as a return date
            $cell.addClass('return-date');
            $cell.attr('data-return-date', 'true');
            
            // Make selectable even if it was disabled
            $cell.removeClass('disabled');
            $cell.attr('data-selectable', 'true');
        });
        
        // Update the calendar legend to include return dates
        if ($('.calendar-legend .legend-item:contains("יום החזרה")').length === 0) {
            $('.calendar-legend').append(`
                <div class="legend-item">
                    <span class="legend-color return-date"></span> יום החזרה (ניתן להזמין)
                </div>
            `);
        }
    }
    
    /**
     * Set up event handlers for return dates
     */
    function setupEventHandlers() {
        // Monitor date selection to show return date notice
        $(document).on('click', '.day-cell[data-return-date="true"]', function() {
            showReturnDateNotice();
        });
        
        // Also check when validating the date range
        if (typeof window.validateDateRange === 'function') {
            const originalValidateFunction = window.validateDateRange;
            
            window.validateDateRange = function() {
                const result = originalValidateFunction();
                
                // If validation passed, check if we've selected a return date
                if (result && window.selectedStartDate) {
                    const startDateISO = window.selectedStartDate.toISOString().split('T')[0];
                    
                    if (window.returnDates && window.returnDates.includes(startDateISO)) {
                        showReturnDateNotice();
                    } else {
                        hideReturnDateNotice();
                    }
                }
                
                return result;
            };
        }
    }
    
    /**
     * Show the notice for return dates
     */
    function showReturnDateNotice() {
        // Create the notice if it doesn't exist
        if ($('#return-date-notice').length === 0) {
            $('.fallback-calendar').after(`
                <div id="return-date-notice" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px;">
                    <strong style="color: #856404;">שימו לב:</strong> עבור תאריך זה קיימת החזרה של ציוד בשעות הבוקר.  
                    זמן האיסוף עשוי להתעכב – מומלץ לתאם איתנו מראש.
                </div>
            `);
        }
        
        // Show the notice
        $('#return-date-notice').show();
    }
    
    /**
     * Hide the return date notice
     */
    function hideReturnDateNotice() {
        $('#return-date-notice').hide();
    }
    
    /**
     * Add CSS styles for return dates
     */
    function addReturnDateStyles() {
        // Create a style element if it doesn't exist
        if ($('#return-date-styles').length === 0) {
            $('head').append('<style id="return-date-styles"></style>');
        }
        
        // Define the CSS
        const css = `
            .day-cell.return-date {
                background-color: #fff3cd;
                color: #856404;
                cursor: pointer;
                position: relative;
            }
            
            .day-cell.return-date::after {
                content: "";
                position: absolute;
                bottom: 0;
                right: 0;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 0 0 8px 8px;
                border-color: transparent transparent #ffc107 transparent;
            }
            
            .legend-color.return-date {
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
            }
        `;
        
        // Add the CSS to the style element
        $('#return-date-styles').html(css);
    }
});
