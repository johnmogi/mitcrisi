/**
 * Complete Future Date Override
 * This script enables future date bookings with zero stock
 * Production version with minimal logging
 */
jQuery(document).ready(function($) {
    // Production mode - logging disabled
    // console.log('🔄 Future Date Override Active');
    
    // Function to check if a date is in the future (3+ days)
    function isDateInFuture(dateStr) {
        if (!dateStr) return false;
        
        // Parse date in DD.MM.YYYY format
        const parts = dateStr.split('.');
        if (parts.length !== 3) return false;
        
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        
        return diffDays >= 3;
    }
    
    // Function to check if selected dates are in the future
    function areSelectedDatesInFuture() {
        const rentalDates = $('#rental_dates').val();
        if (!rentalDates) return false;
        
        const dates = rentalDates.split(' - ');
        return dates.length > 0 && isDateInFuture(dates[0]);
    }
    
    // Create direct add to cart function that bypasses all validation
    function directAddToCart() {
        const productId = $('button[name="add-to-cart"]').val();
        const rentalDates = $('#rental_dates').val();
        const rentalDays = $('#rental_days').val();
        
        // Create a temporary form
        const form = $('<form>', {
            'action': window.location.href,
            'method': 'post',
            'style': 'display:none'
        });
        
        // Add all necessary fields
        form.append($('<input>', {
            'name': 'add-to-cart',
            'value': productId,
            'type': 'hidden'
        }));
        
        form.append($('<input>', {
            'name': 'rental_dates',
            'value': rentalDates,
            'type': 'hidden'
        }));
        
        form.append($('<input>', {
            'name': 'rental_days',
            'value': rentalDays,
            'type': 'hidden'
        }));
        
        // Add to document and submit
        $('body').append(form);
        form.submit();
    }
    
    // Function to directly checkout
    function directCheckout() {
        const productId = $('button[name="add-to-cart"]').val();
        const rentalDates = $('#rental_dates').val();
        const rentalDays = $('#rental_days').val();
        
        // Create a temporary form
        const form = $('<form>', {
            'action': '/checkout/',
            'method': 'post',
            'style': 'display:none'
        });
        
        // Add all necessary fields
        form.append($('<input>', {
            'name': 'add-to-cart',
            'value': productId,
            'type': 'hidden'
        }));
        
        form.append($('<input>', {
            'name': 'rental_dates',
            'value': rentalDates,
            'type': 'hidden'
        }));
        
        form.append($('<input>', {
            'name': 'rental_days',
            'value': rentalDays,
            'type': 'hidden'
        }));
        
        form.append($('<input>', {
            'name': 'checkout',
            'value': '1',
            'type': 'hidden'
        }));
        
        // Add to document and submit
        $('body').append(form);
        form.submit();
    }
    
    function setupDirectHandlers() {
        // ULTRA-AGGRESSIVE: Completely take over ALL button clicks on the page
        $(document).on('click', '.single_add_to_cart_button, button[name="add-to-cart"], input[name="add-to-cart"]', function(e) {
            if (areSelectedDatesInFuture()) {
                // Stop propagation to ALL handlers
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Determine if this is a checkout button
                if ($(this).hasClass('btn-redirect')) {
                    console.log('🔴🔴 MAXIMUM OVERRIDE: Direct checkout for future dates');
                    directCheckout();
                } else {
                    console.log('🔴🔴 MAXIMUM OVERRIDE: Direct add to cart for future dates');
                    directAddToCart();
                }
                
                return false;
            }
        });
        
        // Take over form submissions as well
        $(document).on('submit', 'form.cart', function(e) {
            if (areSelectedDatesInFuture()) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log('🔴🔴 MAXIMUM OVERRIDE: Intercepting form submission for future dates');
                directAddToCart();
                return false;
            }
        });
        
        // Enable all buttons
        $('.single_add_to_cart_button').prop('disabled', false)
                                      .removeClass('disabled')
                                      .css('opacity', '1')
                                      .css('cursor', 'pointer');
    }
    
    // Run our setup
    function initializeOverride() {
        if (areSelectedDatesInFuture()) {
            console.log('🔴 Future dates detected, initializing complete override');
            setupDirectHandlers();
            
            // Hide any error messages
            $('#zero-stock-modal, #zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning').remove();
        }
    }
    
    // Run when dates are confirmed or changed
    $(document).on('change', '#rental_dates', function() {
        setTimeout(initializeOverride, 100);
    });
    
    $(document).on('click', '.confirm-dates', function() {
        setTimeout(initializeOverride, 300);
    });
    
    // Run periodically
    setInterval(initializeOverride, 1000);
    
    // Initial run
    setTimeout(initializeOverride, 500);
});
