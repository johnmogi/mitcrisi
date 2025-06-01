    <div class="shop_table woocommerce-checkout-review-order-table">
    <?php do_action( 'woocommerce_review_order_before_cart_contents' ); ?>

    <?php
    foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
        // MITNAFUN DEBUG: log cart item data and rental dates
        error_log('MITNAFUN DEBUG: cart_item ' . $cart_item_key . ' rental_dates:' . (isset($cart_item['rental_dates']) ? $cart_item['rental_dates'] : 'none') . ' data:' . print_r($cart_item, true));
        $_product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
        $product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

        if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 ) {
            ?>
            <div class="<?php echo esc_attr( apply_filters( 'woocommerce_cart_item_class', 'cart_item', $cart_item, $cart_item_key ) ); ?>"
                 data-cart_item_key="<?php echo esc_attr( $cart_item_key ); ?>"
                 data-rental_dates="<?php echo isset( $cart_item['rental_dates'] ) ? esc_attr( $cart_item['rental_dates'] ) : ''; ?>">
                <!-- <div class="mitnafun-debug-dates" style="color:red;background:#fee;padding:5px;margin-bottom:5px;">
                    Debug rental_dates: <php echo isset( $cart_item['rental_dates'] ) ? esc_html( $cart_item['rental_dates'] ) : 'none'; >
                </div> -->
                <div class="product-name">
                    <?php echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) ); ?>
                    <?php echo apply_filters( 'woocommerce_checkout_cart_item_quantity', ' <strong class="product-quantity">' . sprintf( '&times;&nbsp;%s', $cart_item['quantity'] ) . '</strong>', $cart_item, $cart_item_key ); ?>
                    <?php echo wc_get_formatted_cart_item_data( $cart_item ); ?>
                    <?php if (isset($cart_item['pickup_time'])): ?>
                        <div class="pickup-time-info">
                            <strong>שעת איסוף:</strong> <?php echo esc_html($cart_item['pickup_time']); ?>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="product-total">
                    <?php echo apply_filters( 'woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ), $cart_item, $cart_item_key ); ?>
                </div>
            </div>
            <?php
        }
    }
    ?>

    <?php do_action( 'woocommerce_review_order_after_cart_contents' ); ?>

    <?php
    // Calculate direct line total from visible cart items
    $direct_line_total = 0;
    foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
        if (isset($cart_item['line_total'])) {
            $direct_line_total += $cart_item['line_total'];
        }
    }
    ?>
    <div class="cart-subtotal">
        <div><?php esc_html_e( 'Subtotal', 'woocommerce' ); ?></div>
        <div><?php echo wc_price( $direct_line_total ); ?></div>
    </div>

    <?php foreach ( WC()->cart->get_coupons() as $code => $coupon ) : ?>
        <div class="cart-discount coupon-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
            <div><?php wc_cart_totals_coupon_label( $coupon ); ?></div>
            <div><?php wc_cart_totals_coupon_html( $coupon ); ?></div>
        </div>
    <?php endforeach; ?>

    <?php if ( WC()->cart->needs_shipping() && WC()->cart->show_shipping() ) : ?>
        <?php do_action( 'woocommerce_review_order_before_shipping' ); ?>
        <?php wc_cart_totals_shipping_html(); ?>
        <?php do_action( 'woocommerce_review_order_after_shipping' ); ?>
    <?php endif; ?>

    <?php foreach ( WC()->cart->get_fees() as $fee ) : ?>
        <div class="fee">
            <div><?php echo esc_html( $fee->name ); ?></div>
            <div><?php wc_cart_totals_fee_html( $fee ); ?></div>
        </div>
    <?php endforeach; ?>

    <?php if ( wc_tax_enabled() && ! WC()->cart->display_prices_including_tax() ) : ?>
        <?php if ( 'itemized' === get_option( 'woocommerce_tax_total_display' ) ) : ?>
            <?php foreach ( WC()->cart->get_tax_totals() as $code => $tax ) : // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited ?>
                <div class="tax-rate tax-rate-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
                    <div><?php echo esc_html( $tax->label ); ?></div>
                    <div><?php echo wp_kses_post( $tax->formatted_amount ); ?></div>
                </div>
            <?php endforeach; ?>
        <?php else : ?>
            <div class="tax-total">
                <div><?php echo esc_html( WC()->countries->tax_or_vat() ); ?></div>
                <div><?php wc_cart_totals_taxes_total_html(); ?></div>
            </div>
        <?php endif; ?>
    <?php endif; ?>

    <?php do_action( 'woocommerce_review_order_before_order_total' ); ?>

    <div class="order-total">
        <div><?php esc_html_e( 'Total', 'woocommerce' ); ?></div>
        <div><?php echo wc_price( $direct_line_total ); ?></div>
    </div>

    <?php do_action( 'woocommerce_review_order_after_order_total' ); ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.woocommerce-checkout-review-order-table .cart_item').forEach(function(el) {
        console.log('MITNAFUN FRONTEND DEBUG:', {
            key: el.getAttribute('data-cart_item_key'),
            rental_dates: el.getAttribute('data-rental_dates'),
            price: el.querySelector('.product-total').innerText.trim()
        });
    });
});
</script>

<style>
.pickup-time-info {
    margin: 10px 0;
    padding: 10px;
    background: #f7f7f7;
    border-radius: 4px;
}
</style>
