/**
 * Form Submission Validator for Rental Products
 * Ensures proper date validation before form submission
 */

jQuery(document).ready(function($) {
    'use strict';
    
    console.log('🔒 Form Submission Validator loaded');
    
    // Function to check if any date in the range is marked as disabled
    function hasUnavailableDates() {
        // Check if any date in the range is marked as disabled
        if ($('.day-cell.disabled.in-range').length > 0) {
            console.log('Found disabled dates in range');
            return true;
        }
        
        // Check the validation message
        const dateValidationMsg = $('#date-validation-message');
        if (dateValidationMsg.length && dateValidationMsg.is(':visible') && 
            dateValidationMsg.hasClass('error')) {
            console.log('Found error validation message');
            return true;
        }
        
        // Additional check for the rental_dates input value
        const rentalDates = $('#rental_dates').val();
        if (!rentalDates || rentalDates.trim() === '') {
            console.log('No rental dates selected');
            return true;
        }
        
        return false;
    }
    
    // Function to disable form submission
    function disableFormSubmission() {
        console.log('Disabling form submission');
        
        // Show the validation message
        $('#date-validation-message')
            .text('לא ניתן להזמין בתאריכים שנבחרו. אנא בחר תאריכים אחרים.')
            .addClass('error')
            .fadeIn();
            
        // Scroll to the message
        $('html, body').animate({
            scrollTop: $('#date-validation-message').offset().top - 100
        }, 500);
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        console.log('Form submission attempted');
        
        // Only process if this is a rental product form
        if ($('form.cart').length === 0 || $('#rental_dates').length === 0) {
            console.log('Not a rental product form, allowing submission');
            return true; // Not a rental product form, allow submission
        }
        
        // Check for unavailable dates
        if (hasUnavailableDates()) {
            console.log('Unavailable dates detected, preventing submission');
            e.preventDefault();
            e.stopPropagation();
            disableFormSubmission();
            return false;
        }
        
        // If we get here, validation passed - allow form submission
        console.log('Form validation passed, allowing submission');
        return true;
    }
    
    // Set up form submission handler with event delegation
    $(document).off('submit', 'form.cart').on('submit', 'form.cart', handleFormSubmit);
    
    // Also handle button clicks directly as an additional safeguard
    $('body').on('click', '.single_add_to_cart_button, .btn-redirect', function(e) {
        // Only process if this is a rental product form
        if ($('form.cart').length === 0 || $('#rental_dates').length === 0) {
            return true;
        }
        
        // Check for unavailable dates
        if (hasUnavailableDates()) {
            console.log('Button click: Unavailable dates detected, preventing submission');
            e.preventDefault();
            e.stopPropagation();
            disableFormSubmission();
            return false;
        }
        
        return true;
    });
    
    console.log('🔒 Form submission validation is active');
});
