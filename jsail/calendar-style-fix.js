/**
 * Calendar Style Fixes for Mitnafun
 * Adds better visual styling for calendar states
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        addCalendarStyles();
        
        // Also apply styles when calendar is updated
        $(document).on('stock-data-updated', function() {
            setTimeout(addCalendarStyles, 100);
        });
    });
    
    // Add additional styles to better visualize calendar states
    function addCalendarStyles() {
        // Only proceed if we're on a product page with a calendar
        if (!$('.fallback-calendar').length) {
            return;
        }
        
        // Remove any existing styles we added previously
        $('#mitnafun-calendar-styles').remove();
        
        // Add our custom styles
        const styleElement = $('<style id="mitnafun-calendar-styles"></style>');
        styleElement.html(`
            /* Past dates - show in light red */
            .day-cell.past-date {
                background-color: #ffeeee !important;
                color: #999 !important;
                text-decoration: line-through;
                cursor: not-allowed !important;
            }
            
            /* Disabled dates - darker red for truly unavailable dates */
            .day-cell.disabled:not(.past-date):not(.weekend):not(.early-return-date):not(.return-date) {
                background-color: #ffdddd !important;
                color: #666 !important;
                cursor: not-allowed !important;
            }
            
            /* Return date - special styling with light green background */
            .day-cell.return-date {
                background-color: #e8f5e9 !important; /* Light green */
                border: 1px solid #81c784 !important;
                color: #2e7d32 !important;
                cursor: pointer !important;
                position: relative;
            }
            
            /* Early return date - special styling with light blue background */
            .day-cell.early-return-date {
                background-color: #e3f2fd !important; /* Light blue */
                border: 1px solid #64b5f6 !important;
                color: #1565c0 !important;
                cursor: pointer !important;
                position: relative;
            }
            
            /* Add a visual indicator for early return dates */
            .day-cell.early-return-date:before {
                content: '';
                position: absolute;
                top: 2px;
                right: 2px;
                width: 6px;
                height: 6px;
                background-color: #1565c0;
                border-radius: 50%;
            }
            
            /* Add a visual indicator for return dates */
            .day-cell.return-date:before {
                content: '';
                position: absolute;
                top: 2px;
                right: 2px;
                width: 6px;
                height: 6px;
                background-color: #2e7d32;
                border-radius: 50%;
            }
            
            /* Partial booking indicator - show a small dot */
            .day-cell.partial-booking {
                position: relative;
            }
            
            .day-cell.partial-booking:before {
                content: '';
                position: absolute;
                top: 2px;
                right: 2px;
                width: 6px;
                height: 6px;
                background-color: orange;
                border-radius: 50%;
            }
            
            /* Weekend styling that doesn't conflict */
            .day-cell.weekend {
                background-color: #f0f0f0 !important;
            }
            
            /* Clear disabled styling from weekends that are selectable */
            .day-cell.weekend[data-selectable="true"] {
                cursor: pointer !important;
                opacity: 1 !important;
            }
            
            /* Make sure selected dates are clearly visible */
            .day-cell.selected {
                background-color: #4CAF50 !important;
                color: white !important;
            }
            
            /* Hover effect for selectable dates */
            .day-cell[data-selectable="true"]:not(.disabled):not(.past-date):hover {
                background-color: #e3f2fd !important;
                cursor: pointer !important;
            }
        `);
        
        // Append to head
        $('head').append(styleElement);
    }
    
})(jQuery);
