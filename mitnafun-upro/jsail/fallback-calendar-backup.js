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
     * Calculate rental days excluding Saturdays
     */
    function calculateRentalDaysExcludingSaturdays(startDate, endDate) {
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        let days = 0;
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Don't count Saturdays (day 6)
            if (currentDate.getDay() !== 6) {
                days++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days;
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
    
    /**
     * Initialize the fallback calendar system
     */
    function initializeFallbackCalendar(processedDates) {
        console.log('Initializing fallback calendar system');
        
        // Get current date for disabling past days
        const today = new Date();
        const todayISO = formatDateISO(today);
        
        // Set up disabled dates
        // Check if processedDates is passed from rental-dates-handler
        if (processedDates) {
            console.log('Using already formatted dates from rental-dates-handler');
            window.disabledDates = [...processedDates];
        } else {
            // Process the raw disabled dates
            window.disabledDates = [];
            
            if (window.rawDisabledDates && window.rawDisabledDates.length) {
                console.log('Processing raw dates for calendar:', window.rawDisabledDates);
                window.rawDisabledDates.forEach(function(dateStr) {
                    window.disabledDates.push(dateStr);
                });
            }
        }
        
        // Disable all past days by adding them to the disabled dates array
        const tempDate = new Date(today.getTime());
        tempDate.setDate(1); // Start from the first day of current month
        
        while (tempDate < today) {
            const dateISO = formatDateISO(tempDate);
            if (!window.disabledDates.includes(dateISO)) {
                window.disabledDates.push(dateISO);
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        
        // Also disable today if it's past the cutoff time (already handled by last-minute-booking-check.js)
        // but we'll add it here just to be safe
        if (!window.disabledDates.includes(todayISO)) {
            console.log('Adding today to disabled dates:', todayISO);
            window.disabledDates.push(todayISO);
        }
        
        console.log('Using disabled dates:', window.disabledDates);
        
        // Set up the container for the calendar
        const container = $('#datepicker-container');
        console.log('Setting up fallback calendar in container:', container);
        
        if (!container.length) {
            console.error('Could not find calendar container #datepicker-container');
            return;
        }
        
        // Make sure we have CSS styles
        addCalendarStyles();
        
        // Generate the calendar for the current month
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-based (0 = January)
        const currentYear = now.getFullYear();
        
        // Generate calendar for current month (not previous month)
        console.log('Running generateMonthCalendar with month:', currentMonth, 'year:', currentYear);
        generateMonthCalendar(container, currentMonth, currentYear, window.disabledDates);
        
        // Set up date selection handlers
        setupDateSelectionHandlers();
        
        // Set up the pickup time field to always show 13:00
        setupPickupTimeField();
        
        // Initialize selection state if needed
        window.selectedDates = window.selectedDates || [];
        window.datesConfirmed = window.datesConfirmed || false;
        
        console.log('Fallback calendar initialized successfully');
        
        // Remove any existing confirm button on initialization
        $('#confirm-dates').hide().remove();
    }
    
    // Expose to window for external access
    window.initializeFallbackCalendar = initializeFallbackCalendar;
    
    /**
     * Generate month calendar for the fallback system
     */
    function generateMonthCalendar(container, month, year, disabledDates) {
        // Validate inputs to prevent NaN/undefined issues
        if (month === undefined || isNaN(month) || year === undefined || isNaN(year)) {
            console.error('Invalid month or year provided to generateMonthCalendar:', month, year);
            // Use current month/year as fallback
            const today = new Date();
            month = today.getMonth();
            year = today.getFullYear();
        }
        
        console.log('Running generateMonthCalendar with month:', month, 'year:', year);
        
        // Check if it's past the cutoff time (11 AM) for today's bookings
        const now = new Date();
        const currentHour = now.getHours();
        const isPastCutoff = currentHour >= 11;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If it's past cutoff, add today to disabled dates
        if (isPastCutoff) {
            const todayIso = formatDateISO(today);
            console.log('Past cutoff time, adding today to disabled dates:', todayIso);
            
            // Add today to disabled dates if not already there
            if (!disabledDates.includes(todayIso)) {
                disabledDates.push(todayIso);
            }
        }
        // Clear existing calendar
        container.find('.fallback-calendar').remove();
        
        // Make sure disabledDates is always an array
        if (!disabledDates || !Array.isArray(disabledDates)) {
            disabledDates = [];
        }
        
        // Use globally defined month names
        const hebrewMonthNames = window.hebrewMonths;
        
        // Day names in Hebrew (starting from Sunday)
        const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        
        // Create calendar container
        const calendarHtml = $('<div class="fallback-calendar"></div>');
        
        // Generate month header with Hebrew text
        const monthHeader = $('<div class="month-header"></div>');
        const monthYear = $('<div class="month-year"></div>').text(window.hebrewMonths[month] + ' ' + year);
        monthHeader.append(monthYear);
        
        // Add navigation buttons
        monthHeader.append(`
            <button id="prevMonthBtn" class="nav-btn">&lt;</button>
            <button id="nextMonthBtn" class="nav-btn">&gt;</button>
        `);
        
        // Add days of week header
        let daysHeader = '<div class="calendar-days-header">';
        for (let i = 0; i < 7; i++) {
            daysHeader += `<div class="day-name">${dayNames[i]}</div>`;
        }
        daysHeader += '</div>';
        
        // Add header to calendar
        calendarHtml.append(monthHeader);
        calendarHtml.append(daysHeader);
        
        // Calculate first day of month
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay(); // 0 = Sunday
        
        // Get number of days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Create days grid
        let daysGrid = '<div class="calendar-days">';
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < startingDay; i++) {
            daysGrid += '<div class="day-cell empty"></div>';
        }
        
        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateISO = formatDateISO(date);
            const dayOfWeek = date.getDay();
            
            let classes = 'day-cell';
            let selectableAttr = '';
            let dateAttr = ` data-date="${dateISO}"`;
            
            // Check if date is today
            if (date.toDateString() === new Date().toDateString()) {
                classes += ' today';
            }
            
            // Check if date is disabled
            if (disabledDates.includes(dateISO)) {
                classes += ' disabled';
                selectableAttr = ` data-selectable="false"`;
            } else {
                selectableAttr = ` data-selectable="true"`;
            }
            
            // Check if date is Saturday (weekend)
            if (dayOfWeek === 6) { // 6 = Saturday
                classes += ' weekend';
                selectableAttr = ` data-selectable="false"`;
            }
            
            // Check if date is in selected range
            if (window.selectedDates && window.selectedDates.length) {
                // If start date
                if (window.selectedDates[0] && dateISO === formatDateISO(new Date(window.selectedDates[0]))) {
                    classes += ' selected-start';
                }
                
                // If end date
                if (window.selectedDates[1] && dateISO === formatDateISO(new Date(window.selectedDates[1]))) {
                    classes += ' selected-end';
                }
                
                // If in selected range
                if (window.selectedDates[0] && window.selectedDates[1]) {
                    const selectedStart = new Date(window.selectedDates[0]);
                    const selectedEnd = new Date(window.selectedDates[1]);
                    
                    if (date > selectedStart && date < selectedEnd) {
                        classes += ' in-selected-range';
                    }
                }
            }
            
            // Add cell to grid
            daysGrid += `<div class="${classes}"${dateAttr}${selectableAttr}>${day}</div>`;
        }
        
        // Close days grid
        daysGrid += '</div>';
        
        // Add days grid to calendar
        calendarHtml.append(daysGrid);
        
        // Add legend
        let legend = '<div class="calendar-legend">';
        legend += '<div class="legend-item"><span class="legend-color available"></span> פנוי</div>';
        legend += '<div class="legend-item"><span class="legend-color disabled"></span> תפוס</div>';
        legend += '<div class="legend-item"><span class="legend-color weekend"></span> שבת (סגור)</div>';
        legend += '</div>';
        
        // Add legend to calendar
        calendarHtml.append(legend);
        
        // Add calendar to container
        container.html(calendarHtml);
        
        // Bind navigation events
        addCalendarNavigation(container);
        
        // Add data-selectable attribute to applicable dates
        $('.day-cell:not(.disabled):not(.weekend)').attr('data-selectable', 'true');
    }
    
    /**
     * Add navigation controls to the calendar
     */
    function addCalendarNavigation(container) {
        // Previous month button
        $('#prevMonthBtn').on('click', function() {
            let newMonth = window.currentCalendarMonth - 1;
            let newYear = window.currentCalendarYear;
            
            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            }
            
            // Prevent navigating to past months
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            // Don't allow navigating to past months
            if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
                console.log('Cannot navigate to past months');
                return; // Stop execution if trying to go to a past month
            }
            
            // Update month/year display text explicitly to avoid 'undefined undefined' issue
            $('.month-year').text(window.hebrewMonths[newMonth] + ' ' + newYear);
            
            window.currentCalendarMonth = newMonth;
            window.currentCalendarYear = newYear;
            
            // Clear any selections when changing months
            window.selectedDates = [];
            
            // Also clear any previous message or selection display
            $('.selected-date-range-message').html('');
            $('.day-cell').removeClass('selected selected-start selected-end in-range');
            
            // Reset selection status in UI
            updateSelectedRangeDisplay('', ''); // Clear any selection messages
            
            // Generate the updated calendar
            generateMonthCalendar($('#datepicker-container'), newMonth, newYear, window.disabledDates || []);
            
            // Update month and year display explicitly (with null check for safety)
            if (window.hebrewMonths && window.hebrewMonths[newMonth]) {
                $('.month-year').text(window.hebrewMonths[newMonth] + ' ' + newYear);
            } else {
                // Fallback if Hebrew month names aren't available
                $('.month-year').text((newMonth + 1) + '/' + newYear);
            }
        });
        
        // Next month button
        $('#nextMonthBtn').on('click', function() {
            let newMonth = window.currentCalendarMonth + 1;
            let newYear = window.currentCalendarYear;
            
            if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }
            
            window.currentCalendarMonth = newMonth;
            window.currentCalendarYear = newYear;
            
            // Clear any selections when changing months
            window.selectedDates = [];
            
            // Also clear any previous message or selection display
            $('.selected-date-range-message').html('');
            $('.day-cell').removeClass('selected selected-start selected-end in-range');
            
            // Reset selection status in UI
            updateSelectedRangeDisplay('', ''); // Clear any selection messages
            
            // Generate the updated calendar
            generateMonthCalendar($('#datepicker-container'), newMonth, newYear, window.disabledDates || []);
            
            // Update month and year display explicitly (with null check for safety)
            if (window.hebrewMonths && window.hebrewMonths[newMonth]) {
                $('.month-year').text(window.hebrewMonths[newMonth] + ' ' + newYear);
            } else {
                // Fallback if Hebrew month names aren't available
                $('.month-year').text((newMonth + 1) + '/' + newYear);
            }
        });
        
        // Return success from the setup function
        return true;
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
     * Check if a date range spans a weekend (only Saturday is weekend in Israel)
     * Used to show special weekend return notice
     */
    function bookingSpansWeekend(startDate, endDate) {
        // In Israel, only Saturday (day 6) is considered a weekend
        
        // If this is a single day booking, check if it's Friday
        // We still check Friday because rentals on Friday usually extend to Saturday
        if (startDate.getTime() === endDate.getTime()) {
            return startDate.getDay() === 5; // 5 = Friday
        }
        
        // Check each day in the range
        for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
            // If Saturday (6) is included in the booking
            if (day.getDay() === 6) {
                return true;
            }
        }
        
        // Special case: If rental spans from Friday to Sunday (over the weekend)
        if (startDate.getDay() === 5 && endDate.getDay() === 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Confirm the selected date range and process for checkout
     */
    // Auto-confirm selection when a valid range is picked
    function confirmSelectedDates() {
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            console.log('No valid date range selected');
            return;
        }
        if (!validateDateRange()) {
            return false;
        }
        window.datesConfirmed = true;
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        $('#rental_start').val(formatDateISO(startDate));
        $('#rental_end').val(formatDateISO(endDate));
        $('#return-conditions-notice').show();
    }

    function applyPerDayPricing() {
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
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Calculate rental days excluding Saturdays
        const rentalDays = calculateRentalDaysExcludingSaturdays(startDate, endDate);
        
        // First day is full price, additional days are 50% off
        let totalPrice = basePrice; // First day at full price
        
        if (rentalDays > 1) {
            // Additional days at 50% discount
            totalPrice += basePrice * 0.5 * (rentalDays - 1);
        }
        
        // Update price display if needed
        // This is handled server-side in most cases, but we can update a price preview here
    }

    /**
     * Helper function to update validation message
     */
    function updateValidationMessage(startFormatted, endFormatted, actualRentalDays) {
        $('#date-validation-message')
            .removeClass('error')
    function applyPerDayPricing() {
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
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Calculate rental days excluding Saturdays
        const rentalDays = calculateRentalDaysExcludingSaturdays(startDate, endDate);
        
        // First day is full price, additional days are 50% off
        let totalPrice = basePrice; // First day at full price
        
        if (rentalDays > 1) {
            // Additional days at 50% discount
            totalPrice += basePrice * 0.5 * (rentalDays - 1);
        }
        
        // Update price display if needed
        // This is handled server-side in most cases, but we can update a price preview here
    }
    
    /**
     * Helper function to update validation message
     */
    function updateValidationMessage(startFormatted, endFormatted, actualRentalDays) {
        $('#date-validation-message')
            .removeClass('error')
            .addClass('success')
            .html('התאריכים אושרו בהצלחה: ' + startFormatted + ' - ' + endFormatted + 
                 ' (' + actualRentalDays + ' ימים לחיוב) ' +
                 '<a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[שנה בחירה]</a>')
            .show();
        
        // Enable add to cart button
        $('.single_add_to_cart_button').prop('disabled', false).removeAttr('disabled');
        
        // Store the confirmed dates in local storage as a backup
        try {
            localStorage.setItem('mitnafun_confirmed_dates', startFormatted + ' - ' + endFormatted);
            localStorage.setItem('mitnafun_rental_days', actualRentalDays);
        } catch (e) {
            console.log('Could not save dates to local storage');
        }
        
        // FORCE THE PICKUP TIME TO ALWAYS BE 13:00
        $('#custom-pickup-time').val('13');
        sessionStorage.setItem('custom_pickup_time', '13');
        localStorage.setItem('custom_pickup_time', '13');
        
        // Set pickup time default (will be updated in setupPickupTimeField function)
        setupPickupTimeField();
        
        // Make sure the pickup time displays immediately
        setTimeout(function() {
            // Direct DOM manipulation for Select2
            $('.select2-selection__rendered').text('13:00').removeClass('select2-selection__placeholder');
        }, 100);
    }
    
    /**
     * Setup pickup time field based on individual product settings
     */
    function setupPickupTimeField() {
        // Use product-specific pickup time from the productPickupOverrides map
        let productPickupHour = 13; // Default fallback
        if (
            window.productPickupOverrides &&
            window.currentProductId &&
            window.productPickupOverrides[window.currentProductId] !== undefined
        ) {
            var override = window.productPickupOverrides[window.currentProductId];
            var parsed = parseInt(override);
            if (!isNaN(parsed)) {
                productPickupHour = parsed;
            }
        }
        // Set the pickup time field based on this specific product's settings
        if ($('#custom-pickup-time').length) {
            $('#custom-pickup-time').val(productPickupHour).trigger('change');
        }
        // If using Select2, update display text
        if ($('.select2-selection__rendered').length) {
            $('.select2-selection__rendered').text(productPickupHour + ':00');
        }
        // Log the product-specific pickup time
        console.log('Using product-specific pickup time for product', window.currentProductId + ': ' + productPickupHour + ':00');
    }

    
    /**
     * Setup date selection handlers for the calendar
     * This handles clicking on dates and managing the selection state
     */
    function setupDateSelectionHandlers() {
        // Add essential styles to head
        if (!$('#calendar-essential-styles').length) {
            $('head').append(`
                <style id="calendar-essential-styles">
                    .day-cell.selected-start, .day-cell.selected-end {
                        background-color: #4CAF50 !important;
                        color: white !important;
                        font-weight: bold !important;
                        box-shadow: 0 0 0 3px #2E7D32 !important;
                        position: relative;
                        z-index: 2;
                    }
                    .day-cell.in-selected-range {
                        background-color: #E8F5E9 !important;
                        color: #333 !important;
                        position: relative;
                        z-index: 1;
                    }
                </style>
            `);
        }

        // When a date cell is clicked, handle selection
        $(document).on('click', '.day-cell[data-selectable="true"]', function() {
            // Get date from data attribute
            const dateISO = $(this).data('date');
            if (!dateISO) return;
            
            // Create a clean date object for the clicked date
            const clickedDate = new Date(dateISO + 'T00:00:00');
            console.log('User clicked date:', formatDate(clickedDate), '|', dateISO);
            
            // Initialize selectedDates array if it doesn't exist
            if (!window.selectedDates) {
                window.selectedDates = [];
            }
            
            // CASE 1: Clicking on an already selected date - maintain selection
            if (window.selectedDates.length > 0) {
                const isAlreadySelected = window.selectedDates.some(d => formatDateISO(d) === dateISO);
                if (isAlreadySelected) {
                    console.log('Clicked on an already selected date - keeping current selection');
                    return; // Keep the current selection
                }
                
                // If dates are already confirmed, allow starting a new selection directly
                if (window.datesConfirmed) {
                    console.log('Starting new selection directly without requiring clear');
                    window.selectedDates = [new Date(clickedDate.getTime())]; // Start new selection
                    window.datesConfirmed = false;
                    
                    // Hide booking-related elements
                    $('#weekend-return-notice').hide();
                    $('#return-conditions-notice').hide();
                    $('#hours-selection').hide();
                    $('#add-to-cart-buttons').hide();
                    
                    // Update display
                    updateCalendarSelection();
                    updateSelectedRangeDisplay();
                    return;
                }
            }
            
            // Reset confirmation state
            window.datesConfirmed = false;
            
            // CASE 2: No date selected yet - this is the first click
            if (window.selectedDates.length === 0) {
                // Clear any previous selections
                clearAllDateSelections();
                
                // Set this as the start date
                window.selectedDates = [new Date(clickedDate.getTime())];
                console.log('Setting as start date:', formatDate(clickedDate));
                
                // Update message
                updateSelectedRangeDisplay('בחרת את ' + formatDate(clickedDate) + '. אנא בחר תאריך סיום.', 'info');
            }
            // CASE 3: One date already selected - this is the second click
            else if (window.selectedDates.length === 1) {
                // Get the start date
                const startDate = new Date(window.selectedDates[0]);
                console.log('Adding end date:', formatDate(clickedDate));
                
                // Add this as the end date (we'll sort them later)
                window.selectedDates.push(new Date(clickedDate.getTime()));
                
                // If start and end dates are different, it's a range
                if (formatDateISO(startDate) !== dateISO) {
                    console.log('Selected date range:', formatDate(startDate), 'to', formatDate(clickedDate));
                } else {
                    console.log('Selected single day:', formatDate(clickedDate));
                }
                
                // Then validate the range and show confirm button for valid selections
                if (validateDateRange()) {
                    console.log('Date range is valid, showing confirm button');
                    updateSelectedRangeDisplay(); // This will update the message with confirmation button
                } else {
                    console.log('Date range validation failed');
                }
            }
            // CASE 4: Starting a new selection after a complete range
            else if (window.selectedDates.length >= 2) {
                // Clear all selections
                clearAllDateSelections();
                
                // Set this as the start date of a new selection
                window.selectedDates = [new Date(clickedDate.getTime())];
                console.log('New selection starting with:', formatDate(clickedDate));
                
                // Update message
                updateSelectedRangeDisplay('בחרת את ' + formatDate(clickedDate) + '. אנא בחר תאריך סיום.', 'info');
            }
            
            // Always update the calendar display after any changes
            updateCalendarSelection();
        });
        
        /**
         * Clear all date selection styling and classes
         */
        function clearAllDateSelections() {
            $('.day-cell').removeClass('selected-start selected-end in-selected-range');
            $('.day-cell').removeAttr('style');
            $('#return-conditions-notice').hide();
            $('#date-validation-message').hide();
        }
        
        // Process date selection validation on document ready
        $(document).ready(function() {
            // For multi-day ranges - validate the selection
            if (window.selectedDates && window.selectedDates.length === 2) {
                const startDate = new Date(window.selectedDates[0]);
                const endDate = new Date(window.selectedDates[1]);
                const startDateISO = formatDateISO(startDate);
                
                // Log what we have
                console.log('Validating selection:', window.selectedDates.map(d => formatDate(d)));
                
                // Validate the range
                if (!validateDateRange()) {
                    // If validation fails, reset to just the start date
                    console.log('Validation failed, resetting to start date only');
                    window.selectedDates = [window.selectedDates[0]];
                    
                    // Clear all selection except the start date
                    $('.day-cell').not($('.day-cell[data-date="' + startDateISO + '"]')).removeClass('selected-start selected-end in-selected-range');
                    $('.day-cell[data-date="' + startDateISO + '"]').addClass('selected-start').removeClass('selected-end in-selected-range');
                }
            }
            
            // Always refresh calendar to show selected dates
            console.log('Updating calendar with selection:', window.selectedDates ? window.selectedDates.map(d => formatDate(d)) : []);
            updateCalendarSelection();
            
            // Show confirm button if we have a valid range
            if (window.selectedDates && window.selectedDates.length === 2 && validateDateRange()) {
                console.log('Valid range selected, showing confirm button');
                showConfirmButton();
            }
        });
        
        
        // Handle clear selection button
        $(document).on('click', '#clear-date-selection', function(e) {
            e.preventDefault();
            clearDateSelection();
        });
        
        // When confirm button is clicked, process the selection
        $(document).on('click', '#confirm-dates', function(e) {
            e.preventDefault();
            confirmSelectedDates();
        });
    }
    
    /**
     * Clear the current date selection
     */
    function clearDateSelection() {
        window.selectedDates = [];
        window.datesConfirmed = false;
        updateCalendarSelection();
        $('#date-validation-message').hide();
        $('#return-conditions-notice').hide();
        $('#weekend-return-notice').hide();
        
        // Remove the green confirmation text
        $('.confirm-button').hide().remove();
    }
    
    /**
     * Show the confirmation button for selected dates
     * Not needed anymore as we use inline confirm button in the message
     */
    function showConfirmButton() {
        // This is handled directly in the updateSelectedRangeDisplay function now
        return;
    }
    
    /**
     * Validate the selected date range
     * Checks for reserved dates and proper date order
     */
    function validateDateRange() {
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            return false;
        }
        
        const startDate = new Date(window.selectedDates[0]);
        const endDate = new Date(window.selectedDates[1]);
        
        // Check if the selection includes a weekend (Friday)
        const includesWeekend = checkIfRangeIncludesFriday(startDate, endDate);
        if (includesWeekend) {
            // Show the weekend notice
            $('#weekend-return-notice').show();
        } else {
            // Hide the weekend notice if no weekend
            $('#weekend-return-notice').hide();
        }
        
        // Check if date range contains any disabled dates
        const disabled = window.disabledDates || [];
        let containsDisabled = false;
        
        // Check each date in range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Skip checking Saturdays
            if (currentDate.getDay() !== 6) { // 6 = Saturday
                const dateISO = formatDateISO(currentDate);
                if (disabled.includes(dateISO)) {
                    containsDisabled = true;
                    break;
                }
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (containsDisabled) {
            // Check if the disabled date is today and it's past cutoff time
            const today = new Date();
            const todayISO = formatDateISO(today);
            const isPastCutoff = today.getHours() >= 11;
            
            // If the range contains today and it's past cutoff, show special message
            if (disabled.includes(todayISO) && isPastCutoff && 
                (formatDateISO(startDate) === todayISO || formatDateISO(endDate) === todayISO)) {
                updateSelectedRangeDisplay('שימו לב - לא ניתן להזמין להיום (אחרי 11:00). אנא צרו קשר בטלפון 050-5544516 להזמנות דחופות', 'error');
            } else {
                updateSelectedRangeDisplay('טווח התאריכים שבחרת מכיל תאריכים שכבר הוזמנו. אנא בחר טווח אחר.', 'error');
            }
            return false;
        }
        
        // Check max rental days (exclude Saturdays)
        const actualRentalDays = calculateRentalDaysExcludingSaturdays(startDate, endDate);
        if (actualRentalDays > 7) {
            updateSelectedRangeDisplay('לא ניתן להשכיר ליותר מ-7 ימים. אנא בחר טווח קצר יותר.', 'error');
            return false;
        }
        
        // Valid selection
        return true;
    }
    
    /**
     * Update calendar to show selected date range
     */
    function updateCalendarSelection() {
        console.log('Updating calendar selection with dates:', window.selectedDates ? window.selectedDates.map(d => formatDate(d)) : []);
        
        // Clear all current selections first (fixes persistent selection bug)
        $('.day-cell').removeClass('selected selected-start selected-end in-selected-range in-range');
        
        // If no dates are selected, just return
        if (!window.selectedDates || window.selectedDates.length === 0) {
            return;
        }
        
        // Get all date cells in the calendar
        const allDayCells = $('.day-cell[data-date]');
        console.log('Calendar cells in DOM:', allDayCells.length);
        
        // Case 1: Single date selected or single-day booking (start = end)
        if (window.selectedDates.length === 1 || 
            (window.selectedDates.length === 2 && 
             formatDateISO(window.selectedDates[0]) === formatDateISO(window.selectedDates[1]))) {
            
            // Get the selected date in ISO format
            const dateISO = formatDateISO(window.selectedDates[0]);
            
            // Find the cell for this date
            const selectedCell = $(`.day-cell[data-date="${dateISO}"]`);
            if (selectedCell.length) {
                selectedCell.addClass('selected selected-start selected-end');
                console.log('START CELL:', dateISO, 'FOUND');
            }
        }
        // Case 2: Date range selected (two different dates)
        else if (window.selectedDates.length === 2) {
            // Sort the dates chronologically
            const sortedDates = [...window.selectedDates].sort((a, b) => a - b);
            const startDate = new Date(sortedDates[0]);
            const endDate = new Date(sortedDates[1]);
            
            // Get ISO string versions for finding elements
            const startISO = formatDateISO(startDate);
            const endISO = formatDateISO(endDate);
            
            console.log('Highlighting range from', formatDate(startDate), 'to', formatDate(endDate));
            
            // Mark start date
            const startCell = $(`.day-cell[data-date="${startISO}"]`);
            if (startCell.length) {
                startCell.addClass('selected selected-start');
                console.log('START CELL MARKED:', startISO);
            }
            
            // Mark end date
            const endCell = $(`.day-cell[data-date="${endISO}"]`);
            if (endCell.length) {
                endCell.addClass('selected selected-end');
                console.log('END CELL MARKED:', endISO);
            }
            
            // Mark all dates in between with the range class
            allDayCells.each(function() {
                const cellDate = $(this).data('date');
                if (!cellDate) return;
                
                const date = new Date(cellDate + 'T00:00:00');
                
                // Check if this date is within the range (inclusive)
                if (date >= startDate && date <= endDate) {
                    $(this).addClass('in-range');
                    console.log('Added in-range to:', cellDate);
                }
            });
            
            // If dates are confirmed, add confirmed class
            if (window.datesConfirmed) {
                $('.selected-start, .selected-end').addClass('confirmed');
            }
        }
        
        // Add or refresh styles
        if (!$('#range-selection-styles').length) {
            $('head').append(`
                <style id="range-selection-styles">
                    .day-cell.selected-start, .day-cell.selected-end { 
                        background-color: #4CAF50 !important; 
                        color: white !important; 
                        font-weight: bold !important;
                        border: 3px solid #2E7D32 !important;
                        box-shadow: 0 0 5px #4CAF50 !important;
                        position: relative;
                        z-index: 2;
                    }
                    .day-cell.in-range { 
                        background-color: #E8F5E9 !important; 
                        color: #333 !important;
                        border: 1px solid #4CAF50 !important;
                        position: relative;
                        z-index: 1;
                    }
                    .day-cell.confirmed { 
                        border: 3px solid #2E7D32 !important;
                    }
                </style>
            `);
        }
    }
    
    /**
     * Update the display of selected date range
     */
    function updateSelectedRangeDisplay(message, type) {
        // Create the message element if it doesn't exist
        if ($('#date-validation-message').length === 0) {
            $('#datepicker-container').after('<div id="date-validation-message"></div>');
        }
        
        // Clear any existing messages
        $('#date-validation-message').hide();
        
        // If a specific message was provided, display it and return
        if (message) {
            $('#date-validation-message')
                .removeClass('error info success')
                .addClass(type || 'info')
                .html(message)
                .show();
            return;
        }
        
        // Don't display anything if no dates selected
        if (!window.selectedDates || !window.selectedDates.length) {
            return;
        }
        
        // Display for just start date selected (first click)
        if (window.selectedDates.length === 1) {
            // Format start date
            const startDate = new Date(window.selectedDates[0]);
            const startFormatted = startDate.toLocaleDateString('he-IL');
            
            // Show single date message
            $('#date-validation-message')
                .removeClass('error success')
                .addClass('info')
                .html('תאריך התחלה: ' + startFormatted + ' <strong>(בחר תאריך סיום)</strong>')
                .show();
                
            // Hide confirmation-only elements while selection is incomplete
            $('#return-conditions-notice').hide();
        } 
        // Display for date range selected (start + end date)
        else if (window.selectedDates.length === 2) {
            // Ensure dates are in the correct order
            let startDate, endDate;
            if (window.selectedDates[0] <= window.selectedDates[1]) {
                startDate = new Date(window.selectedDates[0]);
                endDate = new Date(window.selectedDates[1]);
            } else {
                startDate = new Date(window.selectedDates[1]);
                endDate = new Date(window.selectedDates[0]);
                // Update the array to maintain correct order
                window.selectedDates = [startDate, endDate];
            }
            
            // Format dates for display
            const startFormatted = startDate.toLocaleDateString('he-IL');
            const displayEndFormatted = endDate.toLocaleDateString('he-IL');
            
            // Calculate rental days
            const actualRentalDays = calculateRentalDaysExcludingSaturdays(startDate, endDate);
            
            // Different display based on whether dates are confirmed
            if (!window.datesConfirmed) {
                // Show booking info - auto-confirm selection
                $('#date-validation-message')
                    .removeClass('error success')
                    .addClass('info')
                    .html('בחרת תאריכים: ' + startFormatted + ' - ' + displayEndFormatted + ' (' + actualRentalDays + ' ימים) <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[נקה בחירה]</a>')
                    .show();
                
                // Automatically confirm dates
                confirmSelectedDates();
                
                // Show return conditions notice for multi-day bookings
                if (startFormatted !== displayEndFormatted) {
                    $('#return-conditions-notice').show();
                }
                
                // Check if booking spans weekend (show special notice) - always check regardless of single/multi day
                if (bookingSpansWeekend(startDate, endDate)) {
                    $('#weekend-return-notice').show();
                } else {
                    $('#weekend-return-notice').hide();
                }
            } else {
                // Show confirmed message
                $('#date-validation-message')
                    .removeClass('error info')
                    .addClass('success')
                    .html('התאריכים אושרו בהצלחה: ' + startFormatted + ' - ' + displayEndFormatted + ' (' + actualRentalDays + ' ימים לחיוב) <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[שנה בחירה]</a>')
                    .show();
            }
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

// Expose essential functions to window for external access
window.initializeFallbackCalendar = initializeFallbackCalendar;
window.setupPickupTimeField = setupPickupTimeField;
})(jQuery);
