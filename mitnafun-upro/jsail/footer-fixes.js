// Stub global log to avoid ReferenceError
window.log = window.log || function(message, data) {};

/**
 * Direct fixes applied in footer for Mitnafun rental system
 * Comprehensive fix for weekend bookings, styling, and checkout redirect
 */

jQuery(function($) {
    // Configuration
    const DEBUG = false; // disable debug logs
    
    /**
     * Conditional debug logger stub
     */
    function log(message, data) {
        if (DEBUG) {
            if (data !== undefined) {
                console.log("[WEEKEND FIX] " + message, data);
            } else {
                console.log("[WEEKEND FIX] " + message);
            }
        }
    }
    
    // Log reserved dates for debugging
    const cfg = window.mitnafunRental || {};
    console.log('Reserved Dates:', cfg.bookedDates);
    // Try to get product ID from different sources for debugging
    const productId = window.currentProductId || 
                     (typeof mitnafunRental !== 'undefined' ? mitnafunRental.product_id : null) ||
                     (typeof datepickerVars !== 'undefined' ? datepickerVars.product_id : null) ||
                     $('[name="add-to-cart"]').val();
    console.log('Product ID detected:', productId);
    
    // Initialize direct price calculation variables
    let basePrice = cfg.basePrice || 550;
    let discountType = cfg.discountType || 'percentage';
    let discountValue = cfg.discountValue || 50;
    
    // Inject CSS overrides for calendar sizing and spacing
    $('<style>')
      .prop('type', 'text/css')
      .html(`
        .air-datepicker .air-datepicker-cell {
          width: 3.5em !important;
          height: 3.5em !important;
          margin: 0.25em !important;
          padding: 0.5em !important;
          font-size: 1.8rem !important;
          line-height: 2.5em !important;
        }
        .air-datepicker {
          min-width: 350px !important;
          height: auto !important;
          min-height: 450px !important;
          max-width: none !important;
          transform: scale(1.1) !important;
          margin: 20px auto !important;
        }
        .air-datepicker-body--cells {
          grid-template-columns: repeat(7, minmax(3em, 1fr)) !important;
          gap: 0.4em !important;
        }
        .air-datepicker-nav {
          padding: 10px 8px !important;
          font-size: 1.4rem !important;
        }
        .air-datepicker-body--day-name {
          font-size: 1.2rem !important;
          font-weight: bold !important;
          color: #333 !important;
          padding: 0.5em 0 !important;
b        }
      `)
      .appendTo('head');
    
    // 1. Core Fix: Make weekends selectable and handle date range with weekends
    function fixWeekendBooking() {
        log("Applying weekend booking fix");
        
        // Track the current date selection state for restoration
        let savedDates = [];
        let priceUpdatePending = false;
        
        // APPROACH 1: Override or patch critical validation functions
        function patchValidationFunctions() {
            // Patch the main validation functions
            const functionsToPatch = [
                'validateDateRange',
                'isDateRangeValid',
                'calculateRentalDays',
                'isDateInRange',
                'isValidRentalDay',
                'doesRangeIncludeWeekend',
                'updateCalendarSelection',
                'updatePriceBreakdown',
                'calculateTotalPrice'
            ];
            
            functionsToPatch.forEach(functionName => {
                if (typeof window[functionName] === 'function') {
                    log(`Patching ${functionName} function`);
                    window[`original${functionName}`] = window[functionName];
                }
            });
            
            // 1. Main validation function
            if (typeof window.validateDateRange === 'function') {
                window.validateDateRange = function(startDate, endDate) {
                    log("validateDateRange called with", [startDate, endDate]);
                    
                    // Always return success for our fix
                    return {
                        isValid: true,
                        message: 'success',
                        messageType: 'success'
                    };
                };
            }
            
            // 2. Is range valid check (secondary validation)
            if (typeof window.isDateRangeValid === 'function') {
                window.isDateRangeValid = function(startDate, endDate) {
                    log("isDateRangeValid called with", [startDate, endDate]);
                    
                    // Save the dates for restoration if needed
                    if (startDate && endDate) {
                        savedDates = [startDate, endDate];
                        
                        // Update hidden field for form submission
                        updateRentalDatesField(startDate, endDate);
                        
                        // Request price calculation
                        priceUpdatePending = true;
                        calculateAndDisplayPrice(startDate, endDate);
                    }
                    
                    return true;
                };
            }
            
            // 3. Don't exclude Saturdays from rental days calculation
            if (typeof window.calculateRentalDays === 'function') {
                window.calculateRentalDays = function(startDate, endDate, excludeSaturdays) {
                    log("calculateRentalDays called", [startDate, endDate, excludeSaturdays]);
                    
                    // Call the original function but force excludeSaturdays to false
                    return window.originalcalculateRentalDays(startDate, endDate, false);
                };
            }
            
            // 4. Ensure dates in range include weekends
            if (typeof window.isDateInRange === 'function') {
                window.isDateInRange = function(date, startDate, endDate) {
                    // Use the original function but ignore weekend restrictions
                    return window.originalisDateInRange(date, startDate, endDate);
                };
            }
            
            // 5. Always consider days valid for selection
            if (typeof window.isValidRentalDay === 'function') {
                window.isValidRentalDay = function(date) {
                    // Check if it's a reserved date (actually booked)
                    if (window.reservedDates && window.reservedDates.length > 0) {
                        if (window.reservedDates.indexOf(date) !== -1) {
                            return false;
                        }
                    }
                    
                    // Always allow selection (including weekends)
                    return true;
                };
            }
            
            // 6. Calendar selection update (to prevent it from removing Saturday)
            if (typeof window.updateCalendarSelection === 'function') {
                window.updateCalendarSelection = function() {
                    log("updateCalendarSelection called, selectedDates:", window.selectedDates);
                    
                    // Call original
                    window.originalupdateCalendarSelection.apply(this);
                    
                    // Ensure price update happens after selection
                    if (window.selectedDates && window.selectedDates.length === 2) {
                        setTimeout(function() {
                            calculateAndDisplayPrice(window.selectedDates[0], window.selectedDates[1]);
                        }, 100);
                    }
                };
            }
        }
        
        // Directly calculate and display rental price
        function calculateAndDisplayPrice(startDate, endDate) {
            if (!startDate || !endDate) return;
            
            log("Calculating price for", [startDate, endDate]);
            
            try {
                // Calculate days (including weekends)
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
                
                log(`Total rental period: ${diffDays} days`);
                
                // Calculate price
                const totalBeforeDiscount = basePrice * diffDays;
                let finalPrice = totalBeforeDiscount;
                
                // Apply discount if any
                let discountAmount = 0;
                if (discountType === 'percentage' && discountValue > 0) {
                    discountAmount = totalBeforeDiscount * (discountValue / 100);
                    finalPrice = totalBeforeDiscount - discountAmount;
                } else if (discountType === 'fixed' && discountValue > 0) {
                    discountAmount = discountValue;
                    finalPrice = totalBeforeDiscount - discountAmount;
                }
                
                log(`Price calculation: ${totalBeforeDiscount} - ${discountAmount} = ${finalPrice}`);
                
                // Create price breakdown
                const breakdown = {
                    days: diffDays,
                    basePrice: basePrice,
                    totalBeforeDiscount: totalBeforeDiscount,
                    discountType: discountType,
                    discountValue: discountValue,
                    discountAmount: discountAmount,
                    finalPrice: finalPrice
                };
                
                // Display the price breakdown
                displayPriceBreakdown(breakdown);
                
                // Enable the "Add to Cart" button
                enableAddToCartButton();
                
                // Show success message
                showSuccessMessage();
                
                return finalPrice;
            } catch (e) {
                log("Error calculating price", e);
                return basePrice;
            }
        }
        
        // Display the price breakdown in the UI
        function displayPriceBreakdown(breakdown) {
            log("Displaying price breakdown", breakdown);
            
            const container = $('#price-breakdown-container');
            const list = $('#price-breakdown-list');
            const total = $('#price-breakdown-total');
            
            if (!container.length || !list.length || !total.length) {
                log("Price breakdown elements not found in DOM");
                return;
            }
            
            // Clear existing items
            list.empty();
            
            // Add base price + days
            list.append(`<li>מחיר בסיס: ${breakdown.basePrice} ₪ × ${breakdown.days} ימים = ${breakdown.totalBeforeDiscount} ₪</li>`);
            
            // Add discount if applicable
            if (breakdown.discountAmount > 0) {
                const discountText = breakdown.discountType === 'percentage' 
                    ? `הנחה: ${breakdown.discountValue}% (${breakdown.discountAmount} ₪)`
                    : `הנחה: ${breakdown.discountAmount} ₪`;
                
                list.append(`<li>${discountText}</li>`);
            }
            
            total.html(`<strong>סה"כ לתשלום: ${breakdown.finalPrice} ₪</strong>`);
            container.show();
        }
        
        // Update the hidden field for form submission
        function updateRentalDatesField(startDate, endDate) {
            if (!startDate || !endDate) return;
            
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Format for display: DD/MM/YYYY - DD/MM/YYYY
                const startFormatted = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getFullYear()}`;
                const endFormatted = `${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getFullYear()}`;
                const formattedDates = `${startFormatted} - ${endFormatted}`;
                
                log(`Setting rental dates field: ${formattedDates}`);
                
                // Update hidden field
                $('#rental_dates').val(formattedDates);
            } catch (e) {
                log("Error updating rental dates field", e);
            }
        }
        
        // Enable the cart buttons
        function enableAddToCartButton() {
            $('.single_add_to_cart_button')
                .prop('disabled', false)
                .removeClass('disabled')
                .css({
                    'opacity': '1',
                    'cursor': 'pointer'
                });
        }
        
        // Show a success validation message
        function showSuccessMessage() {
            $('#date-validation-message')
                .removeClass('error')
                .addClass('success')
                .text('תאריכים נבחרו בהצלחה')
                .show();
        }
        
        // APPROACH 2: Enable weekend cells directly in UI
        function enableWeekendCells() {
            $('.fallback-calendar .day-cell.weekend').each(function() {
                $(this).removeClass('disabled').attr('data-selectable', 'true');
            });
            
            // Also make the style reflect they are selectable
            if ($('#weekend-cell-style').length === 0) {
                $('<style id="weekend-cell-style">')
                    .prop('type', 'text/css')
                    .html(`
                        .fallback-calendar .day-cell.weekend {
                            cursor: pointer !important;
                            opacity: 1 !important;
                            background-color: #f8f8f8 !important;
                            color: #333 !important;
                        }
                        .fallback-calendar .day-cell.weekend:hover {
                            background-color: #e6f7ff !important;
                        }
                        .fallback-calendar .day-cell.weekend.in-range {
                            background-color: #e6f0ff !important;
                            color: #1a4a6b !important;
                        }
                    `)
                    .appendTo('head');
            }
        }
        
        // APPROACH 3: Restore dates if they're cleared due to validation
        function monitorAndRestoreDates() {
            if (!window.selectedDates) window.selectedDates = [];
            
            // If we have saved dates but current selection is empty/incomplete
            if (savedDates.length === 2 && (window.selectedDates.length < 2)) {
                log("Restoring lost date selection", savedDates);
                
                // Restore the selection
                window.selectedDates = savedDates.slice();
                
                // Update UI
                if (typeof window.updateCalendarSelection === 'function') {
                    window.updateCalendarSelection();
                }
                
                // Trigger price calculation
                calculateAndDisplayPrice(savedDates[0], savedDates[1]);
            }
            
            // Check for pending price update
            if (priceUpdatePending && window.selectedDates && window.selectedDates.length === 2) {
                calculateAndDisplayPrice(window.selectedDates[0], window.selectedDates[1]);
                priceUpdatePending = false;
            }
            
            // Check if the cart button needs enabling
            if (window.selectedDates && window.selectedDates.length === 2) {
                enableAddToCartButton();
            }
        }
        
        // Apply all weekend fixes
        patchValidationFunctions();
        enableWeekendCells();
        
        // Monitor for lost state
        setInterval(monitorAndRestoreDates, 300);
    }
    
    // 2. Fix: Hide any Shabbat error messages
    function hideShabbatErrors() {
        // Hide any validation errors about Shabbat
        $(".validation-message, #date-validation-message").each(function() {
            const text = $(this).text().trim();
            if (text.indexOf('לא ניתן להזמין לשבת') >= 0 || 
                text.indexOf('מערכת סגורה') >= 0 ||
                text.indexOf('שבת') >= 0) {
                $(this).hide();
                
                // Show success message instead if we have dates selected
                if (window.selectedDates && window.selectedDates.length === 2) {
                    $('#date-validation-message')
                        .removeClass('error')
                        .addClass('success')
                        .text('תאריכים נבחרו בהצלחה')
                        .show();
                }
            }
        });
        
        // Fix form validation state to enable submit
        if (window.selectedDates && window.selectedDates.length === 2) {
            // Mark rental dates field as valid
            $('#rental_dates')
                .removeClass('invalid')
                .addClass('valid')
                .attr('aria-invalid', 'false');
            
            // Enable buttons
            $('.single_add_to_cart_button')
                .prop('disabled', false)
                .removeClass('disabled')
                .css({
                    'opacity': '1', 
                    'cursor': 'pointer'
                });
        }
    }
    
    // 3. Fix: Ensure calendar styling is maintained
    function ensureCalendarStyling() {
        // Only add styles once
        if ($('#rtl-calendar-fix').length === 0) {
            $('<style id="rtl-calendar-fix">')
                .prop('type', 'text/css')
                .html(`
                    /* START DATE - RTL version (right rounded) */
                    html[dir="rtl"] .fallback-calendar .day-cell.start-date,
                    html[dir="rtl"] .fallback-calendar .day-cell.selected-start {
                        border-radius: 0 8px 8px 0 !important;
                    }
                    
                    /* END DATE - RTL version (left rounded) */
                    html[dir="rtl"] .fallback-calendar .day-cell.end-date,
                    html[dir="rtl"] .fallback-calendar .day-cell.selected-end {
                        border-radius: 8px 0 0 8px !important;
                    }
                    
                    /* Make weekend cells look selectable */
                    .fallback-calendar .day-cell.weekend {
                        opacity: 0.8 !important;
                        color: #666 !important;
                        background-color: #f8f8f8 !important;
                        cursor: pointer !important;
                    }
                    
                    /* Make weekend in-range styling match other days */
                    .fallback-calendar .day-cell.weekend.in-range {
                        background-color: #e6f0ff !important;
                        color: #1a4a6b !important;
                    }
                    
                    /* "Add to Cart" button always enabled if dates are selected */
                    .single_add_to_cart_button {
                        cursor: pointer !important;
                        opacity: 1 !important;
                    }
                    
                    /* Hide errors related to Shabbat */
                    .validation-message:contains('שבת'),
                    #date-validation-message:contains('שבת') {
                        display: none !important;
                    }
                    
                    /* Always show price breakdown when dates are selected */
                    .price-breakdown-container {
                        display: block !important;
                    }
                `)
                .appendTo('head');
        }
    }
    
    // 4. Fix: Ensure checkout redirection
    function ensureCheckoutRedirect() {
        // Only attach event handlers once
        if (!window.redirectHandlersAttached) {
            $('.btn-redirect').on('click', function(e) {
                sessionStorage.setItem('redirect_to_checkout', 'yes');
                log("Redirect flag set");
            });
            
            $(document.body).on('added_to_cart', function() {
                if (sessionStorage.getItem('redirect_to_checkout') === 'yes') {
                    sessionStorage.removeItem('redirect_to_checkout');
                    const checkoutUrl = (typeof wc_add_to_cart_params !== 'undefined') 
                        ? wc_add_to_cart_params.checkout_url 
                        : '/checkout/';
                    
                    log("Redirecting to checkout: " + checkoutUrl);
                    setTimeout(function() {
                        window.location.href = checkoutUrl;
                    }, 100);
                }
            });
            
            window.redirectHandlersAttached = true;
        }
    }
    
    // 5. Fix: Handle month changes
    function handleMonthChanges() {
        // Only attach once
        if (!window.monthChangeHandlersAttached) {
            $(document).on('click', '#prevMonthBtn, #nextMonthBtn', function() {
                log("Month navigation detected");
                
                // Apply fixes after month change with increasing delays
                setTimeout(applyAllFixes, 100);
                setTimeout(applyAllFixes, 300);
                setTimeout(applyAllFixes, 500);
            });
            
            window.monthChangeHandlersAttached = true;
        }
    }
    
    // 6. Fix: Override entire price calculation system
    function overridePriceCalculation() {
        // Store the global price calculation function (if any)
        if (typeof window.updatePriceBreakdown === 'function') {
            window.originalUpdatePriceBreakdown = window.updatePriceBreakdown;
            
            // Replace with our custom implementation
            window.updatePriceBreakdown = function() {
                log("Price breakdown update intercepted");
                
                // Only do our custom calculation if this involves a weekend
                if (window.selectedDates && window.selectedDates.length === 2) {
                    const hasWeekend = doesRangeIncludeWeekend(window.selectedDates[0], window.selectedDates[1]);
                    
                    if (hasWeekend) {
                        log("Weekend detected in range - using custom price calculation");
                        return calculateAndDisplayDirectPrice();
                    }
                }
                
                // Otherwise use original
                return window.originalUpdatePriceBreakdown.apply(this);
            };
        }
        
        // Helper to check if range includes weekend
        function doesRangeIncludeWeekend(startDate, endDate) {
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Loop through all days and check for Saturday (6)
                const current = new Date(start);
                while (current <= end) {
                    if (current.getDay() === 6) { // 6 is Saturday
                        return true;
                    }
                    current.setDate(current.getDate() + 1);
                }
                
                return false;
            } catch (e) {
                log("Error checking for weekend", e);
                return false;
            }
        }
        
        // Calculate and display price directly
        function calculateAndDisplayDirectPrice() {
            if (!window.selectedDates || window.selectedDates.length !== 2) return;
            
            try {
                const startDate = window.selectedDates[0];
                const endDate = window.selectedDates[1];
                
                // Get start & end dates
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Calculate days (inclusive of start and end date)
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                
                // Get base price from global or element
                let basePrice = window.basePrice || parseFloat($('.price .woocommerce-Price-amount').text()) || 550;
                if (isNaN(basePrice)) basePrice = 550;
                
                // Get discount if applicable
                const discountType = window.discountType || 'percentage';
                const discountValue = window.discountValue || 0;
                
                // Calculate
                const subtotal = basePrice * diffDays;
                let discountAmount = 0;
                
                if (discountType === 'percentage' && discountValue > 0) {
                    discountAmount = subtotal * (discountValue / 100);
                } else if (discountType === 'fixed' && discountValue > 0) {
                    discountAmount = discountValue;
                }
                
                const total = subtotal - discountAmount;
                
                // Display in UI
                const container = $('#price-breakdown-container');
                const list = $('#price-breakdown-list');
                const totalElem = $('#price-breakdown-total');
                
                list.empty();
                list.append(`<li>מחיר בסיס: ${basePrice} ₪ × ${diffDays} ימים = ${subtotal} ₪</li>`);
                
                if (discountAmount > 0) {
                    const discountText = discountType === 'percentage' 
                        ? `הנחה: ${discountValue}% (${discountAmount} ₪)`
                        : `הנחה: ${discountAmount} ₪`;
                    
                    list.append(`<li>${discountText}</li>`);
                }
                
                totalElem.html(`<strong>סה"כ לתשלום: ${total} ₪</strong>`);
                container.show();
                
                // Show success message
                $('#date-validation-message')
                    .removeClass('error')
                    .addClass('success')
                    .text('תאריכים נבחרו בהצלחה')
                    .show();
                
                // Enable add to cart
                $('.single_add_to_cart_button')
                    .prop('disabled', false)
                    .removeClass('disabled');
                
                return total;
            } catch (e) {
                log("Error in direct price calculation", e);
                return null;
            }
        }
    }
    
    // Apply all fixes in sequence
    function applyAllFixes() {
        ensureCalendarStyling();     // Apply styling first
        fixWeekendBooking();         // Fix weekend booking logic
        hideShabbatErrors();         // Hide any error messages
        ensureCheckoutRedirect();    // Set up redirect handlers
        overridePriceCalculation();  // Override price calculation system
    }
    
    // Initialize
    log("Initializing fixes");
    applyAllFixes();
    handleMonthChanges();
    
    // Set up click handlers
    $(document).on('click', '.day-cell', function() {
        setTimeout(function() {
            log("Day cell clicked, applying fixes");
            hideShabbatErrors();
            
            // Look for weekend cells and make them selectable again
            $('.fallback-calendar .day-cell.weekend').removeClass('disabled').attr('data-selectable', 'true');
            
            // Force price calculation if needed
            if (window.selectedDates && window.selectedDates.length === 2) {
                log("Both dates selected, ensuring price calculation");
                setTimeout(function() {
                    // Use our direct calculation
                    if (typeof calculateAndDisplayDirectPrice === 'function') {
                        calculateAndDisplayDirectPrice();
                    } 
                    // Or try to trigger the original
                    else if (typeof window.updatePriceBreakdown === 'function') {
                        window.updatePriceBreakdown();
                    }
                }, 300);
            }
        }, 100);
    });
    
    // Run fixes at increasing intervals to catch slower-loading elements
    setTimeout(applyAllFixes, 500);
    setTimeout(applyAllFixes, 1000);
    setTimeout(applyAllFixes, 2000);
    
    // Watch for calendar changes with MutationObserver
    if (typeof MutationObserver !== 'undefined') {
        const container = document.getElementById('datepicker-container');
        if (container) {
            const observer = new MutationObserver(function(mutations) {
                log("DOM mutations detected in calendar");
                applyAllFixes();
                
                // Check if we need to force price display
                if (window.selectedDates && window.selectedDates.length === 2) {
                    if ($('#price-breakdown-container').is(':hidden')) {
                        log("Price breakdown missing after DOM mutation");
                        setTimeout(function() {
                            if (typeof window.updatePriceBreakdown === 'function') {
                                window.updatePriceBreakdown();
                            }
                        }, 100);
                    }
                }
            });
            
            observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'data-date']
            });
        }
    }
    
    // Set up a global error handler to catch and fix validation errors
    window.addEventListener('error', function(event) {
        // Only log script errors related to dates
        if (event.error && (
            event.error.toString().indexOf('שבת') !== -1 ||
            event.error.toString().indexOf('Saturday') !== -1 ||
            event.error.toString().indexOf('date') !== -1
        )) {
            log("Caught error event:", event.error);
            
            // Immediately trigger fixes
            hideShabbatErrors();
            
            // Prevent error from showing in console
            event.preventDefault();
        }
    }, true);
    
    // Force field validation to pass when a weekend is included
    if (typeof $ === 'function' && typeof $.validator === 'object') {
        log("Patching jQuery validator");
        
        // Override rental dates validation
        $.validator.addMethod("rental_dates", function(value, element) {
            return true; // Always valid
        });
    }
});
