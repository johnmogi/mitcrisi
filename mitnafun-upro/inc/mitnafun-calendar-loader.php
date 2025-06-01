<?php
/**
 * Mitnafun Calendar Loader
 * Handles integration of the new calendar system with WordPress/WooCommerce
 * 
 * @package Mitnafun
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main calendar loader class
 */
class Mitnafun_Calendar_Loader {
    /**
     * Singleton instance
     */
    private static $instance = null;
    
    /**
     * Debug mode
     */
    private $debug = true;
    
    /**
     * Get the singleton instance
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Initialize hooks
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'), 100);
        
        // Disable fallback calendar (but keep its dependencies available)
        add_action('wp_enqueue_scripts', array($this, 'disable_old_calendar'), 999);
        
        // Add support for AJAX actions if needed
        add_action('wp_ajax_get_reserved_dates', array($this, 'ajax_get_reserved_dates'));
        add_action('wp_ajax_nopriv_get_reserved_dates', array($this, 'ajax_get_reserved_dates'));
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Only load on product pages
        if (!is_product()) {
            return;
        }
        
        // Check if the product is a rental product
        global $product;
        if (!$this->is_rental_product($product)) {
            return;
        }
        
        // Get the theme directory URI
        $theme_uri = get_stylesheet_directory_uri();
        
        // Register and enqueue loader script
        wp_register_script(
            'mitnafun-calendar-loader',
            $theme_uri . '/js/calendar-loader.js',
            array('jquery'),
            $this->get_file_version('js/calendar-loader.js'),
            true
        );
        
        // Register calendar script (but don't enqueue - the loader will do it dynamically)
        wp_register_script(
            'mitnafun-calendar',
            $theme_uri . '/js/mitnafun-calendar.js',
            array('jquery'),
            $this->get_file_version('js/mitnafun-calendar.js'),
            true
        );
        
        // Register calendar styles
        wp_register_style(
            'mitnafun-calendar',
            $theme_uri . '/css/mitnafun-calendar.css',
            array(),
            $this->get_file_version('css/mitnafun-calendar.css')
        );
        
        // Enqueue the main style
        wp_enqueue_style('mitnafun-calendar');
        
        // Pass data to loader script
        $calendar_data = $this->get_calendar_data($product);
        wp_localize_script('mitnafun-calendar-loader', 'mitnafunCalendarData', $calendar_data);
        
        // Enqueue loader script
        wp_enqueue_script('mitnafun-calendar-loader');
    }
    
    /**
     * Disable old calendar scripts
     */
    public function disable_old_calendar() {
        if (!is_product()) {
            return;
        }
        
        // We'll prevent the old calendar from initializing, but we
        // won't deregister the scripts because they might have dependencies
        
        // Add inline script to prevent old calendar from initializing
        wp_add_inline_script('jquery', '
            // Prevent old calendar from initializing
            window.preventOldCalendar = true;
        ', 'before');
    }
    
    /**
     * Check if a product is a rental product
     */
    private function is_rental_product($product) {
        if (!$product) {
            return false;
        }
        
        // Ensure we have a WC_Product object
        if (!($product instanceof WC_Product)) {
            $product = wc_get_product($product);
            if (!$product) {
                return false;
            }
        }
        
        // For now, assume all products are rental products
        // You may want to add a product meta check here to identify rental products
        return true;
    }
    
    /**
     * Get calendar data for JavaScript
     */
    private function get_calendar_data($product) {
        // Get business hours from custom field
        $business_hours = get_post_meta($product->get_id(), '_business_hours', true);
        if (!$business_hours) {
            $business_hours = array(
                'sunday' => array('09:00', '17:00'),
                'monday' => array('09:00', '17:00'),
                'tuesday' => array('09:00', '17:00'),
                'wednesday' => array('09:00', '17:00'),
                'thursday' => array('09:00', '17:00'),
                'friday' => array('09:00', '13:00'),
                'saturday' => array('closed', 'closed')
            );
        }

        // Get rental dates (use orders-based retrieval)
        if (function_exists('get_product_reserved_dates')) {
            $rental_dates = get_product_reserved_dates($product->get_id());
        } else {
            $rental_dates = get_post_meta($product->get_id(), '_rental_dates', true);
        }
        if (!is_array($rental_dates)) {
            $rental_dates = array();
        }

        // Get stock quantity and max rental days
        $stock_quantity = $product->get_stock_quantity();
        $max_rental_days = get_post_meta($product->get_id(), '_max_rental_days', true);
        if (!$max_rental_days) $max_rental_days = 7;

        // Get product-specific pickup time override
        $pickup_override = get_post_meta($product->get_id(), 'pickup_overide', true);
        if (!$pickup_override) $pickup_override = 13; // Default to 13:00 if not set

        // Get discount settings
        $discount_type_value = 'אחוז'; // Default type (percentage)
        $discount_value = 50;          // Default value (50%)

        // Get custom discount settings if ACF is active
        if (function_exists('get_field')) {
            $custom_discount_type = get_field('select_discount', $product->get_id());
            $custom_discount_value = get_field('discount', $product->get_id());
            
            if (!empty($custom_discount_type)) {
                $discount_type_value = $custom_discount_type;
            }
            
            if (!empty($custom_discount_value)) {
                $discount_value = $custom_discount_value;
            }
        }

        // Convert Hebrew discount type to JavaScript-friendly value
        $js_discount_type = ($discount_type_value === 'אחוז') ? 'percentage' : 'fixed';
        
        // Asset URLs
        $theme_uri = get_stylesheet_directory_uri();
        
        // Return data array for JavaScript
        return array(
            'booking_dates' => $rental_dates,
            'stock_quantity' => $stock_quantity,
            'max_rental_days' => $max_rental_days,
            'business_hours' => $business_hours,
            'pickup_override' => $pickup_override,
            'discount_type' => $js_discount_type,
            'discount_value' => $discount_value,
            'base_price' => $product->get_price(),
            'product_id' => $product->get_id(),
            'debug' => $this->debug,
            'js_url' => $theme_uri . '/js/mitnafun-calendar.js',
            'css_url' => $theme_uri . '/css/mitnafun-calendar.css',
            'is_rtl' => is_rtl(),
            'currency_symbol' => get_woocommerce_currency_symbol(),
            'ajax_url' => admin_url('admin-ajax.php')
        );
    }
    
    /**
     * Get the file version based on its modification time
     */
    private function get_file_version($relative_path) {
        $file_path = get_stylesheet_directory() . '/' . $relative_path;
        
        if (file_exists($file_path)) {
            return filemtime($file_path);
        }
        
        return '1.0.0';
    }
    
    /**
     * AJAX handler for getting reserved dates
     */
    public function ajax_get_reserved_dates() {
        // Check for product ID
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        
        if (!$product_id) {
            wp_send_json_error(array('message' => 'Invalid product ID'));
        }
        
        // Get reserved dates
        $rental_dates = get_post_meta($product_id, '_rental_dates', true);
        if (!$rental_dates) $rental_dates = array();
        
        // Send response
        wp_send_json_success(array(
            'reserved_dates' => $rental_dates
        ));
    }
}

// Initialize the loader
function mitnafun_calendar_loader_init() {
    return Mitnafun_Calendar_Loader::get_instance();
}

// Start the loader
mitnafun_calendar_loader_init();
