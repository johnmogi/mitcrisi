<?php
/**
 * Mitnafun UPro - Enhanced Functions File
 * Combines the core recovery functionality with important features from the original
 * Created on 2025-06-02
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Suppress PHP notices and deprecation warnings in debug.log
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', 'Off');

// Include core files
include 'inc/checkout.php';
include 'inc/ajax-actions.php';
include 'inc/kama_pagenavi.php';
include 'inc/bookings.php';
include 'inc/admin-orders.php'; // Admin order display functions
include 'inc/rental-pricing.php'; // Multi-day rental pricing system
include 'inc/price-fix.php'; // Emergency fix for zero prices
include 'inc/bottleneck-validator.php'; // Pickup time validation for bottleneck orders

// Only include ONE of these price fix solutions at a time to avoid conflicts
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
function load_style_script() {
    wp_enqueue_style('my-normalize', get_stylesheet_directory_uri() . '/css/normalize.css');
    wp_enqueue_style('my-Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    wp_enqueue_style('my-Lunasima', 'https://fonts.googleapis.com/css2?family=Lunasima:wght@400;700&display=swap');
    wp_enqueue_style('my-fancybox', 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css', array(), '3.5.7');
    
    // Enqueue price calculator script for WooCommerce product pages
    if (function_exists('is_product') && is_product()) {
        wp_enqueue_script('mitnafun-price-calculator', get_stylesheet_directory_uri() . '/js/modules/price-calculator.js', array('jquery'), '1.0.0', true);
    }
    
    wp_enqueue_style('my-nice-select', get_stylesheet_directory_uri() . '/css/nice-select.css');
    wp_enqueue_style('my-swiper', 'https://unpkg.com/swiper/swiper-bundle.min.css', array(), '8.0.0');
    wp_enqueue_style('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
    wp_enqueue_style('my-styles', get_stylesheet_directory_uri() . '/css/styles.css', array(), time());
    wp_enqueue_style('my-responsive', get_stylesheet_directory_uri() . '/css/responsive.css', array(), time());
    wp_enqueue_style('my-style-main', get_stylesheet_directory_uri() . '/style.css', array(), time());

    // Core scripts
    wp_enqueue_script('jquery');
    wp_enqueue_script('my-swiper', get_stylesheet_directory_uri() . '/js/vendor/swiper.js', array(), false, true);
    wp_enqueue_script('cuttr', 'https://cdn.jsdelivr.net/npm/cuttr@0.3.0/jquery.cuttr.min.js', array('jquery'), '0.3.0', true);
    wp_enqueue_script('jquery.mask', 'https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js', array('jquery'), '1.14.16', true);
    wp_enqueue_script('my-fancybox', 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js', array('jquery'), '3.5.7', true);
    wp_enqueue_script('my-nice-select', 'https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/js/jquery.nice-select.min.js', array('jquery'), '1.1.0', true);
    wp_enqueue_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), null, true);
    
    // Main theme scripts - using our new organized structure
    wp_enqueue_script('mitnafun-main', get_stylesheet_directory_uri() . '/js/core/main.js', array('jquery'), time(), true);
    
    // Only load checkout scripts on checkout page
    if (is_checkout()) {
        wp_enqueue_script('mitnafun-checkout', get_stylesheet_directory_uri() . '/js/modules/checkout.js', array('jquery'), '1.0.0', true);
        wp_enqueue_script('mitnafun-checkout-price-fix', get_stylesheet_directory_uri() . '/js/modules/checkout-price-fix.js', array('jquery'), '1.0.0', true);
    }
}
add_action('wp_enqueue_scripts', 'load_style_script');

// Enqueue scripts and styles for the rental datepicker
function enqueue_rental_datepicker_assets() {
    if (is_product() || is_checkout()) {
        // Load jQuery UI for datepicker
        wp_enqueue_script('jquery-ui-core');
        
        // Get the current product ID
        $product_id = 0;
        
        // On product page, get the current product ID
        if (is_product()) {
            $product_id = get_the_ID();
        }
        
        // On checkout page, try to get product ID from cart items
        elseif (is_checkout() && function_exists('WC') && isset(WC()->cart)) {
            foreach (WC()->cart->get_cart() as $cart_item) {
                if (isset($cart_item['product_id'])) {
                    $product_id = $cart_item['product_id'];
                    break;
                }
            }
        }
        
        // Default pickup time is 11:00
        $pickup_override = 11;
        
        // Only try to get ACF field if the function exists and we have a product ID
        if (function_exists('get_field') && $product_id > 0) {
            error_log('Getting pickup_overide for product ID: ' . $product_id);
            $custom_override = get_field('pickup_overide', $product_id);
            
            if (!empty($custom_override)) {
                $pickup_override = (int)$custom_override;
                error_log('Found custom pickup override: ' . $pickup_override);
            }
        }
        
        // Add to calendar script localization
        wp_localize_script('mitnafun-main', 'MitnafunCalendar', array(
            'pickupOverride' => $pickup_override,
            'defaultPickupTime' => sprintf('%02d:00', $pickup_override),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'businessHours' => array(
                'weekdays' => get_option('mitnafun_business_hours_weekdays'),
                'friday'   => get_option('mitnafun_business_hours_friday'),
            ),
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_rental_datepicker_assets');

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

/**
 * WooCommerce Cart Modification - correct calculation for rental dates
 */
function mitnafun_modify_cart_item_price($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }

    if (isset(WC()->cart) && !WC()->cart->is_empty()) {
        foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
            if (isset($cart_item['rental_dates']) && !empty($cart_item['rental_dates'])) {
                // Get the product
                $product = $cart_item['data'];
                
                // Get the base price of the product
                $base_price = $product->get_price();
                
                // Calculate the total based on rental dates
                $total_price = calculate_rental_price($base_price, $cart_item['rental_dates']);
                
                // Set the new price
                $product->set_price($total_price);
                
                // Recalculate totals
                WC()->cart->calculate_totals();
            }
        }
    }
}
add_action('woocommerce_before_calculate_totals', 'mitnafun_modify_cart_item_price', 10, 1);

/**
 * Calculate rental price based on date range
 */
function calculate_rental_price($base_price, $date_range) {
    // Default calculation
    $total_price = $base_price;
    
    // Parse date range (format: DD.MM.YYYY - DD.MM.YYYY)
    $dates = explode(' - ', $date_range);
    
    if (count($dates) == 2) {
        // Convert to DateTime objects
        $start_date = DateTime::createFromFormat('d.m.Y', $dates[0]);
        $end_date = DateTime::createFromFormat('d.m.Y', $dates[1]);
        
        if ($start_date && $end_date) {
            // Calculate interval
            $interval = $start_date->diff($end_date);
            
            // Number of days
            $days = $interval->days + 1; // Including both start and end days
            
            // Special case for weekend (Friday-Saturday counts as one day)
            $weekend_adjustment = 0;
            $current_date = clone $start_date;
            
            while ($current_date <= $end_date) {
                // Check if the current day is Friday (5)
                if ($current_date->format('N') == 5) {
                    // Check if the next day is Saturday and is included in the range
                    $next_day = clone $current_date;
                    $next_day->modify('+1 day');
                    
                    if ($next_day <= $end_date && $next_day->format('N') == 6) {
                        $weekend_adjustment++;
                    }
                }
                
                $current_date->modify('+1 day');
            }
            
            // Adjust days (subtract weekend adjustment)
            $adjusted_days = $days - $weekend_adjustment;
            
            // Calculate total price
            $total_price = $base_price * $adjusted_days;
        }
    }
    
    return $total_price;
}

/**
 * Force enable buttons function - DISABLED
 * This has been disabled as it was overriding the proper datepicker validation
 */
function mitnafun_force_enable_buttons() {
    // Function disabled - buttons are now properly enabled/disabled by the datepicker
    return;
}
// Hook removed to prevent function from running
// add_action('wp_footer', 'mitnafun_force_enable_buttons');

/**
 * Modify the cart subtotal calculation
 */
function mf_modify_cart_subtotal($subtotal, $compound, $cart) {
    $new_subtotal = 0;
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['line_total'])) {
            $new_subtotal += $cart_item['line_total'];
        }
    }
    return $new_subtotal;
}
add_filter('woocommerce_cart_get_subtotal', 'mf_modify_cart_subtotal', 10, 3);

/**
 * Fix the total price display in cart
 */
function mitnafun_cart_total_price_override($cart) {
    // Get the sum of all line items
    $new_total = 0;
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['line_total'])) {
            $new_total += $cart_item['line_total'];
        }
    }
    
    // Set the new total
    $cart->set_total($new_total);
    
    return $cart;
}
add_action('woocommerce_cart_calculate_fees', 'mitnafun_cart_total_price_override', 99);

/**
 * Debug helper function
 */
function mitnafun_debug_log($message) {
    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        if (is_array($message) || is_object($message)) {
            error_log(print_r($message, true));
        } else {
            error_log($message);
        }
    }
}

// Add custom post types, taxonomies, and other functionality below
// ...

?>
