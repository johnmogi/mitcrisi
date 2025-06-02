/**
 * Fallback Calendar System for Mitnafun Rental Calendar
 * This handles rendering a simple calendar that doesn't depend on AirDatepicker
 */
(function($) {
    'use strict';
    
    // Initialize global variables to prevent undefined/NaN errors in calendar navigation
    const today = new Date();
    window.currentCalendarMonth = today.getMonth();
    window.currentCalendarYear = today.getFullYear();
    window.selectedDates = window.selectedDates || [];
    window.disabledDates = window.disabledDates || [];
    
    // Initialize global Hebrew month names first to avoid any initialization errors
    window.hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    /**
     * Check if a date range contains any reserved dates
     * @param {string} startDate - Start date in ISO format YYYY-MM-DD
     * @param {string} endDate - End date in ISO format YYYY-MM-DD
     * @returns {boolean} True if range contains reserved dates
     */
    function rangeContainsReservedDates(startDate, endDate) {
    if (!startDate || !endDate) return false;
    if (!window.disabledDates || !Array.isArray(window.disabledDates)) {
        console.log('No disabled dates available');
        return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Checking range from', start, 'to', end);
    console.log('Disabled dates:', window.disabledDates);
    
    // Check each day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (window.disabledDates.includes(dateStr)) {
            console.log('Found reserved date in range:', dateStr);
            return true;
        }
    }
    
    return false;
}

jQuery(document).ready(function($) {
    console.log("Fallback Calendar System loaded");
    
    // Auto-initialize if we have booked dates in global scope
    if (window.processedBookedDates && Array.isArray(window.processedBookedDates)) {
        console.log("Auto-initializing fallback calendar with stored dates");
        setTimeout(function() {
            try {
                initializeFallbackCalendar(window.processedBookedDates);
            } catch (err) {
                console.error('Error initializing fallback calendar:', err);
                // Show a simple fallback error message
                $('#datepicker-container').html('<div class="error-message" style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 20px; text-align: center;">שגיאה בטעינת לוח השנה - <button id="reloadBtn" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">נסה שוב</button></div>');
                $('#reloadBtn').on('click', function() {
                    location.reload();
                });
            }
        }, 100);
    }
    
    // Initialize the fallback calendar
    function initializeFallbackCalendar(processedDates) {
        console.log('Initializing fallback calendar system');
        
        // Initialize the selected dates array
        window.selectedDates = [];
        
        // Store the processed dates for use in the datepicker
        const formattedDates = processedDates
            .filter(date => date instanceof Date && !isNaN(date.getTime()))
            .map(date => date.toISOString().split('T')[0])
            .filter(date => date !== null);
        
        // Store globally for the fallback calendar to access
        window.processedBookedDates = formattedDates;
        
        // Find container
        let container = $('#datepicker-container');
        if (!container.length) {
            $('.product-summary').before('<div id="datepicker-container"></div>');
            container = $('#datepicker-container');
        }
        
        // Clear container
        container.empty();
        
        // Add validation message containers
        if ($('#date-validation-message').length === 0) {
            container.after('<div id="date-validation-message" class="validation-message"></div>');
        }
        if ($('#max-duration-message').length === 0) {
            container.after('<div id="max-duration-message" class="validation-message error" style="display:none;">שימו לב: לא ניתן להזמין לתקופה העולה על 7 ימים</div>');
        }
        
        // Generate simple month calendar
        const today = new Date();
        generateMonthCalendar(container, today.getMonth(), today.getFullYear(), formattedDates);
        
        // Add a legend
        const calendarHtml = `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color legend-available"></div>
                    <span>זמין</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-reserved"></div>
                    <span>מוזמן</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-selected"></div>
                    <span>נבחר</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-in-range"></div>
                    <span>בטווח</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-disabled"></div>
                    <span>שבת - סגור</span>
                </div>
            </div>
        `;
        container.append(calendarHtml);
        
        // After calendar is rendered, add navigation handlers
        addCalendarNavigation(container);
    }    
        // Add calendar legend
        addCalendarLegend(container);
        
        // Add selection tracking
        setupDateSelection();
{{ ... }}
            cursor: pointer;
            padding: 5px 10px;
            color: #666;
        }
        .prev-month {
            right: 10px; /* Styles for the fallback calendar */
        const styles = `
            .fallback-calendar {
                font-family: Arial, sans-serif;
                direction: rtl;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                background-color: white;
            }
            .calendar-header {
                margin-bottom: 15px;
                font-weight: bold;
                text-align: center;
                position: relative;
            }
            .calendar-days-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 10px;
                font-weight: bold;
                background-color: #f8f8f8;
                padding: 8px 0;
                border-radius: 4px;
            }
            .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }
            .day-name, .day-cell {
                text-align: center;
                padding: 8px 2px;
            }
            .day-cell {
                cursor: pointer;
                border: 1px solid #eee;
                border-radius: 4px;
                transition: all 0.2s ease;
                position: relative;
            }
            .day-cell:hover {
                background-color: #f0f9ff;
                border-color: #c0d9e9;
            }
            .other-month {
                color: #ccc;
            }
            .disabled {
                color: #aaa;
                background-color: #f5f5f5;
                cursor: not-allowed;
            }
            .selected {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
            }
            .start-date {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
                border-top-left-radius: 50%;
                border-bottom-left-radius: 50%;
            }
            .end-date {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                border-top-right-radius: 50%;
                border-bottom-right-radius: 50%;
            }
            .in-range {
                background-color: #e8f5e9;
                border-color: #c8e6c9;
            }
            .today {
                font-weight: bold;
                border: 2px solid #4CAF50;
                box-shadow: inset 0 0 0 1px white;
            }
            .reserved {
                background-color: #ffebee;
                color: #c62828;
                cursor: not-allowed;
            }
            /* Added calendar legend styles */
            .calendar-legend {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #eee;
                font-size: 12px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px;
                white-space: nowrap;
            }
            .legend-color {
                width: 15px;
                height: 15px;
                border-radius: 3px;
                margin-left: 5px;
            }
            .legend-available {
                background-color: white;
                border: 1px solid #eee;
            }
            .legend-reserved {
                background-color: #ffebee;
                border: 1px solid #ffcdd2;
            }
            .legend-selected {
                background-color: #4CAF50;
            }
            .legend-in-range {
                background-color: #e8f5e9;
                border: 1px solid #c8e6c9;
            }
            .legend-disabled {
                background-color: #f5f5f5;
                border: 1px solid #e0e0e0;
            }      
        .day-cell.in-range {
            background-color: rgba(76, 175, 80, 0.3);
            position: relative;
            color: #333;
            font-weight: bold;
{{ ... }}
        
        .day-cell.in-range:not(.selected) {
            background-color: rgba(76, 175, 80, 0.3);
        }
        
        .confirm-dates-btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-weight: bold;
            width: 100%;
            display: block;
            text-align: center;
        }
        
        .confirm-dates-btn:hover {
            background-color: #45a049;
        }
        
        /* Validation messages */
        .validation-message {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            text-align: center;
            display: none;
        }
        
        .validation-message.success {
            background-color: #E8F5E9;
            border: 1px solid #4CAF50;
            color: #2E7D32;
            display: block;
        }
        
        .validation-message.error {
            background-color: #FFEBEE;
            border: 1px solid #F44336;
            color: #C62828;
            display: block;
        }
        
        /* Calendar legend */
        .calendar-legend {
            display: flex;
            justify-content: center;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 0 10px;
            font-size: 14px;
        }
        
        .legend-box {
            width: 15px;
            height: 15px;
            margin-left: 5px;
            display: inline-block;
            border: 1px solid #ddd;
        }
        
        .legend-box.available {
            background-color: white;
        }
        
        .legend-box.reserved {
            background-color: #ffebee;
            position: relative;
        }
        
        .legend-box.reserved:before {
            content: '';
            position: absolute;
            top: 7px;
            left: 0;
            width: 15px;
            height: 1px;
            background: #F44336;
            transform: rotate(45deg);
        }
        
        .legend-box.weekend {
            background-color: #f5f5f5;
        }
        </style>`);
    }
    
    // Export functions for use by other scripts
    window.initializeFallbackCalendar = initializeFallbackCalendar;
    
    // Send a ready event for other scripts to detect
    $(document).trigger('fallbackCalendarReady');
    console.log("Fallback calendar ready for initialization");
});
