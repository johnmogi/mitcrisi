/**
 * Negative Stock Blocker - Prevents booking for products with negative stock
 */
jQuery(document).ready(function($) {
    // Check if we're on a product page
    if (!$('form.cart').length) {
        return;
    }

    // Get the product stock from the stock HTML
    var stockText = $('.stock').text();
    var stockMatch = stockText.match(/-\d+/);
    
    // If stock is negative
    if (stockMatch) {
        console.log('🛑 Negative stock detected: ' + stockMatch[0]);
        
        // Disable the add to cart buttons
        $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
        
        // Add an out of stock notice
        if ($('#out-of-stock-notice').length === 0) {
            var notice = $('<div id="out-of-stock-notice" style="margin: 15px 0; padding: 12px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">' +
                '<strong style="color: #721c24;">שימו לב:</strong> ' +
                'מוצר זה אינו זמין להשכרה כרגע. נא לבדוק אפשרויות אחרות או לחזור מאוחר יותר.' +
                '</div>');
            $('.rental-form-section').prepend(notice);
        }
        
        // Disable all calendar cells
        $('.day-cell').addClass('disabled').attr('data-selectable', 'false');
        
        // Stop any date selection functionality
        $(document).off('click', '.day-cell');
    }
});
