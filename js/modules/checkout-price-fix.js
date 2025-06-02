/**
 * Mitnafun UPro - Checkout Price Fix
 * Focused solution to fix price calculations on the checkout page
 */

(function($) {
    'use strict';
    
    // DOM ready function
    $(document).ready(function() {
        // Run initial price calculation
        recalculateCheckoutPrices();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up periodic check as a safety measure
        setInterval(recalculateCheckoutPrices, 2000);
        
        console.log('Checkout price fix module initialized');
    });
    
    /**
     * Recalculate checkout prices from visible line items
     */
    function recalculateCheckoutPrices() {
        // Only run on checkout page
        if (!$('.woocommerce-checkout-review-order-table').length) {
            return;
        }
        
        var subtotal = 0;
        var currencySymbol = $('.woocommerce-Price-currencySymbol').first().text() || '₪';
        
        console.log('Recalculating checkout prices...');
        
        // Sum all product line totals
        $('.cart_item .product-total .woocommerce-Price-amount').each(function() {
            try {
                var priceText = $(this).text().trim();
                var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                
                if (!isNaN(price)) {
                    subtotal += price;
                    console.log('Added line total: ' + price);
                }
            } catch(e) {
                console.error('Error parsing price:', e);
            }
        });
        
        console.log('Final calculated subtotal: ' + subtotal);
        
        // Only update if we have a valid subtotal
        if (subtotal > 0) {
            // Format the total with the currency symbol
            var formattedTotal = subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 
                '&nbsp;<span class="woocommerce-Price-currencySymbol">' + currencySymbol + '</span>';
            
            // Update the subtotal display
            $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(formattedTotal);
            
            // Update the order total display (same as subtotal since there are no extra fees)
            $('.order-total div:last-child .woocommerce-Price-amount').html(formattedTotal);
            
            console.log('Updated checkout displays with total: ' + subtotal);
        }
    }
    
    /**
     * Set up event listeners for various checkout interactions
     */
    function setupEventListeners() {
        // Watch for remove button clicks using event delegation
        $(document).on('click', '.cart_item .remove, .remove-item', function(e) {
            console.log('Remove button clicked');
            
            // Run the recalculation after a slight delay to allow DOM updates
            setTimeout(recalculateCheckoutPrices, 500);
            setTimeout(recalculateCheckoutPrices, 1000); // Run again to be safe
        });
        
        // Listen for WooCommerce AJAX events
        $(document.body).on('updated_checkout wc_fragments_loaded wc_fragment_refresh removed_from_cart added_to_cart', function() {
            console.log('WooCommerce event detected');
            recalculateCheckoutPrices();
        });
        
        // Watch for DOM mutations on the checkout table
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                console.log('DOM mutation detected in checkout table');
                recalculateCheckoutPrices();
            });
            
            var checkoutTable = document.querySelector('.woocommerce-checkout-review-order-table');
            if (checkoutTable) {
                observer.observe(checkoutTable, { 
                    childList: true, 
                    subtree: true 
                });
                console.log('Mutation observer attached to checkout table');
            }
        }
    }
    
})(jQuery);
