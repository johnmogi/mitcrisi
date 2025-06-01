<?php
error_log('MITNAFUN inc/checkout.php loaded');

add_filter( 'woocommerce_checkout_fields' , 'quadlayers_remove_checkout_fields' );

// Add custom pickup time display fix
add_action('wp_footer', 'fix_pickup_time_display');
function fix_pickup_time_display() {
    // Only run on checkout page to avoid conflicts
    if (!is_checkout()) {
        return;
    }
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Skip this function if our new pickup handler is active
        if (typeof PickupTimeHandler !== 'undefined') {
            console.log('PICKUP FIX: Using new PickupTimeHandler, skipping old fix');
            return;
        }
        
        console.log('SUPER PICKUP FIX RUNNING - Checking if pickup time needs to be fixed');
        
        // Get the product ID from the URL or cart
        var productId = 0;
        
        // Try to get from URL first
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('add-to-cart')) {
            productId = parseInt(urlParams.get('add-to-cart'));
        }
        
        // If not in URL, check if it's in a hidden field (common in WooCommerce cart)
        if (!productId && $('input[name="product_id"]').length) {
            productId = parseInt($('input[name="product_id"]').val());
        }
        
        // Get default pickup time from booking data if available
        var defaultPickupHour = '11:00';
        
        // Check if there's an admin override in mitnafun_booking_data
        if (typeof mitnafun_booking_data !== 'undefined' && mitnafun_booking_data.pickup_override) {
            defaultPickupHour = mitnafun_booking_data.pickup_override + ':00';
            console.log('Using pickup override from booking data:', defaultPickupHour);
        }
        
        // Check if custom pickup time is set in WC cart data
        if (typeof wc_cart_data !== 'undefined' && wc_cart_data.pickup_override) {
            defaultPickupHour = wc_cart_data.pickup_override + ':00';
            console.log('Using pickup override from cart data:', defaultPickupHour);
        }
        
        // Function to completely force the pickup time selection
        function forcePickupTimeDisplay() {
            console.log('FORCING pickup time display to: ' + defaultPickupHour);
            
            // STRATEGY 1: Direct DOM text setting
            $('.select2-selection__rendered').text(defaultPickupHour);
            $('.select2-selection__rendered').removeClass('select2-selection__placeholder');
            
            // STRATEGY 2: Force select value directly
            if ($('#order_comments').length) {
                $('#order_comments').val(defaultPickupHour);
                
                // Create option if missing
                if (!$('#order_comments option[value="' + defaultPickupHour + '"]').length) {
                    $('#order_comments').append('<option value="' + defaultPickupHour + '">' + defaultPickupHour + '</option>');
                }
                
                // Selected attribute
                $('#order_comments option').removeAttr('selected');
                $('#order_comments option[value="' + defaultPickupHour + '"]').attr('selected', 'selected');
                $('#order_comments').trigger('change');
            }
            
            // Also work with pickup_time field if that's being used
            if ($('#pickup_time').length) {
                $('#pickup_time').val(defaultPickupHour);
                
                // Create option if missing
                if (!$('#pickup_time option[value="' + defaultPickupHour + '"]').length) {
                    $('#pickup_time').append('<option value="' + defaultPickupHour + '">' + defaultPickupHour + '</option>');
                }
                
                // Selected attribute
                $('#pickup_time option').removeAttr('selected');
                $('#pickup_time option[value="' + defaultPickupHour + '"]').attr('selected', 'selected');
                $('#pickup_time').trigger('change');
            }
            
            // STRATEGY 3: Completely reset Select2 if available
            if ($.fn.select2) {
                if ($('#order_comments').data('select2')) {
                    try {
                        // Recreate Select2
                        $('#order_comments').select2('destroy');
                        $('#order_comments').select2();
                        setTimeout(function() {
                            $('.select2-selection__rendered').text(defaultPickupHour);
                        }, 50);
                    } catch(e) {
                        console.log('Select2 manipulation error:', e); 
                    }
                }
                
                if ($('#pickup_time').data('select2')) {
                    try {
                        // Recreate Select2
                        $('#pickup_time').select2('destroy');
                        $('#pickup_time').select2();
                        setTimeout(function() {
                            $('.select2-selection__rendered').text(defaultPickupHour);
                        }, 50);
                    } catch(e) {
                        console.log('Select2 manipulation error:', e); 
                    }
                }
            }
            
            // STRATEGY 4: Direct HTML override if all else fails
            setTimeout(function() {
                var placeholderText = $('.select2-selection__placeholder').text();
                if (placeholderText === 'שעת איסוף') {
                    console.log('EMERGENCY FIX - placeholder still showing!');
                    $('.select2-selection__rendered').removeClass('select2-selection__placeholder');
                    $('.select2-selection__rendered').html(defaultPickupHour);
                    
                    // Set hidden input value directly
                    var selectId = $('.select2-selection__rendered').attr('id');
                    if (selectId) {
                        var actualId = selectId.replace('select2-', '').replace('-container', '');
                        $('#' + actualId).val(defaultPickupHour);
                    }
                }
            }, 500);
        }
        
        // Store window's original force function
        window.forcePickupTimeDisplay = forcePickupTimeDisplay;
        
        // Run immediately
        forcePickupTimeDisplay();
        
        // And again after a reasonable delay
        window.timeoutID1 = setTimeout(forcePickupTimeDisplay, 1000);
        window.timeoutID2 = setTimeout(forcePickupTimeDisplay, 2500);
        
        // One final check to make sure placeholder is gone
        window.timeoutID3 = setTimeout(function() {
            if ($('.select2-selection__placeholder').length && $('.select2-selection__placeholder').is(':visible')) {
                console.log('LAST RESORT FIX APPLIED');
                $('.select2-selection__placeholder').removeClass('select2-selection__placeholder');
                $('.select2-selection__rendered').text(defaultPickupHour);
            }
        }, 3500);
    });
    </script>
    <?php
}

function quadlayers_remove_checkout_fields( $fields ) {

    unset($fields['billing']['billing_company']);
    unset($fields['billing']['billing_address_1']);
    unset($fields['billing']['billing_address_2']);
    unset($fields['billing']['billing_city']);
    unset($fields['billing']['billing_country']);
    unset($fields['billing']['billing_postcode']);
    unset($fields['billing']['billing_state']);
    unset($fields['order']['order_comments']);
    unset($fields['shipping']['shipping_first_name']);
    unset($fields['shipping']['shipping_last_name']);
    unset($fields['shipping']['shipping_company']);
    unset($fields['shipping']['shipping_country']);
    unset($fields['shipping']['shipping_address_1']);
    unset($fields['shipping']['shipping_address_2']);
    unset($fields['shipping']['shipping_city']);
    unset($fields['shipping']['shipping_postcode']);
    unset($fields['shipping']['shipping_state']);

    return $fields;

}

add_filter( 'woocommerce_shipping_fields' , 'quadlayers_remove_checkout_fields2' );
function quadlayers_remove_checkout_fields2($fields) {
  //  $fields['shipping_address_1']['required'] = false;
 //   $fields['shipping_city']['required'] = false;
    return $fields;
}

/* add custom checkout field */
//add_action( 'wc_new_fields', 'add_custom_checkout_field' );

function add_custom_checkout_field( $checkout ) {
    $current_user = wp_get_current_user();
    $billing_guests = $current_user->billing_guests;
    woocommerce_form_field( 'billing_guests', array(
        'type' => 'text',
        'class' => '',
        'label' => __('כמות המשתתפים', 'mit'),
        'placeholder' => '',
        'required' => true,
        'default' => $billing_guests,
    ), $checkout->get_value( 'billing_guests' ) );

    woocommerce_form_field( 'billing_check', array(
        'type' => 'text',
        'class' => '',
        'label' => __('כמות המשתתפים', 'mit'),
        'placeholder' => '',
        'required' => true,
        'default' => false,
    ), '' );
}


add_action( 'woocommerce_checkout_process', 'validate_new_checkout_field' );

function validate_new_checkout_field() {

    $shipping = WC()->session->get('chosen_shipping_methods');

    $shipping_time = isset($_POST['shipping_time']) ? sanitize_text_field($_POST['shipping_time']) : '';

    if ( ! $_POST['billing_guests'] ) {
        wc_add_notice( '<strong>'.__('כמות המשתתפים', 'mit').'</strong> '.__('is a required field.', 'yos') . $shipping_time, 'error' );
    }


    if ( ! $_POST['billing_check'] ) {
        wc_add_notice( '<strong>'.__('Need to accept', 'mit').'</strong> '.__('is a required field.', 'yos'), 'error' );
    }

    if ( ! $_POST['billing_check2'] ) {
        wc_add_notice( '<strong>'.__('Need to accept', 'mit').'</strong> '.__('is a required field.', 'yos'), 'error' );
    }



//    if ('flat_rate:2' === $shipping[0] && (empty($_POST['coderockz_woo_delivery_date_field']) || empty($_POST['coderockz_woo_delivery_time_field']))) {
//        wc_add_notice( '<strong>'.__('Select delivery date and time', 'mit').'</strong> '.__('is a required field.', 'yos'), 'error' );
//    }
//
//    if ('flat_rate:2' === $shipping[0] ) {
//        if (empty($_POST['shipping_address_1']))
//            wc_add_notice( '<strong>'.__('כתובת רחוב', 'mit').'</strong> '.__('הוא שדה חובה.', 'yos'), 'error' );
//
//        if (empty($_POST['shipping_city']))
//            wc_add_notice(  '<strong>'.__('עיר', 'mit').'</strong> '.__('הוא שדה חובה.', 'yos'), 'error' );
//
//    }
//    if ('local_pickup:1' === $shipping[0] && (empty($_POST['coderockz_woo_delivery_date_field']) || empty($_POST['coderockz_woo_delivery_time_field']))) {
//        wc_add_notice( '<strong>'.__('Select pick-up 1date and time', 'mit').'</strong> '.__('is a required field.', 'yos'), 'error' );
//    }

}

add_action( 'woocommerce_checkout_update_order_meta', 'save_new_checkout_field' );

function save_new_checkout_field( $order_id ) {
    if ( $_POST['billing_guests'] ) update_post_meta( $order_id, '_billing_guests', esc_attr( $_POST['billing_guests'] ) );
}

add_action( 'woocommerce_thankyou', 'show_new_checkout_field_thankyou' );

function show_new_checkout_field_thankyou( $order_id ) {
    if ( get_post_meta( $order_id, '_billing_guests', true ) ) echo '<p><strong>'. __('כמות המשתתפים', 'yos').': </strong> ' . get_post_meta( $order_id, '_billing_guests', true ) . '</p>';
}

add_action( 'woocommerce_admin_order_data_after_billing_address', 'show_new_checkout_field_order' );

function show_new_checkout_field_order( $order ) {
    $order_id = $order->get_id();
    if ( get_post_meta( $order_id, '_billing_guests', true ) ) echo '<p><strong>'. __('כמות המשתתפים', 'yos').': </strong> ' . get_post_meta( $order_id, '_billing_guests', true ) . '</p>';
}

add_action( 'woocommerce_email_after_order_table', 'show_new_checkout_field_emails', 20, 4 );

function show_new_checkout_field_emails( $order, $sent_to_admin, $plain_text, $email ) {
    if ( get_post_meta( $order->get_id(), '_billing_guests', true ) ) echo '<p><strong>'. __('כמות המשתתפים', 'yos').': </strong> ' . get_post_meta( $order->get_id(), '_billing_guests', true ) . '</p>';
}


remove_action('woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20);
add_action('woocommerce_payment_placement', 'woocommerce_checkout_payment', 20);


add_filter( 'woocommerce_form_field', 'bbloomer_remove_optional_checkout_fields', 9999 );

function bbloomer_remove_optional_checkout_fields( $field ) {
    $field = str_replace( '&nbsp;<span class="optional">(אופציונלי)</span>', '', $field );
    return $field;
}

add_action('template_redirect', function(){
    // Only redirect if cart is not empty AND we're on cart page or adding to cart
    if ((is_cart() || isset($_GET['add-to-cart'])) && !WC()->cart->is_empty()) {
        wp_redirect(get_permalink(12));
        exit;
    }
});

//add_action('woocommerce_cart_calculate_fees', 'discount_every_second_same_item');

function discount_every_second_same_item() {
    $cart = WC()->cart;
    $items = $cart->get_cart();
    $total_discount = 0;

    foreach ($items as $cart_item_key => $cart_item) {
        $quantity = $cart_item['quantity'];

        // Проверяем, что количество товара больше 1
        if ($quantity > 1) {
            $product_price = $cart_item['data']->get_price();

            // Считаем, сколько товаров попадают под скидку
            $discount_quantity = floor($quantity / 2);

            // Считаем общую сумму скидки для этого товара
            $total_discount += $product_price * $discount_quantity * 0.5;
        }
    }

    if ($total_discount > 0) {
        $cart->add_fee(__('Discount on every second item', 'woocommerce'), -$total_discount);
    }
}

// Apply custom multi-day rental pricing to cart - using higher priority 9999 to ensure it runs after other hooks
add_action('woocommerce_before_calculate_totals', 'apply_rental_discount_pricing', 9999, 1);
add_action('woocommerce_cart_loaded_from_session', 'trigger_cart_update', 99);

// Trigger cart update when loaded from session
function trigger_cart_update($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }
    
    // Force recalculation of totals
    if (WC()->cart) {
        WC()->cart->calculate_totals();
        error_log('Triggered cart update to refresh prices');
    }
}

function apply_rental_discount_pricing($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }

    // Avoid infinite loops
    static $is_calculating = false;
    if ($is_calculating) {
        return;
    }
    $is_calculating = true;

    error_log('RUNNING DIRECT CART PRICING CALCULATION - Cart items count: ' . count($cart->get_cart()));
    
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Debug cart item data
        error_log('Cart item data: ' . print_r($cart_item, true));
        
        // Skip if there are no rental dates
        if (!isset($cart_item['rental_dates']) || empty($cart_item['rental_dates'])) {
            continue;
        }
        
        $rental_dates = $cart_item['rental_dates'];
        $product = $cart_item['data'];
        $product_id = $product->get_id();
        $base_price = floatval($product->get_regular_price());
        
        // Convert date strings to dates
        $date_array = explode(' - ', $rental_dates);
        if (count($date_array) != 2) {
            continue; // Skip if date format is invalid
        }
        
        $start_date_str = trim($date_array[0]);
        $end_date_str = trim($date_array[1]);
        
        try {
            $start_date = DateTime::createFromFormat('d.m.Y', $start_date_str);
            $end_date = DateTime::createFromFormat('d.m.Y', $end_date_str);
            if (!$start_date || !$end_date) {
                error_log('Invalid date format for rental_dates: ' . $rental_dates);
                continue;
            }
            // Use our weekend-aware calculation function to get proper rental days
            $rental_days = calculateRentalDaysPhp($start_date, $end_date);
            
            error_log('Calculating price for ' . $rental_days . ' days from ' . $start_date_str . ' to ' . $end_date_str . ' (with weekend rules applied)');
        } catch (Exception $e) {
            error_log('Error calculating days: ' . $e->getMessage());
            continue;
        }
        
        // Get the discount settings
        $discount_type = 'אחוז'; // Default type is percentage
        $discount_value = 50;    // Default value is 50%
        
        // Get custom discount settings if ACF is active
        if (function_exists('get_field')) {
            $custom_discount_type = get_field('select_discount', $product_id);
            $custom_discount_value = get_field('discount', $product_id);
            
            if (!empty($custom_discount_type)) {
                $discount_type = $custom_discount_type;
            }
            
            if (!empty($custom_discount_value)) {
                $discount_value = $custom_discount_value;
            }
        }
        
        error_log('DIRECT CALCULATION - Discount settings for product ' . $product_id . ' - Type: ' . $discount_type . ', Value: ' . $discount_value);

        // Calculate price based on rental days
        $item_price = 0;
        $quantity = $cart_item['quantity'];
        
        if ($rental_days == 1) {
            // Single day rental - just use base price
            $item_price = $base_price;
            error_log('DIRECT CALCULATION - Single day rental: ' . $item_price . '₪');
        } else {
            // Multi-day rental with custom discount
            if ($discount_value > 0) {
                if ($discount_type === 'אחוז') {
                    // Percentage discount on additional days
                    $first_day_price = $base_price; // First day full price
                    $discount_multiplier = (100 - $discount_value) / 100; // Convert percentage to multiplier
                    $discounted_price_per_day = $base_price * $discount_multiplier;
                    $additional_days_price = ($rental_days - 1) * $discounted_price_per_day;
                    $item_price = $first_day_price + $additional_days_price;
                    
                    error_log('DIRECT CALCULATION - Percentage discount (' . $discount_value . '%): First day: ' . $first_day_price . '₪, Additional ' . 
                        ($rental_days - 1) . ' days at ' . $discounted_price_per_day . '₪ per day = ' . $additional_days_price . '₪, Total: ' . $item_price . '₪');
                } 
                else if ($discount_type === 'סכום') {
                    // Fixed discount amount on additional days
                    $first_day_price = $base_price; // First day full price
                    $discounted_day_price = max($base_price - $discount_value, 0); // Apply discount but don't go below 0
                    $additional_days_price = ($rental_days - 1) * $discounted_day_price;
                    $item_price = $first_day_price + $additional_days_price;
                    
                    error_log('DIRECT CALCULATION - Fixed discount: First day: ' . $first_day_price . '₪, Additional ' . 
                        ($rental_days - 1) . ' days at ' . $discounted_day_price . '₪ per day = ' . $additional_days_price . '₪, Total: ' . $item_price . '₪');
                } else {
                    // Default 50% off additional days
                    $first_day_price = $base_price;
                    $discounted_day_price = $base_price * 0.5; // 50% of base price
                    $additional_days_price = ($rental_days - 1) * $discounted_day_price;
                    $item_price = $first_day_price + $additional_days_price;
                    
                    error_log('DIRECT CALCULATION - Fallback discount: First day: ' . $first_day_price . '₪, Additional ' . 
                        ($rental_days - 1) . ' days at ' . $discounted_day_price . '₪ per day = ' . $additional_days_price . '₪, Total: ' . $item_price . '₪');
                }
            } else {
                // No custom discount set, use default discount (50% off additional days)
                $first_day_price = $base_price;
                $discounted_day_price = $base_price * 0.5; // 50% of base price
                $additional_days_price = ($rental_days - 1) * $discounted_day_price;
                $item_price = $first_day_price + $additional_days_price;
                
                error_log('DIRECT CALCULATION - Default discount: First day: ' . $first_day_price . '₪, Additional ' . 
                    ($rental_days - 1) . ' days at ' . $discounted_day_price . '₪ per day = ' . $additional_days_price . '₪, Total: ' . $item_price . '₪');
            }
        }
        
        // Apply the calculated price directly to the cart item
        $unit_price = $item_price / $quantity;
        $current_price = $cart_item['data']->get_price();
        
        if ($unit_price != $current_price) {
            error_log('DIRECT CALCULATION - Updating price from ' . $current_price . '₪ to ' . $unit_price . '₪ per unit');
            $cart_item['data']->set_price($unit_price);
            
            // Store the calculated price in the cart item for reference
            $cart_item['rental_calculated_price'] = $item_price;
        }
    }
    
    $is_calculating = false;
}

// Display the custom field data in the cart
add_filter('woocommerce_get_item_data', 'display_custom_datepicker_field_in_cart', 10, 2);

function display_custom_datepicker_field_in_cart($item_data, $cart_item) {
    if (isset($cart_item['rental_dates'])) {
        $item_data[] = array(
            'key'   => __('Rental Dates', 'textdomain'),
            'value' =>  ($cart_item['rental_dates']),
        );
    }
    return $item_data;
}

// Save the custom field data with the order
add_action('woocommerce_checkout_create_order_line_item', 'save_custom_datepicker_field_to_order', 10, 4);

function save_custom_datepicker_field_to_order($item, $cart_item_key, $values, $order) {
    // Save rental dates if they exist in cart data
    if (isset($values['rental_dates']) && !empty($values['rental_dates'])) {
        $item->add_meta_data(__('Rental Dates', 'textdomain'), $values['rental_dates']);
        error_log('Order created - Saved rental dates to order item: ' . $values['rental_dates']);
        
        // Save additional rental information
        if (isset($values['rental_days'])) {
            $item->add_meta_data(__('Rental Days', 'textdomain'), $values['rental_days']);
        }
        
        if (isset($values['rental_start_date'])) {
            $item->add_meta_data(__('Rental Start Date', 'textdomain'), $values['rental_start_date']);
        }
        
        if (isset($values['rental_end_date'])) {
            $item->add_meta_data(__('Rental End Date', 'textdomain'), $values['rental_end_date']);
        }
        
        // Save discount information if available
        if (isset($values['discount_type']) && isset($values['discount_value'])) {
            $discount_text = $values['discount_type'] === 'אחוז' ? 
                $values['discount_value'] . '% ' . __('Discount', 'textdomain') : 
                __('Discount', 'textdomain') . ' ' . $values['discount_value'] . ' ₪';
            
            $item->add_meta_data(__('Applied Discount', 'textdomain'), $discount_text);
        }
    } else {
        // Try to get rental dates from session as a fallback
        $rental_dates = WC()->session->get('rental_dates_' . $item->get_product_id());
        if (!empty($rental_dates)) {
            $item->add_meta_data(__('Rental Dates', 'textdomain'), $rental_dates);
            error_log('Fallback - Retrieved rental dates from session: ' . $rental_dates);
        } else {
            error_log('Warning - No rental dates found for product ID: ' . $item->get_product_id());
        }
    }
}

// Display the custom field data in the order details
add_action('woocommerce_order_item_meta_end', 'display_custom_datepicker_field_in_order', 10, 4);

function display_custom_datepicker_field_in_order($item_id, $item, $order, $plain_text) {
    if ($item->get_meta('Rental Dates')) {
        echo '<p><strong>' . __('Rental Dates', 'textdomain') . ':</strong> ' . $item->get_meta('Rental Dates') . '</p>';
    }
}

// Direct price filter with highest priority
// Disable legacy pricing filters and actions
remove_filter('woocommerce_product_get_price','custom_rental_price_filter',99999);
remove_filter('woocommerce_product_variation_get_price','custom_rental_price_filter',99999);
remove_filter('woocommerce_cart_item_price','custom_cart_item_price_filter',99999);
remove_filter('woocommerce_cart_item_subtotal','custom_cart_item_subtotal_filter',99999);
remove_filter('woocommerce_cart_item_subtotal','override_cart_item_subtotal',100);
remove_filter('woocommerce_calculated_total','override_cart_total',100);
remove_action('woocommerce_review_order_after_cart_contents','add_cart_discount_details',10);
remove_action('woocommerce_cart_totals_after_order_total','add_cart_discount_details',10);
remove_action('woocommerce_review_order_after_cart_contents','add_discount_summary',10);
remove_action('woocommerce_cart_totals_after_order_total','add_discount_summary',10);
remove_action('wp_enqueue_scripts','add_cart_discount_css');
remove_action('woocommerce_review_order_after_cart_contents','add_cart_discount_js',10);

// Helper function to calculate custom price
function calculate_custom_price($product_id, $base_price, $rental_days) {
    // Default discount values
    $discount_type = 'אחוז'; // Default type is percentage
    $discount_value = 50;    // Default value is 50%
    
    // Get custom discount settings if ACF is active
    if (function_exists('get_field')) {
        $custom_discount_type = get_field('select_discount', $product_id);
        $custom_discount_value = get_field('discount', $product_id);
        
        if (!empty($custom_discount_type)) {
            $discount_type = $custom_discount_type;
        }
        
        if (!empty($custom_discount_value)) {
            $discount_value = $custom_discount_value;
        }
    }
    
    error_log('HELPER: Calculating price for product ' . $product_id . ', days: ' . $rental_days . 
              ', discount type: ' . $discount_type . ', value: ' . $discount_value);

    // Calculate price based on rental days
    if ($rental_days == 1) {
        // Single day rental - just use base price
        return $base_price;
    }
    
    // Apply discount to additional days
    if ($discount_type === 'אחוז') {
        // Percentage discount
        $first_day_price = $base_price; // First day full price
        $discount_multiplier = (100 - $discount_value) / 100; // Convert percentage to multiplier
        $discounted_price_per_day = $base_price * $discount_multiplier;
        $additional_days_price = ($rental_days - 1) * $discounted_price_per_day;
        $total_price = $first_day_price + $additional_days_price;
        
        error_log('HELPER PERCENTAGE: First day: ' . $first_day_price . ', Additional days: ' . 
                 $additional_days_price . ', Total: ' . $total_price);
        return $total_price;
    } 
    else if ($discount_type === 'סכום') {
        // Fixed amount discount
        $first_day_price = $base_price; // First day full price
        $discounted_day_price = max($base_price - $discount_value, 0); // Apply discount but don't go below 0
        $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        $total_price = $first_day_price + $additional_days_price;
        
        error_log('HELPER FIXED: First day: ' . $first_day_price . ', Additional days: ' . 
                 $additional_days_price . ', Total: ' . $total_price);
        return $total_price;
    } else {
        // Default 50% off additional days
        $first_day_price = $base_price;
        $additional_days = ($rental_days - 1) * ($base_price * 0.5);
        $total_price = $first_day_price + $additional_days;
        
        error_log('HELPER DEFAULT: First day: ' . $first_day_price . ', Additional days: ' . 
                 $additional_days . ', Total: ' . $total_price);
        return $total_price;
    }
}

// Add direct cart line total filter
add_filter('woocommerce_cart_item_subtotal', 'mitnafun_cart_item_subtotal_filter', 20, 3);

// Function to calculate rental days properly accounting for weekends (Friday & Saturday as 1 day)
function calculateRentalDaysPhp($start, $end) {
    // Make sure start date is before end date
    if ($start > $end) {
        $temp = $start;
        $start = $end;
        $end = $temp;
    }
    
    // Get day of week for start and end dates
    $start_day = (int)$start->format('w'); // 0 (Sunday) through 6 (Saturday)
    $end_day = (int)$end->format('w');
    
    // SPECIAL CASE: If booking is Friday to Sunday (5 to 0), count as 1 day
    if ($start_day === 5 && $end_day === 0) {
        error_log('SPECIAL CASE: Friday to Sunday rental counts as 1 day!');
        return 1;
    }
    
    // SPECIAL CASE: If booking is Thursday to Sunday (4 to 0), count as 2 days
    // This counts Thursday as 1 day + (Friday and Saturday together as 1 day)
    if ($start_day === 4 && $end_day === 0) {
        error_log('SPECIAL CASE: Thursday to Sunday rental counts as 2 days!');
        return 2;
    }
    
    // SPECIAL CASE: If booking is Wednesday to Sunday (3 to 0), count as 3 days
    // This counts Wednesday + Thursday as 2 days + (Friday and Saturday together as 1 day)
    if ($start_day === 3 && $end_day === 0) {
        error_log('SPECIAL CASE: Wednesday to Sunday rental counts as 3 days!');
        return 3;
    }
    
    // SPECIAL CASE: If booking is Tuesday to Sunday (2 to 0), count as 4 days
    // This counts Tuesday + Wednesday + Thursday as 3 days + (Friday and Saturday together as 1 day)
    if ($start_day === 2 && $end_day === 0) {
        error_log('SPECIAL CASE: Tuesday to Sunday rental counts as 4 days!');
        return 4;
    }
    
    // SPECIAL CASE: If booking is Monday to Sunday (1 to 0), count as 5 days
    // This counts Monday + Tuesday + Wednesday + Thursday as 4 days + (Friday and Saturday together as 1 day)
    if ($start_day === 1 && $end_day === 0) {
        error_log('SPECIAL CASE: Monday to Sunday rental counts as 5 days!');
        return 5;
    }
    
    // Basic calculation: number of nights stayed (do NOT include end date)
    $interval = $start->diff($end);
    $days = $interval->days; // Removed +1 to exclude end date
    
    // Check for weekend days (in Israel, Friday and Saturday)
    $hasWeekend = false;
    $weekendDaysCount = 0;
    $hasFriday = false;
    $hasSaturday = false;
    $tempWeekend = clone $start;
    
    // Count weekend days in the date range (excluding end date)
    $tempEndDate = clone $end;
    $tempEndDate->modify('-1 day'); // Exclude end date from weekend calculation
    
    // Count weekend days in the date range
    while ($tempWeekend <= $tempEndDate) {
        $dow = (int)$tempWeekend->format('w'); // 0 (Sunday) through 6 (Saturday)
        if ($dow === 5) { // Friday
            $hasFriday = true;
            $weekendDaysCount++;
            $hasWeekend = true;
        } else if ($dow === 6) { // Saturday
            $hasSaturday = true;
            $weekendDaysCount++;
            $hasWeekend = true;
        }
        $tempWeekend->modify('+1 day');
    }
    
    // Apply weekend rule: if both Friday and Saturday are included, count as 1 day
    if ($hasWeekend && $hasFriday && $hasSaturday) {
        $days = $days - $weekendDaysCount + 1;
        error_log('Applied weekend rule: Friday+Saturday count as 1 day');
    }
    
    error_log('PHP Rental days: ' . $days . ' (Nights stayed: ' . $interval->days . 
              ', Weekend days: ' . $weekendDaysCount . ')');
    
    return $days;
}

// Override the cart item subtotal directly
function mitnafun_cart_item_subtotal_filter($subtotal_html, $cart_item, $cart_item_key) {
    if (empty($cart_item['rental_dates'])) {
        return $subtotal_html;
    }
    
    $product    = $cart_item['data'];
    $product_id = $product->get_id();
    $base_price = floatval($product->get_regular_price());
    
    error_log('SUBTOTAL FILTER: Processing product ID ' . $product_id . ' with base price ' . $base_price);
    
    // Parse rental dates
    $dates = explode(' - ', $cart_item['rental_dates']);
    if (count($dates) !== 2) {
        error_log('SUBTOTAL FILTER: Invalid rental dates format: ' . $cart_item['rental_dates']);
        return $subtotal_html;
    }
    
    $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
    $end   = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
    if (!$start || !$end) {
        error_log('SUBTOTAL FILTER: Could not parse dates from: ' . $cart_item['rental_dates']);
        return $subtotal_html;
    }
    
    // Get day of week for start and end dates
    $start_day = (int)$start->format('w'); // 0 (Sunday) through 6 (Saturday)
    $end_day = (int)$end->format('w');
    
    // SPECIAL CASE: If booking is Friday to Sunday (5 to 0), count as 1 day
    if ($start_day === 5 && $end_day === 0) {
        error_log('SUBTOTAL FILTER: SPECIAL CASE - Friday to Sunday rental counts as 1 day!');
        $rental_days = 1;
    } else {
        // DYNAMIC: Calculate rental days from dates - needed for the price breakdown display
        // Now using weekend-aware calculation
        $rental_days = calculateRentalDaysPhp($start, $end);
    }
    
    // CRITICAL: Force update cart item rental days to ensure consistency BEFORE price calculation
    if ($rental_days != $cart_item['rental_days']) {
        error_log('CRITICAL DAYS MISMATCH: Cart shows ' . $cart_item['rental_days'] . ' days but should be ' . $rental_days . ' - Fixing this!');
        WC()->cart->cart_contents[$cart_item_key]['rental_days'] = $rental_days;
        // Also update the cart totals to refresh pricing when rental days change
        WC()->cart->calculate_totals();
    }
    
    error_log('SUBTOTAL FILTER: Using weekend-aware rental days: ' . $rental_days . ' for dates ' . $start->format('d.m.Y') . ' - ' . $end->format('d.m.Y'));
    // Get discount settings
    $discount_type  = 'אחוז';
    $discount_value = 50;
    if (function_exists('get_field')) {
        $custom_type = get_field('select_discount', $product_id);
        $custom_val  = get_field('discount', $product_id);
        
        if (!empty($custom_type)) {
            $discount_type = $custom_type;
        }
        if (!empty($custom_val)) {
            $discount_value = $custom_val;
        }
    }
    // Calculate prices exactly as in product page - for ONE unit
    $total_price_single = calculate_custom_price($product_id, $base_price, $rental_days);
    $full_price = $base_price * $rental_days;
    $savings = $full_price - $total_price_single;
    $additional_price = $total_price_single - $base_price;
    
    // Calculate total price for all units
    $total_price = $total_price_single * $cart_item['quantity'];
    
    error_log('SUBTOTAL FILTER: First day price: ' . $base_price . 
             ', Additional days price: ' . $additional_price . 
             ', Total for one unit: ' . $total_price . 
             ', Total for ' . $cart_item['quantity'] . ' units: ' . ($total_price * $cart_item['quantity']));
    
    // Build the discount label
    $discount_label = ($discount_type === 'אחוז') 
                      ? $discount_value . '% הנחה' 
                      : $discount_value . ' ₪ הנחה';
    
    // Get product name for the breakdown
    $product_name = $cart_item['data']->get_name();
    $quantity = $cart_item['quantity'];
    
    // Check if weekend days are included in the rental period
    $has_weekend = false;
    $temp_date = clone $start;
    while ($temp_date <= $end) {
        $dow = (int)$temp_date->format('w');
        if ($dow === 5 || $dow === 6) { // Friday or Saturday
            $has_weekend = true;
            break;
        }
        $temp_date->modify('+1 day');
    }
    
    // Build breakdown HTML with strikethrough for original price
    $breakdown  = '<div class="mitnafun-breakdown"><div class="breakdown-toggle">פירוט תמחור <span class="toggle-icon">+</span></div><div class="breakdown-content" style="display:none;">';
    $breakdown .= '<p><strong>' . esc_html($product_name) . ' x' . $quantity . '</strong></p>';
    $breakdown .= '<p><strong>' . $rental_days . ' ימים לחיוב</strong></p>';
    
    // Add weekend explanation if needed
    if ($has_weekend) {
        $breakdown .= '<p><strong>חשוב לדעת: ימי שישי ושבת נחשבים כיום אחד בלבד לחיוב.</strong></p>';
    }
    
    $breakdown .= '<p><strong>פירוט תמחור לתקופת השכירות:</strong></p><ul>';
    $breakdown .= '<li>יום ראשון: ' . wc_price($base_price) . ' (מחיר מלא)</li>';
    
    if ($rental_days > 1) {
        $breakdown .= '<li>' . ($rental_days - 1) . ' ימים נוספים: ' . wc_price($additional_price) . ' (' . $discount_label . ')</li>';
    }
    
    // Add original price with strikethrough, then the discounted price
    // First, calculate for a single unit
    $breakdown .= '</ul><p><strong>מחיר מקורי ליחידה: <span class="original-price">' . wc_price($full_price) . '</span></strong></p>';
    $breakdown .= '<p><strong>מחיר ליחידה: ' . wc_price($total_price_single) . ' (חסכת ' . wc_price($savings) . ')</strong></p>';
    
    // If we have more than one unit, show the total for all units
    if ($quantity > 1) {
        $full_price_all = $full_price * $quantity;
        $savings_all = $savings * $quantity;
        $breakdown .= '<p><strong>מחיר כולל ל-' . $quantity . ' יחידות: ' . wc_price($total_price) . '</strong></p>';
    }
    
    $breakdown .= '</div></div>';
    
    // Add custom JavaScript to show/hide breakdown when clicked - using unique IDs to prevent conflicts
    static $toggle_id = 0;
    $toggle_id++;
    $breakdown .= '<script>
    jQuery(document).ready(function($) { 
        $(".breakdown-toggle").off("click").on("click", function() {
            var icon = $(this).find(".toggle-icon");
            icon.text(icon.text() === "+" ? "-" : "+");
            $(this).next(".breakdown-content").slideToggle();
        });
    });
    </script>';
    
    // Override subtotal to show rental total - use the exact calculated total price
    $subtotal_html = wc_price($total_price);
    
    // Force update cart item data with correct price
    if (isset(WC()->cart->cart_contents[$cart_item_key]['data'])) {
        // Set the calculated price to ensure consistency
        WC()->cart->cart_contents[$cart_item_key]['data']->set_price($total_price_single);
        WC()->cart->cart_contents[$cart_item_key]['line_total'] = $total_price;
        WC()->cart->cart_contents[$cart_item_key]['line_subtotal'] = $total_price;
    }
    
    // Also update cart totals to reflect actual price
    WC()->cart->calculate_totals();
    
    return $subtotal_html . $breakdown;
}

// Display discount details in the cart and checkout
// Using different hooks to ensure visibility
remove_action('woocommerce_review_order_after_cart_contents', 'add_cart_discount_details');
remove_action('woocommerce_cart_totals_after_order_total', 'add_cart_discount_details');
remove_action('woocommerce_before_cart_totals', 'add_cart_discount_details');
remove_action('woocommerce_review_order_after_cart_contents', 'add_discount_summary');
remove_action('woocommerce_cart_totals_after_order_total', 'add_discount_summary');
remove_action('wp_enqueue_scripts','add_cart_discount_css');
remove_action('woocommerce_review_order_after_cart_contents','add_cart_discount_js',10);

// Use hooks that are guaranteed to work for displaying discount information
add_action('woocommerce_review_order_after_subtotal', 'add_cart_discount_details', 10);
add_action('woocommerce_after_cart_table', 'add_discount_summary', 10);
add_action('woocommerce_before_checkout_form', 'add_cart_discount_css', 10);
add_action('woocommerce_before_cart', 'add_cart_discount_css', 10);
add_action('wp_footer', 'add_breakdown_toggle_js', 20);

// Add JavaScript fix to update subtotals in the checkout page and cart
add_action('wp_footer', 'mitnafun_add_subtotal_fix_js', 99);

/**
 * Add JavaScript to fix the subtotal display directly on the frontend
 * This approach avoids messing with WooCommerce's internal calculations
 */
function mitnafun_add_subtotal_fix_js() {
    // Only add this JS on cart and checkout pages
    if (!is_cart() && !is_checkout()) {
        return;
    }
    
    // Get cart items for JS calculations
    $cart_items_data = [];
    
    foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['rental_dates'])) {
            // Extract rental dates
            $dates = explode(' - ', $cart_item['rental_dates']);
            if (count($dates) === 2) {
                $start_date = trim($dates[0]);
                $end_date = trim($dates[1]);
                
                // Get item data
                $product = $cart_item['data'];
                $product_name = $product->get_name();
                $price = floatval($cart_item['line_total']);
                $quantity = intval($cart_item['quantity']);
                
                // Add to our data array for JS
                $cart_items_data[] = [
                    'key' => $cart_item_key,
                    'name' => $product_name,
                    'dates' => $start_date . ' - ' . $end_date,
                    'price' => $price,
                    'quantity' => $quantity
                ];
            }
        }
    }
    
    // JSON encode our data for JavaScript
    $cart_items_json = json_encode($cart_items_data);
    
    // Output the JavaScript
    ?>
    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Cart item data from PHP
        var cartItems = <?php echo $cart_items_json; ?>;
        
        // Function to calculate correct subtotal
        function updateSubtotals() {
            // Don't run if we don't have any rental items
            if (!cartItems || cartItems.length === 0) {
                console.log('No rental items to fix, skipping subtotal correction');
                return;
            }
            
            var correctSubtotal = 0;
            
            // Sum up our specific line_total values
            cartItems.forEach(function(item) {
                correctSubtotal += item.price;
                console.log('Adding item price: ' + item.name + ' = ' + item.price);
            });
            
            console.log('Correct subtotal calculated: ' + correctSubtotal);
            
            // More aggressive approach: update ALL subtotal instances
            var subtotalElements = $('.cart-subtotal .woocommerce-Price-amount, .mitnafun-subtotal .woocommerce-Price-amount');
            console.log('Found ' + subtotalElements.length + ' subtotal elements to update');
            
            subtotalElements.each(function() {
                $(this).html(formatPrice(correctSubtotal));
                console.log('Updated subtotal display');
            });
            
            // Estimate shipping if there's no shipping data
            var shippingTotal = 0;
            var shipping = $('.shipping .amount');
            if (shipping.length > 0) {
                var shippingText = shipping.text().replace(/[^\d,.]/g, '');
                shippingTotal = parseFloat(shippingText.replace(',', '.')) || 0;
            }
            
            // Update total more aggressively too
            var totalElements = $('.order-total .woocommerce-Price-amount, .mitnafun-total .woocommerce-Price-amount');
            console.log('Found ' + totalElements.length + ' total elements to update');
            
            totalElements.each(function() {
                $(this).html(formatPrice(correctSubtotal + shippingTotal));
                console.log('Updated total display');
            });
            
            // Also fix any mini-cart subtotals
            var miniCartSubtotal = $('.widget_shopping_cart_content .woocommerce-mini-cart__total .woocommerce-Price-amount');
            if (miniCartSubtotal.length > 0) {
                miniCartSubtotal.html(formatPrice(correctSubtotal));
                console.log('Updated mini cart subtotal');
            }
        }
        
        // Format price with currency symbol
        function formatPrice(price) {
            return price.toFixed(2) + '&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span>';
        }
        
        // Run our update function after a short delay to let WooCommerce finish its own updates
        setTimeout(updateSubtotals, 500);
        
        // Run again after 1 second and 2 seconds to catch any delayed rendering
        setTimeout(updateSubtotals, 1000);
        setTimeout(updateSubtotals, 2000);
        
        // Also run whenever the cart updates
        $(document.body).on('updated_cart_totals', function() {
            setTimeout(updateSubtotals, 500);
            setTimeout(updateSubtotals, 1000); // Run again to be safe
        });
        
        // And when the checkout refreshes
        $(document.body).on('updated_checkout', function() {
            setTimeout(updateSubtotals, 500);
            setTimeout(updateSubtotals, 1000); // Run again to be safe
        });
        
        // Also after any AJAX completes (more aggressive approach)
        $(document).ajaxComplete(function() {
            setTimeout(updateSubtotals, 500);
        });
    });
    </script>
    <?php
}

// No longer needed - using JavaScript approach instead

/**
 * Add necessary CSS for discount displays
 */
function add_cart_discount_css() {
    ?>
    <style>
    /* Price breakdown styling */
    .mitnafun-breakdown {
        position: relative;
        clear: both;
    }
    
    .mitnafun-breakdown .breakdown-content {
        width: 240px;
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 1000;
        background: #f9f9f9;
        box-shadow: 0 1px 5px rgba(0,0,0,0.2);
        padding: 12px;
        border-radius: 4px;
        margin-top: 5px;
        font-size: 0.9em;
    }
    
    .rental-discount-row th, 
    .rental-discount-row td {
        padding: 10px !important;
    }
    
    .rental-discount-summary {
        margin: 10px 0;
    }
    
    .discount-amount {
        font-weight: bold !important;
    }
    
    /* Collapsible price breakdown styling */
    .mitnafun-breakdown {
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .breakdown-toggle {
        background-color: #f5f5f5;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .breakdown-toggle:hover {
        background-color: #e9e9e9;
    }
    
    .toggle-icon {
        font-size: 18px;
        font-weight: bold;
        margin-right: 5px;
    }
    
    .breakdown-content {
        padding: 10px 15px;
        background-color: #fff;
    }
    
    .breakdown-content p {
        margin: 5px 0;
    }
    
    .breakdown-content ul {
        margin: 8px 0;
        padding-right: 20px;
    }
    
    .breakdown-content li {
        margin-bottom: 5px;
    }
    </style>
    <?php
}

/**
 * Add JavaScript for the collapsible price breakdown
 */
function add_breakdown_toggle_js() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        // Initialize the toggle functionality
        function initBreakdownToggle() {
            $('.breakdown-toggle').off('click').on('click', function() {
                var content = $(this).next('.breakdown-content');
                var icon = $(this).find('.toggle-icon');
                
                content.slideToggle(200);
                
                if (icon.text() === '+') {
                    icon.text('-');
                } else {
                    icon.text('+');
                }
            });
        }
        
        // Initial setup
        initBreakdownToggle();
        
        // Re-initialize on AJAX cart updates
        $(document.body).on('updated_cart_totals updated_checkout', function() {
            initBreakdownToggle();
        });
        
        // Handle mini-cart updates
        $(document.body).on('wc_fragments_loaded wc_fragments_refreshed', function() {
            initBreakdownToggle();
        });
    });
    </script>
    <?php
}

// Override checkout review subtotal and total HTML to reflect rental pricing
add_filter('woocommerce_cart_totals_subtotal_html','mitnafun_override_subtotal_html',20,2);
function mitnafun_override_subtotal_html($subtotal_html,$cart){
    $total=0;
    foreach($cart->get_cart() as $item){
        if(!empty($item['rental_dates'])){
            list($start,$end)=array_map('trim',explode(' - ',$item['rental_dates']));
            $sd=DateTime::createFromFormat('d.m.Y',$start);
            $ed=DateTime::createFromFormat('d.m.Y',$end);
            if($sd&&$ed){
                $days=$sd->diff($ed)->days+1;
                $price=calculate_custom_price($item['data']->get_id(),floatval($item['data']->get_regular_price()),$days);
            }else{
                $price=$item['data']->get_price()*$item['quantity'];
            }
        }else{
            $price=$item['data']->get_price()*$item['quantity'];
        }
        $total+=$price;
    }
    return wc_price($total);
}
// Override checkout review order total to reflect rental pricing plus fees and shipping
add_filter('woocommerce_cart_totals_order_total_html','mitnafun_override_order_total_html',20,2);
function mitnafun_override_order_total_html($html,$cart){
    $subtotal=0;
    foreach($cart->get_cart() as $item){
        if(!empty($item['rental_dates'])){
            list($start,$end)=array_map('trim',explode(' - ',$item['rental_dates']));
            $sd=DateTime::createFromFormat('d.m.Y',$start);
            $ed=DateTime::createFromFormat('d.m.Y',$end);
            if($sd&&$ed){
                $days=$sd->diff($ed)->days+1;
                $price=calculate_custom_price($item['data']->get_id(),floatval($item['data']->get_regular_price()),$days);
            }else{
                $price=$item['data']->get_price()*$item['quantity'];
            }
        }else{
            $price=$item['data']->get_price()*$item['quantity'];
        }
        $subtotal+=$price;
    }
    $shipping=$cart->get_shipping_total()+$cart->get_shipping_tax();
    $fees=$cart->get_fee_total();
    $discounts=$cart->get_discount_total();
    $total=$subtotal+$shipping+$fees-$discounts;
    return wc_price($total);
}

// Clean rental pricing breakdown in order review
add_action('woocommerce_review_order_after_cart_contents','mitnafun_rental_pricing_breakdown',20);
function mitnafun_rental_pricing_breakdown(){
    foreach(WC()->cart->get_cart() as $cart_item_key => $cart_item){
        if(empty($cart_item['rental_dates'])) continue;
        $product    = $cart_item['data'];
        $product_id = $product->get_id();
        $base_price = floatval($product->get_regular_price());
        
        // Parse rental dates
        $dates = explode(' - ', $cart_item['rental_dates']);
        if (count($dates) !== 2) {
            continue;
        }
        $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
        $end   = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
        if (!$start || !$end) {
            continue;
        }
        // Use our weekend-aware calculation function instead of simple date difference
        $rental_days = calculateRentalDaysPhp($start, $end);
        
        // Get discount settings
        $discount_type  = 'אחוז';
        $discount_value = 50;
        if (function_exists('get_field')) {
            $custom_type = get_field('select_discount', $product_id);
            $custom_val  = get_field('discount', $product_id);
            
            if (!empty($custom_type)) {
                $discount_type = $custom_type;
            }
            if (!empty($custom_val)) {
                $discount_value = $custom_val;
            }
        }
        
        // Calculate prices
        $total_price = calculate_custom_price($product_id, $base_price, $rental_days);
        $full_price  = $base_price * $rental_days;
        $savings     = $full_price - $total_price;
        $additional_price = $total_price - $base_price;
        $discount_label = ($discount_type === 'אחוז')
                         ? $discount_value . '% הנחה'
                         : $discount_value . ' ₪ הנחה';
        
        // Output visible breakdown with clearer styling
        echo '<tr class="rental-pricing-breakdown" style="background:#f9f9f9;">';
        echo '<td colspan="2">';
        echo '<div style="margin:10px 0;padding:10px;border:1px solid #ddd;border-radius:5px;">';
        echo '<p style="font-weight:bold;margin-bottom:10px;color:#333;">פירוט תמחור לתקופת השכירות:</p>';
        echo '<ul style="list-style:none;padding-right:15px;margin:0;">';
        echo '<li style="margin-bottom:5px;">• יום ראשון: ' . wc_price($base_price) . ' (מחיר מלא)</li>';
        
        if ($rental_days > 1) {
            echo '<li style="margin-bottom:5px;">• ' . ($rental_days - 1) . ' ימים נוספים: ' . 
                 wc_price($additional_price) . ' (' . $discount_label . ')</li>';
        }
        
        echo '</ul>';
        echo '<p style="font-weight:bold;margin-top:10px;color:#333;">סה"כ: ' . wc_price($total_price) . 
             ' (חסכת ' . wc_price($savings) . ')</p>';
        echo '</div>';
        echo '</td>';
        echo '</tr>';
    }
}

// Remove any legacy breakdown actions (in case still present)
remove_action('woocommerce_review_order_after_cart_contents','mitnafun_rental_pricing_breakdown',20);

// Dedicated function for manual price calculation 
function calculate_rental_price_manually($product_id, $base_price, $rental_days, $quantity) {
    // Get the discount settings
    $discount_type = 'אחוז'; // Default type
    $discount_value = 50;    // Default 50% off
    
    // Get custom discount settings if ACF is active
    if (function_exists('get_field')) {
        $custom_discount_type = get_field('select_discount', $product_id);
        $custom_discount_value = get_field('discount', $product_id);
        
        if (!empty($custom_discount_type)) {
            $discount_type = $custom_discount_type;
        }
        
        if (!empty($custom_discount_value)) {
            $discount_value = floatval($custom_discount_value);
        }
    }
    
    error_log('MANUAL CALC: Product ' . $product_id . ', Base price: ' . $base_price . 
              ', Days: ' . $rental_days . ', Discount type: ' . $discount_type . 
              ', Discount value: ' . $discount_value);
    
    // Calculate price based on rental days
    if ($rental_days == 1) {
        // Single day rental - just base price
        return $base_price * $quantity;
    } else {
        // Multi-day rental with discount
        if ($discount_type === 'אחוז') {
            // Percentage discount
            $first_day_price = $base_price * $quantity;
            $discount_multiplier = (100 - $discount_value) / 100;
            $discounted_day_price = $base_price * $discount_multiplier;
            $additional_days_price = ($rental_days - 1) * $discounted_day_price * $quantity;
            $total_price = ($first_day_price + $additional_days_price);
            
            error_log('MANUAL CALC (percentage): First day: ' . $first_day_price . 
                      ', Additional days: ' . ($rental_days - 1) . ' at ' . $discounted_day_price . 
                      ' each = ' . $additional_days_price . ', Total: ' . $total_price);
            
            return $total_price;
        } 
        else if ($discount_type === 'סכום') {
            // Fixed amount discount
            $first_day_price = $base_price * $quantity;
            $discounted_day_price = max($base_price - $discount_value, 0) * $quantity;
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
            $total_price = ($first_day_price + $additional_days_price);
            
            error_log('MANUAL CALC (fixed): First day: ' . $first_day_price . 
                      ', Additional days: ' . ($rental_days - 1) . ' at ' . $discounted_day_price . 
                      ' each = ' . $additional_days_price . ', Total: ' . $total_price);
            
            return $total_price;
        } 
        else {
            // Default to 50% off additional days
            $first_day_price = $base_price * $quantity;
            $discounted_day_price = $base_price * 0.5 * $quantity;
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
            $total_price = ($first_day_price + $additional_days_price);
            
            error_log('MANUAL CALC (default): First day: ' . $first_day_price . 
                      ', Additional days: ' . ($rental_days - 1) . ' at ' . $discounted_day_price . 
                      ' each = ' . $additional_days_price . ', Total: ' . $total_price);
            
            return $total_price;
        }
    }
}

// Commenting out legacy filter removal and action hook to re-enable breakdown via subtotal filter
// remove_filter('woocommerce_cart_item_subtotal','mitnafun_cart_item_subtotal_filter',20);
// add_action('woocommerce_after_cart_item_name', 'mitnafun_after_cart_item_breakdown', 20, 2);

// Add pricing breakdown directly after each item in checkout
// add_action('woocommerce_after_cart_item_name', 'mitnafun_after_cart_item_breakdown', 20, 2);

// Show breakdown directly under each item
function mitnafun_after_cart_item_breakdown($cart_item, $cart_item_key) {
    error_log('DEBUG AFTER_ITEM_BREAKDOWN: key='. $cart_item_key .', rental_dates='. (isset($cart_item['rental_dates']) ? $cart_item['rental_dates'] : '[none]') .', data='. print_r($cart_item, true));
    // Skip if not in checkout or if not a rental item
    if (!is_checkout() || empty($cart_item['rental_dates'])) {
        return;
    }
    
    $product    = $cart_item['data'];
    $product_id = $product->get_id();
    $base_price = floatval($product->get_regular_price());
    
    // Parse rental dates
    $dates = explode(' - ', $cart_item['rental_dates']);
    if (count($dates) !== 2) {
        return;
    }
    
    $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
    $end   = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
    if (!$start || !$end) {
        return;
    }
    
    // Use our weekend-aware calculation function instead of simple date difference
    $rental_days = calculateRentalDaysPhp($start, $end);
    
    // Get discount settings
    $discount_type  = 'אחוז';
    $discount_value = 50;
    
    if (function_exists('get_field')) {
        $custom_type = get_field('select_discount', $product_id);
        $custom_val  = get_field('discount', $product_id);
        
        if (!empty($custom_type)) {
            $discount_type = $custom_type;
        }
        if (!empty($custom_val)) {
            $discount_value = $custom_val;
        }
    }
    
    // Calculate prices
    $total_price = calculate_custom_price($product_id, $base_price, $rental_days);
    $full_price  = $base_price * $rental_days;
    $savings     = $full_price - $total_price;
    $additional_price = $total_price - $base_price;
    
    $discount_label = ($discount_type === 'אחוז')
                     ? $discount_value . '% הנחה'
                     : $discount_value . ' ₪ הנחה';
    
    // Output visible breakdown with clearer styling
    echo '<tr class="rental-pricing-breakdown" style="background:#f9f9f9;">';
    echo '<td colspan="2">';
    echo '<div style="margin:10px 0;padding:10px;border:1px solid #ddd;border-radius:5px;">';
    echo '<p style="font-weight:bold;margin-bottom:10px;color:#333;">פירוט תמחור לתקופת השכירות:</p>';
    echo '<ul style="list-style:none;padding-right:15px;margin:0;">';
    echo '<li style="margin-bottom:5px;">• יום ראשון: ' . wc_price($base_price) . ' (מחיר מלא)</li>';
    
    if ($rental_days > 1) {
        echo '<li style="margin-bottom:5px;">• ' . ($rental_days - 1) . ' ימים נוספים: ' . 
             wc_price($additional_price) . ' (' . $discount_label . ')</li>';
    }
    
    echo '</ul>';
    echo '<p style="font-weight:bold;margin-top:10px;color:#333;">סה"כ: ' . wc_price($total_price) . 
         ' (חסכת ' . wc_price($savings) . ')</p>';
    echo '</div>';
    echo '</td>';
    echo '</tr>';
    
    // Output debug info in browser console for each breakdown
    echo '<script>console.log("DEBUG AFTER_ITEM_BREAKDOWN FRONT:", ' . wp_json_encode([
        'key' => $cart_item_key,
        'rental_dates' => $cart_item['rental_dates'],
        'total_price' => $total_price,
        'savings' => $savings,
    ]) . ');</script>';
}

// Persist rental dates in cart item data
add_filter('woocommerce_add_cart_item_data','mitnafun_add_rental_dates_cart_item_data',10,2);
add_filter('woocommerce_get_cart_item_from_session','mitnafun_get_cart_item_from_session',20,2);

/**
 * Store rental_dates from request into cart item and calculate rental days with weekend rule.
 */
function mitnafun_add_rental_dates_cart_item_data($cart_item_data, $product_id){
    error_log('DEBUG ADD_CART_ITEM_DATA: POST[rental_dates] = '. (isset($_POST['rental_dates']) ? sanitize_text_field(wp_unslash($_POST['rental_dates'])) : '[none]'));
    error_log('DEBUG ADD_CART_ITEM_DATA: initial cart_item_data = '. print_r($cart_item_data, true));
    
    if(!empty($_POST['rental_dates'])){
        $rental_dates = sanitize_text_field(wp_unslash($_POST['rental_dates']));
        $cart_item_data['rental_dates'] = $rental_dates;
        
        // Calculate rental days with weekend rule
        $dates = explode(' - ', $rental_dates);
        if (count($dates) === 2) {
            $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
            $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
            
            if ($start && $end) {
                // Use our weekend-aware calculation function
                $rental_days = calculateRentalDaysPhp($start, $end);
                $cart_item_data['rental_days'] = $rental_days;
                
                error_log('Added rental_days to cart: ' . $rental_days . ' (weekend-aware calculation)'); 
            }
        }
    }
    
    error_log('DEBUG ADD_CART_ITEM_DATA: returning cart_item_data = '. print_r($cart_item_data, true));
    return $cart_item_data;
}

/**
 * Reload rental_dates and rental_days from session onto cart item.
 */
function mitnafun_get_cart_item_from_session($cart_item, $session_item){
    error_log('DEBUG GET_CART_ITEM_FROM_SESSION: session_item = '. print_r($session_item, true));
    
    if (!empty($session_item['rental_dates'])) {
        $cart_item['rental_dates'] = $session_item['rental_dates'];
        
        // Preserve rental_days from session if available
        if (!empty($session_item['rental_days'])) {
            $cart_item['rental_days'] = $session_item['rental_days'];
            error_log('Preserved rental_days from session: ' . $session_item['rental_days']);
        } else {
            // If rental_days not in session, recalculate with weekend rule
            $dates = explode(' - ', $session_item['rental_dates']);
            if (count($dates) === 2) {
                $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                
                if ($start && $end) {
                    // Use our weekend-aware calculation function
                    $rental_days = calculateRentalDaysPhp($start, $end);
                    $cart_item['rental_days'] = $rental_days;
                    error_log('Recalculated rental_days for session cart item: ' . $rental_days);
                }
            }
        }
    }
    
    error_log('DEBUG GET_CART_ITEM_FROM_SESSION: returning cart_item = '. print_r($cart_item, true));
    return $cart_item;
}

// Helper: calculate cart rental subtotal
if ( ! function_exists( 'mitnafun_get_cart_rental_subtotal' ) ) {
    function mitnafun_get_cart_rental_subtotal() {
        $total = 0;
        foreach ( WC()->cart->get_cart() as $item ) {
            if ( ! empty( $item['rental_dates'] ) ) {
                list( $start, $end ) = array_map( 'trim', explode( ' - ', $item['rental_dates'] ) );
                $sd = DateTime::createFromFormat( 'd.m.Y', $start );
                $ed = DateTime::createFromFormat( 'd.m.Y', $end );
                if ( $sd && $ed ) {
                    $days = $sd->diff( $ed )->days + 1;
                    $price = calculate_custom_price( $item['data']->get_id(), floatval( $item['data']->get_regular_price() ), $days );
                } else {
                    $price = $item['data']->get_price() * $item['quantity'];
                }
            } else {
                $price = $item['data']->get_price() * $item['quantity'];
            }
            $total += $price;
        }
        return $total;
    }
}
// Helper: calculate cart rental order total (subtotal + shipping + fees - discounts)
if ( ! function_exists( 'mitnafun_get_cart_rental_order_total' ) ) {
    function mitnafun_get_cart_rental_order_total() {
        $subtotal  = mitnafun_get_cart_rental_subtotal();
        $shipping  = WC()->cart->get_shipping_total() + WC()->cart->get_shipping_tax();
        $fees      = WC()->cart->get_fee_total();
        $discounts = WC()->cart->get_discount_total();
        return $subtotal + $shipping + $fees - $discounts;
    }
}

// Translate metadata labels to Hebrew
add_filter('woocommerce_attribute_label', 'mitnafun_translate_attribute_labels', 10, 3);
add_filter('woocommerce_display_item_meta', 'mitnafun_customize_order_item_meta', 10, 3);

/**
 * Translate attribute labels to Hebrew
 */
function mitnafun_translate_attribute_labels($label, $name = '', $product = null) {
    // Translate specific attribute labels
    if ($label === 'Rental Dates') {
        return 'תאריכי השכרה';
    }
    
    return $label;
}

/**
 * Customize how order item meta is displayed in cart and checkout
 */
function mitnafun_customize_order_item_meta($html, $item, $args) {
    // Get the original meta data
    $strings = array();
    $html = '';
    
    // Get item data - either from OrderItem or CartItem
    if (is_a($item, 'WC_Order_Item')) {
        $meta_data = $item->get_formatted_meta_data('_', true);
    } else {
        return $html; // Return original if not an order item
    }
    
    if (!empty($meta_data)) {
        foreach ($meta_data as $meta_id => $meta) {
            $value = $args['autop'] ? wp_kses_post($meta->display_value) : wp_kses_post(make_clickable(trim($meta->display_value)));
            
            // Translate the label
            $translated_key = $meta->display_key;
            
            if ($meta->display_key === 'Rental Dates') {
                $translated_key = 'תאריכי השכרה';
            }
            
            $strings[] = '<strong class="wc-item-meta-label">' . wp_kses_post($translated_key) . ':</strong> ' . $value;
        }
    }
    
    if ($strings) {
        $html = $args['before'] . implode($args['separator'], $strings) . $args['after'];
    }
    
    return $html;
}

// Add cart item data hooks for pickup/return times, save to order meta, and display in thank you, admin, and email
add_filter('woocommerce_add_cart_item_data', 'mitnafun_add_time_cart_item_data', 10, 2);
function mitnafun_add_time_cart_item_data($cart_item_data, $product_id) {
    if (!empty($_POST['pickup_time'])) {
        $cart_item_data['pickup_time'] = sanitize_text_field($_POST['pickup_time']);
    }
    if (!empty($_POST['return_time'])) {
        $cart_item_data['return_time'] = sanitize_text_field($_POST['return_time']);
    }
    return $cart_item_data;
}

// Display pickup/return times in cart and checkout review
add_filter('woocommerce_get_item_data', 'mitnafun_display_time_cart_item_data', 10, 2);
function mitnafun_display_time_cart_item_data($item_data, $cart_item) {
    if (!empty($cart_item['pickup_time'])) {
        $item_data[] = array('name' => 'שעת איסוף', 'value' => esc_html($cart_item['pickup_time']));
    }
    if (!empty($cart_item['return_time'])) {
        $item_data[] = array('name' => 'שעת החזרה', 'value' => esc_html($cart_item['return_time']));
    }
    return $item_data;
}

// Save pickup and return times to order meta
add_action('woocommerce_checkout_update_order_meta', 'mitnafun_save_time_order_meta');
function mitnafun_save_time_order_meta($order_id) {
    if (!empty($_POST['pickup_time'])) {
        update_post_meta($order_id, '_pickup_time', sanitize_text_field($_POST['pickup_time']));
    }
    if (!empty($_POST['return_time'])) {
        update_post_meta($order_id, '_return_time', sanitize_text_field($_POST['return_time']));
    }
}

// Display pickup & return times on thank you page
add_action('woocommerce_thankyou', 'mitnafun_display_time_thankyou', 20);
function mitnafun_display_time_thankyou($order_id) {
    $pickup = get_post_meta($order_id, '_pickup_time', true);
    $return = get_post_meta($order_id, '_return_time', true);
    if ($pickup) echo '<p><strong>שעת איסוף:</strong> ' . esc_html($pickup) . '</p>';
    if ($return) echo '<p><strong>שעת החזרה:</strong> ' . esc_html($return) . '</p>';
}

// Display pickup & return times in admin order
add_action('woocommerce_admin_order_data_after_billing_address', 'mitnafun_display_time_admin_order', 10, 1);
function mitnafun_display_time_admin_order($order) {
    $order_id = $order->get_id();
    $pickup = get_post_meta($order_id, '_pickup_time', true);
    $return = get_post_meta($order_id, '_return_time', true);
    if ($pickup) echo '<p><strong>שעת איסוף:</strong> ' . esc_html($pickup) . '</p>';
    if ($return) echo '<p><strong>שעת החזרה:</strong> ' . esc_html($return) . '</p>';
}

// Display pickup & return times in emails
add_action('woocommerce_email_after_order_table', 'mitnafun_display_time_email', 20, 4);
function mitnafun_display_time_email($order, $sent_to_admin, $plain_text, $email) {
    $order_id = $order->get_id();
    $pickup = get_post_meta($order_id, '_pickup_time', true);
    $return = get_post_meta($order_id, '_return_time', true);
    if ($pickup) echo '<p><strong>שעת איסוף:</strong> ' . esc_html($pickup) . '</p>';
    if ($return) echo '<p><strong>שעת החזרה:</strong> ' . esc_html($return) . '</p>';
}
