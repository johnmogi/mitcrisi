/**
 * Date Range Validator for Mitnafun
 * Ensures users cannot select date ranges that include blocked dates
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        console.info('[Date Validator] Initializing date range validator');
        
        // Override the original date range validation function
        patchDateRangeValidation();
        
        // Also listen for calendar events
        $(document).on('stock-data-updated', function() {
            patchDateRangeValidation();
        });
    });
    
    /**
     * Patch the date range validation to ensure no blocked dates are included
     */
    function patchDateRangeValidation() {
        // Wait for calendar to initialize and validateDateRange to be defined
        if (typeof window.validateDateRange !== 'function') {
            setTimeout(patchDateRangeValidation, 500);
            return;
        }
        
        // Save the original function for reference
        if (!window._originalStrictValidateDateRange) {
            window._originalStrictValidateDateRange = window.validateDateRange;
        }
        
        // Replace with our enhanced version
        window.validateDateRange = function() {
            // Modified zero stock condition to check if a valid future date range is selected
            if (window.zeroStockProduct === true) {
                // Get our selected dates
                if (!window.selectedDates || window.selectedDates.length !== 2) {
                    return false;
                }
                
                // Sort selected dates
                const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
                const startDate = new Date(dates[0]);
                const endDate = new Date(dates[1]);
                
                // Check if both selected dates have the 'future-available' class
                // or are valid special dates (early-return or return-date)
                const startCell = $(`.day-cell[data-date="${formatDateISO(startDate)}"]`);
                const endCell = $(`.day-cell[data-date="${formatDateISO(endDate)}"]`);
                
                const startOk = startCell.hasClass('future-available') || 
                                startCell.hasClass('early-return-date') || 
                                startCell.hasClass('return-date');
                                
                const endOk = endCell.hasClass('future-available') || 
                              endCell.hasClass('early-return-date') || 
                              endCell.hasClass('return-date');
                              
                if (!startOk || !endOk) {
                    showValidationError('אחד מהתאריכים שנבחרו אינו זמין להזמנה');
                    return false;
                }
            }
            
            // First call the original function
            const originalResult = window._originalStrictValidateDateRange.apply(this, arguments);
            
            // If the original validation failed, no need to do more
            if (!originalResult) {
                return false;
            }
            
            // Get our selected dates
            if (!window.selectedDates || window.selectedDates.length !== 2) {
                return originalResult;
            }
            
            // Sort selected dates
            const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
            const startDate = new Date(dates[0]);
            const endDate = new Date(dates[1]);
            
            console.info('[Date Validator] Checking date range:', 
                formatDateSimple(startDate), 'to', formatDateSimple(endDate));
            
            // Check all dates in the range for availability
            const current = new Date(startDate);
            let hasBlockedDate = false;
            const blockedDates = [];
            
            // Go through each date in the range
            while (current <= endDate) {
                const dateStr = formatDateISO(current);
                
                // Get the calendar cell for this date
                const $cell = $(`.day-cell[data-date="${dateStr}"]`);
                
                // Check if date is disabled and not a special date
                if ($cell.length && $cell.hasClass('disabled') && 
                    !$cell.hasClass('early-return-date') && 
                    !$cell.hasClass('return-date') && 
                    $cell.attr('data-early-return') !== 'true' && 
                    $cell.attr('data-return-date') !== 'true') {
                    
                    console.warn('[Date Validator] Blocked date found in range:', formatDateSimple(current));
                    hasBlockedDate = true;
                    blockedDates.push(formatDateSimple(current));
                }
                
                // Move to next day
                current.setDate(current.getDate() + 1);
            }
            
            // If we found any blocked dates, show an error
            if (hasBlockedDate) {
                console.error('[Date Validator] Range contains blocked dates:', blockedDates.join(', '));
                
                // Show error message
                showValidationError('טווח התאריכים שבחרת מכיל תאריך שאינו זמין להזמנה');
                
                return false;
            }
            
            return true;
        };
        
        console.info('[Date Validator] Date range validation patched successfully');
    }
    
    /**
     * Format date as YYYY-MM-DD (ISO format for data attributes)
     */
    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format date as DD.MM.YYYY (for display)
     */
    function formatDateSimple(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${day}.${month}.${year}`;
    }
    
    /**
     * Show validation error message
     */
    function showValidationError(message) {
        // Try multiple potential message containers
        const $messageContainer = $('#date-validation-message, .validation-message').first();
        
        if ($messageContainer.length) {
            $messageContainer.html(message).addClass('error').show();
            
            // Scroll to the message
            $('html, body').animate({
                scrollTop: $messageContainer.offset().top - 100
            }, 200);
        } else {
            // If no container exists, show alert
            alert(message);
        }
        
        // Disable add to cart buttons
        disableAddToCartButtons();
    }
    
    /**
     * Disable all Add to Cart buttons
     */
    function disableAddToCartButtons() {
        // Get all add to cart buttons
        const $addToCartButtons = $('.single_add_to_cart_button');
        
        // Disable them
        $addToCartButtons.prop('disabled', true).addClass('disabled');
        
        // Reduce opacity to indicate they're disabled
        $addToCartButtons.css({
            'opacity': '0.5',
            'cursor': 'not-allowed'
        });
    }
    
})(jQuery);
