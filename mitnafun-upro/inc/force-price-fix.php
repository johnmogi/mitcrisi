<?php
/**
 * Direct Force Price Fix
 * Emergency fix to force correct prices on checkout page
 */

if (!defined('ABSPATH')) {
    exit;
}

// Add our price correction after checkout is rendered
add_action('wp_footer', 'mitnafun_force_price_fix');

function mitnafun_force_price_fix() {
    if (!is_checkout() && !is_cart()) {
        return;
    }
    
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Aggressive direct price corrector
        function forceCorrectPrices() {
            console.log("🔧 Forcing price correction");
            
            // Step 1: Get all product prices from visible cart items
            var totalPrice = 0;
            
            $('.cart_item').each(function() {
                try {
                    // Get price from this specific item
                    var priceElement = $(this).find('.product-total .woocommerce-Price-amount');
                    if (priceElement.length > 0) {
                        // Extract just the number from the first price element we find
                        var priceText = priceElement.first().text().trim();
                        var numericPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
                        
                        if (!isNaN(numericPrice)) {
                            totalPrice += numericPrice;
                            console.log("Found price: " + numericPrice + " - Running total: " + totalPrice);
                        }
                    }
                } catch(e) {
                    console.error("Error processing cart item", e);
                }
            });
            
            // If we found any prices, update the totals
            if (totalPrice > 0) {
                console.log("Setting totals to: " + totalPrice);
                
                // Get currency symbol
                var symbol = $('.woocommerce-Price-currencySymbol').first().text() || '₪';
                
                // Format price with thousands separator
                var formattedPrice = totalPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                // Create the HTML for the price
                var priceHtml = formattedPrice + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>';
                
                // Force update the subtotal and total directly
                $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(priceHtml);
                $('.order-total div:last-child .woocommerce-Price-amount').html(priceHtml);
                
                console.log("✅ Prices updated successfully");
            }
        }
        
        // Run immediately and after short delay
        forceCorrectPrices();
        setTimeout(forceCorrectPrices, 500);
        
        // Force run after any interaction with remove buttons
        $(document).on('click', '.remove-item, .remove', function(e) {
            console.log("🗑️ Remove button clicked");
            alert("Remove button clicked - Will update prices now");
            
            // Force immediate calculation and show result
            var immediateTotal = 0;
            $('.cart_item').each(function() {
                try {
                    var priceText = $(this).find('.product-total .woocommerce-Price-amount').first().text().trim();
                    var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                    if (!isNaN(price)) {
                        immediateTotal += price;
                    }
                } catch(e) {}
            });
            
            alert("Current calculated total: " + immediateTotal + "₪");
            
            // Wait for AJAX to finish and calculate again
            setTimeout(function() {
                // Direct manipulation
                var total = 0;
                $('.cart_item').each(function() {
                    try {
                        var priceText = $(this).find('.product-total .woocommerce-Price-amount').first().text().trim();
                        var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                        if (!isNaN(price)) {
                            total += price;
                        }
                    } catch(e) {}
                });
                
                // Alert and force update
                alert("After 1 second, new total: " + total + "₪");
                
                // Force direct DOM update regardless of other scripts
                if (total > 0) {
                    var symbol = $('.woocommerce-Price-currencySymbol').first().text() || '₪';
                    var html = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>';
                    
                    $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(html);
                    $('.order-total div:last-child .woocommerce-Price-amount').html(html);
                    
                    alert("Updated prices to: " + total + "₪");
                }
            }, 1000);
        });
        
        // Run after any cart/checkout update
        $(document).ajaxComplete(function() {
            setTimeout(forceCorrectPrices, 300);
        });
        
        // Also run periodically to ensure correctness
        setInterval(forceCorrectPrices, 2500);
    });
    </script>
    <?php
}
