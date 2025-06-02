/**
 * Calendar Future Date Fixer
 * Ensures all future date cells (3+ days ahead) are always selectable
 * This runs silently with minimal logging
 */
jQuery(document).ready(function($) {
    // Constants
    const FUTURE_DAYS_THRESHOLD = 3;
    
    /**
     * Makes all future dates selectable
     */
    function enableFutureDateCells() {
        const today = new Date();
        
        // Find all day cells in the calendar
        $('.day-cell').each(function() {
            const dateAttr = $(this).data('date');
            
            if (dateAttr) {
                const cellDate = new Date(dateAttr);
                const diffDays = Math.ceil((cellDate - today) / (1000 * 60 * 60 * 24));
                
                // If date is sufficiently in future, make it selectable
                if (diffDays >= FUTURE_DAYS_THRESHOLD) {
                    $(this).removeClass('disabled')
                           .attr('data-selectable', 'true')
                           .addClass('future-available')
                           .removeAttr('title');
                    
                    // Remove reservation flag if present
                    if ($(this).data('reservations')) {
                        $(this).removeAttr('data-reservations');
                    }
                }
            }
        });
    }
    
    /**
     * ULTRA AGGRESSIVE: Force enable all buttons for future dates
     * This completely bypasses all validation and ensures buttons are always clickable
     */
    function enableAllButtons() {
        // Check if dates are selected
        const datesSelected = $('#rental_dates').val() || '';
        let isFutureDate = false;
        
        // Check if selected dates are in the future
        if (datesSelected) {
            const rentalDates = datesSelected.split(' - ');
            if (rentalDates.length > 0) {
                const parts = rentalDates[0].split('.');
                if (parts.length === 3) {
                    const date = new Date(parts[2], parts[1] - 1, parts[0]);
                    const today = new Date();
                    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
                    isFutureDate = (diffDays >= FUTURE_DAYS_THRESHOLD);
                }
            }
        }
        
        // Alternatively, check if selected calendar cells indicate future dates
        if (!isFutureDate) {
            const selectedStartCell = $('.day-cell.selected-start');
            if (selectedStartCell.length > 0 && selectedStartCell.hasClass('future-available')) {
                isFutureDate = true;
            }
        }
        
        // FORCE ENABLE if future dates are selected
        if (isFutureDate) {
            // Use direct DOM manipulation for maximum compatibility
            document.querySelectorAll('.single_add_to_cart_button').forEach(button => {
                // Remove disabled attribute
                button.disabled = false;
                button.removeAttribute('disabled');
                
                // Remove disabled class
                button.classList.remove('disabled');
                
                // Set style properties directly
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                
                // Update ARIA
                button.setAttribute('aria-disabled', 'false');
            });
            
            // Hide any error messages
            document.querySelectorAll('#zero-stock-modal, #zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning, #duplicate-order-notice').forEach(el => {
                if (el) el.style.display = 'none';
            });
            
            // Also directly set style for jQuery fallback
            $('.single_add_to_cart_button').css('opacity', '1').css('cursor', 'pointer');
        }
        
        // Special handling for duplicate order notice which can prevent ordering
        $('#duplicate-order-notice').hide();
    }
    
    /**
     * Enhance confirm dates button with better visual feedback
     */
    function enhanceConfirmButton() {
        const confirmButton = $('#confirm-dates');
        
        if (confirmButton.length) {
            // Make sure the button has proper styling
            confirmButton.css({
                'background-color': '#4CAF50', 
                'color': 'white',
                'font-weight': 'bold',
                'border': '2px solid #45a049',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
                'transform': 'scale(1.02)',
                'transition': 'all 0.2s ease'
            });
            
            // Add visual feedback for hover/click
            if (!confirmButton.data('enhanced')) {
                confirmButton.hover(
                    function() { 
                        $(this).css({
                            'background-color': '#45a049', 
                            'transform': 'scale(1.05)',
                            'box-shadow': '0 3px 6px rgba(0,0,0,0.3)'
                        }); 
                    },
                    function() { 
                        $(this).css({
                            'background-color': '#4CAF50',
                            'transform': 'scale(1.02)',
                            'box-shadow': '0 2px 4px rgba(0,0,0,0.2)'
                        }); 
                    }
                );
                
                confirmButton.mousedown(function() {
                    $(this).css({
                        'background-color': '#3d8b40',
                        'transform': 'scale(0.98)',
                        'box-shadow': '0 1px 2px rgba(0,0,0,0.2)'
                    });
                });
                
                confirmButton.mouseup(function() {
                    $(this).css({
                        'background-color': '#45a049',
                        'transform': 'scale(1.02)',
                        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)'
                    });
                });
                
                // Mark as enhanced to avoid duplicate handlers
                confirmButton.data('enhanced', true);
            }
        }
    }

    // Run our functions whenever a calendar change happens
    $(document).on('click', '.day-cell, .confirm-dates, #confirm-dates', function() {
        // Use setTimeout to ensure this runs after other calendar scripts
        setTimeout(function() {
            enableFutureDateCells();
            enableAllButtons();
            enhanceConfirmButton();
        }, 100);
    });
    
    // Also run when the rental dates input changes
    $(document).on('change', '#rental_dates', function() {
        enableFutureDateCells();
        enableAllButtons();
        enhanceConfirmButton();
    });
    
    // Run every second to ensure compliance
    setInterval(function() {
        enableFutureDateCells();
        enableAllButtons();
        // Only occasionally check for button enhancement (less resource intensive)
        if (Math.random() < 0.1) enhanceConfirmButton();
    }, 1000);
    
    // Initial run
    enableFutureDateCells();
    setTimeout(function() {
        enableAllButtons();
        enhanceConfirmButton();
    }, 500);
    
    // Add a special event listener for just after the page loads
    $(window).on('load', function() {
        setTimeout(enhanceConfirmButton, 1000);
    });
});
