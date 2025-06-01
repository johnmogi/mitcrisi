/**
 * Bottleneck Order Validator
 * 
 * This script enhances pickup time validation for cases where:
 * 1. The same product is involved in multiple orders
 * 2. The new order's pickup time must be after the return time of the last order
 */
jQuery(document).ready(function($) {
    console.log('Bottleneck order validator loaded');
    
    // Get current date and time
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = formatDate(now);
    
    // Only run on checkout page
    if (!$('form.checkout').length) {
        return;
    }
    
    // Add warning container if it doesn't exist yet
    if (!$('#bottleneck-warning').length) {
        $('<div id="bottleneck-warning" style="display: none; margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;"></div>')
            .insertAfter('#select_time');
    }
    
    // Load product data from cart
    let cartProducts = [];
    let selectedDate = '';
    let reservedProductData = {};
    
    // Get cart data directly from the page
    function extractCartData() {
        const cartItems = $('.cart_item');
        const products = [];
        
        cartItems.each(function() {
            const cartKey = $(this).data('cart_item_key');
            const rentalDates = $(this).data('rental_dates');
            const productName = $(this).find('.product-name').text().trim();
            
            // Extract product ID from hidden meta if available
            let productId = 0;
            if (window.mitnafunPickupData && mitnafunPickupData.product_ids) {
                productId = mitnafunPickupData.product_ids[0]; // Use first product as fallback
            }
            
            // Add extracted product to the list
            products.push({
                product_id: productId,
                cart_key: cartKey,
                rental_dates: rentalDates,
                product_name: productName
            });
        });
        
        return products;
    }
    
    // Function to check reserved products
    function checkReservedProducts() {
        // Get cart data from page
        cartProducts = extractCartData();
        
        // Find the earliest rental date in the cart
        selectedDate = '';
        $('.cart_item').each(function() {
            const dates = $(this).data('rental_dates');
            if (dates && dates.includes(' - ')) {
                const startDate = dates.split(' - ')[0];
                if (!selectedDate || startDate < selectedDate) {
                    selectedDate = startDate;
                }
            }
        });
        
        if (!selectedDate) {
            // Try to get date from rental_dates field
            const rentalDatesField = $('[name="rental_dates"]');
            if (rentalDatesField.length && rentalDatesField.val() && rentalDatesField.val().includes(' - ')) {
                selectedDate = rentalDatesField.val().split(' - ')[0];
            }
        }
        
        if (!selectedDate) {
            console.log('No rental dates found, skipping bottleneck check');
            return;
        }
        
        console.log('Checking bottleneck for date:', selectedDate);
        validatePickupTime();
        
        // For now we'll use the existing validation logic without additional AJAX
        // This ensures we don't add extra delays to the checkout process
    }
    
    // Parse date from DD.MM.YYYY format
    function parseDate(dateStr) {
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Format date as DD.MM.YYYY
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    // Function to disable past hours in the time dropdown
    function disablePastHours() {
        const timeSelect = $('#select_time');
        if (!timeSelect.length) return;
        
        console.log('Checking to disable past hours. Current hour:', currentHour);
        
        // Always disable past hours regardless of the date
        // This ensures that hours that have already passed today are not selectable
        
        // First, modify the actual select element options
        timeSelect.find('option').each(function() {
            const hourStr = $(this).val();
            if (!hourStr) return; // Skip empty options
            
            const hour = parseInt(hourStr);
            
            if (hour <= currentHour) {
                console.log('Disabling hour:', hour);
                $(this).prop('disabled', true);
            } else {
                $(this).prop('disabled', false);
            }
        });
        
        // If current selected time is now disabled, select the next available time
        const selectedTime = timeSelect.val();
        if (selectedTime) {
            const selectedHour = parseInt(selectedTime);
            
            if (selectedHour <= currentHour) {
                // Find first non-disabled option
                const firstAvailable = timeSelect.find('option:not(:disabled)').first().val();
                if (firstAvailable) {
                    console.log('Updating selection from', selectedTime, 'to', firstAvailable);
                    timeSelect.val(firstAvailable);
                    // Trigger change events
                    timeSelect.trigger('change');
                }
            }
        }
        
        // Force Select2 to rebuild its dropdown
        // This is necessary because Select2 doesn't automatically update when the underlying select changes
        if ($.fn.select2 && timeSelect.hasClass('select2-hidden-accessible')) {
            // Destroy and recreate the Select2 instance
            try {
                const currentSelection = timeSelect.val();
                timeSelect.select2('destroy');
                timeSelect.select2({
                    dir: "rtl",
                    language: "he",
                    templateResult: function(state) {
                        if (!state.id) return state.text;
                        
                        const hour = parseInt(state.text);
                        if (hour <= currentHour) {
                            // Return a disabled-looking option
                            return $('<span style="color: #ccc; text-decoration: line-through;">' + state.text + '</span>');
                        }
                        return state.text;
                    }
                });
                // Restore selection if possible
                if (currentSelection) {
                    timeSelect.val(currentSelection).trigger('change');
                }
            } catch (e) {
                console.error('Error reinitializing Select2:', e);
            }
        }
    }
    
    // Listen for rental date changes
    $(document).on('change', '[name="rental_dates"]', function() {
        // Extract start date
        const rentalDatesValue = $(this).val();
        if (rentalDatesValue && rentalDatesValue.includes(' - ')) {
            selectedDate = rentalDatesValue.split(' - ')[0];
            checkReservedProducts();
            disablePastHours();
        }
    });
    
    // Listen for pickup time changes
    $(document).on('change', '#select_time', function() {
        validatePickupTime();
    });
    
    // Initialize on page load
    setTimeout(function() {
        checkReservedProducts();
        disablePastHours();
        
        // Create pickup time information box if needed
        if ($('#pickup-time-info').length === 0) {
            $('<div id="pickup-time-info" style="margin: 15px 0; padding: 12px; background-color: #e7f5ea; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724; display: none;">' +
              '<strong>שים לב:</strong> יש לבחור שעת איסוף מתאימה. אם אתה מזמין מוצר ליום בו כבר קיימת הזמנה, ודא כי שעת האיסוף מאוחרת משעת ההחזרה של הפריט הקודם.</div>')
                .insertAfter('#select_time');
        }
        
        // Show pickup time info on page load if duplicate booking
        setTimeout(function() {
            showDuplicateBookingNotice();
        }, 2000);
        
        // Also set an interval to check every minute for time updates
        setInterval(function() {
            const newNow = new Date();
            // Only update if the hour has changed
            if (newNow.getHours() !== currentHour) {
                now = newNow;
                currentHour = now.getHours();
                currentDate = formatDate(now);
                disablePastHours();
                console.log('Updated current hour to: ' + currentHour);
            }
        }, 60000); // Check every minute
    }, 1000);
    
    // Function to check for duplicate booking and show appropriate notice
    function showDuplicateBookingNotice() {
        const rentalDatesField = $('[name="rental_dates"]');
        if (!rentalDatesField.length) return;
        
        const rentalDatesValue = rentalDatesField.val();
        if (!rentalDatesValue || !rentalDatesValue.includes(' - ')) return;
        
        // Check for duplicate bookings
        let hasDuplicateBookings = false;
        
        $('.cart_item').each(function() {
            const cartItemDates = $(this).find('.item-rental-dates').text();
            if (cartItemDates && cartItemDates.trim() === rentalDatesValue.trim()) {
                hasDuplicateBookings = true;
            }
        });
        
        // Show pickup time notice if we have duplicate bookings
        if (hasDuplicateBookings) {
            $('#pickup-time-info').show();
        }
    }
    
    // Main validation function for pickup time
    function validatePickupTime() {
        const timeSelect = $('#select_time');
        const warningBox = $('#bottleneck-warning');
        
        // If element doesn't exist, exit
        if (!timeSelect.length) {
            return;
        }
        
        // Get the selected time
        const selectedTime = timeSelect.val();
        if (!selectedTime) {
            warningBox.hide();
            return;
        }
        
        // Extract hour from selected time (format: "11:00" or "11:00 AM")
        const selectedHour = parseInt(selectedTime.split(':')[0]);
        
        // Get all cart items with rental dates for the same product and the same date
        let overlappingRentals = [];
        let productNames = new Set();
        
        // Check for overlapping dates between cart items
        if (selectedDate) {
            // Analyze the cart items directly from the page
            let dateConflicts = {};
            
            $('.cart_item').each(function() {
                const rentalDates = $(this).data('rental_dates');
                if (!rentalDates || !rentalDates.includes(' - ')) {
                    return; // Skip items without rental dates
                }
                
                const productName = $(this).find('.product-name').text().trim();
                productNames.add(productName);
                
                const [startDate, endDate] = rentalDates.split(' - ');
                
                if (!dateConflicts[productName]) {
                    dateConflicts[productName] = [];
                }
                
                dateConflicts[productName].push({
                    startDate,
                    endDate,
                    cartItemKey: $(this).data('cart_item_key')
                });
            });
            
            // Check for overlapping date ranges for the same product
            for (const [productName, rentals] of Object.entries(dateConflicts)) {
                if (rentals.length <= 1) continue; // Need at least 2 rentals to have a conflict
                
                for (let i = 0; i < rentals.length; i++) {
                    for (let j = i + 1; j < rentals.length; j++) {
                        const rental1 = rentals[i];
                        const rental2 = rentals[j];
                        
                        // Check if the selected date matches the end date of one rental
                        // and the start date of another rental for the same product
                        if (rental1.endDate === selectedDate && rental2.startDate === selectedDate) {
                            overlappingRentals.push({
                                productName,
                                firstRental: rental1,
                                secondRental: rental2
                            });
                        } else if (rental2.endDate === selectedDate && rental1.startDate === selectedDate) {
                            overlappingRentals.push({
                                productName,
                                firstRental: rental2,
                                secondRental: rental1
                            });
                        }
                    }
                }
            }
        }
        
        // If we found overlapping rentals, show warning based on pickup time
        if (overlappingRentals.length > 0) {
            // Standard return time is 11:00 (defined in product page)
            const standardReturnHour = 11;
            
            // If selected time is before or equal to return time (11:00), show warning
            if (selectedHour <= standardReturnHour) {
                // Build a message listing all conflicting products
                const productsList = Array.from(productNames).join('</li><li>');
                
                // Show warning about the bottleneck
                warningBox.html(`
                    <strong>שימו לב:</strong> המוצרים הבאים מוזמנים כבר לתאריך זה עם זמן החזרה 11:00:
                    <ul><li>${productsList}</li></ul>
                    <br>יש לבחור זמן איסוף מאוחר יותר מ-11:00 או לתאם מראש.
                `).show();
                
                // Show error styling on the select
                timeSelect.css('border-color', '#f44336');
                return;
            }
        }
        
        // For all other dates, check if it's a return date
        if (window.mitnafunPickupData && mitnafunPickupData.returnDates && 
            mitnafunPickupData.returnDates.includes(selectedDate)) {
            
            // Check if selected hour is before standard return hour (11:00)
            if (selectedHour <= 11) {
                warningBox.html(`
                    <strong>שימו לב:</strong> בתאריך זה יש החזרת ציוד עד השעה 12:00.
                    <br>יש לבחור זמן איסוף מאוחר יותר או לתאם מראש.
                `).show();
                
                // Show error styling on the select
                timeSelect.css('border-color', '#f44336');
                return;
            }
        }
        
        // Check if it's an early return date
        if (window.mitnafunPickupData && mitnafunPickupData.earlyReturnDates && 
            mitnafunPickupData.earlyReturnDates.includes(selectedDate)) {
            
            // Check if selected hour is before early return hour (9:00)
            if (selectedHour <= 9) {
                warningBox.html(`
                    <strong>שימו לב:</strong> בתאריך זה יש החזרת ציוד בשעות הבוקר (עד 9:00).
                    <br>יש לבחור זמן איסוף מאוחר יותר או לתאם מראש.
                `).show();
                
                // Show error styling on the select
                timeSelect.css('border-color', '#f44336');
                return;
            }
        }
        
        // No issues detected, hide any warnings
        warningBox.hide();
        timeSelect.css('border-color', '');
    }
});
