/**
 * Stock-Based Parallel Orders Handler for Mitnafun
 * 
 * Restores the special stock handling rules:
 * - If stock > 1: No need for first/last day manipulation, parallel orders allowed
 * - If stock = 0 or 1: Special booking rules apply for first/last day
 */
(function($) {
    'use strict';
    
    // Initialize on document ready
    $(document).ready(function() {
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        console.log('🔥 Stock parallel orders handler initialized');
        
        // Get the current stock quantity from the page
        const stockText = $('.stock').text().trim();
        const stockMatch = stockText.match(/(\d+)/);
        let stockQty = 0;
        
        if (stockMatch && stockMatch[1]) {
            stockQty = parseInt(stockMatch[1], 10);
        }
        
        // Store stock for other scripts to reference
        window.productStockQty = stockQty;
        console.log('🔥 Product stock quantity:', stockQty);
        
        // Apply special rules based on stock
        applyStockBasedRules(stockQty);
        
        // Also hook into the AJAX response for reserved dates to ensure
        // rules are applied after data is loaded
        $(document).ajaxSuccess(function(event, xhr, settings) {
            if (settings.data && settings.data.indexOf('action=get_reserved_dates') !== -1) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success && response.data) {
                        // Get stock info from response
                        const responseStock = response.data.stock_qty || 0;
                        
                        // Update our local stock value if it differs
                        if (responseStock !== stockQty) {
                            stockQty = responseStock;
                            window.productStockQty = stockQty;
                            console.log('🔥 Updated stock from AJAX:', stockQty);
                            
                            // Re-apply rules with new stock value
                            applyStockBasedRules(stockQty);
                        }
                        
                        // Always update calendar based on current stock value
                        updateCalendarForStock(stockQty, response.data);
                    }
                } catch (e) {
                    console.error('Error processing stock in AJAX response:', e);
                }
            }
        });
    });
    
    /**
     * Apply special booking rules based on stock quantity
     */
    function applyStockBasedRules(stockQty) {
        // For stock > 1: No restrictions on booking dates
        if (stockQty > 1) {
            console.log('🔥 Stock > 1: Enabling parallel bookings mode');
            
            // Hide any special return time notices or fields
            $('.return-time-field, .pickup-time-field').hide();
            
            // Make standard return time notice visible
            $('#return-time-notice').show();
            
            // Enable parallel booking mode in calendar
            window.enableParallelBookings = true;
            
            // Add a subtle indicator only for admin users (now in debug console only)
            console.log('🔥 Parallel booking mode enabled for this product (stock > 1)');
            
            // Store this status in a global variable for other scripts to reference
            window.parallelBookingEnabled = true;
        } else {
            // Stock = 0 or 1: Special booking rules apply
            console.log('🔥 Stock ≤ 1: Enabling special booking rules');
            
            // Show special pickup/return time fields
            $('.return-time-field, .pickup-time-field').show();
            
            // Disable parallel booking mode in calendar
            window.enableParallelBookings = false;
            
            // Remove parallel booking indicator if it exists
            $('#parallel-booking-indicator').remove();
        }
    }
    
    /**
     * Update calendar display based on stock quantity
     */
    function updateCalendarForStock(stockQty, responseData) {
        // For stock > 1, we don't need to show product reservations
        if (stockQty > 1) {
            console.log('🔥 Stock > 1: No date restrictions needed in calendar');
            
            // Find all disabled dates that aren't weekends
            setTimeout(function() {
                const $disabledDates = $('.day-cell.disabled').not('.weekend');
                if ($disabledDates.length > 0) {
                    console.log(`🔥 Found ${$disabledDates.length} disabled dates to enable for parallel booking`);
                    
                    // Remove the disabled class and add parallel booking indicator
                    $disabledDates.removeClass('disabled').attr('data-selectable', 'true');
                    
                    // Also update any tooltips or classes
                    $disabledDates.each(function() {
                        const $cell = $(this);
                        const title = $cell.attr('title') || '';
                        
                        if (title.indexOf('תפוס') !== -1) {
                            $cell.attr('title', 'ניתן להזמנה במקביל');
                            $cell.addClass('parallel-available');
                        }
                    });
                }
            }, 500); // Wait a bit for the calendar to fully render
        } else {
            console.log('🔥 Stock ≤ 1: Special handling for early-return and return dates');
            
            // Special handling for stock = 0/1: Allow early-return and return dates
            setTimeout(function() {
                // Find all cells with early-return or return date markers and ensure they're selectable
                const $earlyReturnDates = $('.day-cell.early-return-date, .day-cell[data-early-return="true"]');
                const $returnDates = $('.day-cell.return-date, .day-cell[data-return-date="true"]');
                
                if ($earlyReturnDates.length > 0) {
                    console.log(`🔥 Found ${$earlyReturnDates.length} early-return dates to make selectable`);
                    
                    $earlyReturnDates.each(function() {
                        const $cell = $(this);
                        $cell.removeClass('disabled').attr('data-selectable', 'true');
                        
                        // Add specific title to clarify this is an early return date
                        if (!$cell.attr('title')) {
                            $cell.attr('title', 'החזרה מוקדמת - ניתן להזמנה');
                        }
                    });
                }
                
                if ($returnDates.length > 0) {
                    console.log(`🔥 Found ${$returnDates.length} return dates to make selectable`);
                    
                    $returnDates.each(function() {
                        const $cell = $(this);
                        $cell.removeClass('disabled').attr('data-selectable', 'true');
                        
                        // Add specific title to clarify this is a return date
                        if (!$cell.attr('title')) {
                            $cell.attr('title', 'יום החזרה - ניתן להזמנה');
                        }
                    });
                }
                
                // Also ensure the date validation function knows these dates are special
                if (typeof window.originalValidateDateRange === 'undefined' && 
                    typeof window.validateDateRange === 'function') {
                    
                    window.originalValidateDateRange = window.validateDateRange;
                    window.validateDateRange = function(startDate, endDate) {
                        // First check if either date is an early return or return date
                        const dateStr1 = startDate.toISOString().split('T')[0];
                        const dateStr2 = endDate.toISOString().split('T')[0];
                        
                        const $cell1 = $(`.day-cell[data-date="${dateStr1}"]`);
                        const $cell2 = $(`.day-cell[data-date="${dateStr2}"]`);
                        
                        const isSpecialDate1 = $cell1.hasClass('early-return-date') || 
                                           $cell1.attr('data-early-return') === 'true' ||
                                           $cell1.hasClass('return-date') || 
                                           $cell1.attr('data-return-date') === 'true';
                                           
                        const isSpecialDate2 = $cell2.hasClass('early-return-date') || 
                                           $cell2.attr('data-early-return') === 'true' ||
                                           $cell2.hasClass('return-date') || 
                                           $cell2.attr('data-return-date') === 'true';
                                           
                        // If both dates are special, allow the booking
                        if (isSpecialDate1 && isSpecialDate2) {
                            console.log('🔥 Special case: both dates are early-return or return dates');
                            return true;
                        }
                        
                        // Otherwise use the original validation
                        return window.originalValidateDateRange.apply(this, arguments);
                    };
                    console.log('🔥 Added special date handling to validateDateRange');
                }
            }, 500);
        }
    }
    
})(jQuery);
