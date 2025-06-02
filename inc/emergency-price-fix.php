<?php
/**
 * Emergency price fix for checkout - directly targeting the DOM structure
 */

if (!defined('ABSPATH')) {
    exit;
}

// Add the emergency price fix script to the footer
add_action('wp_footer', 'mitnafun_emergency_price_fix_script');

function mitnafun_emergency_price_fix_script() {
    if (!is_checkout()) {
        return;
    }
    
    ?>
    <script type="text/javascript">
    (function() {
        // Function to directly calculate and update prices
        function updatePricesDirectly() {
            // Target the exact elements in the DOM structure
            console.log("🆘 Running emergency price fix...");
            
            // Calculate the sum of all product prices
            var sum = 0;
            var items = document.querySelectorAll('.cart_item .product-total .woocommerce-Price-amount');
            
            console.log("Found " + items.length + " cart items");
            
            // Sum all product prices
            items.forEach(function(item) {
                var priceText = item.textContent.trim();
                console.log("Item price text: " + priceText);
                
                // Extract just the number
                var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                console.log("Extracted price: " + price);
                
                if (!isNaN(price)) {
                    sum += price;
                }
            });
            
            console.log("Total calculated sum: " + sum);
            
            // Only proceed if we have a valid sum
            if (sum <= 0 || isNaN(sum)) {
                console.log("Invalid sum, not updating");
                return;
            }
            
            // Format the sum with the currency symbol
            var symbol = "₪";
            try {
                symbol = document.querySelector('.woocommerce-Price-currencySymbol').textContent.trim() || "₪";
            } catch(e) {}
            
            var formattedPrice = sum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "&nbsp;<span class=\"woocommerce-Price-currencySymbol\">" + symbol + "</span>";
            
            console.log("Formatted price: " + formattedPrice);
            
            // Update the subtotal and total directly in the DOM
            var subtotals = document.querySelectorAll('.cart-subtotal div:last-child .woocommerce-Price-amount');
            var totals = document.querySelectorAll('.order-total div:last-child .woocommerce-Price-amount');
            
            console.log("Found " + subtotals.length + " subtotal elements and " + totals.length + " total elements");
            
            // Update subtotals
            subtotals.forEach(function(el) {
                el.innerHTML = formattedPrice;
            });
            
            // Update totals
            totals.forEach(function(el) {
                el.innerHTML = formattedPrice;
            });
            
            console.log("✅ Price update complete");
        }
        
        // Execute immediately when script loads
        updatePricesDirectly();
        
        // Set up a MutationObserver to detect changes
        var observer = new MutationObserver(function(mutations) {
            updatePricesDirectly();
        });
        
        // Start observing the checkout form
        var checkout = document.querySelector('form.checkout');
        if (checkout) {
            observer.observe(checkout, {
                childList: true,
                subtree: true
            });
            console.log("Started observer on checkout form");
        }
        
        // Watch for clicks on remove buttons
        document.addEventListener('click', function(e) {
            var target = e.target;
            
            // Check for remove-item clicks
            if (target.classList.contains('remove-item') || 
                (target.parentNode && target.parentNode.classList.contains('remove-item')) || 
                target.classList.contains('remove') ||
                (target.parentNode && target.parentNode.classList.contains('remove'))) {
                
                console.log("🔄 Remove button clicked - updating prices");
                
                // Run multiple times to ensure it catches the update
                setTimeout(updatePricesDirectly, 10);
                setTimeout(updatePricesDirectly, 100);
                setTimeout(updatePricesDirectly, 500);
                setTimeout(updatePricesDirectly, 1000);
            }
        }, true); // Use capture phase to ensure we catch the events
        
        // Also run after DOM is fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log("DOM loaded - updating prices");
            updatePricesDirectly();
        });
        
        // Run periodically as a safety measure
        setInterval(updatePricesDirectly, 2000);
        
        // Log that the script has loaded
        console.log("🚀 Emergency price fix script loaded");
    })();
    </script>
    <style>
    /* Force immediate rendering of price changes */
    .woocommerce-Price-amount {
        transition: none !important;
    }
    </style>
    <?php
}
