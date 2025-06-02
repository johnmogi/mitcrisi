/**
 * Special Dates Fix for Mitnafun
 * 
 * This script directly overrides the validateDateRange function to handle the special case of
 * booking from early-return dates to return dates, even when there are reserved dates in between.
 */
jQuery(document).ready(function($) {
    console.log('✅ Special dates fix loaded - Direct Override Mode');
    
    // Store reference to the original validateDateRange function
    if (typeof window.originalValidateDateRange !== 'function') {
        window.originalValidateDateRange = window.validateDateRange;
    }
    
    // Directly override the validateDateRange function
    window.validateDateRange = function() {
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            console.log('No valid date range to validate');
            return false;
        }
        
        // Get dates in order
        let orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        const startDate = new Date(orderedDates[0]);
        const endDate = new Date(orderedDates[1]);
        
        // Normalize times for comparison
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);
        
        // Format dates for comparison
        const formatDateISO = function(date) {
            return date.toISOString().split('T')[0];
        };
        
        const startDateStr = formatDateISO(startDate);
        const endDateStr = formatDateISO(endDate);
        
        console.log('🔄 Override validating date range:', startDateStr, 'to', endDateStr);
        
        // CRITICAL CHECK - Is this an early-return to return-date booking?
        // Multiple ways to detect if a date is an early-return date
        const isStartEarlyReturn = 
            (window.earlyReturnDates && window.earlyReturnDates.includes(startDateStr)) ||
            $(`.day-cell[data-date="${startDateStr}"]`).hasClass('early-return-date') || 
            $(`.day-cell[data-date="${startDateStr}"]`).attr('data-early-return') === 'true';
        
        // Multiple ways to detect if a date is a return date
        const isEndReturnDate = 
            (window.returnDates && window.returnDates.includes(endDateStr)) ||
            $(`.day-cell[data-date="${endDateStr}"]`).hasClass('return-date') || 
            $(`.day-cell[data-date="${endDateStr}"]`).attr('data-return-date') === 'true';
        
        // If this is our special case - early return date to return date - ALLOW IT!
        if (isStartEarlyReturn && isEndReturnDate) {
            console.log('🟢 SPECIAL CASE APPROVED: Booking from early-return date to return date');
            
            // Always update the UI for a valid selection
            
            // Mark range as valid
            $(".day-cell").removeClass("validation-error");
            
            // Hide any error message
            $('#date-validation-message').hide();
            
            // Update selection display with success message
            if (typeof window.updateSelectedRangeDisplay === 'function') {
                window.updateSelectedRangeDisplay("התאריכים נבחרו בהצלחה", 'success');
            }
            
            // Enable add to cart buttons
            $('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false);
            
            // Show green confirmation button
            $('#confirm-dates').show();
            
            // Ensure correct styling of date range
            // Style the date range
            $('.day-cell').removeClass('validation-error');
            $(`.day-cell[data-date="${startDateStr}"]`).addClass('selected range-start').removeClass('validation-error');
            $(`.day-cell[data-date="${endDateStr}"]`).addClass('selected range-end').removeClass('validation-error');
            
            // Add styling to all dates in between
            const getDatesInRange = function(start, end) {
                const dates = [];
                let currentDate = new Date(start);
                currentDate.setDate(currentDate.getDate() + 1); // Start with day after start
                
                const endTime = new Date(end).getTime();
                while (currentDate.getTime() < endTime) {
                    dates.push(formatDateISO(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                return dates;
            };
            
            const inBetweenDates = getDatesInRange(startDate, endDate);
            inBetweenDates.forEach(dateStr => {
                $(`.day-cell[data-date="${dateStr}"]`).addClass('in-range').removeClass('validation-error');
            });
            
            // Format for the input field
            const formatDateForDisplay = function(date) {
                return ('0' + date.getDate()).slice(-2) + '.' + 
                       ('0' + (date.getMonth() + 1)).slice(-2) + '.' + 
                       date.getFullYear();
            };
            
            // Update the rental dates input field
            $('input#rental_dates').val(formatDateForDisplay(startDate) + ' - ' + formatDateForDisplay(endDate));
            
            // Force recalculation of price if possible
            if (typeof window.calculateRentalDays === 'function') {
                window.calculateRentalDays(startDate, endDate);
            }
            
            return true;
        }
        
        // For all other cases, use the original validation logic
        return window.originalValidateDateRange();
    };
    
    // Add event listener for date selection to immediately revalidate
    $(document).on('click', '.day-cell', function() {
        // Short delay to let the normal handlers finish
        setTimeout(function() {
            if (window.selectedDates && window.selectedDates.length === 2) {
                // Force revalidation of the current selection
                window.validateDateRange();
            }
        }, 200);
    });
});

