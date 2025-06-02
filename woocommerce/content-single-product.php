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
<!-- Air Datepicker is now properly enqueued in functions.php -->

<script>
    // Global variables used by the product-rental.js script
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
        // This datepicker initialization is now handled by product-rental.js
        // We just expose the global variables here and let the script handle initialization
        console.log('Rental data prepared for product-rental.js');
    });
</script>

<?php
/**
 * Hook: woocommerce_before_single_product.
 *
 * @hooked woocommerce_output_all_notices - 10
 */
do_action( 'woocommerce_before_single_product' );

if ( post_password_required() ) {
	echo get_the_password_form(); // WPCS: XSS ok.
	return;
}
?>
<div id="product-<?php the_ID(); ?>" <?php wc_product_class( '', $product ); ?>>
    <?php 
    /**
     * Custom single product layout
     * Rental product with date picker
     */
    ?>
    <section class="project-section-1">
        <div class="content-width">
            <div class="wrap">
                <div class="img-wrap">
                    <?php
                    /**
                     * Hook: woocommerce_before_single_product_summary.
                     *
                     * @hooked woocommerce_show_product_sale_flash - 10
                     * @hooked woocommerce_show_product_images - 20
                     */
                    do_action( 'woocommerce_before_single_product_summary' );
                    ?>
                </div>
                <div class="text-wrap">
                    <h1 class="title-h2"><?php the_title(); ?></h1>
                    <div class="products-card">
                        <div class="product-data-container">
                            <!-- Price Data -->
                            <div class="product-price-data" 
                                data-base-price="<?php echo $product->get_price(); ?>" 
                                data-discount-type="<?php echo $js_discount_type; ?>" 
                                data-discount-value="<?php echo $discount_value; ?>"
                                data-stock-quantity="<?php echo $stock_quantity; ?>">
                            </div>
                            
                            <div class="rental-price-display">
                                <p class="price-info-label">המחיר לתקופה: <span id="rental-price"><?php echo wc_price($product->get_price()); ?></span></p>
                                <p class="price-breakdown" id="price-breakdown"></p>
                            </div>
                            
                            <div id="datepicker-container"></div>
                            
                            <div class="calendar-legend">
                                <div class="legend-item legend-free">
                                    <div class="legend-color"></div>
                                    <span>פנוי</span>
                                </div>
                                <div class="legend-item legend-occupied">
                                    <div class="legend-color"></div>
                                    <span>תפוס</span>
                                </div>
                                <div class="legend-item legend-saturday">
                                    <div class="legend-color"></div>
                                    <span>שבת (סגור)</span>
                                </div>
                                <div class="legend-item legend-early-return">
                                    <div class="legend-color"></div>
                                    <span>החזרה מוקדמת (עד 10:00)</span>
                                </div>
                                <div class="legend-item legend-holiday">
                                    <div class="legend-color"></div>
                                    <span>ערב חגים והחזרה</span>
                                </div>
                            </div>
                            
                            <div class="datepicker-message warning">
                                אין מלאי זמין כרגע, אבל ניתן להזמין לתאריכים עתידיים פנויים
                            </div>
                            
                            <div class="datepicker-message attention">
                                שימו לב! החזרת הציוד מתבצעת עד השעה 10:00
                            </div>
                            
                            <div class="rental-info-container" style="display: none;">
                                <div class="rental-info">
                                    <p id="pickup-info"><strong>איסוף:</strong> בחר תאריכים בלוח השנה</p>
                                    <p id="return-info"><strong>החזרה:</strong> בחר תאריכים בלוח השנה</p>
                                </div>
                                
                                <!-- Pickup Time Selection -->
                                <div class="pickup-time-container" style="display: none;">
                                    <label for="pickup_time_select">שעת איסוף:</label>
                                    <select id="pickup_time_select" name="pickup_time_select">
                                        <option value="">בחר שעת איסוף</option>
                                        <option value="11:00">11:00</option>
                                        <option value="12:00">12:00</option>
                                        <option value="13:00">13:00</option>
                                        <option value="14:00">14:00</option>
                                        <option value="15:00">15:00</option>
                                        <option value="16:00">16:00</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div id="date-validation-message" class="woocommerce-error" style="display: none;">
                                בחר תאריך איסוף ותאריך החזרה
                            </div>
                            
                            <div id="max-duration-message" class="woocommerce-error" style="display: none;">
                                תקופת ההשכרה חייבת להיות פחות מ-<?php echo $max_rental_days; ?> ימים
                            </div>
                        </div>
                        
                        <!-- Add to cart form -->
                        <form class="cart" action="<?php echo esc_url( apply_filters( 'woocommerce_add_to_cart_form_action', $product->get_permalink() ) ); ?>" method="post" enctype='multipart/form-data'>
                            <?php do_action( 'woocommerce_before_add_to_cart_button' ); ?>
                            
                            <input type="hidden" name="rental_dates" id="rental_dates" value="">
                            <input type="hidden" name="pickup_time" id="pickup_time" value="">
                            
                            <div class="quantity-container">
                                <div class="quantity">
                                    <label for="quantity_<?php echo $product->get_id(); ?>">כמות:</label>
                                    <?php
                                    woocommerce_quantity_input(
                                        array(
                                            'min_value'   => apply_filters( 'woocommerce_quantity_input_min', $product->get_min_purchase_quantity(), $product ),
                                            'max_value'   => apply_filters( 'woocommerce_quantity_input_max', $product->get_max_purchase_quantity(), $product ),
                                            'input_value' => isset( $_POST['quantity'] ) ? wc_stock_amount( wp_unslash( $_POST['quantity'] ) ) : $product->get_min_purchase_quantity(),
                                        )
                                    );
                                    ?>
                                </div>
                            </div>
                            
                            <button type="submit" name="add-to-cart" value="<?php echo esc_attr( $product->get_id() ); ?>" class="single_add_to_cart_button button alt disabled" disabled><?php echo esc_html( $product->single_add_to_cart_text() ); ?></button>
                            
                            <?php do_action( 'woocommerce_after_add_to_cart_button' ); ?>
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
</div>

<?php do_action( 'woocommerce_after_single_product' ); ?>

<?php
// Only add these sections if we have a valid product
if (is_a($product, 'WC_Product')) {
    // Product Details Section - only if ACF is active and fields exist
    if(function_exists('have_rows') && have_rows('products', $product->get_id())): ?>
    <section class="item-2x-text">
        <div class="content-width">
            <h2 class="title-h3">פרטי המוצר</h2>
            <div class="content">
                <?php while(have_rows('products', $product->get_id())): the_row(); ?>
                <div class="item">
                    <?php if ($field = get_sub_field('title')): ?>
                    <h6 class="title"><?= $field ?></h6>
                    <?php endif; ?>
                    <?php the_sub_field('description'); ?>
                </div>
                <?php endwhile; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <?php 
    // Cancellation Policy Section - always shown
    ?>
    <section class="title-border-block">
        <div class="bg">
            <img src="https://mitnafun.com/wp-content/themes/mitnafun_upro/img/after-8.svg" alt="" class="img-1">
            <img src="https://mitnafun.com/wp-content/themes/mitnafun_upro/img/after-9.svg" alt="" class="img-2">
            <img src="https://mitnafun.com/wp-content/themes/mitnafun_upro/img/after-10.svg" alt="" class="img-3">
        </div>
        <div class="content-width">
            <h2 class="title-h3">מדיניות ביטולים</h2>
            <div class="content">
                <div class="text">
                    <?php if(function_exists('get_field') && get_field('cancellation_policy', $product->get_id())): ?>
                        <?php the_field('cancellation_policy', $product->get_id()); ?>
                    <?php else: ?>
                        <p>ביטול הזמנה ו/או השכרה של ציוד תעשה <a href="#">עד 72</a> <a href="#">שעות</a> לפני תקופת ההשכרה, ובלבד שניתן אישור על ידי מתנפחים ונהנים.</p>
                        <p>למען הסר ספק, לא יוחזר תשלום בעת ביטול הזמנה או השכרה <a href="#">במסגרת 72</a> השעות לפני תקופת ההשכרה.</p>
                    <?php endif; ?>
                </div>
                
                <div class="img-wrap">
                    <figure>
                        <img src="https://mitnafun.com/wp-content/uploads/2024/04/icon-8.svg">
                    </figure>
                    
                    <div class="wrap">
                        <p>יש ליצור קשר בטלפון </p>
                        <p>
                            <a href="tel:+0505544516">050-5544516</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="lmp_load_more_button br_lmp_button_settings" style="display: none;">
                <a class="lmp_button link-wrap" style="font-size: 22px;color: #333333;background-color: #ffffff;padding-top:15px;padding-right:25px;padding-bottom:15px;padding-left:25px;margin-top:px;margin-right:px;margin-bottom:px;margin-left:px; border-top: 0px solid #000; border-bottom: 0px solid #000; border-left: 0px solid #000; border-right: 0px solid #000; border-top-left-radius: 0px; border-top-right-radius: 0px; border-bottom-left-radius: 0px; border-bottom-right-radius: 0px;" href="#load_next_page">טען עוד</a>
            </div>
        </div>
    </section>
<?php } ?>
