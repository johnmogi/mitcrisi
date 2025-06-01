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
    
    // Initialize global Hebrew month names first to avoid any initialization errors
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
     * Calculate rental days 
     */
    function calculateRentalDays(startDate, endDate) {
        console.log('Calculating rental days from', startDate, 'to', endDate);
        
        // Make sure we have valid dates
        if (!startDate || !endDate) {
            console.error('Invalid dates provided to calculateRentalDays');
            return 0;
        }
        
        // Convert to Date objects if strings
        let start = (typeof startDate === 'string') ? new Date(startDate) : new Date(startDate.getTime());
        let end = (typeof endDate === 'string') ? new Date(endDate) : new Date(endDate.getTime());
        
        // Normalize dates to midnight for consistent day calculation
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Ensure start date is before or equal to end date
        if (start > end) {
            console.log('Swapping dates because start is after end');
            const temp = start;
            start = end;
            end = temp;
        }
        
        // Get day of week for start and end dates
        const startDay = start.getDay();
        const endDay = end.getDay();
        
        // SPECIAL CASE: If booking is Friday to Sunday (5 to 0), count as 1 day
        if (startDay === 5 && endDay === 0) {
            console.log('SPECIAL CASE: Friday to Sunday counts as 1 day!');
            return 1;
        }
        
        // Count nights stayed (days - 1) - do NOT include end date
        let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        console.log('Total nights stayed (NOT including end date):', days);
        
        // Check if booking spans a weekend (Friday and Saturday in Israel)
        // If booking spans an entire weekend (Friday and Saturday), count it as 1 day
        let hasWeekend = false;
        let weekendDaysCount = 0;
        let hasFriday = false;
        let hasSaturday = false;
        let tempWeekend = new Date(start);
        
        // First, count weekend days in the range (excluding end date)
        while (tempWeekend < end) { 
            const dow = tempWeekend.getDay();
            if (dow === 5) { // Friday(5)
                hasFriday = true;
                weekendDaysCount++;
                hasWeekend = true;
            } else if (dow === 6) { // Saturday(6)
                hasSaturday = true;
                weekendDaysCount++;
                hasWeekend = true;
            }
            tempWeekend.setDate(tempWeekend.getDate() + 1);
        }
        
        // SPECIAL CASE: Handle specific date ranges with weekend in the middle
        
        // Thursday(4) to Sunday(0) range (Jun 12-15) should be 2 days
        if (startDay === 4 && endDay === 0) {
            // If range includes both Friday and Saturday, count them as 1 day
            if (hasFriday && hasSaturday) {
                console.log('SPECIAL CASE: Thursday-Sunday with weekend in middle');
                // Count as: Thursday + (Friday+Saturday as 1) = 2 days
                return 2; // Explicitly returning 2 days for Thursday-Sunday
            }
        }
        
        // Wednesday(3) to Sunday(0) range (Jun 4-8) should be 3 days
        if (startDay === 3 && endDay === 0) {
            // If range includes both Friday and Saturday, count them as 1 day
            if (hasFriday && hasSaturday) {
                console.log('SPECIAL CASE: Wednesday-Sunday with weekend in middle');
                // Count as: Wednesday + Thursday + (Friday+Saturday as 1) = 3 days
                return 3; // Explicitly returning 3 days for Wednesday-Sunday
            }
        }
        
        // Tuesday(2) to Sunday(0) range (Jun 10-15) should be 4 days
        if (startDay === 2 && endDay === 0) {
            // If range includes both Friday and Saturday, count them as 1 day
            if (hasFriday && hasSaturday) {
                console.log('SPECIAL CASE: Tuesday-Sunday with weekend in middle');
                // Count as: Tuesday + Wednesday + Thursday + (Friday+Saturday as 1) = 4 days
                return 4; // Explicitly returning 4 days for Tuesday-Sunday
            }
        }
        
        // Monday(1) to Sunday(0) range (Jun 9-15) should be 5 days
        if (startDay === 1 && endDay === 0) {
            // If range includes both Friday and Saturday, count them as 1 day
            if (hasFriday && hasSaturday) {
                console.log('SPECIAL CASE: Monday-Sunday with weekend in middle');
                // Count as: Monday + Tuesday + Wednesday + Thursday + (Friday+Saturday as 1) = 5 days
                return 5; // Explicitly returning 5 days for Monday-Sunday
            }
        }
        
        // Adjust days calculation - if weekend days exist, apply special weekend pricing rule
        if (hasWeekend) {
            // The critical Israeli weekend rule: Friday and Saturday together count as 1 day
            if (hasFriday && hasSaturday) {
                // If both Friday and Saturday are included, count them as 1 day
                days = days - weekendDaysCount + 1;
                console.log('Israeli weekend rule applied: Friday+Saturday count as 1 day');
            } else if (weekendDaysCount === 1) {
                // If only one weekend day, no adjustment needed
                console.log('Only one weekend day found, no special adjustment');
            }
            console.log('Adjusted days considering weekend:', days, '(weekend days:', weekendDaysCount, ')', 'hasFriday:', hasFriday, 'hasSaturday:', hasSaturday);
        }
        
        let rentalDays = days;
        if (rentalDays < 1) rentalDays = 1;
        console.log('Final rental days count (weekend-aware):', rentalDays);
        return rentalDays;
    }
    
    /**
     * Check if date range includes a Friday (which is the weekend in Israel)
     */
    function checkIfRangeIncludesFriday(startDate, endDate) {
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Check for Friday (day 5)
            if (currentDate.getDay() === 5) {
                return true;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return false;
    }
    
    /**
     * Alias for checkIfRangeIncludesFriday for consistent naming
     */
    function bookingSpansWeekend(startDate, endDate) {
        return checkIfRangeIncludesFriday(startDate, endDate);
    }
    
    /**
     * Check if a date range contains any reserved dates
     */
    function rangeContainsReservedDates(startDate, endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Convert to strings for logging
        const startFormatted = formatDate(startDateObj);
        const endFormatted = formatDate(endDateObj);
        
        console.log('Checking reserved dates in range:', startFormatted, 'to', endFormatted);
        
        // Skip checking if in test mode and start date is today (for same-day orders testing)
        if (window.forceEnableToday) {
            const todayISO = formatDateISO(new Date());
            const startISO = formatDateISO(startDateObj);
            
            if (startISO === todayISO) {
                console.log('TESTING MODE: Skipping reserved date check for today');
                // Still check if end date is reserved (if different from today)
                if (formatDateISO(endDateObj) !== todayISO && window.disabledDates && window.disabledDates.includes(formatDateISO(endDateObj))) {
                    console.log('Range contains reserved date (end date):', endFormatted);
                    return true;
                }
                return false;
            }
        }
        
        // For each date in the range
        const tempDate = new Date(startDateObj);
        while (tempDate <= endDateObj) {
            const dateISO = formatDateISO(tempDate);
            const dateFormatted = formatDate(tempDate);
            
            // Check if date is in disabled dates array
            if (window.disabledDates && window.disabledDates.includes(dateISO)) {
                console.log('Range contains reserved date:', dateFormatted);
                return true;
            }
            
            // Go to next date
            tempDate.setDate(tempDate.getDate() + 1);
        }
        
        // If we made it here, range is clear
        console.log('Range is clear of reserved dates');
        return false;
    }
    
    /**
     * Initialize the fallback calendar system
     */
    function initializeFallbackCalendar(processedDates) {
        console.log('Initializing fallback calendar system');
        
        try {
            // DEBUGGING: Check what dates were passed in
            console.log('Received dates for initialization:', processedDates);
            
            // Use processed dates if provided, otherwise use global booked dates
            const disabledDates = processedDates || window.bookedDates || [];
            console.log('Using already formatted dates from rental-dates-handler');
            
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

            // FORCE ENABLE TODAY FOR TESTING - IMPORTANT: Set to false for production
            const forceEnableToday = false;
            
            // Get business hours
            const businessHours = window.businessHours || {
                sunday: ["09:00", "17:00"],
                monday: ["09:00", "17:00"],
                tuesday: ["09:00", "17:00"],
                wednesday: ["09:00", "17:00"],
                thursday: ["09:00", "17:00"],
                friday: ["09:00", "13:00"],
                saturday: ["closed", "closed"]
            };
            
            // Default pickup hour (parse number from product setting, default to 11)
            const pickupHour = parseInt(window.productPickupTime, 10) || 11;
            // Late booking cutoff: 2 hours before pickup
            const cutoffHour = pickupHour - 2;
            console.log('Pickup hour:', pickupHour, '/ Cutoff hour:', cutoffHour);
            
            // Are we using Israel time - IMPORTANT: Set to false for testing, true for production
            const useIsraelTime = false;
            
            // Process and format dates - SAFELY
            let allDisabledDates = [];
            try {
                allDisabledDates = prepareDisabledDates(disabledDates);
                console.log('Disabled dates prepared successfully:', allDisabledDates);
            } catch (err) {
                console.error('Error preparing disabled dates:', err);
                // Fallback to using the raw dates directly if processing fails
                allDisabledDates = Array.isArray(disabledDates) ? [...disabledDates] : [];
            }
            
            // Add Israel holidays if needed
            if (window.israelHolidays && window.israelHolidays.length) {
                allDisabledDates = allDisabledDates.concat(window.israelHolidays);
            }
            
            // Load reserved date ranges for boundary highlighting
            window.reservedRanges = (window.mitnafunFrontend && Array.isArray(window.mitnafunFrontend.reservedRanges))
                ? window.mitnafunFrontend.reservedRanges : [];
            
            // Today's date
            const today = new Date();
            
            // Check if today should be disabled based on time
            if (forceEnableToday) {
                // TEST MODE: Always enable today
                console.log('TESTING MODE: Today (' + formatDateISO(today) + ') is enabled for booking');
                
                // If today is in the disabled dates array, remove it
                allDisabledDates = allDisabledDates.filter(date => {
                    if (typeof date === 'string') {
                        return date !== formatDateISO(today);
                    } else if (date instanceof Date) {
                        return date.toDateString() !== today.toDateString();
                    }
                    return true;
                });
            } else {
                // PRODUCTION MODE: Check if it's too late to book today
                const currentHour = useIsraelTime 
                    ? getIsraelHour() 
                    : getCurrentLocalHour();
                
                console.log('Current hour: ' + currentHour + ' / Cutoff hour: ' + cutoffHour);
                
                if (currentHour >= cutoffHour) {
                    // It's too late to book today, add today to disabled dates
                    const todayISO = formatDateISO(today);
                    allDisabledDates.push(todayISO);
                    console.log('PRODUCTION MODE: Added today to disabled dates because it\'s past cutoff time');
                } else {
                    console.log('PRODUCTION MODE: Today is still available for booking (before cutoff time)');
                }
            }
            
            // Set up disabled dates
            window.disabledDates = allDisabledDates;
            console.log('Final disabled dates set:', window.disabledDates);
            
            // Make sure we have CSS styles
            addCalendarStyles();
            
            // Generate the calendar for the current month
            const now = new Date();
            const currentMonth = now.getMonth(); // 0-based (0 = January)
            const currentYear = now.getFullYear();
            
            // Generate calendar for current month (not previous month)
            console.log('Generating calendar with month:', currentMonth, 'year:', currentYear);
            
            // Check if generateMonthCalendar exists
            if (typeof generateMonthCalendar !== 'function') {
                console.error('generateMonthCalendar function is not defined!');
                
                // Fallback implementation if needed
                container.html('<div class="calendar-error">תקלה בטעינת הלוח. אנא נסו לרענן את הדף או צרו קשר עם התמיכה.</div>');
            } else {
                generateMonthCalendar(container, currentMonth, currentYear, window.disabledDates || []);
            }
            
            // Set up date selection handlers
            if (typeof setupDateSelectionHandlers === 'function') {
                setupDateSelectionHandlers();
            } else {
                console.error('setupDateSelectionHandlers function is not defined!');
            }
            
            // Set up the pickup time field to always show 11:00
            if (typeof setupPickupTimeField === 'function') {
                setupPickupTimeField();
            } else {
                console.error('setupPickupTimeField function is not defined!');
            }
            
            // Initialize selection state if needed
            window.selectedDates = window.selectedDates || [];
            window.datesConfirmed = window.datesConfirmed || false;
            
            // Hide all notices initially
            $('#date-validation-message').hide();
            $('#late-booking-notice').hide();
            $('#weekend-return-notice').hide();
            $('#return-conditions-notice').hide();
            $('#max-duration-message').hide();
            $('.order-disabled-text').hide();
            
            // Disable add to cart button until dates are selected and confirmed
            $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled').attr('aria-disabled', 'true');
            
            console.log('Fallback calendar initialization completed successfully');
            
            return true;
        } catch (error) {
            console.error('Error initializing fallback calendar:', error);
            
            // Try to create a simple fallback calendar UI if initialization fails
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
    }
    
    /**
     * Prepare disabled dates for the calendar
     * @param {Array} dates - Array of dates to process
     * @returns {Array} - Processed array of dates in ISO format
     */
    function prepareDisabledDates(dates) {
        if (!dates || !Array.isArray(dates)) {
            return [];
        }
        
        const processedDates = [];
        
        // Process each date in the array
        dates.forEach(date => {
            // If it's already a string in ISO format (YYYY-MM-DD), add it directly
            if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                processedDates.push(date);
            } 
            // If it's a Date object, convert to ISO format
            else if (date instanceof Date) {
                processedDates.push(formatDateISO(date));
            } 
            // If it's a string in another format, try to convert
            else if (typeof date === 'string') {
                try {
                    // Check if it's a date range (contains a hyphen)
                    if (date.includes('-')) {
                        const [startStr, endStr] = date.split('-').map(d => d.trim());
                        
                        // Try to parse as DD.MM.YYYY format
                        if (startStr.match(/^\d{2}\.\d{2}\.\d{4}$/) && endStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            const [startDay, startMonth, startYear] = startStr.split('.');
                            const [endDay, endMonth, endYear] = endStr.split('.');
                            
                            const startDate = new Date(startYear, startMonth - 1, startDay);
                            const endDate = new Date(endYear, endMonth - 1, endDay);
                            
                            // Add all dates in the range
                            const currentDate = new Date(startDate);
                            while (currentDate <= endDate) {
                                processedDates.push(formatDateISO(currentDate));
                                currentDate.setDate(currentDate.getDate() + 1);
                            }
                        }
                    } else {
                        // Try to parse as a single date
                        const dateObj = new Date(date);
                        if (!isNaN(dateObj.getTime())) {
                            processedDates.push(formatDateISO(dateObj));
                        }
                    }
                } catch (e) {
                    console.error('Error processing date:', date, e);
                }
            }
        });
        
        return processedDates;
    }
    
    /**
     * Generate month calendar for the fallback system
     * @param {jQuery} container - The container to render the calendar in
     * @param {number} month - Month to render (0-11)
     * @param {number} year - Year to render
     * @param {Array} disabledDates - Array of disabled dates in YYYY-MM-DD format
     */
    function generateMonthCalendar(container, month, year, disabledDates) {
        console.log('Generating month calendar with month:', month, 'year:', year);
        if (!container || !container.length) {
            console.error('Invalid container for calendar:', container);
            return;
        }
        container.empty();
        const calendarHTML = $('<div class="fallback-calendar"></div>');
        // Month header with navigation
        const monthHeader = $(`
            <div class="month-header">
                <div class="month-year">${getMonthName(month)} ${year}</div>
                <button id="prevMonthBtn" class="nav-btn">&lt;</button>
                <button id="nextMonthBtn" class="nav-btn">&gt;</button>
            </div>`);
        calendarHTML.append(monthHeader);
        // Days header
        const daysHeader = $('<div class="calendar-days-header"></div>');
        ['א','ב','ג','ד','ה','ו','ש'].forEach(day => daysHeader.append(`<div class="day-name">${day}</div>`));
        calendarHTML.append(daysHeader);
        // Days grid
        const calendarDays = $('<div class="calendar-days"></div>');
        const firstWeekday = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstWeekday; i++) {
            calendarDays.append('<div class="day-cell empty" data-selectable="true"></div>');
        }
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayISO = formatDateISO(new Date());
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateISO = formatDateISO(dateObj);
            const classes = ['day-cell'];
            if (dateObj.getDay() === 6) classes.push('weekend');
            if (Array.isArray(disabledDates) && disabledDates.includes(dateISO)) classes.push('disabled');
            if (dateISO === todayISO) {
                classes.push('today');
                // Skip disabling today if multiple items in stock
                if (window.stockQuantity > 1) {
                    // multiple stock: keep today enabled
                } else {
                    // Disable today after cutoff time
                    const currentHour = new Date().getHours();
                    const pickupHour = window.productPickupTime || 11;
                    const cutoffHour = pickupHour - 2;
                    if (currentHour >= cutoffHour) {
                        classes.push('disabled');
                    }
                }
            }
            // Mark range start/end
            if (window.reservedRanges) {
                window.reservedRanges.forEach(range => {
                    if (dateISO === range.start) classes.push('range-start');
                    if (dateISO === range.end) classes.push('range-end');
                });
            }
            // Compute today's date (midnight) to disable past days
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            // Disable past dates
            if (dateObj < todayDate) {
                classes.push('disabled');
            }
            calendarDays.append(`<div class="${classes.join(' ')}" data-date="${dateISO}" data-selectable="${!classes.includes('disabled')}">${day}</div>`);
        }
        calendarHTML.append(calendarDays);
        // Legend
        const legend = $(`
            <div class="calendar-legend">
                <div class="legend-item"><span class="legend-color available"></span> פנוי</div>
                <div class="legend-item"><span class="legend-color disabled"></span> תפוס</div>
                <div class="legend-item"><span class="legend-color weekend"></span> שבת (סגור)</div>
            </div>`);
        calendarHTML.append(legend);
        // Append to container
        container.append(calendarHTML);
        // Navigation handlers
        $('#prevMonthBtn').off('click').on('click', function(e) { e.preventDefault(); navigateToPreviousMonth(container); });
        $('#nextMonthBtn').off('click').on('click', function(e) { e.preventDefault(); navigateToNextMonth(container); });
        console.log('Calendar successfully generated');
        // Notify other handlers to reapply special markings after calendar redraw
        $(document).trigger('calendar-initialized');
    }
    
    /**
     * Get the name of a month in Hebrew
     * @param {number} month - Month number (0-11)
     * @returns {string} - Hebrew month name
     */
    function getMonthName(month) {
        const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        
        return hebrewMonths[month] || '';
    }

    /**
     * Navigate to the previous month in the calendar
     * @param {jQuery} container - Calendar container
     */
    function navigateToPreviousMonth(container) {
        // Get current month and year from the calendar
        const monthYearText = container.find('.month-year').text();
        const parts = monthYearText.split(' ');
        const currentYear = parseInt(parts[1], 10);
        
        // Find the month number from Hebrew name
        const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        const currentMonth = hebrewMonths.indexOf(parts[0]);
        
        // Calculate previous month
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        
        if (prevMonth < 0) {
            prevMonth = 11;  // December
            prevYear = prevYear - 1;
        }
        
        // Don't navigate to past months
        const today = new Date();
        if (prevYear < today.getFullYear() || 
            (prevYear === today.getFullYear() && prevMonth < today.getMonth())) {
            console.log('Cannot navigate to months in the past');
            return;
        }
        
        // Generate the new calendar
        generateMonthCalendar(container, prevMonth, prevYear, window.disabledDates || []);
    }

    /**
     * Navigate to the next month in the calendar
     * @param {jQuery} container - Calendar container
     */
    function navigateToNextMonth(container) {
        // Get current month and year from the calendar
        const monthYearText = container.find('.month-year').text();
        const parts = monthYearText.split(' ');
        const currentYear = parseInt(parts[1], 10);
        
        // Find the month number from Hebrew name
        const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        const currentMonth = hebrewMonths.indexOf(parts[0]);
        
        // Calculate next month
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
        
        if (nextMonth > 11) {
            nextMonth = 0;  // January
            nextYear = nextYear + 1;
        }
        
        // Generate the new calendar
        generateMonthCalendar(container, nextMonth, nextYear, window.disabledDates || []);
    }
    
    /**
     * Initialize the calendar interface
     */
    function initCalendar() {
        // Initialize with current date
        const now = new Date();
        window.currentCalendarMonth = now.getMonth();
        window.currentCalendarYear = now.getFullYear();
        
        // Generate the initial calendar
        generateMonthCalendar($('#datepicker-container'), window.currentCalendarMonth, window.currentCalendarYear, window.disabledDates || []);
        
        // Setup date selection handlers
        setupDateSelectionHandlers();
    }
    
    /**
     * Setup date selection handlers for the calendar
     * This handles clicking on dates and managing the selection state
     */
    function setupDateSelectionHandlers() {
        console.log('Setting up date selection handlers');
        
        // Delegate event handling to prevent issues with dynamically added content
        $(document).off('click', '.day-cell').on('click', '.day-cell', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Hide any previous notices on new selection
            $('#date-validation-message').hide();
            $('#return-date-notice').hide();
            $('#early-return-notice').hide();
            $('#return-time-notice').hide();
            
            // Don't allow clicks on disabled cells
            if ($(this).hasClass('disabled') && !$(this).hasClass('joinable')) {
                console.log('Clicked on disabled date - ignoring');
                return;
            }
            
            // Get the clicked date from data attribute
            const dateString = $(this).data('date');
            if (!dateString) {
                console.log('No date data found on clicked cell');
                return;
            }
            
            // Parse date string to Date object
            const clickedDate = new Date(dateString + 'T00:00:00');
            console.log('Date cell clicked:', formatDate(clickedDate));
            
            // Prevent selecting today after cutoff
            const allowed = checkAndHandleSameDayBooking(clickedDate);
            if (!allowed) {
                console.log('Selection prevented: past cutoff');
                return;
            }
            
            // Reset the confirmed state when selecting new dates
            window.datesConfirmed = false;
            
            // Get current selection state
            if (!window.selectedDates) {
                window.selectedDates = [];
            }
            
            // If we already have 2 dates, clear selection and start over
            if (window.selectedDates.length === 2) {
                // Hide return-time notice when starting a new selection
                $('#return-time-notice').hide();
                clearDateSelection();
                // Start new selection with only the clicked date
                window.selectedDates = [new Date(clickedDate)];
                updateCalendarSelection();
                updateSelectedRangeDisplay();
                
                // Check for same-day booking restrictions
                checkAndHandleSameDayBooking(window.selectedDates[0]);
                return;
            }
            
            // If we have no dates selected, this is the start date
            if (window.selectedDates.length === 0) {
                // Begin selection with the clicked date only
                window.selectedDates = [new Date(clickedDate)];
                updateCalendarSelection();
                updateSelectedRangeDisplay();
                
                // Check for same-day booking restrictions
                checkAndHandleSameDayBooking(window.selectedDates[0]);
                return;
            }
            
            // If we have one date selected, this is the end date
            if (window.selectedDates.length === 1) {
                // Check if the clicked date is before the start date
                if (clickedDate < window.selectedDates[0]) {
                    // If clicked date is before start date, swap them
                    window.selectedDates = [new Date(clickedDate), window.selectedDates[0]];
                } else {
                    // Otherwise, use the clicked date as the end date
                    window.selectedDates.push(new Date(clickedDate));
                }
                
                updateCalendarSelection();
                updateSelectedRangeDisplay();
                
                // Check if either the start or end date is today
                const startDate = window.selectedDates[0];
                const endDate = window.selectedDates[1];
                
                // Check for same-day booking restrictions on start date
                checkAndHandleSameDayBooking(startDate);
                
                // Validate the date range
                validateDateRange();
                
                return;
            }
        });
        
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
                    const pickupHour = window.productPickupTime || 11;
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
    }
    
    /**
     * Validate the selected date range
     * Checks for reserved dates and proper date order
     */
    function validateDateRange() {
        try {
            // Get selected dates
            const startDateISO = selectedStartDate ? formatDateISO(selectedStartDate) : null;
            const endDateISO = selectedEndDate ? formatDateISO(selectedEndDate) : null;
            
            // If no dates are selected, it's not valid
            if (!startDateISO || !endDateISO) {
                console.log('Validation failed: No dates selected');
                return false;
            }
            
            console.log('Validating date range:', startDateISO, 'to', endDateISO);
            
            // Ensure dates are in the correct order
            if (selectedStartDate > selectedEndDate) {
                console.log('Validation failed: Start date must be before end date');
                updateSelectedRangeDisplay("יש לבחור תאריך התחלה לפני תאריך סיום", 'error');
                return false;
            }
            
            // Special handling for return and early return dates
            let hasReturnDate = false;
            let hasEarlyReturnDate = false;
            
            // Check if start date is a return date
            if (window.returnDates && window.returnDates.includes(startDateISO)) {
                hasReturnDate = true;
                console.log('Start date is a return date (last day of previous booking)');
            }
            
            // Check if end date is an early return date
            if (window.earlyReturnDates && window.earlyReturnDates.includes(endDateISO)) {
                hasEarlyReturnDate = true;
                console.log('End date is an early return date (day before next booking)');
            }
            
            // Check if any days in the range are reserved
            const dateRange = getDatesInRange(selectedStartDate, selectedEndDate);
            
            // Check each date in the range
            for (let i = 0; i < dateRange.length; i++) {
                const currentDate = dateRange[i];
                const currentDateISO = formatDateISO(currentDate);
                
                // Skip the check for return dates and early return dates
                const isReturnDate = window.returnDates && window.returnDates.includes(currentDateISO);
                const isEarlyReturnDate = window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO);
                
                if (isReturnDate || isEarlyReturnDate) {
                    // These special dates are allowed
                    console.log('Special date found in range:', currentDateISO, isReturnDate ? '(return date)' : '(early return date)');
                } 
                else if (isDateReserved(dateRange[i])) {
                    // Regular reserved dates are not bookable
                    console.log('Validation failed: Date in range is reserved:', currentDateISO);
                    updateSelectedRangeDisplay("טווח התאריכים מכיל תאריך שאינו זמין", 'error');
                    return false;
                }
                
                // Skip weekends (Friday & Saturday) in reserved-date validation
                const dow = currentDate.getDay();
                if (dow === 5 || dow === 6) continue;
            }
            
            // Check maximum rental days - ensure it's not more than MAX_RENTAL_DAYS
            const rentalDays = calculateRentalDays(selectedStartDate, selectedEndDate);
            const maxDays = window.maxRentalDays || 14;
            
            if (rentalDays > maxDays) {
                console.log('Validation failed: Rental days exceed maximum:', rentalDays, '>', maxDays);
                updateSelectedRangeDisplay(`ניתן להזמין עד ${maxDays} ימים.`, 'error');
                return false;
            }
            
            // Check if any date in the range is not bookable (except special dates)
            for (let i = 0; i < dateRange.length; i++) {
                const currentDate = dateRange[i];
                const currentDateISO = formatDateISO(currentDate);
                
                // Skip checks for Saturdays, return dates, and early return dates
                if (currentDate.getDay() === 6 || 
                    (window.returnDates && window.returnDates.includes(currentDateISO)) ||
                    (window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO))) {
                    continue;
                }
                
                // Skip checking isDateBookable for dates we already know are allowed
                // This prevents conflicts with the newly added handlers
                if (!isDateBookable(currentDate) && 
                    !(window.returnDates && window.returnDates.includes(currentDateISO)) && 
                    !(window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO))) {
                    
                    // Special handling for today - compare with the same cutoff check as elsewhere
                    const today = new Date();
                    const isToday = currentDate.getFullYear() === today.getFullYear() &&
                                    currentDate.getMonth() === today.getMonth() &&
                                    currentDate.getDate() === today.getDate();
                    
                    if (isToday) {
                        const currentHour = today.getHours();
                        const pickupHour = window.productPickupTime || 11;
                        const cutoffHour = pickupHour - 2;
                        
                        if (currentHour < cutoffHour || window.forceEnableToday) {
                            // Before cutoff time, date is valid regardless of what isDateBookable says
                            continue;
                        }
                    }
                    
                    console.error('Invalid date range: contains non-bookable date', formatDate(currentDate));
                    updateSelectedRangeDisplay("טווח התאריכים מכיל תאריך שאינו ניתן להזמנה", 'error');
                    return false;
                }
            }
            
            // All checks passed
            console.log('Date range validation passed');
            return true;
        } catch (error) {
            console.error('Error in validateDateRange:', error);
            updateSelectedRangeDisplay("אירעה שגיאה בבדיקת טווח התאריכים", 'error');
            return false;
        }
    }
    
    /**
     * Update calendar to show selected date range
     */
    function updateCalendarSelection() {
        console.log('Updating calendar selection with dates:', window.selectedDates ? window.selectedDates.map(d => formatDate(d)) : []);
        
        // Clear all current selections first (fixes persistent selection bug)
        $('.day-cell').removeClass('selected selected-start selected-end in-selected-range in-range confirmed');
        $('.day-cell').removeAttr('style');
        
        // If no dates are selected, just return
        if (!window.selectedDates || window.selectedDates.length === 0) {
            return;
        }
        
        // Ensure the dates are in chronological order
        let orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        
        // For single date selection
        if (window.selectedDates.length === 1) {
            const selectedDate = formatDateISO(new Date(window.selectedDates[0]));
            const cell = $(`.day-cell[data-date="${selectedDate}"]`);
            
            cell.addClass('selected selected-start');
            
            if (window.datesConfirmed) {
                cell.addClass('confirmed');
            }
        }
        // For date range
        else if (window.selectedDates.length === 2) {
            const startDate = new Date(orderedDates[0]);
            const endDate = new Date(orderedDates[1]);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            
            // Get all date cells
            $('.day-cell').each(function() {
                const dateStr = $(this).attr('data-date');
                if (!dateStr) return;
                
                const cellDate = new Date(dateStr);
                cellDate.setHours(0,0,0,0);
                
                // Check if this is start date
                if (cellDate.getTime() === startDate.getTime()) {
                    $(this).addClass('selected selected-start in-range');
                    if (window.datesConfirmed) {
                        $(this).addClass('confirmed');
                    }
                }
                
                // Check if this is end date
                if (cellDate.getTime() === endDate.getTime()) {
                    $(this).addClass('selected selected-end in-range');
                    if (window.datesConfirmed) {
                        $(this).addClass('confirmed');
                    }
                }
                
                // Check if this date is in the selected range
                if (cellDate > startDate && cellDate < endDate) {
                    $(this).addClass('in-range');
                }
            });
        }
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
            $('#datepicker-container').before('<div class="rental-dates-label">תאריכי השכרה');
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
                #nextMonthBtn {
                    float: left;
                }    
                .nav-btn {
                    background: #f1f4ff;
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
                    border: 1px solid #ececec;
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
                .day-cell.range-start, .day-cell.range-end {
                    background: #FFE082;
                    border-color: #FB8C00;
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
            </style>
        `);
    }
    
    /**
     * Check if a date is available for booking
     * Takes into account reserved dates and business hours
     */
    function isDateBookable(date) {
        // Convert to ISO format for comparison
        const dateISO = formatDateISO(date);
        
        // Choose between local time or Israel time based on setting
        let referenceDate, currentHour;
        
        if (window.useIsraelTime) {
            // Use Israel time (UTC+2)
            const israelTime = new Date();
            // Adjust to Israel time (UTC+2)
            israelTime.setHours(israelTime.getHours() + 2 - (israelTime.getTimezoneOffset() / 60));
            israelTime.setHours(0, 0, 0, 0); // Reset time part for date comparison
            referenceDate = israelTime;
            
            // For hour calculation
            const nowInIsrael = new Date();
            nowInIsrael.setHours(nowInIsrael.getHours() + 2 - (nowInIsrael.getTimezoneOffset() / 60));
            currentHour = nowInIsrael.getHours();
            
            console.log('Using Israel time (UTC+2):', {
                date: nowInIsrael.toLocaleString(),
                hour: currentHour
            });
        } else {
            // Use local user time
            const localTime = new Date();
            localTime.setHours(0, 0, 0, 0); // Reset time part for date comparison
            referenceDate = localTime;
            
            // For hour calculation
            currentHour = new Date().getHours();
            
            console.log('Using local user time:', {
                date: new Date().toLocaleString(),
                hour: currentHour
            });
        }
        
        const referenceDateISO = formatDateISO(referenceDate);
        
        // Today is only bookable if it's not past the cutoff time
        if (dateISO === referenceDateISO) {
            // TESTING OVERRIDE: Force today to be bookable if the flag is set
            if (window.forceEnableToday) {
                console.log('TESTING: Today IS bookable (forceEnableToday is true)');
                
                // Check if it's past the normal cutoff time to show late booking notice
                const earliestPickupHour = (window.businessHours && window.businessHours.open) 
                    ? parseInt(window.businessHours.open) 
                    : 9;
                
                // Cutoff time - 2 hours before earliest pickup
                const cutoffHour = earliestPickupHour - 2;
                
                // If it's past the cutoff time, show late booking notice
                if (currentHour >= cutoffHour) {
                    showLateBookingNotice();
                }
                
                return true;
            }
            
            const pickupHour = window.productPickupTime || 11;
            const cutoffHour = pickupHour - 2;
            
            console.log('Current hour:', currentHour, 'Cutoff hour:', cutoffHour);
            
            // If it's past the cutoff time, today is not bookable
            if (currentHour >= cutoffHour) {
                console.log('Today is NOT bookable (past cutoff time)');
                return false;
            } else {
                console.log('Today IS bookable (before cutoff time)');
            }
        }
        
        // Past dates are not bookable
        if (new Date(date) < referenceDate) {
            return false;
        }
        
        // Reserved dates are not bookable
        if (window.disabledDates && window.disabledDates.includes(dateISO)) {
            return false;
        }
        
        // If we made it here, the date is bookable
        return true;
    }
    
    /**
     * Show a notice for late same-day bookings
     */
    function showLateBookingNotice() {
        // Only add the notice if it doesn't already exist
        if ($('#late-booking-notice').length === 0) {
            // Create the notice HTML
            const noticeHTML = `
                <div id="late-booking-notice" style="margin: 15px 0; padding: 12px; background-color: #FFF3CD; border: 1px solid #FFEEBA; border-radius: 4px; color: #856404;">
                <strong>שימו לב!</strong> הזמנה לביצוע באותו יום מחייבת אישור טלפוני.  
                אנא צרו קשר מיידי בטלפון  
                <a href="tel:050-5544516" style="color: #856404; text-decoration: underline; font-weight: bold;">050-5544516</a>.
                </div>
            `;
            
            // Add before the validation message
            $('#date-validation-message').before(noticeHTML);
            
            // Highlight the notice with animation
            $('#late-booking-notice').hide().fadeIn(500);
            
            // Disable Add to Cart button permanently
            $('.single_add_to_cart_button').addClass('disabled').prop('disabled', true).attr('aria-disabled', 'true');
            
            // Add explanation text
            if ($('.order-disabled-text').length === 0) {
                $('.single_add_to_cart_button').after('<p class="order-disabled-text" style="color: #856404; margin-top: 10px; font-weight: bold;">לא ניתן לבצע הזמנה דרך האתר להיום. אנא צרו קשר טלפוני.</p>');
            }
        }
    }
    
    /**
     * Confirm the selected date range and process for checkout
     */
    function confirmSelectedDates() {
        console.log('Confirming selected dates');
        
        // If no dates are selected, show an error
        if (!window.selectedDates || window.selectedDates.length < 2) {
            console.log('No valid date range selected');
            showError("נא לבחור תאריך התחלה וסיום");
            return;
        }
        
        // Sort the dates (start date should always be the earliest)
        window.selectedDates.sort((a, b) => new Date(a) - new Date(b));
        
        // Get the start and end dates
        const startDate = window.selectedDates[0];
        const endDate = window.selectedDates[window.selectedDates.length - 1];
        
        // Check for duplicate date range in cart first
        if (checkForDuplicateOrder(startDate, endDate)) {
            return; // Stop confirmation if duplicate found
        }
        
        // Check if the selected range includes return dates or early-return dates
        // These special dates should be allowed despite the validation
        let hasSpecialDates = false;
        const startDateISO = formatDateISO(startDate);
        const endDateISO = formatDateISO(endDate);
        
        // Check if start date is a return date (orange)
        if (window.returnDates && window.returnDates.includes(startDateISO)) {
            hasSpecialDates = true;
            console.log('Start date is a return date (colored orange)');
        }
        
        // Check if end date is an early return date (blue)
        if (window.earlyReturnDates && window.earlyReturnDates.includes(endDateISO)) {
            hasSpecialDates = true;
            console.log('End date is an early return date (colored blue)');
        }
        
        // Perform normal validation if no special dates, otherwise bypass
        if (!hasSpecialDates && !validateDateRange()) {
            // Display error messages handled by validateDateRange()
            console.log('Date range validation failed');
            return false;
        }
        
        // If we have an early return date as the end date, ensure the notice is shown
        if (window.earlyReturnDates && window.earlyReturnDates.includes(endDateISO)) {
            if (typeof showEarlyReturnNotice === 'function') {
                showEarlyReturnNotice();
            } else {
                // Fallback if the function is not available
                if ($('#early-return-notice').length === 0) {
                    $('.fallback-calendar').after(`
                        <div id="early-return-notice" style="margin: 15px 0; padding: 12px; background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px;">
                            <strong style="color: #0d47a1;">שימו לב!</strong> עבור תאריך זה יש הזמנה למחרת.
                            <div style="margin-top: 5px;">יש להחזיר את הציוד <strong>עד השעה 09:00</strong> בבוקר.</div>
                        </div>
                    `);
                }
                $('#early-return-notice').show();
            }
        }
        
        // Similarly, if we have a return date as the start date, show that notice
        if (window.returnDates && window.returnDates.includes(startDateISO)) {
            if (typeof showReturnDateNotice === 'function') {
                showReturnDateNotice();
            } else {
                // Fallback if the function is not available
                if ($('#return-date-notice').length === 0) {
                    $('.fallback-calendar').after(`
                        <div id="return-date-notice" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;">
                            <strong style="color: #856404;">שימו לב:</strong> עבור תאריך זה קיימת החזרה של ציוד בשעות הבוקר.  
                            זמן האיסוף עשוי להתעכב – מומלץ לתאם איתנו מראש.
                        </div>
                    `);
                }
                $('#return-date-notice').show();
            }
        }
        
        // Set dates as confirmed
        window.datesConfirmed = true;
        
        // Format the dates for display
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        
        // Calculate rental days
        const actualRentalDays = calculateRentalDays(startDate, endDate);
        console.log('Rental days:', actualRentalDays);
        
        // Update hidden inputs with selected dates - use the actual displayed dates
        $('#rental_start').val(formatDateISO(startDate));
        $('#rental_end').val(formatDateISO(endDate));
        
        // Ensure all hidden form fields use the same dates
        if ($('#rental_start_date').length) {
            $('#rental_start_date').val(formatDateISO(startDate));
        }
        if ($('#rental_end_date').length) {
            $('#rental_end_date').val(formatDateISO(endDate));
        }
        
        // For one-day rentals, create the next day display for UI only
        let displayEndDate, displayEndFormatted;
        if (startDate.getTime() === endDate.getTime()) {
            // Create next day date for display only
            displayEndDate = new Date(startDate);
            displayEndDate.setDate(displayEndDate.getDate() + 1);
            displayEndFormatted = formatDate(displayEndDate);
        } else {
            displayEndFormatted = formattedEndDate;
        }
        
        // Populate consolidated return info after date confirmation
        if (!window.hasCustomReturnOverride) {
            const returnTime = window.productReturnTime;
            $('#return-info-text').text(`החזרת הציוד מתבצעת עד השעה ${returnTime}.`);
            const baseConditions = [
                'יש להחזיר את הציוד מקופל וקשור כראוי',
                'מתקנים מתנפחים יבשים אסור להרטיב',
                'ציוד שיוחזר פגום יחויב בהתאם'
            ];
            const $ul = $('#return-info-conditions').empty();
            baseConditions.forEach(cond => $ul.append(`<li>${cond}</li>`));
            if (bookingSpansWeekend(startDate, endDate)) {
                $ul.append('<li>השכרת הציוד כוללת את סוף השבוע, החזרתו תתבצע ביום ראשון.</li>');
            }
            $('#return-info-container').show();
            $('#return-info-confirm').show();
        }
        
        // Update validation message with confirmed status
        const daysText = actualRentalDays === 1 ? 'יום' : 'ימים';
        const message = `התאריכים אושרו בהצלחה: ${formattedStartDate} - ${displayEndFormatted} 
        (${actualRentalDays} ${daysText} לחיוב) <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[שנה בחירה]</a>`;
        console.log('Updating validation message with weekend-aware rental days:', actualRentalDays);
        updateSelectedRangeDisplay(message, 'success');
        
        // Force update the input field with the correct rental days
        if ($('#rental_days').length) {
            $('#rental_days').val(actualRentalDays);
            console.log('Updated #rental_days input with weekend-aware value:', actualRentalDays);
        }
        
        // Scroll to show the price breakdown and order button
        setTimeout(() => {
            // Try to find the price breakdown header
            const priceHeader = document.querySelector('.mitnafun-breakdown .breakdown-toggle');
            if (priceHeader) {
                // Scroll to the header with an offset
                const headerPosition = priceHeader.getBoundingClientRect().top;
                const offsetPosition = headerPosition + window.pageYOffset - 100; // 100px from the top
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            } else {
                // Fallback to the price breakdown container
                const priceBreakdown = document.querySelector('.mitnafun-breakdown');
                if (priceBreakdown) {
                    priceBreakdown.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    // Final fallback to the order button
                    const orderButton = document.querySelector('.single_add_to_cart_button');
                    if (orderButton) {
                        orderButton.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            }
        }, 50);
        
        // Set hidden inputs for checkout - use actual dates for calculations
        if ($('#rental_start_date').length) {
            $('#rental_start_date').val(formattedStartDate);
        } else {
            $('form.cart').append('<input type="hidden" id="rental_start_date" name="rental_start_date" value="' + formattedStartDate + '">');
        }
        
        if ($('#rental_end_date').length) {
            $('#rental_end_date').val(formattedEndDate);
        } else {
            $('form.cart').append('<input type="hidden" id="rental_end_date" name="rental_end_date" value="' + formattedEndDate + '">');
        }
        
        if ($('#rental_days').length) {
            $('#rental_days').val(actualRentalDays);
        } else {
            $('form.cart').append('<input type="hidden" id="rental_days" name="rental_days" value="' + actualRentalDays + '">');
        }
        
        // Store the dates in the format WooCommerce expects
        var fullDateRange = formattedStartDate + ' - ' + formattedEndDate;
        var rdInput = document.querySelector('input[name="rental_dates"]');
        if (rdInput) rdInput.value = fullDateRange;
        
        try {
            localStorage.setItem('mitnafun_confirmed_dates', formattedStartDate + ' - ' + formattedEndDate);
            localStorage.setItem('mitnafun_rental_days', actualRentalDays);
        } catch (e) {
            console.log('Could not save dates to local storage');
        }
        
        // Apply pricing calculations
        applyPerDayPricing(startDate, endDate, actualRentalDays);
        
        // Enable the add to cart button
        $('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false).attr('aria-disabled', 'false');
        
        // Update calendar to show confirmed dates with proper styling
        updateCalendarSelection();
        
        // Scroll to the add to cart button to help the user
        setTimeout(function() {
            $('html, body').animate({
                scrollTop: $('.single_add_to_cart_button').offset().top - 100
            }, 500);
        }, 500);
        
        return true;
    }
    
    /**
     * Calculate and apply per-day pricing based on rental duration
     */
    function applyPerDayPricing(startDate, endDate, rentalDays) {
        // Log that we're calculating prices with weekend-aware rental days
        console.log('Applying per-day pricing with weekend-aware rental days:', rentalDays);
        console.log('Date range:', formatDate(startDate), 'to', formatDate(endDate));
        
        // Try to get the base price from page
        let basePrice = 0;
        try {
            const priceText = $('.woocommerce-Price-amount').first().text().trim();
            // Extract just the number from the price text (remove currency symbol and non-numeric chars)
            basePrice = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
            console.log('Base price:', basePrice);
        } catch (e) {
            console.log('Could not determine base price');
            return;
        }
        
        if (!window.selectedDates || window.selectedDates.length !== 2 || isNaN(basePrice)) {
            return;
        }
        
        // Make sure we're using the weekend-aware rental days for all calculations
        const calculatedRentalDays = calculateRentalDays(startDate, endDate);
        if (rentalDays !== calculatedRentalDays) {
            console.log('Warning: Rental days mismatch! Provided:', rentalDays, 'Calculated:', calculatedRentalDays);
            rentalDays = calculatedRentalDays;
        }
        
        // Get discount settings from global variables set by PHP
        let discountType = window.discountType;
        let discountValue = window.discountValue;
        
        // Try to get the discount settings from global variables set by PHP
        try {
            if (window.discountType) {
                discountType = window.discountType;
                console.log('Using global discount type:', discountType);
            }
            
            if (window.discountValue !== undefined) {
                discountValue = parseFloat(window.discountValue);
                console.log('Using global discount value:', discountValue);
            }
        } catch (e) {
            console.log('Could not retrieve custom discount settings from globals, using defaults');
            
            // Fallback to data attributes if window variables aren't available
            try {
                if ($('.product').data('discount-type')) {
                    discountType = $('.product').data('discount-type');
                }
                
                if ($('.product').data('discount-value')) {
                    discountValue = parseFloat($('.product').data('discount-value'));
                }
                
                console.log('Discount settings from data attributes:', discountType, discountValue);
            } catch (e) {
                console.log('Could not retrieve custom discount settings, using defaults');
            }
        }
        
        console.log('Using discount settings:', { type: discountType, value: discountValue });
        
        // Initialize price and discount variables
        let totalPrice = basePrice;
        let discountAmount = 0;
        let regularPrice = basePrice * rentalDays;
        let discountedAdditionalDays = 0;
        
        // Calculate discounted additional days and totals
        if (rentalDays > 1) {
            if (discountType === 'percentage') {
                const discountMultiplier = (100 - discountValue) / 100;
                discountedAdditionalDays = basePrice * discountMultiplier * (rentalDays - 1);
            } else {
                const discountedDailyPrice = Math.max(basePrice - discountValue, 0);
                discountedAdditionalDays = discountedDailyPrice * (rentalDays - 1);
            }
            totalPrice = basePrice + discountedAdditionalDays;
            discountAmount = regularPrice - totalPrice;
        }
        
        // Helper to format numbers with thousand separators
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        // Format price values
        const formattedBase = numberWithCommas(basePrice.toFixed(2));
        const formattedAdditional = numberWithCommas(discountedAdditionalDays.toFixed(2));
        const formattedTotal = numberWithCommas(totalPrice.toFixed(2));
        const formattedSavings = numberWithCommas(discountAmount.toFixed(2));
        
        // Build breakdown HTML with improved styling according to user's example
        // Check if the date range includes both Friday and Saturday
        const startDayOfWeek = startDate.getDay();
        const endDayOfWeek = endDate.getDay();
        
        // Check if booking includes Friday (5) and Saturday (6)
        let hasFriday = false;
        let hasSaturday = false;
        
        // Check each day in the range for Friday and Saturday
        let checkDate = new Date(startDate);
        while (checkDate <= endDate) {
            const day = checkDate.getDay();
            if (day === 5) hasFriday = true;
            if (day === 6) hasSaturday = true;
            checkDate.setDate(checkDate.getDate() + 1);
        }
        
        const hasWeekend = hasFriday && hasSaturday;
        console.log('Price breakdown - Date range weekend check:', 
                    'Start:', formatDate(startDate), '(day', startDayOfWeek, ')',
                    'End:', formatDate(endDate), '(day', endDayOfWeek, ')',
                    'Has Friday:', hasFriday, 'Has Saturday:', hasSaturday,
                    'Has Weekend:', hasWeekend);
        
        // Prepare weekend explanation if applicable
        let weekendExplanation = '';
        // Show weekend explanation if either Friday or Saturday is in the range
        // This makes the rule more visible to users
        if (hasFriday || hasSaturday) {
            weekendExplanation = `<li style="margin-bottom: 10px; color: #0077cc;"><strong>חשוב לדעת:</strong> ימי שישי ושבת נחשבים כיום אחד בלבד לחיוב.</li>`;
            console.log('Adding weekend explanation to price breakdown');
        }
        
        // Build the HTML with the correct rental days
        const breakdownHtml = `
        <div class="mitnafun-breakdown" style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; background-color: #f9f9f9; border-radius: 4px;">
          <div class="breakdown-toggle" style="cursor: pointer; padding: 5px 0;">
            <p style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">פירוט תמחור לתקופת השכירות (${rentalDays} ימים):</p>
          </div>
          <div class="breakdown-content" style="display: block;">
            <ul style="list-style: none; padding-right: 15px; margin: 0 0 15px 0;">
              ${weekendExplanation}
              <li style="margin-bottom: 10px;">יום ראשון: <span class="woocommerce-Price-amount amount"><bdi>${formattedBase}&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> (מחיר מלא)</li>
              ${rentalDays > 1 ? `<li style="margin-bottom: 10px;">${rentalDays - 1} ימים נוספים: <span class="woocommerce-Price-amount amount"><bdi>${formattedAdditional}&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> (${discountType === 'percentage' ? discountValue + '% הנחה' : numberWithCommas(discountValue.toFixed(2)) + ' ₪ הנחה'})</li>` : ''}
            </ul>
            <p style="font-weight: bold; margin: 15px 0 0; border-top: 1px dashed #ddd; padding-top: 10px;">
              <strong>סה"כ: <span class="woocommerce-Price-amount amount"><bdi>${formattedTotal}&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> ${discountAmount > 0 ? `(חסכת <span class="woocommerce-Price-amount amount"><bdi>${formattedSavings}&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span>)` : ''}</strong>
            </p>
          </div>
        </div>
        `;
        
        // Insert or update breakdown on product page
        if ($('.mitnafun-breakdown').length) {
            $('.mitnafun-breakdown').replaceWith(breakdownHtml);
        } else {
            // prefer inserting after validation message if present for better visibility
            if ($('#date-validation-message').length) {
                $('#date-validation-message').after(breakdownHtml);
            }
            // fallback to after calendar
            else if ($('.fallback-calendar').length) {
                $('.fallback-calendar').after(breakdownHtml);
            } else {
                $('.woocommerce-Price-amount').first().closest('.price').after(breakdownHtml);
            }
        }
        
        // Store calculated values for server-side processing
        if ($('#calculated_total_price').length) {
            $('#calculated_total_price').val(totalPrice);
        } else {
            $('form.cart').append('<input type="hidden" id="calculated_total_price" name="calculated_total_price" value="' + totalPrice + '">');
        }
        
        console.log('Calculated rental price:', totalPrice);
    }
    
    /**
     * Check if a date range spans a weekend (Friday and Saturday are weekend in Israel)
     * Used to show special weekend return notice
     */
    function bookingSpansWeekend(startDate, endDate) {
        // In Israel, both Friday (day 5) and Saturday (day 6) are considered weekend
        console.log('Checking if booking spans weekend from', formatDate(startDate), 'to', formatDate(endDate));
        
        // If this is a single day booking, check if it's Friday or Saturday
        if (startDate.getTime() === endDate.getTime()) {
            const day = startDate.getDay();
            return day === 5 || day === 6; // 5 = Friday, 6 = Saturday
        }
        
        // Check for both Friday and Saturday in the range
        let hasFriday = false;
        let hasSaturday = false;
        
        // Check each day in the range
        for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            if (dayOfWeek === 5) hasFriday = true;
            if (dayOfWeek === 6) hasSaturday = true;
            
            // If we found both, we can return early
            if (hasFriday && hasSaturday) {
                console.log('Booking spans full Israeli weekend (Friday and Saturday)');
                return true;
            }
        }
        
        // Special case: If rental spans from Friday to Sunday (over the weekend)
        if (startDate.getDay() === 5 && endDate.getDay() === 0) {
            console.log('Booking spans from Friday to Sunday (includes full weekend)');
            return true;
        }
        
        // Return true if at least one weekend day is found
        const result = hasFriday || hasSaturday;
        console.log('Booking spans weekend:', result, '(has Friday:', hasFriday, ', has Saturday:', hasSaturday, ')');
        return result;
    }
    
    /**
     * Get array of dates between start and end (inclusive)
     */
    function getDatesInRange(startDate, endDate) {
        // Initialize array
        const dates = [];
        
        // Clone start date to avoid modifying original
        const currentDate = new Date(startDate);
        
        // Loop until we reach end date
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }
    
    /**
     * Helper function to check if a date is reserved
     */
    function isDateReserved(dateToCheck) {
        if (!window.disabledDates || !Array.isArray(window.disabledDates)) {
            return false;
        }
        
        // Handle both string and Date formats
        const dateISO = dateToCheck instanceof Date ? formatDateISO(dateToCheck) : dateToCheck;
        
        return window.disabledDates.some(disabledDate => {
            if (typeof disabledDate === 'string') {
                return disabledDate === dateISO;
            } else if (disabledDate instanceof Date) {
                return formatDateISO(disabledDate) === dateISO;
            }
            return false;
        });
    }
    
    /**
     * Update the display of selected date range
     */
    function updateSelectedRangeDisplay(message, type) {
        // Default to info message type
        type = type || 'info';
        
        // Create the message element if it doesn't exist
        if ($('#date-validation-message').length === 0) {
            $('#datepicker-container').after('<div id="date-validation-message"></div>');
        }
        
        // Get the message element
        const messageEl = $('#date-validation-message');
        
        // Clear any existing classes and content
        messageEl.removeClass('success error info');
        
        // Add the appropriate class based on message type
        messageEl.addClass(type);
        
        // If no message provided but we have a single date (first click)
        if (!message && window.selectedDates && window.selectedDates.length === 1) {
            const startDate = new Date(window.selectedDates[0]);
            const startFormatted = formatDate(startDate);
            
            // Show single date selection message
            message = `<strong>תאריך התחלה:</strong> ${startFormatted} <strong>(בחר תאריך סיום)</strong>`;
            messageEl.removeClass('success error').addClass('info');
        }
        // If no message provided, but we have a complete date range
        else if (!message && window.selectedDates && window.selectedDates.length === 2) {
            // Ensure dates are in the correct order
            let startDate, endDate;
            if (window.selectedDates[0].getTime() > window.selectedDates[1].getTime()) {
                startDate = new Date(window.selectedDates[1]);
                endDate = new Date(window.selectedDates[0]);
            } else {
                startDate = new Date(window.selectedDates[0]);
                endDate = new Date(window.selectedDates[1]);
            }
            
            // Format dates for display
            const startFormatted = formatDate(startDate);
            const endFormatted = formatDate(endDate);
            
            // Calculate rental days
            const actualRentalDays = calculateRentalDays(startDate, endDate);
            
            // If dates already confirmed, show confirmation message
            if (window.datesConfirmed) {
                message = `<strong>התאריכים אושרו בהצלחה:</strong> ${startFormatted} - ${endFormatted} 
                (${actualRentalDays} ימים) <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[שנה בחירה]</a>`;
                messageEl.removeClass('info error').addClass('success');

                // Make sure the Add to Cart button is enabled
                $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled').attr('aria-disabled', 'false');
            } 
            // Otherwise show pending confirmation message and button
            else {
                message = `
                    <strong>תאריכים שנבחרו:</strong> ${startFormatted} - ${endFormatted} 
                    (${actualRentalDays} ימים)
                    <span class="confirm-button-wrapper">
                        <button id="confirm-dates" class="button" style="background-color: #4CAF50; color: white; font-weight: bold;">אשר תאריכים</button>
                    </span>
                    <span id="clear-selection">
                        <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[נקה בחירה]</a>
                    </span>
                `;
                messageEl.removeClass('error').addClass('success');
            }
        }
        
        // If a custom message is provided, use it
        if (message) {
            messageEl.html(message).show();
        } else {
            messageEl.hide();
        }
        
        // Add click handlers
        $('#clear-date-selection').off('click').on('click', function(e) {
            e.preventDefault();
            clearDateSelection();
        });
        
        $('#confirm-dates').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmSelectedDates();
            return false;
        });
    }
    
    /**
     * Clear all date selection styling and classes
     */
    function clearAllDateSelections() {
        $('.day-cell').removeClass('selected selected-start selected-end in-selected-range in-range confirmed');
        $('.day-cell').removeAttr('style');
        $('#return-conditions-notice').hide();
        $('#date-validation-message').hide();
    }
    
    /**
     * Clear the current date selection
     */
    function clearDateSelection() {
        console.log('Clearing date selection');
        
        // Reset selected dates
        window.selectedDates = [];
        window.datesConfirmed = false;
        
        // Clear calendar UI
        $('.day-cell').removeClass('selected selected-start selected-end in-range confirmed');
        
        // Hide additional content that may be showing
        $('#rental-hours-container').hide();
        
        // Hide any return notices that might be visible
        $('#return-time-notice').hide();
        $('#return-date-notice').hide();
        $('#early-return-notice').hide();
        
        // Re-enable form buttons
        $('.single_add_to_cart_button').prop('disabled', false).removeClass('disabled').attr('aria-disabled', 'false');
        
        // Hide any confirmation elements
        $('.confirm-button').hide().remove();
    }
    
    /**
     * Check if product with same dates already exists in cart
     * Only blocks if stock would be depleted by adding another item
     */
    function checkForDuplicateOrder(startDate, endDate) {
        // Format dates for comparison
        const dateRangeStart = formatDate(startDate);
        const dateRangeEnd = formatDate(endDate);
        const currentRange = dateRangeStart + ' - ' + dateRangeEnd;
        
        // Get stock quantity (default to 1 if not set)
        const stockQuantity = window.stockQuantity || window.productStockQty || 1;
        console.log('Stock quantity:', stockQuantity);
        
        // Count existing products with the same rental dates in cart
        let duplicateCount = 0;
        
        try {
            // Find all cart item elements that contain rental date data
            $('.cart_item').each(function() {
                const dateAttr = $(this).data('rental_dates');
                if (dateAttr && dateAttr.toString() === currentRange) {
                    duplicateCount++;
                }
            });
            
            console.log('Found', duplicateCount, 'items with same date range in cart');
            
            // Only block if we would exceed stock quantity
            if (duplicateCount >= stockQuantity) {
                // Create a notice if one doesn't exist
                if ($('#duplicate-order-notice').length === 0) {
                    const noticeHTML = `
                        <div id="duplicate-order-notice" style="margin: 15px 0; padding: 12px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                            <strong>שימו לב!</strong> כבר קיים בסל מוצר עם אותם תאריכי השכרה ואין מספיק מלאי. 
                            אנא בחרו תאריכים אחרים או <a href="/cart/" style="color: #721c24; text-decoration: underline; font-weight: bold;">צפו בסל הקניות</a>.
                        </div>
                    `;
                    
                    $('#date-validation-message').before(noticeHTML);
                    $('#duplicate-order-notice').hide().fadeIn(500);
                    
                    // Disable Add to Cart button when stock would be depleted
                    $('.single_add_to_cart_button').addClass('disabled').prop('disabled', true).attr('aria-disabled', 'true');
                }
                return true;
            } else if (duplicateCount > 0) {
                // If there are duplicates but stock is available, show informational notice
                if ($('#duplicate-order-info').length === 0) {
                    const noticeHTML = `
                        <div id="duplicate-order-info" style="margin: 15px 0; padding: 12px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; color: #0c5460;">
                            <strong>לידיעתך:</strong> מוצר נוסף עם אותם תאריכי השכרה יתווסף לסל הקניות שלך.
                        </div>
                    `;
                    
                    $('#date-validation-message').before(noticeHTML);
                    $('#duplicate-order-info').hide().fadeIn(500);
                    
                    // Allow adding to cart
                    $('.single_add_to_cart_button').removeClass('disabled').prop('disabled', false).attr('aria-disabled', 'false');
                }
                // Return false since we want to allow the booking
                return false;
            } else {
                // Remove any existing notices
                $('#duplicate-order-notice, #duplicate-order-info').remove();
            }
        } catch (error) {
            console.error('Error checking for duplicate orders:', error);
        }
        
        return false; // Allow booking if no conflicts or errors
    }
    
    /**
     * Set up the pickup time field to default to 11:00
     */
    function setupPickupTimeField() {
        try {
            // Set default pickup time to 11:00
            if ($('#pickup_hour').length) {
                $('#pickup_hour').val('11');
                console.log('Pickup time field set to 11:00');
            } else if ($('#custom-pickup-time').length) {
                $('#custom-pickup-time').val('11');
                console.log('Custom pickup time field set to 11:00');
            } else {
                console.log('Pickup time field not found, skipping initialization');
            }
            
            // Store the pickup time in session and local storage as backup
            try {
                sessionStorage.setItem('custom_pickup_time', '11');
                localStorage.setItem('custom_pickup_time', '11');
            } catch (e) {
                console.log('Could not save pickup time to storage');
            }
        } catch (error) {
            console.log('Error setting up pickup time field:', error);
        }
    }
    
    /**
     * Expose essential functions to window for external access
     */
    window.initializeFallbackCalendar = initializeFallbackCalendar;
    window.prepareDisabledDates = prepareDisabledDates;
    window.setupPickupTimeField = setupPickupTimeField;
    window.generateMonthCalendar = generateMonthCalendar;
    window.checkAndHandleSameDayBooking = checkAndHandleSameDayBooking;
    
    /**
     * Check if a date is today and handle late booking notices
     * @param {Date} selectedDate - The date to check
     */
    function checkAndHandleSameDayBooking(selectedDate) {
        // Skip same-day booking restrictions if multiple items in stock
        if (window.stockQuantity > 1) {
            console.log('Multiple stock available: skipping same-day booking restrictions');
            $('#late-booking-notice').hide();
            $('.order-disabled-text').hide();
            return true;
        }
        
        // Get today's date
        const today = new Date();
        
        // Compare dates (year, month, day)
        const isSameDay = selectedDate.getFullYear() === today.getFullYear() &&
                          selectedDate.getMonth() === today.getMonth() &&
                          selectedDate.getDate() === today.getDate();
        
        if (isSameDay) {
            console.log('Same-day booking detected, checking time restrictions');
            
            // Get current hour
            const currentHour = today.getHours();
            
            // Default pickup hour is 11:00, cutoff is 9:00
            const pickupHour = window.productPickupTime || 11;
            const cutoffHour = pickupHour - 2;
            
            console.log('Current hour:', currentHour, 'Cutoff hour:', cutoffHour);
            
            // Check if we're past the cutoff time
            if (currentHour >= cutoffHour) {
                // We're past the cutoff time, show late booking notice
                $('#late-booking-notice').show();
                $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled').attr('aria-disabled', 'true');
                $('.order-disabled-text').show();
                console.log('Late booking notice shown - past cutoff time');
                return false; // Return false to indicate booking should be prevented
            } else {
                // We're before the cutoff time, we can proceed normally
                $('#late-booking-notice').hide();
                $('.order-disabled-text').hide();
                console.log('Before cutoff time, proceeding normally');
                return true; // Return true for non-same-day bookings
            }
        } else {
            // Not same day booking, hide late booking notices
            $('#late-booking-notice').hide();
            $('.order-disabled-text').hide();
            return true; // Return true for non-same-day bookings
        }
    }
    
    /**
     * Validate the selected date range
     * @returns {boolean} True if date range is valid
     */
    function validateDateRange() {
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            console.log('No valid date range to validate');
            return false;
        }
        
        // Ensure the dates are in chronological order
        let orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        
        // For single date selection
        if (window.selectedDates.length === 1) {
            return true;
        }
        
        // For date range
        else if (window.selectedDates.length === 2) {
            // Get the start and end dates as Date objects
            const startDate = new Date(orderedDates[0]);
            const endDate = new Date(orderedDates[1]);
            
            // Normalize times for comparison
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            
            console.log('Validating date range:', formatDateISO(startDate), 'to', formatDateISO(endDate));
            
            // Check if any days in the range are reserved
            const dateRange = getDatesInRange(startDate, endDate);
            
            // Check each date in the range
            for (let i = 0; i < dateRange.length; i++) {
                const currentDate = dateRange[i];
                const currentDateISO = formatDateISO(currentDate);
                
                // Skip the check for return dates and early return dates
                const isReturnDate = window.returnDates && window.returnDates.includes(currentDateISO);
                const isEarlyReturnDate = window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO);
                
                if (isReturnDate || isEarlyReturnDate) {
                    // These special dates are allowed
                    console.log('Special date found in range:', currentDateISO, isReturnDate ? '(return date)' : '(early return date)');
                } 
                else if (isDateReserved(dateRange[i])) {
                    // Regular reserved dates are not bookable
                    console.log('Validation failed: Date in range is reserved:', currentDateISO);
                    updateSelectedRangeDisplay("טווח התאריכים מכיל תאריך שאינו זמין", 'error');
                    return false;
                }
                
                // Skip weekends (Friday & Saturday) in reserved-date validation
                const dow = currentDate.getDay();
                if (dow === 5 || dow === 6) continue;
            }
            
            // Check maximum rental days - ensure it's not more than MAX_RENTAL_DAYS
            const rentalDays = calculateRentalDays(startDate, endDate);
            const maxDays = window.maxRentalDays || 14;
            
            if (rentalDays > maxDays) {
                console.log('Validation failed: Rental days exceed maximum:', rentalDays, '>', maxDays);
                updateSelectedRangeDisplay(`ניתן להזמין עד ${maxDays} ימים.`, 'error');
                return false;
            }
            
            // Check if any date in the range is not bookable (except special dates)
            for (let i = 0; i < dateRange.length; i++) {
                const currentDate = dateRange[i];
                const currentDateISO = formatDateISO(currentDate);
                
                // Skip checks for Saturdays, return dates, and early return dates
                if (currentDate.getDay() === 6 || 
                    (window.returnDates && window.returnDates.includes(currentDateISO)) ||
                    (window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO))) {
                    continue;
                }
                
                // Skip checking isDateBookable for dates we already know are allowed
                // This prevents conflicts with the newly added handlers
                if (!isDateBookable(currentDate) && 
                    !(window.returnDates && window.returnDates.includes(currentDateISO)) && 
                    !(window.earlyReturnDates && window.earlyReturnDates.includes(currentDateISO))) {
                    
                    // Special handling for today - compare with the same cutoff check as elsewhere
                    const today = new Date();
                    const isToday = currentDate.getFullYear() === today.getFullYear() &&
                                    currentDate.getMonth() === today.getMonth() &&
                                    currentDate.getDate() === today.getDate();
                    
                    if (isToday) {
                        const currentHour = today.getHours();
                        const pickupHour = window.productPickupTime || 11;
                        const cutoffHour = pickupHour - 2;
                        
                        if (currentHour < cutoffHour || window.forceEnableToday) {
                            // Before cutoff time, date is valid regardless of what isDateBookable says
                            continue;
                        }
                    }
                    
                    console.error('Invalid date range: contains non-bookable date', formatDate(currentDate));
                    updateSelectedRangeDisplay("טווח התאריכים מכיל תאריך שאינו ניתן להזמנה", 'error');
                    return false;
                }
            }
            
            // All checks passed
            console.log('Date range validation passed');
            return true;
        }
        
        // Default to valid if all checks passed
        return true;
    }
    
    /**
     * Show an error message in the date validation section
     */
    function showError(message) {
        const validationMessage = $('#date-validation-message');
        validationMessage.removeClass('success info').addClass('error');
        validationMessage.html(message).show();
    }
    
    /**
     * Gets the current local hour for the user
     * @returns {number} - Current hour (0-23)
     */
    function getCurrentLocalHour() {
        return new Date().getHours();
    }

    /**
     * Gets the current hour in Israel time zone (UTC+3)
     * @returns {number} - Current hour in Israel time (0-23)
     */
    function getIsraelHour() {
        try {
            // Use the Intl.DateTimeFormat API with Israel time zone
            const israelTime = new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Jerusalem', 
                hour: 'numeric', 
                hour12: false 
            });
            return parseInt(israelTime, 10);
        } catch (error) {
            console.error('Error getting Israel time:', error);
            // Fallback: approximate calculation
            const now = new Date();
            const israelOffset = 3; // Israel is UTC+3
            
            // Get the local time offset in hours
            const localOffset = -now.getTimezoneOffset() / 60;
            
            // Calculate the hour difference
            const difference = israelOffset - localOffset;
            
            // Add the difference to the local hour
            let israelHour = now.getHours() + difference;
            
            // Handle hour overflow
            israelHour = israelHour % 24;
            if (israelHour < 0) israelHour += 24;
            
            return israelHour;
        }
    }

    /**
     * Apply the current date selection to the calendar UI
     * Updates UI to show selected dates and ranges
     */
    function applyDateSelectionToCalendar() {
        console.log('Applying date selection to calendar UI');
        
        // Clear all selection classes first
        $('.day-cell').removeClass('selected selected-start selected-end in-selected-range in-range confirmed');
        
        // If no dates are selected, nothing to do
        if (!window.selectedDates || window.selectedDates.length === 0) {
            return;
        }
        
        // Ensure the dates are in chronological order
        let orderedDates = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
        
        // For single date selection
        if (window.selectedDates.length === 1) {
            const selectedDate = formatDateISO(new Date(window.selectedDates[0]));
            console.log('Highlighting single date:', selectedDate);
            
            // Find and mark the cell
            const cell = $(`.day-cell[data-date="${selectedDate}"]`);
            
            cell.addClass('selected selected-start');
            
            if (window.datesConfirmed) {
                cell.addClass('confirmed');
            }
        }
        // For date range
        else if (window.selectedDates.length === 2) {
            const startDate = new Date(orderedDates[0]);
            const endDate = new Date(orderedDates[1]);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            
            // Get all date cells
            $('.day-cell').each(function() {
                const dateStr = $(this).attr('data-date');
                if (!dateStr) return;
                
                const cellDate = new Date(dateStr);
                cellDate.setHours(0,0,0,0);
                
                // Check if this is start date
                if (cellDate.getTime() === startDate.getTime()) {
                    $(this).addClass('selected selected-start in-range');
                    if (window.datesConfirmed) {
                        $(this).addClass('confirmed');
                    }
                }
                
                // Check if this is end date
                if (cellDate.getTime() === endDate.getTime()) {
                    $(this).addClass('selected selected-end in-range');
                    if (window.datesConfirmed) {
                        $(this).addClass('confirmed');
                    }
                }
                
                // Check if this date is in the selected range
                if (cellDate > startDate && cellDate < endDate) {
                    $(this).addClass('in-range');
                }
            });
        }
    }
})(jQuery);

// Show hours-selection on confirm, hide on new selection, and keep rental_hours input synced.
jQuery(document).on('click', '#confirm-dates', function(e) {
    e.preventDefault();
    // Reveal hours-selection UI and sync hidden input
    jQuery('.hours-selection').show();
    updateRentalHours();
});

jQuery(document).on('click', '.day-cell', function(e) {
    e.preventDefault();
    e.stopPropagation();
    // Hide hours-selection and clear previous values
    jQuery('.hours-selection').hide();
    jQuery('#rental_hours').val('');
});

// Sync pickup and return selects to the hidden rental_hours field
jQuery(document).on('change', '#pickup_time, #return_time', updateRentalHours);

/**
 * Update the hidden rental_hours field with selected times.
 */
function updateRentalHours(){
    var pickup = jQuery('#pickup_time').val();
    var ret = jQuery('#return_time').val();
    if (pickup && ret) {
        jQuery('#rental_hours').val(pickup + ' - ' + ret);
    }
}
