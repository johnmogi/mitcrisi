/**
 * Mitnafun UPro - Product Page JavaScript
 * Handles product-specific functionality including rental date selection
 */

(function($) {
    'use strict';
    
    // Run when document is ready
    $(document).ready(function() {
        // Initialize rental date functionality
        initRentalDatePicker();
        
        // Handle pickup time selection
        initPickupTimeSelection();
        
        // Handle rental price calculations
        initRentalPriceCalculation();
    });
    
    /**
     * Initialize rental date picker
     */
    function initRentalDatePicker() {
        // If we're not on a product page or the date picker isn't present, exit
        if (!$('.rental-dates-field').length) {
            return;
        }
        
        // Set up date range picker
        $('.rental-dates-field').each(function() {
            var $field = $(this);
            
            // Log debug info
            console.log('Initializing date picker for product');
            
            // Set up date selection events
            $(document).on('change', '.rental-dates-field', function() {
                var dateRange = $(this).val();
                if (dateRange) {
                    console.log('Date range selected: ' + dateRange);
                    calculateRentalPrice(dateRange);
                    updateReturnInstructions(dateRange);
                }
            });
        });
    }
    
    /**
     * Initialize pickup time selection
     */
    function initPickupTimeSelection() {
        // Watch for pickup time changes
        $(document).on('change', 'select[name="pickup_time"]', function() {
            var selectedTime = $(this).val();
            console.log('Pickup time selected: ' + selectedTime);
            
            // Store selected time in a hidden field for form submission
            if ($('input[name="pickup_time_hidden"]').length) {
                $('input[name="pickup_time_hidden"]').val(selectedTime);
            } else {
                $('<input>').attr({
                    type: 'hidden',
                    name: 'pickup_time_hidden',
                    value: selectedTime
                }).appendTo('form.cart');
            }
        });
    }
    
    /**
     * Initialize rental price calculation
     */
    function initRentalPriceCalculation() {
        // This will be called when dates are selected
    }
    
    /**
     * Calculate rental price based on selected dates
     */
    function calculateRentalPrice(dateRange) {
        if (!dateRange) return;
        
        // Split the date range
        var dates = dateRange.split(' - ');
        if (dates.length !== 2) return;
        
        var startDate = parseDate(dates[0]);
        var endDate = parseDate(dates[1]);
        
        if (!startDate || !endDate) return;
        
        console.log('Calculating price for rental from ' + startDate + ' to ' + endDate);
        
        // This is just a placeholder for the actual calculation logic
        // The real calculation would be implemented based on your rental pricing rules
    }
    
    /**
     * Update return instructions based on selected dates
     */
    function updateReturnInstructions(dateRange) {
        if (!dateRange) return;
        
        // Split the date range
        var dates = dateRange.split(' - ');
        if (dates.length !== 2) return;
        
        var endDate = parseDate(dates[1]);
        if (!endDate) return;
        
        // Update return instructions
        var returnText = 'Return by 11:00 on ' + formatDate(endDate);
        $('.return-instructions').text(returnText);
    }
    
    /**
     * Parse date from string (DD.MM.YYYY format)
     */
    function parseDate(dateStr) {
        if (!dateStr) return null;
        
        var parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        
        // JavaScript months are 0-based, so subtract 1 from the month
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    /**
     * Format date to string
     */
    function formatDate(date) {
        if (!date) return '';
        
        var day = date.getDate();
        var month = date.getMonth() + 1; // JavaScript months are 0-based
        var year = date.getFullYear();
        
        return day + '.' + month + '.' + year;
    }
    
})(jQuery);
