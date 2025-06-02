/**
 * Buffer Date Handler
 * Shows warning for dates with 1-day buffer to existing reservations
 */
jQuery(document).ready(function($) {
    // Only run on product pages
    if (!$('.product').length) {
        return;
    }
    
    // Remove the debug info panel if it exists
    $('#stock-debug-info').remove();
    
    // Store buffer dates globally
    window.bufferDates = [];
    
    // Function to check if a date is in the buffer dates
    function isBufferDate(dateStr) {
        return window.bufferDates.includes(dateStr);
    }
    
    // Function to show buffer warning message
    function showBufferWarning() {
        // Remove any existing notice first
        $('#return-date-notice').remove();
        
        // Add the new notice
        const noticeHtml = `
            <div id="return-date-notice" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px;">
                <strong style="color: #856404;">שימו לב:</strong> עבור תאריך זה קיימת החזרה של ציוד בשעות הבוקר.  
                זמן האיסוף עשוי להתעכב – מומלץ לתאם איתנו מראש.
            </div>
        `;
        
        // Insert after the booking calendar
        if ($('.booking-calendar').length) {
            $('.booking-calendar').after(noticeHtml);
        } else if ($('#datepicker-container').length) {
            $('#datepicker-container').after(noticeHtml);
        } else {
            // Fallback - insert before the add to cart button
            $('.single_add_to_cart_button').first().before(noticeHtml);
        }
        
        console.log('Buffer warning displayed');
    }
    
    // Function to hide buffer warning message
    function hideBufferWarning() {
        $('#return-date-notice').remove();
    }
    
    // Override the AJAX request to get reserved dates
    const originalAjax = $.ajax;
    $.ajax = function(options) {
        const originalSuccess = options.success;
        
        // Check if this is the get_reserved_dates AJAX call
        if (options.data && options.data.includes('action=get_reserved_dates')) {
            options.success = function(response) {
                // First call the original success handler
                if (originalSuccess) {
                    originalSuccess.apply(this, arguments);
                }
                
                // Now handle buffer dates if they exist
                if (response.success && response.data && response.data.buffer_dates) {
                    window.bufferDates = response.data.buffer_dates;
                    console.log('Buffer dates loaded:', window.bufferDates);
                }
            };
        }
        
        // Call the original Ajax method
        return originalAjax.apply(this, arguments);
    };
    
    // Hook into date selection events for both calendar systems
    
    // Air datepicker hook
    $(document).on('dateSelect', function(e, selectedDates) {
        if (!selectedDates || !Array.isArray(selectedDates) || selectedDates.length !== 2) {
            hideBufferWarning();
            return;
        }
        
        // Check selected dates
        const startDate = formatDate(selectedDates[0]);
        const endDate = formatDate(selectedDates[1]);
        
        // Check if either date is a buffer date
        if (isBufferDate(startDate) || isBufferDate(endDate)) {
            showBufferWarning();
        } else {
            hideBufferWarning();
        }
    });
    
    // Fallback calendar hook
    $(document).on('fallbackDateSelect', function(e, selectedDates) {
        if (!selectedDates || !Array.isArray(selectedDates) || selectedDates.length !== 2) {
            hideBufferWarning();
            return;
        }
        
        // Check if either date is a buffer date
        if (isBufferDate(selectedDates[0]) || isBufferDate(selectedDates[1])) {
            showBufferWarning();
        } else {
            hideBufferWarning();
        }
    });
    
    // Helper function to format date as DD.MM.YYYY
    function formatDate(date) {
        if (!(date instanceof Date)) {
            return '';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
    }
    
    // For the fallback calendar, we need to hook into the existing confirm button click
    $(document).on('click', '#confirm-dates', function() {
        if (window.selectedDates && window.selectedDates.length === 2) {
            // Check if either date is a buffer date
            if (isBufferDate(window.selectedDates[0]) || isBufferDate(window.selectedDates[1])) {
                showBufferWarning();
            } else {
                hideBufferWarning();
            }
        }
    });
    
    console.log('Buffer date handler initialized');
});
