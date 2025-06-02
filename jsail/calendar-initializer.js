/**
 * Calendar Initializer for Mitnafun
 * Ensures the fallback calendar is loaded properly
 */
jQuery(document).ready(function($) {
    console.log('Calendar initializer running...');
    
    // Clear any error messages in the calendar container
    $('#datepicker-container').empty();
    
    // Initialize the calendar with empty array for disabled dates
    // We'll populate this with actual data from the server later
    try {
        // Create a sample set of disabled dates (weekends and random dates)
        const today = new Date();
        const disabledDates = [];
        
        // Add some sample reserved dates for testing
        for (let i = 1; i <= 3; i++) {
            const randomDay = new Date(today);
            randomDay.setDate(today.getDate() + Math.floor(Math.random() * 30));
            // Skip Saturdays
            if (randomDay.getDay() !== 6) {
                disabledDates.push(randomDay.toISOString().split('T')[0]);
            }
        }
        
        // Initialize the fallback calendar
        if (typeof initializeFallbackCalendar === 'function') {
            initializeFallbackCalendar(disabledDates);
            console.log('Calendar initialized successfully');
        } else {
            console.error('Calendar initialization function not found');
            $('#datepicker-container').html('<div class="datepicker-error" style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">יש לטעון מחדש את העמוד. אם הבעיה נמשכת, אנא צרו קשר בטלפון: 050-5544516</div>');
        }
    } catch (e) {
        console.error('Calendar initialization error:', e);
        $('#datepicker-container').html('<div class="datepicker-error" style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">שגיאה בטעינת לוח השנה. אנא רעננו את העמוד או צרו קשר בטלפון: 050-5544516</div>');
    }
    
    // Add a reload button for users
    $('.reload-page-btn').on('click', function() {
        location.reload();
    });
});
