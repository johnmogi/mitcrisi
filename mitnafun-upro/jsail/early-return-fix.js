/**
 * Early Return to Return Date Fix
 * Specific fix for allowing bookings from early-return dates to return dates
 */
jQuery(document).ready(function($) {
    console.log('🔧 Early-return to return-date fix loaded');
    
    // Run initial check for existing selected dates
    setTimeout(checkEarlyReturnToReturnDate, 1000);
    
    // Monitor date selections
    $(document).on('click', '.day-cell', function() {
        setTimeout(checkEarlyReturnToReturnDate, 200);
    });
    
    // Direct fix for early-return to return-date bookings
    function checkEarlyReturnToReturnDate() {
        console.log('⏱ Checking for early-return to return-date special case');
        
        // First check if we have 2 selected dates
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            return;
        }
        
        // Get dates in proper order
        const orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        const startDate = new Date(orderedDates[0]);
        const endDate = new Date(orderedDates[1]);
        
        // Format dates for checking
        const startDateISO = startDate.toISOString().split('T')[0];
        const endDateISO = endDate.toISOString().split('T')[0];
        
        // Check if start date is early-return date
        const isEarlyReturn = window.earlyReturnDates && window.earlyReturnDates.includes(startDateISO);
        
        // Check if end date is return date
        const isReturnDate = window.returnDates && window.returnDates.includes(endDateISO);
        
        // If we have the special case
        if (isEarlyReturn && isReturnDate) {
            console.log('🎯 SPECIAL CASE DETECTED: Booking from early-return date to return date');
            console.log(`Start date: ${startDateISO} (early-return), End date: ${endDateISO} (return-date)`);
            
            // Force UI to show as valid
            $('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false);
            $('#date-validation-message').hide();
            $('#confirm-dates').show();
            
            // Format dates for display
            function formatDate(date) {
                return ('0' + date.getDate()).slice(-2) + '.' + 
                      ('0' + (date.getMonth() + 1)).slice(-2) + '.' + 
                      date.getFullYear();
            }
            
            // Update rental dates field
            $('input#rental_dates').val(formatDate(startDate) + ' - ' + formatDate(endDate));
            
            // Update prices
            if (typeof calculateRentalDays === 'function') {
                const rentalDays = calculateRentalDays(startDate, endDate);
                console.log(`Rental days for special case: ${rentalDays}`);
                
                if (window.basePrice) {
                    $('input#rental_price').val(rentalDays * window.basePrice);
                }
            }
            
            // Update selection styling
            $('.day-cell').removeClass('in-range');
            $('.day-cell[data-date="' + startDateISO + '"]').addClass('selected range-start');
            $('.day-cell[data-date="' + endDateISO + '"]').addClass('selected range-end');
            
            // Add in-range styling to dates between
            const dates = getDatesInRange(startDate, endDate);
            for (let i = 1; i < dates.length - 1; i++) {
                const currentDateISO = dates[i].toISOString().split('T')[0];
                $('.day-cell[data-date="' + currentDateISO + '"]').addClass('in-range');
            }
            
            // Show success message
            updateSelectedRangeDisplay("התאריכים נבחרו בהצלחה", 'success');
        }
    }
    
    // Helper function to get all dates in a range
    function getDatesInRange(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }
    
    // Update selected range display if function exists
    function updateSelectedRangeDisplay(message, type) {
        if (typeof window.updateSelectedRangeDisplay === 'function') {
            window.updateSelectedRangeDisplay(message, type);
        } else {
            // Fallback if function doesn't exist
            $('#date-validation-message').hide();
            console.log('Selection message:', message, 'type:', type);
        }
    }
});
