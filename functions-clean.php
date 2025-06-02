<?php
/**
 * Mitnafun UPro - Clean Functions File
 * This is a simplified version of the functions.php file
 * Created on 2025-06-02
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

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
    
    // Core scripts
    wp_enqueue_script('jquery');
    wp_enqueue_script('mitnafun-main', get_template_directory_uri() . '/js/core/main.js', array('jquery'), '1.0.0', true);
    
    // Only load checkout scripts on checkout page
    if (is_checkout()) {
        wp_enqueue_script('mitnafun-checkout', get_template_directory_uri() . '/js/modules/checkout.js', array('jquery'), '1.0.0', true);
    }
    
    // Only load product scripts on product pages
    if (is_product()) {
        wp_enqueue_script('mitnafun-product', get_template_directory_uri() . '/js/modules/product.js', array('jquery'), '1.0.0', true);
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_upro_scripts');

// Include required files
require_once get_template_directory() . '/inc/woocommerce.php';
require_once get_template_directory() . '/inc/rental-functions.php';

/**
 * Include core rental functionality
 * These files handle the core rental booking system
 */
$core_files = array(
    '/inc/checkout.php',
    '/inc/rental-pricing.php',
);

foreach ($core_files as $file) {
    if (file_exists(get_template_directory() . $file)) {
        require_once get_template_directory() . $file;
    }
}

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
            }
        }
        
        // Run on document ready
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

?>
