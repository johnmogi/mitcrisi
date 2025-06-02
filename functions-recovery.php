<?php
/**
 * Mitnafun UPro - Recovery Functions File
 * This is a recovery version of the functions.php file
 * Created on 2025-06-02
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Include core files
include 'inc/checkout.php';
include 'inc/ajax-actions.php';
include 'inc/kama_pagenavi.php';
include 'inc/bookings.php';
include 'inc/admin-orders.php'; // Admin order display functions
include 'inc/rental-pricing.php'; // Multi-day rental pricing system

// Include emergency price fixes
// Only include one of these to avoid conflicts
include 'inc/price-fix.php'; // Emergency fix for zero prices
// include 'inc/price-override.php'; // Direct price display override for checkout
// include 'inc/force-price-fix.php'; // Force correct price display on checkout
// include 'inc/checkout-price-override.php'; // Final direct price override on checkout
// include 'inc/emergency-price-fix.php'; // Emergency direct DOM fix for checkout prices

// Theme setup
function mitnafun_upro_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    
    // Register menus
    register_nav_menus(array(
        'primary' => 'Primary Menu',
        'footer' => 'Footer Menu',
    ));
}
add_action('after_setup_theme', 'mitnafun_upro_setup');

// Enqueue scripts and styles
function mitnafun_upro_scripts() {
    // Core styles
    wp_enqueue_style('mitnafun-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Main stylesheet
    wp_enqueue_style('mitnafun-main', get_template_directory_uri() . '/css/style.css', array(), '1.0.0');
    
    // Vendor scripts
    wp_enqueue_script('jquery');
    wp_enqueue_script('jquery-sticky', get_template_directory_uri() . '/js/vendor/jquery.sticky.js', array('jquery'), '1.0.0', true);
    wp_enqueue_script('owl-carousel', get_template_directory_uri() . '/js/vendor/owl.carousel.js', array('jquery'), '1.0.0', true);
    
    // Core scripts
    wp_enqueue_script('mitnafun-main', get_template_directory_uri() . '/js/core/main.js', array('jquery'), '1.0.0', true);
    
    // Only load checkout scripts on checkout page
    if (is_checkout()) {
        wp_enqueue_script('mitnafun-checkout', get_template_directory_uri() . '/js/modules/checkout.js', array('jquery'), '1.0.0', true);
        wp_enqueue_script('mitnafun-checkout-price-fix', get_template_directory_uri() . '/js/modules/checkout-price-fix.js', array('jquery'), '1.0.0', true);
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_upro_scripts');

/**
 * Direct price fix for checkout
 * This ensures the correct prices are displayed in the checkout
 */
function mitnafun_direct_price_fix() {
    if (!is_checkout()) {
        return;
    }
    
    // Add JavaScript to fix prices
    ?>
    <script type="text/javascript">
    (function($) {
        // Function to calculate correct total from line items
        function updateCheckoutTotals() {
            var total = 0;
            
            // Sum all product prices
            $('.cart_item .product-total .woocommerce-Price-amount').each(function() {
                var priceText = $(this).text().trim();
                var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                if (!isNaN(price)) {
                    total += price;
                    console.log('Added price: ' + price + ', running total: ' + total);
                }
            });
            
            // Only update if we have a valid total
            if (total > 0) {
                var symbol = $('.woocommerce-Price-currencySymbol').first().text() || '₪';
                var formattedTotal = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 
                    '&nbsp;<span class="woocommerce-Price-currencySymbol">' + symbol + '</span>';
                
                // Update subtotal and total
                $('.cart-subtotal div:last-child .woocommerce-Price-amount').html(formattedTotal);
                $('.order-total div:last-child .woocommerce-Price-amount').html(formattedTotal);
                
                console.log('Updated checkout totals to: ' + total);
            }
        }
        
        // Run when document is ready
        $(document).ready(function() {
            updateCheckoutTotals();
            
            // Run after remove button clicks
            $(document).on('click', '.remove-item, .remove', function() {
                setTimeout(updateCheckoutTotals, 500);
                setTimeout(updateCheckoutTotals, 1000);
            });
            
            // Run after AJAX events
            $(document.body).on('updated_checkout wc_fragments_loaded', function() {
                updateCheckoutTotals();
            });
            
            // Periodic check as safety
            setInterval(updateCheckoutTotals, 2500);
        });
    })(jQuery);
    </script>
    <?php
}
add_action('wp_footer', 'mitnafun_direct_price_fix');

/**
 * Rental date functions
 */
function mitnafun_process_rental_dates($cart_item_data, $product_id, $variation_id) {
    // Process rental dates from POST data
    if (isset($_POST['rental_dates']) && !empty($_POST['rental_dates'])) {
        $cart_item_data['rental_dates'] = sanitize_text_field($_POST['rental_dates']);
    }
    
    // Process pickup time
    if (isset($_POST['pickup_time']) && !empty($_POST['pickup_time'])) {
        $cart_item_data['pickup_time'] = sanitize_text_field($_POST['pickup_time']);
    }
    
    return $cart_item_data;
}
add_filter('woocommerce_add_cart_item_data', 'mitnafun_process_rental_dates', 10, 3);

/**
 * Display rental dates in cart
 */
function mitnafun_display_cart_item_rental_dates($item_data, $cart_item) {
    if (isset($cart_item['rental_dates'])) {
        $item_data[] = array(
            'key'   => 'תאריכי השכרה',
            'value' => wc_clean($cart_item['rental_dates']),
        );
    }
    
    if (isset($cart_item['pickup_time'])) {
        $item_data[] = array(
            'key'   => 'שעת איסוף',
            'value' => wc_clean($cart_item['pickup_time']),
        );
    }
    
    return $item_data;
}
add_filter('woocommerce_get_item_data', 'mitnafun_display_cart_item_rental_dates', 10, 2);

/**
 * Save rental dates as order meta
 */
function mitnafun_add_order_item_meta($item, $cart_item_key, $values) {
    if (isset($values['rental_dates'])) {
        $item->add_meta_data('תאריכי השכרה', $values['rental_dates']);
    }
    
    if (isset($values['pickup_time'])) {
        $item->add_meta_data('שעת איסוף', $values['pickup_time']);
    }
}
add_action('woocommerce_checkout_create_order_line_item', 'mitnafun_add_order_item_meta', 10, 3);

// Add the rest of your core functions here
// ...

?>
