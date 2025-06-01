<?php
/**
 * Mini-cart
 *
 * Contains the markup for the mini-cart, used by the cart widget.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/mini-cart.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.9.0
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_before_mini_cart' ); ?>

<?php if ( ! WC()->cart->is_empty() ) : ?>

 		<?php
		do_action( 'woocommerce_before_mini_cart_contents' );

		foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
			$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
			$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

			if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_widget_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
				/**
				 * This filter is documented in woocommerce/templates/cart/cart.php.
				 *
				 * @since 2.1.0
				 */
				$product_name      = apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key );
				$thumbnail         = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key );
				$product_price     = apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key );
				$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
				?>

                <div class="item">
                    <figure>
                        <?php if ( empty( $product_permalink ) ) : ?>
                            <?php echo $thumbnail  ; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                        <?php else : ?>
                            <a href="<?php echo esc_url( $product_permalink ); ?>">
                                <?php echo $thumbnail ; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            </a>
                        <?php endif; ?>
                    </figure>
                    <div class="text">
                        <div class="info">
                            <p class="name"><a href="<?= $product_permalink ?>"><?= $product_name ?></a></p>
                            <p><?= $cart_item['rental_dates'] ?: $cart_item['rental_dates'] ?></p>
                            <?php if (! empty( $cart_item['rental_dates'] )) :
                                $dates = explode(' - ', $cart_item['rental_dates']);
                                if ( count( $dates ) === 2 ) {
                                    $start = DateTime::createFromFormat('d.m.Y', trim( $dates[0] ));
                                    $end   = DateTime::createFromFormat('d.m.Y', trim( $dates[1] ));
                                    if ( $start && $end ) {
                                        $rental_days        = $start->diff( $end )->days + 1;
                                        $product_id         = $_product->get_id();
                                        $base_price         = floatval( $_product->get_price() );
                                        $discount_type      = 'אחוז';
                                        $discount_value     = 50;
                                        if ( function_exists('get_field') ) {
                                            $custom_type = get_field('select_discount', $product_id);
                                            $custom_val  = get_field('discount', $product_id);
                                            if ( ! empty( $custom_type ) ) $discount_type  = $custom_type;
                                            if ( ! empty( $custom_val ) )  $discount_value = $custom_val;
                                        }
                                        if ( $discount_type === 'אחוז' ) {
                                            $additional_unit_price = $base_price * ((100 - $discount_value) / 100);
                                            $discount_label        = $discount_value . '% הנחה';
                                        } else {
                                            $additional_unit_price = max($base_price - $discount_value, 0);
                                            $discount_label        = $discount_value . ' ₪ הנחה';
                                        }
                                        $total_price = calculate_custom_price($product_id, $base_price, $rental_days);
                                        $full_price  = $base_price * $rental_days;
                                        $savings     = $full_price - $total_price;
                                        ?>
                                        <div class="rental-discount-info" style="margin: 15px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                                            <p style="font-weight: bold; margin-bottom: 5px;"><?php _e('פירוט תמחור לתקופת השכירות','textdomain'); ?></p>
                                            <ul style="margin: 0; padding-right: 20px;">
                                                <li><?php echo __('יום ראשון:','textdomain') . ' ' . wc_price($base_price) . ' (' . __('מחיר מלא','textdomain') . ')'; ?></li>
                                                <li><?php echo ($rental_days - 1) . ' ' . __('ימים נוספים:','textdomain') . ' ' . wc_price($additional_unit_price) . ' (' . $discount_label . ')'; ?></li>
                                                <li style="font-weight: bold; margin-top: 5px;">"><?php echo __('סה"כ:','textdomain') . ' ' . wc_price($total_price) . ' (' . __('חסכת','textdomain') . ' ' . wc_price($savings) . ')'; ?></li>
                                            </ul>
                                        </div>
                                <?php   }
                                }
                            endif;
                            ?>
                        </div>
                        <div class="cost">
                            <?php
                            echo apply_filters(
                                'woocommerce_cart_item_subtotal',
                                WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ),
                                $cart_item,
                                $cart_item_key
                            );
                            ?>
                        </div>
                        <div class="delete">
                            <?php
                            echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                                'woocommerce_cart_item_remove_link',
                                sprintf(
                                    '<a href="%s" class="remove remove_from_cart_button" aria-label="%s" data-product_id="%s" data-cart_item_key="%s" data-product_sku="%s">%s</a>',
                                    esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
                                    /* translators: %s is the product name */
                                    esc_attr( sprintf( __( 'Remove %s from cart', 'woocommerce' ), wp_strip_all_tags( $product_name ) ) ),
                                    esc_attr( $product_id ),
                                    esc_attr( $cart_item_key ),
                                    esc_attr( $_product->get_sku() ),
                                    '<img src="'. get_template_directory_uri().'/img/del.svg" alt="">'
                                ),
                                $cart_item_key
                            );
                            ?>
                        </div>
                    </div>
                </div>


 				<?php
			}
		}

		do_action( 'woocommerce_mini_cart_contents' );
		?>



        <?php if (!is_checkout()) { ?>
        <div class="btn-wrap">
            <a href="<?= get_permalink(12) ?>" class="btn-default btn-blue btn-mini">להזמנה</a>
        </div>
        <?php } ?>

<?php else : ?>

	<p class="woocommerce-mini-cart__empty-message"><?php esc_html_e( 'No products in the cart.', 'woocommerce' ); ?></p>

<?php endif; ?>

<?php do_action( 'woocommerce_after_mini_cart' ); ?>
