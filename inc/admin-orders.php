<?php
/**
 * Admin order display functions
 */

// Display rental dates in admin order details
add_action('woocommerce_before_order_itemmeta', 'display_rental_dates_in_admin_order', 10, 3);

function display_rental_dates_in_admin_order($item_id, $item, $product) {
    // Get rental dates metadata
    $rental_dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
    
    // Only display if we have rental dates
    if (!empty($rental_dates)) {
        echo '<div class="rental-dates-admin" style="margin: 10px 0; padding: 8px; background-color: #f8f8f8; border-left: 3px solid #2271b1;">';
        echo '<strong style="display: block; margin-bottom: 4px;">תאריכי השכרה:</strong>';
        echo '<span style="color: #2271b1; font-weight: bold;">' . esc_html($rental_dates) . '</span>';
        echo '</div>';
    }
}

// Add a custom column to the orders list
add_filter('manage_edit-shop_order_columns', 'add_rental_dates_column', 20);

function add_rental_dates_column($columns) {
    $new_columns = array();
    
    foreach ($columns as $column_name => $column_info) {
        $new_columns[$column_name] = $column_info;
        
        // Add our column after the order status column
        if ($column_name === 'order_status') {
            $new_columns['rental_dates'] = 'תאריכי השכרה';
        }
    }
    
    return $new_columns;
}

// Populate the rental dates column
add_action('manage_shop_order_posts_custom_column', 'populate_rental_dates_column', 10, 2);

function populate_rental_dates_column($column, $post_id) {
    if ($column === 'rental_dates') {
        $order = wc_get_order($post_id);
        $has_rental_dates = false;
        
        // Loop through order items
        foreach ($order->get_items() as $item_id => $item) {
            $rental_dates = wc_get_order_item_meta($item_id, 'Rental Dates', true);
            
            if (!empty($rental_dates)) {
                echo '<span style="font-weight: bold; color: #2271b1;">' . esc_html($rental_dates) . '</span>';
                echo '<br><small>' . esc_html($item->get_name()) . '</small>';
                $has_rental_dates = true;
            }
        }
        
        if (!$has_rental_dates) {
            echo '<span style="color: #999;">לא הוגדר</span>';
        }
    }
}

// Mark rental dates in admin item meta list
add_filter('woocommerce_hidden_order_itemmeta', 'highlight_rental_dates_meta');

function highlight_rental_dates_meta($hidden_meta) {
    // Remove Rental Dates from hidden meta to make sure it's visible
    $key = array_search('Rental Dates', $hidden_meta);
    if ($key !== false) {
        unset($hidden_meta[$key]);
    }
    return $hidden_meta;
}
