<?php
/**
 * Date-Aware Stock Management for Mitnafun
 * 
 * Provides intelligent stock management that considers booking dates
 * to determine effective stock levels
 * 
 * @package Mitnafun
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get the effective stock level for a product on specific dates
 * 
 * This function takes into account existing bookings to determine
 * how many units of a product are actually available for a given date range
 * 
 * @param int $product_id Product ID
 * @param string $start_date Start date in 'Y-m-d' format
 * @param string $end_date End date in 'Y-m-d' format
 * @return int The effective stock level for the requested date range
 */
function mitnafun_get_effective_stock($product_id, $start_date = null, $end_date = null) {
    // Get the actual current stock
    $product = wc_get_product($product_id);
    if (!$product) {
        return 0;
    }
    
    $current_stock = $product->get_stock_quantity();
    
    // If stock is already 0 or no dates provided, return current stock
    if ($current_stock <= 0 || !$start_date || !$end_date) {
        return $current_stock;
    }
    
    // Convert dates to DateTime objects for comparison
    $start = new DateTime($start_date);
    $end = new DateTime($end_date);
    
    // Initialize a date counter to track bookings per date
    $date_booking_counts = array();
    
    // Get all reserved date ranges for this product
    $reserved_date_ranges = mitnafun_get_reserved_date_ranges($product_id);
    
    // For each date in our range, count how many bookings exist
    $current_date = clone $start;
    while ($current_date <= $end) {
        $date_key = $current_date->format('Y-m-d');
        $date_booking_counts[$date_key] = 0;
        
        // Check each reserved range
        foreach ($reserved_date_ranges as $range) {
            $range_start = new DateTime($range['start_date']);
            $range_end = new DateTime($range['end_date']);
            
            // If current date falls within this range, increment count
            if ($current_date >= $range_start && $current_date <= $range_end) {
                $date_booking_counts[$date_key]++;
            }
        }
        
        // Move to next day
        $current_date->modify('+1 day');
    }
    
    // Find the maximum booking count for any date in our range
    $max_bookings = 0;
    foreach ($date_booking_counts as $date => $count) {
        if ($count > $max_bookings) {
            $max_bookings = $count;
        }
    }
    
    // Effective stock is current stock minus maximum bookings
    $effective_stock = $current_stock - $max_bookings;
    
    // Ensure we don't return negative stock
    return max(0, $effective_stock);
}

/**
 * Check if special last-item logic should apply
 * 
 * Instead of relying solely on stock quantity, this function considers
 * both stock and date-specific availability
 * 
 * @param int $product_id Product ID
 * @param string $start_date Start date in 'Y-m-d' format
 * @param string $end_date End date in 'Y-m-d' format
 * @return bool True if last-item logic should apply
 */
function mitnafun_is_last_item_booking($product_id, $start_date = null, $end_date = null) {
    // If no dates provided, fall back to regular stock check
    if (!$start_date || !$end_date) {
        $product = wc_get_product($product_id);
        return ($product && $product->get_stock_quantity() <= 1);
    }
    
    // Get effective stock for this date range
    $effective_stock = mitnafun_get_effective_stock($product_id, $start_date, $end_date);
    
    // Last item logic applies when effective stock is 1 or less
    return ($effective_stock <= 1);
}

/**
 * Get all reserved date ranges for a product
 * 
 * @param int $product_id Product ID
 * @return array Array of date ranges, each containing start_date and end_date
 */
function mitnafun_get_reserved_date_ranges($product_id) {
    $reserved_ranges = array();
    
    // Get all orders
    $args = array(
        'limit' => -1,
        'status' => array('processing', 'on-hold', 'completed'),
    );
    
    $orders = wc_get_orders($args);
    
    // Loop through each order
    foreach ($orders as $order) {
        // Loop through each item in the order
        foreach ($order->get_items() as $item_id => $item) {
            // Skip if not our product
            if ($item->get_product_id() != $product_id) {
                continue;
            }
            
            // Get the rental dates
            $dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
            if ($dates && strpos($dates, ' - ') !== false) {
                // Split the date range
                $date_parts = explode(' - ', $dates);
                
                // Convert from DD.MM.YYYY to YYYY-MM-DD
                $start_parts = explode('.', $date_parts[0]);
                $end_parts = explode('.', $date_parts[1]);
                
                if (count($start_parts) === 3 && count($end_parts) === 3) {
                    $start_date = "{$start_parts[2]}-{$start_parts[1]}-{$start_parts[0]}";
                    $end_date = "{$end_parts[2]}-{$end_parts[1]}-{$end_parts[0]}";
                    
                    $reserved_ranges[] = array(
                        'start_date' => $start_date,
                        'end_date' => $end_date,
                        'order_id' => $order->get_id(),
                        'quantity' => $item->get_quantity()
                    );
                }
            }
        }
    }
    
    return $reserved_ranges;
}

/**
 * Check if a booking would conflict with existing bookings based on stock
 * 
 * @param int $product_id Product ID
 * @param string $start_date Start date in 'Y-m-d' format
 * @param string $end_date End date in 'Y-m-d' format
 * @return bool True if booking would conflict, false otherwise
 */
function mitnafun_booking_would_conflict($product_id, $start_date, $end_date) {
    $product = wc_get_product($product_id);
    if (!$product) {
        return true; // No product = conflict
    }
    
    $total_stock = $product->get_stock_quantity();
    
    // Effective stock for the selected dates
    $effective_stock = mitnafun_get_effective_stock($product_id, $start_date, $end_date);
    
    // If effective stock is 0, booking would conflict
    return ($effective_stock <= 0);
}

/**
 * Debug function to display current availability for a date range
 * 
 * @param int $product_id Product ID
 * @param string $start_date Start date in 'Y-m-d' format
 * @param string $end_date End date in 'Y-m-d' format
 * @return array Debug information
 */
function mitnafun_debug_date_availability($product_id, $start_date, $end_date) {
    $product = wc_get_product($product_id);
    
    $debug = array(
        'product_id' => $product_id,
        'product_name' => $product ? $product->get_name() : 'Unknown',
        'current_stock' => $product ? $product->get_stock_quantity() : 0,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'effective_stock' => mitnafun_get_effective_stock($product_id, $start_date, $end_date),
        'is_last_item' => mitnafun_is_last_item_booking($product_id, $start_date, $end_date),
        'would_conflict' => mitnafun_booking_would_conflict($product_id, $start_date, $end_date),
        'reserved_ranges' => mitnafun_get_reserved_date_ranges($product_id)
    );
    
    return $debug;
}
