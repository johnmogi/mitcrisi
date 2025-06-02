/**
 * Mitnafun UPro - Checkout JavaScript
 * Handles checkout-specific functionality including price calculations
 */

(function($) {
    'use strict';
    
    // Run when document is ready
    $(document).ready(function() {
        // Initialize checkout functions
        initPriceCalculation();
        initRemoveItemHandlers();
        
        // Listen for WooCommerce events
        bindWooCommerceEvents();
        
        // Set up periodic price check
        setInterval(calculateAndUpdatePrices, 2500);
    });
    
    /**
     * Calculate prices from visible line items and update totals
     */
    function calculateAndUpdatePrices() {
        if (!$('.woocommerce-checkout-review-order-table').length) {
            return; // Not on checkout page
        }
        
        var total = 0;
        var symbol = $('.woocommerce-Price-currencySymbol').first().text() || '₪';
        
        // Sum all product prices
        $('.cart_item .product-total .woocommerce-Price-amount').each(function() {
            try {
                var priceText = $(this).text().trim();
                var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                if (!isNaN(price)) {
                    total += price;
                    console.log('Added price: ' + price + ', running total: ' + total);
                }
            } catch(e) {
                console.error('Error parsing price', e);
            }
        });
        
        // Only update if we have a valid total
        if (total > 0) {
            var formattedTotal = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 
                '&nbsp;<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>';
            
            // Update subtotal and total
            $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(formattedTotal);
            $('.order-total div:last-child .woocommerce-Price-amount').html(formattedTotal);
            
            console.log('Updated checkout totals to: ' + total);
        }
    }
    
    /**
     * Initialize price calculation
     */
    function initPriceCalculation() {
        // Initial calculation
        calculateAndUpdatePrices();
    }
    
    /**
     * Handle item removal
     */
    function initRemoveItemHandlers() {
        // Watch for clicks on remove buttons
        $(document).on('click', '.remove-item, .remove', function(e) {
            console.log('Remove button clicked - will update prices');
            
            // Run multiple times to ensure it catches the update
            setTimeout(calculateAndUpdatePrices, 100);
            setTimeout(calculateAndUpdatePrices, 500);
            setTimeout(calculateAndUpdatePrices, 1000);
        });
    }
    
    /**
     * Bind to WooCommerce AJAX events
     */
    function bindWooCommerceEvents() {
        $(document.body).on('updated_checkout wc_fragments_loaded wc_fragments_refreshed removed_from_cart updated_cart_totals', function() {
            console.log('WooCommerce event detected - updating prices');
            calculateAndUpdatePrices();
        });
    }
    
})(jQuery);
