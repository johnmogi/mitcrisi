<?php
/**
 * Checkout Form
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-checkout.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.5.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

//

// If checkout registration is disabled and not logged in, the user cannot checkout.
if ( ! $checkout->is_registration_enabled() && $checkout->is_registration_required() && ! is_user_logged_in() ) {
	echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'woocommerce' ) ) );
	return;
}

?>


        <?php wc_print_notices(); ?>
        <form name="checkout" method="post" class="checkout woocommerce-checkout " action="<?php echo esc_url( wc_get_checkout_url() ); ?>">
            <div class="content">
                <div class="main">
                    <h3 class="title">איסוף עצמי</h3>
                    <div class="form-wrap form-default">
                        <div class="input-wrap">
                            <input type="text" name="billing_first_name" id="name" placeholder="" required>
                            <label for="name">שם פרטי *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="text" name="billing_last_name" id="surname" placeholder="" required>
                            <label for="surname">שם משפחה *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="email" name="billing_email" id="email" placeholder="example@gmail.com" required>
                            <label for="email">כתובת אימייל *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="tel" name="billing_phone" id="tel" placeholder="" required class="tel">
                            <label for="tel">מספר טלפון *</label>
                        </div>
                        <div class="input-wrap">
                            <input type="number" name="billing_guests" id="number" placeholder="10" required>
                            <label for="number">כמות המשתתפים *</label>
                        </div>


                        <?php //do_action( 'woocommerce_checkout_shipping' ); ?>
                        <div class="input-wrap">
                            <label for="pickup_time">שעת האיסוף הקבועה:</label>
                            <span class="woocommerce-input-wrapper">
                                <select class="select select2-time" data-placeholder="שעת איסוף" name="pickup_time" id="pickup_time">
                                    <option></option>
                                    <?php foreach (get_field('pickup_time', 'option') as $time) { ?>
                                        <option value="<?= $time ?>"><?= $time ?></option>
                                    <?php } ?>
                                </select>
                                <?php
                                // Check for custom pickup time override
                                $custom_pickup_hour = false;
                                foreach (WC()->cart->get_cart() as $cart_item) {
                                    $pid = $cart_item['product_id'];
                                    $pickup_override = get_post_meta($pid, 'pickup_overide', true);
                                    if (!empty($pickup_override)) {
                                        // Ensure HH:MM format
                                        $pickup_override_formatted = (strpos($pickup_override, ':') === false) ? $pickup_override . ':00' : $pickup_override;
                                        $custom_pickup_hour = $pickup_override_formatted;
                                        break;
                                    }
                                }
                                
                                if ($custom_pickup_hour) {
                                    echo '<div class="pickup-time-notice" style="margin-top:10px;">';
                                    echo '<strong>שים לב:</strong> לפריט זה קבועה שעת איסוף ל <strong>' . esc_html($custom_pickup_hour) . '</strong>. לפניות מיוחדות: 050-5544516.';
                                    echo '</div>';
                                } 
                                ?>
                            </span>
                        </div>
                        <?php
                        // Determine return time for checkout (default 11:00, override by any product)
                        $return_time_to_use = '11:00';
                        foreach (WC()->cart->get_cart() as $cart_item) {
                            $pid = $cart_item['product_id'];
                            $custom = get_post_meta($pid, 'return_overide_copy', true);
                            if (!empty($custom)) {
                                // Ensure HH:MM format
                                $return_time_to_use = (strpos($custom, ':') === false) ? $custom . ':00' : $custom;
                                break;
                            }
                        }
                        ?>
                        <!-- Return Time Field -->
                        <div class="input-wrap">
                            <div class="pickup-time-notice" style="margin-top:10px; background-color: #e8f4ff; color: #2980b9; padding: 10px; border-radius: 4px; border-right: 4px solid #3498db; font-size: 14px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <label for="return_time">שעת החזרה *</label>
                                <strong>שים לב:</strong> לפריט זה נקבעה שעת החזרה מיוחדת של <?php echo esc_html($return_time_to_use); ?>.
                                <input type="hidden" name="return_time" value="<?php echo esc_attr($return_time_to_use); ?>">
                            </div>
                        </div>
                        
                        <div class="input-wrap-checked">
                            <input type="checkbox" name="billing_check" id="check"  value="1">
                            <label for="check">הנני מאשר כי קיבלתי לידי את התנאים הכלליים המצורפים על נספחיהם, אלה הוסברו לי ואני מסכים לתוכנם</label>
                        </div>

                        <div class="input-wrap-checked" style="margin-top: 20px;">
                            <input type="checkbox" name="billing_check2" id="check2"  value="1" required>
                            <label for="check2">החזרת המוצר תעשה עד <strong><?php echo esc_html($return_time_to_use); ?></strong> למחרת יום ההשכרה, למעט השכרות בסוף השבוע בהן יוחזר המוצר ביום ראשון.</label>
                        </div>
                    </div>




                </div>
                <?php do_action( 'woocommerce_checkout_order_review' ); ?>

            </div>


            <div class="content">
                <div class="main">

                    <h3 class="title"><?= __( 'You may be interested in&hellip;', 'woocommerce' ) ?></h3>
                    <?php wc_get_template('cart/cross-sells.php') ?>
                </div>
                <div class="aside">
                    <h3 class="title">תשלום</h3>
                    <?php woocommerce_checkout_payment(); ?>
                </div>
            </div>
        </form>
