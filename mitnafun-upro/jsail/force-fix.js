/**
 * Force Fix for Early Return to Return Date Bookings
 * This script uses a more aggressive approach to ensure the fix works
 */
jQuery(document).ready(function($) {
    console.log('🔨 Force fix for early-return to return-date bookings loaded');
    
    // Force patch validateDateRange
    setTimeout(function() {
        // Direct script injection approach
        const forceFixScript = document.createElement('script');
        forceFixScript.textContent = `
            // Store original function for comparison
            if (!window._originalValidateFunc) {
                window._originalValidateFunc = window.validateDateRange;
            }
            
            // Complete replacement of the validateDateRange function
            window.validateDateRange = function() {
                console.log('💪 FORCE OVERRIDE validateDateRange called');
                
                if (!window.selectedDates || window.selectedDates.length !== 2) {
                    console.log('No valid date range to validate');
                    return false;
                }
                
                // Get ordered dates
                let orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
                const startDate = new Date(orderedDates[0]);
                const endDate = new Date(orderedDates[1]);
                
                startDate.setHours(0,0,0,0);
                endDate.setHours(0,0,0,0);
                
                // Format dates for comparison
                const formatDateISO = function(date) {
                    return date.toISOString().split('T')[0];
                };
                
                const startDateStr = formatDateISO(startDate);
                const endDateStr = formatDateISO(endDate);
                
                console.log('Force Override Validating:', startDateStr, 'to', endDateStr);
                
                // SPECIAL CASE: Early Return Date to Return Date
                const isStartEarlyReturn = jQuery('.day-cell[data-date="' + startDateStr + '"]').hasClass('early-return-date') ||
                                         jQuery('.day-cell[data-date="' + startDateStr + '"]').attr('data-early-return') === 'true' ||
                                         (window.earlyReturnDates && window.earlyReturnDates.includes(startDateStr));
                                   
                const isEndReturnDate = jQuery('.day-cell[data-date="' + endDateStr + '"]').hasClass('return-date') ||
                                      jQuery('.day-cell[data-date="' + endDateStr + '"]').attr('data-return-date') === 'true' ||
                                      (window.returnDates && window.returnDates.includes(endDateStr));
                
                // Handle special case - early return to return date
                if (isStartEarlyReturn && isEndReturnDate) {
                    console.log('🟢 FORCE OVERRIDE - Special case: Early return to return date - APPROVED');
                    
                    // Hide error message
                    jQuery('#date-validation-message').hide();
                    
                    // Remove validation errors
                    jQuery('.day-cell').removeClass('validation-error');
                    
                    // Update selection display with success message
                    if (typeof window.updateSelectedRangeDisplay === 'function') {
                        window.updateSelectedRangeDisplay("התאריכים נבחרו בהצלחה", 'success');
                    }
                    
                    // Enable add to cart buttons
                    jQuery('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false);
                    
                    // Show confirmation button
                    jQuery('#confirm-dates').show();
                    
                    // Add correct styling
                    jQuery('.day-cell[data-date="' + startDateStr + '"]').addClass('selected range-start');
                    jQuery('.day-cell[data-date="' + endDateStr + '"]').addClass('selected range-end');
                    
                    // Add styling to all dates in between
                    const getDatesInRange = function(start, end) {
                        const dates = [];
                        let currentDate = new Date(start);
                        currentDate.setDate(currentDate.getDate() + 1);
                        
                        while (currentDate < end) {
                            dates.push(formatDateISO(currentDate));
                            currentDate.setDate(currentDate.getDate() + 1);
                        }
                        
                        return dates;
                    };
                    
                    const inBetweenDates = getDatesInRange(startDate, endDate);
                    inBetweenDates.forEach(dateStr => {
                        jQuery('.day-cell[data-date="' + dateStr + '"]').addClass('in-range');
                    });
                    
                    // Format date for the input field
                    const formatDate = function(date) {
                        return ('0' + date.getDate()).slice(-2) + '.' +
                               ('0' + (date.getMonth() + 1)).slice(-2) + '.' +
                               date.getFullYear();
                    };
                    
                    // Update rental dates field
                    jQuery('input#rental_dates').val(formatDate(startDate) + ' - ' + formatDate(endDate));
                    
                    // Calculate price if possible
                    if (typeof window.calculateRentalDays === 'function') {
                        window.calculateRentalDays(startDate, endDate);
                    }
                    
                    return true;
                }
                
                // For all other cases, use regular validation logic
                // But we'll implement it directly to avoid any issues
                
                // Check for disabled dates in the range
                let hasDisabledDate = false;
                let currentDate = new Date(startDate);
                
                // Skip check if this is a special case we already approved
                if (!(isStartEarlyReturn && isEndReturnDate)) {
                    while (currentDate <= endDate) {
                        const dateStr = formatDateISO(currentDate);
                        
                        const dayCell = jQuery('.day-cell[data-date="' + dateStr + '"]');
                        const isDayDisabled = dayCell.hasClass('disabled') || dayCell.attr('data-selectable') === 'false';
                        
                        // Ignore disabled check for start date if it's an early return date
                        const isEarlyReturn = dayCell.hasClass('early-return-date') || 
                                            dayCell.attr('data-early-return') === 'true' ||
                                            (window.earlyReturnDates && window.earlyReturnDates.includes(dateStr));
                                          
                        // Ignore disabled check for end date if it's a return date
                        const isReturnDate = dayCell.hasClass('return-date') || 
                                           dayCell.attr('data-return-date') === 'true' ||
                                           (window.returnDates && window.returnDates.includes(dateStr));
                        
                        // Special handling for early-return and return dates
                        const isStartDate = dateStr === startDateStr;
                        const isEndDate = dateStr === endDateStr;
                        
                        if (isDayDisabled && !(isStartDate && isEarlyReturn) && !(isEndDate && isReturnDate)) {
                            console.log('Validation failed: Date in range is reserved:', dateStr);
                            hasDisabledDate = true;
                            break;
                        }
                        
                        // Move to next day
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
                
                // Handle validation result
                if (hasDisabledDate) {
                    // Show error message
                    jQuery('#date-validation-message').show();
                    
                    // Disable add to cart buttons
                    jQuery('.single_add_to_cart_button').addClass('disabled').prop('disabled', true);
                    
                    // Hide confirmation button
                    jQuery('#confirm-dates').hide();
                    
                    return false;
                }
                
                // If we get here, range is valid
                jQuery('#date-validation-message').hide();
                jQuery('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false);
                jQuery('#confirm-dates').show();
                
                // Format date for the input field (reusing function)
                const formatDate = function(date) {
                    return ('0' + date.getDate()).slice(-2) + '.' +
                           ('0' + (date.getMonth() + 1)).slice(-2) + '.' +
                           date.getFullYear();
                };
                
                // Update rental dates field
                jQuery('input#rental_dates').val(formatDate(startDate) + ' - ' + formatDate(endDate));
                
                return true;
            };
            
            console.log('💥 validateDateRange function forcefully replaced');
        `;
        
        // Add the script to the document
        document.head.appendChild(forceFixScript);
        
        // Force validation of current selection
        setTimeout(function() {
            if (window.selectedDates && window.selectedDates.length === 2) {
                console.log('⚡ Force validating current selection');
                window.validateDateRange();
            }
        }, 500);
    }, 1000); // Wait for everything else to load
    
    // Add a click handler to force revalidation when dates are selected
    $(document).on('click', '.day-cell', function() {
        setTimeout(function() {
            if (window.selectedDates && window.selectedDates.length === 2) {
                console.log('⚡ Forcing validation after date click');
                if (typeof window.validateDateRange === 'function') {
                    window.validateDateRange();
                }
            }
        }, 300);
    });
});
