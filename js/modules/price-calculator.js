/**
 * Price Calculator for Rental Products
 * Handles the price calculation for rental products based on selected dates
 */

(function($) {
    'use strict';

    // Global variables
    var basePrice = 0;
    var discountType = '';
    var discountValue = 0;
    var stockQuantity = 1;
    
    // Debug log function
    function logDebug(message) {
        if (typeof console !== 'undefined') {
            console.log('💰 ' + message);
        }
    }
    
    // Format currency
    function formatCurrency(amount) {
        return amount.toFixed(2) + ' ₪';
    }
    
    // Parse the rental dates
    function parseRentalDates(rentalDatesStr) {
        if (!rentalDatesStr || rentalDatesStr.indexOf(' - ') === -1) {
            return null;
        }
        
        var dates = rentalDatesStr.split(' - ');
        if (dates.length !== 2) {
            return null;
        }
        
        var startDate = parseDate(dates[0]);
        var endDate = parseDate(dates[1]);
        
        if (!startDate || !endDate) {
            return null;
        }
        
        return {
            start: startDate,
            end: endDate
        };
    }
    
    // Parse date from string (DD.MM.YYYY)
    function parseDate(dateString) {
        var parts = dateString.split('.');
        if (parts.length !== 3) {
            return null;
        }
        
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    }
    
    // Calculate rental days
    function calculateRentalDays(startDate, endDate) {
        // Calculate days difference
        var days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Special case for weekend (Friday-Saturday counts as one day)
        var weekendAdjustment = 0;
        var currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            // Check if the current day is Friday (5)
            if (currentDate.getDay() === 5) {
                // Check if the next day is Saturday and is included in the range
                var nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                
                if (nextDay <= endDate && nextDay.getDay() === 6) {
                    weekendAdjustment++;
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Adjust days (subtract weekend adjustment)
        var adjustedDays = days - weekendAdjustment;
        logDebug('Rental days: ' + days + ', Adjusted (weekends combined): ' + adjustedDays);
        
        return adjustedDays;
    }
    
    // Calculate rental price
    function calculateRentalPrice(startDate, endDate) {
        if (!startDate || !endDate) {
            return basePrice;
        }
        
        // Calculate adjusted rental days
        var adjustedDays = calculateRentalDays(startDate, endDate);
        
        // Calculate base price
        var totalPrice = basePrice * adjustedDays;
        
        // Apply discount if applicable
        if (adjustedDays >= 7 && discountValue > 0) {
            if (discountType === 'percentage') {
                var discount = totalPrice * (discountValue / 100);
                totalPrice -= discount;
                logDebug('Applied ' + discountValue + '% discount: -' + discount.toFixed(2) + ' ₪');
            } else if (discountType === 'fixed') {
                totalPrice -= discountValue;
                logDebug('Applied fixed discount: -' + discountValue.toFixed(2) + ' ₪');
            }
        }
        
        logDebug('Total price: ' + totalPrice.toFixed(2) + ' ₪');
        return totalPrice;
    }
    
    // Update price display
    function updatePriceDisplay() {
        var rentalDatesStr = $('#rental_dates').val();
        var dates = parseRentalDates(rentalDatesStr);
        
        if (!dates) {
            $('.price-calc-display').html(formatCurrency(basePrice));
            return;
        }
        
        var price = calculateRentalPrice(dates.start, dates.end);
        $('.price-calc-display').html(formatCurrency(price));
        $('.rental-price-amount').text(formatCurrency(price));
        
        // Also update the price in the add to cart form
        $('input[name="rental_price"]').val(price.toFixed(2));
    }
    
    // Initialize price calculator
    function initPriceCalculator() {
        // Get product data from the page
        basePrice = parseFloat($('.product-price-data').data('base-price') || 0);
        discountType = $('.product-price-data').data('discount-type') || '';
        discountValue = parseFloat($('.product-price-data').data('discount-value') || 0);
        stockQuantity = parseInt($('.product-price-data').data('stock-quantity') || 1, 10);
        
        logDebug('Initialized price calculator with:');
        logDebug('Base price: ' + basePrice + ' ₪');
        logDebug('Discount type: ' + discountType);
        logDebug('Discount value: ' + discountValue);
        logDebug('Stock quantity: ' + stockQuantity);
        
        // Set values in global window object for other scripts
        window.basePrice = basePrice;
        window.discountType = discountType;
        window.discountValue = discountValue;
        window.stockQuantity = stockQuantity;
        
        // Listen for changes to the rental dates
        $('#rental_dates').on('change', updatePriceDisplay);
        
        // Also hook into the Air Datepicker select event
        if (window.rentalDatepicker) {
            logDebug('Connected to Air Datepicker for price updates');
        }
    }
    
    // Initialize on document ready
    $(document).ready(function() {
        logDebug('Price calculator initialized');
        initPriceCalculator();
        
        // Initial price update
        updatePriceDisplay();
    });
    
})(jQuery);
