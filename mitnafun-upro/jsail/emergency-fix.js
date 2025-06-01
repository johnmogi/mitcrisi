/**
 * Emergency Fix for Early-Return to Return-Date Bookings
 * This script directly attacks the error message and validation logic
 */
jQuery(document).ready(function($) {
    console.log('🚨 Emergency fix loaded - Direct targeting of validation error');
    
    // Focus on the specific elements we need to control
    const errorMessage = $('#date-validation-message');
    const addToCartButtons = $('.single_add_to_cart_button');
    const confirmButton = $('#confirm-dates');
    const rentalDatesInput = $('#rental_dates');
    
    // Force hide error and enable buttons periodically (aggressive approach)
    function forceValidSelection() {
        // Only proceed if we have exactly 2 dates selected
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            return;
        }
        
        // Get dates in chronological order
        const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[1]);
        
        // Format dates for comparison
        const formatDateISO = function(date) {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        };
        
        const startDateISO = formatDateISO(startDate);
        const endDateISO = formatDateISO(endDate);
        
        // Check if we have the special early-return to return-date pattern
        const startCell = $(`.day-cell[data-date="${startDateISO}"]`);
        const endCell = $(`.day-cell[data-date="${endDateISO}"]`);
        
        const isStartEarlyReturn = 
            startCell.hasClass('early-return-date') || 
            startCell.attr('data-early-return') === 'true' ||
            (window.earlyReturnDates && window.earlyReturnDates.includes(startDateISO));
        
        const isEndReturnDate = 
            endCell.hasClass('return-date') || 
            endCell.attr('data-return-date') === 'true' ||
            (window.returnDates && window.returnDates.includes(endDateISO));
        
        // If we have our special case, force the UI into a valid state
        if (isStartEarlyReturn && isEndReturnDate) {
            console.log('🔥 EMERGENCY FIX: Found early-return to return-date pattern!');
            
            // Force hide error message
            errorMessage.hide();
            
            // Force enable buttons
            addToCartButtons.removeClass('disabled').prop('disabled', false);
            
            // Show confirm button
            confirmButton.show();
            
            // Set rental dates input
            const formatDateHebrew = function(date) {
                return ('0' + date.getDate()).slice(-2) + '.' + 
                       ('0' + (date.getMonth() + 1)).slice(-2) + '.' + 
                       date.getFullYear();
            };
            
            // Only set if it's not already set
            if (!rentalDatesInput.val()) {
                rentalDatesInput.val(formatDateHebrew(startDate) + ' - ' + formatDateHebrew(endDate));
            }
            
            // Add correct styling
            $('.day-cell').removeClass('validation-error');
            startCell.addClass('selected range-start').removeClass('validation-error');
            endCell.addClass('selected range-end').removeClass('validation-error');
            
            // Add in-range styling to dates between
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            while (currentDate < endDate) {
                const dateStr = formatDateISO(currentDate);
                $(`.day-cell[data-date="${dateStr}"]`).addClass('in-range').removeClass('validation-error');
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Directly override the validateDateRange function (nuclear option)
            if (typeof window.validateDateRange === 'function') {
                const originalValidateFunc = window.validateDateRange;
                
                window.validateDateRange = function() {
                    // Check if this is our special case
                    if (window.selectedDates && window.selectedDates.length === 2) {
                        const selectedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
                        const start = new Date(selectedDates[0]);
                        const end = new Date(selectedDates[1]);
                        
                        const startISO = formatDateISO(start);
                        const endISO = formatDateISO(end);
                        
                        // Check if start is early-return and end is return-date
                        const isStartER = 
                            $(`.day-cell[data-date="${startISO}"]`).hasClass('early-return-date') || 
                            $(`.day-cell[data-date="${startISO}"]`).attr('data-early-return') === 'true' ||
                            (window.earlyReturnDates && window.earlyReturnDates.includes(startISO));
                        
                        const isEndRD = 
                            $(`.day-cell[data-date="${endISO}"]`).hasClass('return-date') || 
                            $(`.day-cell[data-date="${endISO}"]`).attr('data-return-date') === 'true' ||
                            (window.returnDates && window.returnDates.includes(endISO));
                        
                        if (isStartER && isEndRD) {
                            console.log('✅ Validation override: APPROVED early-return to return-date booking');
                            return true;
                        }
                    }
                    
                    // Fall back to original function for other cases
                    return originalValidateFunc.apply(this, arguments);
                };
                
                console.log('⚙️ Directly replaced validateDateRange function');
            }
            
            return true;
        }
        
        return false;
    }
    
    // Intercept date clicks
    $(document).on('click', '.day-cell', function() {
        // Give time for the original handlers to run
        setTimeout(forceValidSelection, 100);
        setTimeout(forceValidSelection, 300);
        setTimeout(forceValidSelection, 500);
    });
    
    // Also run periodically to catch any cases we missed
    setInterval(forceValidSelection, 1000);
    
    // Run on page load
    setTimeout(forceValidSelection, 1500);
    
    // Specifically target and intercept the error message
    // Create a MutationObserver to catch when the error message becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' && 
                errorMessage.css('display') === 'block') {
                
                console.log('👀 Error message displayed - checking if we need to override');
                forceValidSelection();
            }
        });
    });
    
    // Start observing the error message
    if (errorMessage.length) {
        observer.observe(errorMessage[0], { attributes: true });
        console.log('👁️ Error message observer attached');
    }
});
