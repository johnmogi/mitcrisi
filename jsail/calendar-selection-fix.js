/**
 * EMERGENCY RECOVERY FIX for calendar selection highlighting
 * This standalone file directly patches both Air Datepicker and Fallback Calendar systems
 */
jQuery(document).ready(function($) {
    // Debug flag - set to true if you need console logs
    var DEBUG = true;
    
    // Helper to log only if debug is enabled
    function log(message, data) {
        if (DEBUG && console && console.log) {
            console.log('[CALENDAR-RECOVERY] ' + message, data || '');
        }
    }
    
    log('Calendar selection recovery script loaded');
    
    // Add CSS for highlighting - works with both calendar systems
    var css = `
        /* Universal selector for both calendar systems */
        .fallback-calendar .day-cell.selected,
        .fallback-calendar .day-cell.start-date,
        .fallback-calendar .day-cell.end-date,
        .fallback-calendar .day-cell.selected-start,
        .fallback-calendar .day-cell.selected-end,
        .air-datepicker-cell.-selected-,
        .air-datepicker-cell.-range-from-,
        .air-datepicker-cell.-range-to- {
            background-color: #007bff !important;
            color: white !important;
            font-weight: bold !important;
            box-shadow: 0 0 0 2px #007bff, 0 0 0 4px white !important;
            border: 2px solid white !important;
            position: relative !important;
            z-index: 10 !important;
            transform: scale(1.1) !important;
        }
        
        .fallback-calendar .day-cell.in-range,
        .air-datepicker-cell.-in-range- {
            background-color: #cfe7ff !important;
            color: #007bff !important;
            font-weight: bold !important;
            border: 1px solid #0056b3 !important;
            position: relative !important;
            z-index: 5 !important;
        }
    `;
    
    // Insert our CSS into the head
    $('head').append('<style id="calendar-recovery-css">' + css + '</style>');
    
    /**
     * MAIN FUNCTION: Apply styling to calendar selection
     * Works with both Fallback Calendar and Air Datepicker
     */
    function applyCalendarHighlighting() {
        log('Applying calendar highlighting');
        
        try {
            // Check for selectedDates in the global scope
            if (!window.selectedDates || !window.selectedDates.length) {
                log('No selectedDates found');
                return;
            }
            
            log('Found selectedDates:', window.selectedDates);
            
            var dates = window.selectedDates.map(function(d) {
                return new Date(d);
            });
            
            // Sort dates (just in case)
            dates.sort(function(a, b) { 
                return a.getTime() - b.getTime(); 
            });
            
            var startDate = dates[0];
            var endDate = dates.length > 1 ? dates[1] : startDate;
            
            log('Start date:', startDate);
            log('End date:', endDate);
            
            // ======= FALLBACK CALENDAR SYSTEM =======
            
            // Step 1: Check if we're using fallback calendar
            if ($('.fallback-calendar').length > 0) {
                log('Applying to fallback calendar system');
                
                // Reset all cells first
                $('.day-cell').removeClass('selected start-date end-date in-range');
                
                // Format dates to match data-date format (YYYY-MM-DD)
                var startFormatted = formatDateYMD(startDate);
                var endFormatted = formatDateYMD(endDate);
                
                log('Formatted dates:', startFormatted, endFormatted);
                
                // Style start date
                $('.day-cell[data-date="' + startFormatted + '"]').addClass('selected start-date');
                
                // Style end date if different
                if (startFormatted !== endFormatted) {
                    $('.day-cell[data-date="' + endFormatted + '"]').addClass('selected end-date');
                    
                    // Now style all cells in between for range
                    $('.day-cell').each(function() {
                        var cellDate = $(this).attr('data-date');
                        if (!cellDate) return;
                        
                        // Parse the date for comparison
                        var dateParts = cellDate.split('-');
                        var cellDateObj = new Date(
                            parseInt(dateParts[0]), 
                            parseInt(dateParts[1]) - 1, 
                            parseInt(dateParts[2])
                        );
                        
                        // Check if date is in range
                        if (cellDateObj > startDate && cellDateObj < endDate) {
                            $(this).addClass('in-range');
                        }
                    });
                }
            }
            
            // ======= AIR DATEPICKER SYSTEM =======
            
            // Step 2: Check if we're using air datepicker
            if ($('.air-datepicker').length > 0) {
                log('Applying to air datepicker system');
                
                // For air datepicker, we just need to manually add the classes 
                // as a backup in case the native behavior isn't working
                
                $('.air-datepicker-cell').each(function() {
                    var timestamp = $(this).data('time');
                    if (!timestamp) return;
                    
                    var cellDate = new Date(timestamp);
                    
                    // Reset any existing classes
                    $(this).removeClass('-selected- -range-from- -range-to- -in-range-');
                    
                    // Apply appropriate classes
                    if (isSameDate(cellDate, startDate)) {
                        $(this).addClass('-selected- -range-from-');
                    } 
                    else if (isSameDate(cellDate, endDate)) {
                        $(this).addClass('-selected- -range-to-');
                    }
                    else if (cellDate > startDate && cellDate < endDate) {
                        $(this).addClass('-in-range-');
                    }
                });
            }
            
            log('Calendar highlighting applied successfully');
            
        } catch (error) {
            console.error('[CALENDAR-RECOVERY] Error applying calendar highlighting:', error);
        }
    }
    
    /**
     * Helper function to format date as YYYY-MM-DD
     */
    function formatDateYMD(date) {
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
    
    /**
     * Helper to check if two dates are the same (ignoring time)
     */
    function isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // ===== INITIALIZATION & EVENT BINDING =====
    
    // Run our function on page load with delay
    setTimeout(applyCalendarHighlighting, 500);
    setTimeout(applyCalendarHighlighting, 1000);
    setTimeout(applyCalendarHighlighting, 2000);
    
    // Bind to cell clicks to reapply styling
    $(document).on('click', '.day-cell, .air-datepicker-cell', function() {
        log('Cell clicked, will reapply styling');
        setTimeout(applyCalendarHighlighting, 10);
        setTimeout(applyCalendarHighlighting, 100);
        setTimeout(applyCalendarHighlighting, 300);
    });
    
    // Bind to confirm button clicks
    $(document).on('click', '#confirm-dates, .confirm-dates-btn', function() {
        log('Confirm button clicked');
        setTimeout(applyCalendarHighlighting, 100);
        setTimeout(applyCalendarHighlighting, 300);
    });
    
    // Bind to month navigation
    $(document).on('click', '.nav-btn, #prevMonthBtn, #nextMonthBtn', function() {
        log('Month navigation clicked');
        setTimeout(applyCalendarHighlighting, 100);
        setTimeout(applyCalendarHighlighting, 300);
        setTimeout(applyCalendarHighlighting, 500);
    });
    
    // Make our function globally available for direct calls
    window.recoveryApplyCalendarHighlighting = applyCalendarHighlighting;
    
    log('Calendar recovery initialization complete');
});
