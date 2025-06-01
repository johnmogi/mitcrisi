<?php
/**
 * Template Name: Calendar Test Page
 * 
 * Test page for the new Mitnafun Calendar implementation
 */

get_header();

// Get a sample product to use for the calendar
$args = array(
    'post_type' => 'product',
    'posts_per_page' => 1,
    'orderby' => 'date',
    'order' => 'DESC',
);

$products = get_posts($args);
$product_id = 0;
$product = null;

if (!empty($products)) {
    $product_id = $products[0]->ID;
    $product = wc_get_product($product_id);
}
?>

<div class="content-width calendar-test-page">
    <h1>Calendar Test Page</h1>
    <p>This page demonstrates the new calendar implementation for Mitnafun rental bookings.</p>
    
    <?php if ($product): ?>
        <div class="test-product-info">
            <h2>Test Product: <?php echo esc_html($product->get_name()); ?></h2>
            <p>ID: <?php echo esc_html($product_id); ?></p>
            <p>Price: <?php echo esc_html($product->get_price()); ?> ₪</p>
        </div>
    
        <div class="test-calendar-container">
            <h3>Calendar Implementation</h3>
            
            <div class="mitnafun-calendar-container" data-product-id="<?php echo esc_attr($product_id); ?>">
                <div id="datepicker-container-<?php echo esc_attr($product_id); ?>"></div>
                <div id="date-validation-message-<?php echo esc_attr($product_id); ?>"></div>
                <div id="max-duration-message-<?php echo esc_attr($product_id); ?>" style="display: none">ניתן להזמין עד <span id="max-days-<?php echo esc_attr($product_id); ?>">7</span> ימים</div>
            </div>
            
            <form class="test-rental-form" data-product-id="<?php echo esc_attr($product_id); ?>">
                <input type="hidden" id="rental_dates-<?php echo esc_attr($product_id); ?>" name="rental_dates" class="date-picker-field">
                <input type="hidden" id="rental_start_date-<?php echo esc_attr($product_id); ?>" name="rental_start_date">
                <input type="hidden" id="rental_end_date-<?php echo esc_attr($product_id); ?>" name="rental_end_date">
                
                <div class="pickup-time-row">
                    <label for="pickup_hour">שעת איסוף</label>
                    <select id="pickup_hour" name="pickup_hour" class="select2-time">
                        <option value="9">09:00</option>
                        <option value="10">10:00</option>
                        <option value="11">11:00</option>
                        <option value="12">12:00</option>
                        <option value="13" selected>13:00</option>
                        <option value="14">14:00</option>
                        <option value="15">15:00</option>
                        <option value="16">16:00</option>
                        <option value="17">17:00</option>
                    </select>
                </div>
                
                <div id="price-breakdown-container-<?php echo esc_attr($product_id); ?>" class="price-breakdown-container" style="display: none;"></div>
                
                <button type="button" class="add-to-cart-btn single_add_to_cart_button" data-product-id="<?php echo esc_attr($product_id); ?>" disabled>הוסף לסל</button>
            </form>
        </div>
        
        <div class="test-controls">
            <h3>Test Controls</h3>
            <button type="button" id="toggle-weekend">הפעל/כבה סופ"ש</button>
            <button type="button" id="toggle-rtl">החלף כיוון טקסט</button>
            <button type="button" id="add-test-dates">הוסף תאריכים תפוסים</button>
            <button type="button" id="clear-reserved-dates">נקה תאריכים תפוסים</button>
            <button type="button" id="clear-log">נקה לוג</button>
        </div>
        
        <div class="test-logs">
            <h3>Test Logs</h3>
            <pre id="test-log"></pre>
        </div>
    <?php else: ?>
        <div class="error-message">
            <p>No products found. Please create at least one WooCommerce product to test the calendar.</p>
        </div>
    <?php endif; ?>
    
    <script>
        // Override the standard product data for testing
        window.bookedDates = [];
        window.stockQuantity = 1;
        window.maxRentalDays = 7;
        window.businessHours = {
            'sunday': ['09:00', '17:00'],
            'monday': ['09:00', '17:00'],
            'tuesday': ['09:00', '17:00'],
            'wednesday': ['09:00', '17:00'],
            'thursday': ['09:00', '17:00'],
            'friday': ['09:00', '13:00'],
            'saturday': ['closed', 'closed']
        };
        window.productPickupTime = 13;
        window.discountType = 'percentage';
        window.discountValue = 50;
        window.basePrice = <?php echo $product ? $product->get_price() : 550; ?>;
        
        // Load additional libraries
        document.addEventListener('DOMContentLoaded', function() {
            // Create a div for test controls if it doesn't exist
            if (!document.getElementById('calendar-test-controls')) {
                var testControls = document.createElement('div');
                testControls.id = 'calendar-test-controls';
                document.querySelector('.test-controls').appendChild(testControls);
            }
            
            // Safely append scripts with error handling
            function loadScript(src, callback) {
                try {
                    var script = document.createElement('script');
                    script.src = src;
                    script.onload = callback || function() {};
                    script.onerror = function() {
                        console.error('Failed to load script:', src);
                    };
                    document.head.appendChild(script);
                } catch (err) {
                    console.error('Error appending script:', err);
                }
            }
            
            // Safely append stylesheets with error handling
            function loadStyle(href) {
                try {
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = href;
                    document.head.appendChild(link);
                } catch (err) {
                    console.error('Error appending stylesheet:', err);
                }
            }
            
            // Load libraries in sequence
            var librariesLoaded = 0;
            var requiredLibraries = 2; // Flatpickr and Select2
            
            function checkAllLibrariesLoaded() {
                librariesLoaded++;
                if (librariesLoaded >= requiredLibraries) {
                    loadScript('<?php echo get_stylesheet_directory_uri(); ?>/js/mitnafun-calendar.js');
                }
            }
            
            // Flatpickr
            if (typeof flatpickr === 'undefined') {
                loadStyle('https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');
                loadScript('https://cdn.jsdelivr.net/npm/flatpickr', function() {
                    loadScript('https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/he.js', checkAllLibrariesLoaded);
                });
            } else {
                checkAllLibrariesLoaded();
            }
            
            // Select2
            if (typeof jQuery.fn.select2 === 'undefined') {
                loadStyle('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
                loadScript('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', checkAllLibrariesLoaded);
            } else {
                checkAllLibrariesLoaded();
            }
            
            // Initialize test controls
            jQuery('#toggle-weekend').on('click', function() {
                logTestAction('Toggling weekend selection');
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.toggleWeekendMode();
                }
            });
            
            jQuery('#toggle-rtl').on('click', function() {
                logTestAction('Toggling RTL direction');
                jQuery('html').toggleClass('rtl');
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.refreshCalendar();
                }
            });
            
            jQuery('#add-test-dates').on('click', function() {
                logTestAction('Adding test reserved dates');
                // Add some random busy dates for the next two weeks
                const today = new Date();
                const busyDates = [];
                
                for (let i = 0; i < 5; i++) {
                    const randomDays = Math.floor(Math.random() * 14) + 1;
                    const busyDate = new Date(today);
                    busyDate.setDate(busyDate.getDate() + randomDays);
                    busyDates.push(busyDate);
                }
                
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.updateReservedDatesAndRefresh(busyDates);
                }
            });
            
            jQuery('#clear-reserved-dates').on('click', function() {
                logTestAction('Clearing all reserved dates');
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.clearReservedDates();
                }
            });
            
            jQuery('#clear-log').on('click', function() {
                jQuery('#test-log').html('');
                logTestAction('Log cleared');
            });
            
            // Add select2 to the pickup time field
            setTimeout(function() {
                jQuery('.select2-time').select2({
                    minimumResultsForSearch: Infinity,
                    dir: 'rtl'
                });
            }, 500);
        });
        
        // Test logging function
        function logTestAction(message) {
            const logOutput = document.getElementById('test-log');
            const timestamp = new Date().toLocaleTimeString();
            logOutput.innerHTML += `[${timestamp}] ${message}\n`;
            console.log(`[CalendarTest] ${message}`);
        }
    </script>
    
    <style>
        .calendar-test-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .test-calendar-container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .test-controls {
            margin: 20px 0;
            padding: 15px;
            background: #eaeaea;
            border-radius: 8px;
        }
        
        .test-controls button {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            margin: 0 5px 5px 0;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .test-controls button:hover {
            background: #2980b9;
        }
        
        .test-logs {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .test-logs pre {
            margin: 0;
            padding: 10px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
        }
        
        .pickup-time-row {
            margin: 20px 0;
        }
        
        .add-to-cart-btn {
            background: #27ae60;
            color: white;
            border: none;
            padding: 10px 20px;
            margin-top: 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .add-to-cart-btn:disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }
        
        html.rtl {
            direction: rtl;
        }
        
        html.rtl .test-controls button {
            margin: 0 0 5px 5px;
        }
    </style>
</div>

<?php
get_footer();
?>
