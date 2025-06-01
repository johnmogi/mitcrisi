/**
 * Future Date Stock Override
 * Allows booking zero-stock products for future dates
 * Solves the issues with buttons being disabled even for future dates
 */
jQuery(document).ready(function($) {
    console.log('🚀 Future Date Stock Override - Enabling zero-stock future bookings');
    
    // Fix the buttons immediately for zero-stock products
    setTimeout(fixZeroStockButtonsForFutureDates, 500);
    
    // Monitor date changes and confirm button clicks
    $(document).on('click', '.confirm-dates', function() {
        setTimeout(fixZeroStockButtonsForFutureDates, 300);
    });
    
    // Also check when dates change
    $(document).on('change', '#rental_dates', function() {
        setTimeout(fixZeroStockButtonsForFutureDates, 300);
    });
    
    /**
     * Main function to check if dates are sufficiently in the future
     * and enable buttons accordingly
     */
    function fixZeroStockButtonsForFutureDates() {
        // Only run this for zero-stock products
        if (window.productStockQty > 0 || window.mitnafunStockQty > 0 || window.accurateStockQty > 0) {
            return;
        }
        
        // Get the selected rental dates
        const dateInput = $('#rental_dates');
        if (!dateInput.length || !dateInput.val()) {
            return;
        }
        
        // Parse the dates (format: DD.MM.YYYY - DD.MM.YYYY)
        const dateRangeString = dateInput.val();
        const dates = dateRangeString.split(' - ');
        
        if (dates.length < 1) {
            return;
        }
        
        // Parse start date
        const startDateParts = dates[0].split('.');
        if (startDateParts.length !== 3) {
            return;
        }
        
        // Create date objects
        const startDate = new Date(
            parseInt(startDateParts[2]), // Year
            parseInt(startDateParts[1]) - 1, // Month (0-indexed)
            parseInt(startDateParts[0]) // Day
        );
        
        const today = new Date();
        
        // Calculate days in future
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // If the date is at least 3 days in the future, enable the buttons
        if (diffDays >= 3) {
            console.log('✅ Future dates selected (' + diffDays + ' days ahead) - Enabling buttons for zero-stock product');
            
            // Enable "Add to Cart" buttons
            $('.single_add_to_cart_button').each(function() {
                $(this).removeClass('disabled')
                       .prop('disabled', false)
                       .css('opacity', '1')
                       .css('cursor', 'pointer')
                       .attr('aria-disabled', 'false');
            });
            
            // Also update any validation messages
            if ($('#date-validation-message').length) {
                const validationMsg = $('#date-validation-message');
                if (validationMsg.hasClass('error')) {
                    validationMsg.removeClass('error').addClass('success');
                    validationMsg.text('תאריכים עתידיים נבחרו בהצלחה. ניתן להשלים את ההזמנה גם כאשר המלאי אפס.');
                }
            }
            
            // Override any stock validation messages
            $('.stock').each(function() {
                const $this = $(this);
                if ($this.hasClass('out-of-stock')) {
                    $this.removeClass('out-of-stock').addClass('in-stock');
                    $this.text('ניתן להזמין לתאריכים עתידיים');
                }
            });
        }
    }
    
    // Run the function periodically to catch any changes
    setInterval(fixZeroStockButtonsForFutureDates, 2000);
});
