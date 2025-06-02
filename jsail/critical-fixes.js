/**
 * Critical fixes for Mitnafun rental booking system
 * Addresses:
 * 1. Calendar selection not properly displaying selected dates
 * 2. Order Now button not redirecting to checkout
 * 3. Sticky same-day booking messages
 */
jQuery(document).ready(function($) {
    // Debug flag - set to false to disable all console logs
    window.mitnafunDebug = false;
    
    // Debug logging function
    function debugLog(message, data) {
        if (window.mitnafunDebug) {
            if (data) {
                console.log(message, data);
            } else {
                console.log(message);
            }
        }
    }
    
    // Expose debug controls to window
    window.mitnafunEmergencyFixes = window.mitnafunEmergencyFixes || {};
    window.mitnafunEmergencyFixes.enableDebug = function() {
        window.mitnafunDebug = true;
        debugLog("Debug mode enabled");
    };
    window.mitnafunEmergencyFixes.disableDebug = function() {
        window.mitnafunDebug = false;
        console.log("Debug mode disabled");
    };
    
    // ULTRA AGGRESSIVE DEBUG MODE
    debugLog(" [CRITICAL-FIXES DEBUG] Script loaded at: " + new Date().toISOString() + " ");
    debugLog(" [CRITICAL-FIXES DEBUG] Window selectedDates:", window.selectedDates);
    
    // Debug function to monitor DOM changes
    function debugElementState(selector, label) {
        if (!window.mitnafunDebug) return;
        
        const elements = $(selector);
        debugLog(` [CRITICAL-FIXES DEBUG] ${label} - Found ${elements.length} elements:`, 
            elements.map(function() {
                return {
                    text: $(this).text().trim(),
                    classes: $(this).attr('class'),
                    dataDate: $(this).attr('data-date'),
                    style: $(this).attr('style')
                };
            }).get()
        );
    }
    
    // Add a brightly colored visual indicator to console only in debug mode
    if (window.mitnafunDebug) {
        console.log("%c  CRITICAL FIXES ACTIVE ", "background: #ff0000; color: white; font-size: 20px; padding: 10px; border-radius: 5px;");
    }
    
    // DIRECT DOM INJECTION FOR SELECTED AND IN-RANGE CELLS
    // Pre-define the CSS to inject for super aggressive styling
    const EMERGENCY_CSS = `
        /* ULTRA-AGGRESSIVE OVERRIDE for day-cell styling - Professional version */
        
        /* START DATE - Left side rounded */
        .fallback-calendar .day-cell.start-date,
        .fallback-calendar .day-cell.selected-start {
            background: linear-gradient(90deg, #2980b9 0%, #3498db 100%) !important;
            color: white !important;
            font-weight: bold !important;
            border-radius: 8px 0 0 8px !important;
            border: none !important;
            box-shadow: inset 0 0 0 2px #fff, 0 2px 4px rgba(0,0,0,0.15) !important;
            position: relative !important;
            z-index: 100 !important;
            transform: scale(1.05) !important;
            transition: all 0.2s ease !important;
        }
        
        /* END DATE - Right side rounded */
        .fallback-calendar .day-cell.end-date,
        .fallback-calendar .day-cell.selected-end {
            background: linear-gradient(90deg, #3498db 0%, #2980b9 100%) !important;
            color: white !important;
            font-weight: bold !important;
            border-radius: 0 8px 8px 0 !important;
            border: none !important;
            box-shadow: inset 0 0 0 2px #fff, 0 2px 4px rgba(0,0,0,0.15) !important;
            position: relative !important;
            z-index: 100 !important;
            transform: scale(1.05) !important;
            transition: all 0.2s ease !important;
        }
        
        /* RTL Support - Reverse border radius for RTL layouts */
        html[dir="rtl"] .fallback-calendar .day-cell.start-date,
        html[dir="rtl"] .fallback-calendar .day-cell.selected-start {
            border-radius: 0 8px 8px 0 !important;
        }
        
        html[dir="rtl"] .fallback-calendar .day-cell.end-date,
        html[dir="rtl"] .fallback-calendar .day-cell.selected-end {
            border-radius: 8px 0 0 8px !important;
        }
        
        /* Single date selection (start = end) */
        .fallback-calendar .day-cell.selected.start-date.end-date,
        .fallback-calendar .day-cell.selected.selected-start.selected-end,
        .fallback-calendar .day-cell.selected:only-child {
            background: linear-gradient(135deg, #2980b9 0%, #3498db 50%, #2980b9 100%) !important;
            border-radius: 8px !important;
            box-shadow: inset 0 0 0 2px #fff, 0 2px 4px rgba(0,0,0,0.15) !important;
            transform: scale(1.05) !important;
        }
        
        /* Special styling for when the selection is ONLY the start date */
        .fallback-calendar .day-cell.selected:only-of-type {
            background: linear-gradient(135deg, #2980b9 0%, #3498db 50%, #2980b9 100%) !important;
            border-radius: 8px !important; 
            box-shadow: inset 0 0 0 2px #fff, 0 2px 4px rgba(0,0,0,0.15) !important;
            transform: scale(1.05) !important;
        }
        
        /* Professional in-range styling */
        .fallback-calendar .day-cell.in-range {
            background-color: #e6f0ff !important;
            color: #1a4a6b !important;
            font-weight: normal !important;
            border: none !important;
            box-shadow: 0 1px 1px rgba(0,0,0,0.05) !important;
            position: relative !important;
            z-index: 50 !important;
        }
        
        /* Weekend dates styling */
        .fallback-calendar .day-cell.weekend-date {
            background-color: #f7f9fc !important;
            color: #999 !important;
            position: relative !important;
        }
        
        /* Weekend dates in range - slightly different styling */
        .fallback-calendar .day-cell.in-range.weekend-date {
            background-color: #eef5ff !important;
            color: #6e8caa !important;
            opacity: 0.85 !important;
        }
        
        /* Error styling for selected dates - no blinking, just subtle indication */
        .fallback-calendar .day-cell.error-selection,
        .air-datepicker-cell.error-selection {
            background-color: #f8f8f8 !important;
            color: #666 !important;
            font-weight: normal !important;
            box-shadow: inset 0 0 0 1px #ddd !important;
            opacity: 0.85 !important;
        }
        
        /* Fix the width jumping in discount description */
        .mitnafun-breakdown {
            min-width: 300px !important;
            background-color: #f5f5f5 !important; /* Light gray background */
            border: 1px solid #ddd !important;
            padding: 5px !important;
        }
        
        /* Hide same-day booking warnings */
        .same-day-booking-warning, 
        .late-booking-notice, 
        #same-day-booking-message,
        .day-cell[data-pickup-notice] {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        /* Hide Shabbat error messages anywhere they appear */
        .validation-message.error:contains('לא ניתן להזמין לשבת'),
        .validation-message:contains('מערכת סגורה'),
        #date-validation-message:contains('לא ניתן להזמין לשבת') {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        /* Make confirm button more visible */
        .btn-confirm-dates {
            background-color: #28a745 !important;
            color: white !important;
            padding: 10px 15px !important;
            margin: 10px 0 !important;
            font-weight: bold !important;
            animation: pulseButton 1s infinite !important;
        }
        
        @keyframes pulseButton {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    
    // Inject our emergency CSS - REMOVE ANY EXISTING ONE FIRST
    $('#critical-calendar-override').remove();
    $('head').append(`<style id="critical-calendar-override">${EMERGENCY_CSS}</style>`);
    debugLog(" [CRITICAL-FIXES DEBUG] Emergency CSS injected with id 'critical-calendar-override'");
    
    // ULTRA AGGRESSIVE CALENDAR SELECTION HANDLING
    // Direct event handlers and hooks
    
    // 1. INTERCEPT DIRECT CALENDAR CELL CLICKS
    $(document).on('mousedown', '.day-cell', function(event) {
        debugLog(" [CRITICAL-FIXES DEBUG] Day cell clicked:", {
            text: $(this).text().trim(),
            date: $(this).attr('data-date'),
            classes: $(this).attr('class')
        });
        
        // Set a timeout for styling to catch up with event processing
        setTimeout(forceCalendarStyling, 10);
        setTimeout(forceCalendarStyling, 100);
        setTimeout(forceCalendarStyling, 500);
    });
    
    // 2. INTERCEPT CONFIRMATION BUTTON CLICKS
    $(document).on('click', '#confirm-dates, .button.confirm-dates-btn', function(event) {
        debugLog(" [CRITICAL-FIXES DEBUG] Confirmation button clicked");
        
        // Apply styling multiple times to ensure it sticks
        setTimeout(forceCalendarStyling, 10);
        setTimeout(forceCalendarStyling, 100);
        setTimeout(forceCalendarStyling, 500);
        setTimeout(forceCalendarStyling, 1000);
        
        // Fix add to cart button
        setTimeout(fixAddToCartButton, 100);
        setTimeout(fixAddToCartButton, 500);
    });
    
    // OVERRIDE ORIGINAL updateCalendarSelection FUNCTION
    if (typeof window.originalUpdateCalendarSelection !== 'function') {
        debugLog(" [CRITICAL-FIXES DEBUG] Overriding updateCalendarSelection function");
        // Save original function if it exists
        if (typeof window.updateCalendarSelection === 'function') {
            window.originalUpdateCalendarSelection = window.updateCalendarSelection;
            
            // Replace with our enhanced version
            window.updateCalendarSelection = function() {
                debugLog(" [CRITICAL-FIXES DEBUG] Enhanced updateCalendarSelection called");
                
                // Call original function
                window.originalUpdateCalendarSelection.apply(this, arguments);
                
                // Then apply our aggressive styling
                forceCalendarStyling();
                
                // Debug
                debugElementState('.day-cell.selected', 'Selected cells after original function');
                debugElementState('.day-cell.in-range', 'In-range cells after original function');
            };
        } else {
            debugLog(" [CRITICAL-FIXES DEBUG] Original updateCalendarSelection function not found!");
        }
    }
    
    // ULTRA-AGGRESSIVE STYLING FUNCTION
    function forceCalendarStyling() {
        debugLog(" [CRITICAL-FIXES DEBUG] Forcing calendar styling at " + new Date().toTimeString());
        debugLog(" [CRITICAL-FIXES DEBUG] Current selectedDates:", window.selectedDates);
        
        try {
            // For debugging - check what classes are actually present
            debugElementState('.day-cell', 'All day cells before styling');
            
            // STEP 1: Remove ALL existing selection-related classes and styles to start clean
            $('.day-cell').removeClass('selected selected-start selected-end in-range in-selected-range start-date end-date confirmed')
                          .removeAttr('style');
            
            // If no dates selected, nothing to do
            if (!window.selectedDates || window.selectedDates.length === 0) {
                debugLog(" [CRITICAL-FIXES DEBUG] No dates selected, skipping styling");
                return;
            }
            
            // STEP 2: Check if the date range is valid - don't style if there's an error message
            const validationMessage = $('#date-validation-message');
            if (validationMessage.length && validationMessage.hasClass('error') && validationMessage.is(':visible')) {
                debugLog(" [CRITICAL-FIXES DEBUG] Error message visible, not applying styling:");
                debugLog("   Message: " + validationMessage.text());
                return;
            }
            
            // STEP 3: Get start and end dates, ensure they're actual Date objects
            const dates = window.selectedDates.map(d => new Date(d));
            dates.sort((a, b) => a - b); // Sort in ascending order for correct range
            
            // Format dates for comparison in YYYY-MM-DD format
            const formattedDates = dates.map(d => {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            });
            
            debugLog(" [CRITICAL-FIXES DEBUG] Dates to style, sorted:", formattedDates);
            
            // STEP 4: Get start and end dates explicitly - we'll only style exactly these days
            const startDate = dates[0];
            const endDate = dates.length > 1 ? dates[dates.length - 1] : startDate;
            const startDateFormatted = formattedDates[0];
            const endDateFormatted = formattedDates.length > 1 ? formattedDates[formattedDates.length - 1] : startDateFormatted;
            
            debugLog(` [CRITICAL-FIXES DEBUG] Start date: ${startDateFormatted}, End date: ${endDateFormatted}`);
            
            // STEP 5: Check if we're in a month where both start and end dates are visible
            let startDateVisible = $(`.day-cell[data-date="${startDateFormatted}"]`).length > 0;
            let endDateVisible = $(`.day-cell[data-date="${endDateFormatted}"]`).length > 0;
            
            debugLog(` [CRITICAL-FIXES DEBUG] Visibility check - Start date visible: ${startDateVisible}, End date visible: ${endDateVisible}`);
            
            // STEP 6: Apply styles to selected cells one by one, handling cross-month scenarios
            $('.day-cell').each(function() {
                const cellDate = $(this).attr('data-date');
                
                if (!cellDate) return;
                
                const dayNum = $(this).text().trim();
                const cellDateObj = new Date(cellDate);
                
                // First clear any existing styles/classes that might interfere
                $(this).removeClass('selected selected-start selected-end in-range in-selected-range start-date end-date confirmed')
                       .removeAttr('style');
                
                // Cross-month scenario handling
                if (!startDateVisible && !endDateVisible) {
                    // Neither start nor end date is visible, could be a middle month
                    // Check if this date is in the range
                    if (cellDateObj > startDate && cellDateObj < endDate) {
                        $(this).addClass('in-range');
                        $(this).css({
                            'background-color': '#cfe7ff',
                            'color': '#007bff',
                            'font-weight': 'bold',
                            'border': '1px solid #0056b3',
                            'position': 'relative',
                            'z-index': '5'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied IN-RANGE styling to middle-month ${cellDate} (Day ${dayNum})`);
                    }
                }
                // Start date visible but not end date (we're in the first month of a multi-month range)
                else if (startDateVisible && !endDateVisible) {
                    // Start date
                    if (cellDate === startDateFormatted) {
                        $(this).addClass('selected start-date selected-start');
                        $(this).css({
                            'background-color': '#007bff',
                            'color': 'white',
                            'font-weight': 'bold',
                            'border-radius': '24px',
                            'box-shadow': '0 0 0 2px #007bff, 0 0 0 3px white',
                            'border': '2px solid white',
                            'position': 'relative',
                            'z-index': '10',
                            'transform': 'scale(1.1)'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied START styling to ${cellDate} (Day ${dayNum})`);
                    }
                    // All other dates in this month should be in-range
                    else if (cellDateObj > startDate) {
                        $(this).addClass('in-range');
                        $(this).css({
                            'background-color': '#cfe7ff',
                            'color': '#007bff',
                            'font-weight': 'bold',
                            'border': '1px solid #0056b3',
                            'position': 'relative',
                            'z-index': '5'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied IN-RANGE styling to ${cellDate} (Day ${dayNum})`);
                    }
                }
                // End date visible but not start date (we're in the last month of a multi-month range)
                else if (!startDateVisible && endDateVisible) {
                    // End date
                    if (cellDate === endDateFormatted) {
                        $(this).addClass('selected end-date selected-end');
                        $(this).css({
                            'background-color': '#007bff',
                            'color': 'white',
                            'font-weight': 'bold',
                            'border-radius': '24px',
                            'box-shadow': '0 0 0 2px #007bff, 0 0 0 3px white',
                            'border': '2px solid white',
                            'position': 'relative',
                            'z-index': '10',
                            'transform': 'scale(1.1)'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied END styling to ${cellDate} (Day ${dayNum})`);
                    }
                    // All other dates in this month before the end date should be in-range
                    else if (cellDateObj < endDate) {
                        $(this).addClass('in-range');
                        $(this).css({
                            'background-color': '#cfe7ff',
                            'color': '#007bff',
                            'font-weight': 'bold',
                            'border': '1px solid #0056b3',
                            'position': 'relative',
                            'z-index': '5'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied IN-RANGE styling to ${cellDate} (Day ${dayNum})`);
                    }
                }
                // Both start and end dates are visible (single month selection)
                else {
                    // Start date
                    if (cellDate === startDateFormatted) {
                        $(this).addClass('selected start-date selected-start');
                        $(this).css({
                            'background-color': '#007bff',
                            'color': 'white',
                            'font-weight': 'bold',
                            'border-radius': '24px',
                            'box-shadow': '0 0 0 2px #007bff, 0 0 0 3px white',
                            'border': '2px solid white',
                            'position': 'relative',
                            'z-index': '10',
                            'transform': 'scale(1.1)'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied START styling to ${cellDate} (Day ${dayNum})`);
                    }
                    // End date - only if we have a range and this is EXACTLY the end date
                    else if (dates.length > 1 && cellDate === endDateFormatted) {
                        $(this).addClass('selected end-date selected-end');
                        $(this).css({
                            'background-color': '#007bff',
                            'color': 'white',
                            'font-weight': 'bold',
                            'border-radius': '24px',
                            'box-shadow': '0 0 0 2px #007bff, 0 0 0 3px white',
                            'border': '2px solid white',
                            'position': 'relative',
                            'z-index': '10',
                            'transform': 'scale(1.1)'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied END styling to ${cellDate} (Day ${dayNum})`);
                    }
                    // In-range - only for days strictly between start and end, using date math for comparison
                    else if (dates.length > 1 && 
                            cellDateObj > startDate && 
                            cellDateObj < endDate) {
                        $(this).addClass('in-range');
                        $(this).css({
                            'background-color': '#cfe7ff',
                            'color': '#007bff',
                            'font-weight': 'bold',
                            'border': '1px solid #0056b3',
                            'position': 'relative',
                            'z-index': '5'
                        });
                        debugLog(` [CRITICAL-FIXES DEBUG] Applied IN-RANGE styling to ${cellDate} (Day ${dayNum})`);
                    }
                }
            });
            
            // Final check for consistency
            debugElementState('.day-cell.selected', 'Selected cells after styling');
            debugElementState('.day-cell.in-range', 'In-range cells after styling');
            
        } catch (error) {
            debugLog(" [CRITICAL-FIXES DEBUG] Error in forceCalendarStyling:", error);
        }
    }
    
    // Fix the Add to Cart button to ensure it's enabled
    function fixAddToCartButton() {
        debugLog(" [CRITICAL-FIXES DEBUG] Fixing Add to Cart button");
        $('.single_add_to_cart_button')
            .removeClass('disabled')
            .prop('disabled', false)
            .attr('aria-disabled', 'false')
            .css({
                'opacity': '1',
                'cursor': 'pointer'
            });
            
        $('.order-disabled-text').remove();
        
        // Debug
        debugElementState('.single_add_to_cart_button', 'Add to Cart button state');
    }
    
    // Fix: Ensure the redirect parameter is set for checkout
    function fixRedirectParameter() {
        // Add hidden field for redirect if needed
        if (!$('form.cart input[name="redirect"]').length) {
            $('form.cart').append('<input type="hidden" name="redirect" value="1">');
            debugLog(" [CRITICAL-FIXES DEBUG] Added redirect input field");
        }
        
        // Set value to 1 to ensure checkout redirect
        $('[name="redirect"]').val('1');
        debugLog(" [CRITICAL-FIXES DEBUG] Redirect input:", $('[name="redirect"]').val());
    }
    
    // Redirect click handler disabled
    // Redirect on added_to_cart disabled

    // MEGA INITIALIZATION - Try all methods to ensure styling works
    function initializeEmergencyStyling() {
        debugLog(" [CRITICAL-FIXES DEBUG] Running mega initialization at " + new Date().toTimeString());
        
        try {
            // Fix calendar styling
            forceCalendarStyling();
            
            // Fix add to cart button
            fixAddToCartButton();
            
            // Clear sticky messages
            clearStickyMessages();
            
            // Specifically hide Shabbat errors
            hideShabbatErrors();
            
        } catch (error) {
            debugLog(" [CRITICAL-FIXES DEBUG] Error in initializeEmergencyStyling:", error);
        }
    }
    
    // Run on load with various delays
    setTimeout(initializeEmergencyStyling, 100);
    setTimeout(initializeEmergencyStyling, 500);
    setTimeout(initializeEmergencyStyling, 1000);
    
    // Disabled - letting the Air Datepicker handle styling properly
    // const stylingInterval = setInterval(function() {
    //     forceCalendarStyling();
    //     hideShabbatErrors(); // Make sure Shabbat errors stay hidden
    // }, 3000);
    
    // Also run when dates are selected or confirmed
    $(document).on('dateSelected dateConfirmed', function() {
        setTimeout(forceCalendarStyling, 100);
        setTimeout(hideShabbatErrors, 100);
    });
    
    // Redirect only on Order Now button
    $(document).on('click', '.single_add_to_cart_button.btn-redirect', function() {
        fixRedirectParameter();
    });
    
    // Clear sticky messages persistently
    function clearStickyMessages() {
        try {
            // Hide all same-day booking messages
            $('.same-day-booking-warning, .late-booking-notice, #same-day-booking-message').hide();
            
            // Remove any pickup notices
            $('.day-cell[data-pickup-notice]').removeAttr('data-pickup-notice');
            
            // Hide any validation messages about Shabbat
            hideShabbatErrors();
            
        } catch (error) {
            debugLog(" [CRITICAL-FIXES DEBUG] Error in clearStickyMessages:", error);
        }
    }
    
    // Hide Shabbat error messages specifically
    function hideShabbatErrors() {
        try {
            // Hide all Shabbat-related error messages using multiple selectors
            $(".validation-message.error:contains('לא ניתן להזמין לשבת')").hide();
            $(".validation-message:contains('מערכת סגורה')").hide();
            $("#date-validation-message:contains('לא ניתן להזמין לשבת')").hide();
            
            // Remove the specific error message mentioned in the requirements
            $('#date-validation-message.validation-message.error').each(function() {
                const text = $(this).text().trim();
                if (text.includes('לא ניתן להזמין לשבת') || text.includes('מערכת סגורה')) {
                    $(this).hide();
                    debugLog(" [CRITICAL-FIXES DEBUG] Hid Shabbat error message: " + text);
                }
            });
            
            // Force remove any validation messages with these texts
            $('.validation-message, #date-validation-message').each(function() {
                const text = $(this).text().trim();
                if (text.includes('לא ניתן להזמין לשבת') || text.includes('מערכת סגורה')) {
                    $(this).hide();
                    debugLog(" [CRITICAL-FIXES DEBUG] Hid validation message: " + text);
                }
            });
        } catch (error) {
            debugLog(" [CRITICAL-FIXES DEBUG] Error in hideShabbatErrors:", error);
        }
    }
    
    // Make our functions available globally
    window.mitnafunEmergencyFixes = {
        forceCalendarStyling: forceCalendarStyling,
        fixAddToCartButton: fixAddToCartButton,
        fixRedirectParameter: fixRedirectParameter,
        clearStickyMessages: clearStickyMessages,
        hideShabbatErrors: hideShabbatErrors,
        enableDebug: window.mitnafunEmergencyFixes.enableDebug,
        disableDebug: window.mitnafunEmergencyFixes.disableDebug
    };
    
    debugLog(" [CRITICAL-FIXES DEBUG] All emergency fixes initialized - global functions available via window.mitnafunEmergencyFixes");
});
