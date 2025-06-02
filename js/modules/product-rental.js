/**
 * Product Rental JavaScript
 * Handles rental date selection, price calculation, and product page functionality
 */

(function($) {
    'use strict';
    
    // Global variables from PHP
    var bookedDates = window.bookedDates || [];
    var stockQuantity = window.stockQuantity || 0;
    var maxRentalDays = window.maxRentalDays || 14;
    var businessHours = window.businessHours || {};
    var productPickupTime = window.productPickupTime || 11;
    var productReturnTime = window.productReturnTime || '10:00';
    var basePrice = window.basePrice || 0;
    var discountType = window.discountType || 'percentage';
    var discountValue = window.discountValue || 0;
    
    // Date format utilities
    function formatDateForDisplay(date) {
        var day = date.getDate().toString().padStart(2, '0');
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var year = date.getFullYear();
        return day + '.' + month + '.' + year;
    }
    
    function parseDate(dateString) {
        if (!dateString) return null;
        
        var parts = dateString.split('.');
        if (parts.length !== 3) return null;
        
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    }
    
    // Utility function to check if a date is a weekend
    function isWeekend(date) {
        var day = date.getDay();
        return day === 5 || day === 6; // 5 = Friday, 6 = Saturday
    }
    
    // Utility function to check if a date is booked
    function isDateBooked(date) {
        // Format date as YYYY-MM-DD for comparison with booked dates
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        var formattedDate = year + '-' + month + '-' + day;
        
        return bookedDates.includes(formattedDate);
    }
    
    // Update pickup time options based on pickup day
    function updatePickupTimeOptions(startDate) {
        // Implementation may vary based on specific requirements
        // This is a placeholder for the function referenced in updatePickupReturnInfo
    }
    
    // Update pickup and return info display
    function updatePickupReturnInfo(startDate, endDate) {
        if (!startDate || !endDate) return;
        
        // Format the date information
        var pickupDay = startDate.getDate().toString().padStart(2, '0');
        var pickupMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
        var pickupDayOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][startDate.getDay()];
        
        var returnDay = endDate.getDate().toString().padStart(2, '0');
        var returnMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
        var returnDayOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][endDate.getDay()];
        
        // Update pickup info display
        $('#pickup-info').html(
            '<strong>איסוף:</strong> יום ' + pickupDayOfWeek + ' ' + pickupDay + '/' + pickupMonth + 
            ' בשעה ' + productPickupTime + ':00'
        );
        
        // Update return info display
        $('#return-info').html(
            '<strong>החזרה:</strong> יום ' + returnDayOfWeek + ' ' + returnDay + '/' + returnMonth + 
            ' בשעה ' + productReturnTime
        );
        
        // Show pickup and return info
        $('.rental-info-container').show();
        
        // Update pickup time options based on pickup day
        updatePickupTimeOptions(startDate);
        
        // Check if pickup time is already selected
        var pickupTime = $('#pickup_time').val();
        if (pickupTime) {
            console.log('Pickup time already selected: ' + pickupTime + ', enabling add to cart button');
            // Enable button if dates and pickup time are selected
            $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
        } else {
            console.log('Pickup time not selected yet, waiting for user to select time');
            // Keep button disabled until pickup time is selected
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
        }
    }
    
    // Setup pickup time selection
    function setupPickupTimeSelection() {
        $('#pickup_time').on('change', function() {
            var selectedTime = $(this).val();
            console.log('Pickup time selected: ' + selectedTime);
            
            // Check if we have valid dates selected
            var rentalDates = $('#rental_dates').val();
            if (rentalDates && rentalDates.includes(' - ') && selectedTime) {
                console.log('Both dates and pickup time are selected, enabling add to cart button');
                $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
            } else {
                console.log('Either dates or pickup time is missing, button remains disabled');
                $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
            }
        });
    }
    
    // Initialize datepicker
    function initRentalDatepicker() {
        try {
            console.log('Initializing Air Datepicker');
            
            // Calculate minDate (3 days from today)
            var today = new Date();
            var minDate = new Date();
            minDate.setDate(today.getDate() + 3);
            
            // Calculate maxDate (3 months from today)
            var maxDate = new Date();
            maxDate.setMonth(today.getMonth() + 3);
            
            // Initialize Air Datepicker
            if ($('#datepicker-container').length === 0) {
                console.error('Datepicker container not found');
                return false;
            }
            
            // Check if AirDatepicker is available
            if (typeof AirDatepicker !== 'function') {
                console.error('AirDatepicker library not loaded');
                return false;
            }
            
            new AirDatepicker('#datepicker-container', {
                inline: true,
                range: true,
                multipleDates: true,
                multipleDatesSeparator: ' - ',
                dateFormat: 'dd.MM.yyyy',
                minDate: minDate,
                maxDate: maxDate,
                
                onRenderCell: function(date, cellType) {
                    if (cellType === 'day') {
                        var disabled = false;
                        var classes = '';
                        
                        // Check if date is booked or in the past
                        if (date < minDate || isDateBooked(date)) {
                            disabled = true;
                            classes += ' -disabled-';
                        }
                        
                        // Check if date is a weekend
                        if (isWeekend(date)) {
                            classes += ' -weekend-';
                        }
                        
                        return {
                            disabled: disabled,
                            classes: classes
                        };
                    }
                },
                
                onSelect: function({date, formattedDate, datepicker}) {
                    if (!date || !Array.isArray(date) || date.length !== 2) {
                        console.log('Invalid date selection');
                        $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
                        return;
                    }
                    
                    console.log('Date selected:', formattedDate);
                    $('#rental_dates').val(formattedDate.join(' - '));
                    if (window.calculateRentalPrice) window.calculateRentalPrice();
                    updatePickupReturnInfo(date[0], date[1]);
                    
                    // Check if pickup time is selected
                    var pickupTime = $('#pickup_time').val();
                    if (pickupTime) {
                        console.log('Enabling add to cart button due to valid date selection and pickup time');
                        $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
                    } else {
                        console.log('Waiting for pickup time selection');
                        $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
                    }
                },
                
                locale: {
                    days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                    daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                    daysMin: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                    months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                    monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                    today: 'היום',
                    clear: 'נקה',
                    dateFormat: 'dd.MM.yyyy',
                    timeFormat: 'HH:mm',
                    firstDay: 0
                }
            });
            
            return true; // Successful initialization
        } catch(e) {
            console.error('Failed to initialize datepicker: ' + e.message);
            return false;
        }
    }
    
    // Initialize fallback calendar if AirDatepicker fails
    function initFallbackCalendar() {
        console.log('Initializing fallback calendar');
        
        if (window.fallbackCalendar && typeof window.fallbackCalendar.init === 'function') {
            console.log('Initializing fallback calendar system');
            window.fallbackCalendar.init({
                container: '#datepicker-container',
                onDateSelect: function(startDate, endDate) {
                    updatePickupReturnInfo(startDate, endDate);
                }
            });
            return true;
        } else {
            console.error('Fallback calendar not available');
            return false;
        }
    }
    
    // Initialize pickup time dropdown
    function initPickupTimeDropdown() {
        // Add change event listener to pickup time select
        $('#pickup_time').on('change', function() {
            var selectedTime = $(this).val();
            console.log('Pickup time selected: ' + selectedTime);
            
            // Check if we have valid dates selected
            var rentalDates = $('#rental_dates').val();
            if (rentalDates && rentalDates.includes(' - ') && selectedTime) {
                console.log('Both dates and pickup time are selected, enabling add to cart button');
                $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
            } else {
                console.log('Either dates or pickup time is missing, button remains disabled');
                $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
            }
        });
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('Product rental script initialized');
        
        // Check if datepicker container exists
        if ($('#datepicker-container').length) {
            console.log('Datepicker container found');
            
            // Initialize global variables from data attributes
            var $productData = $('.product-price-data');
            if ($productData.length) {
                window.basePrice = parseFloat($productData.data('base-price') || 0);
                window.discountType = $productData.data('discount-type') || '';
                window.discountValue = parseFloat($productData.data('discount-value') || 0);
                window.stockQuantity = parseInt($productData.data('stock-quantity') || 1, 10);
            }
            
            // Initial state - buttons should be disabled until dates are selected
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
            
            // Add a delay to ensure we don't have duplicate initializations
            setTimeout(function() {
                // Check if Air Datepicker is available
                if (typeof AirDatepicker !== 'undefined') {
                    console.log('AirDatepicker found, initializing');
                    initRentalDatepicker();
                } else {
                    console.error('AirDatepicker not found, loading fallback');
                    // Load fallback calendar
                    initFallbackCalendar();
                }
                
                // Initialize pickup time dropdown
                initPickupTimeDropdown();
                
                // Setup pickup time selection
                setupPickupTimeSelection();
                
                // Safety check to ensure datepicker is loaded
                setTimeout(function() {
                    var $datepickerContainer = $('#datepicker-container');
                    if ($datepickerContainer.length && !$datepickerContainer.find('.air-datepicker').length) {
                        console.log('Datepicker container exists but appears empty, reinitializing...');
                        initRentalDatepicker();
                    }
                    
                    // Check if rental_dates has a value but button is still disabled
                    var rentalDates = $('#rental_dates').val();
                    if (rentalDates && rentalDates.includes(' - ')) {
                        console.log('Rental dates are selected: ' + rentalDates);
                        var isDisabled = $('.single_add_to_cart_button').prop('disabled');
                        if (isDisabled) {
                            console.log('Enabling button based on existing date selection');
                            var pickupTime = $('#pickup_time').val();
                            if (pickupTime) {
                                $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
                            }
                        }
                    } else {
                        console.log('No rental dates selected, button should remain disabled');
                    }
                }, 1000);
            }, 100); // Small delay to avoid race conditions
        }
    });
    
})(jQuery);
