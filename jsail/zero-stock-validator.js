/**
 * Zero Stock Validator - PRODUCTION VERSION
 * Ensures users cannot place orders when stock is zero EXCEPT for future dates
 * Modified to allow booking for future dates (3+ days ahead) even with zero stock
 */

// Production mode - minimal logging
// console.log('🛑 Zero Stock Validator - Future Dates Enabled');

// Initialize when document is ready
jQuery(document).ready(function($) {
    // Define the modal message IDs for reference
    const ZERO_STOCK_MESSAGE_ID = 'zero-stock-message-floating';
    const ZERO_STOCK_OVERLAY_ID = 'zero-stock-overlay';
    
    // Get the current stock quantity from multiple potential sources
    const stockQty = parseInt(window.productStockQty || window.stockQuantity || window.zeroStockQty || 0);
    
    // Set a global flag to track zero stock state
    window.zeroStockQty = stockQty;
    
    console.log('🛑 Current stock quantity: ' + stockQty);
    
    // Function to check if future dates are selected
    function isFutureDateBooking() {
        const rentalDatesInput = document.getElementById('rental_dates');
        if (rentalDatesInput && rentalDatesInput.value) {
            const dates = rentalDatesInput.value.split(' - ');
            if (dates.length > 0) {
                // For date format DD.MM.YYYY
                const parts = dates[0].split('.');
                if (parts.length === 3) {
                    const date = new Date(parts[2], parts[1] - 1, parts[0]);
                    const today = new Date();
                    const diffTime = date.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 3;
                }
            }
        }
        return false;
    }
    
    // FIRST CHECK: If we have future dates, don't apply any restrictions
    if (isFutureDateBooking()) {
        // Production mode - logging disabled
        // console.log('✅ Future dates selected - bypassing all stock validations');
        $('#zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning').remove();
        $('.single_add_to_cart_button').prop('disabled', false)
                                     .removeClass('disabled')
                                     .css({'opacity': '1', 'cursor': 'pointer'})
                                     .attr('aria-disabled', 'false');
        return; // Exit early - do not apply any other restrictions
    }
    
    // Only for non-future dates, apply stock restrictions
    if (stockQty === 0) {
        console.log('🛑 Zero stock detected - applying restrictions for current dates');
        
        // Update global variables
        try {
            window.productStockQty = 0;
            window.stockQuantity = 0;
            window.zeroStockQty = 0;
        } catch(e) {
            console.warn('Could not update stock variables', e);
        }
        
        // IMMEDIATELY display the zero stock message when page loads
        setTimeout(function() {
            showZeroStockModal();
            disableAllAddToCartButtons();
            console.log('🛑 Showing zero stock modal for current dates');
        }, 500);
    }
    
    // Helper function to check if a date is sufficiently in the future (3+ days)
    function isDateSufficientlyInFuture(dateString) {
        // For date format DD.MM.YYYY
        if (dateString && dateString.indexOf('.') > 0) {
            const parts = dateString.split('.');
            if (parts.length === 3) {
                const date = new Date(parts[2], parts[1] - 1, parts[0]);
                const today = new Date();
                const diffTime = date.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 3;
            }
        }
        
        // For ISO format (YYYY-MM-DD)
        if (dateString && dateString.indexOf('-') > 0) {
            const date = new Date(dateString);
            const today = new Date();
            const diffTime = date.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 3;
        }
        
        return false;
    }
    
    // Function to check if selected dates are in the future
    function areDatesInFuture() {
        const rentalDatesInput = document.getElementById('rental_dates');
        if (rentalDatesInput && rentalDatesInput.value) {
            const dates = rentalDatesInput.value.split(' - ');
            if (dates.length > 0) {
                return isDateSufficientlyInFuture(dates[0]);
            }
        }
        return false;
    }
    
    // Function to check if stock is zero using multiple methods
    function isStockZero() {
        // First check if dates are in the future (3+ days) - allow booking regardless of stock
        if (areDatesInFuture()) {
            console.log('✅ Future dates selected - bypassing stock validation');
            return false; // Pretend stock is not zero for future dates
        }
        
        // Otherwise check stock normally
        return (
            stockQty === 0 || 
            window.zeroStockQty === 0 || 
            window.productStockQty === 0 || 
            window.stockQuantity === 0
        );
    }
    
    // Function to disable ALL add to cart buttons
    function disableAllAddToCartButtons() {
        // Target buttons using multiple selectors for maximum coverage
        const buttonSelectors = [
            '.single_add_to_cart_button',
            '.add_to_cart_button',
            '.btn-redirect',
            'button[name="add-to-cart"]',
            'input[name="add-to-cart"]',
            'button.ajax_add_to_cart'
        ];
        
        buttonSelectors.forEach(function(selector) {
            $(selector).prop('disabled', true)
                       .addClass('disabled')
                       .css({'opacity': '0.5', 'cursor': 'not-allowed'})
                       .attr('aria-disabled', 'true');
        });
    }
    
    // Function to display guaranteed floating zero stock modal
    function showZeroStockModal() {
        // Remove any existing messages first
        $('#' + ZERO_STOCK_MESSAGE_ID + ', #' + ZERO_STOCK_OVERLAY_ID).remove();
        
        // Create overlay
        const overlayHtml = `
            <div id="${ZERO_STOCK_OVERLAY_ID}" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                z-index: 99998;
            "></div>
        `;
        
        // Create floating message
        const messageHtml = `
            <div id="${ZERO_STOCK_MESSAGE_ID}" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #fff;
                border: 4px solid #ff0000;
                border-radius: 10px;
                padding: 25px;
                width: 90%;
                max-width: 450px;
                text-align: right;
                direction: rtl;
                z-index: 99999;
                box-shadow: 0 0 30px rgba(0,0,0,0.7);
            ">
                <h2 style="color: #ff0000; margin-top: 0; font-size: 26px; border-bottom: 2px solid #ffcccc; padding-bottom: 12px;">
                    ⚠️ מלאי אזל!
                </h2>
                <p style="font-size: 18px; line-height: 1.6; margin: 15px 0;">
                    לא ניתן להזמין מוצר זה בתאריכים אלו מכיוון שהמלאי אזל עקב הזמנות קודמות.
                </p>
                <p style="font-size: 18px; margin: 15px 0;">
                    לבירור ניתן ליצור קשר בטלפון: 
                    <a href="tel:050-5544516" style="color: #ff0000; text-decoration: none; font-weight: bold; font-size: 20px;">
                        050-5544516
                    </a>
                </p>
                <button id="zero-stock-close" style="
                    background-color: #ff0000;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin-top: 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    float: left;
                ">
                    סגור הודעה
                </button>
                <div style="clear: both;"></div>
            </div>
        `;
        
        // Append to body for guaranteed visibility
        $('body').append(overlayHtml).append(messageHtml);
        
        // Add close button functionality
        $('#zero-stock-close').on('click', function() {
            $('#' + ZERO_STOCK_MESSAGE_ID).fadeOut(300, function() {
                $(this).remove();
            });
            $('#' + ZERO_STOCK_OVERLAY_ID).fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // Hide any conflicting messages
        $('#date-validation-message, #duplicate-booking-approval, #duplicate-booking-info, #duplicate-booking-limit').hide();
        
        // Show with animation
        $('#' + ZERO_STOCK_MESSAGE_ID).hide().fadeIn(400);
        $('#' + ZERO_STOCK_OVERLAY_ID).hide().fadeIn(400);
        
        // Re-show modal periodically to ensure it's visible
        setTimeout(function() {
            if (!$('#' + ZERO_STOCK_MESSAGE_ID).is(':visible')) {
                showZeroStockModal();
            }
        }, 2000);
    }
    
    // Function to enforce zero stock restrictions
    function enforceZeroStockRestrictions() {
        if (isStockZero()) {
            console.log('🛑 CRITICAL: Enforcing zero stock restrictions');
            disableAllAddToCartButtons();
            showZeroStockModal();
            return true;
        }
        return false;
    }
    
    // Check stock on all button clicks
    $(document).on('click', '.single_add_to_cart_button, .add_to_cart_button, .btn-redirect, button[name="add-to-cart"]', function(e) {
        if (enforceZeroStockRestrictions()) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    
    // Intercept all form submissions
    $('form.cart, form.variations_form, form:has(button[name="add-to-cart"])').on('submit', function(e) {
        if (enforceZeroStockRestrictions()) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    
    // CRITICAL: Patch the validateDateRange function to enforce zero stock check
    if (typeof window.validateDateRange === 'function') {
        console.log('🛑 Patching validateDateRange to enforce zero stock check');
        
        // Store the original function
        const originalValidateDateRange = window.validateDateRange;
        
        // Override with our patched version
        window.validateDateRange = function() {
            // First check stock - if zero, always fail validation
            if (enforceZeroStockRestrictions()) {
                return false;
            }
            
            // Otherwise, proceed with original validation
            return originalValidateDateRange.apply(this, arguments);
        };
    }
    
    // Also patch the checkForDuplicateOrder function if it exists
    if (typeof window.checkForDuplicateOrder === 'function') {
        console.log('🛑 Patching checkForDuplicateOrder to enforce zero stock check');
        
        const originalCheckForDuplicateOrder = window.checkForDuplicateOrder;
        
        window.checkForDuplicateOrder = function(startDate, endDate) {
            // First check stock - if zero, always fail validation
            if (enforceZeroStockRestrictions()) {
                return false;
            }
            
            // Otherwise, proceed with original validation
            return originalCheckForDuplicateOrder.apply(this, arguments);
        };
    }
    
    // Check periodically to ensure zero stock restriction is enforced
    setInterval(function() {
        if (isStockZero() && !$('#' + ZERO_STOCK_MESSAGE_ID).is(':visible')) {
            enforceZeroStockRestrictions();
            console.log('🛑 PERIODIC CHECK: Re-enforcing zero stock restrictions');
        }
    }, 3000);
    
    // Run an immediate check
    if (isStockZero()) {
        enforceZeroStockRestrictions();
    }
        return false;
    }
    
    // Check stock on all add-to-cart button clicks with multiple selectors
    $(document).on('click', '.single_add_to_cart_button, .add_to_cart_button, .btn-redirect, button[name="add-to-cart"]', function(e) {
        if (enforceZeroStockRestrictions()) {
                window._originalValidateRange = window.validateDateRange;
                
                // Override with zero-stock aware version
                window.validateDateRange = function() {
                    // Always block if stock is zero
                    if (blockZeroStockOrder()) {
                        return false;
                    }
                    
                    // Otherwise use original validation
                    return window._originalValidateRange();
                };
            }
        }, 2000);
    }
    
    // Also patch the checkForDuplicateOrder function if it exists
    if (typeof window.checkForDuplicateOrder === 'function') {
        console.log('🛑 Patching checkForDuplicateOrder to enforce zero stock check');
        
        // Save original function
        window._zeroStockOriginalCheck = window.checkForDuplicateOrder;
        
        // Override with zero-stock aware version
        window.checkForDuplicateOrder = function(startDate, endDate) {
            // Always block if stock is zero
            if (blockZeroStockOrder()) {
                return false;
            }
            
            // Otherwise use original function
            return window._zeroStockOriginalCheck(startDate, endDate);
        };
    } else {
        // Try again later if function doesn't exist yet
        setTimeout(function() {
            if (typeof window.checkForDuplicateOrder === 'function') {
                // Production mode - logging disabled
                // console.log('🛑 Delayed patch of checkForDuplicateOrder');
                
                // Save original function
                window._zeroStockOriginalCheck = window.checkForDuplicateOrder;
                
                // Override with zero-stock aware version
                window.checkForDuplicateOrder = function(startDate, endDate) {
                    // Always block if stock is zero
                    if (blockZeroStockOrder()) {
                        return false;
                    }
                    
                    // Otherwise use original function
                    return window._zeroStockOriginalCheck(startDate, endDate);
                };
            }
        }, 2000);
    }
    
    // Additionally monitor all order button clicks as a last-resort failsafe
    $(document).on('click', '.single_add_to_cart_button', function(e) {
        if (blockZeroStockOrder()) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🛑 CRITICAL: Prevented add to cart click because stock is zero');
            return false;
        }
    });
});
