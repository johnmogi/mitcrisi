/**
 * Pickup Time Validator
 * Restricts pickup time selection based on adjacent return dates
 */
jQuery(document).ready(function($) {
    // Only run on checkout page
    if (!$('form.checkout').length) {
        return;
    }
    
    // Store early return dates
    const earlyReturnDates = window.earlyReturnDates || [];
    const returnDates = window.returnDates || [];
    
    // Function to check if a date is a return date
    function isReturnDate(dateStr) {
        return returnDates.includes(dateStr) || earlyReturnDates.includes(dateStr);
    }
    
    // Function to check if a date is an early return date
    function isEarlyReturnDate(dateStr) {
        return earlyReturnDates.includes(dateStr);
    }
    
    // Format date as DD.MM.YYYY
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    // Parse date from DD.MM.YYYY format
    function parseDate(dateStr) {
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Add warning message container after time selection
    $('<div id="pickup-time-warning" style="display: none; margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;"></div>')
        .insertAfter('#select_time');
    
    // Listen for rental date changes
    $(document).on('change', '[name="rental_dates"]', function() {
        validatePickupTime();
    });
    
    // Listen for pickup time changes
    $(document).on('change', '#select_time', function() {
        validatePickupTime();
    });
    
    // Initialize on page load
    setTimeout(validatePickupTime, 1000);
    
    // Main validation function
    function validatePickupTime() {
        const rentalDatesField = $('[name="rental_dates"]');
        const timeSelect = $('#select_time');
        const warningBox = $('#pickup-time-warning');
        
        // If either element doesn't exist, exit
        if (!rentalDatesField.length || !timeSelect.length) return;
        
        // Get the rental dates value
        const rentalDatesValue = rentalDatesField.val();
        if (!rentalDatesValue || !rentalDatesValue.includes(' - ')) {
            warningBox.hide();
            return;
        }
        
        // Extract start date
        const startDateStr = rentalDatesValue.split(' - ')[0];
        const startDate = parseDate(startDateStr);
        
        if (!startDate) {
            warningBox.hide();
            return;
        }
        
        const formattedStartDate = formatDate(startDate);
        
        // Check if start date is a return date
        if (isReturnDate(formattedStartDate)) {
            // Get the selected time
            const selectedTime = timeSelect.val();
            
            // Early return date - equipment returned by 9:00 AM
            if (isEarlyReturnDate(formattedStartDate)) {
                if (selectedTime && selectedTime.includes('8:00') || selectedTime.includes('9:00')) {
                    // Time conflict detected
                    warningBox.html(`
                        <strong>שימו לב:</strong> בתאריך זה יש החזרת ציוד בשעות הבוקר (עד 9:00).
                        <br>יש לבחור זמן איסוף מאוחר יותר או לתאם מראש.
                    `).show();
                    
                    // Show error styling on the select
                    timeSelect.css('border-color', '#f44336');
                } else {
                    warningBox.hide();
                    timeSelect.css('border-color', '');
                }
            } 
            // Regular return date - equipment returned by 12:00 PM
            else {
                if (selectedTime && (
                    selectedTime.includes('8:00') || 
                    selectedTime.includes('9:00') || 
                    selectedTime.includes('10:00') || 
                    selectedTime.includes('11:00') || 
                    selectedTime.includes('12:00')
                )) {
                    // Time conflict detected
                    warningBox.html(`
                        <strong>שימו לב:</strong> בתאריך זה יש החזרת ציוד עד השעה 12:00.
                        <br>יש לבחור זמן איסוף מאוחר יותר או לתאם מראש.
                    `).show();
                    
                    // Show error styling on the select
                    timeSelect.css('border-color', '#f44336');
                } else {
                    warningBox.hide();
                    timeSelect.css('border-color', '');
                }
            }
        } else {
            // Not a return date, no restrictions
            warningBox.hide();
            timeSelect.css('border-color', '');
        }
    }
});
