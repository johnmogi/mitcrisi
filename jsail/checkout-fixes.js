/**
 * Checkout page fixes for Mitnafun rental system
 * Adds ability to remove items from the cart on the checkout page
 */
jQuery(document).ready(function($) {
    console.log("Checkout fixes loaded");
    
    // Add remove buttons to each cart item on checkout page
    function addRemoveButtons() {
        // Only run on checkout page
        if (!$('body').hasClass('woocommerce-checkout')) return;
        
        // Add remove button to each cart item if it doesn't already have one
        $('.woocommerce-checkout-review-order-table .cart_item').each(function() {
            if ($(this).find('.remove-item').length === 0) {
                const cartItemKey = $(this).data('cart_item_key');
                
                // Create remove button with proper styling
                const $removeBtn = $('<div class="remove-item-wrapper">' +
                    '<a href="#" class="remove-item" data-cart_item_key="' + cartItemKey + '" title="הסר פריט">' +
                    '<span>×</span>' +
                    '</a></div>');
                
                // Add to product name cell
                $(this).find('.product-name').prepend($removeBtn);
            }
        });
        
        // Add styles for the remove button
        if (!$('#checkout-remove-styles').length) {
            $('<style id="checkout-remove-styles">')
                .prop('type', 'text/css')
                .html(`
                    .remove-item-wrapper {
                        display: inline-block;
                        margin-left: 8px;
                        vertical-align: middle;
                    }
                    .remove-item {
                        display: block;
                        font-size: 18px;
                        height: 20px;
                        width: 20px;
                        line-height: 18px;
                        color: #e2401c;
                        text-align: center;
                        border-radius: 50%;
                        border: 1px solid #e2401c;
                        font-weight: 700;
                        transition: all 0.2s ease;
                    }
                    .remove-item:hover {
                        background-color: #e2401c;
                        color: #fff;
                        text-decoration: none;
                    }
                    .remove-item span {
                        display: block;
                    }
                `)
                .appendTo('head');
        }
    }
    
    // Handle item removal via direct AJAX - use native WooCommerce removal
    $(document).on('click', '.remove-item', function(e) {
        e.preventDefault();
        
        const $this = $(this);
        const cartItemKey = $this.data('cart_item_key');
        const $cartItem = $this.closest('.cart_item');
        
        if (!cartItemKey) return;
        
        // Add loading state
        $cartItem.css('opacity', '0.5');
        
        // Use native WooCommerce AJAX endpoint for cart removal
        $.ajax({
            type: 'POST',
            url: wc_checkout_params.ajax_url,
            data: {
                action: 'woocommerce_remove_from_cart',
                cart_item_key: cartItemKey,
                security: wc_checkout_params.update_order_review_nonce
            },
            success: function(response) {
                // Remove the item from the DOM
                $cartItem.slideUp(300, function() {
                    $(this).remove();
                    
                    // Check if this was the last item
                    if ($('.woocommerce-checkout-review-order-table .cart_item').length === 0) {
                        // If no items left, redirect to home page
                        window.location.href = '/';
                    } else {
                        // Otherwise just update the checkout totals
                        $(document.body).trigger('update_checkout');
                    }
                });
            },
            error: function() {
                // If AJAX fails, remove loading state
                $cartItem.css('opacity', '1');
            }
        });
    });
    
    // Initialize
    addRemoveButtons();
    
    // Update when fragments are refreshed
    $(document.body).on('updated_checkout', function() {
        setTimeout(addRemoveButtons, 200);
    });
});
