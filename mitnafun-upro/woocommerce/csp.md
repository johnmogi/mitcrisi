<?php
/**
 * The template for displaying product content in the single-product.php template
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.6.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

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

// Get rental dates
$rental_dates = get_post_meta($product->get_id(), '_rental_dates', true);
if (!$rental_dates) $rental_dates = array();

// Get stock quantity and max rental days
$stock_quantity = $product->get_stock_quantity();
$max_rental_days = get_post_meta($product->get_id(), '_max_rental_days', true);
if (!$max_rental_days) $max_rental_days = 14;

// Get product-specific pickup time override
$pickup_override = get_post_meta($product->get_id(), 'pickup_overide', true);
if (!$pickup_override) $pickup_override = 11; // Default to 11:00 if not set

// Get product-specific return time override raw
$return_override_raw = get_post_meta($product->get_id(), 'return_overide_copy', true);
$has_custom_return_override = !empty($return_override_raw);
if (!empty($return_override_raw)) {
    // Ensure format HH:MM
    $return_override = ctype_digit($return_override_raw) ? $return_override_raw . ':00' : $return_override_raw;
} else {
    $return_override = '10:00';
}

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

// Remove the default add to cart button
remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30);
?>
<!-- Embed air-datepicker.js directly in the head -->
<script type="text/javascript" src="<?php echo get_stylesheet_directory_uri(); ?>/js/air-datepicker.js"></script>
<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/css/air-datepicker.css">

<script>
    window.bookedDates = <?php echo ($stock_quantity > 1 ? '[]' : json_encode($rental_dates)); ?>;
    window.stockQuantity = <?php echo $stock_quantity; ?>;
    window.maxRentalDays = <?php echo $max_rental_days; ?>;
    window.businessHours = <?php echo json_encode($business_hours); ?>;
    window.productPickupTime = <?php echo $pickup_override; ?>;
    window.productReturnTime = '<?php echo esc_js($return_override); ?>';
    window.discountType = '<?php echo $js_discount_type; ?>';
    window.discountValue = <?php echo $discount_value; ?>;
    window.basePrice = <?php echo $product->get_price(); ?>;
    
    jQuery(document).ready(function($) {
        // Load CSS if needed
        if (!$('link[href*="air-datepicker.css"]').length) {
            $('<link>')
                .appendTo('head')
                .attr({
                    type: 'text/css',
                    rel: 'stylesheet',
                    href: '<?php echo get_stylesheet_directory_uri(); ?>/css/air-datepicker.css'
                });
        }
        
        // Check for AirDatepicker and wait if needed
        function checkAndInitDatepicker() {
            if (typeof AirDatepicker !== 'undefined') {
                initDatepicker();
                return true;
            }
            return false;
        }
        
        // Try immediately
        if (!checkAndInitDatepicker()) {
            // If not available, check multiple times with increasing delays
            var attempts = 0;
            var maxAttempts = 5;
            var checkInterval = setInterval(function() {
                console.log('Checking for AirDatepicker, attempt ' + (attempts + 1));
                if (checkAndInitDatepicker() || ++attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (attempts >= maxAttempts && typeof AirDatepicker === 'undefined') {
                        console.error('AirDatepicker library not loaded after ' + maxAttempts + ' attempts');
                        $('#datepicker-container').html('<p style="color:red;">Error loading date picker. Please refresh the page or contact support.</p>');
                    }
                }
            }, 500); // Check every 500ms
        }
        
        function initDatepicker() {
            try {
                const datepicker = new AirDatepicker('#datepicker-container', {
                    inline: true,
                    multipleDates: false,
                    range: true,
                    toggleSelected: false,
                    weekends: [6], // Only Saturday is weekend
                    minDate: new Date(),
                    dateFormat: 'dd.MM.yyyy',
                    // Add functionality to disable booked dates
                    onRenderCell: function(date, cellType) {
                        if (cellType === 'day') {
                            // Skip checking for disabled dates if it's a weekend
                            if (date.getDay() === 6) { // Saturday
                                return {
                                    disabled: true,
                                    classes: '-weekend-disabled-'
                                };
                            }
                            
                            // Parse and check against booked dates
                            let isDisabled = false;
                            let customClass = '';
                            
                            // Check if this date is in the booked dates array
                            if (window.bookedDates && window.bookedDates.length) {
                                for (let i = 0; i <window.bookedDates.length; i++) {
                                    // Parse the date range from the booking
                                    let dateRangeStr = window.bookedDates[i];
                                    let [startStr, endStr] = dateRangeStr.split(' - ');
                                    
                                    if (startStr && endStr) {
                                        let [startDay, startMonth, startYear] = startStr.split('.');
                                        let [endDay, endMonth, endYear] = endStr.split('.');
                                        
                                        let startDate = new Date(startYear, startMonth - 1, startDay);
                                        let endDate = new Date(endYear, endMonth - 1, endDay);
                                        
                                        // Check if current date is within the booked range
                                        if (date >= startDate && date <= endDate) {
                                            isDisabled = true;
                                            customClass = '-booked-';
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            return {
                                disabled: isDisabled,
                                classes: customClass
                            };
                        }
                    },
                    locale: {
                        days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                        daysShort: ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''],
                        daysMin: ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''],
                        months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                        monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                        today: 'היום',
                        clear: 'נקה',
                        firstDay: 0
                    },
                    onSelect: function({date, formattedDate, datepicker}) {
                        // Reset validation messages and form state
                        $('#date-validation-message').hide();
                        $('#max-duration-message').hide();
                        $('.single_add_to_cart_button').prop('disabled', true);
                        
                        if (!date) {
                            $('#rental_dates').val('');
                            $('[name="quantity"]').val(1).trigger('change');
                            return;
                        }
                        
                        // Handle single date selection
                        if (!Array.isArray(date)) {
                            const nextDay = new Date(date);
                            nextDay.setDate(nextDay.getDate() + 1);
                            
                            // Skip Saturday if needed
                            if (nextDay.getDay() === 6) {
                                nextDay.setDate(nextDay.getDate() + 1);
                            }
                            
                            datepicker.selectDate([date, nextDay]);
                            return;
                        }
                        
                        // Handle date range
                        if (Array.isArray(date) && date.length === 2) {
                            let startDate = date[0];
                            let endDate = date[1];
                            
                            if (startDate && endDate) {
                                let daysDiff = 0;
                                let currentDate = new Date(startDate);
                                
                                while (currentDate <= endDate) {
                                    // Skip Saturdays (6 is Saturday)
                                    if (currentDate.getDay() !== 6) {
                                        daysDiff++;
                                    }
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                                
                                // Calculate days between dates
                                const diffTime = Math.abs(endDate - startDate);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                let totalDays = diffDays;
                                
                                // Validate max rental period
                                if (diffDays > window.maxRentalDays) {
                                    $('#max-duration-message').show();
                                    return;
                                }
                                
                                // Update price breakdown
                                updatePriceBreakdown(window.basePrice, totalDays, window.discountType, window.discountValue);
                                
                                // Enable the add to cart button
                                $('.single_add_to_cart_button').prop('disabled', false);
                                
                                // Format and store dates for cart
                                $('#rental_dates').val(formattedDate.join(' - '));
                                $('#date-validation-message').show();
                            }
                        }
                    }
                });

                // Add clear selection button
                $('.air-datepicker--buttons').append(
                    $('<span>', {
                        class: 'air-datepicker-button air-datepicker-button--clear',
                        text: 'נקה בחירה',
                        click: function() {
                            datepicker.clear();
                            $('#rental_dates').val('');
                            $('[name="quantity"]').val(1).trigger('change');
                            $('.single_add_to_cart_button').prop('disabled', true);
                            $('#date-validation-message').hide();
                            $('#max-duration-message').hide();
                        }
                    })
                );

                // Initially disable the add to cart button until dates are selected
                $('.single_add_to_cart_button').prop('disabled', true);
                
                function updatePriceBreakdown(basePrice, totalDays, discountType, discountValue) {
                    console.log('%c PRICE DEBUG', 'background: #f0f; color: white; padding: 2px 5px; border-radius: 3px;', {
                        basePrice, 
                        totalDays, 
                        discountType, 
                        discountValue, 
                        source: 'updatePriceBreakdown'
                    });
                    
                    if (!basePrice || isNaN(basePrice)) {
                        console.error(' Invalid basePrice:', basePrice);
                        // Try to get basePrice from the DOM
                        try {
                            const priceTxt = $('.woocommerce-Price-amount').first().text().trim();
                            basePrice = parseFloat(priceTxt.replace(/[^0-9.,]/g, '').replace(',', '.'));
                            console.log(' Retrieved basePrice from DOM:', basePrice);
                        } catch (e) {
                            console.error('Failed to get basePrice from DOM:', e);
                            return;
                        }
                    }
                    
                    const $priceBreakdownList = $('#price-breakdown-list');
                    const $priceBreakdownTotal = $('#price-breakdown-total');
                    
                    // Clear existing list
                    $priceBreakdownList.empty();
                    
                    // Calculate prices
                    let additionalDaysPrice = 0;
                    let savings = 0;
                    let totalPrice = basePrice; // First day is always full price
                    
                    console.log(' Initial totalPrice', totalPrice);
                    
                    // If more than one day, calculate additional days with discount
                    if (totalDays > 1) {
                        const additionalDays = totalDays - 1;
                        console.log(' additionalDays', additionalDays);
                        
                        // Calculate based on discount type
                        if (discountType === 'percentage') {
                            // Calculate discounted price for additional days
                            const discountedDailyRate = basePrice * (1 - (discountValue / 100));
                            console.log(' discountedDailyRate (percentage)', discountedDailyRate);
                            additionalDaysPrice = discountedDailyRate * additionalDays;
                            
                            // Calculate savings (what full price would have been minus actual price)
                            savings = (basePrice * additionalDays) - additionalDaysPrice;
                        } else {
                            // Fixed discount
                            const discountedDailyRate = Math.max(0, basePrice - discountValue);
                            console.log(' discountedDailyRate (fixed)', discountedDailyRate);
                            additionalDaysPrice = discountedDailyRate * additionalDays;
                            
                            // Calculate savings (what full price would have been minus actual price)
                            savings = (basePrice * additionalDays) - additionalDaysPrice;
                        }
                        
                        // Add to total price
                        totalPrice += additionalDaysPrice;
                        console.log(' Final totalPrice', totalPrice, 'additionalDaysPrice', additionalDaysPrice, 'savings', savings);
                    }
                    
                    // Format the discount label
                    const discountLabel = (discountType === 'percentage') 
                        ? discountValue + '% הנחה' 
                        : discountValue + ' ₪ הנחה';
                    
                    console.log(' Building price breakdown HTML with label:', discountLabel);
                    
                    // Format price with Hebrew currency formatter
                    function formatCurrency(amount) {
                        return new Intl.NumberFormat('he-IL', { 
                            style: 'currency', 
                            currency: 'ILS',
                            minimumFractionDigits: 2
                        }).format(amount);
                    }
                    
                    // Create a direct HTML insertion to ensure consistent display
                    const directHtml = `
                    <div class="mitnafun-breakdown" style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; background-color: #f9f9f9; border-radius: 4px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">פירוט תמחור לתקופת השכירה:</p>
                        <ul style="list-style: none; padding-right: 15px; margin: 0 0 10px 0;">
                            <li style="margin-bottom: 5px;">יום ראשון: ${formatCurrency(basePrice)} (מחיר מלא)</li>
                            ${totalDays > 1 ? `<li style="margin-bottom: 5px;">${totalDays - 1} ימים נוספים: ${formatCurrency(additionalDaysPrice)} (${discountLabel})</li>` : ''}
                        </ul>
                        <p style="font-weight: bold; margin: 5px 0 0;">סה"כ: ${formatCurrency(totalPrice)} (חסכת ${formatCurrency(savings)})</p>
                    </div>
                    `;
                    
                    console.log('HTML Generated:', directHtml);
                    
                    // Remove any existing direct breakdowns first
                    $('.mitnafun-breakdown, .mitnafun-direct-breakdown').remove();
                    
                    // First, check for our container
                    if ($('#price-breakdown-container').length) {
                        console.log(' Using price-breakdown-container');
                        // Also update our container elements
                        $priceBreakdownList.append(`
                            <li>יום ראשון: ${formatCurrency(basePrice)} (מחיר מלא)</li>
                        `);
                        
                        if (totalDays > 1) {
                            $priceBreakdownList.append(`
                                <li>${totalDays - 1} ימים נוספים: ${formatCurrency(additionalDaysPrice)} (${discountLabel})</li>
                            `);
                        }
                        
                        $priceBreakdownTotal.html(`
                            <strong>סה"כ: ${formatCurrency(totalPrice)} (חסכת ${formatCurrency(savings)})</strong>
                        `);
                        
                        $('#price-breakdown-container').show();
                    }
                    
                    // Now insert our direct HTML as well, as a fallback
                    // After price amount
                    if ($('.woocommerce-Price-amount').length) {
                        console.log(' Inserting after .woocommerce-Price-amount');
                        $('.woocommerce-Price-amount').first().closest('.price').after(directHtml);
                    }
                    // After form-start
                    else if ($('.rental-form-start').length) {
                        console.log(' Inserting after .rental-form-start');
                        $('.rental-form-start').after(directHtml);
                    }
                    // After validation message
                    else if ($('#date-validation-message').length) {
                        console.log(' Inserting after #date-validation-message');
                        $('#date-validation-message').after(directHtml);
                    }
                    // Last resort - after add to cart
                    else if ($('.single_add_to_cart_button').length) {
                        console.log(' Inserting after .single_add_to_cart_button');
                        $('.single_add_to_cart_button').after(directHtml);
                    } else {
                        console.error(' Could not find insertion point for price breakdown');
                    }
                    
                    console.log(' Price breakdown update complete');
                    
                    // Store calculated values in a data attribute for debugging
                    $('body').attr('data-price-calc', JSON.stringify({
                        basePrice,
                        totalDays,
                        additionalDaysPrice,
                        totalPrice,
                        savings,
                        discountType,
                        discountValue,
                        timestamp: new Date().toISOString()
                    }));
                }
                
                function validateDateRange(startDate, endDate) {
                    // Check if dates are valid
                    if (startDate > endDate) {
                        return false;
                    }
                    
                    // Check if dates are within the allowed range
                    const minDate = new Date();
                    const maxDate = new Date(minDate);
                    maxDate.setDate(maxDate.getDate() + window.maxRentalDays);
                    
                    if (startDate < minDate || endDate > maxDate) {
                        return false;
                    }
                    
                    return true;
                }
            } catch (error) {
                console.error('Error initializing datepicker:', error);
                $('#datepicker-container').html('<p style="color:red;">Error loading date picker. Please refresh the page or contact support.</p>');
            }
        }
    });
</script>

<?php global $product; ?>
<script>
    // Make sure basePrice is always available globally
    window.basePrice = <?php echo wc_get_price_to_display($product); ?>;
    console.log('🌍 Global basePrice set to:', window.basePrice);
    
    // Log other global variables for debugging
    console.log('🌍 Global variables:', {
        discountType: window.discountType,
        discountValue: window.discountValue,
        maxRentalDays: window.maxRentalDays
    });
    
    // Delay and try to fetch values again for debugging
    setTimeout(function() {
        console.log('⏱️ After timeout, global variables:', {
            basePrice: window.basePrice,
            discountType: window.discountType,
            discountValue: window.discountValue
        });
        
        // Try forcing the price breakdown display directly
        if (typeof updatePriceBreakdown === 'function' && window.basePrice) {
            console.log('🔄 Attempting direct price breakdown update from timer');
            // Use default values if needed
            const baseP = window.basePrice || <?php echo wc_get_price_to_display($product); ?>;
            const days = 2; // Example: 2 days
            const discType = window.discountType || 'percentage';
            const discVal = window.discountValue || 50;
            
            // Call with fallback values
            updatePriceBreakdown(baseP, days, discType, discVal);
        }
    }, 2000);
</script>

<style>
.rental-form-section {
    margin: 20px 0;
    padding: 15px;
    background: #fff;
    border-radius: 5px;
}

.rental-form-section h3 {
    margin-bottom: 15px;
    font-size: 1.2em;
    color: #333;
}

.hours-selection {
    margin-top: 15px;
    padding: 15px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.hours-selection select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 10px;
}

.business-hours-info {
    margin-top: 10px;
    font-size: 0.9em;
    color: #666;
}

.business-hours-info ul {
    list-style: none;
    padding: 0;
    margin: 5px 0 0 0;
}

.business-hours-info li {
    margin-bottom: 5px;
}

.air-datepicker-button--clear {
    color: #666;
    font-size: 0.9em;
    cursor: pointer;
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
    margin-right: 10px;
}

.air-datepicker-button--clear:hover {
    background: #f0f0f0;
}

.price-breakdown-container {
    margin: 15px 0;
    padding: 15px;
    background-color: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}

.price-breakdown-container h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    font-size: 16px;
}

.price-breakdown-container ul {
    margin: 0 0 10px 0;
    padding-right: 20px;
}

.price-breakdown-container li {
    margin-bottom: 5px;
}

.price-breakdown-container p {
    margin: 5px 0 0;
    font-weight: bold;
    color: #333;
}
</style>

<section class="product-info">
    <div class="bg">
        <img src="<?= get_template_directory_uri() ?>/img/after-7.svg" alt="">
    </div>
    <div class="content-width">
        <?php do_action( 'woocommerce_before_single_product' ); ?>
        <div class="content">
            <?php do_action( 'woocommerce_before_single_product_summary' ); ?>

            <div class="text-wrap">
                <ul class="list-info">
                    <li>הסדנה 1, כפר סבא</li>
                </ul>

                <?php do_action( 'woocommerce_single_product_summary' ); ?>

                <p class="stock in-stock"><?php echo $product->get_stock_quantity(); ?> במלאי</p>

                <div class="rental-form-section">
                    <!-- Simple Notice - Always Visible at Top -->
                    <!-- <div id="simple-notice" class="return-time-notice info" style="margin-bottom: 15px; background-color: #e3f2fd; border: 1px solid #90caf9; padding: 8px; border-radius: 4px;">
                        <strong style="color: #1565c0;">שימו לב</strong>
                        <span> - בחרו תאריכי השכרה לקבלת מידע מלא</span>
                    </div> -->
                    
                    <!-- Early discount incentive message - only shown if there's an actual discount -->
                    <?php 
                    // Get discount type and value
                    $discount_type = get_post_meta($product->get_id(), 'discount_type', true);
                    $discount_value = get_post_meta($product->get_id(), 'discount_value', true);
                    
                    // Only show the discount message for percentage discount types
                    // Do not show for sum/fixed discounts or products without discounts
                    if (!empty($discount_type) && !empty($discount_value) && $discount_value > 0 && $discount_type == 'percentage') {
                        echo '<div class="discount-incentive-message" style="margin: 15px 0; padding: 10px; background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px; color: #0d47a1;">';
                        echo '<strong>⭐ מבצע השכרה!</strong> קבלו ' . $discount_value . '% הנחה על כל יום נוסף של השכרה!';
                        echo '</div>';
                    }
                    
                    // For global JS, still provide discount variables, with fallbacks if not set
                    if (empty($discount_type) || empty($discount_value) || $discount_value <= 0) {
                        $discount_type = 'percentage';  // Default to percentage
                        $discount_value = 50;  // Default to 50%
                    }
                    ?>
                    <script>
                        // Make discount values available globally
                        window.discountType = '<?php echo esc_js($discount_type); ?>';
                        window.discountValue = <?php echo floatval($discount_value); ?>;
                        console.log('🔄 Setting global discount values:', window.discountType, window.discountValue);
                    </script>
                    
                    <h3>תאריכי השכרה</h3>
                    <div id="datepicker-container"></div>
                    <div id="date-validation-message" class="validation-message success" style="display: none">תאריכים נבחרו בהצלחה</div>
                    
                    <div id="max-duration-message" class="validation-message info" style="display: none">ניתן להזמין עד <span id="max-days"><?php echo $max_rental_days; ?></span> ימים</div>
                    
                    <!-- Price Breakdown Section -->
                    <div id="price-breakdown-container" class="price-breakdown-container" style="display: none; margin: 15px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 16px;">פירוט תמחור לתקופת השכירה:</h4>
                        <ul id="price-breakdown-list" style="margin: 0 0 10px 0; padding-right: 20px;">
                            <!-- Will be populated by JavaScript -->
                        </ul>
                        <p id="price-breakdown-total" style="margin: 5px 0 0; font-weight: bold; color: #333;">
                            <!-- Will be populated by JavaScript -->
                        </p>
                    </div>
                    
                    <form class="cart" action="<?php echo esc_url( apply_filters( 'woocommerce_add_to_cart_form_action', $product->get_permalink() ) ); ?>" method="post" enctype="multipart/form-data">
                        <input type="hidden" id="rental_dates" name="rental_dates" class="date-picker-field">
                        <input type="hidden" id="rental_hours" name="rental_hours">
                        <div style="display: none">
                            <?php woocommerce_quantity_input(); ?>
                        </div>
                        <div id="return-time-notice" class="return-time-notice info" style="margin-bottom: 15px; background-color: #e3f2fd; border: 1px solid #90caf9; padding: 8px; border-radius: 4px;">
                            <strong>שימו לב!</strong> החזרת הציוד מתבצעת עד השעה <?php echo esc_html( $return_override ); ?> .
                        </div>
                        <div class="btn-wrap">
                            <button type="submit" name="add-to-cart" value="<?php echo esc_attr( $product->get_id() ); ?>" class="single_add_to_cart_button btn-default btn-blue btn-mini">הוסף לסל</button>
                            <button type="submit" name="add-to-cart" value="<?php echo esc_attr( $product->get_id() ); ?>" class="single_add_to_cart_button btn-redirect btn-default btn-yellow btn-mini">הזמן</button>
                        </div>
                        <input type="hidden" name="redirect" value="">
                    </form>
                    
                    <?php if (get_the_content())
                        the_content();
                    else
                        echo $product->get_short_description() ; ?>
                </div>
            </div>
        </div>
    </div>
</section>

<?php do_action( 'woocommerce_after_single_product' ); ?>
