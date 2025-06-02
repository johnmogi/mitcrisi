/**
 * Direct DOM Fix for Early-Return to Return-Date Bookings
 * This script bypasses the validation system completely and directly manipulates the DOM
 */
jQuery(document).ready(function($) {
    console.log('🛠️ Direct DOM fix loaded');
    
    // Create a MutationObserver to detect when error message appears
    const errorMessageObserver = new MutationObserver(function(mutations) {
        // Check if we have the special date pattern selected
        checkAndFixSpecialCase();
    });
    
    // Start observing the error message element
    const errorMessage = document.getElementById('date-validation-message');
    if (errorMessage) {
        errorMessageObserver.observe(errorMessage, { attributes: true, attributeFilter: ['style'] });
        console.log('👁️ Error message observer attached');
    }
    
    // Also observe clicks on calendar dates
    $(document).on('click', '.day-cell', function() {
        setTimeout(checkAndFixSpecialCase, 300);
    });
    
    // Direct function to check and fix the special case
    function checkAndFixSpecialCase() {
        console.log('🔍 Checking for special date pattern');
        
        // Only proceed if we have two dates selected
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            return;
        }
        
        // Get dates in order
        const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[1]);
        
        // Format dates for comparison
        const formatDateISO = function(date) {
            return date.toISOString().split('T')[0];
        };
        
        const startDateISO = formatDateISO(startDate);
        const endDateISO = formatDateISO(endDate);
        
        // Log the dates we're checking
        console.log('📅 Checking dates:', startDateISO, 'to', endDateISO);
        
        // Check if this is an early-return to return-date booking
        const earlyReturnCell = $(`.day-cell[data-date="${startDateISO}"]`);
        const returnDateCell = $(`.day-cell[data-date="${endDateISO}"]`);
        
        const isStartEarlyReturn = 
            earlyReturnCell.hasClass('early-return-date') || 
            earlyReturnCell.attr('data-early-return') === 'true' ||
            (window.earlyReturnDates && window.earlyReturnDates.includes(startDateISO));
        
        const isEndReturnDate = 
            returnDateCell.hasClass('return-date') || 
            returnDateCell.attr('data-return-date') === 'true' ||
            (window.returnDates && window.returnDates.includes(endDateISO));
        
        // If we have our special case
        if (isStartEarlyReturn && isEndReturnDate) {
            console.log('🎯 SPECIAL CASE DETECTED: Early return date to return date');
            
            // Directly manipulate the DOM regardless of validation
            
            // 1. Hide error message
            $('#date-validation-message').hide();
            
            // 2. Enable Add to Cart buttons
            $('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false);
            
            // 3. Show confirmation button if it exists
            $('#confirm-dates').show();
            
            // 4. Add success message
            if (typeof window.updateSelectedRangeDisplay === 'function') {
                window.updateSelectedRangeDisplay("התאריכים נבחרו בהצלחה", 'success');
            }
            
            // 5. Update the rental dates field
            const formatDate = function(date) {
                return ('0' + date.getDate()).slice(-2) + '.' + 
                       ('0' + (date.getMonth() + 1)).slice(-2) + '.' + 
                       date.getFullYear();
            };
            
            // Set the input field value
            $('input#rental_dates').val(formatDate(startDate) + ' - ' + formatDate(endDate));
            
            // 6. Fix styling - remove error styling and add correct range styling
            $('.day-cell').removeClass('validation-error');
            
            // Add range styling
            earlyReturnCell.addClass('selected range-start').removeClass('validation-error');
            returnDateCell.addClass('selected range-end').removeClass('validation-error');
            
            // Style dates in between
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            const endTime = endDate.getTime();
            while (currentDate.getTime() < endTime) {
                const dateStr = formatDateISO(currentDate);
                $(`.day-cell[data-date="${dateStr}"]`).addClass('in-range').removeClass('validation-error');
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // 7. Try to recalculate price
            if (typeof window.calculateRentalDays === 'function') {
                window.calculateRentalDays(startDate, endDate);
            }
            
            console.log('✅ Special case fix applied successfully');
            return true;
        }
        
        return false;
    }
    
    // Also check periodically for the special case (in case we missed the click event)
    setInterval(checkAndFixSpecialCase, 1000);
    
    // Force check when page is fully loaded
    $(window).on('load', function() {
        setTimeout(checkAndFixSpecialCase, 1500);
    });
});
