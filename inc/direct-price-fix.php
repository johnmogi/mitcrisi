<?php
/**
 * Direct Price Fix for Multi-day Rentals
 * This file contains the core price calculation fixes
 */

if (!defined('ABSPATH')) {
    exit;
}

// Apply these filters at the earliest possible point in the price calculation
add_filter('woocommerce_before_calculate_totals', 'mf_recalculate_cart_totals', 10, 1);
add_filter('woocommerce_cart_item_price', 'mf_modify_cart_item_price', 999, 3);
add_filter('woocommerce_cart_item_subtotal', 'mf_modify_cart_item_subtotal', 999, 3);
add_filter('woocommerce_cart_subtotal', 'mf_modify_cart_subtotal', 999, 3);
add_filter('woocommerce_calculate_totals', 'mf_modify_cart_total', 999, 1);

// Debugging helper
function mf_debug_log($message) {
    error_log('PRICE FIX: ' . $message);
}

/**
 * The main function that recalculates cart totals with proper multi-day rental discounts
 */
function mf_recalculate_cart_totals($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }
    
    if (did_action('woocommerce_before_calculate_totals') >= 2) {
        return; // Prevent infinite loops
    }
    
    mf_debug_log('Running recalculation for cart items');
    
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['rental_days']) && $cart_item['rental_days'] > 1) {
            $product_id = $cart_item['product_id'];
            $product = $cart_item['data'];
            $base_price = floatval($product->get_regular_price());
            $rental_days = intval($cart_item['rental_days']);
            $quantity = $cart_item['quantity'];
            
            // Get discount settings
            $discount_type = 'אחוז'; // Default percentage discount
            $discount_value = 50;    // Default 50% discount
            
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
            
            // Calculate the discounted price
            $first_day_price = $base_price;
            $additional_days_price = 0;
            
            if ($discount_type === 'אחוז') {
                // Percentage discount
                $discount_multiplier = (100 - $discount_value) / 100;
                $discounted_day_price = $base_price * $discount_multiplier;
                $additional_days_price = ($rental_days - 1) * $discounted_day_price;
            } 
            else if ($discount_type === 'סכום') {
                // Fixed amount discount
                $discounted_day_price = max($base_price - $discount_value, 0);
                $additional_days_price = ($rental_days - 1) * $discounted_day_price;
            }
            
            $total_price = ($first_day_price + $additional_days_price);
            
            // Store the original price for display purposes
            $cart_item['original_price'] = $base_price * $rental_days;
            $cart_item['discounted_price'] = $total_price;
            $cart_item['discount_amount'] = ($base_price * $rental_days) - $total_price;
            
            // This is the key - modify the actual price in WooCommerce
            $cart_item['data']->set_price($total_price);
            
            mf_debug_log('Modified price for ' . $product->get_name() . 
                ': Original: ' . ($base_price * $rental_days) . 
                ', Discounted: ' . $total_price . 
                ', Discount: ' . (($base_price * $rental_days) - $total_price));
        }
    }
}

/**
 * Modify the item price display in cart
 */
function mf_modify_cart_item_price($price, $cart_item, $cart_item_key) {
    if (isset($cart_item['rental_days']) && $cart_item['rental_days'] > 1) {
        $product = $cart_item['data'];
        $base_price = floatval($product->get_regular_price());
        $rental_days = intval($cart_item['rental_days']);
        
        // Get discount settings
        $discount_type = 'אחוז'; // Default
        $discount_value = 50;    // Default
        
        if (function_exists('get_field')) {
            $custom_discount_type = get_field('select_discount', $cart_item['product_id']);
            $custom_discount_value = get_field('discount', $cart_item['product_id']);
            
            if (!empty($custom_discount_type)) {
                $discount_type = $custom_discount_type;
            }
            
            if (!empty($custom_discount_value)) {
                $discount_value = $custom_discount_value;
            }
        }
        
        // Calculate the discounted price
        $first_day_price = $base_price;
        $additional_days_price = 0;
        
        if ($discount_type === 'אחוז') {
            // Percentage discount
            $discount_multiplier = (100 - $discount_value) / 100;
            $discounted_day_price = $base_price * $discount_multiplier;
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        } 
        else if ($discount_type === 'סכום') {
            // Fixed amount discount
            $discounted_day_price = max($base_price - $discount_value, 0);
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        }
        
        $total_price = $first_day_price + $additional_days_price;
        
        return wc_price($total_price);
    }
    
    return $price;
}

/**
 * Modify the item subtotal display in cart
 */
function mf_modify_cart_item_subtotal($subtotal, $cart_item, $cart_item_key) {
    if (isset($cart_item['rental_days']) && $cart_item['rental_days'] > 1) {
        $product = $cart_item['data'];
        $base_price = floatval($product->get_regular_price());
        $rental_days = intval($cart_item['rental_days']);
        $quantity = $cart_item['quantity'];
        
        // Get discount settings
        $discount_type = 'אחוז'; // Default
        $discount_value = 50;    // Default
        
        if (function_exists('get_field')) {
            $custom_discount_type = get_field('select_discount', $cart_item['product_id']);
            $custom_discount_value = get_field('discount', $cart_item['product_id']);
            
            if (!empty($custom_discount_type)) {
                $discount_type = $custom_discount_type;
            }
            
            if (!empty($custom_discount_value)) {
                $discount_value = $custom_discount_value;
            }
        }
        
        // Calculate the discounted price
        $first_day_price = $base_price;
        $additional_days_price = 0;
        
        if ($discount_type === 'אחוז') {
            // Percentage discount
            $discount_multiplier = (100 - $discount_value) / 100;
            $discounted_day_price = $base_price * $discount_multiplier;
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        } 
        else if ($discount_type === 'סכום') {
            // Fixed amount discount
            $discounted_day_price = max($base_price - $discount_value, 0);
            $additional_days_price = ($rental_days - 1) * $discounted_day_price;
        }
        
        $total_price = ($first_day_price + $additional_days_price) * $quantity;
        
        return wc_price($total_price);
    }
    
    return $subtotal;
}

/**
 * Modify the cart subtotal
 */
function mf_modify_cart_subtotal($subtotal, $compound, $cart) {
    // Always use the direct approach to ensure consistency
    $new_subtotal = 0;
    $has_override = false;
    
    mf_debug_log('Recalculating subtotal for checkout display');
    
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Get the current line total displayed for this item
        $product = $cart_item['data'];
        $product_name = $product->get_name();
        
        // Check for weekend rentals specifically (Friday-Sunday)
        if (isset($cart_item['rental_dates'])) {
            $dates = explode(' - ', $cart_item['rental_dates']);
            if (count($dates) === 2) {
                $start_date = DateTime::createFromFormat('d.m.Y', trim($dates[0]));
                $end_date = DateTime::createFromFormat('d.m.Y', trim($dates[1]));
                
                if ($start_date && $end_date) {
                    // Check if this is a weekend rental
                    $start_day = (int)$start_date->format('w'); // 0 = Sunday, 5 = Friday, 6 = Saturday
                    $end_day = (int)$end_date->format('w');
                    
                    // Check specifically for the case shown in the line item
                    $current_line_total = $cart_item['line_total'];
                    mf_debug_log("Item: {$product_name}, line_total: {$current_line_total}");
                    
                    // Use the actual line_total that's displayed for the item in the cart
                    $new_subtotal += $current_line_total;
                    $has_override = true;
                    continue;
                }
            }
        }
        
        // Standard handling for non-rental or non-weekend items
        if (isset($cart_item['line_total'])) {
            $new_subtotal += $cart_item['line_total'];
        }
    }
    
    // Always use our calculated value to ensure consistency
    if ($has_override || !empty($cart->get_cart())) {
        mf_debug_log("Using direct line total approach: {$new_subtotal} vs original subtotal");
        return wc_price($new_subtotal);
    }
    
    return $subtotal;
}

/**
 * Modify the cart total
 */
function mf_modify_cart_total($cart) {
    // Always use the direct line_total approach to ensure consistency
    $new_total = 0;
    $shipping_total = $cart->get_shipping_total();
    $fee_total = $cart->get_fee_total();
    
    mf_debug_log('Recalculating cart total for checkout display');
    
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        // Get the current line total displayed for this item
        $product = $cart_item['data'];
        $product_name = $product->get_name();
        if (isset($cart_item['line_total'])) {
            $new_total += $cart_item['line_total'];
        }
    }

    $final_total = $new_total + $shipping_total + $fee_total;

    if (!empty($cart->get_cart())) {
        $cart->set_total($final_total);
    }
    
    return $cart;
}

// Force replacement of checkout table HTML with our correct prices
add_filter('woocommerce_checkout_before_order_review', 'mf_force_correct_order_totals', 999);

function mf_force_correct_order_totals() {
    // Only run on checkout page
    if (!is_checkout()) {
        return;
    }
    
    // Get the cart and calculate the correct total from line items
    $cart = WC()->cart;
    if (!$cart || $cart->is_empty()) {
        return;
    }
    
    // Calculate correct total directly from line items
    $true_total = 0;
    foreach ($cart->get_cart() as $cart_item) {
        if (isset($cart_item['line_total'])) {
            $true_total += $cart_item['line_total'];
        }
    }
    
    if ($true_total <= 0) {
        return;
    }
    
    // Print debug info
    echo '<!-- PRICE DEBUG: Correct total calculated: ' . $true_total . ' -->';
    
    // Add a direct observer that will check and fix totals after page render
    add_action('wp_footer', function() use ($true_total) {
        echo '<script type="text/javascript">
        document.addEventListener("DOMContentLoaded", function() {
            // Direct Total Set
            var correctTotal = ' . $true_total . ';
            var formattedTotal = correctTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "&nbsp;<span class=\"woocommerce-Price-currencySymbol\">₪</span>";
            
            // Find and replace all instances of subtotal and total
            function updateUI() {
                console.log("⚡ Setting fixed price: " + correctTotal);
                document.querySelectorAll(".cart-subtotal div:last-child .woocommerce-Price-amount").forEach(function(el) {
                    el.innerHTML = formattedTotal;
                });
                document.querySelectorAll(".order-total div:last-child .woocommerce-Price-amount").forEach(function(el) {
                    el.innerHTML = formattedTotal;
                });
                console.log("✅ Fixed price display complete");
            }

            // Run multiple times to ensure it takes effect
            updateUI();
            setTimeout(updateUI, 500);
            setTimeout(updateUI, 2000);
        });
        </script>';
    }, 999);
    
    // Force CSS to be applied
    echo '<style>
    .order-total .amount, .cart-subtotal .amount {
        transition: none !important;
    }
    </style>';
}
