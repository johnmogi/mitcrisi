/**
 * Checkout Time Validator
 * Prevents selection of pickup times when there are earlier returns scheduled
 * Version: 1.1.0 - Enhanced blocking for same-day returns
 */
jQuery(document).ready(function($) {
    // Configuration
    const DEFAULT_RETURN_TIME = '11:00'; // Default return time
    const TIME_BUFFER = 60; // Buffer in minutes between return and new pickup
    
    // Debug mode - set to false for production
    const DEBUG = false;
    
    // Safe logging function
    function log(message, data = null) {
        if (DEBUG && window.console && console.log) {
            if (data) {
                console.log(`[Time Validator] ${message}`, data);
            } else {
                console.log(`[Time Validator] ${message}`);
            }
        }
    }
    
    log('Initializing checkout time validator');
    
    /**
     * Check for conflicting returns on the selected date
     */
    function checkForConflictingReturns() {
        // Only run on checkout page
        if (!$('#pickup_time').length || !$('form.checkout').length) {
            return;
        }
        
        log('Found pickup time field, initializing validation');
        
        // Get the selected pickup date
        const pickupDateField = $('input[name="pickup_date"]');
        if (!pickupDateField.length) {
            log('Could not find pickup date field');
            return;
        }
        
        const pickupDate = pickupDateField.val();
        if (!pickupDate) {
            log('No pickup date selected yet');
            return;
        }
        
        // Format date for comparison (DD.MM.YYYY to YYYY-MM-DD)
        const dateParts = pickupDate.split('.');
        if (dateParts.length !== 3) {
            log('Invalid date format:', pickupDate);
            return;
        }
        
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        log(`Checking for conflicting returns on ${formattedDate}`);
        
        // Query the server for returns on this date
        $.ajax({
            url: wc_checkout_params.ajax_url,
            type: 'POST',
            data: {
                action: 'get_returns_for_date',
                date: formattedDate,
                nonce: wc_checkout_params.checkout_nonce
            },
            success: function(response) {
                if (response.success) {
                    updateTimeDropdown(response.data.returns);
                } else {
                    log('Error fetching return data:', response.data.message);
                }
            },
            error: function(xhr, status, error) {
                log('AJAX error:', error);
            }
        });
    }
    
    /**
     * Update the time dropdown based on scheduled returns
     */
    function updateTimeDropdown(returns) {
        const timeDropdown = $('#pickup_time');
        if (!timeDropdown.length) return;
        
        // Get all available times
        const allTimes = [];
        timeDropdown.find('option').each(function() {
            allTimes.push({
                value: $(this).val(),
                time: convertTimeToMinutes($(this).val())
            });
        });
        
        // Process returns data
        let earliestReturn = null;
        if (returns && returns.length) {
            log('Found returns for this date:', returns);
            
            returns.forEach(returnInfo => {
                const returnTime = returnInfo.return_time || DEFAULT_RETURN_TIME;
                const returnMinutes = convertTimeToMinutes(returnTime);
                
                if (!earliestReturn || returnMinutes < earliestReturn) {
                    earliestReturn = returnMinutes;
                }
            });
            
            // If we found an earliest return, disable times before or at the same time
            if (earliestReturn !== null) {
                const cutoffTime = earliestReturn + TIME_BUFFER;
                log(`Earliest return is at ${minutesToTimeString(earliestReturn)}, cutoff time: ${minutesToTimeString(cutoffTime)}`);
                
                // Disable options and show warning
                timeDropdown.find('option').each(function() {
                    const timeValue = convertTimeToMinutes($(this).val());
                    if (timeValue <= cutoffTime) {
                        $(this).prop('disabled', true)
                            .attr('title', `זמן זה אינו זמין עקב החזרה מתוכננת בשעה ${minutesToTimeString(earliestReturn)}`);
                        log(`Disabled time: ${$(this).val()}`);
                    }
                });
                
                // Add a notice
                const noticeContainer = $('.pickup-time-notice');
                if (noticeContainer.length) {
                    noticeContainer.html(
                        `<div class="woocommerce-info">` +
                        `<strong>שימו לב!</strong> זמני איסוף לפני השעה ${minutesToTimeString(cutoffTime)} אינם זמינים ` +
                        `עקב החזרת ציוד מתוכננת בשעה ${minutesToTimeString(earliestReturn)}.` +
                        `</div>`
                    ).show();
                }
                
                // If current selection is disabled, select the first available time
                if (timeDropdown.find('option:selected').prop('disabled')) {
                    const firstAvailable = timeDropdown.find('option:not(:disabled)').first();
                    if (firstAvailable.length) {
                        timeDropdown.val(firstAvailable.val()).trigger('change');
                        log(`Auto-selected first available time: ${firstAvailable.val()}`);
                    }
                }
            }
        } else {
            log('No returns found for this date');
            // Clear any notices
            $('.pickup-time-notice').hide();
            // Enable all times
            timeDropdown.find('option').prop('disabled', false);
        }
    }
    
    /**
     * Convert time string (HH:MM) to minutes since midnight
     */
    function convertTimeToMinutes(timeString) {
        const parts = timeString.split(':');
        if (parts.length !== 2) return 0;
        
        return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
    }
    
    /**
     * Convert minutes since midnight to time string (HH:MM)
     */
    function minutesToTimeString(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    // Initialize when date changes
    $(document).on('change', 'input[name="pickup_date"]', function() {
        checkForConflictingReturns();
    });
    
    // Initialize on page load if date is already selected
    if ($('input[name="pickup_date"]').val()) {
        checkForConflictingReturns();
    }
});
