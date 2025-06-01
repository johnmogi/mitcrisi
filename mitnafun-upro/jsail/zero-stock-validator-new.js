/**
 * Zero Stock Validator - User-Friendly Validation
 * Ensures users cannot place orders when stock is zero
 * Displays a message only when the user tries to book an unavailable date
 */

console.log('🛑 Zero Stock Validator loaded - USER-FRIENDLY VERSION');

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
    
    // GLOBAL FIX: Apply a definitive correction to the stockQuantity variable 
    if (stockQty === 0) {
        // Force all stock variables to be exactly 0 when stock is depleted
        ['stockQuantity', 'productStockQty', 'zeroStockQty'].forEach(function(varName) {
            try {
                Object.defineProperty(window, varName, {
                    value: 0,
                    writable: false,
                    configurable: true
                });
            } catch (e) {
                console.error('Could not define property: ' + varName, e);
                // Fallback: direct assignment
                window[varName] = 0;
            }
        });
        
        console.log('🛑 CRITICAL: Global stock variables forced to zero');
        
        // Do NOT show message on page load - wait for user action
        // We'll still disable the buttons to prevent invalid orders
        disableAllAddToCartButtons();
    }
    
    // Function to check if stock is zero using multiple methods
    function isStockZero() {
        // Check all possible stock variables
        return (
            stockQty === 0 || 
            window.zeroStockQty === 0 || 
            window.productStockQty === 0 || 
            window.stockQuantity === 0
        );
    }
    
    // Function to check if selected dates include past dates
    function hasPastDates() {
        // If we have selectedDates in window object (set by the calendar system)
        if (window.selectedDates && window.selectedDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
            
            // Check each selected date
            for (let i = 0; i < window.selectedDates.length; i++) {
                const selectedDate = new Date(window.selectedDates[i]);
                selectedDate.setHours(0, 0, 0, 0);
                
                // If this date is before today, it's a past date
                if (selectedDate < today) {
                    console.log('🔜 PAST DATE DETECTED:', selectedDate);
                    return true;
                }
            }
        }
        
        // No past dates found
        return false;
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
    
    // Variable to track if user has closed the message
    let userClosedMessage = false;
    
    // Function to display zero stock message that matches the existing site styling
    function showZeroStockModal() {
        console.log('🚨 ATTEMPTING TO SHOW ZERO STOCK MESSAGE');
        
        // If message is already visible, don't show it again
        if ($('#' + ZERO_STOCK_MESSAGE_ID).is(':visible')) {
            console.log('🚨 Message already visible, not showing again');
            return;
        }
        
        // Remove any existing messages first
        $('#' + ZERO_STOCK_MESSAGE_ID).remove();
        
        // Create message using the same style as the site's other messages
        const messageHtml = `
            <div id="${ZERO_STOCK_MESSAGE_ID}" style="margin: 15px 0; padding: 12px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                <strong>!</strong>
                <p style="margin: 8px 0;">לא ניתן להזמין מוצר זה בתאריכים אלו מכיוון שה עקב הזמנות קודמות.</p>
                <p style="margin: 8px 0 0;">לבירור ניתן ליצור קשר בטלפון: <strong style="direction: ltr; display: inline-block;">050-5544516</strong></p>
            </div>
        `;
        
        // Find the best location to insert the message using multiple possible selectors
        let messageInserted = false;
        
        // Try inserting after rental dates field first
        if ($('#rental_dates_field').length > 0) {
            console.log('🚨 INSERTING AFTER #rental_dates_field');
            $('#rental_dates_field').after(messageHtml);
            messageInserted = true;
        }
        // Try form.cart if rental_dates not found
        else if ($('form.cart').length > 0) {
            console.log('🚨 INSERTING AT START OF form.cart');
            $('form.cart').prepend(messageHtml);
            messageInserted = true;
        }
        // Try the product summary
        else if ($('.product-summary').length > 0) {
            console.log('🚨 INSERTING AFTER .product-summary');
            $('.product-summary').after(messageHtml);
            messageInserted = true;
        }
        // Last resort - add to body
        else {
            console.log('🚨 NO SUITABLE CONTAINER FOUND - INSERTING AT BODY START');
            $('body').prepend(messageHtml);
            messageInserted = true;
        }
        
        // Hide any conflicting messages to avoid confusion
        $('#date-validation-message, #duplicate-booking-approval, #duplicate-booking-info, #duplicate-booking-limit').hide();
        
        // Show with animation if inserted
        if (messageInserted) {
            $('#' + ZERO_STOCK_MESSAGE_ID).hide().fadeIn(400);
            console.log('🚨 ZERO STOCK MESSAGE DISPLAYED');
        } else {
            console.error('🚨 FAILED TO INSERT ZERO STOCK MESSAGE');
        }
        
        // Force message to be visible by adding it again after a delay (backup)
        setTimeout(function() {
            if ($('#' + ZERO_STOCK_MESSAGE_ID).length === 0) {
                console.log('🚨 RETRY: Message not found, trying again');
                // If message wasn't inserted successfully, try one more method
                const container = $('.single-product');
                if (container.length > 0) {
                    container.prepend(messageHtml);
                    $('#' + ZERO_STOCK_MESSAGE_ID).hide().fadeIn(400);
                    console.log('🚨 RETRY: Message inserted using alternate method');
                }
            }
        }, 1000);
    }
    
    // Function to enforce zero stock restrictions - only when user interacts with booking
    function enforceZeroStockRestrictions() {
        if (isStockZero()) {
            console.log('🛑 CRITICAL: Enforcing zero stock restrictions');
            disableAllAddToCartButtons();
            return true;
        }
        return false;
    }
    
    // CRITICAL: Initialize event handlers immediately and also run a check
    forceInitializeEventHandlers();
    
    // Force initialize all event handlers and trigger an immediate check
    function forceInitializeEventHandlers() {
        console.log('🛑 CRITICAL: Force initializing all event handlers');
        
        // DIRECT: Add click handlers to buttons using multiple methods for redundancy
        $('.single_add_to_cart_button, .add_to_cart_button, .btn-redirect, button[name="add-to-cart"]').each(function() {
            const button = $(this);
            
            // Remove any existing click handlers
            button.off('click.zeroStockValidator');
            
            // Add our handler with a namespace to avoid conflicts
            button.on('click.zeroStockValidator', function(e) {
                console.log('🛑 BUTTON CLICKED: Checking stock');
                
                // First check for past dates
                if (hasPastDates()) {
                    console.log('🛑 PAST DATES DETECTED ON BUTTON CLICK');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    showPastDatesMessage();
                    return false;
                }
                // Then check for zero stock
                else if (isStockZero()) {
                    console.log('🛑 ZERO STOCK DETECTED ON BUTTON CLICK');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    showZeroStockModal();
                    return false;
                }
            });
            
            console.log('🛑 Attached zero stock handler to button:', button.attr('class'));
        });
        
        // DOCUMENT LEVEL: Also attach a document-level handler for any dynamically added buttons
        $(document).off('click.zeroStockValidator', '.single_add_to_cart_button, .add_to_cart_button, .btn-redirect, button[name="add-to-cart"]');
        $(document).on('click.zeroStockValidator', '.single_add_to_cart_button, .add_to_cart_button, .btn-redirect, button[name="add-to-cart"]', function(e) {
            console.log('🛑 DOCUMENT LEVEL: Button clicked');
            
            // Check for past dates first
            if (hasPastDates()) {
                console.log('🛑 DOCUMENT LEVEL: Past dates detected');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                showPastDatesMessage();
                return false;
            }
            // Then check for zero stock
            else if (isStockZero()) {
                console.log('🛑 DOCUMENT LEVEL: Zero stock detected');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                showZeroStockModal();
                return false;
            }
        });
        
        // FORM SUBMISSIONS: Intercept all form submissions
        $('form.cart, form.variations_form, form:has(button[name="add-to-cart"])').each(function() {
            const form = $(this);
            
            // Remove existing handlers
            form.off('submit.zeroStockValidator');
            
            // Add new handler
            form.on('submit.zeroStockValidator', function(e) {
                console.log('🛑 FORM SUBMISSION DETECTED');
                
                // Check for past dates first
                if (hasPastDates()) {
                    console.log('🛑 PAST DATES DETECTED ON FORM SUBMIT');
                    e.preventDefault();
                    e.stopPropagation();
                    showPastDatesMessage();
                    return false;
                }
                // Then check for zero stock
                else if (isStockZero()) {
                    console.log('🛑 ZERO STOCK DETECTED ON FORM SUBMIT');
                    e.preventDefault();
                    e.stopPropagation();
                    showZeroStockModal();
                    return false;
                }
            });
            
            console.log('🛑 Attached zero stock handler to form:', form.attr('class'));
        });
    }
    
    // CRITICAL: Patch the validateDateRange function to enforce zero stock check
    if (typeof window.validateDateRange === 'function') {
        console.log('🛑 Patching validateDateRange to enforce zero stock check');
        
        // Store the original function
        const originalValidateDateRange = window.validateDateRange;
        
        // Override with our patched version
        window.validateDateRange = function() {
            // First check stock - if zero, fail validation but don't show message yet
            if (isStockZero()) {
                // Don't show message here - wait for user to try booking
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
            // First check stock - only fail validation
            if (isStockZero()) {
                // Don't show message here, wait for user to try booking
                return false;
            }
            
            // Otherwise, proceed with original validation
            return originalCheckForDuplicateOrder.apply(this, arguments);
        };
    }
    
    // No automatic periodic checks that re-show the message
    // Removed the setInterval
    
    // No immediate check either - only show on user interaction
    
    // Function to show past dates error message
    function showPastDatesMessage() {
        // Generate a unique ID for this message
        const PAST_DATES_MESSAGE_ID = 'past-dates-message';
        
        // Remove any existing messages first
        $('#' + PAST_DATES_MESSAGE_ID).remove();
        
        // Create message using the same style as other messages
        const messageHtml = `
            <div id="${PAST_DATES_MESSAGE_ID}" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;">
                <strong>לא ניתן להזמין בתאריכים שכבר עברו!</strong>
                <p style="margin: 8px 0;">אנא בחר תאריכים עתידיים בלבד להשכרת המוצר.</p>
            </div>
        `;
        
        // Find the best location to insert the message
        let messageInserted = false;
        
        // Try inserting after rental dates field first
        if ($('#rental_dates_field').length > 0) {
            console.log('🕒 INSERTING PAST DATES MESSAGE AFTER #rental_dates_field');
            $('#rental_dates_field').after(messageHtml);
            messageInserted = true;
        }
        // Try form.cart if rental_dates not found
        else if ($('form.cart').length > 0) {
            console.log('🕒 INSERTING PAST DATES MESSAGE AT START OF form.cart');
            $('form.cart').prepend(messageHtml);
            messageInserted = true;
        }
        // Try the product summary
        else if ($('.product-summary').length > 0) {
            console.log('🕒 INSERTING PAST DATES MESSAGE AFTER .product-summary');
            $('.product-summary').after(messageHtml);
            messageInserted = true;
        }
        // Last resort - add to body
        else {
            console.log('🕒 NO SUITABLE CONTAINER FOUND - INSERTING AT BODY START');
            $('body').prepend(messageHtml);
            messageInserted = true;
        }
        
        // Hide any conflicting messages to avoid confusion
        $('#date-validation-message, #duplicate-booking-approval, #duplicate-booking-info, #duplicate-booking-limit').hide();
        
        // Show with animation if inserted
        if (messageInserted) {
            $('#' + PAST_DATES_MESSAGE_ID).hide().fadeIn(400);
            console.log('🕒 PAST DATES MESSAGE DISPLAYED');
        }
    }
    
    // Add listener to date selection to catch duplicate booking attempts
    $(document).on('click', '.day-cell, #confirm-dates', function() {
        // When dates are selected, disable buttons but don't show message yet
        if (isStockZero()) {
            disableAllAddToCartButtons();
        }
        // Also check for past dates on date selection
        else if (hasPastDates()) {
            disableAllAddToCartButtons();
        }
    });
});
