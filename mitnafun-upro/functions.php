<?php
// Suppress PHP notices and deprecation warnings in debug.log
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', 'Off');

include 'inc/checkout.php';
include 'inc/ajax-actions.php';
include 'inc/kama_pagenavi.php';
include 'inc/bookings.php';
include 'inc/admin-orders.php'; // Admin order display functions
include 'inc/rental-pricing.php'; // Multi-day rental pricing system
include 'inc/price-fix.php'; // Emergency fix for zero prices
include 'inc/bottleneck-validator.php'; // Pickup time validation for bottleneck orders
include 'inc/price-override.php'; // Direct price display override for checkout
include 'inc/force-price-fix.php'; // Force correct price display on checkout
include 'inc/checkout-price-override.php'; // Final direct price override on checkout
include 'inc/emergency-price-fix.php'; // Emergency direct DOM fix for checkout prices

// show_admin_bar( false );

add_action('wp_enqueue_scripts', 'load_style_script');
function load_style_script(){
    wp_enqueue_style('my-normalize', get_stylesheet_directory_uri() . '/css/normalize.css');
    wp_enqueue_style('my-Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    wp_enqueue_style('my-Lunasima', 'https://fonts.googleapis.com/css2?family=Lunasima:wght@400;700&display=swap');
    wp_enqueue_style('my-fancybox', 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css', array(), '3.5.7');
    
    // Enqueue price calculator script for WooCommerce product pages
    if (function_exists('is_product') && is_product()) {
        wp_enqueue_script('mitnafun-price-calculator', get_stylesheet_directory_uri() . '/js/price-calculator.js', array('jquery'), '1.0.0', true);
    }
    wp_enqueue_style('my-nice-select', get_stylesheet_directory_uri() . '/css/nice-select.css');
    wp_enqueue_style('my-swiper', 'https://unpkg.com/swiper/swiper-bundle.min.css', array(), '8.0.0');
    wp_enqueue_style('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
    wp_enqueue_style('my-styles', get_stylesheet_directory_uri() . '/css/styles.css', array(), time());
    wp_enqueue_style('my-responsive', get_stylesheet_directory_uri() . '/css/responsive.css', array(), time());
    wp_enqueue_style('my-style-main', get_stylesheet_directory_uri() . '/style.css', array(), time());

    wp_enqueue_script('jquery');
    wp_enqueue_script('my-swiper', get_stylesheet_directory_uri() . '/js/swiper.js', array(), false, true);
    wp_enqueue_script('cuttr', 'https://cdn.jsdelivr.net/npm/cuttr@0.3.0/jquery.cuttr.min.js', array('jquery'), '0.3.0', true);
    wp_enqueue_script('jquery.mask', 'https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js', array('jquery'), '1.14.16', true);
    wp_enqueue_script('my-fancybox', 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js', array('jquery'), '3.5.7', true);
    wp_enqueue_script('my-nice-select', 'https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/js/jquery.nice-select.min.js', array('jquery'), '1.1.0', true);
    wp_enqueue_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), null, true);
    wp_enqueue_script('my-script', get_stylesheet_directory_uri() . '/js/script.js', array(), time(), true);
    wp_enqueue_script('my-actions', get_stylesheet_directory_uri() . '/js/actions.js', array(), time(), true);
}

// Enqueue scripts and styles for the rental datepicker
function enqueue_rental_datepicker_assets() {
    if (is_product() || is_checkout()) {
        // Load WooCommerce specific assets
        // Removed obsolete cart.css enqueue to avoid 404
        
        // Load jQuery UI for datepicker
        wp_enqueue_script('jquery-ui-core');
        
        // Get the current product ID - critical for proper pickup time override
        $product_id = 0;
        
        // On product page, get the current product ID
        if (is_product()) {
            $product_id = get_the_ID();
        }
        // On checkout page, get product ID from cart
        else if (is_checkout() && function_exists('WC')) {
            // Get the cart
            $cart = WC()->cart;
            if ($cart && !$cart->is_empty()) {
                foreach ($cart->get_cart() as $cart_item) {
                    if (isset($cart_item['product_id'])) {
                        // Use the first product in cart
                        $product_id = $cart_item['product_id'];
                        break;
                    }
                }
            }
        }
        
        // Default pickup time is 11:00
        $pickup_override = 11;
        
        // Only try to get ACF field if the function exists and we have a product ID
        if (function_exists('get_field') && $product_id > 0) {
            error_log('Getting pickup_overide for product ID: ' . $product_id);
            $custom_override = get_field('pickup_overide', $product_id);
            error_log('Retrieved pickup_overide value: ' . $custom_override);
            
            if (!empty($custom_override)) {
                $pickup_override = intval($custom_override);
            }
        }
        
        // Debug the pickup override value
        error_log('Final pickup override value for product ' . $product_id . ': ' . $pickup_override);
        
        // Check if previous day was booked
        $previous_day_booked = false;
        
        // Copy Air Datepicker files if they don't exist
        $theme_dir = get_stylesheet_directory();
        $datepicker_css_path = $theme_dir . '/air-datepicker/air-datepicker.css';
        $datepicker_js_path = $theme_dir . '/air-datepicker/air-datepicker.js';
        
        // Create directory if it doesn't exist
        if (!file_exists($theme_dir . '/air-datepicker')) {
            mkdir($theme_dir . '/air-datepicker', 0755, true);
        }
        
        // Create fallback CSS if it doesn't exist
        if (!file_exists($datepicker_css_path)) {
            $fallback_css = "/* Fallback Air Datepicker CSS */
.datepicker {
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 4px;
    font-size: 14px;
    padding: 10px;
    z-index: 1000;
}
.datepicker--cell.-current- {
    color: #1a4a6b !important;
}
.datepicker--cell.-selected- {
    background: #4eb5e6;
    color: #fff;
    font-weight: bold !important;
    position: relative;
}
.datepicker--cell.-disabled- {
    color: #ccc;
    cursor: default;
}
";
            file_put_contents($datepicker_css_path, $fallback_css);
        }
        
        // Create fallback JS if it doesn't exist
        if (!file_exists($datepicker_js_path)) {
            $fallback_js = "/* Fallback Air Datepicker JS */
// This is just a placeholder to prevent 404 errors
// The actual functionality is handled by fallback-calendar.js
console.log('Using fallback calendar system instead of Air Datepicker');";
            file_put_contents($datepicker_js_path, $fallback_js);
        }
        
        // Enqueue our scripts in the correct order
        
        // Air Datepicker assets (now as fallbacks)
        wp_enqueue_style('air-datepicker', get_stylesheet_directory_uri() . '/air-datepicker/air-datepicker.css');
        wp_enqueue_script('air-datepicker', get_stylesheet_directory_uri() . '/air-datepicker/air-datepicker.js', array('jquery'), null, true);
        
        // Last-minute booking check script
        wp_enqueue_script(
            'last-minute-booking-check',
            get_stylesheet_directory_uri() . '/js/last-minute-booking-check.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/last-minute-booking-check.js'),
            true
        );
        
        // Load our fallback calendar
        wp_enqueue_script(
            'fallback-calendar', 
            get_stylesheet_directory_uri() . '/js/fallback-calendar.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/fallback-calendar.js'),
            true
        );
        
        // Initialize calendar
        wp_enqueue_script(
            'calendar-initializer', 
            get_stylesheet_directory_uri() . '/js/calendar-initializer.js',
            array('jquery', 'fallback-calendar'),
            filemtime(get_stylesheet_directory() . '/js/calendar-initializer.js'),
            true
        );
        
        // Calendar test script (for debugging)
        wp_enqueue_script(
            'calendar-test',
            get_stylesheet_directory_uri() . '/js/calendar-test.js',
            array('jquery', 'calendar-initializer'),
            filemtime(get_stylesheet_directory() . '/js/calendar-test.js'),
            true
        );
        
        // Pickup time handler
        wp_enqueue_script(
            'pickup-time-handler', 
            get_stylesheet_directory_uri() . '/js/pickup-time-handler.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/pickup-time-handler.js'),
            true
        );
        // Pass pickup override and business hours data to JS
        wp_localize_script('pickup-time-handler', 'mitnafun_booking_data', array(
            'pickup_override' => $pickup_override,
            'business_hours'  => array(
                'weekdays' => get_option('mitnafun_business_hours_weekdays'),
                'friday'   => get_option('mitnafun_business_hours_friday'),
            ),
        ));
        
        // Early return handler
        $early_return_handler_file = get_stylesheet_directory_uri() . '/js/early-return-handler.js';
        if (file_exists(get_stylesheet_directory() . '/js/early-return-handler.js')) {
            wp_enqueue_script('early-return-handler', $early_return_handler_file, array('jquery', 'rental-dates-handler', 'fallback-calendar'), '1.0.0', true);
        }
        
        // Register return date handler script
        $return_date_handler_file = get_stylesheet_directory_uri() . '/js/return-date-handler.js';
        if (file_exists(get_stylesheet_directory() . '/js/return-date-handler.js')) {
            wp_enqueue_script('return-date-handler', $return_date_handler_file, array('jquery', 'rental-dates-handler', 'fallback-calendar'), '1.0.0', true);
        }
        
        wp_enqueue_style('air-datepicker-css', get_stylesheet_directory_uri() . '/css/air-datepicker.css');
        
        // Add custom styles for overrides
        wp_add_inline_style('air-datepicker-css', '
            /* Basic datepicker styling */
            .air-datepicker-body--day-name {
                color: #1a4a6b !important;
            }
            
            /* Reserved dates styling */
            .air-datepicker-cell.-disabled- {
                color: #ff6666 !important;
                text-decoration: line-through;
            }
            
            /* Specific styling for reserved dates */
            .air-datepicker-cell.reserved-date {
                background-color: #ffeeee !important;
                color: #ff6666 !important;
                text-decoration: line-through;
                position: relative;
            }
            
            /* Add a diagonal line through reserved dates */
            .air-datepicker-cell.reserved-date::after {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                height: 1px;
                background-color: #ff6666;
                transform: rotate(45deg);
            }
            
            /* Styling for Shabbat (Saturday) dates */
            .air-datepicker-cell.shabbat-date {
                background-color: #f0f0f0 !important;
                color: #999 !important;
                position: relative;
            }
            
            /* Styling for Sunday dates - make them visually appealing and clearly available */
            .air-datepicker-cell.sunday-date {
                background-color: #f9fff9 !important;
                color: #333 !important;
                border: 1px solid #ddf0dd !important;
            }
            
            /* Enhanced styling for date range selection, like booking/flight sites */
            .air-datepicker-cell.-selected- {
                background: #2196F3 !important;
                color: white !important;
                font-weight: bold !important;
                position: relative;
            }
            
            /* Start date styling - REVERSED border radius */
            .air-datepicker-cell.-range-from- {
                border-radius: 0 50% 50% 0 !important;
            }
            
            /* End date styling - REVERSED border radius */
            .air-datepicker-cell.-range-to- {
                border-radius: 50% 0 0 50% !important;
            }
            
            /* Removed labels for start and end dates */
            
            /* Dates in the range (between start and end) - STRENGTHENED color */
            .air-datepicker-cell.-in-range- {
                background: #BBDEFB !important; /* Stronger blue background */
                color: #000 !important; /* Darker text for better contrast */
                font-weight: 500 !important; /* Slightly bolder text */
            }
            
            /* Style the datepicker container */
            .rental-datepicker {
                margin-bottom: 20px;
                border: 1px solid #eee;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            /* Style the helper text */
            .datepicker-help {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
                margin-bottom: 15px;
            }
            
            /* Style the refresh button */
            .refresh-rental-dates {
                margin-bottom: 20px !important;
                display: inline-block;
            }
            
            /* Calendar Legend Styling */
            .calendar-legend {
                margin: 15px 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                font-size: 0.9em;
                padding: 10px;
                border: 1px solid #eee;
                border-radius: 5px;
                max-width: 250px;
            }
            
            .calendar-legend-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 1.1em;
                color: #333;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .legend-color {
                width: 15px;
                height: 15px;
                border-radius: 3px;
                display: inline-block;
            }
            
            .legend-color.available {
                background-color: #ffffff;
                border: 1px solid #ddd;
            }
            
            .legend-color.sunday {
                background-color: #f9fff9;
                border: 1px solid #ddf0dd;
            }
            
            .legend-color.reserved {
                background-color: #ffeeee;
                border: 1px solid #ffcccc;
            }
            
            .legend-color.shabbat {
                background-color: #f0f0f0;
                border: 1px solid #ddd;
            }
            
            .legend-button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                text-align: center;
                padding: 10px 20px;
                margin-top: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .legend-button:hover {
                background-color: #45a049;
            }
            
            /* Style the validation message */
            .validation-message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
                display: none;
            }
            
            .validation-message.success {
                background-color: #e7f7e7;
                color: #2e7d32;
                border: 1px solid #2e7d32;
            }
            
            .validation-message.error {
                background-color: #ffebee;
                color: #c62828;
                border: 1px solid #c62828;
            }
            
            .validation-message.info {
                background-color: #e3f2fd;
                color: #0d47a1;
                border: 1px solid #0d47a1;
            }
            
            /* Update the max days message */
            .max-days-message {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
                margin-bottom: 15px;
            }
        ');
        
        global $post;
        
        // Prepare product rental date data
        $product_id = $post->ID;
        
        // Get reserved dates for this product
        $reserved_dates = get_product_reserved_dates($product_id);
        
        // Build reservedRanges for highlighting start/end
        $reserved_ranges = array();
        foreach ($reserved_dates as $range) {
            $parts = explode(' - ', $range);
            if (count($parts) === 2) {
                $reserved_ranges[] = array('start' => $parts[0], 'end' => $parts[1]);
            }
        }
        
        // Localize script with basic data
        wp_localize_script('rental-dates-handler', 'mitnafunFrontend', array(
            'productId'      => $product_id,
            'bookedDates'    => $reserved_dates,
            'reservedRanges' => $reserved_ranges,
            'ajaxUrl'        => admin_url('admin-ajax.php'),
            'nonce'          => wp_create_nonce('mitnafun_frontend_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_rental_datepicker_assets');

add_action('after_setup_theme', function(){
    register_nav_menus( array(
        'header' => 'Header menu',
        'footer' => 'Footer menu'
    ) );
});


add_theme_support( 'title-tag' );
add_theme_support('html5');
add_theme_support( 'post-thumbnails' );
add_theme_support( 'woocommerce' );


if( function_exists('acf_add_options_page') ) {

    acf_add_options_page(array(
        'page_title' 	=> 'Main settings',
        'menu_title'	=> 'Theme options',
        'menu_slug' 	=> 'theme-general-settings',
        'capability'	=> 'edit_posts',
        'redirect'		=> false
    ));
}


add_filter('wpcf7_autop_or_not', '__return_false');


add_filter('tiny_mce_before_init', 'override_mce_options');
function override_mce_options($initArray) {
    $opts = '*[*]';
    $initArray['valid_elements'] = $opts;
    $initArray['extended_valid_elements'] = $opts;
    return $initArray;
}


add_action('acf/input/admin_head', 'my_acf_admin_head');
function my_acf_admin_head() {
    $siteURL = get_bloginfo('stylesheet_directory').'/img/acf/';
    ?>
    <style>
        .imagePreview { position:absolute; right:100%; bottom:0; z-index:999999; border:1px solid #f2f2f2; box-shadow:0 0 3px #b6b6b6; background-color:#fff; padding:20px;}
        .imagePreview img { width:500px; height:auto; display:block; }
        .acf-tooltip li:hover { background-color:#0074a9; }
    </style>

    <script type="text/javascript">
        jQuery(document).ready(function($) {
            var waitForEl = function(selector, callback) {
                if (jQuery(selector).length) {
                    callback();
                } else {
                    setTimeout(function() {
                        waitForEl(selector, callback);
                    }, 100);
                }
            };
            $(document).on('click', 'a[data-name=add-layout]', function() {
                waitForEl('.acf-tooltip li', function() {
                    $('.acf-tooltip li a').hover(function() {
                        var imageTP = $(this).attr('data-layout');
                        var imageFormt = '.png';
                        $(this).append('<div class="imagePreview"><img src="<?php echo $siteURL; ?>'+ imageTP + imageFormt+'"></div>');
                    }, function() {
                        $('.imagePreview').remove();
                    });
                })
            })
        })
    </script>
    <?php
}


function my_output_images( $prepend_url, $separator = ',', $image_urls ) {
    // Turn the image URLs into an array.
    $image_urls = explode( $separator, $image_urls );

    // Remove empty entries.
    $image_urls = array_filter( $image_urls );

    // Prepend the URL to every image.
    foreach ( $image_urls as $key => $url ) {
        $image_urls[ $key ] = $prepend_url . trim( $url );
    }

    // Return a string of image URLs with the proper separator.
    return implode( $separator, $image_urls );
}

add_filter('get_the_archive_title_prefix','__return_false');


remove_filter('the_excerpt', 'wpautop');


function get_rental_dates_for_product($product_id) {
    global $wpdb;
    
    // Enable debug logging
    $debug = true;
    if ($debug) {
        error_log("=== get_rental_dates_for_product START ===");
        error_log("Product ID: " . $product_id);
    }
    
    // Initialize the dates array
    $rental_dates = [];
    
    try {
        // Get the order item IDs for this product
        $order_item_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT order_item_id 
             FROM {$wpdb->prefix}woocommerce_order_items 
             WHERE order_item_type = 'line_item' 
             AND order_id IN (
                 SELECT DISTINCT order_id 
                 FROM {$wpdb->prefix}woocommerce_order_items 
                 WHERE order_item_id IN (
                     SELECT order_item_id 
                     FROM {$wpdb->prefix}woocommerce_order_itemmeta 
                     WHERE meta_key = '_product_id' 
                     AND meta_value = %d
                 )
             )",
            $product_id
        ));
        
        if ($debug) {
            error_log("Found " . count($order_item_ids) . " order items for product");
        }
        
        // Get rental dates for each order item
        foreach ($order_item_ids as $item_id) {
            $dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
            
            // Also check for variations in the meta key name
            if (empty($dates)) {
                $dates = wc_get_order_item_meta($item_id, 'rental_dates', true);
            }
            
            if (!empty($dates)) {
                if ($debug) {
                    error_log("Found rental dates for item {$item_id}: " . print_r($dates, true));
                }
                $rental_dates[] = $dates;
            }
        }
        
        // Log all found dates
        if ($debug) {
            error_log("Total rental dates found: " . count($rental_dates));
            if (!empty($rental_dates)) {
                error_log("Rental dates: " . print_r($rental_dates, true));
            }
        }
        
    } catch (Exception $e) {
        error_log("Error in get_rental_dates_for_product: " . $e->getMessage());
    }
    
    if ($debug) {
        error_log("=== get_rental_dates_for_product END ===");
    }
    
    return $rental_dates;
}

function get_product_reserved_dates($product_id) {
    // Use plugin's retrieval if available
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("Plugin wrapper: fetching rental dates for product ID: $product_id");
    }
    if (function_exists('get_rental_dates_for_product')) {
        $all_dates = get_rental_dates_for_product($product_id);
    } else {
        $all_dates = [];
    }
    // Filter out past bookings
    $dates = [];
    $today = new DateTime('today');
    foreach ($all_dates as $range) {
        $parts = explode(' - ', $range);
        if (count($parts) === 2) {
            $end_date = DateTime::createFromFormat('d.m.Y', $parts[1]);
            if ($end_date && $end_date >= $today) {
                $dates[] = $range;
            }
        }
    }
    return $dates;
}

function mitnafun_calendar_init() {
    if (is_product()) {
        // Enqueue necessary scripts and styles
        $air_datepicker_file = get_stylesheet_directory_uri() . '/js/air-datepicker.js';
        $rental_dates_handler_file = get_stylesheet_directory_uri() . '/js/rental-dates-handler.js';
        $fallback_calendar_file = get_stylesheet_directory_uri() . '/js/fallback-calendar.js';
        $return_date_handler_file = get_stylesheet_directory_uri() . '/js/return-date-handler.js';
        
        if (file_exists(get_stylesheet_directory() . '/js/air-datepicker.js')) {
            wp_enqueue_script('air-datepicker', $air_datepicker_file, array('jquery'), '1.0.0', true);
        }
        
        if (file_exists(get_stylesheet_directory() . '/js/rental-dates-handler.js')) {
            wp_enqueue_script('rental-dates-handler', $rental_dates_handler_file, array('jquery', 'air-datepicker'), '1.0.0', true);
        }
        
        // Register fallback calendar script (only loads when needed)
        if (file_exists(get_stylesheet_directory() . '/js/fallback-calendar.js')) {
            wp_register_script('fallback-calendar', $fallback_calendar_file, array('jquery'), '1.0.0', true);
        }
        
        // Register return date handler script
        if (file_exists(get_stylesheet_directory() . '/js/return-date-handler.js')) {
            wp_enqueue_script('return-date-handler', $return_date_handler_file, array('jquery', 'rental-dates-handler', 'fallback-calendar'), '1.0.0', true);
        }
        
        // Register early return handler script
        $early_return_handler_file = get_stylesheet_directory_uri() . '/js/early-return-handler.js';
        if (file_exists(get_stylesheet_directory() . '/js/early-return-handler.js')) {
            wp_enqueue_script('early-return-handler', $early_return_handler_file, array('jquery', 'rental-dates-handler', 'fallback-calendar'), '1.0.0', true);
        }
        
        wp_enqueue_style('air-datepicker-css', get_stylesheet_directory_uri() . '/css/air-datepicker.css');
        
        // Add custom styles for overrides
        wp_add_inline_style('air-datepicker-css', '
            /* Basic datepicker styling */
            .air-datepicker-body--day-name {
                color: #1a4a6b !important;
            }
            
            /* Reserved dates styling */
            .air-datepicker-cell.-disabled- {
                color: #ff6666 !important;
                text-decoration: line-through;
            }
            
            /* Specific styling for reserved dates */
            .air-datepicker-cell.reserved-date {
                background-color: #ffeeee !important;
                color: #ff6666 !important;
                text-decoration: line-through;
                position: relative;
            }
            
            /* Add a diagonal line through reserved dates */
            .air-datepicker-cell.reserved-date::after {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                height: 1px;
                background-color: #ff6666;
                transform: rotate(45deg);
            }
            
            /* Styling for Shabbat (Saturday) dates */
            .air-datepicker-cell.shabbat-date {
                background-color: #f0f0f0 !important;
                color: #999 !important;
                position: relative;
            }
            
            /* Styling for Sunday dates - make them visually appealing and clearly available */
            .air-datepicker-cell.sunday-date {
                background-color: #f9fff9 !important;
                color: #333 !important;
                border: 1px solid #ddf0dd !important;
            }
            
            /* Enhanced styling for date range selection, like booking/flight sites */
            .air-datepicker-cell.-selected- {
                background: #2196F3 !important;
                color: white !important;
                font-weight: bold !important;
                position: relative;
            }
            
            /* Start date styling - REVERSED border radius */
            .air-datepicker-cell.-range-from- {
                border-radius: 0 50% 50% 0 !important;
            }
            
            /* End date styling - REVERSED border radius */
            .air-datepicker-cell.-range-to- {
                border-radius: 50% 0 0 50% !important;
            }
            
            /* Removed labels for start and end dates */
            
            /* Dates in the range (between start and end) - STRENGTHENED color */
            .air-datepicker-cell.-in-range- {
                background: #BBDEFB !important; /* Stronger blue background */
                color: #000 !important; /* Darker text for better contrast */
                font-weight: 500 !important; /* Slightly bolder text */
            }
            
            /* Style the datepicker container */
            .rental-datepicker {
                margin-bottom: 20px;
                border: 1px solid #eee;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            /* Style the helper text */
            .datepicker-help {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
                margin-bottom: 15px;
            }
            
            /* Style the refresh button */
            .refresh-rental-dates {
                margin-bottom: 20px !important;
                display: inline-block;
            }
            
            /* Calendar Legend Styling */
            .calendar-legend {
                margin: 15px 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                font-size: 0.9em;
                padding: 10px;
                border: 1px solid #eee;
                border-radius: 5px;
                max-width: 250px;
            }
            
            .calendar-legend-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 1.1em;
                color: #333;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .legend-color {
                width: 15px;
                height: 15px;
                border-radius: 3px;
                display: inline-block;
            }
            
            .legend-color.available {
                background-color: #ffffff;
                border: 1px solid #ddd;
            }
            
            .legend-color.sunday {
                background-color: #f9fff9;
                border: 1px solid #ddf0dd;
            }
            
            .legend-color.reserved {
                background-color: #ffeeee;
                border: 1px solid #ffcccc;
            }
            
            .legend-color.shabbat {
                background-color: #f0f0f0;
                border: 1px solid #ddd;
            }
            
            .legend-button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                text-align: center;
                padding: 10px 20px;
                margin-top: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .legend-button:hover {
                background-color: #45a049;
            }
            
            /* Style the validation message */
            .validation-message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
                display: none;
            }
            
            .validation-message.success {
                background-color: #e7f7e7;
                color: #2e7d32;
                border: 1px solid #2e7d32;
            }
            
            .validation-message.error {
                background-color: #ffebee;
                color: #c62828;
                border: 1px solid #c62828;
            }
            
            .validation-message.info {
                background-color: #e3f2fd;
                color: #0d47a1;
                border: 1px solid #0d47a1;
            }
            
            /* Update the max days message */
            .max-days-message {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
                margin-bottom: 15px;
            }
        ');
        
        global $post;
        
        // Prepare product rental date data
        $product_id = $post->ID;
        
        // Get reserved dates for this product
        $reserved_dates = get_product_reserved_dates($product_id);
        
        // Build reservedRanges for highlighting start/end
        $reserved_ranges = array();
        foreach ($reserved_dates as $range) {
            $parts = explode(' - ', $range);
            if (count($parts) === 2) {
                $reserved_ranges[] = array('start' => $parts[0], 'end' => $parts[1]);
            }
        }
        
        // Localize script with basic data
        wp_localize_script('rental-dates-handler', 'mitnafunFrontend', array(
            'productId'      => $product_id,
            'bookedDates'    => $reserved_dates,
            'reservedRanges' => $reserved_ranges,
            'ajaxUrl'        => admin_url('admin-ajax.php'),
            'nonce'          => wp_create_nonce('mitnafun_frontend_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_calendar_init');

// Debug AJAX handler
function debug_rental_dates_ajax_handler() {
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $response = array(
        'product_id' => $product_id,
        'success' => false,
        'message' => '',
        'rental_dates' => array()
    );
    
    if ($product_id > 0) {
        // Get rental dates
        $rental_dates = get_rental_dates_for_product($product_id);
        
        // Check database directly
        global $wpdb;
        $query = $wpdb->prepare(
            "SELECT 
                oim.meta_value as rental_dates,
                o.post_status as order_status
            FROM {$wpdb->prefix}woocommerce_order_items oi 
            LEFT JOIN {$wpdb->prefix}posts o ON oi.order_id = o.ID
                AND o.post_type = %s
                AND o.post_status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash', 'trash', 'auto-draft')
            LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim2 ON oi.order_item_id = oim2.order_item_id
                AND oim2.meta_key = %s AND oim2.meta_value = %d
            LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
                AND oim.meta_key = %s
            ORDER BY o.post_date DESC
        ", 'shop_order', '_product_id', $product_id, 'Rental Dates');
        
        $results = $wpdb->get_results($query);
        
        if ($wpdb->last_error) {
            error_log('SQL Error in debug_rental_dates_ajax_handler: ' . $wpdb->last_error);
            return array();
        }
        
        $response['success'] = true;
        $response['message'] = 'Data retrieved successfully';
        $response['rental_dates'] = $rental_dates;
        $response['db_results'] = $results;
        $response['db_query'] = $query;
        
        // Check gjc_ prefix tables if they exist
        $gjc_prefix_query = "SHOW TABLES LIKE 'gjc_%'";
        $gjc_tables = $wpdb->get_col($gjc_prefix_query);
        $response['gjc_tables'] = !empty($gjc_tables) ? $gjc_tables : array();
        
        if (!empty($gjc_tables)) {
            // Try query with gjc_ prefix
            $gjc_rental_dates_query = "
                SELECT 
                    oi.order_item_id,
                    oi.order_item_name,
                    oim.meta_value as rental_dates
                FROM gjc_woocommerce_order_items oi
                JOIN gjc_woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
                WHERE oim.meta_key = 'Rental Dates'
                AND oi.order_item_name = (SELECT post_title FROM {$wpdb->prefix}posts WHERE ID = %d)
                LIMIT 5
            ";
            
            $gjc_results = $wpdb->get_results($wpdb->prepare($gjc_rental_dates_query, $product_id));
            $response['gjc_rental_dates'] = $gjc_results;
        }
    } else {
        $response['message'] = 'Invalid product ID';
    }
    
    wp_send_json($response);
    die();
}
add_action('wp_ajax_debug_rental_dates', 'debug_rental_dates_ajax_handler');
add_action('wp_ajax_nopriv_debug_rental_dates', 'debug_rental_dates_ajax_handler');

// AJAX handler for getting product reserved dates
function get_reserved_dates_ajax_handler() {
    // Always enable debug for now to see what's happening
    $debug = true;
    error_log("=== get_reserved_dates_ajax_handler START ===");
    error_log("POST data: " . print_r($_POST, true));
    error_log("Server time: " . date('Y-m-d H:i:s'));
    
    // Log the backtrace to see where this was called from
    $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);
    error_log("Backtrace: " . print_r($backtrace, true));
    
    // Check for product ID
    if (!isset($_POST['product_id']) || empty($_POST['product_id'])) {
        if ($debug) {
            error_log("No product_id provided");
        }
        wp_send_json_error(array('message' => 'Product ID is required'));
        wp_die();
    }
    
    $product_id = intval($_POST['product_id']);
    if ($debug) {
        error_log("Getting reserved dates for product ID: " . $product_id);
    }
    
    // Get the product with error handling
    $product = wc_get_product($product_id);
    
    if (!$product) {
        error_log("❌ Error: Could not load product with ID: " . $product_id);
        wp_send_json_error(array('message' => 'Product not found', 'product_id' => $product_id));
        wp_die();
    }
    
    // Log product type and status
    error_log("Product loaded - ID: " . $product_id . ", Type: " . $product->get_type() . ", Status: " . $product->get_status());
    
    // Get stock quantity but don't use it to hide reserved dates - only for client-side info
    $stock_qty = $product->get_stock_quantity();
    error_log("Stock quantity: " . ($stock_qty === null ? 'null' : $stock_qty));
    
    // Get initial stock value (if set)
    $initial_stock = $product ? get_post_meta($product_id, '_initial_stock', true) : 0;
    
    // If initial stock is not set, use current stock as initial
    if (empty($initial_stock) && $stock_qty > 0) {
        $initial_stock = $stock_qty;
    }
    
    if ($debug) {
        error_log("Product stock: " . $stock_qty);
        error_log("Initial stock: " . $initial_stock);
    }
    
    // Get all reserved dates
    $all_reserved_dates = get_product_reserved_dates($product_id);
    
    // Set threshold for future reservations (default: 30 days)
    $threshold_days = 30;
    
    // Filter reserved dates to only include those within the threshold
    $reserved_dates = filter_future_reserved_dates($all_reserved_dates, $threshold_days);
    
    // Get buffer dates (days adjacent to reservations) - note: we'll still identify buffer dates
    // even for dates beyond the threshold
    $buffer_dates = find_buffer_dates($all_reserved_dates);
    
    if ($debug) {
        error_log("Date threshold: " . $threshold_days . " days");
        error_log("All reserved dates count: " . count($all_reserved_dates));
        error_log("Filtered reserved dates count: " . count($reserved_dates));
        error_log("Buffer dates count: " . count($buffer_dates));
    }
    
    // Prepare response data
    $response_data = array(
        'reserved_dates' => $reserved_dates,
        'buffer_dates' => $buffer_dates,
        'stock_qty' => $stock_qty,
        'initial_stock' => $initial_stock,
        'available_stock' => max(0, $initial_stock - count($reserved_dates)),
        'showing_reserved' => ($initial_stock <= 2), // Only show reserved dates if initial stock is 2 or less
        'debug' => array(
            'product_id' => $product_id,
            'product_type' => $product->get_type(),
            'product_status' => $product->get_status(),
            'stock_managed' => $product->get_manage_stock(),
            'backorders' => $product->get_backorders(),
            'timestamp' => date('Y-m-d H:i:s')
        )
    );
    
    // Log the response before sending
    error_log("Sending JSON response:" . print_r($response_data, true));
    
    // Send all data to the client
    wp_send_json_success($response_data);
    
    // Log completion
    error_log("=== get_reserved_dates_ajax_handler COMPLETE ===");
    
    wp_die();
}
add_action('wp_ajax_get_reserved_dates', 'get_reserved_dates_ajax_handler');
add_action('wp_ajax_nopriv_get_reserved_dates', 'get_reserved_dates_ajax_handler');

// Function to enqueue script that will load reserved dates on the product page
function enqueue_reserved_dates_script() {
    if (is_product()) {
        global $post;
        $product_id = $post->ID;
        
        // Get reserved dates for this product
        $reserved_dates = get_product_reserved_dates($product_id);
        
        // Build reservedRanges for highlighting start/end
        $reserved_ranges = array();
        foreach ($reserved_dates as $range) {
            $parts = explode(' - ', $range);
            if (count($parts) === 2) {
                $reserved_ranges[] = array('start' => $parts[0], 'end' => $parts[1]);
            }
        }
        
        // Enqueue the script
        wp_localize_script('rental-dates-handler', 'mitnafunFrontend', array(
            'productId'      => $product_id,
            'bookedDates'    => $reserved_dates,
            'reservedRanges' => $reserved_ranges,
            'ajaxUrl'        => admin_url('admin-ajax.php'),
            'nonce'          => wp_create_nonce('mitnafun_frontend_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_reserved_dates_script', 25); // Run after calendar_init

// Direct handler for add_to_cart button
add_action('woocommerce_after_add_to_cart_button', 'mitnafun_add_redirect_field');
function mitnafun_add_redirect_field() {
    echo '<input type="hidden" name="redirect" value="1" />';
}

// Fix the checkout redirect - uncomment and enhance the functionality
function mitnafun_add_checkout_redirect_script() {
    if (is_product()) {
        ?>
        <script type="text/javascript">
        jQuery(function($) {
            // Direct click handler for the order button
            $('.btn-redirect').on('click', function(e) {
                // Set a flag in localStorage
                localStorage.setItem('mitnafun_redirect_to_checkout', 'yes');
                
                // Also attempt direct redirect if AJAX doesn't work
                setTimeout(function() {
                    if (window.location.href.indexOf('checkout') === -1) {
                        window.location.href = '<?php echo wc_get_checkout_url(); ?>';
                    }
                }, 1500);
            });
            
            // Handle AJAX add to cart completion
            $(document.body).on('added_to_cart', function() {
                // Check if we should redirect
                if (localStorage.getItem('mitnafun_redirect_to_checkout') === 'yes') {
                    localStorage.removeItem('mitnafun_redirect_to_checkout');
                    window.location.href = '<?php echo wc_get_checkout_url(); ?>';
                }
            });
        });
        </script>
        <?php
    }
}
add_action('wp_footer', 'mitnafun_add_checkout_redirect_script');

// Remove duplicate functions
// function mitnafun_add_checkout_redirect_script() { ... }
// add_action('wp_footer', 'mitnafun_add_checkout_redirect_script');

function remove_css_js_version_query( $src ) {
    if ( strpos( $src, '?ver=' ) ) {
        $src = remove_query_arg( 'ver', $src );
    }
    return $src;
}
add_filter( 'style_loader_src', 'remove_css_js_version_query', 10, 1 );
add_filter( 'script_loader_src', 'remove_css_js_version_query', 10, 1 );

/**
 * Enqueue critical fixes and debug scripts
 * These scripts will fix the calendar highlighting and other issues
 */
function mitnafun_enqueue_critical_fixes() {
    if (is_product() || is_checkout()) {
        // Load the critical fixes with high priority
        wp_enqueue_script(
            'critical-fixes',
            get_stylesheet_directory_uri() . '/js/critical-fixes.js',
            array('jquery', 'fallback-calendar'),
            filemtime(get_stylesheet_directory() . '/js/critical-fixes.js'), // Use filemtime instead of time()
            true
        );
        
        // Load duplicate booking fix script
        if (file_exists(get_stylesheet_directory() . '/js/duplicate-booking-fix.js')) {
            wp_enqueue_script(
                'duplicate-booking-fix',
                get_stylesheet_directory_uri() . '/js/duplicate-booking-fix.js',
                array('jquery', 'fallback-calendar', 'critical-fixes'),
                filemtime(get_stylesheet_directory() . '/js/duplicate-booking-fix.js'),
                true
            );
        }
        
        // Load stock-aware validation for duplicate bookings
        if (file_exists(get_stylesheet_directory() . '/js/stock-aware-validation.js')) {
            wp_enqueue_script(
                'stock-aware-validation',
                get_stylesheet_directory_uri() . '/js/stock-aware-validation.js',
                array('jquery', 'fallback-calendar'),
                filemtime(get_stylesheet_directory() . '/js/stock-aware-validation.js'),
                true
            );
        }
        
        // Load debug helper only if needed - uncomment this when debugging
        /*
        wp_enqueue_script(
            'debug-helper',
            get_stylesheet_directory_uri() . '/js/debug-helper.js',
            array('jquery', 'critical-fixes'),
            time(),
            true
        );
        */
        
        // Load the checkout fixes script if we're on the checkout page
        if (is_checkout()) {
            wp_enqueue_script(
                'checkout-fixes',
                get_stylesheet_directory_uri() . '/js/checkout-fixes.js',
                array('jquery'),
                filemtime(get_stylesheet_directory() . '/js/checkout-fixes.js'), // Use filemtime
                true
            );
        }
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_critical_fixes', 999); // Very high priority to load last

// Enqueue stock debug helper
function enqueue_stock_debug_helper() {
    // Only on single product pages
    if (! is_product()) {
        return;
    }
    
    // Emergency fix for early-return to return-date booking - HIGHEST PRIORITY
    wp_enqueue_script(
        'emergency-fix',
        get_stylesheet_directory_uri() . '/js/emergency-fix.js',
        array('jquery', 'fallback-calendar'),
        '1.0.0',
        true
    );
    
    // Enqueue the stock debug helper
    wp_enqueue_script(
        'stock-debug-helper',
        get_stylesheet_directory_uri() . '/js/stock-debug-helper.js',
        array('jquery', 'fallback-calendar'),
        '1.0.2',
        true
    );
    
    // Also enqueue the stock parallel orders handler - RESTORED FUNCTIONALITY
    wp_enqueue_script(
        'stock-parallel-orders',
        get_stylesheet_directory_uri() . '/js/stock-parallel-orders.js',
        array('jquery'),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_stock_debug_helper', 999); // Very high priority to load last

// Add inline script to check if critical fixes are loaded
function mitnafun_debug_script_loading() {
    if (is_product() || is_checkout()) {
        ?>
        <script>
            // More reliable script loading check
            document.addEventListener('DOMContentLoaded', function() {
                console.log(" 🔍 SCRIPT LOADING CHECK:");
                
                // Force load critical fixes if not already loaded
                if (typeof window.mitnafunEmergencyFixes === 'undefined') {
                    console.log(" critical-fixes.js not detected, loading it now");
                    var script = document.createElement('script');
                    script.src = '<?php echo get_stylesheet_directory_uri(); ?>/js/critical-fixes.js';
                    script.async = false;
                    document.body.appendChild(script);
                } else {
                    console.log(" critical-fixes.js loaded: true");
                }
                
                console.log(" Document is ready");
            });
        </script>
        <?php
    }
}
add_action('wp_footer', 'mitnafun_debug_script_loading', 999);

/**
 * Translate 'Rental Dates' to Hebrew and fix the display in the cart and checkout
 */
function mitnafun_translate_checkout_fields() {
    // Translate 'Rental Dates' in the cart
    add_filter('woocommerce_get_item_data', function($item_data, $cart_item) {
        foreach ($item_data as $key => $data) {
            if ($data['key'] === 'Rental Dates') {
                $item_data[$key]['key'] = 'תאריכי השכרה';
            }
        }
        return $item_data;
    }, 10, 2);
    
    // Translate 'Rental Dates' in the order details
    add_filter('woocommerce_display_item_meta', function($html, $item, $args) {
        return str_replace('Rental Dates', 'תאריכי השכרה', $html);
    }, 10, 3);
    
    // Fix the duplicate price display in checkout
    add_filter('woocommerce_cart_item_price', function($price, $cart_item, $cart_item_key) {
        // If this is a rental product, ensure we only show the price once
        if (isset($cart_item['rental_dates'])) {
            return $price;
        }
        return $price;
    }, 20, 3);
}
add_action('init', 'mitnafun_translate_checkout_fields');

/**
 * Override the validation for weekend bookings
 * This allows bookings that include weekend dates
 */
function mitnafun_handle_weekend_bookings() {
    // Add JavaScript to override weekend validation
    ?>
    <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[WEEKEND OVERRIDE] Applying weekend booking fixes');
        
        // Specifically fix errors about Saturdays (Shabbat)
        setInterval(function() {
            // Find and hide any error messages about Shabbat bookings
            const errorMessages = document.querySelectorAll(".validation-message, #date-validation-message");
            errorMessages.forEach(function(msg) {
                if (msg.innerText.includes('לא ניתן להזמין לשבת') || 
                    msg.innerText.includes('מערכת סגורה')) {
                    msg.style.display = 'none';
                }
            });
        }, 500);
        
        // Override the validateDateRange function from fallback-calendar.js
        if (window.originalValidateDateRange === undefined && window.validateDateRange) {
            console.log('[WEEKEND OVERRIDE] Storing original validateDateRange function');
            window.originalValidateDateRange = window.validateDateRange;
        }
        
        // Replace with function that always allows weekends
        window.validateDateRange = function(startDate, endDate) {
            console.log('[WEEKEND OVERRIDE] Using weekend-friendly validation');
            
            if (!startDate || !endDate) {
                return false;
            }
            
            // Normalize dates
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            
            // Only basic validation - no weekend restrictions
            if (startDate > endDate) {
                return false;
            }
            
            // Check maximum rental period
            let days = calculateRentalDays(startDate, endDate);
            if (window.maxRentalDays && days > window.maxRentalDays) {
                return false;
            }
            
            // Always allow weekend bookings
            return true;
        };
        
        console.log('[WEEKEND OVERRIDE] Weekend booking fixes applied');
    });
    </script>
    <?php
}
add_action('wp_footer', 'mitnafun_handle_weekend_bookings', 100);

// Redirect to checkout only when redirect=1 is set by btn-redirect
add_filter('woocommerce_add_to_cart_redirect', 'mitnafun_custom_add_to_cart_redirect');
function mitnafun_custom_add_to_cart_redirect($url) {
    if (!empty($_REQUEST['redirect']) && '1' === $_REQUEST['redirect']) {
        return wc_get_checkout_url();
    }
    return false; // default: stay on product page
}

add_filter('gettext', 'mitnafun_translate_checkout_errors', 10, 3);
add_filter('gettext_woocommerce', 'mitnafun_translate_checkout_errors', 10, 3);
function mitnafun_translate_checkout_errors($translated, $text, $domain) {
    if ($text === 'Need to accept') {
        return 'עליך לאשר';
    }
    if (false !== strpos($text, 'is a required field.')) {
        // Translate any required field notice generically
        return str_replace('is a required field.', 'הוא שדה חובה.', $translated);
    }
    return $translated;
}

/**
 * Change the terms and conditions text in checkout
 */
function mitnafun_update_terms_checkbox() {
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Find the terms checkbox label
        $('label[for="check"]').html('<strong>ידוע לי כי במידה והמתקן יוחזר לא מקופל/קשור כראוי, או שמתנפח יבש הורטב, או שהוחזר מתקן תקול - אחויב בהתאם. הנושא חשוב וקריטי להמשך תקינות המתקנים.</strong>'); 
    });
    </script>
    <?php
}
add_action('woocommerce_review_order_before_submit', 'mitnafun_update_terms_checkbox', 20);

/**
 * Check if a reservation date is beyond the flexibility threshold
 * 
 * @param string $date_str Date string in DD.MM.YYYY format
 * @param int $threshold_days Number of days in the future to consider (default: 30 days)
 * @return bool True if the date is beyond the threshold
 */
function is_date_beyond_threshold($date_str, $threshold_days = 30) {
    // Parse the date (format: DD.MM.YYYY)
    $parts = explode('.', $date_str);
    if (count($parts) !== 3) {
        return false; // Invalid date format
    }
    
    $reservation_date = new DateTime();
    $reservation_date->setDate($parts[2], $parts[1], $parts[0]);
    $reservation_date->setTime(0, 0, 0); // Start of day
    
    // Get current date (start of day)
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    
    // Calculate threshold date
    $threshold_date = clone $today;
    $threshold_date->modify("+{$threshold_days} days");
    
    // Check if reservation date is beyond threshold
    return $reservation_date > $threshold_date;
}

/**
 * Filter reserved dates to only include those within the threshold period
 * 
 * @param array $reserved_dates Array of reserved date ranges
 * @param int $threshold_days Number of days in the future to consider
 * @return array Filtered array of reserved date ranges
 */
function filter_future_reserved_dates($reserved_dates, $threshold_days = 30) {
    if (empty($reserved_dates)) {
        return array();
    }
    
    $filtered_dates = array();
    
    foreach ($reserved_dates as $date_range) {
        $parts = explode(' - ', $date_range);
        if (count($parts) !== 2) {
            continue; // Invalid format
        }
        
        // If start date is beyond threshold, skip this range
        if (is_date_beyond_threshold($parts[0], $threshold_days)) {
            continue;
        }
        
        // Include this date range
        $filtered_dates[] = $date_range;
    }
    
    return $filtered_dates;
}

/**
 * Find dates that have a 1-day buffer with existing reservations
 * 
 * @param array $all_reserved_dates Array of all reserved date ranges
 * @return array Array of dates that have a 1-day buffer
 */
function find_buffer_dates($all_reserved_dates) {
    if (empty($all_reserved_dates)) {
        return array();
    }
    
    $buffer_dates = array();
    $all_booked_days = array(); // Will store all individual booked days
    
    // First, extract all individual booked days
    foreach ($all_reserved_dates as $date_range) {
        $parts = explode(' - ', $date_range);
        if (count($parts) !== 2) {
            continue; // Invalid format
        }
        
        // Convert to DateTime objects
        $start_parts = explode('.', $parts[0]);
        $end_parts = explode('.', $parts[1]);
        
        if (count($start_parts) !== 3 || count($end_parts) !== 3) {
            continue; // Invalid date format
        }
        
        $start_date = new DateTime();
        $start_date->setDate($start_parts[2], $start_parts[1], $start_parts[0]);
        
        $end_date = new DateTime();
        $end_date->setDate($end_parts[2], $end_parts[1], $end_parts[0]);
        
        // Add all dates in the range to the array
        $current_date = clone $start_date;
        while ($current_date <= $end_date) {
            $all_booked_days[] = $current_date->format('d.m.Y');
            $current_date->modify('+1 day');
        }
    }
    
    // Now find dates that are 1 day away from any booked day
    $unique_booked_days = array_unique($all_booked_days);
    
    foreach ($unique_booked_days as $booked_day) {
        $booked_parts = explode('.', $booked_day);
        $booked_date = new DateTime();
        $booked_date->setDate($booked_parts[2], $booked_parts[1], $booked_parts[0]);
        
        // Check day before
        $day_before = clone $booked_date;
        $day_before->modify('-1 day');
        $buffer_dates[] = $day_before->format('d.m.Y');
        
        // Check day after
        $day_after = clone $booked_date;
        $day_after->modify('+1 day');
        $buffer_dates[] = $day_after->format('d.m.Y');
    }
    
    return array_unique($buffer_dates);
}

/**
 * Fix the stock display on product pages to never show less than 1
 */
function mitnafun_fix_stock_display($html, $availability_text, $product) {
    // Check if this is a stock display
    if (strpos($html, 'stock') !== false && strpos($html, 'במלאי') !== false) {
        // Get the stock quantity
        $stock = $product->get_stock_quantity();
        
        // If stock is less than 1, show it as 1
        if ($stock < 1) {
            // Replace the negative number with 1
            $html = str_replace($stock . ' במלאי', '1 במלאי', $html);
        }
    }
    
    return $html;
}
add_filter('woocommerce_stock_html', 'mitnafun_fix_stock_display', 10, 3);

/**
 * AJAX endpoint to get return dates for a product
 */
function mitnafun_get_return_dates_ajax_handler() {
    // Check for product ID
    if (!isset($_POST['product_id']) || empty($_POST['product_id'])) {
        wp_send_json_error(array('message' => 'Product ID is required'));
        wp_die();
    }
    
    $product_id = intval($_POST['product_id']);
    
    // Get all reserved dates
    $all_reserved_dates = get_product_reserved_dates($product_id);
    
    // Extract all return dates and early return dates
    $return_dates = array();
    $early_return_dates = array();
    
    foreach ($all_reserved_dates as $date_range) {
        $parts = explode(' - ', $date_range);
        if (count($parts) !== 2) {
            continue; // Invalid format
        }
        
        // The end date is the return date
        $return_dates[] = $parts[1];
        
        // Calculate early return date (day after end date)
        $end_parts = explode('.', $parts[1]);
        if (count($end_parts) !== 3) {
            continue; // Invalid date format
        }
        
        $end_date = new DateTime();
        $end_date->setDate($end_parts[2], $end_parts[1], $end_parts[0]);
        
        // Add the day after return as an early return date
        $day_after = clone $end_date;
        $day_after->modify('+1 day');
        $early_return_dates[] = $day_after->format('d.m.Y');
    }
    
    wp_send_json_success(array(
        'return_dates' => array_unique($return_dates),
        'early_return_dates' => array_unique($early_return_dates)
    ));
    
    wp_die();
}
add_action('wp_ajax_get_return_dates', 'mitnafun_get_return_dates_ajax_handler');
add_action('wp_ajax_nopriv_get_return_dates', 'mitnafun_get_return_dates_ajax_handler');

/**
 * Enqueue pickup time validator script
 */
/**
 * Enqueue the form submission validator script
 * This ensures proper validation of rental dates before form submission
 */
function mitnafun_enqueue_form_submission_validator() {
    if (is_product()) {
        wp_enqueue_script(
            'mitnafun-form-submission-validator',
            get_stylesheet_directory_uri() . '/js/form-submission-validator.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/form-submission-validator.js'),
            true
        );
        
        // Localize script with necessary data
        wp_localize_script('mitnafun-form-submission-validator', 'mitnafunFormValidator', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'errorMessage' => __('Please select valid rental dates before proceeding.', 'mitnafun-upro'),
        ));
    }    
}

/**
 * Enqueue pickup time validator script
 */
function mitnafun_enqueue_pickup_time_validator() {
    if (is_checkout()) {
        // Enqueue the validator scripts
        wp_enqueue_script(
            'pickup-time-validator',
            get_stylesheet_directory_uri() . '/js/pickup-time-validator.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/pickup-time-validator.js'),
            true
        );
        
        // Enqueue the bottleneck order validator
        wp_enqueue_script(
            'bottleneck-order-validator',
            get_stylesheet_directory_uri() . '/js/bottleneck-order-validator.js',
            array('jquery', 'pickup-time-validator'),
            filemtime(get_stylesheet_directory() . '/js/bottleneck-order-validator.js'),
            true
        );
        
        // Get cart items to identify products
        $cart_items = WC()->cart->get_cart();
        $product_ids = array();
        
        foreach ($cart_items as $cart_item) {
            $product_ids[] = $cart_item['product_id'];
        }
        
        // If no products, exit
        if (empty($product_ids)) {
            return;
        }
        
        // Get return dates for all products in cart
        $all_return_dates = array();
        $all_early_return_dates = array();
        
        foreach ($product_ids as $product_id) {
            $reserved_dates = get_product_reserved_dates($product_id);
            
            foreach ($reserved_dates as $date_range) {
                $parts = explode(' - ', $date_range);
                if (count($parts) === 2) {
                    // End date is return date
                    $all_return_dates[] = $parts[1];
                    
                    // Calculate early return date
                    $end_parts = explode('.', $parts[1]);
                    if (count($end_parts) === 3) {
                        $end_date = new DateTime();
                        $end_date->setDate($end_parts[2], $end_parts[1], $end_parts[0]);
                        
                        // Add day after as early return
                        $day_after = clone $end_date;
                        $day_after->modify('+1 day');
                        $all_early_return_dates[] = $day_after->format('d.m.Y');
                    }
                }
            }
        }
        
        // Localize the script with return dates
        $pickup_data = array(
            'returnDates' => array_unique($all_return_dates),
            'earlyReturnDates' => array_unique($all_early_return_dates),
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mitnafun-pickup-time'),
            'product_ids' => $product_ids
        );
        
        wp_localize_script('pickup-time-validator', 'mitnafunPickupData', $pickup_data);
        wp_localize_script('bottleneck-order-validator', 'mitnafunPickupData', $pickup_data);
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_pickup_time_validator');

/**
 * Add basic stock warning for products that might have availability issues
 */
function mitnafun_add_stock_warning() {
    // Only load on product pages
    if (!is_product()) {
        return;
    }
    
    // Enqueue with very low priority to ensure it runs after other scripts
    wp_enqueue_script(
        'mitnafun-stock-warning',
        get_stylesheet_directory_uri() . '/js/stock-warning.js',
        array('jquery'),
        '1.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'mitnafun_add_stock_warning', 999);

// Enqueue zero stock validator script - critical for preventing orders when stock is zero
function mitnafun_enqueue_zero_stock_validator() {
    if (is_product()) {
        // Check if there's a GET parameter indicating future dates
        if (isset($_GET['future_dates']) && $_GET['future_dates'] === 'yes') {
            // Skip loading the validator for future dates
            return;
        }
        
        wp_enqueue_script(
            'zero-stock-validator',
            get_stylesheet_directory_uri() . '/js/zero-stock-validator-new.js',
            array('jquery'),
            time(), // Use current time to force cache refresh
            true
        );
    }
}

// Use priority 1000 (higher than all other scripts) to ensure it loads last
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_zero_stock_validator', 1000);

/**
 * Enqueue log cleanup and stock data integrator scripts
 * These scripts improve calendar functionality and reduce console noise
 */
function mitnafun_enqueue_cleanup_and_integrator() {
    // Only load on product pages
    if (!is_product()) return;
    
    // Enqueue log cleanup script to reduce console noise
    wp_enqueue_script(
        'mitnafun-cleanup-logs',
        get_stylesheet_directory_uri() . '/js/cleanup-logs.js',
        array('jquery'),
        time(),
        true
    );
    
    // Enqueue stock data integrator script
    wp_enqueue_script(
        'mitnafun-stock-data-integrator',
        get_stylesheet_directory_uri() . '/js/stock-data-integrator.js',
        array('jquery'),
        time(),
        true
    );
    
    // Enqueue calendar style fix script
    wp_enqueue_script(
        'mitnafun-calendar-style-fix',
        get_stylesheet_directory_uri() . '/js/calendar-style-fix.js',
        array('jquery', 'mitnafun-stock-data-integrator'),
        time(),
        true
    );
    
    // Enqueue date range validator script - ensures blocked dates aren't selectable
    wp_enqueue_script(
        'mitnafun-date-range-validator',
        get_stylesheet_directory_uri() . '/js/date-range-validator.js',
        array('jquery', 'mitnafun-stock-data-integrator'),
        time(),
        true
    );
}

// Use priority 1001 (higher than all other scripts) to ensure it runs after everything else
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_cleanup_and_integrator', 1001);

/**
 * Redirect /basket to homepage
 */
function mitnafun_redirect_basket_to_home() {
    // Ignore redirection when coming from product page with future dates
    if (isset($_POST['rental_dates']) && !empty($_POST['rental_dates'])) {
        // Parse the dates (format: DD.MM.YYYY - DD.MM.YYYY)
        $dates = explode(' - ', sanitize_text_field($_POST['rental_dates']));
        if (count($dates) > 0) {
            $date_format = 'd.m.Y'; // Format: DD.MM.YYYY
            $start_date = DateTime::createFromFormat($date_format, $dates[0]);
            $now = new DateTime();
            
            if ($start_date) {
                $days_in_future = $start_date->diff($now)->days;
                
                // If start date is at least 3 days in the future, don't redirect
                if ($days_in_future >= 3) {
                    return; // Skip the redirect for future bookings
                }
            }
        }
    }
    
    // Regular behavior - only redirect if path is /basket
    if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/basket') {
        wp_redirect(home_url('/'));
        exit();
    }
}
add_action('template_redirect', 'mitnafun_redirect_basket_to_home');

/**
 * Enable backorders for all products and allow future rental dates
 * even when stock is 0
 */

// Enable backorders for all products
function mitnafun_enable_backorders_for_all_products() {
    // Get all products
    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'fields'         => 'ids',
    );
    
    $products = new WP_Query($args);
    
    if ($products->have_posts()) {
        foreach ($products->posts as $product_id) {
            $product = wc_get_product($product_id);
            if ($product) {
                // Enable backorders
                $product->set_backorders('yes');
                $product->save();
            }
        }
    }
    
    update_option('mitnafun_backorders_enabled', 'yes');
}

// Run once to update existing products
if (!get_option('mitnafun_backorders_enabled')) {
    add_action('init', 'mitnafun_enable_backorders_for_all_products');
}

// Override stock validation for future dates
add_filter('woocommerce_add_to_cart_validation', 'mitnafun_allow_future_orders', 10, 3);
function mitnafun_allow_future_orders($passed, $product_id, $quantity) {
    // Check if rental dates are in the future
    if (isset($_POST['rental_dates'])) {
        $dates = explode(' - ', sanitize_text_field($_POST['rental_dates']));
        if (count($dates) >= 1) {
            $date_format = 'd.m.Y'; // Format: DD.MM.YYYY
            $start_date = DateTime::createFromFormat($date_format, $dates[0]);
            $now = new DateTime();
            
            if ($start_date) {
                $days_in_future = $start_date->diff($now)->days;
                
                // If start date is at least 3 days in the future, allow even with 0 stock
                if ($days_in_future >= 3) {
                    return true;
                }
            }
        }
    }
    
    return $passed;
}

/**
 * Validate rental dates before adding to cart
 * This provides server-side validation to prevent invalid date selections
 */
function mitnafun_validate_rental_dates_before_cart($passed, $product_id, $quantity) {
    // Only apply to rental products
    $product = wc_get_product($product_id);
    if (!$product) {
        return $passed;
    }
    
    // Check if this is a rental product (you might need to adjust this condition)
    if (!$product->is_type('simple')) {
        return $passed;
    }
    
    // Check if rental dates are provided
    if (!isset($_REQUEST['rental_dates']) || empty($_REQUEST['rental_dates'])) {
        wc_add_notice(__('יש לבחור תאריכי השכרה לפני הוספה לסל.', 'mitnafun-upro'), 'error');
        return false;
    }
    
    // Get the rental dates
    $rental_dates = sanitize_text_field($_REQUEST['rental_dates']);
    $date_parts = explode(' - ', $rental_dates);
    
    // Validate date format
    if (count($date_parts) !== 2) {
        wc_add_notice(__('פורמט תאריכי השכרה לא תקין.', 'mitnafun-upro'), 'error');
        return false;
    }
    
    // Parse dates
    $start_date = DateTime::createFromFormat('d.m.Y', trim($date_parts[0]));
    $end_date = DateTime::createFromFormat('d.m.Y', trim($date_parts[1]));
    
    if (!$start_date || !$end_date) {
        wc_add_notice(__('תאריכי השכרה לא תקינים.', 'mitnafun-upro'), 'error');
        return false;
    }
    
    // Check if start date is before end date
    if ($start_date > $end_date) {
        wc_add_notice(__('תאריך ההתחלה חייב להיות לפני תאריך הסיום.', 'mitnafun-upro'), 'error');
        return false;
    }
    
    // Check if dates are in the past
    $today = new DateTime('today');
    if ($start_date < $today) {
        wc_add_notice(__('לא ניתן להזמין לתאריכים שעברו.', 'mitnafun-upro'), 'error');
        return false;
    }
    
    // Get initial stock (total available)
    $initial_stock = mitnafun_get_initial_stock($product_id);
    
    // If we can't determine initial stock, allow the order
    if ($initial_stock === false || $initial_stock === '') {
        return $passed;
    }
    
    // Get reserved dates for this product
    $reserved_dates = [];
    if (function_exists('get_product_reserved_dates')) {
        $reserved_dates = get_product_reserved_dates($product_id);
    }
    
    // Count reservations per day
    $reservations_by_day = [];
    foreach ($reserved_dates as $range) {
        $range_parts = explode(' - ', $range);
        if (count($range_parts) === 2) {
            $range_start = DateTime::createFromFormat('d.m.Y', trim($range_parts[0]));
            $range_end = DateTime::createFromFormat('d.m.Y', trim($range_parts[1]));
            
            if ($range_start && $range_end) {
                $current = clone $range_start;
                while ($current <= $range_end) {
                    $day_key = $current->format('Y-m-d');
                    if (!isset($reservations_by_day[$day_key])) {
                        $reservations_by_day[$day_key] = 0;
                    }
                    $reservations_by_day[$day_key]++;
                    $current->modify('+1 day');
                }
            }
        }
    }
    
    // Check if any day in the selected range is fully booked
    $current = clone $start_date;
    while ($current <= $end_date) {
        $day_key = $current->format('Y-m-d');
        $reservations = isset($reservations_by_day[$day_key]) ? $reservations_by_day[$day_key] : 0;
        
        // If reservations for this day equal or exceed stock, it's not available
        if ($reservations >= $initial_stock) {
            $formatted_date = $current->format('d.m.Y');
            wc_add_notice(sprintf(__('התאריך %s אינו זמין להזמנה - אין מספיק מלאי זמין.', 'mitnafun-upro'), $formatted_date), 'error');
            return false;
        }
        
        $current->modify('+1 day');
    }
    
    // All checks passed
    return $passed;
}
add_filter('woocommerce_add_to_cart_validation', 'mitnafun_validate_rental_dates_before_cart', 10, 3);

// Prevent redirect when adding 0 stock items to cart
add_filter('woocommerce_add_to_cart_redirect', 'mitnafun_prevent_redirect_on_out_of_stock', 10, 2);
function mitnafun_prevent_redirect_on_out_of_stock($location, $product_id = null) {
    if (!$product_id && isset($_POST['add-to-cart'])) {
        $product_id = absint($_POST['add-to-cart']);
    }
    
    if ($product_id) {
        $product = wc_get_product($product_id);
        if ($product && $product->is_on_backorder() && !$product->is_in_stock()) {
            // Stay on the current page and add a notice parameter
            return remove_query_arg('add-to-cart', add_query_arg('backorder_notice', 'future_date'));
        }
    }
    
    return $location;
}

// Add a notice for backordered items
add_action('woocommerce_before_single_product', 'mitnafun_show_backorder_notice');
function mitnafun_show_backorder_notice() {
    if (isset($_GET['backorder_notice']) && $_GET['backorder_notice'] === 'future_date') {
        wc_add_notice(
            __('הזמנתך לתאריך עתידי נרשמה בהצלחה. המוצר אינו במלאי כרגע אך יהיה זמין בתאריכים שנבחרו.', 'woocommerce'),
            'success'
        );
    }
}

// Force backorders for all products
add_filter('woocommerce_product_get_backorders', 'mitnafun_force_backorders', 10, 2);
add_filter('woocommerce_product_variation_get_backorders', 'mitnafun_force_backorders', 10, 2);
function mitnafun_force_backorders($backorders, $product) {
    return 'yes';
}

// Enqueue the future date stock override script
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_future_date_override', 1002); // Higher priority than all other scripts
function mitnafun_enqueue_future_date_override() {
    if (is_product()) {
        wp_enqueue_script(
            'future-date-stock-override',
            get_stylesheet_directory_uri() . '/js/future-date-stock-override.js',
            array('jquery'),
            time(), // Use current time as version to prevent caching during development
            true
        );
    }
}

// Enqueue direct form override with absolute highest priority
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_direct_form_override', 9999); // Absolute highest priority
function mitnafun_enqueue_direct_form_override() {
    if (is_product()) {
        wp_enqueue_script(
            'direct-form-override',
            get_stylesheet_directory_uri() . '/js/direct-form-override.js',
            array('jquery'),
            time(), // Use current time as version to prevent caching during development
            true
        );
    }
}

// Enqueue the PRODUCTION console log cleanup script - ABSOLUTE highest priority, loads in header
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_log_cleanup', 0);
function mitnafun_enqueue_log_cleanup() {
    // Load on all pages, not just product pages
    wp_enqueue_script(
        'cleanup-logs',
        get_stylesheet_directory_uri() . '/js/cleanup-logs.js',
        array(), // No dependencies to ensure earliest possible loading
        time(),
        false // Load in header, not footer
    );
}

// Include the server-side handler for time validation
require_once(get_stylesheet_directory() . '/js/time-validation-handler.php');

/**
 * Get product initial stock from multiple possible sources
 * This bridge function tries several methods to retrieve the initial stock value
 *
 * @param int $product_id The product ID
 * @return int|string The initial stock value or empty string if not found
 */
function mitnafun_get_initial_stock($product_id) {
    global $wpdb;
    $initial_stock = '';
    $debug = true;
    
    // Method 1: Try direct post meta from our plugin
    $initial_stock = get_post_meta($product_id, '_initial_stock', true);
    
    if ($debug) {
        error_log("[Stock Bridge] Method 1 - Post meta _initial_stock: {$initial_stock}");
    }
    
    // Method 2: Try using the plugin's database table if it exists
    if (empty($initial_stock) && function_exists('MitnafunOrderAdmin::get_instance')) {
        // Check if the plugin table exists
        $table_name = $wpdb->prefix . 'mitnafun_product_stock';
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_name}'")===$table_name;
        
        if ($table_exists) {
            $initial_stock_query = $wpdb->get_var($wpdb->prepare(
                "SELECT initial_stock FROM {$table_name} WHERE product_id = %d",
                $product_id
            ));
            
            if (!empty($initial_stock_query)) {
                $initial_stock = $initial_stock_query;
                if ($debug) {
                    error_log("[Stock Bridge] Method 2 - Plugin table: {$initial_stock}");
                }
            }
        }
    }
    
    // Method 3: Fallback to current stock if initial stock isn't set
    if (empty($initial_stock)) {
        $product = wc_get_product($product_id);
        if ($product) {
            $current_stock = $product->get_stock_quantity();
            if (!empty($current_stock)) {
                $initial_stock = $current_stock;
                if ($debug) {
                    error_log("[Stock Bridge] Method 3 - Fallback to current stock: {$initial_stock}");
                }
                
                // Also save this as _initial_stock for future use
                update_post_meta($product_id, '_initial_stock', $initial_stock);
                if ($debug) {
                    error_log("[Stock Bridge] Saved current stock as initial stock for future: {$initial_stock}");
                }
            }
        }
    }
    
    // Method 4: Last resort - direct SQL query to find ANY meta related to stock
    if (empty($initial_stock)) {
        $stock_meta_query = $wpdb->get_results($wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->postmeta} 
             WHERE post_id = %d 
             AND (meta_key LIKE '%stock%' OR meta_key LIKE '%inventory%')",
            $product_id
        ));
        
        if ($debug && !empty($stock_meta_query)) {
            error_log("[Stock Bridge] Method 4 - Found stock-related meta: " . print_r($stock_meta_query, true));
        }
    }
    
    // Final check - convert to integer if we found something
    if (!empty($initial_stock)) {
        // Convert to integer
        $initial_stock = intval($initial_stock);
    } else {
        // Default to 0 if nothing found
        $initial_stock = 0;
        if ($debug) {
            error_log("[Stock Bridge] No initial stock found for product {$product_id}, defaulting to 0");
        }
    }
    
    return $initial_stock;
}

/**
 * AJAX handler to get product stock data including initial stock
 */
function get_product_stock_data_ajax_handler() {
    // Check for product ID
    if (!isset($_POST['product_id']) || empty($_POST['product_id'])) {
        wp_send_json_error(array('message' => 'Product ID is required'));
        wp_die();
    }
    
    $product_id = intval($_POST['product_id']);
    $product = wc_get_product($product_id);
    
    if (!$product) {
        wp_send_json_error(array('message' => 'Product not found'));
        wp_die();
    }
    
    // Get stock quantity
    $stock_qty = $product->get_stock_quantity();
    
    // Get initial stock from our bridge function
    $initial_stock = mitnafun_get_initial_stock($product_id);
    
    // Log the data we're returning
    error_log("Direct stock data fetch - Product ID: {$product_id}, Stock: {$stock_qty}, Initial Stock: {$initial_stock}");
    
    // Send success response with stock data
    wp_send_json_success(array(
        'product_id' => $product_id,
        'stock_qty' => $stock_qty,
        'initial_stock' => $initial_stock,
        'manage_stock' => $product->get_manage_stock(),
        'debug_info' => true
    ));
    
    wp_die();
}
add_action('wp_ajax_get_product_stock_data', 'get_product_stock_data_ajax_handler');
add_action('wp_ajax_nopriv_get_product_stock_data', 'get_product_stock_data_ajax_handler');

/**
 * Get rental data for a product
 */
function get_product_rental_data($product_id) {
    global $wpdb;
    
    // Get product data
    $product = wc_get_product($product_id);
    if (!$product) {
        return false;
    }
    
    // Get stock status
    $stock_status = $product->get_stock_status();
    $stock_quantity = $product->get_stock_quantity();
    
    // Get upcoming rentals
    $upcoming_rentals = array();
    $current_date = current_time('Y-m-d H:i:s');
    
    // Query orders with this product
    $orders = wc_get_orders(array(
        'status' => array('wc-processing', 'wc-completed', 'wc-on-rental'),
        'date_created' => '>' . (time() - YEAR_IN_SECONDS), // Last year
        'limit' => 50, // Limit to 50 most recent orders for performance
    ));
    
    foreach ($orders as $order) {
        foreach ($order->get_items() as $item) {
            if ($item->get_product_id() == $product_id || $item->get_variation_id() == $product_id) {
                $rental_dates = $item->get_meta('_rental_dates');
                if ($rental_dates) {
                    $upcoming_rentals[] = array(
                        'order_id' => $order->get_id(),
                        'order_date' => $order->get_date_created()->date('Y-m-d H:i:s'),
                        'rental_dates' => $rental_dates,
                        'status' => $order->get_status(),
                    );
                }
            }
        }
    }
    
    // Get product availability from custom table if available
    $table_name = $wpdb->prefix . 'mogi_booking_dates';
    $booked_dates = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$table_name} 
        WHERE product_id = %d 
        AND end_date >= %s 
        ORDER BY start_date ASC",
        $product_id,
        $current_date
    ));
    
    // Format booked dates
    $formatted_booked_dates = array();
    foreach ($booked_dates as $date) {
        $formatted_booked_dates[] = array(
            'start_date' => $date->start_date,
            'end_date' => $date->end_date,
            'order_id' => $date->order_id,
            'status' => $date->status,
        );
    }
    
    return array(
        'product_id' => $product_id,
        'name' => $product->get_name(),
        'stock_status' => $stock_status,
        'stock_quantity' => $stock_quantity,
        'upcoming_rentals' => $upcoming_rentals,
        'booked_dates' => $formatted_booked_dates,
    );
}

/**
 * Display rental data on product page
 */
function display_product_rental_data() {
    global $product;
    
    if (!$product) {
        error_log('No product object found');
        return;
    }
    
    $product_id = $product->get_id();
    error_log('Checking rental data for product ID: ' . $product_id);
    
    $rental_data = get_product_rental_data($product_id);
    if (!$rental_data) {
        error_log('No rental data returned for product ID: ' . $product_id);
        return;
    }
    
    error_log('Rental data found for product ID ' . $product_id . ': ' . print_r($rental_data, true));
    
    // Only show if there are upcoming rentals
    if (empty($rental_data['upcoming_rentals']) && empty($rental_data['booked_dates'])) {
        return;
    }
    
    // Enqueue styles
    echo '<style>
    .rental-availability {
        margin: 20px 0;
        padding: 15px;
        background: #f8f8f8;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
    }
    .rental-availability h3 {
        margin-top: 0;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e5e5e5;
        font-size: 18px;
    }
    .rental-dates-list {
        max-height: 200px;
        overflow-y: auto;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .rental-date-item {
        padding: 8px 12px;
        margin-bottom: 5px;
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 3px;
        display: flex;
        justify-content: space-between;
    }
    .rental-date-range {
        font-weight: 500;
    }
    .rental-status {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 3px;
        background: #f0f0f0;
    }
    .rental-status.completed {
        background: #d4edda;
        color: #155724;
    }
    .rental-status.processing {
        background: #cce5ff;
        color: #004085;
    }
    .rental-status.on-rental {
        background: #fff3cd;
        color: #856404;
    }
    </style>';
    
    // Display rental availability
    echo '<div class="rental-availability">';
    echo '<h3>זמינות השכרה</h3>';
    
    // Show upcoming rentals
    if (!empty($rental_data['upcoming_rentals'])) {
        echo '<h4>השכרות קרובות:</h4>';
        echo '<ul class="rental-dates-list">';
        
        foreach ($rental_data['upcoming_rentals'] as $rental) {
            $status_class = str_replace('wc-', '', $rental['status']);
            echo '<li class="rental-date-item">';
            echo '<span class="rental-date-range">' . esc_html($rental['rental_dates']) . '</span>';
            echo '<span class="rental-status ' . esc_attr($status_class) . '">' . ucfirst($rental['status']) . '</span>';
            echo '</li>';
        }
        
        echo '</ul>';
    }
    
    // Show booked dates from custom table if available
    if (!empty($rental_data['booked_dates'])) {
        echo '<h4>תאריכים תפוסים:</h4>';
        echo '<ul class="rental-dates-list">';
        
        foreach ($rental_data['booked_dates'] as $date) {
            $status_class = str_replace(' ', '-', strtolower($date->status));
            echo '<li class="rental-date-item">';
            echo '<span class="rental-date-range">' . 
                 date_i18n('d/m/Y', strtotime($date->start_date)) . ' - ' . 
                 date_i18n('d/m/Y', strtotime($date->end_date)) . 
                 '</span>';
            echo '<span class="rental-status ' . esc_attr($status_class) . '">' . 
                 ucfirst($date->status) . 
                 '</span>';
            echo '</li>';
        }
        
        echo '</ul>';
    }
    
    echo '</div>';
}
add_action('woocommerce_after_add_to_cart_form', 'display_product_rental_data', 20);

/**
 * Display rental data on order review in checkout
 */
function display_rental_data_in_checkout() {
    foreach (WC()->cart->get_cart() as $cart_item) {
        $product = $cart_item['data'];
        if (!$product) continue;
        
        $rental_data = get_product_rental_data($product->get_id());
        if (!$rental_data || (empty($rental_data['upcoming_rentals']) && empty($rental_data['booked_dates']))) {
            continue;
        }
        
        echo '<div class="rental-availability-checkout">';
        echo '<h4>' . esc_html($product->get_name()) . ' - זמינות השכרה</h4>';
        
        // Show upcoming rentals
        if (!empty($rental_data['upcoming_rentals'])) {
            echo '<ul class="rental-dates-list">';
            
            foreach ($rental_data['upcoming_rentals'] as $rental) {
                $status_class = str_replace('wc-', '', $rental['status']);
                echo '<li class="rental-date-item">';
                echo '<span class="rental-date-range">' . esc_html($rental['rental_dates']) . '</span>';
                echo '<span class="rental-status ' . esc_attr($status_class) . '">' . ucfirst($rental['status']) . '</span>';
                echo '</li>';
            }
            
            echo '</ul>';
        }
        
        echo '</div>';
    }
}
add_action('woocommerce_review_order_before_submit', 'display_rental_data_in_checkout', 10);

// Add inline styles for checkout
function add_rental_availability_styles() {
    if (!is_checkout()) return;
    
    echo '<style>
    .rental-availability-checkout {
        margin: 15px 0;
        padding: 10px;
        background: #f8f8f8;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
    }
    .rental-availability-checkout h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
    }
    </style>';
}
add_action('wp_head', 'add_rental_availability_styles');

// Enqueue the EMERGENCY direct submit handler - highest priority, loads in header
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_emergency_handler', 1);
function mitnafun_enqueue_emergency_handler() {
    if (is_product()) {
        wp_enqueue_script(
            'emergency-direct-submit',
            get_stylesheet_directory_uri() . '/js/emergency-direct-submit.js',
            array(), // No dependencies to ensure earliest possible loading
            time(),
            false // Load in header, not footer
        );
    }
}

// Enqueue the calendar future date fixer - loads after calendar initialization
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_calendar_fixer', 999);
function mitnafun_enqueue_calendar_fixer() {
    if (is_product()) {
        wp_enqueue_script(
            'calendar-future-date-fixer',
            get_stylesheet_directory_uri() . '/js/calendar-future-date-fixer.js',
            array('jquery'),
            time(),
            true // Load in footer after calendar is initialized
        );
    }
}

// Enqueue the checkout time validator script - only on checkout page
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_checkout_time_validator', 999);
function mitnafun_enqueue_checkout_time_validator() {
    if (is_checkout()) {
        wp_enqueue_script(
            'checkout-time-validator',
            get_stylesheet_directory_uri() . '/js/checkout-time-validator.js',
            array('jquery', 'wc-checkout'),
            time(),
            true
        );
    }
}

// Enqueue the form submission validator script
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_form_submission_validator', 10001);

// Enqueue the complete future date override script (our final solution)
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_complete_override', 10000);
function mitnafun_enqueue_complete_override() {
    if (is_product()) {
        wp_enqueue_script(
            'complete-future-date-override',
            get_stylesheet_directory_uri() . '/js/complete-future-date-override.js',
            array('jquery'),
            time(),
            true
        );
    }
}

// NUCLEAR OPTION: Add inline script directly to footer that will FORCE enable buttons
// This will run after ALL other scripts and bypass ANY validation
add_action('wp_footer', 'mitnafun_force_enable_buttons', 99999);

/**
 * Enhanced rental date and stock logging mechanism 
 * Logs detailed stock and rental information for debugging
 */
function mitnafun_rental_date_failsafe() {
    // Only run on product pages
    if (!is_product()) {
        return;
    }
    
    // Add visual debug panel for admins
    if (current_user_can('manage_options')) {
        add_action('wp_footer', 'mitnafun_stock_debug_panel', 999);
    }
    
    // Add inline script to log detailed info
    add_action('wp_footer', function() {
        global $product;
        if (!$product) {
            return;
        }
        
        // Get initial stock using our bridge function
        $initial_stock = mitnafun_get_initial_stock($product->get_id());
        $current_stock = $product->get_stock_quantity();
        $product_id = $product->get_id();
        
        // Get rental dates using existing function
        $reserved_dates = [];
        if (function_exists('get_product_reserved_dates')) {
            $reserved_dates = get_product_reserved_dates($product_id);
        }
        
        // Create JavaScript object with all data
        ?>
        <script>
        jQuery(document).ready(function($) {
            // Wait a moment for all other scripts to run
            setTimeout(function() {
                console.group('🔒 MITNAFUN FAILSAFE STOCK & RENTAL INFO');
                console.log('Product ID:', <?php echo json_encode($product_id); ?>);
                console.log('Initial Stock:', <?php echo json_encode($initial_stock); ?>);
                console.log('Current Stock:', <?php echo json_encode($current_stock); ?>);
                console.log('Reserved Dates Count:', <?php echo json_encode(count($reserved_dates)); ?>);
                console.log('Available Units:', <?php echo json_encode(max(0, $current_stock)); ?>);
                
                // Log reserved dates if any
                <?php if (!empty($reserved_dates)): ?>
                console.group('📅 Reserved Date Ranges');
                <?php foreach($reserved_dates as $index => $date_range): ?>
                console.log(<?php echo $index+1; ?> + '. ' + <?php echo json_encode($date_range); ?>);
                <?php endforeach; ?>
                console.groupEnd();
                <?php endif; ?>
                
                // Analyze calendar UI if present
                if ($('.rental-dates-field').length) {
                    console.group('📆 Calendar UI Analysis');
                    console.log('Calendar Found:', true);
                    console.log('Disabled Dates:', $('.day-cell.disabled:not(.weekend):not(.empty)').length);
                    console.log('Selected Dates:', $('.day-cell.selected').length);
                    console.groupEnd();
                }
                
                console.groupEnd();
            }, 2000); // Wait 2 seconds to ensure all data is loaded
        });
        </script>
        <?php
    }, 999);
}

// Initialize the failsafe mechanism
add_action('wp_enqueue_scripts', 'mitnafun_rental_date_failsafe', 999);

/**
 * Add a console log filter to clean up noise
 * This will suppress common warning messages that clutter the console
 */
function mitnafun_add_console_cleaner() {
    if (!is_product()) {
        return;
    }
    
    ?>
    <script>
    // Add a console log filter to clean up the noise
    (function() {
        // Store original console methods
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        // Messages to filter out
        const filterPatterns = [
            'JQMIGRATE:',
            'Migrate is installed',
            '[Violation]',
            'setTimeout\'',
            'handler took',
            'Avoid using document.write',
            'developers.google.com'
        ];
        
        // Override console.log to filter messages
        console.log = function() {
            // Convert arguments to array
            const args = Array.from(arguments);
            
            // Check if the message contains any of the filter patterns
            const message = args.join(' ');
            const shouldFilter = filterPatterns.some(pattern => 
                typeof message === 'string' && message.includes(pattern)
            );
            
            // Only pass to original console if not filtered
            if (!shouldFilter) {
                originalConsole.log.apply(console, args);
            }
        };
        
        // Do the same for console.warn
        console.warn = function() {
            const args = Array.from(arguments);
            const message = args.join(' ');
            const shouldFilter = filterPatterns.some(pattern => 
                typeof message === 'string' && message.includes(pattern)
            );
            
            if (!shouldFilter) {
                originalConsole.warn.apply(console, args);
            }
        };
        
        // Keep original error logging intact but filter some error messages
        console.error = function() {
            const args = Array.from(arguments);
            const message = args.join(' ');
            const shouldFilter = filterPatterns.some(pattern => 
                typeof message === 'string' && message.includes(pattern)
            );
            
            if (!shouldFilter) {
                originalConsole.error.apply(console, args);
            }
        };
    })();
    </script>
    <?php
}
add_action('wp_head', 'mitnafun_add_console_cleaner');

/**
 * Admin-only stock debugging panel
 * Displays detailed stock and rental information at the bottom of product pages
 */
function mitnafun_stock_debug_panel() {
    // Only for admins on product pages
    if (!is_product() || !current_user_can('manage_options')) {
        return;
    }
    
    global $product;
    if (!$product) {
        return;
    }
    
    // Get product data
    $product_id = $product->get_id();
    $initial_stock = mitnafun_get_initial_stock($product_id);
    $current_stock = $product->get_stock_quantity();
    
    // Get rental dates
    $reserved_dates = [];
    if (function_exists('get_product_reserved_dates')) {
        $reserved_dates = get_product_reserved_dates($product_id);
    }
    
    // Create toggle button for collapsed panel
    echo '<div id="mitnafun-debug-toggle" style="position: fixed; bottom: 0; left: 20px; background: rgba(0,0,0,0.7); color: #fff; padding: 5px 10px; border-radius: 5px 5px 0 0; z-index: 9999; cursor: pointer; font-size: 12px;" onclick="toggleDebugPanel()">🔍 Debug</div>';
    
    // Display debug panel (collapsed by default)
    echo '<div id="mitnafun-admin-debug" style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.85); color: #fff; padding: 15px; z-index: 9998; font-size: 14px; direction: ltr; text-align: left; display: none;">';
    echo '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    echo '<h3 style="margin: 0; color: #fff;">🔍 MITNAFUN ADMIN STOCK DEBUG</h3>';
    echo '<span style="cursor: pointer;" onclick="toggleDebugPanel()">×</span>';
    echo '</div>';
    
    // Add JavaScript for toggle functionality
    echo '<script>
        function toggleDebugPanel() {
            var panel = document.getElementById("mitnafun-admin-debug");
            var toggle = document.getElementById("mitnafun-debug-toggle");
            if (panel.style.display === "none") {
                panel.style.display = "block";
                toggle.style.display = "none";
            } else {
                panel.style.display = "none";
                toggle.style.display = "block";
            }
        }
    </script>';
    
    echo '<div style="display: flex; gap: 20px;">';
    
    // Stock info section
    echo '<div style="flex: 1;">';
    echo '<h4 style="margin: 5px 0; color: #4CAF50;">Stock Information</h4>';
    echo '<table style="width: 100%; border-collapse: collapse;">';
    echo '<tr><td style="padding: 3px 10px 3px 0;">Product ID:</td><td>' . $product_id . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0;">SKU:</td><td>' . $product->get_sku() . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0;">Manage Stock:</td><td>' . ($product->get_manage_stock() ? 'Yes' : 'No') . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0; font-weight: bold; color: #ff9800;">Initial Stock:</td><td>' . $initial_stock . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0;">Current Stock:</td><td>' . $current_stock . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0;">In Stock:</td><td>' . ($product->is_in_stock() ? 'Yes' : 'No') . '</td></tr>';
    echo '<tr><td style="padding: 3px 10px 3px 0;">Backorders:</td><td>' . $product->get_backorders() . '</td></tr>';
    echo '</table>';
    echo '</div>';
    
    // Reserved dates section with date analysis
    echo '<div style="flex: 1;">';
    echo '<h4 style="margin: 5px 0; color: #4CAF50;">Reserved Dates (' . count($reserved_dates) . ')</h4>';
    echo '<div style="max-height: 200px; overflow-y: auto;">';
    if (!empty($reserved_dates)) {
        // Create an array to track bookings per day
        $bookings_by_day = array();
        $date_ranges_parsed = array();
        
        // Parse each date range and count bookings per day
        foreach ($reserved_dates as $date_range) {
            $parts = explode(' - ', $date_range);
            if (count($parts) === 2) {
                $start_date = DateTime::createFromFormat('d.m.Y', $parts[0]);
                $end_date = DateTime::createFromFormat('d.m.Y', $parts[1]);
                
                if ($start_date && $end_date) {
                    $date_ranges_parsed[] = array(
                        'start' => $start_date->format('Y-m-d'),
                        'end' => $end_date->format('Y-m-d'),
                        'range' => $date_range
                    );
                    
                    // Count each day in the range
                    $current = clone $start_date;
                    while ($current <= $end_date) {
                        $day_key = $current->format('Y-m-d');
                        if (!isset($bookings_by_day[$day_key])) {
                            $bookings_by_day[$day_key] = 0;
                        }
                        $bookings_by_day[$day_key]++;
                        $current->modify('+1 day');
                    }
                }
            }
        }
        
        // Find potential overbookings
        $overbookings = array();
        foreach ($bookings_by_day as $day => $count) {
            if ($count > $initial_stock) {
                $overbookings[$day] = $count;
            }
        }
        
        // Display the date ranges with color coding
        echo '<table style="width: 100%; border-collapse: collapse;">';
        foreach ($date_ranges_parsed as $index => $range) {
            // Check if this range has any overbookings
            $has_overbooking = false;
            $current = new DateTime($range['start']);
            $end = new DateTime($range['end']);
            
            while ($current <= $end) {
                $day_key = $current->format('Y-m-d');
                if (isset($overbookings[$day_key])) {
                    $has_overbooking = true;
                    break;
                }
                $current->modify('+1 day');
            }
            
            $row_style = $has_overbooking ? 'background-color: rgba(255,0,0,0.2);' : '';
            echo '<tr style="' . $row_style . '"><td style="padding: 3px 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">' . ($index + 1) . '.</td>';
            echo '<td style="padding: 3px 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">' . $range['range'] . '</td></tr>';
        }
        echo '</table>';
        
        // Display overbookings section if any exist
        if (!empty($overbookings)) {
            echo '<div style="margin-top: 10px; background: rgba(255,0,0,0.1); padding: 5px; border-left: 3px solid #f44336;">';
            echo '<strong style="color: #f44336;">Potential Overbookings Detected!</strong>';
            echo '<ul style="margin: 5px 0 0 20px; padding: 0;">';
            foreach ($overbookings as $day => $count) {
                $formatted_date = date('d.m.Y', strtotime($day));
                echo '<li>' . $formatted_date . ': ' . $count . ' bookings (limit: ' . $initial_stock . ')</li>';
            }
            echo '</ul>';
            echo '</div>';
        }
    } else {
        echo '<p>No reserved dates found</p>';
    }
    echo '</div>';
    echo '</div>';
    
    // Calendar info section
    echo '<div style="flex: 1;">';
    echo '<h4 style="margin: 5px 0; color: #4CAF50;">Calendar Analysis</h4>';
    
    // Add booking density heatmap
    if (!empty($bookings_by_day)) {
        // Show the next 30 days booking density
        $today = new DateTime('today');
        $end_date = clone $today;
        $end_date->modify('+30 days');
        
        echo '<h5 style="margin: 5px 0; font-size: 13px;">30-Day Booking Density:</h5>';
        echo '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 10px;">';
        
        // Add day headers (Sun-Sat)
        $days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        foreach ($days as $day) {
            echo '<div style="text-align: center; font-size: 10px;">' . $day . '</div>';
        }
        
        // Fill in empty cells for days before the 1st of the month starts
        $start_dow = (int)$today->format('w'); // 0 (Sun) through 6 (Sat)
        for ($i = 0; $i < $start_dow; $i++) {
            echo '<div style="height: 25px;"></div>';
        }
        
        // Generate the calendar cells for the next 30 days
        $current = clone $today;
        while ($current <= $end_date) {
            $date_key = $current->format('Y-m-d');
            $day_num = $current->format('j');
            $is_weekend = in_array($current->format('w'), ['0', '6']);
            $booking_count = isset($bookings_by_day[$date_key]) ? $bookings_by_day[$date_key] : 0;
            
            // Determine cell color based on booking density
            if ($booking_count == 0) {
                $cell_bg = $is_weekend ? '#f0f0f0' : '#ffffff';
                $cell_text = '#333';
            } else if ($booking_count < $initial_stock) {
                $cell_bg = 'rgba(76, 175, 80, ' . ($booking_count / $initial_stock) * 0.8 . ')';
                $cell_text = ($booking_count / $initial_stock) > 0.5 ? '#fff' : '#333';
            } else if ($booking_count == $initial_stock) {
                $cell_bg = 'rgba(255, 152, 0, 0.8)';
                $cell_text = '#fff';
            } else {
                $cell_bg = 'rgba(244, 67, 54, 0.8)';
                $cell_text = '#fff';
            }
            
            echo '<div style="height: 25px; display: flex; align-items: center; justify-content: center; background: ' . $cell_bg . '; color: ' . $cell_text . '; font-size: 11px; position: relative;" title="' . $current->format('d.m.Y') . ': ' . $booking_count . ' bookings">';
            echo $day_num;
            if ($booking_count > 0) {
                echo '<span style="position: absolute; top: 1px; right: 1px; font-size: 8px; font-weight: bold;">' . $booking_count . '</span>';
            }
            echo '</div>';
            
            $current->modify('+1 day');
        }
        
        echo '</div>';
        
        // Add legend
        echo '<div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 5px;">';
        echo '<div><span style="display: inline-block; width: 10px; height: 10px; background: #ffffff; margin-right: 3px;"></span> Available</div>';
        echo '<div><span style="display: inline-block; width: 10px; height: 10px; background: rgba(76, 175, 80, 0.5); margin-right: 3px;"></span> Partial</div>';
        echo '<div><span style="display: inline-block; width: 10px; height: 10px; background: rgba(255, 152, 0, 0.8); margin-right: 3px;"></span> Full</div>';
        echo '<div><span style="display: inline-block; width: 10px; height: 10px; background: rgba(244, 67, 54, 0.8); margin-right: 3px;"></span> Overbooked</div>';
        echo '</div>';
    }
    
    echo '<p>Calendar elements will be analyzed once page is fully loaded.</p>';
    echo '<div id="calendar-analysis-output"></div>';
    
    // Add inline script to analyze calendar
    echo '<script>';
    echo 'jQuery(document).ready(function($) {';
    echo '  setTimeout(function() {';
    echo '    var $calendarAnalysis = $("#calendar-analysis-output");';
    echo '    var calendarFound = $(".rental-dates-field").length > 0;';
    echo '    var disabledDates = $(".day-cell.disabled:not(.weekend):not(.empty)").length;';
    echo '    var selectedDates = $(".day-cell.selected").length;';
    echo '    $calendarAnalysis.html("<table style=\"width: 100%; border-collapse: collapse;\"><tr><td style=\"padding: 3px 10px 3px 0;\">Calendar Found:</td><td>" + (calendarFound ? "Yes" : "No") + "</td></tr><tr><td style=\"padding: 3px 10px 3px 0;\">Disabled Dates:</td><td>" + disabledDates + "</td></tr><tr><td style=\"padding: 3px 10px 3px 0;\">Selected Dates:</td><td>" + selectedDates + "</td></tr></table>");';
    echo '  }, 2000);'; // Wait 2 seconds for calendar to load
    echo '});';
    echo '</script>';
    echo '</div>';
    
    echo '</div>'; // End flex container
    echo '</div>'; // End debug panel
}
function mitnafun_force_enable_buttons() {
    if (!is_product()) return;
    
    ?>
    <script>
    // Wait for document ready AND wait 2 seconds for all other scripts to finish
    jQuery(document).ready(function($) {
        console.log('🧨 NUCLEAR OVERRIDE ACTIVE - Force enabling buttons for future dates');
        
        // Helper function to check if a date is sufficiently in the future (3+ days)
        function isDateSufficientlyInFuture(dateString) {
            if (!dateString) return false;
            
            // For date format DD.MM.YYYY
            if (dateString.indexOf('.') > 0) {
                const parts = dateString.split('.');
                if (parts.length === 3) {
                    const date = new Date(parts[2], parts[1] - 1, parts[0]);
                    const today = new Date();
                    const diffTime = date.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 3;
                }
            }
            return false;
        }
        
        // Function to check if selected dates are in the future
        function areDatesInFuture() {
            const rentalDatesInput = document.getElementById('rental_dates');
            if (rentalDatesInput && rentalDatesInput.value) {
                const dates = rentalDatesInput.value.split(' - ');
                if (dates.length > 0) {
                    return isDateSufficientlyInFuture(dates[0]);
                }
            }
            return false;
        }
        
        // This function will be called repeatedly to ensure buttons are enabled
        function forceEnableButtons() {
            if (areDatesInFuture()) {
                console.log('🧨 NUCLEAR OVERRIDE: Future dates detected, forcing buttons enabled');
                
                // Remove ALL event handlers from the form
                $('form.cart').off('submit');
                
                // Add our own submit handler
                $('form.cart').on('submit', function(e) {
                    if (areDatesInFuture()) {
                        console.log('🧨 NUCLEAR OVERRIDE: Allowing form submission for future dates');
                        return true;
                    }
                });
                
                // Force enable all buttons
                $('.single_add_to_cart_button').each(function() {
                    $(this)
                        .prop('disabled', false)
                        .removeClass('disabled')
                        .css('opacity', '1')
                        .css('cursor', 'pointer')
                        .attr('aria-disabled', 'false');
                    
                    // Remove ALL click event handlers and add our own
                    $(this).off('click');
                });
                
                // Hide the zero stock modal
                $('#zero-stock-modal, #zero-stock-overlay, #zero-stock-message-floating, #empty-stock-warning').remove();
                
                // Remove any body styling that prevents interaction
                $('body').css('overflow', '');
            }
        }
        
        // Run immediately and also after a delay to ensure all other scripts have run
        forceEnableButtons();
        setTimeout(forceEnableButtons, 500);
        setTimeout(forceEnableButtons, 1000);
        setTimeout(forceEnableButtons, 2000);
        
        // Also run periodically to make sure buttons stay enabled
        setInterval(forceEnableButtons, 1000);
    });
    </script>
    <?php
}