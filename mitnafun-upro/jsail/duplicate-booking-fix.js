/**
 * Enhanced Duplicate Booking Fix
 * Allows users to book products with the same date range when there's still available stock
 * or when this is a special return date or early return date
 */
jQuery(document).ready(function($) {
    console.log('🔄 Enhanced Duplicate Booking Fix loaded');
    
    // Run immediately and then periodically to ensure we catch all validation issues
    setTimeout(initFixSystem, 500);
    
    function initFixSystem() {
        setupEventListeners();
        patchValidationSystem();
        fixReturnDateSystem();
        
        // Force-override checkForDuplicateOrder function if it exists
        if (typeof window.checkForDuplicateOrder === 'function') {
            patchDuplicateOrderCheck();
        } else {
            // Try again later if function doesn't exist yet
            setTimeout(initFixSystem, 1000);
        }
    }
    
    function setupEventListeners() {
        // Listen for clicks on the confirm dates button
        $(document).on('click', '#confirm-dates', function() {
            fixValidationMessage();
            showApprovalMessage();
        });
        
        // Also check after each date selection
        $(document).on('click', '.day-cell', function() {
            setTimeout(fixValidationMessage, 500); // Short delay to let validation occur
        });
        
        // Monitor changes to the date validation message
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' || mutation.type === 'childList') {
                    fixValidationMessage();
                }
            });
        });
        
        // Start observing validation message changes
        const messageElement = document.getElementById('date-validation-message');
        if (messageElement) {
            observer.observe(messageElement, { attributes: true, childList: true, subtree: true });
        }
    }
    
    /**
     * Show approval message when dates are confirmed and duplicates exist
     */
    function showApprovalMessage() {
        // Only run if we have valid dates and no validation errors
        if (!window.selectedDates || window.selectedDates.length !== 2 || $('#date-validation-message').is(':visible')) {
            return;
        }
        
        // Sort selected dates
        const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        const startDate = formatDate(new Date(dates[0]));
        const endDate = formatDate(new Date(dates[1]));
        
        // Get stock quantity
        const stockQuantity = window.stockQuantity || window.productStockQty || 1;
        
        // Don't proceed further for single-stock items
        if (stockQuantity <= 1) {
            return;
        }
        
        // Count existing items in cart with the same date range
        let existingItemsCount = 0;
        $('.cart_item').each(function() {
            const itemDates = $(this).find('.item-rental-dates').text();
            const formattedDateRange = startDate + ' - ' + endDate;
            if (itemDates && itemDates.trim() === formattedDateRange.trim()) {
                existingItemsCount++;
            }
        });
        
        // If we have items in cart with these dates and stock permits
        if (existingItemsCount > 0 && existingItemsCount < stockQuantity) {
            // Calculate remaining stock
            const remainingStock = stockQuantity - existingItemsCount;
            
            // Remove any existing approval messages
            $('#duplicate-booking-approval, #duplicate-booking-info').remove();
            
            // Add green approval message
            const approvalHtml = `
                <div id="duplicate-booking-approval" style="margin: 15px 0; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                    <strong>אישור הזמנה:</strong> מוצר נוסף עם אותם תאריכי השכרה יתווסף לסל הקניות. נותרו עוד ${remainingStock} יחידות במלאי לתאריכים אלו.
                </div>
            `;
            
            $('#rental_dates_field').after(approvalHtml);
            
            // Make approval message visible with animation
            $('#duplicate-booking-approval').hide().fadeIn(500);
        }
        // If we've reached the stock limit
        else if (existingItemsCount >= stockQuantity) {
            // Remove any existing messages
            $('#duplicate-booking-limit, #duplicate-booking-approval, #duplicate-booking-info').remove();
            
            // Add warning message
            const limitHtml = `
                <div id="duplicate-booking-limit" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;">
                    <strong>הגעת למגבלת המלאי:</strong> כבר הזמנת את כל היחידות הזמינות לתאריכים אלו (${stockQuantity} יחידות).
                </div>
            `;
            
            $('#rental_dates_field').after(limitHtml);
            
            // Make limit message visible with animation
            $('#duplicate-booking-limit').hide().fadeIn(500);
            
            // Disable the add to cart button
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
        }
    }
    
    /**
     * Override the checkForDuplicateOrder function to be more lenient
     * but also to enforce limits based on available stock
     */
    function patchDuplicateOrderCheck() {
        // Save the original function
        window._originalCheckForDuplicateOrder = window.checkForDuplicateOrder;
        
        // Override with our version
        window.checkForDuplicateOrder = function(startDate, endDate) {
            console.log('🔄 Enhanced duplicate order check for', startDate, 'to', endDate);
            
            // Get stock quantity
            const stockQuantity = window.stockQuantity || window.productStockQty || 1;
            console.log('🔄 Product stock quantity:', stockQuantity);
            
            // Count existing items in cart with the same date range
            let existingItemsCount = 0;
            $('.cart_item').each(function() {
                const itemDates = $(this).find('.item-rental-dates').text();
                const formattedDateRange = startDate + ' - ' + endDate;
                if (itemDates && itemDates.trim() === formattedDateRange.trim()) {
                    existingItemsCount++;
                }
            });
            
            console.log('🔄 Found', existingItemsCount, 'existing items with same date range');
            
            // NEW RULE: If stock is empty (0) and trying to join existing order, block it
            if (stockQuantity === 0 && existingItemsCount > 0) {
                // Show error message for empty stock
                $('#date-validation-message').hide();
                
                // Check if this is a future date booking (3+ days ahead)
                // If so, we should allow it despite zero stock
                if (startDate) {
                    // Parse the date if it's a string
                    var checkDate = startDate;
                    if (typeof startDate === 'string') {
                        if (startDate.indexOf('-') > 0) {
                            // ISO format (YYYY-MM-DD)
                            checkDate = new Date(startDate);
                        } else if (startDate.indexOf('.') > 0) {
                            // DD.MM.YYYY format
                            const parts = startDate.split('.');
                            checkDate = new Date(parts[2], parts[1]-1, parts[0]);
                        }
                    }
                    
                    // Calculate days in future
                    const today = new Date();
                    const diffTime = checkDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // If 3+ days in future, allow booking
                    if (diffDays >= 3) {
                        console.log('✅ Future dates selected (' + diffDays + ' days ahead) - allowing booking despite zero stock');
                        
                        // Add future booking success message
                        const futureBookingHtml = `
                            <div id="future-booking-notice" style="margin: 15px 0; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                                <strong>הזמנה לתאריך עתידי:</strong> ניתן להזמין מוצר זה בתאריכים עתידיים גם כאשר המלאי נמוך או אזל.
                            </div>
                        `;
                        
                        $('#rental_dates_field').after(futureBookingHtml);
                        
                        // Make success message visible with animation
                        $('#future-booking-notice').hide().fadeIn(500);
                        
                        // Enable the add to cart button
                        $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
                        
                        // Allow booking
                        return true;
                    }
                }
                
                // For non-future dates, proceed with regular stock validation
                // Remove any existing messages
                $('#empty-stock-warning, #duplicate-booking-limit, #duplicate-booking-approval, #duplicate-booking-info, #future-booking-notice').remove();
                
                // Add warning message
                const emptyStockHtml = `
                    <div id="empty-stock-warning" style="margin: 15px 0; padding: 12px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                        <strong>מלאי אזל:</strong> לא ניתן להזמין מוצר זה בתאריכים אלו. המלאי אזל ולא ניתן להצטרף להזמנה קיימת.
                    </div>
                `;
                
                $('#rental_dates_field').after(emptyStockHtml);
                
                // Make warning message visible with animation
                $('#empty-stock-warning').hide().fadeIn(500);
                
                // Disable the add to cart button
                $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
                
                // Return false to block the booking
                return false;
            }
            
            // If we have multiple stock items but are approaching the limit
            if (stockQuantity > 1) {
                // If we already have items but still have stock left
                if (existingItemsCount > 0 && existingItemsCount < stockQuantity) {
                    // Calculate remaining stock
                    const remainingStock = stockQuantity - existingItemsCount;
                    
                    // Show clear approval message
                    $('#date-validation-message').hide();
                    
                    // Remove any existing approval messages
                    $('#duplicate-booking-approval, #duplicate-booking-info').remove();
                    
                    // Add green approval message
                    const approvalHtml = `
                        <div id="duplicate-booking-approval" style="margin: 15px 0; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                            <strong>אישור הזמנה:</strong> מוצר נוסף עם אותם תאריכי השכרה יתווסף לסל הקניות. נותרו עוד ${remainingStock} יחידות במלאי לתאריכים אלו.
                        </div>
                    `;
                    
                    $('#rental_dates_field').after(approvalHtml);
                    
                    // Make approval message visible with animation
                    $('#duplicate-booking-approval').hide().fadeIn(500);
                    
                    // Return true to allow the booking
                    return true;
                }
                // If we've reached the stock limit
                else if (existingItemsCount >= stockQuantity) {
                    // Show warning that we've reached the limit
                    $('#date-validation-message').hide();
                    
                    // Remove any existing messages
                    $('#duplicate-booking-limit, #duplicate-booking-approval, #duplicate-booking-info').remove();
                    
                    // Add warning message
                    const limitHtml = `
                        <div id="duplicate-booking-limit" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;">
                            <strong>הגעת למגבלת המלאי:</strong> כבר הזמנת את כל היחידות הזמינות לתאריכים אלו (${stockQuantity} יחידות).
                        </div>
                    `;
                    
                    $('#rental_dates_field').after(limitHtml);
                    
                    // Make limit message visible with animation
                    $('#duplicate-booking-limit').hide().fadeIn(500);
                    
                    // Disable the add to cart button
                    $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
                    
                    // Return false to block the booking
                    return false;
                }
                // First booking of this item (no duplicates yet)
                else {
                    // Just return true to allow the first booking
                    return true;
                }
            }
            
            // For products with only 1 stock unit, use original validation
            return window._originalCheckForDuplicateOrder(startDate, endDate);
        };
        
        console.log('🔄 Successfully patched checkForDuplicateOrder function');
    }
    
    /**
     * Patch the validation system to allow booking on return dates
     */
    function patchValidationSystem() {
        // Override internalDateIsDisabled function if it exists
        if (typeof window.internalDateIsDisabled === 'function') {
            console.log('🔄 Patching internalDateIsDisabled function');
            
            // Save original function
            window._originalInternalDateIsDisabled = window.internalDateIsDisabled;
            
            // Override function
            window.internalDateIsDisabled = function(date) {
                // Format date for checking
                const formattedDate = formatDateISO(date);
                
                // Always allow return dates and early return dates
                if ((window.returnDates && window.returnDates.includes(formattedDate)) ||
                    (window.earlyReturnDates && window.earlyReturnDates.includes(formattedDate))) {
                    return false; // Not disabled
                }
                
                // Otherwise use original function
                return window._originalInternalDateIsDisabled(date);
            };
        }
    }
    
    /**
     * Fix implementation for return date system
     */
    function fixReturnDateSystem() {
        // Make sure the return date message gets cleared when selecting new dates
        $(document).on('click', '.day-cell', function() {
            // Hide return date notice after selecting a date
            $('#return-date-notice').hide();
        });
    }
    
    /**
     * Fix the validation error message to allow duplicate bookings when stock permits
     */
    function fixValidationMessage() {
        // Check if error message is visible
        if ($('#date-validation-message').is(':visible') && 
            $('#date-validation-message').text().includes('טווח התאריכים מכיל תאריך שאינו זמין')) {
            
            console.log('🔄 Detected validation error - checking if we can override');
            
            // Get stock quantity
            const stockQuantity = window.stockQuantity || window.productStockQty || 1;
            console.log('🔄 Product stock quantity:', stockQuantity);
            
            // If we have selected dates
            if (window.selectedDates && window.selectedDates.length === 2) {
                // Force allow booking for special dates regardless of stock
                let hasSpecialDates = false;
                let datesValid = true;
                
                // Sort selected dates
                const dates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
                const startDate = new Date(dates[0]);
                const endDate = new Date(dates[1]);
                
                console.log('🔄 Checking date range:', formatDate(startDate), 'to', formatDate(endDate));
                
                // Get all dates in the range
                const dateRange = getDatesInRange(startDate, endDate);
                
                // Check each date for special status or stock availability
                dateRange.forEach(function(date) {
                    const dateISO = formatDateISO(date);
                    
                    // Skip weekend days
                    if (date.getDay() === 6) { // Saturday
                        return;
                    }
                    
                    // Check if this is a special date
                    if ((window.returnDates && window.returnDates.includes(dateISO)) ||
                        (window.earlyReturnDates && window.earlyReturnDates.includes(dateISO))) {
                        hasSpecialDates = true;
                        return; // Always allow special dates
                    }
                    
                    // For multi-stock products, check stock level
                    if (stockQuantity > 1) {
                        // Get reservation count for this date
                        const reservationCount = window.reservationCounts && window.reservationCounts[dateISO] 
                            ? window.reservationCounts[dateISO] 
                            : 0;
                        
                        // If reservations equal or exceed stock, date is invalid
                        if (reservationCount >= stockQuantity) {
                            console.log('🔄 Date exceeds stock limit:', dateISO, reservationCount, 'of', stockQuantity);
                            datesValid = false;
                        }
                    }
                });
                
                // Check for zero stock condition - NEVER allow booking when stock is zero
                if (stockQuantity === 0) {
                    console.log('🔄 Override validation FAILED: Stock is zero - blocking duplicate booking');
                    
                    // Show zero stock error message
                    $('#date-validation-message').html('<div class="alert alert-danger">' +
                        'מלאי אזל: לא ניתן להזמין מוצר זה בתאריכים אלו. ' +
                        'המלאי אזל ולא ניתן להצטרף להזמנה קיימת.</div>');
                    
                    // Disable the add to cart button
                    $('.single_add_to_cart_button').prop('disabled', true);
                    
                    return;
                }
                
                // Allow booking if dates are valid due to stock or contain special dates
                if (hasSpecialDates || (stockQuantity > 1 && datesValid)) {
                    console.log('🔄 Override validation: special dates or available stock - allowing booking');
                    
                    // Hide error message
                    $('#date-validation-message').hide();
                    
                    // Show appropriate info message
                    if (hasSpecialDates) {
                        if ($('#special-date-info').length === 0) {
                            const infoHtml = `
                                <div id="special-date-info" style="margin: 15px 0; padding: 12px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; color: #0c5460;">
                                    <strong>שים לב:</strong> בחרת תאריך החזרה מיוחד המאפשר להזמין פריט זה גם אם נראה כתפוס.
                                </div>
                            `;
                            $('#date-validation-message').after(infoHtml);
                        } else {
                            $('#special-date-info').show();
                        }
                    } else if (stockQuantity > 1) {
                        if ($('#duplicate-booking-info').length === 0) {
                            const infoHtml = `
                                <div id="duplicate-booking-info" style="margin: 15px 0; padding: 12px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; color: #0c5460;">
                                    <strong>לידיעתך:</strong> מוצר נוסף עם אותם תאריכי השכרה יתווסף לסל הקניות שלך.
                                </div>
                            `;
                            $('#date-validation-message').after(infoHtml);
                        } else {
                            $('#duplicate-booking-info').show();
                        }
                    }
                    
                    // Enable order button
                    $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled');
                    
                    // Ensure dates are confirmed
                    window.datesConfirmed = true;
                }
            }
        } else {
            // Hide info messages when error is not visible
            $('#duplicate-booking-info, #special-date-info').hide();
        }
    }
    
    // Helper function to get all dates in a range
    function getDatesInRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }
    
    // Helper function to format date as ISO string
    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Helper function to format date as DD.MM.YYYY
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
});
