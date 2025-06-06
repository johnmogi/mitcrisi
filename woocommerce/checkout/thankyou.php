<?php
/**
 * Thankyou page
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/thankyou.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 8.1.0
 *
 * @var WC_Order $order
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="checkout">
    <div class="content-width">
        <ul class="breadcrumb display-block">
            <li><a href="<?= home_url() ?>"><img src="<?= get_template_directory_uri() ?>/img/icon-9.svg" alt="">חזרה</a></li>
        </ul>
        <h1 class="breadcrumb display-block">ביצוע הזמנה</h1>

        <div class="woocommerce-order">

            <?php
            if ( $order ) :

                do_action( 'woocommerce_before_thankyou', $order->get_id() );
                ?>

                <?php if ( $order->has_status( 'failed' ) ) : ?>

                    <p class="woocommerce-notice woocommerce-notice--error woocommerce-thankyou-order-failed"><?php esc_html_e( 'Unfortunately your order cannot be processed as the originating bank/merchant has declined your transaction. Please attempt your purchase again.', 'woocommerce' ); ?></p>

                    <p class="woocommerce-notice woocommerce-notice--error woocommerce-thankyou-order-failed-actions">
                        <a href="<?php echo esc_url( $order->get_checkout_payment_url() ); ?>" class="button pay"><?php esc_html_e( 'Pay', 'woocommerce' ); ?></a>
                        <?php if ( is_user_logged_in() ) : ?>
                            <a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" class="button pay"><?php esc_html_e( 'My account', 'woocommerce' ); ?></a>
                        <?php endif; ?>
                    </p>

                <?php else : ?>

                    <p class="woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received">
                    <?php
                    /**
                     * Filter the message shown after a checkout is complete.
                     *
                     * @since 2.2.0
                     *
                     * @param string         $message The message.
                     * @param WC_Order|false $order   The order created during checkout, or false if order data is not available.
                     */
                    $message = apply_filters(
                        'woocommerce_thankyou_order_received_text',
                        esc_html( __( 'Thank you. Your order has been received.', 'woocommerce' ) ),
                        $order
                    );

                    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                    echo $message;
                    ?>
                    </p>

                    <ul class="woocommerce-order-overview woocommerce-thankyou-order-details order_details">

                        <li class="woocommerce-order-overview__order order">
                            <?php esc_html_e( 'Order number:', 'woocommerce' ); ?>
                            <strong><?php echo $order->get_order_number(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
                        </li>

                        <li class="woocommerce-order-overview__date date">
                            <?php esc_html_e( 'Date:', 'woocommerce' ); ?>
                            <strong><?php echo wc_format_datetime( $order->get_date_created() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
                        </li>

                        <?php if ( is_user_logged_in() && $order->get_user_id() === get_current_user_id() && $order->get_billing_email() ) : ?>
                            <li class="woocommerce-order-overview__email email">
                                <?php esc_html_e( 'Email:', 'woocommerce' ); ?>
                                <strong><?php echo $order->get_billing_email(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
                            </li>
                        <?php endif; ?>

                        <li class="woocommerce-order-overview__total total">
                            <?php esc_html_e( 'Total:', 'woocommerce' ); ?>
                            <strong><?php echo $order->get_formatted_order_total(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
                        </li>

                        <?php if ( $order->get_payment_method_title() ) : ?>
                            <li class="woocommerce-order-overview__payment-method method">
                                <?php esc_html_e( 'Payment method:', 'woocommerce' ); ?>
                                <strong><?php echo wp_kses_post( $order->get_payment_method_title() ); ?></strong>
                            </li>
                        <?php endif; ?>

                    </ul>

                <?php endif; ?>

                <?php do_action( 'woocommerce_thankyou_' . $order->get_payment_method(), $order->get_id() ); ?>
                <?php do_action( 'woocommerce_thankyou', $order->get_id() ); ?>

            <?php else : ?>

                <p class="woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received">
                <?php
                /**
                 * Filter the message shown after a checkout is complete.
                 *
                 * @since 2.2.0
                 *
                 * @param string         $message The message.
                 * @param WC_Order|false $order   The order created during checkout, or false if order data is not available.
                 */
                $message = apply_filters(
                    'woocommerce_thankyou_order_received_text',
                    esc_html( __( 'Thank you. Your order has been received.', 'woocommerce' ) ),
                    $order
                );

                // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                echo $message;
                ?>
                </p>

            <?php endif; ?>

        </div>
    </div>
</section>
