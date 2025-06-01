<?php
/**
 * Direct checkout price override - final attempt
 */

if (!defined('ABSPATH')) {
    exit;
}

// Add direct HTML override for checkout totals
add_action('woocommerce_review_order_before_submit', 'mitnafun_final_price_override', 999);

function mitnafun_final_price_override() {
    if (!is_checkout()) {
        return;
    }
    
    $cart = WC()->cart;
    if (!$cart || $cart->is_empty()) {
        return;
    }
    
    // Calculate the true total from line items only
    $line_total = 0;
    foreach ($cart->get_cart() as $cart_item) {
        if (isset($cart_item['line_total'])) {
            $line_total += $cart_item['line_total'];
        }
    }
    
    // Only proceed if we have a valid total
    if ($line_total <= 0) {
        return;
    }
    
    // Format the total for display
    $formatted_total = wc_price($line_total);
    
    // Output our price override script
    ?>
    <div id="mitnafun-direct-price-override" style="display:none;" 
         data-line-total="<?php echo esc_attr($line_total); ?>"
         data-formatted-total="<?php echo esc_attr($formatted_total); ?>">
    </div>
    
    <script type="text/javascript">
    (function() {
        // Function to directly replace displayed prices
        function forceOverridePrices() {
            // Get our reference values
            var priceElement = document.getElementById('mitnafun-direct-price-override');
            if (!priceElement) return;
            
            var formattedTotal = priceElement.getAttribute('data-formatted-total');
            if (!formattedTotal) return;
            
            console.log('💲 Forcing price override: ' + formattedTotal);
            
            // Find all subtotal and total elements and replace their content
            var subtotalElements = document.querySelectorAll('.cart-subtotal div:last-child');
            var totalElements = document.querySelectorAll('.order-total div:last-child');
            
            // Update subtotals
            for (var i = 0; i < subtotalElements.length; i++) {
                subtotalElements[i].innerHTML = formattedTotal;
            }
            
            // Update totals
            for (var j = 0; j < totalElements.length; j++) {
                totalElements[j].innerHTML = formattedTotal;
            }
        }
        
        // Override prices immediately when script loads
        forceOverridePrices();
        
        // Also run when DOM is fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            forceOverridePrices();
            // Run again after a short delay
            setTimeout(forceOverridePrices, 500);
        });
        
        // Watch for cart removing events
        document.addEventListener('click', function(e) {
            // Check if the clicked element is a remove button or its child
            if (e.target.classList.contains('remove-item') || 
                e.target.parentNode.classList.contains('remove-item') || 
                e.target.classList.contains('remove') || 
                e.target.parentNode.classList.contains('remove')) {
                    
                // Run multiple times after removal
                setTimeout(forceOverridePrices, 300);
                setTimeout(forceOverridePrices, 600);
                setTimeout(forceOverridePrices, 1000);
            }
        });
        
        // Add a MutationObserver to watch for changes to the cart items
        var observer = new MutationObserver(function() {
            forceOverridePrices();
        });
        
        // Start observing the checkout form
        var checkout = document.querySelector('form.checkout');
        if (checkout) {
            observer.observe(checkout, { 
                childList: true, 
                subtree: true,
                attributes: true,
                characterData: true
            });
        }
    })();
    </script>
    <?php
}
