/**
 * Fallback Calendar System
 * Provides a robust calendar implementation when the primary system fails
 */

(function($) {
    'use strict';
    
    // Global variables from PHP
    var bookedDates = window.bookedDates || [];
    var stockQuantity = window.stockQuantity || 0;
    var maxRentalDays = window.maxRentalDays || 14;
    
    // Initialize fallback calendar
    function initFallbackCalendar() {
        console.log('🛟 Initializing fallback calendar system');
        
        if (!$('#datepicker-container').length) {
            console.error('Datepicker container not found');
            return;
        }
        
        // Create calendar container if needed
        if (!$('#fallback-calendar').length) {
            $('#datepicker-container').append('<div id="fallback-calendar" class="fallback-calendar"></div>');
        }
        
        // Generate month view
        generateMonthView();
        
        // Set up event handlers
        setupDateSelection();
    }
    
    // Generate month view
    function generateMonthView() {
        var today = new Date();
        var currentMonth = today.getMonth();
        var currentYear = today.getFullYear();
        
        // Generate 3 months
        for (var i = 0; i < 3; i++) {
            var monthDate = new Date(currentYear, currentMonth + i, 1);
            var monthHtml = generateMonthHtml(monthDate);
            $('#fallback-calendar').append(monthHtml);
        }
    }
    
    // Generate HTML for a month
    function generateMonthHtml(date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Month names in Hebrew
        var monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        
        // Day names in Hebrew
        var dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        
        var html = '<div class="month-container" data-month="' + month + '" data-year="' + year + '">';
        html += '<div class="month-header">' + monthNames[month] + ' ' + year + '</div>';
        html += '<div class="weekdays-row">';
        
        // Add day headers
        for (var i = 0; i < 7; i++) {
            html += '<div class="weekday">' + dayNames[i] + '</div>';
        }
        
        html += '</div><div class="days-grid">';
        
        // Add empty cells for days before the first day of the month
        for (var i = 0; i < firstDay; i++) {
            html += '<div class="day empty"></div>';
        }
        
        // Add days of the month
        var today = new Date();
        var todayDate = today.getDate();
        var todayMonth = today.getMonth();
        var todayYear = today.getFullYear();
        
        for (var i = 1; i <= daysInMonth; i++) {
            var dayDate = new Date(year, month, i);
            var dayOfWeek = dayDate.getDay();
            
            var isToday = (i === todayDate && month === todayMonth && year === todayYear);
            var isPast = dayDate < today && !isToday;
            var isSaturday = dayOfWeek === 6;
            var isDisabled = isPast || isSaturday || isDateBooked(dayDate);
            
            var classes = 'day';
            if (isToday) classes += ' today';
            if (isPast) classes += ' past';
            if (isSaturday) classes += ' saturday';
            if (isDisabled) classes += ' disabled';
            
            html += '<div class="' + classes + '" data-date="' + formatDate(dayDate) + '">' + i + '</div>';
        }
        
        html += '</div></div>';
        
        return html;
    }
    
    // Check if a date is booked
    function isDateBooked(date) {
        // If stock quantity > 1, dates are not considered booked
        if (stockQuantity > 1) {
            return false;
        }
        
        // Check each booked date range
        for (var i = 0; i < bookedDates.length; i++) {
            var dateRange = bookedDates[i];
            var dates = dateRange.split(' - ');
            
            if (dates.length === 2) {
                var startDate = parseDate(dates[0]);
                var endDate = parseDate(dates[1]);
                
                if (startDate && endDate && date >= startDate && date <= endDate) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Parse date from DD.MM.YYYY format
    function parseDate(dateStr) {
        var parts = dateStr.split('.');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return null;
    }
    
    // Format date to DD.MM.YYYY
    function formatDate(date) {
        var day = date.getDate().toString().padStart(2, '0');
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var year = date.getFullYear();
        
        return day + '.' + month + '.' + year;
    }
    
    // Set up date selection
    function setupDateSelection() {
        var selectedStartDate = null;
        var selectedEndDate = null;
        
        // Handle date click
        $('#fallback-calendar').on('click', '.day:not(.disabled)', function() {
            var dateStr = $(this).data('date');
            var date = parseDate(dateStr);
            
            if (!date) return;
            
            // First selection or reset
            if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
                // Reset selection
                $('.day').removeClass('selected start-date end-date in-range');
                
                // Set start date
                selectedStartDate = date;
                selectedEndDate = null;
                
                $(this).addClass('selected start-date');
                
                console.log('Selected start date: ' + dateStr);
            } 
            // Second selection
            else if (selectedStartDate && !selectedEndDate) {
                // Ensure end date is after start date
                if (date < selectedStartDate) {
                    // Swap dates
                    selectedEndDate = selectedStartDate;
                    selectedStartDate = date;
                    
                    // Update UI
                    $('.day').removeClass('selected start-date end-date in-range');
                    $('.day[data-date="' + formatDate(selectedStartDate) + '"]').addClass('selected start-date');
                    $('.day[data-date="' + formatDate(selectedEndDate) + '"]').addClass('selected end-date');
                } else {
                    selectedEndDate = date;
                    $(this).addClass('selected end-date');
                }
                
                // Highlight days in range
                highlightDaysInRange();
                
                // Update rental form
                updateRentalForm();
                
                console.log('Selected date range: ' + formatDate(selectedStartDate) + ' - ' + formatDate(selectedEndDate));
            }
        });
    }
    
    // Highlight days in the selected range
    function highlightDaysInRange() {
        if (!selectedStartDate || !selectedEndDate) return;
        
        $('.day').each(function() {
            var dateStr = $(this).data('date');
            var date = parseDate(dateStr);
            
            if (date && date > selectedStartDate && date < selectedEndDate) {
                $(this).addClass('in-range');
            }
        });
    }
    
    // Update rental form with selected dates
    function updateRentalForm() {
        if (!selectedStartDate || !selectedEndDate) return;
        
        // Set rental dates input
        var rentalDates = formatDate(selectedStartDate) + ' - ' + formatDate(selectedEndDate);
        $('#rental_dates').val(rentalDates);
        
        // Update pickup and return info display
        var pickupTime = window.productPickupTime ? window.productPickupTime + ':00' : '11:00';
        var returnTime = window.productReturnTime || '10:00';
        
        $('#pickup-info').text('איסוף: ' + formatDate(selectedStartDate) + ' בשעה ' + pickupTime);
        $('#return-info').text('החזרה: ' + formatDate(selectedEndDate) + ' עד השעה ' + returnTime);
        
        // Set pickup time input
        $('#pickup_time').val(pickupTime);
        
        // Update price calculation
        updatePriceCalculation();
        
        // Enable add to cart button
        $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
    }
    
    // Update price calculation
    function updatePriceCalculation() {
        if (!selectedStartDate || !selectedEndDate || !window.basePrice) return;
        
        // Calculate days difference
        var days = Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Weekend adjustment (Friday-Saturday counts as one day)
        var weekendAdjustment = 0;
        var currentDate = new Date(selectedStartDate);
        
        while (currentDate <= selectedEndDate) {
            if (currentDate.getDay() === 5) { // Friday
                var nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                
                if (nextDay <= selectedEndDate && nextDay.getDay() === 6) { // Saturday
                    weekendAdjustment++;
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Adjust days
        var adjustedDays = days - weekendAdjustment;
        
        // Calculate price
        var price = window.basePrice * adjustedDays;
        
        // Apply discount if applicable
        if (adjustedDays >= 7 && window.discountValue > 0) {
            if (window.discountType === 'percentage') {
                var discount = price * (window.discountValue / 100);
                price -= discount;
            } else if (window.discountType === 'fixed') {
                price -= window.discountValue;
            }
        }
        
        // Update price display
        var formattedPrice = price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        $('.rental-price').text(formattedPrice + ' ₪');
        $('.woocommerce-Price-amount bdi').html(formattedPrice + ' <span class="woocommerce-Price-currencySymbol">₪</span>');
        
        console.log('Updated price calculation: ' + adjustedDays + ' days, ' + formattedPrice + ' ₪');
    }
    
    // Initialize on document ready
    $(document).ready(function() {
        // Only initialize on product pages with datepicker container
        if ($('#datepicker-container').length) {
            // Check if the main datepicker failed to initialize
            setTimeout(function() {
                if (!$('.air-datepicker').length) {
                    console.log('🛟 Main datepicker not found, activating fallback system');
                    initFallbackCalendar();
                }
            }, 1000);
        }
    });
    
    // Export functions for external use
    window.fallbackCalendar = {
        init: initFallbackCalendar
    };
    
})(jQuery);
