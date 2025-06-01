<?php
/**
 * Server-side handler for checkout time validation
 * Provides AJAX endpoint for returning scheduled returns for a specific date
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// AJAX handler to get returns for a specific date
add_action('wp_ajax_get_returns_for_date', 'mitnafun_get_returns_for_date');
add_action('wp_ajax_nopriv_get_returns_for_date', 'mitnafun_get_returns_for_date');

function mitnafun_get_returns_for_date() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'woocommerce-checkout')) {
        wp_send_json_error(array('message' => 'Security check failed'));
        exit;
    }

    // Get the date parameter
    $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
    if (empty($date)) {
        wp_send_json_error(array('message' => 'Date parameter is required'));
        exit;
    }

    global $wpdb;

    // Query to find orders with return date matching the requested date
    $query = $wpdb->prepare("
        SELECT 
            o.id as order_id,
            oi.order_item_id,
            oi.order_item_name as product_name,
            oim.meta_value as rental_dates,
            oim2.meta_value as product_id,
            o.status
        FROM {$wpdb->prefix}wc_orders o
        JOIN {$wpdb->prefix}woocommerce_order_items oi ON o.id = oi.order_id
        LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id AND oim.meta_key = %s
        LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim2 ON oi.order_item_id = oim2.order_item_id AND oim2.meta_key = %s
        WHERE o.status IN ('wc-completed', 'wc-processing', 'wc-rental-confirmed')
        AND oim.meta_value IS NOT NULL 
        AND oim.meta_value != ''
        LIMIT 500
    ", 'Rental Dates', '_product_id');

    $rentals = $wpdb->get_results($query);
    $returns_for_date = array();

    // Process the results to find returns on the requested date
    foreach ($rentals as $rental) {
        // Parse the rental dates
        $dates = explode(' - ', $rental->rental_dates);
        if (count($dates) !== 2) {
            continue;
        }

        // Convert DD.MM.YYYY to Y-m-d format for comparison
        $end_date = DateTime::createFromFormat('d.m.Y', $dates[1]);
        if (!$end_date) {
            continue;
        }

        $end_date_str = $end_date->format('Y-m-d');
        
        // If this rental ends on our target date
        if ($end_date_str === $date) {
            // Get the return time if available, otherwise use default
            $return_time = wc_get_order_item_meta($rental->order_item_id, 'Return Time', true);
            if (empty($return_time)) {
                $return_time = '11:00'; // Default return time
            }

            $returns_for_date[] = array(
                'order_id' => $rental->order_id,
                'product_id' => $rental->product_id,
                'product_name' => $rental->product_name,
                'return_time' => $return_time
            );
        }
    }

    wp_send_json_success(array('returns' => $returns_for_date));
    exit;
}
