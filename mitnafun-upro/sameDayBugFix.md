# Same-Day Booking Validation Fix Documentation

## Issue Summary

A critical security vulnerability was discovered in the rental booking calendar system where users could bypass the same-day booking time restriction by repeatedly clicking the confirmation button. This allowed customers to create bookings after the cutoff time (typically 2 hours before pickup time), which is against business policy.

### Technical Details of the Issue

1. **Time-Based Validation Bypass**
   - The initial validation logic in `validateDateRange()` correctly prevented same-day bookings after the cutoff time
   - However, the validation was only being applied during the initial date selection
   - The confirm button handler did not re-check the time restriction before enabling the Add to Cart button
   - Multiple clicks on the confirm button could eventually enable the Add to Cart button, bypassing restrictions

2. **Same-Day Booking Rules**
   - Business rule: No same-day bookings after the cutoff time (default: 2 hours before pickup time)
   - Default pickup time: 13:00 (1 PM)
   - Default cutoff time: 11:00 (11 AM)
   - If current time is past cutoff, today should be unselectable in the calendar

## Implemented Fixes

### 1. Enhanced Confirm Button Validation

```javascript
// Setup confirm button click handler
$('#confirm-dates').off('click').on('click', function(e) {
    e.preventDefault();
    
    // First, perform a critical check to enforce time-based restrictions
    // This prevents users from bypassing the restriction with multiple clicks
    const startDate = window.selectedDates && window.selectedDates.length > 0 ? 
        new Date(window.selectedDates[0]) : null;
    
    if (startDate) {
        const today = new Date();
        const isStartToday = startDate.getFullYear() === today.getFullYear() &&
                           startDate.getMonth() === today.getMonth() &&
                           startDate.getDate() === today.getDate();
        
        // If booking for today, check time restrictions
        if (isStartToday) {
            const currentHour = today.getHours();
            const pickupHour = window.productPickupTime || 13;
            const cutoffHour = pickupHour - 2;
            
            // IMPORTANT: Set to false for production! 
            // This flag is for testing purposes only
            const forceEnableToday = false;
            
            console.log('CONFIRM VALIDATION: Current hour:', currentHour, 'Cutoff hour:', cutoffHour, 'Force enable:', forceEnableToday);
            
            if (currentHour >= cutoffHour && !forceEnableToday) {
                console.log('CRITICAL: Attempted to confirm date after cutoff time!');
                $('#late-booking-notice').show();
                $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled').attr('aria-disabled', 'true');
                $('.order-disabled-text').show();
                
                // IMPORTANT: Force disable confirm button to prevent multiple clicks
                $(this).prop('disabled', true).addClass('disabled');
                
                showError('לא ניתן להזמין להיום אחרי השעה ' + cutoffHour + ':00. אנא התקשרו אלינו במספר 050-5544516.');
                return false;
            }
        }
    }
    
    // Only proceed with confirmation if time-based validation passes
    confirmSelectedDates();
});
```

### 2. Setting Production Mode Flag

Changed the `forceEnableToday` flag to `false` in multiple locations, ensuring that time-based restrictions are properly enforced in production:

```javascript
// IMPORTANT: Set to false for production to enforce time restrictions
const forceEnableToday = false;
```

### 3. Improved Calendar Initialization

Enhanced the calendar initialization process with better error handling and recovery mechanisms:

```javascript
try {
    // DEBUGGING: Check what dates were passed in
    console.log('Received dates for initialization:', processedDates);
    
    // Use processed dates if provided, otherwise use global booked dates
    const disabledDates = processedDates || window.bookedDates || [];
    
    // Get container
    let container = $('.datepicker-container');
    if (!container.length) {
        container = $('#datepicker-container');
    }
    
    if (!container.length) {
        console.error('Datepicker container not found, creating it');
        // Try to create the container if it doesn't exist
        $('.rental-form-section, .product_meta, .price').after('<div id="datepicker-container" class="fallback-datepicker-container"></div>');
        container = $('#datepicker-container');
        
        if (!container.length) {
            throw new Error('Could not find or create datepicker container');
        }
    }
    
    // Clear the container first
    container.empty();
    console.log('Container cleared, proceeding with initialization');
    
    // ... rest of initialization ...
} catch (error) {
    console.error('Error initializing fallback calendar:', error);
    
    // Try to create a simple fallback UI if initialization fails
    try {
        let container = $('#datepicker-container');
        if (container.length) {
            container.html(`
                <div class="calendar-error-container">
                    <h3>שגיאה בטעינת לוח השנה</h3>
                    <p>לא ניתן לטעון את לוח השנה. אנא נסו לרענן את הדף או צרו קשר בטלפון: 050-5544516</p>
                    <button id="retry-calendar-button" class="btn-default">נסה שוב</button>
                </div>
            `);
            
            // Add retry handler
            $('#retry-calendar-button').on('click', function() {
                console.log('Retrying calendar initialization');
                initializeFallbackCalendar(window.bookedDates || []);
            });
        }
    } catch (e) {
        console.error('Failed to create fallback UI:', e);
    }
    
    return false;
}
```

## Key Functions Involved

### 1. `checkAndHandleSameDayBooking(selectedDate)`

This function checks if a selected date is the current day and enforces time-based restrictions:

```javascript
function checkAndHandleSameDayBooking(selectedDate) {
    const today = new Date();
    const isSameDay = selectedDate.getFullYear() === today.getFullYear() &&
                      selectedDate.getMonth() === today.getMonth() &&
                      selectedDate.getDate() === today.getDate();
    if (isSameDay) {
        const currentHour = today.getHours();
        const pickupHour = window.productPickupTime || 13;
        const cutoffHour = pickupHour - 2;
        if (currentHour >= cutoffHour) {
            $('#late-booking-notice').show();
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled').attr('aria-disabled', 'true');
            $('.order-disabled-text').show();
            return false;
        } else {
            $('#late-booking-notice').hide();
            $('.order-disabled-text').hide();
            return true;
        }
    } else {
        $('#late-booking-notice').hide();
        $('.order-disabled-text').hide();
        return true;
    }
}
```

### 2. `validateDateRange()`

Comprehensive validation of dates, including time-based restrictions:

```javascript
function validateDateRange() {
    // ... other validations ...
    
    // Check if start date is today and if it's past cutoff time
    const today = new Date();
    const isStartToday = startDate.getFullYear() === today.getFullYear() &&
                        startDate.getMonth() === today.getMonth() &&
                        startDate.getDate() === today.getDate();
    
    // IMPORTANT: Set to false for production to enforce time restrictions
    const forceEnableToday = false;
    
    if (isStartToday) {
        const currentHour = today.getHours();
        const pickupHour = window.productPickupTime || 13;
        const cutoffHour = pickupHour - 2;
        
        console.log('VALIDATION: Checking today booking. Current hour:', currentHour, 
                   'Cutoff hour:', cutoffHour, 
                   'Force enable override:', forceEnableToday);
        
        if (currentHour >= cutoffHour && !forceEnableToday) {
            console.log('VALIDATION FAILED: Booking attempted after cutoff time');
            $('#late-booking-notice').show();
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled').attr('aria-disabled', 'true');
            $('.order-disabled-text').show();
            showError('לא ניתן להזמין להיום דרך האתר. אנא התקשרו אלינו.');
            return false;
        }
    }
    
    // ... other validations ...
}
```

### 3. `getCurrentLocalHour()` and `getIsraelHour()`

Utility functions for accurate time-based validation:

```javascript
function getCurrentLocalHour() {
    return new Date().getHours();
}

function getIsraelHour() {
    try {
        const israelTime = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Jerusalem', 
            hour: 'numeric', 
            hour12: false 
        });
        return parseInt(israelTime, 10);
    } catch (error) {
        console.error('Error getting Israel time:', error);
        // Fallback calculation
        const now = new Date();
        const israelOffset = 3; // Israel is UTC+3
        const localOffset = -now.getTimezoneOffset() / 60;
        const difference = israelOffset - localOffset;
        let israelHour = now.getHours() + difference;
        israelHour = israelHour % 24;
        if (israelHour < 0) israelHour += 24;
        return israelHour;
    }
}
```

## Testing Guidelines

1. **Same-Day Booking Before Cutoff**
   - Set `forceEnableToday = true` temporarily for testing
   - Test booking on the current day before the cutoff hour
   - Verify the booking is allowed and Add to Cart is enabled

2. **Same-Day Booking After Cutoff**
   - Ensure `forceEnableToday = false` for proper validation
   - Test booking on the current day after the cutoff hour
   - Verify appropriate error messages are shown
   - Verify Add to Cart remains disabled
   - Verify multiple clicks on confirm button don't bypass the restriction

3. **Edge Cases**
   - Midnight booking (day change)
   - Very close to cutoff time (1 minute before/after)
   - System time/timezone changes

## Security Considerations

1. **Multiple Validations**
   - Time-based restrictions are now enforced at multiple points:
     - During calendar initialization
     - When a date cell is clicked
     - Before confirmation
     - When the confirm button is clicked
     
2. **Preventing UI Manipulation**
   - Button states (disabled/enabled) are properly controlled
   - Multiple click handling is secured
   - Clear visual feedback for users about restrictions

3. **Force Flags Protection**
   - All `forceEnableToday` flags are set to `false` for production
   - The testing flag has clear warnings in comments about its purpose

## Future Improvements

1. **Server-Side Validation**
   - Implement server-side validation to ensure rules are enforced regardless of client-side code
   - Add additional verification in the WooCommerce hooks

2. **Time Zone Handling**
   - Improve time zone handling for international customers
   - Consider adding server timestamp verification

3. **Logging and Monitoring**
   - Add more detailed logging of booking attempts
   - Consider monitoring for repeated validation bypass attempts
