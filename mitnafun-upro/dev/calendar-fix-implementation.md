# Calendar Selection Fix - Implementation Guide

This document explains how to implement the emergency fix for calendar selection highlighting on your live site.

## What This Fix Does

1. Adds robust highlighting for both calendar systems (Fallback Calendar and Air Datepicker)
2. Works directly with your existing code without modifying it
3. Handles all scenarios including cross-month selections
4. Provides debug logging (can be disabled)
5. Self-contained in a single file

## Implementation Options

### Option 1: Via functions.php (Recommended)

Add this code to your theme's `functions.php`:

```php
/**
 * Enqueue calendar selection fix
 */
function mitnafun_enqueue_calendar_fix() {
    if (is_product()) {
        wp_enqueue_script(
            'calendar-selection-fix',
            get_stylesheet_directory_uri() . '/js/calendar-selection-fix.js',
            array('jquery'),
            time(), // Change to static version in production
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'mitnafun_enqueue_calendar_fix', 999);
```

### Option 2: Via WPCode Plugin

1. Upload the `calendar-selection-fix.js` file to your server
2. In WordPress admin, go to WPCode > Add Snippet
3. Create a new PHP snippet with this code:

```php
add_action('wp_enqueue_scripts', function() {
    if (is_product()) {
        wp_enqueue_script(
            'calendar-selection-fix',
            get_stylesheet_directory_uri() . '/js/calendar-selection-fix.js',
            array('jquery'),
            filemtime(get_stylesheet_directory() . '/js/calendar-selection-fix.js'),
            true
        );
    }
}, 999);
```

### Option 3: Quick Emergency Fix (Direct Script Tag)

If you need an immediate fix and don't want to modify PHP files, add this to your theme's footer.php or via WPCode's Footer HTML section:

```html
<!-- Emergency Calendar Fix -->
<script src="<?php echo get_stylesheet_directory_uri(); ?>/js/calendar-selection-fix.js"></script>
```

## Debugging

If you need to debug the fix:

1. Edit `calendar-selection-fix.js` and change `var DEBUG = false;` to `var DEBUG = true;`
2. Open browser console to see detailed logs
3. If needed, call `window.recoveryApplyCalendarHighlighting()` manually from console

## Compatibility Notes

This fix is compatible with both the Fallback Calendar system and Air Datepicker. It detects which one is in use and applies the appropriate fix.

## Additional Button Fix

This script handles calendar selection highlighting. For the checkout redirect functionality, make sure you have this code in your functions.php:

```php
// Force redirect to checkout after adding to cart
add_filter('woocommerce_add_to_cart_redirect', function($url) {
    return wc_get_checkout_url();
});
```
