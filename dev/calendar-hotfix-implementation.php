<?php
/**
 * HOW TO IMPLEMENT THE CALENDAR HOTFIX
 * 
 * 1. Add this code to your functions.php file
 * 2. Clear any caching plugins if necessary
 * 3. Test the calendar on product pages
 */

/**
 * Enqueue the standalone calendar hotfix script
 */
function mitnafun_enqueue_calendar_hotfix() {
    // Only load on product pages
    if (is_product()) {
        wp_enqueue_script(
            'calendar-hotfix',
            get_stylesheet_directory_uri() . '/js/calendar-hotfix.js',
            array('jquery'),
            time(), // Prevent caching during testing, change to static version when confirmed working
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_calendar_hotfix', 999); // Very high priority to load last
