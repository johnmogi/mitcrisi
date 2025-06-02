/**
 * Direct Form Override
 * Prevents any scripts from blocking form submission for future dates
 * Highest priority and most aggressive override
 */
jQuery(document).ready(function($) {
    console.log('🔥 DIRECT FORM OVERRIDE ACTIVE');

    // Global flag to track if we've handled the submission
    window.formSubmissionHandled = false;
    
    // Helper function to check if a date is sufficiently in the future (3+ days)
    function isDateSufficientlyInFuture(dateString) {
        if (!dateString) return false;
        
        // For date format DD.MM.YYYY
        if (dateString.indexOf('.') > 0) {
            const parts = dateString.split('.');
            if (parts.length === 3) {
                const date = new Date(parts[2], parts[1] - 1, parts[0]);
                const today = new Date();
                const diffTime = date.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 3;
            }
        }
        return false;
    }
    
    // Add our own submit handler directly to the form
    $('form.cart').on('submit', function(e) {
        // Get the dates from the form
        const rentalDates = $('#rental_dates').val();
        
        if (rentalDates) {
            const dates = rentalDates.split(' - ');
            const isFutureDate = dates.length > 0 && isDateSufficientlyInFuture(dates[0]);
            
            if (isFutureDate) {
                console.log('🟢 DIRECT OVERRIDE: Future date detected, allowing submission');
                
                // Set our flag that we're handling this submission
                window.formSubmissionHandled = true;
                
                // Allow the form to submit normally
                return true;
            }
        }
    });
    
    // Also enable the buttons directly
    function enableButtons() {
        const rentalDates = $('#rental_dates').val();
        
        if (rentalDates) {
            const dates = rentalDates.split(' - ');
            const isFutureDate = dates.length > 0 && isDateSufficientlyInFuture(dates[0]);
            
            if (isFutureDate) {
                console.log('🟢 DIRECT OVERRIDE: Enabling buttons for future dates');
                
                $('.single_add_to_cart_button').each(function() {
                    $(this).prop('disabled', false)
                           .removeClass('disabled')
                           .css('opacity', '1')
                           .css('cursor', 'pointer');
                });
            }
        }
    }
    
    // Run on date change
    $(document).on('change', '#rental_dates', enableButtons);
    
    // Run when dates are confirmed
    $(document).on('click', '.confirm-dates', function() {
        setTimeout(enableButtons, 300);
    });
    
    // Disabled - letting the Air Datepicker handle button enabling properly
    // setInterval(enableButtons, 1000);
    
    // CRITICAL: Capture all click events on the buttons and override them
    $(document).on('click', '.single_add_to_cart_button', function(e) {
        const rentalDates = $('#rental_dates').val();
        
        if (rentalDates) {
            const dates = rentalDates.split(' - ');
            const isFutureDate = dates.length > 0 && isDateSufficientlyInFuture(dates[0]);
            
            if (isFutureDate) {
                // If this is the "order" button with redirect, handle the redirect manually
                if ($(this).hasClass('btn-redirect')) {
                    e.preventDefault();
                    console.log('🟢 DIRECT OVERRIDE: Handling redirect for future date');
                    
                    // Get the form data
                    const formData = $('form.cart').serialize();
                    
                    // Send AJAX request to add to cart
                    $.ajax({
                        type: 'POST',
                        url: $('form.cart').attr('action'),
                        data: formData,
                        success: function() {
                            // Redirect to checkout
                            window.location.href = '/checkout/';
                        }
                    });
                    
                    return false;
                }
                
                // For regular "add to cart" button, just let it submit normally
                console.log('🟢 DIRECT OVERRIDE: Allowing add to cart for future date');
                window.formSubmissionHandled = true;
                return true;
            }
        }
    });
    
    // Hide any zero stock messages
    function hideZeroStockMessages() {
        const rentalDates = $('#rental_dates').val();
        
        if (rentalDates) {
            const dates = rentalDates.split(' - ');
            const isFutureDate = dates.length > 0 && isDateSufficientlyInFuture(dates[0]);
            
            if (isFutureDate) {
                console.log('🟢 DIRECT OVERRIDE: Hiding zero stock messages for future dates');
                
                // Hide various error messages
                $('#zero-stock-modal, #zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning').hide();
                
                // Remove inline styles that might be blocking interactions
                $('body').css('overflow', '');
            }
        }
    }
    
    // Run periodically to ensure messages stay hidden
    setInterval(hideZeroStockMessages, 500);
});
