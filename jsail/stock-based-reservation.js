/**
 * Stock-Based Reservation Handler
 * 
 * Provides additional checking for reservation handling based on stock quantity
 * Ensures the calendar UI properly updates based on stock levels
 */
(function($) {
    'use strict';
    
    // Initialize on document ready
    $(document).ready(function() {
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        console.log('Stock-based reservation handler initialized');
        
        // Hook into the AJAX response processing for reserved dates
        $(document).ajaxSuccess(function(event, xhr, settings) {
            // Check if this is the reserved dates response
            if (settings.data && settings.data.indexOf('action=get_reserved_dates') !== -1) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    
                    if (response.success && response.data) {
                        // Log stock-based filtering status
                        console.log('Reserved dates filtered based on stock:', response.data.show_reserved_dates);
                        
                        if (response.data.debug_info && response.data.debug_info.stock_check) {
                            console.log('Product stock:', response.data.debug_info.stock_check.product_stock);
                            console.log('Showing reserved dates:', response.data.debug_info.stock_check.showing_reserved);
                        }
                        
                        // Special handling for return time fields based on stock
                        updateReturnTimeFieldsBasedOnStock(response.data);
                    }
                } catch (e) {
                    console.error('Error processing AJAX response:', e);
                }
            }
        });
    });
    
    /**
     * Update return time fields visibility based on stock
     */
    function updateReturnTimeFieldsBasedOnStock(data) {
        var showReservedDates = data.show_reserved_dates === true;
        
        // Only show special pickup/return fields when stock is 1 or less
        if (!showReservedDates) {
            // Hide pickup/return time fields for products with stock > 1
            $('.pickup-time-field, .return-time-field').hide();
            
            // Make sure early return notice is hidden
            $('.return-time-notice').each(function() {
                if ($(this).text().indexOf('החזרה מוקדמת') !== -1) {
                    $(this).hide();
                }
            });
            
            console.log('Special time fields hidden - stock > 1');
        } else {
            // Show pickup/return time fields for products with stock = 1
            $('.pickup-time-field, .return-time-field').show();
            
            // Make sure return notice is visible
            $('.return-time-notice').show();
            
            console.log('Special time fields shown - stock ≤ 1');
        }
    }
    
})(jQuery);
