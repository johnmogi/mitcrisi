/**
 * Last Minute Booking Prevention for Mitnafun
 * Blocks orders made less than 2 hours before pickup time
 */
(function($) {
    'use strict';
    
    // Default minimum pickup hour (fallback)
    window.minPickupHour = 11;
    
    // Contact phone for last-minute bookings
    const CONTACT_PHONE = '050-5544516';
    
    // Global variable for cutoff time check
    window.isPastCutoffTime = false;
    
    // Run immediate check when script loads
    $(document).ready(function() {
        console.log('LAST-MINUTE CHECK: Script loaded - running initial check');
        
        // Run initial check regardless of selection to set the global isPastCutoffTime flag
        runLastMinuteCheck();
        
        // Check if today is already selected
        setTimeout(function() {
            if (window.selectedDates && window.selectedDates.length > 0) {
                const today = new Date();
                const selectedDate = new Date(window.selectedDates[0]);
                
                if (selectedDate.getDate() === today.getDate() && 
                    selectedDate.getMonth() === today.getMonth() && 
                    selectedDate.getFullYear() === today.getFullYear()) {
                    
                    console.log('LAST-MINUTE CHECK: Today already selected, checking if booking should be blocked');
                    checkLastMinuteBooking();
                }
            }
        }, 500);
    });
    
    /**
     * Run a check immediately to set the global isPastCutoffTime flag
     */
    function runLastMinuteCheck() {
        // Bypass cutoff logic if multiple items in stock
        if (window.stockQuantity > 1) {
            console.log('Stock >1: skipping last-minute cutoff check');
            window.isPastCutoffTime = false;
            return false;
        }
        
        // Get today's date and time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        console.log('LAST-MINUTE CHECK: Current time is ' + currentHour + ':' + currentMinute);
        
        // Default pickup time: use product setting or custom override
        const pickupHour = window.productPickupTime || window.customPickupHour || 13;
        
        // Determine cutoff time (2 hours before pickup)
        const cutoffHour = pickupHour - 2;
        
        // Check if we're past the cutoff time
        const isPastCutoff = currentHour >= cutoffHour;
        
        // Set global flag for use throughout the app
        window.isPastCutoffTime = isPastCutoff;
        
        console.log('LAST-MINUTE CHECK: Pickup hour:', pickupHour);
        console.log('LAST-MINUTE CHECK: Cutoff hour:', cutoffHour);
        console.log('LAST-MINUTE CHECK: Is past cutoff?', isPastCutoff);
        
        return isPastCutoff;
    }
    
    /**
     * Check if this is a last-minute booking (same day, less than 2 hours before pickup)
     * @returns {boolean} True if booking should be blocked
     */
    function checkLastMinuteBooking() {
        console.log('LAST-MINUTE CHECK: Running check');
        
        // Don't run check if no dates selected
        if (!window.selectedDates || window.selectedDates.length < 1) {
            console.log('LAST-MINUTE CHECK: No dates selected, skipping check');
            return true;
        }
        
        // Only check if a date is selected
        if (!window.selectedDates || window.selectedDates.length === 0) {
            console.log('LAST-MINUTE CHECK: No dates selected yet');
            return false;
        }
        
        // Bypass same-day booking block when multiple items in stock
        if (window.stockQuantity > 1) {
            console.log('Stock >1: skipping last-minute booking block');
            return false;
        }
        
        // Get today's date - use non-changing reference for today
        const todayNow = new Date();
        console.log('LAST-MINUTE CHECK: Current time:', todayNow.toLocaleTimeString());
        
        // Create clean date objects without time component to compare just the dates
        const today = new Date(todayNow.getFullYear(), todayNow.getMonth(), todayNow.getDate());
        
        // Get selected date without time component
        const selectedDateObj = window.selectedDates[0]; // This is already a Date object
        const selectedStartDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
        
        // Format selected date for logging
        const selectedDateStr = selectedStartDate.toISOString().split('T')[0];
        console.log('LAST-MINUTE CHECK: Selected date:', selectedDateStr);
        console.log('LAST-MINUTE CHECK: Today date:', today.toISOString().split('T')[0]);

        // Compare dates (year, month, day)
        const isSameDay = selectedStartDate.getFullYear() === today.getFullYear() && 
                         selectedStartDate.getMonth() === today.getMonth() && 
                         selectedStartDate.getDate() === today.getDate();
        
        console.log('LAST-MINUTE CHECK: Is same day?', isSameDay);
        
        // If not booking for today, no last-minute restriction
        if (!isSameDay) {
            console.log('LAST-MINUTE CHECK: Not same day booking, proceeding normally');
            
            // Hide any existing error messages since we're not booking for today
            if ($('#return-time-notice.error').length) {
                $('#return-time-notice.error').hide();
            }
            
            return false;
        }
        
        console.log('LAST-MINUTE CHECK: Same-day booking detected');
        
        // Get current hour and minute
        const currentHour = todayNow.getHours();
        const currentMinute = todayNow.getMinutes();
        console.log('LAST-MINUTE CHECK: Current time is ' + currentHour + ':' + currentMinute);
        
        // Default pickup time: use product setting or custom override
        const pickupHour = window.productPickupTime || window.customPickupHour || 13;
        
        // Check if we're within 2 hours of pickup
        const hoursUntilPickup = pickupHour - currentHour;
        const isWithinTwoHours = hoursUntilPickup < 2 || (hoursUntilPickup === 2 && currentMinute > 0);
        
        // Check if we're past the cutoff time for same-day bookings
        const cutoffHour = 11; // 2 hours before pickup
        const isPastCutoff = currentHour >= cutoffHour;
        
        // Set global flag for use throughout the app
        window.isPastCutoffTime = isPastCutoff;
        
        console.log('LAST-MINUTE CHECK: Hours until pickup:', hoursUntilPickup);
        console.log('LAST-MINUTE CHECK: Is within 2 hours?', isWithinTwoHours);
        
        // Always block same-day bookings after a certain time
        // Since pickup is at 13:00, and we need 2 hours, block bookings after 11:00
        if (currentHour >= 11 || isWithinTwoHours) {
            console.log('LAST-MINUTE CHECK: Booking blocked - less than 2 hours before pickup');
            
            // Force block the date selection
            if (window.selectedDates && window.selectedDates.length > 0) {
                // Clear date selection immediately
                if (typeof clearDateSelection === 'function') {
                    clearDateSelection();
                } else {
                    // Fallback if clearDateSelection function isn't available
                    window.selectedDates = [];
                    $('#rental_date').val('');
                    $('.single_add_to_cart_button').prop('disabled', true).attr('disabled', 'disabled');
                }
            }
            
            // Show error message with contact phone
            if (typeof updateSelectedRangeDisplay === 'function') {
                updateSelectedRangeDisplay(
                    'לא ניתן להזמין ברגע האחרון (פחות משעתיים לפני איסוף). אנא צור קשר בטלפון ' + 
                    CONTACT_PHONE + ' להזמנות דחופות', 
                    'error'
                );
            } else {
                // Direct approach if function is not available
                if ($('#date-validation-message').length === 0) {
                    $('#datepicker-container').after('<div id="date-validation-message" class="validation-message error"></div>');
                }
                
                $('#date-validation-message')
                    .removeClass('success info')
                    .addClass('error')
                    .html('לא ניתן להזמין ברגע האחרון (פחות משעתיים לפני איסוף). אנא צור קשר בטלפון ' + 
                        CONTACT_PHONE + ' להזמנות דחופות')
                    .show();
            }
            
            // Disable all cells for today to prevent selection
            $('.day-cell.today').attr('data-selectable', 'false').addClass('disabled');
            
            // Disable the add to cart button
            $('.single_add_to_cart_button').prop('disabled', true).attr('disabled', 'disabled');
            
            return true;
        }
        
        console.log('LAST-MINUTE CHECK: Booking allowed - more than 2 hours before pickup');
        return false;
    }
    
    // Add the function to the global scope
    window.checkLastMinuteBooking = checkLastMinuteBooking;
    
    /**
     * Add a return time notice to the date validation message
     */
    function addReturnTimeNotice() {
        // Only add if we have a success message
        if ($('#date-validation-message').hasClass('success')) {
            // Check if notice already exists
            if ($('#return-time-notice').length === 0) {
                // Create the return time notice without required checkbox
                const noticeHtml = '<div id="return-time-notice" class="return-time-notice info">' +
                    '<strong>שימו לב!</strong> החזרת הציוד מתבצעת עד השעה 10:00 בבוקר.' +
                    '</div>';
                
                // Add after date validation message
                $('#date-validation-message').after(noticeHtml);
                
                // Style the notice
                $('<style>' +
                    '.return-time-notice { background-color: #e7f3fe; border: 1px solid #b9d4f8; padding: 10px; margin: 10px 0; border-radius: 4px; }' +
                    '</style>').appendTo('head');
            }
        }
    }
    
    // Function to hide the same-day booking error message when a different date is selected
    function hideSameDayBookingError() {
        $('.same-day-booking-error').hide();
        $('#place_order').prop('disabled', false).removeClass('disabled');
    }
    
    // Function to display the same-day booking error
    function showSameDayBookingError(message) {
        // If no custom message is provided, use the default
        if (!message) {
            message = 'לא ניתן להזמין לאותו היום אחרי השעה ' + 
                        (mitnafun_booking_data.pickup_override || '11:00') + 
                        '. נא לפנות ' + mitnafun_booking_data.contact_phone;
        }
        
        // Create the error message container if it doesn't exist
        if ($('.same-day-booking-error').length === 0) {
            $('<div class="same-day-booking-error" style="color: #d63638; margin: 15px 0; padding: 12px; background-color: #fcf2f3; border-left: 4px solid #d63638; font-weight: bold;"></div>')
                .insertBefore($('.place-order'));
        }
        
        // Update the error message and show it
        $('.same-day-booking-error').html(message).show();
        
        // Disable the place order button
        $('#place_order').prop('disabled', true).addClass('disabled');
    }
    
    // Update the date validation function to work better with our new pickup time handler
    function validateSelectedDate() {
        const selectedDateInput = $('input[name="pickup_date"]');
        if (!selectedDateInput.length) return;
        
        const selectedDate = selectedDateInput.val();
        if (!selectedDate) return;
        
        const today = new Date();
        const currentHour = today.getHours();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get the cutoff hour from the data passed from PHP
        const cutoffHour = parseInt(mitnafun_booking_data.pickup_override) || 11;
        
        // Check if today is selected and if current time is past the cutoff
        if (selectedDate === todayStr) {
            if (currentHour >= cutoffHour) {
                // After cutoff time, show error and disable checkout
                showSameDayBookingError();
                return false;
            } else {
                // Before cutoff, but we still need to check if any pickup times are available
                const availablePickupTimes = $('#pickup_time option:not(:disabled)').length;
                
                if (availablePickupTimes === 0) {
                    // No available times today
                    showSameDayBookingError('אין זמני איסוף זמינים היום. אנא בחר תאריך אחר.');
                    return false;
                } else {
                    // There are available times
                    hideSameDayBookingError();
                    return true;
                }
            }
        } else {
            // Not today, validation passes
            hideSameDayBookingError();
            return true;
        }
    }
    
    // Listen for date changes
    $('body').on('change', 'input[name="pickup_date"]', function() {
        validateSelectedDate();
    });
    
    // Listen for pickup time changes
    $('body').on('change', '#pickup_time', function() {
        // Re-validate the date when pickup time changes
        validateSelectedDate();
    });
    
    // Initialize validation when the page loads
    $(document).on('ready', function() {
        if ($('input[name="pickup_date"]').length) {
            validateSelectedDate();
        }
    });
    
    // Add hook to validate booking when dates are selected
    $(document).ready(function() {
        console.log('LAST-MINUTE CHECK: Adding hook for date selection');
        
        // Check after datepicker is initialized
        setTimeout(function() {
            // Check today's booking on page load
            checkLastMinuteBooking();
            
            // Disable today's date in the calendar at page load if it's past cutoff
            if (window.isPastCutoffTime) {
                console.log('LAST-MINUTE CHECK: Past cutoff time, disabling today\'s cell');
                setTimeout(function() {
                    $('.day-cell.today').addClass('disabled').attr('data-selectable', 'false');
                    
                    // Show warning message in multiple places for visibility
                    // 1. In the date selection area
                    if (typeof updateSelectedRangeDisplay === 'function') {
                        updateSelectedRangeDisplay(
                            'לא ניתן להזמין להיום (פחות משעתיים לפני איסוף). אנא צור קשר בטלפון ' + 
                            CONTACT_PHONE + ' להזמנות דחופות או בחר תאריך אחר', 
                            'error'
                        );
                    }
                    
                    // Don't show red message on page load, only when user tries to select today
                    // No need to reset the notice since we've removed the element
                }, 500);
            }
            
            // Monitor day-cell clicks - aggressive prevention
            $(document).on('mousedown mouseup click', '.day-cell.today', function(e) {
                // If we're past the cutoff time, block ALL interactions with today's cell
                if (window.isPastCutoffTime) {
                    console.log('LAST-MINUTE CHECK: Blocking today cell interaction');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    // Ensure the cell is visually disabled
                    $(this).addClass('disabled').attr('data-selectable', 'false');
                    
                    // Show error message in both places
                    // 1. In the date selection validation area
                    if (typeof updateSelectedRangeDisplay === 'function') {
                        updateSelectedRangeDisplay(
                            'לא ניתן להזמין להיום (פחות משעתיים לפני איסוף). אנא צור קשר בטלפון ' + 
                            CONTACT_PHONE + ' להזמנות דחופות', 
                            'error'
                        );
                    }
                    
                    // 2. Show the red notice only when user tries to select today
                    $('#return-time-notice').html('<strong>שימו לב</strong> - לא ניתן להזמין להיום (אחרי 11:00). אנא צרו קשר בטלפון ' + CONTACT_PHONE + ' להזמנות דחופות');
                    $('#return-time-notice').addClass('error').css({
                        'background-color': '#fff2f2',
                        'border': '1px solid #ff6b6b',
                        'color': '#c00',
                        'padding': '10px',
                        'margin-bottom': '15px',
                        'font-weight': 'bold'
                    });
                    return false;
                }
            });
            
            // Add validation to confirm date button
            $(document).on('click', '#confirm-dates-button', function(e) {
                if (window.selectedDates && window.selectedDates.length >= 1) {
                    if (checkLastMinuteBooking()) {
                        e.preventDefault();
                        return false;
                    }
                }
            });
            
            // Also check when adding to cart
            $('form.cart').on('submit', function(e) {
                if (checkLastMinuteBooking()) {
                    e.preventDefault();
                    return false;
                }
            });
            
            // Monitor validation message changes for adding return time notice
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' || mutation.type === 'childList') {
                        addReturnTimeNotice();
                    }
                });
            });
            
            // Start observing validation message changes
            const validationMsg = document.getElementById('date-validation-message');
            if (validationMsg) {
                observer.observe(validationMsg, { attributes: true, childList: true });
            }
            
            // Initial call for return time notice
            addReturnTimeNotice();
        }, 500);
    });
    
})(jQuery);
