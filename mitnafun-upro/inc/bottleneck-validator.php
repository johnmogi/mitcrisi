<?php
/**
 * Bottleneck Order Validator
 * Handles AJAX requests for validating pickup times when the same product is ordered multiple times
 */

// Don't allow direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * AJAX handler to get product reservations for a specific date
 */
function mitnafun_get_product_reservations() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mitnafun-pickup-time')) {
        wp_send_json_error('Invalid security token');
        return;
    }
    
    // Get product IDs
    $product_ids = isset($_POST['product_ids']) ? (array) $_POST['product_ids'] : [];
    
    // Get date
    $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
    
    if (empty($product_ids) || empty($date)) {
        wp_send_json_error('Missing required parameters');
        return;
    }
    
    // Convert date to standard format
    $date_obj = DateTime::createFromFormat('d.m.Y', $date);
    if (!$date_obj) {
        wp_send_json_error('Invalid date format');
        return;
    }
    
    // Get all reservations for these products on this date
    $reservations = [];
    
    global $wpdb;
    $meta_key = '_rental_dates';
    
    foreach ($product_ids as $product_id) {
        $product_id = intval($product_id);
        
        // Get all order items containing this product
        $order_items = $wpdb->get_results($wpdb->prepare(
            "SELECT order_item_id 
            FROM {$wpdb->prefix}woocommerce_order_items as order_items
            LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta as order_item_meta 
            ON order_items.order_item_id = order_item_meta.order_item_id
            WHERE order_item_meta.meta_key = '_product_id' 
            AND order_item_meta.meta_value = %d",
            $product_id
        ));
        
        if (empty($order_items)) {
            continue;
        }
        
        $order_item_ids = wp_list_pluck($order_items, 'order_item_id');
        
        if (empty($order_item_ids)) {
            continue;
        }
        
        // For each order item, get the rental dates
        foreach ($order_item_ids as $order_item_id) {
            $rental_dates = wc_get_order_item_meta($order_item_id, $meta_key, true);
            
            if (empty($rental_dates)) {
                continue;
            }
            
            // Check if this rental date range includes our date
            // Format is typically "dd.mm.yyyy - dd.mm.yyyy"
            $date_parts = explode(' - ', $rental_dates);
            
            if (count($date_parts) !== 2) {
                continue;
            }
            
            // Convert dates to DateTime objects
            $start_date_obj = DateTime::createFromFormat('d.m.Y', $date_parts[0]);
            $end_date_obj = DateTime::createFromFormat('d.m.Y', $date_parts[1]);
            
            if (!$start_date_obj || !$end_date_obj) {
                continue;
            }
            
            // Check if our date is within this range (inclusive)
            $check_date_str = $date_obj->format('Y-m-d');
            $start_date_str = $start_date_obj->format('Y-m-d');
            $end_date_str = $end_date_obj->format('Y-m-d');
            
            if ($check_date_str >= $start_date_str && $check_date_str <= $end_date_str) {
                // Get the order ID for this item
                $order_id = wc_get_order_id_by_order_item_id($order_item_id);
                
                // Get return time
                $return_time = get_post_meta($order_id, '_return_time', true);
                
                // If no specific return time, use default 12:00
                if (empty($return_time)) {
                    $return_time = '12:00';
                }
                
                // Add to reservations
                if (!isset($reservations[$product_id])) {
                    $reservations[$product_id] = [];
                }
                
                $reservations[$product_id][] = [
                    'order_id' => $order_id,
                    'return_time' => $return_time,
                    'rental_dates' => $rental_dates
                ];
            }
        }
    }
    
    wp_send_json_success($reservations);
}
add_action('wp_ajax_get_product_reservations', 'mitnafun_get_product_reservations');
add_action('wp_ajax_nopriv_get_product_reservations', 'mitnafun_get_product_reservations');

/**
 * AJAX handler to get cart contents
 */
function mitnafun_get_cart_contents() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mitnafun-pickup-time')) {
        wp_send_json_error('Invalid security token');
        return;
    }
    
    $cart_products = [];
    
    if (function_exists('WC') && WC()->cart) {
        foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
            $product_id = $cart_item['product_id'];
            $quantity = $cart_item['quantity'];
            
            $cart_products[] = [
                'product_id' => $product_id,
                'quantity' => $quantity
            ];
        }
    }
    
    wp_send_json_success($cart_products);
}
add_action('wp_ajax_get_cart_contents', 'mitnafun_get_cart_contents');
add_action('wp_ajax_nopriv_get_cart_contents', 'mitnafun_get_cart_contents');
