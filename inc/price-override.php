<?php
/**
 * Direct Price Override for WooCommerce Checkout
 * This file handles direct HTML injection for fixing price display issues
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Ultra simple direct override of price totals at checkout
 */
add_action('woocommerce_after_checkout_form', 'mitnafun_direct_price_override');
add_action('woocommerce_after_cart', 'mitnafun_direct_price_override');

function mitnafun_direct_price_override() {
    if (!is_checkout() && !is_cart()) {
        return;
    }
    
    // Super simple script to directly copy prices
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Simple function to directly update totals
        function fixTotals() {
            // Get all visible cart item totals
            var total = 0;
            
            $('.cart_item .product-total .woocommerce-Price-amount').each(function() {
                try {
                    // Extract just the number
                    var text = $(this).text().trim();
                    var cleanText = text.replace(/[^\d.]/g, "");
                    var price = parseFloat(cleanText);
                    
                    if (!isNaN(price)) {
                        total += price;
                        console.log("Found product price: " + price);
                    }
                } catch(e) {}
            });
            
            if (total > 0) {
                console.log("Setting total to: " + total);
                
                // Get the currency symbol
                var symbol = "₪";
                try { symbol = $('.woocommerce-Price-currencySymbol').first().text(); } catch(e) {}
                
                // Format with proper separators
                var formattedPrice = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                var html = formattedPrice + "&nbsp;<span class=\"woocommerce-Price-currencySymbol\">" + symbol + "</span>";
                
                // Direct update of both subtotal and total
                $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(html);
                $('.order-total div:last-child .woocommerce-Price-amount').html(html);
            }
        }
        
        // Run once on page load and periodically check
        fixTotals();
        setTimeout(fixTotals, 1000); // Another check after 1 second
        
        // Handle ALL possible remove buttons throughout the site
        $(document).on('click', '.remove-item, .remove, .remove_from_cart_button, a[href*="remove_item"]', function(e) {
            console.log('Remove button clicked - updating totals');
            // Multiple checks with increasing delays to catch the price update
            setTimeout(fixTotals, 300);
            setTimeout(fixTotals, 600);
            setTimeout(fixTotals, 1000);
        });
        
        // Monitor AJAX completions which might be triggered by cart changes
        $(document).ajaxComplete(function(event, xhr, settings) {
            // If this is a cart-related AJAX request, update totals
            if (settings.url && (settings.url.indexOf('cart') > -1 || settings.url.indexOf('checkout') > -1)) {
                console.log('Cart-related AJAX completed - updating totals');
                setTimeout(fixTotals, 300);
            }
        });
        
        // Standard WooCommerce events
        $(document.body).on('updated_checkout updated_cart_totals removed_from_cart wc_fragments_loaded wc_fragments_refreshed', function() {
            console.log('WooCommerce event triggered - updating totals');
            setTimeout(fixTotals, 100);
        });
        
        // Final safety check - periodically update
        setInterval(fixTotals, 2000);
    });
    </script>
    <?php
}
