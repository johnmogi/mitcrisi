<?php
/**
 * Rental Pricing System
 * 
 * This file handles the multi-day rental pricing calculations and display
 * using standard WooCommerce hooks to ensure compatibility.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Debug helper function
function mitnafun_debug($message) {
    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        error_log('MITNAFUN RENTAL: ' . $message);
    }
}

/**
 * Calculate the discount for multi-day rentals
 * 
 * @param array $cart_item The cart item
 * @return array Discount information
 */
function mitnafun_calculate_rental_discount($cart_item) {
    // Default values if no discount is applicable
    $discount_info = array(
        'has_discount' => false,
        'original_price' => 0,
        'discounted_price' => 0,
        'discount_amount' => 0,
        'discount_type' => 'אחוז',
        'discount_value' => 0,
        'rental_days' => 1
    );
    
    // Check if this is a rental item with dates
    if (empty($cart_item['rental_dates'])) {
        return $discount_info;
    }
    
    // Use the stored rental_days value if it exists and is valid
    $rental_days = 1; // Default to 1 day
    if (isset($cart_item['rental_days']) && intval($cart_item['rental_days']) > 1) {
        $rental_days = intval($cart_item['rental_days']);
        error_log('RENTAL-PRICING: Using stored rental days from cart item: ' . $rental_days);
    } else {
        // Calculate rental days from dates using weekend-aware function
        $dates = explode(' - ', $cart_item['rental_dates']);
        if (count($dates) === 2) {
            $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
            $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
            
            if ($start && $end) {
                // Use weekend-aware calculation from checkout.php
                if (function_exists('calculateRentalDaysPhp')) {
                    $rental_days = calculateRentalDaysPhp($start, $end);
                    error_log('RENTAL-PRICING: Calculated weekend-aware rental days: ' . $rental_days);
                } else {
                    // Fallback to simple date diff
                    $interval = $start->diff($end);
                    $rental_days = $interval->days + 1;
                    error_log('RENTAL-PRICING: Calculated basic rental days: ' . $rental_days);
                }
            }
        }
    }
    
    // If rental days is 1 or less, no discount applies
    if ($rental_days <= 1) {
        error_log('RENTAL-PRICING: No discount - only 1 rental day');
        return $discount_info;
    }
    
    $product_id = $cart_item['product_id'];
    $product = $cart_item['data'];
    $base_price = floatval($product->get_regular_price()); // Use regular price instead of get_price() to avoid loops
    $quantity = $cart_item['quantity'];
    
    // Get discount settings from ACF
    $discount_type = 'אחוז'; // Default percentage discount
    $discount_value = 50;      // Default 50% discount
    
    if (function_exists('get_field')) {
        $custom_type = get_field('select_discount', $product_id);
        $custom_val = get_field('discount', $product_id);
        
        if (!empty($custom_type)) {
            $discount_type = $custom_type;
        }
        if (!empty($custom_val)) {
            $discount_value = $custom_val;
        }
    }
    
    error_log('RENTAL-PRICING: Product ID: ' . $product_id . ', Base price: ' . $base_price . 
              ', Discount type: ' . $discount_type . ', Discount value: ' . $discount_value . 
              ', Rental days: ' . $rental_days);
    
    // IMPORTANT: Calculate price using the same logic as the product page and calculate_custom_price
    $first_day_price = $base_price; // First day full price
    $additional_days_price = 0;
    
    if ($discount_type === 'אחוז') {
        // Percentage discount
        $discount_multiplier = (100 - $discount_value) / 100;
        $discounted_day_price = $base_price * $discount_multiplier;
        $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        
        error_log('RENTAL-PRICING: Percentage discount: First day: ' . $first_day_price . ', Additional days: ' . 
                ($rental_days - 1) . ' × ' . $discounted_day_price . ' = ' . $additional_days_price);
    } else if ($discount_type === 'סכום') {
        // Fixed amount discount
        $discounted_day_price = max($base_price - $discount_value, 0);
        $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        
        error_log('RENTAL-PRICING: Fixed discount: First day: ' . $first_day_price . ', Additional days: ' . 
                ($rental_days - 1) . ' × ' . $discounted_day_price . ' = ' . $additional_days_price);
    }
    
    // Calculate the final prices
    $total_price = ($first_day_price + $additional_days_price);
    $original_price = $base_price * $rental_days;
    $discount_amount = $original_price - $total_price;
    
    // Apply quantity
    $total_price_with_quantity = $total_price * $quantity;
    $original_price_with_quantity = $original_price * $quantity;
    $discount_amount_with_quantity = $discount_amount * $quantity;
    
    error_log('RENTAL-PRICING: Single unit - Total price: ' . $total_price . ', Original price: ' . $original_price . 
            ', Discount amount: ' . $discount_amount);
    error_log('RENTAL-PRICING: With quantity ' . $quantity . ' - Total: ' . $total_price_with_quantity . 
            ', Original: ' . $original_price_with_quantity . ', Discount: ' . $discount_amount_with_quantity);
    
    // Build the discount info array
    $discount_info = array(
        'has_discount' => true,
        'original_price' => $original_price_with_quantity,
        'discounted_price' => $total_price_with_quantity,
        'discount_amount' => $discount_amount_with_quantity,
        'discount_type' => $discount_type,
        'discount_value' => $discount_value,
        'rental_days' => $rental_days
    );
    
    mitnafun_debug(sprintf(
        'Calculated discount for %s: Original: %s, Discounted: %s, Discount Amount: %s',
        $product->get_name(),
        $original_price_with_quantity,
        $total_price_with_quantity,
        $discount_amount_with_quantity
    ));
    
    return $discount_info;
}

/**
 * Check if the cart has any multi-day rental discounts
 * 
 * @return boolean True if any item has a multi-day rental discount
 */
function mitnafun_cart_has_rental_discount() {
    $has_discount = false;
    
    if (!function_exists('WC') || !isset(WC()->cart) || WC()->cart->is_empty()) {
        return false;
    }
    
    foreach (WC()->cart->get_cart() as $cart_item) {
        $discount_info = mitnafun_calculate_rental_discount($cart_item);
        if ($discount_info['has_discount']) {
            $has_discount = true;
            break;
        }
    }
    
    return $has_discount;
}

/**
 * Get the total discount amount for all rental items in the cart
 * 
 * @return float Total discount amount
 */
function mitnafun_get_total_rental_discount() {
    $total_discount = 0;
    
    if (!function_exists('WC') || !isset(WC()->cart) || WC()->cart->is_empty()) {
        return $total_discount;
    }
    
    foreach (WC()->cart->get_cart() as $cart_item) {
        $discount_info = mitnafun_calculate_rental_discount($cart_item);
        if ($discount_info['has_discount']) {
            $total_discount += $discount_info['discount_amount'];
        }
    }
    
    return $total_discount;
}

/**
 * Display the discount information in the cart and checkout
 */
function mitnafun_display_rental_discount_info() {
    if (!is_checkout()) {
        return;
    }

    $cart = WC()->cart;
    if (!$cart || $cart->is_empty()) {
        return;
    }

    $discount_total = 0;
    $has_rental_discount = false;

    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Force recalculation with weekend-aware function to ensure correct display
        if (!empty($cart_item['rental_dates']) && function_exists('calculateRentalDaysPhp')) {
            $dates = explode(' - ', $cart_item['rental_dates']);
            if (count($dates) === 2) {
                $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                if ($start && $end) {
                    $weekend_aware_days = calculateRentalDaysPhp($start, $end);
                    // Force update the rental days in the cart item
                    WC()->cart->cart_contents[$cart_item_key]['rental_days'] = $weekend_aware_days;
                    error_log('DISCOUNT_INFO: Force updated rental days to ' . $weekend_aware_days . ' for ' . $cart_item['data']->get_name());
                }
            }
        }
        
        // Calculate discount using our function
        $discount_info = mitnafun_calculate_rental_discount($cart_item);
        if (!empty($discount_info['discount_amount']) && $discount_info['discount_amount'] > 0) {
            $discount_total += $discount_info['discount_amount'] * $cart_item['quantity'];
            $has_rental_discount = true;
        }
    }

    if (!$has_rental_discount) {
        return; // Exit if no rental discount is present
    }
    
    $total_discount = mitnafun_get_total_rental_discount();
    
    if ($total_discount <= 0) {
        return;
    }
    
    ?>
    <div class="rental-discount-info">
        <div class="rental-discount-label"><?php echo esc_html('הנחת מתנפחים ליום נוסף'); ?></div>
        <div class="rental-discount-amount">
            <span class="original-price"><?php echo wc_price(WC()->cart->get_total()); ?></span>
            -<?php echo wc_price($total_discount); ?>
        </div>
    </div>
    <style>
        .rental-discount-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
            direction: rtl;
        }
        .rental-discount-label {
            font-weight: bold;
        }
        .rental-discount-amount {
            color: #4CAF50;
            font-weight: bold;
        }
        /* Add strikethrough style for original prices */
        .original-price {
            text-decoration: line-through;
            color: #999;
            margin-right: 5px;
        }
    </style>
    <?php
}

/**
 * Display detailed breakdown of multi-day rental pricing
 */
function mitnafun_display_rental_price_breakdown() {
    if (!mitnafun_cart_has_rental_discount()) {
        return;
    }
    
    ?>
    <div class="rental-price-breakdown">
        <h4><?php echo esc_html('פירוט הנחות יום נוסף'); ?></h4>
        <?php foreach (WC()->cart->get_cart() as $cart_item) : 
            // Force recalculation of rental days with weekend-aware logic
            if (!empty($cart_item['rental_dates'])) {
                $dates = explode(' - ', $cart_item['rental_dates']);
                if (count($dates) === 2) {
                    $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                    $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                    if ($start && $end && function_exists('calculateRentalDaysPhp')) {
                        // Override rental days with weekend-aware calculation
                        $cart_item['rental_days'] = calculateRentalDaysPhp($start, $end);
                    }
                }
            }
            
            $discount_info = mitnafun_calculate_rental_discount($cart_item);
            
            if (!$discount_info['has_discount']) {
                continue;
            }
            
            $product = $cart_item['data'];
            $product_name = $product->get_name();
            $rental_days = $discount_info['rental_days'];
            $quantity = $cart_item['quantity'];
            ?>
            
            <div class="rental-item-breakdown">
                <div class="rental-item-name"><?php echo esc_html($product_name); ?> x<?php echo esc_html($quantity); ?></div>
                <?php
                // Force recalculation of days using weekend-aware function to ensure correct display
                if (!empty($cart_item['rental_dates']) && function_exists('calculateRentalDaysPhp')) {
                    $dates = explode(' - ', $cart_item['rental_dates']);
                    if (count($dates) === 2) {
                        $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                        $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                        if ($start && $end) {
                            $rental_days = calculateRentalDaysPhp($start, $end);
                            error_log('RENTAL-PRICING-DISPLAY: Force recalculated rental days: ' . $rental_days);
                        }
                    }
                }
                ?>
                <div class="rental-item-days"><?php echo esc_html(sprintf('%d ימים', $rental_days)); ?></div>
                <?php if ($discount_info['discount_type'] === 'אחוז') : ?>
                    <div class="rental-item-discount">
                        <?php echo esc_html(sprintf('יום ראשון: 100%%, ימים נוספים: %d%%', (100 - $discount_info['discount_value']))); ?>
                    </div>
                <?php else : ?>
                    <div class="rental-item-discount">
                        <?php echo esc_html(sprintf('הנחה של %s ליום נוסף', wc_price($discount_info['discount_value']))); ?>
                    </div>
                <?php endif; ?>
                <div class="rental-item-savings">
                    <?php 
                    // Display original price with strikethrough
                    printf('מחיר מקורי: <span class="original-price">%s</span> ', wc_price($discount_info['original_price'])); 
                    ?>
                    <br>
                    <?php printf('חסכת: %s', wc_price($discount_info['discount_amount'])); ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <style>
        .rental-price-breakdown {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            direction: rtl;
        }
        .rental-price-breakdown h4 {
            margin-top: 0;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .rental-item-breakdown {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #ddd;
        }
        .rental-item-breakdown:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .rental-item-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .rental-item-days, .rental-item-discount {
            color: #666;
            font-size: 0.9em;
            margin: 3px 0;
        }
        .rental-item-savings {
            color: #4CAF50;
            font-weight: bold;
            margin-top: 5px;
        }
    </style>
    <?php
}

// Remove conflicting legacy cart price calculation hooks
remove_action('woocommerce_before_calculate_totals', 'calculate_rental_price', 20);
remove_action('woocommerce_before_calculate_totals', 'apply_rental_discount_pricing', 9999);
remove_filter('woocommerce_cart_item_price', 'custom_cart_item_price_filter', 99999, 3);
remove_filter('woocommerce_cart_item_subtotal', 'custom_cart_item_subtotal_filter', 99999, 3);
remove_filter('woocommerce_cart_item_subtotal', 'override_cart_item_subtotal', 100, 3);
remove_filter('woocommerce_calculated_total', 'override_cart_total', 100, 2);

// Apply multi-day rental pricing to cart items
add_action('woocommerce_before_calculate_totals', 'mitnafun_apply_rental_pricing_cart', 20);
function mitnafun_apply_rental_pricing_cart($cart) {
    if (!$cart || empty($cart->get_cart())) {
        return;
    }
    
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Calculate discount info - this sets up all the required calculations
        $discount_info = mitnafun_calculate_rental_discount($cart_item);
        
        // Double check weekend-aware calculation if we have rental dates
        if (!empty($cart_item['rental_dates'])) {
            $dates = explode(' - ', $cart_item['rental_dates']);
            if (count($dates) === 2) {
                $start = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                $end = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                
                if ($start && $end && function_exists('calculateRentalDaysPhp')) {
                    // Force recalculation with weekend-aware function
                    $weekend_aware_days = calculateRentalDaysPhp($start, $end);
                    
                    // Log and ensure we're using the correct rental days
                    error_log('FORCE RECALCULATION: ' . $start->format('d.m.Y') . ' - ' . $end->format('d.m.Y') . 
                              ' = ' . $weekend_aware_days . ' days (previous: ' . $discount_info['rental_days'] . ')');
                    
                    // Update the discount info with correct rental days
                    $discount_info['rental_days'] = $weekend_aware_days;
                }
            }
        }
        
        // Log the discount info for debugging
        if (function_exists('mitnafun_debug')) {
            mitnafun_debug('Calculated discount_info: ' . print_r($discount_info, true));
        }
        
        // If we have a valid discount calculation
        if (!empty($discount_info['has_discount'])) {
            // Get the unit price (total price divided by quantity)
            $unit_price = $discount_info['discounted_price'] / $cart_item['quantity'];
            
            // Set the product price to the discounted price
            $cart_item['data']->set_price($unit_price);
            
            // Store relevant information in cart item for later use
            if (!empty($discount_info['rental_days'])) {
                WC()->cart->cart_contents[$cart_item_key]['rental_days'] = $discount_info['rental_days'];
                error_log('SETTING CART RENTAL DAYS: ' . $discount_info['rental_days'] . ' for item ' . $cart_item_key);
            }
        }
    }
}

// Hook into WooCommerce to display discounts
add_action('woocommerce_review_order_before_order_total', 'mitnafun_display_rental_discount', 10);
add_action('woocommerce_review_order_after_cart_contents', 'mitnafun_display_rental_price_breakdown', 20);
add_action('woocommerce_cart_totals_before_order_total', 'mitnafun_display_rental_discount', 10);
add_action('woocommerce_cart_totals_after_subtotal', 'mitnafun_display_rental_price_breakdown', 20);

/**
 * Modify the cart item price display
 */
function mitnafun_custom_price_display($price, $cart_item, $cart_item_key) {
    $discount_info = mitnafun_calculate_rental_discount($cart_item);
    
    if (!$discount_info['has_discount']) {
        return $price;
    }
    
    $product = $cart_item['data'];
    $base_price = $product->get_price();
    $rental_days = $cart_item['rental_days'];
    
    // Return the discounted unit price
    return wc_price($discount_info['discounted_price'] / $cart_item['quantity']);
}
add_filter('woocommerce_cart_item_price', 'mitnafun_custom_price_display', 100, 3);

/**
 * Filter the subtotal display in the cart and checkout
 */
function mitnafun_custom_subtotal_display($subtotal, $cart_item, $cart_item_key) {
    $discount_info = mitnafun_calculate_rental_discount($cart_item);
    
    if (!$discount_info['has_discount']) {
        return $subtotal;
    }
    
    // Return the discounted subtotal
    return wc_price($discount_info['discounted_price']);
}
add_filter('woocommerce_cart_item_subtotal', 'mitnafun_custom_subtotal_display', 100, 3);

/**
 * Save the rental discount information with the order
 */
function mitnafun_save_rental_discount_to_order($order_id) {
    if (!mitnafun_cart_has_rental_discount()) {
        return;
    }
    
    $total_discount = mitnafun_get_total_rental_discount();
    
    if ($total_discount > 0) {
        update_post_meta($order_id, '_rental_discount_total', $total_discount);
        update_post_meta($order_id, '_has_rental_discount', 'yes');
    }
}
add_action('woocommerce_checkout_update_order_meta', 'mitnafun_save_rental_discount_to_order', 10, 1);

/**
 * Display rental discount information on the order admin page
 */
function mitnafun_display_admin_order_rental_discount($order) {
    $order_id = $order->get_id();
    $has_discount = get_post_meta($order_id, '_has_rental_discount', true);
    
    if ($has_discount !== 'yes') {
        return;
    }
    
    $total_discount = get_post_meta($order_id, '_rental_discount_total', true);
    
    if ($total_discount <= 0) {
        return;
    }
    
    ?>
    <div class="order_data_column">
        <h4><?php esc_html_e('הנחת מתנפחים ליום נוסף', 'woocommerce'); ?></h4>
        <p>
            <strong><?php esc_html_e('סכום ההנחה:', 'woocommerce'); ?></strong>
            <?php echo wc_price($total_discount); ?>
        </p>
    </div>
    <?php
}
add_action('woocommerce_admin_order_data_after_shipping_address', 'mitnafun_display_admin_order_rental_discount', 10, 1);

// Include the rental pricing system
add_action('init', function() {
    mitnafun_debug('Rental pricing system initialized');
});
