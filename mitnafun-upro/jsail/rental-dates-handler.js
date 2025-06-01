/**
 * Rental Dates Handler
 * Processes reservation dates for products and updates the datepicker
 */
jQuery(document).ready(function($) {
    console.log("Rental Dates Handler loaded", window.mitnafunFrontend);
    
    // Get the product container
    const $product_container = $('.product-summary');
    
    // Get product ID
    let product_id = 0;
    if (window.mitnafunFrontend && mitnafunFrontend.productId) {
        product_id = Number(mitnafunFrontend.productId);
        console.log("Processing rental data for product ID:", product_id);
        // Debug: set global product_id for logging
        window.product_id = product_id;
    } else {
        console.warn("mitnafunFrontend not defined or missing productId");
    }
    
    // Fetch reserved dates via theme AJAX endpoint
    $.post(mitnafunFrontend.ajaxUrl, {
        action: 'get_reserved_dates',
        product_id: product_id,
        nonce: mitnafunFrontend.nonce
    }, function(response) {
        let bookedDates = [];
        if (response.success && Array.isArray(response.data.reserved_dates)) {
            console.log('AJAX theme reserved_dates:', response.data.reserved_dates);
            bookedDates = response.data.reserved_dates;
        } else {
            console.error('Error fetching theme reserved dates:', response.data && response.data.message);
            bookedDates = window.mitnafunFrontend.bookedDates || [];
        }
        console.log('Final bookedDates:', bookedDates);
        const processedBookedDates = processBookedDates(bookedDates);
        console.log('Processed dates after AJAX:', processedBookedDates);
        window.bookedDates = bookedDates;
        window.processedBookedDates = processedBookedDates;
        try {
            updateDatepicker(processedBookedDates);
        } catch (e) {
            console.error('Datepicker init failed, fallback:', e);
            if (typeof window.initializeFallbackCalendar === 'function') {
                window.initializeFallbackCalendar(processedBookedDates);
            }
        }
    });
    
    // Set up refresh button
    setupRefreshButton();
    
    /**
     * Process booked dates from string format to Date objects
     * @param {Array} dateRanges - Array of date range strings (format: "DD.MM.YYYY - DD.MM.YYYY")
     * @return {Array} Array of JavaScript Date objects representing all booked days
     */
    function processBookedDates(dateRanges) {
        console.log(`[RentalDates] processBookedDates for product ${window.product_id}:`, dateRanges);
        // Initialize empty array to store all booked dates
        let allBookedDates = [];
        
        // Return empty array if no date ranges provided
        if (!dateRanges || !dateRanges.length) {
            console.log("No date ranges provided");
            return allBookedDates;
        }
        
        // Validate date ranges - ensure all entries are strings
        const validDateRanges = dateRanges.filter(range => typeof range === 'string' && range.trim() !== '');
        if (validDateRanges.length < dateRanges.length) {
            console.warn('Some invalid date ranges were filtered out:', dateRanges);
        }
        
        // Process each date range and flatten the result
        validDateRanges.forEach(function(dateRange) {
            // Skip if dateRange is invalid
            if (!dateRange || !dateRange.includes(' - ')) {
                console.error('Invalid date range format:', dateRange);
                return;
            }
            
            const [startDateStr, endDateStr] = dateRange.split(' - ');
            
            // Parse start date (DD.MM.YYYY format)
            let startDate;
            try {
                const [startDay, startMonth, startYear] = startDateStr.split('.');
                startDate = new Date(startYear, startMonth - 1, startDay);
            } catch (e) {
                console.error('Error parsing start date:', startDateStr, e);
                return;
            }
            
            // Parse end date (DD.MM.YYYY format)
            let endDate;
            try {
                const [endDay, endMonth, endYear] = endDateStr.split('.');
                endDate = new Date(endYear, endMonth - 1, endDay);
            } catch (e) {
                console.error('Error parsing end date:', endDateStr, e);
                return;
            }
            
            // Add all dates in range (inclusive)
            const tempDate = new Date(startDate);
            while (tempDate <= endDate) {
                // Only add the date if it's not already in the array
                const dateExists = allBookedDates.some(d => 
                    d.getDate() === tempDate.getDate() && 
                    d.getMonth() === tempDate.getMonth() && 
                    d.getFullYear() === tempDate.getFullYear()
                );
                
                if (!dateExists) {
                    allBookedDates.push(new Date(tempDate));
                }
                
                // Move to next day
                tempDate.setDate(tempDate.getDate() + 1);
            }
        });
        
        return allBookedDates;
    }
    
    /**
     * Fallback calendar implementation that doesn't rely on AirDatepicker
     * @param {Array} processedDates - Array of JavaScript Date objects 
     */
    function initializeFallbackCalendar(processedDates) {
        console.log('Initializing fallback calendar system');
        
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
        
        // Add navigation controls
        addCalendarNavigation(container);
        
        // Add calendar legend
        addCalendarLegend(container);
        
        // Add selection tracking
        setupDateSelection();
        
        console.log('Fallback calendar initialized successfully');
    }
    
    /**
     * Generate month calendar for the fallback system
     */
    function generateMonthCalendar(container, month, year, disabledDates) {
        // Clear existing calendar
        container.find('.fallback-calendar').remove();
        
        // Store current view state
        window.currentCalendarMonth = month;
        window.currentCalendarYear = year;
        
        // Month names in Hebrew
        const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        
        // Day names in Hebrew (starting from Sunday)
        const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        
        // Create calendar container
        const calendarHtml = $('<div class="fallback-calendar"></div>');
        
        // Add header with month and year
        calendarHtml.append(`<div class="calendar-header">
            <span class="month-year">${monthNames[month]} ${year}</span>
        </div>`);
        
        // Add days of week header
        let daysHeader = '<div class="calendar-days-header">';
        for (let i = 0; i < 7; i++) {
            daysHeader += `<div class="day-name">${dayNames[i]}</div>`;
        }
        daysHeader += '</div>';
        calendarHtml.append(daysHeader);
        
        // Calculate first day of month
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay(); // 0 = Sunday
        
        // Get number of days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Create days grid
        let daysGrid = '<div class="calendar-days-grid">';
        
        // Add empty cells for days before start of month
        for (let i = 0; i < startingDay; i++) {
            daysGrid += '<div class="day-cell empty"></div>';
        }
        
        // Add days of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            
            let classes = 'day-cell';
            let isSelectable = true;
            
            // Past dates are disabled
            if (currentDate < today) {
                classes += ' disabled past-date';
                isSelectable = false;
            }
            
            // Saturday (6) is Shabbat - disabled
            if (dayOfWeek === 6) {
                classes += ' disabled shabbat';
                isSelectable = false;
            }
            
            // Reserved dates are disabled
            if (disabledDates.includes(dateString)) {
                classes += ' disabled reserved';
                isSelectable = false;
            }
            
            // Today's date gets special styling
            if (currentDate.getTime() === today.getTime()) {
                classes += ' today';
            }
            
            // Selected dates get special styling
            if (window.selectedDates && window.selectedDates.includes(dateString)) {
                classes += ' selected';
            }
            
            // Add the day cell with appropriate classes and data attributes
            daysGrid += `<div class="${classes}" 
                data-date="${dateString}" 
                data-selectable="${isSelectable}">${day}</div>`;
        }
        
        // Add empty cells for days after end of month to complete the grid
        const lastDay = new Date(year, month, daysInMonth).getDay();
        const remainingCells = 6 - lastDay;
        for (let i = 0; i < remainingCells; i++) {
            daysGrid += '<div class="day-cell empty"></div>';
        }
        
        daysGrid += '</div>';
        calendarHtml.append(daysGrid);
        
        // Add confirm button
        calendarHtml.append('<button id="confirm-dates" class="confirm-dates-btn" style="display:none;">אישור בחירת תאריכים</button>');
        
        // Add calendar to container
        container.append(calendarHtml);
        
        // Update the selected range display
        updateSelectedRangeDisplay();
    }
    
    /**
     * Add navigation controls for the fallback calendar
     */
    function addCalendarNavigation(container) {
        // Add navigation buttons
        const navHtml = `
        <div class="calendar-navigation">
            <button class="prev-month" title="חודש קודם">
                <svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>
            </button>
            <button class="next-month" title="חודש הבא">
                <svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>
            </button>
        </div>
        `;
        
        // Add navigation to container
        container.before(navHtml);
        
        // Add click handlers for navigation buttons
        container.prev('.calendar-navigation').on('click', '.prev-month', function() {
            let newMonth = window.currentCalendarMonth - 1;
            let newYear = window.currentCalendarYear;
            
            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            }
            
            generateMonthCalendar(container, newMonth, newYear, window.formattedDates);
        });
        
        container.prev('.calendar-navigation').on('click', '.next-month', function() {
            let newMonth = window.currentCalendarMonth + 1;
            let newYear = window.currentCalendarYear;
            
            if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }
            
            generateMonthCalendar(container, newMonth, newYear, window.formattedDates);
        });
    }
    
    /**
     * Add calendar legend for the fallback system
     */
    function addCalendarLegend(container) {
        // Remove any existing legend
        $('.calendar-legend').remove();
        
        // Create legend
        const legendHtml = `
        <div class="calendar-legend">
            <div class="legend-item"><span class="legend-box available"></span> תאריכים פנויים</div>
            <div class="legend-item"><span class="legend-box reserved"></span> תאריכים תפוסים</div>
            <div class="legend-item"><span class="legend-box weekend"></span> שבת - סגור</div>
        </div>
        `;
        
        // Add legend after calendar
        container.after(legendHtml);
    }
    
    /**
     * Setup date selection for the fallback system
     */
    function setupDateSelection() {
        // Initialize selected dates array if it doesn't exist
        if (!window.selectedDates) {
            window.selectedDates = [];
        }
        
        // Add click handler for date cells
        $(document).on('click', '.day-cell', function() {
            // Skip if not selectable
            if ($(this).attr('data-selectable') !== 'true') {
                return;
            }
            
            const dateString = $(this).data('date');
            
            // If no dates selected or already have 2+ dates, start fresh
            if (!window.selectedDates.length || window.selectedDates.length >= 2) {
                window.selectedDates = [dateString];
                $('.day-cell').removeClass('selected in-range');
                $(this).addClass('selected');
            } else {
                // We have exactly one date selected, select the second
                const firstDate = new Date(window.selectedDates[0]);
                const secondDate = new Date(dateString);
                
                // Always put dates in chronological order
                if (firstDate > secondDate) {
                    window.selectedDates = [dateString, window.selectedDates[0]];
                } else {
                    window.selectedDates.push(dateString);
                }
                
                // Mark the selected date
                $(this).addClass('selected');
                
                // Mark dates in the range
                markDatesInRange();
            }
            
            // Update the display and controls
            updateSelectedRangeDisplay();
            
            // Show confirm button if we have a range
            if (window.selectedDates.length === 2) {
                $('#confirm-dates').show();
            } else {
                $('#confirm-dates').hide();
            }
        });
        
        // Add confirm button handler
        $(document).on('click', '#confirm-dates', function() {
            if (window.selectedDates.length !== 2) {
                return;
            }
            
            // Calculate days between
            const startDate = new Date(window.selectedDates[0]);
            const endDate = new Date(window.selectedDates[1]);
            const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            // Check for max duration
            if (daysDiff > 7) {
                $('#max-duration-message').show();
                setTimeout(() => $('#max-duration-message').hide(), 3000);
                return;
            }
            
            // Format dates for display
            const startFormatted = startDate.toLocaleDateString('he-IL');
            const endFormatted = endDate.toLocaleDateString('he-IL');
            
            // Update hidden field with date range
            if ($('#rental_date').length === 0) {
                $('form.cart').append('<input type="hidden" id="rental_date" name="rental_date" value="' + startFormatted + ' - ' + endFormatted + '">');
            } else {
                $('#rental_date').val(startFormatted + ' - ' + endFormatted);
            }
            
            // Update validation message
            $('#date-validation-message')
                .removeClass('error')
                .addClass('success')
                .text('התאריכים אושרו בהצלחה: ' + startFormatted + ' - ' + endFormatted)
                .show();
            
            // Enable add to cart button
            $('.single_add_to_cart_button').prop('disabled', false).removeAttr('disabled');
            
            // Scroll to add to cart button
            $('html, body').animate({
                scrollTop: $('.single_add_to_cart_button').offset().top - 100
            }, 500);
        });
    }
    
    /**
     * Mark all dates in the selected range
     */
    function markDatesInRange() {
        if (window.selectedDates.length !== 2) {
            return;
        }
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Clear previous in-range markings
        $('.day-cell').removeClass('in-range');
        
        // Mark all dates in the range
        $('.day-cell').each(function() {
            const cellDate = $(this).data('date');
            if (!cellDate) return;
            
            const date = new Date(cellDate);
            if (date > startDate && date < endDate) {
                $(this).addClass('in-range');
            }
        });
    }
    
    /**
     * Update the display of selected date range
     */
    function updateSelectedRangeDisplay() {
        // Clear any existing messages
        $('#date-validation-message').hide();
        
        if (!window.selectedDates || !window.selectedDates.length) {
            return;
        }
        
        if (window.selectedDates.length === 1) {
            // Format start date
            const startDate = new Date(window.selectedDates[0]);
            const startFormatted = startDate.toLocaleDateString('he-IL');
            
            // Show single date message
            $('#date-validation-message')
                .removeClass('error')
                .addClass('success')
                .text('תאריך התחלה: ' + startFormatted + ' (בחר תאריך סיום)')
                .show();
        } else if (window.selectedDates.length === 2) {
            // Format dates
            const startDate = new Date(window.selectedDates[0]);
            const endDate = new Date(window.selectedDates[1]);
            const startFormatted = startDate.toLocaleDateString('he-IL');
            const endFormatted = endDate.toLocaleDateString('he-IL');
            
            // Calculate days between
            const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            // Show range message
            $('#date-validation-message')
                .removeClass('error')
                .addClass('success')
                .text('טווח תאריכים: ' + startFormatted + ' - ' + endFormatted + ' (' + daysDiff + ' ימים)')
                .show();
                
            // Check for exceeding max duration
            if (daysDiff > 7) {
                $('#max-duration-message').show();
            } else {
                $('#max-duration-message').hide();
            }
        }
    }
    
    /**
     * Update the datepicker with booked dates
     * @param {Array} processedDates - Array of JavaScript Date objects
     */
    function updateDatepicker(processedDates) {
        // If using AirDatepicker
        if (typeof AirDatepicker !== 'undefined') {
            // Format dates for AirDatepicker and ensure there are no null values
            // Add additional check to ensure each date is valid before formatting
            const formattedDates = processedDates
                .filter(date => date instanceof Date && !isNaN(date.getTime()))
                .map(date => {
                    try {
                        return date.toISOString().split('T')[0];
                    } catch (e) {
                        console.error('Error formatting date:', date, e);
                        return null;
                    }
                })
                .filter(date => date !== null);
            
            // Store in global variable for easy access by other functions
            window.formattedDates = formattedDates;
            
            console.log('Formatted dates ready for datepicker:', formattedDates);
            
            // Log the reserved dates more visibly
            console.log('%c Reserved Dates for Calendar:', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
            console.table(formattedDates.map(date => {
                const d = new Date(date);
                return {
                    'Date (ISO)': date,
                    'Date (Formatted)': d.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'}),
                    'Day of Week': ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][d.getDay()]
                };
            }));
            console.log('Total reserved dates:', formattedDates.length);
            
            // First, check if there's an existing datepicker instance and destroy it
            if (window.rentalDatepicker) {
                window.rentalDatepicker.destroy();
                window.rentalDatepicker = null;
                console.log("Previous datepicker instance destroyed");
            }
            
            // Create date picker container and validation messages
            if ($('#datepicker-container').length === 0) {
                $product_container.before('<div id="datepicker-container"></div>');
                $('#datepicker-container').after('<div id="date-validation-message" class="validation-message"></div>');
                $product_container.before('<div id="max-duration-message" class="validation-message error" style="display:none;">שימו לב: לא ניתן להזמין לתקופה העולה על 7 ימים</div>');
            }
            
            // Find the datepicker container, try multiple selectors to ensure we find it
            let container = $('.rental-form-section #datepicker-container');
            
            // If not found in the rental section, look for it anywhere on the page
            if (!container.length) {
                container = $('#datepicker-container');
            }
            
            console.log('Datepicker container found:', container.length > 0);
            
            // Only proceed if we have a valid container
            if (container.length) {
                // Clear any existing content to avoid duplication
                container.empty();
                
                try {
                    // Safe check for datepicker library
                    if (typeof AirDatepicker !== 'function') {
                        throw new Error('AirDatepicker library not available');
                    }
                    
                    // Safe check for formattedDates
                    if (!Array.isArray(formattedDates)) {
                        console.error('formattedDates is not an array:', formattedDates);
                        formattedDates = [];
                    }
                    
                    // Safe check for container
                    if (!container || !container.length || !container[0]) {
                        throw new Error('Invalid container for AirDatepicker');
                    }
                    
                    // Try creating the datepicker
                    window.rentalDatepicker = new AirDatepicker(container[0], {
                        inline: true,
                        minDate: new Date(),
                        range: true, // Enable date range selection
                        multipleDates: true, // Allow selecting multiple dates
                        multipleDatesSeparator: ' - ', // Format separator for date range
                        // Important - disable weekend detection to stop Sunday from being auto-marked as disabled
                        weekends: [6], // Only mark Saturdays as weekends (default is [0,6] which includes Sunday)
                        
                        // Fix the month navigation arrows direction for RTL
                        prevHtml: '<svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>',
                        nextHtml: '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>',
                        locale: {
                            days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                            daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                            daysMin: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"],
                            months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                            monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                            today: 'היום',
                            clear: 'נקה',
                            dateFormat: 'dd.MM.yyyy',
                            timeFormat: 'HH:mm',
                            firstDay: 0 // Start with Sunday
                        },
                        onRenderCell(params) {
                            try {
                                // Add extra safeguards to prevent null property access
                                if (!params) return {};
                                
                                const { date, cellType } = params;
                                
                                // Only apply to day cells and ensure date is valid
                                if (cellType !== 'day' || !date || !(date instanceof Date) || isNaN(date.getTime())) {
                                    return {};
                                }
                                
                                // Safely create date string
                                let dateString;
                                try {
                                    dateString = date.toISOString().split('T')[0];
                                } catch (e) {
                                    console.error('Error in onRenderCell:', e);
                                    return {};
                                }
                                
                                const dayOfWeek = date.getDay();
                                
                                // Sunday (0) special styling but MUST be enabled
                                if (dayOfWeek === 0) {
                                    return {
                                        disabled: false, // FORCE ENABLE
                                        classes: 'sunday-date'
                                    };
                                }
                                
                                // If the date is in our reserved dates list
                                if (formattedDates.includes(dateString)) {
                                    return {
                                        disabled: true,
                                        classes: 'reserved-date'
                                    };
                                }
                                
                                // Saturday (6) is Shabbat - mark as gray and disabled
                                if (dayOfWeek === 6) {
                                    return {
                                        disabled: true,
                                        classes: 'shabbat-date'
                                    };
                                }
                                
                                // All other dates are enabled by default
                                return {};
                            } catch (error) {
                                console.error('Error in onRenderCell:', error);
                                return {}; // Fallback to default cell rendering
                            }
                        },
                        // Maximum allowed rental days
                        maxDate: null,
                        
                        // This runs before dates are selected
                        onBeforeSelect({ date, datepicker }) {
                            // If this is just the first date in the range, allow it
                            if (!datepicker.selectedDates.length || datepicker.selectedDates.length === 1 && datepicker.selectedDates[0].getTime() === date.getTime()) {
                                return true;
                            }
                            
                            // We have a range selection
                            if (datepicker.selectedDates.length === 1) {
                                const startDate = datepicker.selectedDates[0];
                                const endDate = date;
                                
                                // Check if we're within 7 days limit
                                const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                                if (Math.abs(daysDiff) > 7) {
                                    // Show message about exceeding max days
                                    $('#max-duration-message').show();
                                    setTimeout(() => $('#max-duration-message').hide(), 3000);
                                    return false; // Prevent selection
                                }
                                
                                // We're selecting a range - check if there are any reserved dates in between
                                let hasReservedDates = false;
                                const dateRange = [];
                                
                                // Create array of all dates in the range
                                const tempDate = new Date(startDate);
                                while (tempDate <= endDate) {
                                    dateRange.push(new Date(tempDate));
                                    tempDate.setDate(tempDate.getDate() + 1);
                                }
                                
                                // Check each date in the range against reserved dates
                                dateRange.forEach(d => {
                                    const dateString = d.toISOString().split('T')[0];
                                    if (formattedDates.includes(dateString)) {
                                        hasReservedDates = true;
                                    }
                                });
                                
                                if (hasReservedDates) {
                                    $('#date-validation-message')
                                        .removeClass('error success')
                                        .addClass('error')
                                        .text('שגיאה: טווח התאריכים כולל ימים מוזמנים')
                                        .show();
                                    setTimeout(() => $('#date-validation-message').hide(), 3000);
                                    return false; // Prevent selection
                                }
                            }
                            
                            return true; // Allow selection
                        },
                        
                        onSelect: function({date, formattedDate, datepicker}) {
                            // Clear any previous messages
                            $('#date-validation-message').removeClass('error success').empty();
                            $('#max-duration-message').hide();
                            // Handle range selection
                            let dateValue = formattedDate;
                            
                            // Update hidden field for the date range
                            if ($('#rental_date').length === 0) {
                                $('form.cart').append('<input type="hidden" id="rental_date" name="rental_date" value="' + dateValue + '">');
                            } else {
                                $('#rental_date').val(dateValue);
                            }
                            
                            console.log('Selected date range:', dateValue);
                            
                            // Hide the error message if it's showing
                            if ($('#date-validation-message').hasClass('error')) {
                                $('#date-validation-message').hide();
                            }
                            
                            // Show success validation message
                            if (Array.isArray(date) && date.length > 1) {
                                // Format dates for display
                                const startDate = date[0].toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
                                const endDate = date[1].toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
                                
                                $('#date-validation-message')
                                    .removeClass('error')
                                    .addClass('success')
                                    .text('טווח תאריכים נבחר: ' + startDate + ' - ' + endDate)
                                    .show();
                                
                                // Only show confirm button if we have a valid range
                                $('#confirm-dates').show();
                                
                                // This will get enabled when the confirm button is clicked
                                $('.single_add_to_cart_button').prop('disabled', true);
                            } else {
                                $('#date-validation-message')
                                    .removeClass('error')
                                    .addClass('success')
                                    .text('תאריך נבחר: ' + formattedDate)
                                    .show();
                                    
                                // Hide confirm button until we have 2 dates
                                $('#confirm-dates').hide();
                            }
                        }
                    });
                    
                    // Remove any duplicate helper text and legends
                    $('.datepicker-help, .calendar-legend').remove();
                    
                    // Add calendar legend
                    const legendHTML = `
                    <div class="calendar-legend">
                        <div class="calendar-legend-title">מקרא תאריכים:</div>
                        <div class="legend-item">
                            <span class="legend-color available"></span>
                            <span>זמין להזמנה</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color sunday"></span>
                            <span>יום ראשון - זמין להזמנה</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color reserved"></span>
                            <span>תפוס</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color shabbat"></span>
                            <span>שבת - סגור</span>
                        </div>
                    </div>
                    `;
                    
                    // Add the legend after the datepicker
                    container.after(legendHTML);
                    
                    // Create confirm button
                    if ($('#confirm-dates').length === 0) {
                        $('#datepicker-container').after('<button id="confirm-dates" class="legend-button" style="display:none;">אישור בחירת תאריכים</button>');
                    }
                    
                    // Add click handler for confirmation button
                    $(document).on('click', '#confirm-dates', function() {
                        // Get the selected dates
                        const selectedDates = window.rentalDatepicker.selectedDates;
                        
                        // Verify we have a valid date range
                        if (selectedDates.length === 2) {
                            // Calculate the duration in days
                            const startDate = selectedDates[0];
                            const endDate = selectedDates[1];
                            const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                            
                            // Check for max duration one more time
                            if (duration > 7) {
                                $('#max-duration-message').show();
                                setTimeout(() => $('#max-duration-message').hide(), 3000);
                                return false;
                            }
                            
                            // Enable the Add to Cart button
                            $('.single_add_to_cart_button').prop('disabled', false).removeAttr('disabled');
                            
                            // Update validation message
                            $('#date-validation-message')
                                .removeClass('error')
                                .addClass('success')
                                .text('התאריכים אושרו בהצלחה!')
                                .show();
                            
                            // Scroll to the add to cart button for better UX
                            $('html, body').animate({
                                scrollTop: $('.single_add_to_cart_button').offset().top - 100
                            }, 500);
                        }
                        
                        return false; // Prevent default behavior
                    });
                    
                    // Initially HIDE the validation message until dates are selected
                    $('#date-validation-message').hide();
                    
                    // ALSO add a direct init script to run when page loads
                    // to ensure buttons are enabled if dates are already selected
                    setTimeout(function() {
                        if ($('#rental_date').val()) {
                            // Direct DOM manipulation for buttons
                            $('.single_add_to_cart_button').prop('disabled', false);
                            $('.single_add_to_cart_button').removeAttr('disabled');
                            
                            // Also try with direct JavaScript
                            document.querySelectorAll('.single_add_to_cart_button').forEach(function(button) {
                                button.disabled = false;
                                button.removeAttribute('disabled');
                            });
                        } else {
                            // Hide the validation message if no dates selected
                            $('#date-validation-message').hide();
                        }
                    }, 500);
                    
                    // Add some helper text if it doesn't exist
                    if ($('.datepicker-help').length === 0) {
                        $('.calendar-legend').before('<p class="datepicker-help">תאריכים מושבתים (אדומים/אפורים) אינם זמינים להשכרה</p>');
                    }
                    
                    console.log("Datepicker initialized with reserved dates:", formattedDates);
                    
                    // Apply special class to reserved dates for better visibility
                    if (formattedDates && formattedDates.length) {
                        // Force update reserved dates styling
                        setTimeout(function() {
                            $('.air-datepicker-cell').each(function() {
                                const cellDate = $(this).data('date');
                                const cellMonth = $(this).data('month');
                                const cellYear = $(this).data('year');
                                
                                if (cellDate && cellMonth !== undefined && cellYear) {
                                    // Create ISO date string (YYYY-MM-DD)
                                    const dateStr = `${cellYear}-${String(cellMonth+1).padStart(2, '0')}-${String(cellDate).padStart(2, '0')}`;
                                    
                                    // Check if this date is in the reserved dates list
                                    if (formattedDates.includes(dateStr)) {
                                        $(this).addClass('reserved-date');
                                        console.log('Reserved date styled:', dateStr);
                                    }
                                }
                            });
                        }, 500);
                    }
                } catch (error) {
                    // console.error("Error initializing AirDatepicker:", error);
                    
                    // Create a fallback if AirDatepicker fails
                    container.html('<div class="datepicker-error" style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">יש בעיה בהצגת לוח השנה. נא לרענן את העמוד.</div>');
                    
                    // Add reload button
                    container.append('<button class="reload-page-btn" style="margin-top: 10px; padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">רענן עמוד</button>');
                    
                    // Add click handler for the reload button
                    $(document).on('click', '.reload-page-btn', function() {
                        window.location.reload();
                    });
                    
                    // Try to use fallback calendar if available
                    if (typeof window.initializeFallbackCalendar === 'function') {
                        console.log('Attempting to use fallback calendar');
                        window.initializeFallbackCalendar(window.processedBookedDates || []);
                    }
                }
            }
        } else {
            console.log('%c Calendar system ready with disabled dates:', 'background: #E8F5E9; color: #2E7D32; padding: 5px; border-radius: 3px;', formattedDates);
        }
        
        console.log('%c Calendar system ready with disabled dates:', 'background: #E8F5E9; color: #2E7D32; padding: 5px; border-radius: 3px;', formattedDates);
    }
    
    /**
     * Set up a refresh button to reload the dates
     */
    function setupRefreshButton() {
        // Add refresh button if it doesn't exist
        if ($('.refresh-rental-dates').length === 0) {
            $('.woocommerce-product-gallery').after(
                '<button class="refresh-rental-dates button">רענן תאריכי הזמנה</button>'
            );
        }
        
        // Add click handler
        $(document).on('click', '.refresh-rental-dates', function(e) {
            e.preventDefault();
            let ajaxUrl = window.mitnafunFrontend ? window.mitnafunFrontend.ajaxUrl : '';
            let productId = window.mitnafunFrontend ? Number(window.mitnafunFrontend.productId) : 0;
            refreshRentalDates(productId, ajaxUrl);
        });
    }
    
    /**
     * Refresh rental dates via AJAX
     * @param {number} productId - The product ID to get dates for
     * @param {string} ajaxUrl - WordPress AJAX URL
     */
    function refreshRentalDates(productId, ajaxUrl) {
        if (!productId || !ajaxUrl) {
            console.error("Missing product ID or AJAX URL");
            return;
        }
        
        // Show loading indicator
        if ($('.refresh-rental-dates').length > 0) {
            $('.refresh-rental-dates').text('מרענן...').prop('disabled', true);
        } else {
            $('.woocommerce-product-gallery').after(
                '<button class="refresh-rental-dates button" disabled>מרענן...</button>'
            );
        }
        
        // Make AJAX request
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'get_reserved_dates',
                product_id: productId
            },
            success: function(response) {
                console.log(`[RentalDates] AJAX context - requested: ${productId}, response.data.product_id: ${response.data.product_id}, frontend.productId: ${window.mitnafunFrontend.productId}`);
                console.log('[RentalDates] AJAX response data:', response);
                if (response.data && response.data.debug_info) {
                    console.log('[RentalDates] debug_info:', response.data.debug_info);
                }
                if (response.success && response.data) {
                    // Enhanced logging of the reserved dates
                    console.log('%c Refreshed Reserved Dates:', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
                    console.table(response.data.reserved_dates);
                    console.log('Total reserved dates:', response.data.reserved_dates.length);
                    
                    // Update global variables
                    window.bookedDates = response.data.reserved_dates;
                    window.product_id = productId;
                    
                    // Process new dates
                    const processedDates = processBookedDates(response.data.reserved_dates);
                    window.processedBookedDates = processedDates;
                    
                    // Log the processed dates
                    console.log('%c Processed Individual Dates:', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
                    console.log('Total individual dates:', processedDates.length);
                    
                    // Update datepicker
                    updateDatepicker(processedDates);
                    
                    // Trigger custom event for datepicker update
                    $(document).trigger('datepicker:updated');
                    
                    // Reset button
                    $('.refresh-rental-dates').text('רענן תאריכי הזמנה').prop('disabled', false);
                } else {
                    console.error("Error refreshing dates:", response);
                    $('.refresh-rental-dates').text('שגיאה בטעינה').prop('disabled', false);
                    setTimeout(function() {
                        $('.refresh-rental-dates').text('רענן תאריכי הזמנה').prop('disabled', false);
                    }, 3000);
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX error:", error);
                $('.refresh-rental-dates').text('שגיאה בטעינה').prop('disabled', false);
                setTimeout(function() {
                    $('.refresh-rental-dates').text('רענן תאריכי הזמנה').prop('disabled', false);
                }, 3000);
            }
        });
    }
    
    // Log all reserved dates when page loads
    function logReservedDates() {
        if (window.bookedDates && window.bookedDates.length > 0) {
            console.log('%c Reserved Date Ranges:', 'background: #ff9800; color: white; padding: 4px 8px; font-weight: bold; border-radius: 4px;');
            console.table(window.bookedDates);
            console.log('Total reserved date ranges:', window.bookedDates.length);
            
            if (window.processedBookedDates && window.processedBookedDates.length > 0) {
                console.log('%c Individual Reserved Dates:', 'background: #4CAF50; color: white; padding: 4px 8px; font-weight: bold; border-radius: 4px;');
                console.log('Total individual reserved dates:', window.processedBookedDates.length);
            }
        } else {
            console.log('No reserved dates found for this product');
        }
    }
    
    // Run on page load and after 1 second to ensure everything is loaded
    logReservedDates();
    setTimeout(logReservedDates, 1000);
    
    // Add a refresh function to ensure we have the most up-to-date data
    $(document).on('click', '.reload-dates', function(e) {
        e.preventDefault();
        if (window.mitnafunFrontend && window.mitnafunFrontend.ajaxUrl) {
            refreshRentalDates(Number(window.mitnafunFrontend.productId), window.mitnafunFrontend.ajaxUrl);
        }
        return false;
    });
    
    // Add a debug button if not present
    if ($('.reload-dates').length === 0) {
        $('.calendar-legend').after('<button class="reload-dates button">טען תאריכים מחדש</button>');
    }
    
    // Load safety check
    $(window).on('load', function() {
        if (typeof AirDatepicker === 'undefined') {
            console.error('AirDatepicker library not loaded');
            $('#datepicker-container').html('<div class="datepicker-error" style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">יש בעיה בטעינת לוח השנה. נא לרענן את העמוד.</div>');
        }
    });
});

/**
 * Process the formatted booked dates and prepare them for display
 */
function processDatesForDisplay() {
    // Create booked dates from disabled dates (already formatted to ISO)
    const formattedDates = window.disabledDates.map(function(date) {
        // If date is already a Date object, convert to ISO
        if (date instanceof Date) {
            return formatDateISO(date);
        }
        // If already in ISO format, return as is
        return date;
    });
    
    console.log("Formatted dates ready for datepicker:", formattedDates);
    
    // Create a nice table for display in console
    console.log(" Reserved Dates for Calendar:");
    const dateDetails = [];
    formattedDates.forEach(function(date) {
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            const dayOfWeek = getDayOfWeekHebrew(dateObj.getDay());
            const formattedDate = formatDateForDisplay(dateObj);
            
            dateDetails.push({
                "Date (ISO)": date,
                "Date (Formatted)": formattedDate,
                "Day of Week": dayOfWeek
            });
        } catch (e) {
            console.error("Error processing date for display:", date, e);
        }
    });
    
    console.table(dateDetails);
    console.log("Total reserved dates:", formattedDates.length);
    
    // Remove duplicates
    const uniqueDates = [...new Set(formattedDates)];
    
    // Remove dates from reserved list that are already past (optional, for cleaner UI)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = formatDateISO(today);
    
    // Debug info
    console.log("Today's date:", todayISO);
    
    // Store actual disabled dates for use with datepicker
    window.disabledDates = uniqueDates;
    
    return uniqueDates;
}

/**
 * Initialize the datepicker
 */
function initializeDatepicker() {
    // Find the datepicker container element
    const container = $('#datepicker-container');
    const isContainerFound = container.length > 0;
    
    console.log("Datepicker container found:", isContainerFound);
    
    // Return early if there's no container
    if (!isContainerFound) return;
    
    console.log("Creating datepicker with container:", container[0]);
    console.log("Using reserved dates:", window.disabledDates);
    
    try {
        // Safe check for datepicker library
        if (typeof AirDatepicker !== 'function') {
            throw new Error('AirDatepicker library not available');
        }
        
        // Safe check for formattedDates
        if (!Array.isArray(formattedDates)) {
            console.error('formattedDates is not an array:', formattedDates);
            formattedDates = [];
        }
        
        // Safe check for container
        if (!container || !container.length || !container[0]) {
            throw new Error('Invalid container for AirDatepicker');
        }
        
        // Try creating the datepicker
        window.rentalDatepicker = new AirDatepicker(container[0], {
            inline: true,
            minDate: new Date(),
            range: true, // Enable date range selection
            multipleDates: true, // Allow selecting multiple dates
            multipleDatesSeparator: ' - ', // Format separator for date range
            // Important - disable weekend detection to stop Sunday from being auto-marked as disabled
            weekends: [6], // Only mark Saturdays as weekends (default is [0,6] which includes Sunday)
            
            // Fix the month navigation arrows direction for RTL
            prevHtml: '<svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>',
            nextHtml: '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>',
            locale: {
                days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
                daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                daysMin: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"],
                months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
                monthsShort: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                today: 'היום',
                clear: 'נקה',
                dateFormat: 'dd.MM.yyyy',
                timeFormat: 'HH:mm',
                firstDay: 0 // Start with Sunday
            },
            onRenderCell(params) {
                try {
                    // Add extra safeguards to prevent null property access
                    if (!params) return {};
                    
                    const { date, cellType } = params;
                    
                    // Only apply to day cells and ensure date is valid
                    if (cellType !== 'day' || !date || !(date instanceof Date) || isNaN(date.getTime())) {
                        return {};
                    }
                    
                    // Safely create date string
                    let dateString;
                    try {
                        dateString = date.toISOString().split('T')[0];
                    } catch (e) {
                        console.error('Error in onRenderCell:', e);
                        return {};
                    }
                    
                    const dayOfWeek = date.getDay();
                    
                    // Sunday (0) special styling but MUST be enabled
                    if (dayOfWeek === 0) {
                        return {
                            disabled: false, // FORCE ENABLE
                            classes: 'sunday-date'
                        };
                    }
                    
                    // If the date is in our reserved dates list
                    if (window.disabledDates.includes(dateString)) {
                        return {
                            disabled: true,
                            classes: 'reserved-date'
                        };
                    }
                    
                    // Saturday (6) is Shabbat - mark as gray and disabled
                    if (dayOfWeek === 6) {
                        return {
                            disabled: true,
                            classes: 'shabbat-date'
                        };
                    }
                    
                    // All other dates are enabled by default
                    return {};
                } catch (error) {
                    console.error('Error in onRenderCell:', error);
                    return {}; // Fallback to default cell rendering
                }
            },
            // Maximum allowed rental days
            maxDate: null,
            
            // This runs before dates are selected
            onBeforeSelect({ date, datepicker }) {
                // If this is just the first date in the range, allow it
                if (!datepicker.selectedDates.length || datepicker.selectedDates.length === 1 && datepicker.selectedDates[0].getTime() === date.getTime()) {
                    return true;
                }
                
                // We have a range selection
                if (datepicker.selectedDates.length === 1) {
                    const startDate = datepicker.selectedDates[0];
                    const endDate = date;
                    
                    // Check if we're within 7 days limit
                    const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                    if (Math.abs(daysDiff) > 7) {
                        // Show message about exceeding max days
                        $('#max-duration-message').show();
                        setTimeout(() => $('#max-duration-message').hide(), 3000);
                        return false; // Prevent selection
                    }
                    
                    // We're selecting a range - check if there are any reserved dates in between
                    let hasReservedDates = false;
                    const dateRange = [];
                    
                    // Create array of all dates in the range
                    const tempDate = new Date(startDate);
                    while (tempDate <= endDate) {
                        dateRange.push(new Date(tempDate));
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                    
                    // Check each date in the range against reserved dates
                    dateRange.forEach(d => {
                        const dateString = d.toISOString().split('T')[0];
                        if (window.disabledDates.includes(dateString)) {
                            hasReservedDates = true;
                        }
                    });
                    
                    if (hasReservedDates) {
                        $('#date-validation-message')
                            .removeClass('error success')
                            .addClass('error')
                            .text('שגיאה: טווח התאריכים כולל ימים מוזמנים')
                            .show();
                        setTimeout(() => $('#date-validation-message').hide(), 3000);
                        return false; // Prevent selection
                    }
                }
                
                return true; // Allow selection
            },
            
            onSelect: function({date, formattedDate, datepicker}) {
                // Clear any previous messages
                $('#date-validation-message').removeClass('error success').empty();
                $('#max-duration-message').hide();
                // Handle range selection
                let dateValue = formattedDate;
                
                // Update hidden field for the date range
                if ($('#rental_date').length === 0) {
                    $('form.cart').append('<input type="hidden" id="rental_date" name="rental_date" value="' + dateValue + '">');
                } else {
                    $('#rental_date').val(dateValue);
                }
                
                console.log('Selected date range:', dateValue);
                
                // Hide the error message if it's showing
                if ($('#date-validation-message').hasClass('error')) {
                    $('#date-validation-message').hide();
                }
                
                // Show success validation message
                if (Array.isArray(date) && date.length > 1) {
                    // Format dates for display
                    const startDate = date[0].toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
                    const endDate = date[1].toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
                    
                    $('#date-validation-message')
                        .removeClass('error')
                        .addClass('success')
                        .text('טווח תאריכים נבחר: ' + startDate + ' - ' + endDate)
                        .show();
                    
                    // Only show confirm button if we have a valid range
                    $('#confirm-dates').show();
                    
                    // This will get enabled when the confirm button is clicked
                    $('.single_add_to_cart_button').prop('disabled', true);
                } else {
                    $('#date-validation-message')
                        .removeClass('error')
                        .addClass('success')
                        .text('תאריך נבחר: ' + formattedDate)
                        .show();
                        
                    // Hide confirm button until we have 2 dates
                    $('#confirm-dates').hide();
                }
            }
        });
        
        // Add calendar legend
        const legendHTML = `
        <div class="calendar-legend">
            <div class="calendar-legend-title">מקרא תאריכים:</div>
            <div class="legend-item">
                <span class="legend-color available"></span>
                <span>זמין להזמנה</span>
            </div>
            <div class="legend-item">
                <span class="legend-color sunday"></span>
                <span>יום ראשון - זמין להזמנה</span>
            </div>
            <div class="legend-item">
                <span class="legend-color reserved"></span>
                <span>תפוס</span>
            </div>
            <div class="legend-item">
                <span class="legend-color shabbat"></span>
                <span>שבת - סגור</span>
            </div>
        </div>
        `;
        
        // Add the legend after the datepicker
        container.after(legendHTML);
        
        // Create confirm button
        if ($('#confirm-dates').length === 0) {
            $('#datepicker-container').after('<button id="confirm-dates" class="legend-button" style="display:none;">אישור בחירת תאריכים</button>');
        }
        
        // Add click handler for confirmation button
        $(document).on('click', '#confirm-dates', function() {
            // Get the selected dates
            const selectedDates = window.rentalDatepicker.selectedDates;
            
            // Verify we have a valid date range
            if (selectedDates.length === 2) {
                // Calculate the duration in days
                const startDate = selectedDates[0];
                const endDate = selectedDates[1];
                const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                // Check for max duration one more time
                if (duration > 7) {
                    $('#max-duration-message').show();
                    setTimeout(() => $('#max-duration-message').hide(), 3000);
                    return false;
                }
                
                // Enable the Add to Cart button
                $('.single_add_to_cart_button').prop('disabled', false).removeAttr('disabled');
                
                // Update validation message
                $('#date-validation-message')
                    .removeClass('error')
                    .addClass('success')
                    .text('התאריכים אושרו בהצלחה!')
                    .show();
                
                // Scroll to the add to cart button for better UX
                $('html, body').animate({
                    scrollTop: $('.single_add_to_cart_button').offset().top - 100
                }, 500);
            }
            
            return false; // Prevent default behavior
        });
        
        // Initially HIDE the validation message until dates are selected
        $('#date-validation-message').hide();
        
        // ALSO add a direct init script to run when page loads
        // to ensure buttons are enabled if dates are already selected
        setTimeout(function() {
            if ($('#rental_date').val()) {
                // Direct DOM manipulation for buttons
                $('.single_add_to_cart_button').prop('disabled', false);
                $('.single_add_to_cart_button').removeAttr('disabled');
                
                // Also try with direct JavaScript
                document.querySelectorAll('.single_add_to_cart_button').forEach(function(button) {
                    button.disabled = false;
                    button.removeAttribute('disabled');
                });
            } else {
                // Hide the validation message if no dates selected
                $('#date-validation-message').hide();
            }
        }, 500);
        
        // Add some helper text if it doesn't exist
        if ($('.datepicker-help').length === 0) {
            $('.calendar-legend').before('<p class="datepicker-help">תאריכים מושבתים (אדומים/אפורים) אינם זמינים להשכרה</p>');
        }
        
        console.log("Datepicker initialized with reserved dates:", window.disabledDates);
    } catch(error) {
        console.error("Error initializing datepicker:", error);
        
        // Create a fallback if initialization fails
        container.html('<div class="datepicker-error" style="padding: 20px; background-color: #ffebee; border: 1px solid #c62828; color: #c62828; border-radius: 5px; text-align: center;">יש בעיה בהצגת לוח השנה. נא לרענן את העמוד.</div>');
        
        // Add reload button
        container.append('<button class="reload-page-btn" style="margin-top: 10px; padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">רענן עמוד</button>');
        
        // Add click handler for the reload button
        $(document).on('click', '.reload-page-btn', function() {
            window.location.reload();
        });
        
        // Try to use fallback calendar if available
        if (typeof window.initializeFallbackCalendar === 'function') {
            console.log('Attempting to use fallback calendar');
            window.initializeFallbackCalendar(window.processedBookedDates || []);
        }
    }
}
