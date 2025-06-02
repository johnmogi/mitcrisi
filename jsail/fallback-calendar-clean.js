/**
 * Fallback Calendar System for Mitnafun Rental Booking
 * Provides a robust alternative when AirDatepicker fails to load
 */
(function($) {
    'use strict';
    
    // Initialize global variables to prevent undefined/NaN errors in calendar navigation
    const today = new Date();
    window.currentCalendarMonth = today.getMonth();
    window.currentCalendarYear = today.getFullYear();
    window.selectedDates = window.selectedDates || [];
    window.disabledDates = window.disabledDates || [];
    window.datesConfirmed = false;
    
    // Initialize global Hebrew month names
    window.hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    /**
     * Format date as YYYY-MM-DD (ISO format for data attributes)
     */
    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format date as DD.MM.YYYY (display format for users)
     */
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    /**
     * Check if a date range contains any reserved dates
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
            const dateStr = formatDateISO(d);
            if (window.disabledDates.includes(dateStr)) {
                console.log('Found reserved date in range:', dateStr);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Add CSS styles for the fallback calendar
     */
    function addCalendarStyles() {
        // Remove existing styles to prevent duplication
        $('#fallback-calendar-styles').remove();
                
        // Add required field indicator for dates
        if ($('.rental-dates-label').length > 0) {
            $('.rental-dates-label').append(' <span class="required">*</span>');
        } else {
            $('#datepicker-container').before('<div class="rental-dates-label">תאריכי השכרה <span class="required">*</span></div>');
        }
                
        // Add new styles
        $('head').append(`
            <style id="fallback-calendar-styles">
                .fallback-calendar {
                    font-family: Arial, sans-serif;
                    direction: rtl;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    position: relative;
                }
                .month-year {
                    font-weight: bold;
                    font-size: 16px;
                }
                .nav-btn {
                    background: #f1f1f1;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    padding: 5px 10px;
                    cursor: pointer;
                    font-size: 20px;
                    margin: 7px 2px;
                }
                .calendar-days-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    margin-bottom: 5px;
                }
                .day-name {
                    text-align: center;
                    font-weight: bold;
                    padding: 5px;
                    font-size: 14px;
                    background: #f7f7f7;
                }
                .calendar-days {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                }
                .day-cell {
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #ddd;
                    cursor: pointer;
                    background: white;
                }
                .day-cell:hover:not(.disabled):not(.empty):not(.weekend) {
                    background: #e9f7ef;
                    border-color: #2ecc71;
                }
                .day-cell.empty {
                    border: none;
                    background: transparent;
                }
                .day-cell.disabled {
                    background: #ffebee;
                    color: #b71c1c;
                    cursor: not-allowed;
                    position: relative;
                }
                .day-cell.weekend {
                    background: #e0e0e0;
                    color: #616161;
                    cursor: not-allowed;
                }
                .day-cell.today {
                    border: 2px solid #2196F3;
                    font-weight: bold;
                }
                .day-cell.selected {
                    background: #d4edda;
                    border-color: #28a745;
                    color: #1e7e34;
                    font-weight: bold;
                }
                .calendar-legend {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                }
                .legend-color {
                    width: 12px;
                    height: 12px;
                    margin-left: 5px;
                    border: 1px solid #ccc;
                    display: inline-block;
                }
                .legend-color.available {
                    background: white;
                }
                .legend-color.disabled {
                    background: #ffebee;
                }
                .legend-color.weekend {
                    background: #e0e0e0;
                }
                #date-validation-message {
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                }
                #date-validation-message.info {
                    background-color: #e3f2fd;
                    border: 1px solid #bbdefb;
                    color: #1565c0;
                }
                #date-validation-message.error {
                    background-color: #ffebee;
                    border: 1px solid #ffcdd2;
                    color: #c62828;
                }
                #date-validation-message.success {
                    background-color: #e8f5e9;
                    border: 1px solid #c8e6c9;
                    color: #2e7d32;
                }
                .confirm-dates-btn {
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                    width: 100%;
                    text-align: center;
                }
                .confirm-dates-btn:hover {
                    background-color: #388E3C;
                }
            </style>
        `);
    }
    
    /**
     * Initialize fallback calendar
     */
    function initializeFallbackCalendar(disabledDates) {
        console.log('Initializing fallback calendar');
        
        // Store disabled dates globally
        window.disabledDates = disabledDates || [];
        
        // Add calendar styles
        addCalendarStyles();
        
        // Create calendar container if it doesn't exist
        let container = $('#datepicker-container');
        if (container.length === 0) {
            console.error('No datepicker container found');
            return;
        }
        
        // Clear container
        container.empty();
        
        // Create calendar markup
        container.html(`
            <div class="fallback-calendar">
                <div class="calendar-header">
                    <button class="nav-btn prev-month">«</button>
                    <div class="month-year"></div>
                    <button class="nav-btn next-month">»</button>
                </div>
                <div class="calendar-days-header"></div>
                <div class="calendar-days"></div>
                <div class="calendar-legend">
                    <div class="legend-item">
                        <span class="legend-color available"></span>
                        <span>פנוי</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color disabled"></span>
                        <span>תפוס</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color weekend"></span>
                        <span>סגור (שבת)</span>
                    </div>
                </div>
                <div id="date-validation-message" class="info">
                    אנא בחר תאריך התחלה וסיום עבור ההשכרה.
                </div>
            </div>
        `);
        
        // Initialize the calendar display
        updateCalendarMonth(window.currentCalendarMonth, window.currentCalendarYear);
        
        // Add click handlers
        $('.prev-month').click(function() {
            window.currentCalendarMonth--;
            if (window.currentCalendarMonth < 0) {
                window.currentCalendarMonth = 11;
                window.currentCalendarYear--;
            }
            updateCalendarMonth(window.currentCalendarMonth, window.currentCalendarYear);
        });
        
        $('.next-month').click(function() {
            window.currentCalendarMonth++;
            if (window.currentCalendarMonth > 11) {
                window.currentCalendarMonth = 0;
                window.currentCalendarYear++;
            }
            updateCalendarMonth(window.currentCalendarMonth, window.currentCalendarYear);
        });
        
        // Setup date click handlers
        setupDateClickHandlers();
        
        console.log('Fallback calendar initialized');
    }
    
    /**
     * Update calendar to display given month/year
     */
    function updateCalendarMonth(month, year) {
        // Update month/year display
        $('.month-year').text(window.hebrewMonths[month] + ' ' + year);
        
        // Update days header
        const daysHeader = $('.calendar-days-header');
        daysHeader.empty();
        
        // Hebrew day names
        const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        
        for (let i = 0; i < 7; i++) {
            daysHeader.append(`<div class="day-name">${hebrewDays[i]}</div>`);
        }
        
        // Update calendar days
        const daysContainer = $('.calendar-days');
        daysContainer.empty();
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Calculate offset (0 = Sunday, 6 = Saturday)
        let startOffset = firstDay.getDay();
        if (startOffset === 0) startOffset = 7; // Make Sunday = 7 for correct offset
        startOffset--; // Adjust for Hebrew calendar (starts on Sunday)
        
        // Add empty cells for offset
        for (let i = 0; i < startOffset; i++) {
            daysContainer.append('<div class="day-cell empty"></div>');
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            const dateISO = formatDateISO(currentDate);
            
            // Check if day is disabled
            let isDisabled = window.disabledDates.includes(dateISO);
            
            // Check if day is in the past
            const isPast = currentDate < new Date().setHours(0, 0, 0, 0);
            
            // Check if day is Saturday (6)
            const isSaturday = currentDate.getDay() === 6;
            
            // Determine cell classes
            let cellClass = 'day-cell';
            if (isPast || isDisabled) {
                cellClass += ' disabled';
            } else if (isSaturday) {
                cellClass += ' weekend';
            }
            
            // Check if day is selected
            if (window.selectedDates.length > 0) {
                if (window.selectedDates.length === 1) {
                    if (dateISO === formatDateISO(window.selectedDates[0])) {
                        cellClass += ' selected';
                    }
                } else if (window.selectedDates.length === 2) {
                    const startDate = new Date(window.selectedDates[0]);
                    const endDate = new Date(window.selectedDates[1]);
                    
                    if (currentDate >= startDate && currentDate <= endDate) {
                        cellClass += ' selected';
                    }
                }
            }
            
            // Check if day is today
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                cellClass += ' today';
            }
            
            daysContainer.append(`<div class="${cellClass}" data-date="${dateISO}">${day}</div>`);
        }
    }
    
    /**
     * Setup click handlers for date cells
     */
    function setupDateClickHandlers() {
        $(document).on('click', '.day-cell:not(.disabled):not(.empty):not(.weekend)', function() {
            const clickedDate = new Date($(this).data('date'));
            
            if (window.selectedDates.length === 0) {
                // First click - start date
                window.selectedDates = [clickedDate];
                updateValidationMessage('info', 'נבחר תאריך התחלה. אנא בחר תאריך סיום.');
            } else if (window.selectedDates.length === 1) {
                // Second click - end date
                const startDate = new Date(window.selectedDates[0]);
                
                // Ensure end date is after start date
                if (clickedDate < startDate) {
                    const temp = startDate;
                    window.selectedDates = [clickedDate, temp];
                } else {
                    window.selectedDates = [startDate, clickedDate];
                }
                
                // Validate selected range
                validateSelectedRange();
            } else {
                // Reset selection and start new
                window.selectedDates = [clickedDate];
                window.datesConfirmed = false;
                updateValidationMessage('info', 'נבחר תאריך התחלה. אנא בחר תאריך סיום.');
            }
            
            // Update calendar to show selection
            updateCalendarMonth(window.currentCalendarMonth, window.currentCalendarYear);
        });
    }
    
    /**
     * Validate the selected date range
     */
    function validateSelectedRange() {
        if (window.selectedDates.length !== 2) {
            updateValidationMessage('info', 'אנא בחר תאריך התחלה וסיום.');
            return false;
        }
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Check for maximum rental period (7 days)
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 7) {
            updateValidationMessage('error', 'תקופת השכרה מקסימלית היא 7 ימים.');
            return false;
        }
        
        // Check if range contains any reserved dates
        if (rangeContainsReservedDates(formatDateISO(startDate), formatDateISO(endDate))) {
            updateValidationMessage('error', 'טווח התאריכים שנבחר מכיל תאריכים שכבר הוזמנו.');
            return false;
        }
        
        // Format dates for display
        const startFormatted = formatDate(startDate);
        const endFormatted = formatDate(endDate);
        
        // Success - add confirm button
        updateValidationMessage('success', 
            `נבחרו תאריכי השכרה: ${startFormatted} - ${endFormatted} (${diffDays} ימים)` +
            `<button class="confirm-dates-btn" id="confirm-dates">אישור תאריכי השכרה</button>`
        );
        
        // Add event listener to confirm button
        $(document).on('click', '#confirm-dates', function() {
            confirmSelectedDates();
        });
        
        return true;
    }
    
    /**
     * Update validation message
     */
    function updateValidationMessage(type, message) {
        const validationMessage = $('#date-validation-message');
        validationMessage.removeClass('info error success').addClass(type);
        validationMessage.html(message);
    }
    
    /**
     * Confirm selected dates
     */
    function confirmSelectedDates() {
        if (window.selectedDates.length !== 2) {
            console.error('No valid date range selected');
            return;
        }
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Format dates for hidden fields
        const startFormatted = formatDate(startDate);
        const endFormatted = formatDate(endDate);
        
        // Set hidden fields
        $('#rental_start_date').val(startFormatted);
        $('#rental_end_date').val(endFormatted);
        
        // Mark dates as confirmed
        window.datesConfirmed = true;
        
        console.log('Dates confirmed:', startFormatted, '-', endFormatted);
        
        // Scroll to add to cart button
        const addToCartBtn = $('.single_add_to_cart_button');
        if (addToCartBtn.length > 0) {
            $('html, body').animate({
                scrollTop: addToCartBtn.offset().top - 100
            }, 500);
        }
    }
    
    // Expose functions to global scope
    window.initializeFallbackCalendar = initializeFallbackCalendar;
    
})(jQuery);
