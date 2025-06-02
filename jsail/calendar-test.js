/**
 * Test script to verify the fallback calendar is working correctly
 * This will activate automatically on product pages
 */
jQuery(document).ready(function($) {
    console.log('Calendar test script running...');
    
    // Check if we're on a product page with a datepicker container
    if ($('#datepicker-container').length) {
        console.log('Found datepicker container, initializing test...');
        
        // Function to check if calendar initialization function exists
        function checkCalendarFunction() {
            if (typeof window.initializeFallbackCalendar === 'function') {
                console.log('SUCCESS: Calendar initialization function found!');
                
                /* 
                // Removed calendar reinitialization that was clearing all reserved dates
                // Instead, just log that the calendar system is working
                */
                console.log('Calendar system is operational - no reinitialization needed');
                
                // SAFETY CHECK: If the calendar is empty (no day cells), we'll attempt a recovery
                if ($('.fallback-calendar .calendar-days .day-cell').length === 0) {
                    console.warn('Calendar appears empty, attempting recovery...');
                    try {
                        // Use the globally stored processedBookedDates if available
                        const disabledDates = window.processedBookedDates || [];
                        window.initializeFallbackCalendar(disabledDates);
                        console.log('Calendar recovery completed');
                    } catch (e) {
                        console.error('Error during calendar recovery:', e);
                        // Show error message
                        $('#datepicker-container').html(`
                            <div style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">
                                יש בעיה בטעינת לוח השנה. אנא נסו לרענן את העמוד או צרו קשר בטלפון: 050-5544516
                                <br>
                                <button class="reload-page-btn" style="margin-top: 10px; padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">רענן עמוד</button>
                            </div>
                        `);
                    }
                }
            } else {
                console.error('Calendar initialization function not found after 3 seconds');
                // Show error in container
                $('#datepicker-container').html(`
                    <div style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">
                        יש בעיה בטעינת לוח השנה. אנא נסו לרענן את העמוד או צרו קשר בטלפון: 050-5544516
                        <br>
                        <button class="reload-page-btn" style="margin-top: 10px; padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">רענן עמוד</button>
                    </div>
                `);
            }
            
            // Add reload button click handler
            $('.reload-page-btn').on('click', function() {
                location.reload();
            });
        }
        
        // Wait for 3 seconds to ensure all scripts are loaded
        setTimeout(checkCalendarFunction, 3000);
    }
});
