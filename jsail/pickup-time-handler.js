/**
 * Unified Pickup Time Handler for Mitnafun
 * Manages display and logic for pickup times based on admin settings and booking rules
 */
(function($) {
    'use strict';

    // Wait for document ready to initialize
    $(document).ready(function() {
        // Initialize the handler
        console.log('Initializing Unified Pickup Time Handler');
        initPickupTimeHandler();
    });

    // Initialize the pickup time handler
    function initPickupTimeHandler() {
        // Cache DOM elements for better performance
        const pickupTimeField = $('#pickup_time');
        const pickupTimeContainer = $('#pickup_time_field');
        
        // Check if pickup time field exists
        if (!pickupTimeField.length) {
            console.log('Pickup time field not found, skipping initialization');
            return;
        }

        // Create UI elements
        const businessHoursInfo = $('<div class="business-hours-info"></div>');
        const pickupTimeNotice = $('<div class="pickup-time-notice"></div>');
        const pickupTimeError = $('<div class="pickup-time-error"></div>');
        
        // Add styling for the pickup time elements
        addStyles();
        
        // Initialize the pickup time field wrapper
        if (!pickupTimeField.parent().hasClass('pickup-time-wrapper')) {
            pickupTimeField.wrap('<div class="pickup-time-wrapper"></div>');
        }
        
        // Set the default pickup time from the admin setting (this value comes from PHP)
        const defaultPickupHour = parseInt(mitnafun_booking_data.pickup_override) || 11;
        const defaultPickupTime = defaultPickupHour + ':00';
        
        console.log('Pickup override from server:', mitnafun_booking_data.pickup_override);
        console.log('Default pickup hour:', defaultPickupHour);
        console.log('Default pickup time:', defaultPickupTime);
        
        // Add fixed business hours information below the pickup time field
        businessHoursInfo.html(`
            <strong>שעות פעילות:</strong><br>
            א׳–ה׳: 08:00–16:00<br>
            ו׳: 08:00–14:00<br>
            <span style="font-size:13px; margin-top:8px; display:block;">במידה שבחרתם שעה שונה<br>מומלץ לתאם שעת איסוף שונה גם בטלפון: <a href="tel:0505544516">050-5544516</a></span>
        `);

        
        // Add custom pickup notice if admin has set a specific time
        if (defaultPickupHour !== 11) {
            pickupTimeNotice.html(`
                <strong>שים לב:</strong> לפריט זה נקבעה שעת איסוף מיוחדת של ${defaultPickupTime}.
            `);
            pickupTimeNotice.show();
        } else {
            pickupTimeNotice.hide();
        }
        
        // Add the elements to the DOM
        $('.pickup-time-error').remove(); // Remove any existing error messages
        $('.business-hours-info').remove(); // Remove any existing business hours info
        $('.pickup-time-notice').remove(); // Remove any existing notices
        
        pickupTimeField.after(pickupTimeError);
        pickupTimeField.after(pickupTimeNotice);
        pickupTimeField.parent().after(businessHoursInfo);
        
        // Remove or neutralize conflicting scripts that might force specific times
        neutralizeConflictingScripts();
        
        // Generate time options based on business hours
        generateTimeOptions(pickupTimeField, defaultPickupHour, defaultPickupTime);
        
        // Listen for date changes to update time options accordingly
        $('body').on('change', 'input[name="pickup_date"]', function() {
            generateTimeOptions(pickupTimeField, defaultPickupHour, defaultPickupTime);
        });
        
        // Listen for time changes to validate and update UI accordingly
        pickupTimeField.on('change', function() {
            // Additional validation if needed
        });
    }
    
    // Add necessary styles for the pickup time UI
    function addStyles() {
        // Only add styles once
        if ($('#pickup-time-styles').length) {
            return;
        }
        
        // Create and add stylesheet
        const styleElement = $('<style id="pickup-time-styles"></style>');
        styleElement.html(`
            .pickup-time-wrapper {
                position: relative;
                width: 100%;
            }
            
            .pickup-time-error {
                color: #e74c3c;
                margin-top: 5px;
                font-weight: bold;
                display: none;
            }
            
            .pickup-time-notice {
                background-color: #e8f4ff;
                color: #2980b9;
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                border-right: 4px solid #3498db;
                font-size: 14px;
                line-height: 1.4;
                display: block;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .business-hours-info {
                background-color: #f9f9f9;
                color: #333;
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                font-size: 14px;
                line-height: 1.4;
            }
            
            /* Style for disabled time options */
            select#pickup_time option:disabled {
                color: #ccc;
                background-color: #f5f5f5;
            }
        `);
        
        // Add the styles to the page
        $('head').append(styleElement);
    }
    
    // Remove or neutralize conflicting scripts that might force specific times
    function neutralizeConflictingScripts() {
        // If there's a global forcePickupTimeDisplay function, override it to do nothing
        if (typeof window.forcePickupTimeDisplay === 'function') {
            console.log('Neutralizing conflicting pickup time force function');
            window.forcePickupTimeDisplay = function() {
                console.log('Pickup time force function neutralized');
                return false;
            };
        }
        
        // Clear any upcoming setTimeout that might force time
        const scriptIDs = [];
        for (let i = 1; i < 100; i++) {
            if (window['timeoutID' + i]) {
                clearTimeout(window['timeoutID' + i]);
                scriptIDs.push(i);
            }
        }
        
        if (scriptIDs.length) {
            console.log('Cleared conflicting timeouts:', scriptIDs);
        }
    }
    
    // Format time for display (consider internationalization later)
    function formatTime(hour) {
        return hour + ':00';
    }
    
    // Generate time options based on business hours
    function generateTimeOptions(pickupTimeField, defaultPickupHour, defaultPickupTime) {
        if (!pickupTimeField || !pickupTimeField.length) return;
        
        // Clear existing options
        pickupTimeField.empty();
        
        const today = new Date();
        const isFriday = today.getDay() === 5; // Friday is 5
        
        // Set business hours based on day
        let startHour = 8; // Default start time
        let endHour = isFriday ? 14 : 16; // End time - earlier on Friday
        
        // Generate options for each hour
        let defaultFound = false;
        for (let hour = startHour; hour <= endHour; hour++) {
            const timeOption = formatTime(hour);
            const option = new Option(timeOption, timeOption);
            
            // Set the default pickup time from admin settings
            if (hour === defaultPickupHour) {
                option.selected = true;
                defaultFound = true;
                console.log('Setting default pickup time option:', timeOption);
            }
            
            pickupTimeField.append(option);
        }
        
        // If the admin-specified default is outside business hours, add it separately
        if (!defaultFound && defaultPickupHour >= 8 && defaultPickupHour <= 18) {
            const timeOption = formatTime(defaultPickupHour);
            const option = new Option(timeOption, timeOption);
            option.selected = true;
            pickupTimeField.append(option);
            console.log('Adding special pickup time option outside business hours:', timeOption);
        }
        
        // Manually set the value to ensure it takes effect
        pickupTimeField.val(defaultPickupTime);
        console.log('After setting value, current pickup time is:', pickupTimeField.val());
        
        // If the selected date is today, check if we need to disable past times
        checkForSameDayTimeRestrictions(pickupTimeField, defaultPickupTime);
    }
    
    // Check for same-day time restrictions and update available pickup times
    function checkForSameDayTimeRestrictions(pickupTimeField, defaultPickupTime) {
        if (!pickupTimeField || !pickupTimeField.length) return;
        
        const selectedDateInput = $('input[name="pickup_date"]');
        if (!selectedDateInput.length) return;
        
        const selectedDate = selectedDateInput.val();
        if (!selectedDate) return;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // If selected date is today, disable past times
        if (selectedDate === todayStr) {
            const currentHour = today.getHours();
            
            // Disable options for times that have already passed plus 2 hour buffer
            pickupTimeField.find('option').each(function() {
                const optionHour = parseInt($(this).val());
                
                // Disable times that have passed plus 2 hour buffer
                if (optionHour <= currentHour + 2) {
                    $(this).prop('disabled', true).css('color', '#999');
                }
            });
            
            // Check if the currently selected time is disabled
            if (pickupTimeField.find('option:selected').prop('disabled')) {
                // Find the first available time
                const firstAvailable = pickupTimeField.find('option:not(:disabled)').first();
                
                if (firstAvailable.length) {
                    firstAvailable.prop('selected', true);
                    
                    // Show notice about adjusted pickup time
                    $('.pickup-time-notice').html(`
                        <strong>שים לב:</strong> זמן האיסוף הותאם אוטומטית בשל הזמנה לאותו היום.
                        איסוף אפשרי החל מהשעה ${firstAvailable.val()}.
                    `).show();
                } else {
                    // No available times today
                    $('.pickup-time-error').text('אין זמני איסוף זמינים היום. אנא בחר תאריך אחר.').show();
                    $('.woocommerce-checkout-payment, .place-order').addClass('disabled-payment');
                }
            }
        } else {
            // Not today, enable all options and hide notices
            pickupTimeField.find('option').prop('disabled', false).css('color', '');
            $('.pickup-time-notice').hide();
            $('.pickup-time-error').hide();
            $('.woocommerce-checkout-payment, .place-order').removeClass('disabled-payment');
            
            // Reset to the default pickup time
            pickupTimeField.val(defaultPickupTime);
        }
    }
    
    // Run again after window is fully loaded to catch any late-initialized elements
    $(window).on('load', function() {
        setTimeout(function() {
            initPickupTimeHandler();
        }, 500);
    });
    
})(jQuery);
