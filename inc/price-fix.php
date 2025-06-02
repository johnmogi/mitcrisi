<?php
/**
 * Emergency fix for zero prices
 * This file contains specific fixes for the zero price issue
 */

// Make sure this file is being included from WordPress
if (!defined('ABSPATH')) {
    exit;
}

// Add a high-priority filter to ensure product prices are never zero
add_filter('woocommerce_product_get_price', 'mitnafun_fix_zero_prices', 999999, 2);
add_filter('woocommerce_product_variation_get_price', 'mitnafun_fix_zero_prices', 999999, 2);
add_filter('woocommerce_product_get_regular_price', 'mitnafun_fix_zero_prices', 999999, 2);
add_filter('woocommerce_product_variation_get_regular_price', 'mitnafun_fix_zero_prices', 999999, 2);

/**
 * Ensures product prices are never zero
 */
function mitnafun_fix_zero_prices($price, $product) {
    // If the price is zero or empty, check the database directly
    if (empty($price) || $price <= 0) {
        // Get product ID 
        $product_id = $product->get_id();
        
        // First try to get the regular price from the product object
        $regular_price = $product->get_regular_price();
        
        // For variable products, get the default price
        if (empty($regular_price) && $product->is_type('variable')) {
            $default_attributes = $product->get_default_attributes();
            if (!empty($default_attributes)) {
                $variation_id = $product->get_matching_variation($default_attributes);
                if ($variation_id) {
                    $variation = wc_get_product($variation_id);
                    if ($variation) {
                        $regular_price = $variation->get_regular_price();
                    }
                }
            }
            
            // If still empty, get the min price
            if (empty($regular_price)) {
                $regular_price = $product->get_variation_price('min', true);
            }
        }
        
        // If we found a valid price, use it
        if (!empty($regular_price) && $regular_price > 0) {
            error_log('Price fix: Used regular price ' . $regular_price . ' for product ID ' . $product_id);
            return $regular_price;
        }
        
        // Last resort: get a fallback price from the database
        global $wpdb;
        $meta_value = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_value FROM {$wpdb->postmeta} 
            WHERE post_id = %d AND meta_key = '_regular_price'",
            $product_id
        ));
        
        // If we found a price, use it
        if (!empty($meta_value) && $meta_value > 0) {
            error_log('Price fix: Used database price ' . $meta_value . ' for product ID ' . $product_id);
            return $meta_value;
        }
        
        // If everything else fails, return a minimum default price
        error_log('Price fix: Using default 100 price for product ID ' . $product_id);
        return 100; // Default minimum price to avoid zeros
    }
    
    // Return the original price if it's valid
    return $price;
}

// Force WooCommerce to recalculate prices when products are loaded
add_action('woocommerce_before_single_product', 'mitnafun_clear_product_cache');
add_action('woocommerce_before_shop_loop', 'mitnafun_clear_product_cache');
add_action('woocommerce_before_cart', 'mitnafun_clear_product_cache');
add_action('woocommerce_before_checkout_form', 'mitnafun_clear_product_cache');

/**
 * Clears product caches to ensure fresh price data
 */
function mitnafun_clear_product_cache() {
    // Clear transient caches
    wc_delete_product_transients();
    
    // Log cache clearing
    error_log('Price fix: Cleared WooCommerce product caches');
}
