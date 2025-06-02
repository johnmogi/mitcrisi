/**
 * Mitnafun Calendar System
 * Modern implementation with weekend booking support and RTL localization
 */
(function($) {
    'use strict';
    
    // Configuration
    const DEBUG = true;
    
    // Main Calendar Class
    class MitnafunCalendar {
        constructor(options = {}) {
            // Default options
            this.options = {
                container: '#datepicker-container',
                startDateField: '#rental_start_date',
                endDateField: '#rental_end_date',
                rentalDatesField: '#rental_dates',
                priceContainer: '#price-breakdown-container',
                pickupHourField: '#pickup_hour',
                customPickupField: '#custom-pickup-time',
                addToCartBtn: '.single_add_to_cart_button',
                validationMsg: '#date-validation-message',
                maxDurationMsg: '#max-duration-message',
                quantityField: '[name="quantity"]',
                ...options
            };
            
            // State management
            this.state = {
                startDate: null,
                endDate: null,
                selectedDates: [],
                reservedDates: window.bookedDates || [],
                maxRentalDays: window.maxRentalDays || 14,
                basePrice: window.basePrice || 550,
                discountType: window.discountType || 'percentage',
                discountValue: window.discountValue || 50,
                validSelection: false,
                businessHours: window.businessHours || {},
                weekendsDisabled: true,
                isProcessingDateChange: false,
                isResetting: false,
                allowSameDayBooking: true,
                sameDayBookingCutoffHours: 2,
                allowReservedDayJoin: true,
                isJoiningReservedDates: false,
                // Special discount tiers based on rental days
                discountTiers: window.discountTiers || [
                    { days: 1, discount: 0 },     // First day = full price (no discount)
                    { days: 3, discount: 50 },    // Days 2-3 = 50% discount
                    { days: 7, discount: 60 },    // Days 4-7 = 60% discount
                    { days: 999, discount: 70 }   // Days 8+ = 70% discount
                ]
            };
            
            // References to DOM elements
            this.elements = {};
            
            // Initialize
            this.init();
        }
        
        /**
         * Initialize the calendar system
         */
        init() {
            this.log('Initializing Mitnafun Calendar...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Process reserved dates
            this.processReservedDates();
            
            // Initialize Flatpickr
            this.initFlatpickr();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup pickup time
            this.setupPickupTime();
            
            // Add custom styles
            this.addCustomStyles();
            
            // Add reset button
            this.addResetButton();
            
            // Log initialization complete
            this.log('Calendar initialized successfully');
        }
        
        /**
         * Cache DOM elements for better performance
         */
        cacheElements() {
            const { options } = this;
            
            this.elements = {
                container: $(options.container),
                startDateField: $(options.startDateField),
                endDateField: $(options.endDateField),
                rentalDatesField: $(options.rentalDatesField),
                priceContainer: $(options.priceContainer),
                pickupHourField: $(options.pickupHourField),
                customPickupField: $(options.customPickupField),
                addToCartBtn: $(options.addToCartBtn),
                validationMsg: $(options.validationMsg),
                maxDurationMsg: $(options.maxDurationMsg),
                quantityField: $(options.quantityField)
            };
        }
        
        /**
         * Process reserved dates from WooCommerce
         */
        processReservedDates() {
            // Fetch reserved dates via AJAX on real pages; skip if test data exists
            this.log('Fetching reserved dates');
            if (typeof window.bookedDates === 'undefined') {
                const ajaxUrl = typeof mitnafun_ajax_object !== 'undefined' ? mitnafun_ajax_object.ajax_url : '/wp-admin/admin-ajax.php';
                const requestData = { action: 'get_reserved_dates', product_id: this.options.productId };
                if (typeof mitnafun_ajax_object !== 'undefined') requestData.nonce = mitnafun_ajax_object.nonce;
                $.post(ajaxUrl, requestData, (response) => {
                    if (response.success) {
                        this.state.reservedDates = response.data.dates;
                        // Re-process and refresh calendar
                        this.processReservedDates();
                        if (this.flatpickr) {
                            this.flatpickr.set('disable', this.getDisabledDates());
                            this.applyCustomDayStyles();
                        }
                    } else {
                        this.log('Error fetching reserved dates', response.data);
                    }
                });
                return;
            }
            // Use existing reservedDates (e.g., test data)
            const reservedDates = this.state.reservedDates;
            this.log('Processing reserved dates', reservedDates);
            // Convert dates to Date objects
            this.state.processedReservedDates = reservedDates.map(dateStr => {
                if (typeof dateStr === 'string') {
                    return new Date(dateStr);
                }
                return dateStr;
            });
        }
        
        /**
         * Initialize Flatpickr with all options
         */
        initFlatpickr() {
            const { container } = this.elements;
            
            if (!container.length) {
                this.log('Error: Calendar container not found');
                return;
            }
            
            // Convert reserved dates to Flatpickr disable format
            const disabledDates = this.getDisabledDates();
            
            // Get RTL state
            const isRtl = $('html').hasClass('rtl');
            
            // Configure Flatpickr
            this.flatpickr = flatpickr(container[0], {
                inline: true,
                mode: "range",
                dateFormat: "Y-m-d",
                minDate: "today",
                locale: this.getHebrewLocale(),
                disable: disabledDates,
                onChange: this.handleDateChange.bind(this),
                onOpen: this.handleCalendarOpen.bind(this),
                onReady: this.handleCalendarReady.bind(this),
                onMonthChange: this.handleMonthChange.bind(this),
                direction: isRtl ? 'rtl' : 'ltr'
            });
            
            this.log('Flatpickr initialized');
        }
        
        /**
         * Hebrew locale for Flatpickr
         */
        getHebrewLocale() {
            return {
                weekdays: {
                    shorthand: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                    longhand: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
                },
                months: {
                    shorthand: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
                    longhand: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
                },
                rangeSeparator: ' עד ',
                time_24hr: true,
                direction: 'rtl'
            };
        }

        /**
         * Get disabled dates for the calendar
         */
        getDisabledDates() {
            const { processedReservedDates, weekendsDisabled } = this.state;
            
            // Check if today should be disabled based on time
            const disabledDates = [
                // Disable Saturdays except when they are joinable edges of a reservation
                ...(weekendsDisabled ? [date => {
                    if (this.state.allowReservedDayJoin && (this.isFirstDayOfReservation(date) || this.isLastDayOfReservation(date))) {
                        return false;
                    }
                    return date.getDay() === 6;
                }] : []),
                // Check if today should be disabled based on same-day booking cutoff
                date => this.isSameDayDisabled(date),
                // For reserved dates, make sure we don't disable dates that can be joined
                date => this.state.allowReservedDayJoin ? 
                    this.isDateFullyReserved(date) : 
                    this.isDateReserved(date)
            ];
            
            return disabledDates;
        }
        
        /**
         * Check if same-day booking should be disabled based on current time
         * @param {Date} date - Date to check
         * @returns {boolean} - True if the date should be disabled
         */
        isSameDayDisabled(date) {
            if (!this.state.allowSameDayBooking) return false;
            
            const today = new Date();
            const isToday = this.isSameDay(date, today);
            
            if (!isToday) return false;
            
            // Get default pickup hour
            const defaultPickupHour = window.productPickupTime || 13;
            const cutoffHour = defaultPickupHour - this.state.sameDayBookingCutoffHours;
            
            // Check if current time is past the cutoff
            const currentHour = today.getHours();
            return currentHour >= cutoffHour;
        }
        
        /**
         * Check if a date is reserved
         */
        isDateReserved(dateToCheck) {
            const { processedReservedDates } = this.state;
            
            return processedReservedDates.some(reservedDate => 
                this.isSameDay(dateToCheck, reservedDate)
            );
        }
        
        /**
         * Check if a date is fully reserved and cannot be joined
         * @param {Date} date - Date to check
         * @returns {boolean} - True if date is fully reserved (not at edge of reservation)
         */
        isDateFullyReserved(date) {
            if (!this.isDateReserved(date)) return false;
            
            // If it's reserved, check if it's at the edge of a reservation
            // (either the first or last day of a consecutive reserved period)
            const prevDay = new Date(date);
            prevDay.setDate(prevDay.getDate() - 1);
            
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const isPrevDayReserved = this.isDateReserved(prevDay);
            const isNextDayReserved = this.isDateReserved(nextDay);
            
            // If it's in the middle of a reservation, it's fully reserved
            if (isPrevDayReserved && isNextDayReserved) {
                return true;
            }
            
            // If it's at edge (first or last day of consecutive reserved dates), 
            // it can be joined
            return false;
        }
        
        /**
         * Check if date is the first day of a reserved period
         * @param {Date} date - Date to check
         * @returns {boolean} - True if it's the first day of a reserved period
         */
        isFirstDayOfReservation(date) {
            if (!this.isDateReserved(date)) return false;
            
            const prevDay = new Date(date);
            prevDay.setDate(prevDay.getDate() - 1);
            
            return !this.isDateReserved(prevDay);
        }
        
        /**
         * Check if date is the last day of a reserved period
         * @param {Date} date - Date to check
         * @returns {boolean} - True if it's the last day of a reserved period
         */
        isLastDayOfReservation(date) {
            if (!this.isDateReserved(date)) return false;
            
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            return !this.isDateReserved(nextDay);
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Listen for confirmation button clicks
            $(document).on('click', '.confirm-dates-btn', this.confirmSelection.bind(this));
        }
        
        /**
         * Add reset button to the calendar
         */
        addResetButton() {
            const resetBtn = $('<button>', {
                type: 'button',
                class: 'reset-dates-btn',
                text: 'נקה בחירה'
            }).on('click', this.resetSelection.bind(this));
            
            const confirmBtn = $('<button>', {
                type: 'button',
                class: 'confirm-dates-btn',
                text: 'אשר תאריכים'
            });
            
            // Create button container
            const buttonContainer = $('.mitnafun-calendar-buttons');
            if (buttonContainer.length) {
                buttonContainer.empty().append(resetBtn).append(confirmBtn);
            } else {
                // Add after calendar
                this.elements.container.after($('<div>', {
                    class: 'mitnafun-calendar-buttons'
                }).append(resetBtn).append(confirmBtn));
            }
        }
        
        /**
         * Handle date change event from Flatpickr
         */
        handleDateChange(selectedDates, dateStr) {
            this.log('Date selection changed', selectedDates);
            
            // Prevent loop - if we're already processing a date change, don't trigger another reset
            if (this.state.isProcessingDateChange) {
                return;
            }
            
            // Set processing flag
            this.state.isProcessingDateChange = true;
            
            try {
                if (selectedDates.length === 0) {
                    // Only reset if explicitly cleared by user action, not by another reset operation
                    if (!this.state.isResetting) {
                        this.resetSelection();
                    }
                    return;
                }
                
                if (selectedDates.length === 2) {
                    const [startDate, endDate] = selectedDates;
                    
                    // Update state
                    this.state.startDate = startDate;
                    this.state.endDate = endDate;
                    this.state.selectedDates = selectedDates;
                    
                    // Validate the selection
                    this.validateDateRange(startDate, endDate);
                }
            } finally {
                // Clear processing flag
                this.state.isProcessingDateChange = false;
            }
        }
        
        /**
         * Handle calendar open event
         */
        handleCalendarOpen() {
            this.log('Calendar opened');
        }
        
        /**
         * Handle calendar ready event
         */
        handleCalendarReady() {
            this.log('Calendar ready');
            
            // Add custom calendar legend
            this.addCalendarLegend();
        }
        
        /**
         * Handle month change event
         */
        handleMonthChange() {
            this.log('Month changed');
            
            // Reapply custom styles on month change
            setTimeout(() => {
                this.applyCustomDayStyles();
            }, 100);
        }
        
        /**
         * Add calendar legend
         */
        addCalendarLegend() {
            // Remove any existing legend
            $('.calendar-legend').remove();
            
            const legendHtml = `
                <div class="calendar-legend">
                    <div class="legend-item">
                        <span class="legend-color available"></span>
                        <span class="legend-text">זמין להזמנה</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color reserved"></span>
                        <span class="legend-text">תפוס</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color selected"></span>
                        <span class="legend-text">נבחר</span>
                    </div>
                </div>
            `;
            
            // Add after the calendar
            this.elements.container.after(legendHtml);
        }
        
        /**
         * Apply custom styles to calendar days
         */
        applyCustomDayStyles() {
            // Add specific styling to weekend days
            $('.flatpickr-day').each((index, el) => {
                const $el = $(el);
                const dateStr = $el.attr('aria-label');
                
                if (dateStr) {
                    const date = new Date(dateStr);
                    
                    // Mark Saturdays
                    if (date.getDay() === 6) {
                        $el.addClass('weekend-day');
                    }
                    
                    // Mark reserved dates (fully reserved vs boundary)
                    if (this.isDateReserved(date)) {
                        if (this.state.allowReservedDayJoin) {
                            if (this.isDateFullyReserved(date)) {
                                $el.addClass('reserved-day');
                            } else {
                                // This is a boundary day (first or last day of a reservation)
                                $el.addClass('reservation-boundary');
                                
                                if (this.isFirstDayOfReservation(date)) {
                                    $el.attr('title', 'ניתן להתחבר בסוף הזמנה קיימת');
                                } else if (this.isLastDayOfReservation(date)) {
                                    $el.attr('title', 'ניתן להתחבר לתחילת הזמנה קיימת');
                                }
                            }
                        } else {
                            $el.addClass('reserved-day');
                        }
                    }
                }
            });
        }
        
        /**
         * Validate the selected date range
         */
        validateDateRange(startDate, endDate) {
            this.log('Validating date range', { startDate, endDate });
            
            // Clear previous validation
            this.clearValidation();
            
            // Check if dates are valid
            if (!startDate || !endDate) {
                this.showError('יש לבחור תאריך התחלה וסיום');
                return false;
            }
            
            // Make sure end date is after start date
            if (startDate > endDate) {
                this.showError('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
                return false;
            }
            
            // Reset joining flag
            this.state.isJoiningReservedDates = false;
            
            // Check for same-day booking cutoff
            if (this.isSameDayDisabled(startDate)) {
                this.showError('לא ניתן להזמין להיום - עבר זמן ההזמנה (2 שעות לפני האיסוף)');
                return false;
            }
            
            // Check for reserved dates in range (except for allowed joining)
            if (this.state.allowReservedDayJoin) {
                // Check for joining on start date
                if (this.isDateReserved(startDate)) {
                    if (!this.isLastDayOfReservation(startDate)) {
                        this.showError('תאריך ההתחלה הנבחר הוא חלק מהזמנה קיימת');
                        return false;
                    } else {
                        // Valid joining at start
                        this.state.isJoiningReservedDates = true;
                    }
                }
                
                // Check for joining on end date
                if (this.isDateReserved(endDate)) {
                    if (!this.isFirstDayOfReservation(endDate)) {
                        this.showError('תאריך הסיום הנבחר הוא חלק מהזמנה קיימת');
                        return false;
                    } else {
                        // Valid joining at end
                        this.state.isJoiningReservedDates = true;
                    }
                }
                
                // Check for any reserved dates in the middle of the range
                let currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + 1);
                
                while (currentDate < endDate) {
                    if (this.isDateReserved(currentDate)) {
                        this.showError('הטווח המבוקש כולל תאריכים שכבר הוזמנו');
                        return false;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                // Show joining message if needed
                if (this.state.isJoiningReservedDates) {
                    let joinMessage = '';
                    
                    if (this.isDateReserved(startDate) && this.isLastDayOfReservation(startDate)) {
                        joinMessage = 'הזמנתך מתחברת לסוף הזמנה קיימת';
                    } else if (this.isDateReserved(endDate) && this.isFirstDayOfReservation(endDate)) {
                        joinMessage = 'הזמנתך מתחברת לתחילת הזמנה קיימת';
                    }
                    
                    this.showInfo(`שים לב: ${joinMessage}`);
                }
            } else {
                // Standard reserved date check without joining
                if (this.rangeContainsReservedDates(startDate, endDate)) {
                    this.showError('הטווח המבוקש כולל תאריכים שכבר הוזמנו');
                    return false;
                }
            }
            
            // Check max rental days
            const rentalDays = this.calculateRentalDays(startDate, endDate);
            if (rentalDays > this.state.maxRentalDays) {
                this.showError(`ניתן להזמין עד ${this.state.maxRentalDays} ימים בלבד`);
                this.elements.maxDurationMsg.show();
                return false;
            }
            
            // If we got here, the selection is valid
            this.state.validSelection = true;
            this.state.rentalDays = rentalDays;
            
            // Update rental dates field and show price breakdown
            this.updateRentalDatesField(startDate, endDate);
            this.updatePriceBreakdown(rentalDays);
            
            // Enable the add to cart button
            this.elements.addToCartBtn.prop('disabled', false);
            
            // Show success message with joining info if needed
            const successMessage = this.state.isJoiningReservedDates
                ? 'בחירת תאריכים תקינה (מחובר להזמנה קיימת)'
                : 'בחירת תאריכים תקינה';
                
            this.showSuccess(successMessage);
            
            return true;
        }
        
        /**
         * Calculate rental days including weekends
         */
        calculateRentalDays(startDate, endDate) {
            if (!startDate || !endDate) {
                return 0;
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            const diffTime = end - start;
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Same-day booking counts as one day
            if (diffDays === 0) diffDays = 1;
            // Weekend special: Fri-Sun counts as one day
            if (start.getDay() === 5 && end.getDay() === 0) diffDays = 1;
            return diffDays;
        }
        
        /**
         * Get price for a specific day based on discount tier
         * @param {number} dayIndex - Index of the rental day (0-based)
         * @returns {number} - Price for that day
         */
        getPriceForDay(dayIndex) {
            // First day is always full price
            if (dayIndex === 0) return this.state.basePrice;
            
            // Find applicable discount tier
            let applicableDiscount = 0;
            for (const tier of this.state.discountTiers) {
                if (dayIndex < tier.days) {
                    applicableDiscount = tier.discount;
                    break;
                }
            }
            
            // Calculate discounted price
            const discountedPrice = this.state.basePrice * (1 - (applicableDiscount / 100));
            return discountedPrice;
        }
        
        /**
         * Calculate total price for rental period with tiered pricing
         * @param {number} rentalDays - Number of rental days
         * @returns {object} - Object with detailed price info
         */
        calculatePrice(rentalDays) {
            if (!rentalDays || rentalDays <= 0) {
                return { totalPrice: 0, breakdown: [] };
            }
            
            let totalPrice = 0;
            const breakdown = [];
            let currentTierDays = 0;
            let currentTierDiscount = 0;
            let currentTierTotal = 0;
            
            // Group days by discount tiers for the breakdown
            for (let day = 0; day < rentalDays; day++) {
                const dayPrice = this.getPriceForDay(day);
                totalPrice += dayPrice;
                
                // Track days in each tier for breakdown
                const thisDayDiscount = day === 0 ? 0 : this.getDiscountForDay(day);
                
                if (thisDayDiscount !== currentTierDiscount && day > 0) {
                    // Save previous tier to breakdown
                    if (currentTierDays > 0) {
                        breakdown.push({
                            days: currentTierDays,
                            discount: currentTierDiscount,
                            total: currentTierTotal
                        });
                    }
                    
                    // Start new tier
                    currentTierDays = 1;
                    currentTierDiscount = thisDayDiscount;
                    currentTierTotal = dayPrice;
                } else {
                    // Continue current tier
                    currentTierDays++;
                    currentTierTotal += dayPrice;
                }
            }
            
            // Add the last tier
            if (currentTierDays > 0) {
                breakdown.push({
                    days: currentTierDays,
                    discount: currentTierDiscount,
                    total: currentTierTotal
                });
            }
            
            return {
                totalPrice: Math.round(totalPrice),
                breakdown: breakdown
            };
        }
        
        /**
         * Get discount percentage for a specific day
         * @param {number} dayIndex - Index of the rental day (0-based)
         * @returns {number} - Discount percentage 
         */
        getDiscountForDay(dayIndex) {
            if (dayIndex === 0) return 0;
            
            // Find applicable discount tier
            for (const tier of this.state.discountTiers) {
                if (dayIndex < tier.days) {
                    return tier.discount;
                }
            }
            
            // Use the highest tier for days beyond the defined tiers
            return this.state.discountTiers[this.state.discountTiers.length - 1].discount;
        }
        
        /**
         * Update rental dates hidden field
         */
        updateRentalDatesField(startDate, endDate) {
            const formatDate = date => {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };
            
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            const rentalDatesValue = `${formattedStartDate} - ${formattedEndDate}`;
            
            // Update hidden fields
            this.elements.rentalDatesField.val(rentalDatesValue);
            
            // Also update individual start/end date fields if they exist
            if (this.elements.startDateField.length) {
                this.elements.startDateField.val(formattedStartDate);
            }
            
            if (this.elements.endDateField.length) {
                this.elements.endDateField.val(formattedEndDate);
            }
            
            this.log('Updated rental dates field', rentalDatesValue);
        }
        
        /**
         * Update price breakdown based on selection
         */
        updatePriceBreakdown(rentalDays) {
            if (!rentalDays || !this.elements.priceContainer.length) {
                return;
            }
            
            // Get selected quantity for display
            const quantity = this.elements.quantityField ? this.elements.quantityField.val() : 1;
            
            // Calculate price with new tiered system
            const priceDetails = this.calculatePrice(rentalDays);
            
            // Multiply by quantity for overall total
            const finalTotal = priceDetails.totalPrice * quantity;
            
            // Build HTML for price breakdown
            let breakdownHTML = `
                <div class="mitnafun-breakdown">
                    <p style="font-weight: bold; margin-bottom: 10px;">פירוט תמחור לתקופת השכירה:</p>
                    <ul style="list-style: none; padding-right: 15px; margin: 0 0 10px 0;">
            `;
            
            // First day is always full price
            breakdownHTML += `
                <li style="margin-bottom: 5px;">יום ראשון: ₪${this.state.basePrice} (מחיר מלא)</li>
            `;
            
            // Add breakdown for additional days by tier
            if (priceDetails.breakdown.length > 1) {
                for (let i = 1; i < priceDetails.breakdown.length; i++) {
                    const tier = priceDetails.breakdown[i];
                    breakdownHTML += `
                        <li style="margin-bottom: 5px;">${tier.days} ימים נוספים: ₪${Math.round(tier.total)} (${tier.discount}% הנחה)</li>
                    `;
                }
            }
            
            breakdownHTML += `
                    </ul>
                    <p style="font-weight: bold; font-size: 1.2em; margin: 10px 0;">סה״כ: ₪${finalTotal}</p>
                </div>
            `;
            
            // Include selected quantity above breakdown
            const quantityHTML = `<p style="font-weight:bold; margin-bottom:10px;">כמות: ${quantity}</p>`;
            
            // Update UI
            this.elements.priceContainer.html(quantityHTML + breakdownHTML).show();
            
            // Store price for later use
            this.state.totalPrice = finalTotal;
            
            // Log for debugging
            this.log('Updated price breakdown', {
                rentalDays: rentalDays,
                totalPrice: finalTotal
            });
        }
        
        /**
         * Reset date selection
         */
        resetSelection() {
            // Check if we're already resetting to prevent loops
            if (this.state.isResetting) {
                return;
            }
            
            this.state.isResetting = true;
            try {
                // Clear flatpickr
                if (this.flatpickr) {
                    this.flatpickr.clear();
                }
                
                // Reset state
                this.state.startDate = null;
                this.state.endDate = null;
                this.state.dateSelected = false;
                this.state.rentalDays = 0;
                
                // Clear inputs
                this.updateRentalDatesField('', '');
                this.updatePriceBreakdown(null);
                
                // Hide validation messages
                this.hideValidationMessage();
                
                // Disable confirm button
                if (this.confirmButton) {
                    this.confirmButton.disabled = true;
                }
                
                // Show user feedback
                this.showValidationMessage('בחירת תאריכים בוטלה', 'info');
                setTimeout(() => {
                    if (this.state.startDate === null && this.state.endDate === null) {
                        this.hideValidationMessage();
                    }
                }, 3000);
                
                this.log('Date selection has been reset');
            } finally {
                this.state.isResetting = false;
            }
        }
        
        /**
         * Confirm date selection
         */
        confirmSelection(e) {
            e.preventDefault();
            
            this.log('Confirming selection');
            
            if (!this.state.validSelection) {
                this.showError('יש לבחור תאריכים תקינים לפני אישור');
                return;
            }
            
            // Show success message and scroll to add to cart
            this.showSuccess('התאריכים אושרו! ניתן להוסיף לסל.');
            
            // Scroll to add to cart button
            $('html, body').animate({
                scrollTop: this.elements.addToCartBtn.offset().top - 100
            }, 500);
        }
        
        /**
         * Set up pickup time fields
         */
        setupPickupTime() {
            const { pickupHourField, customPickupField } = this.elements;
            
            // Find the pickup time field (could be either one)
            const pickupField = pickupHourField.length ? pickupHourField : 
                                customPickupField.length ? customPickupField : null;
            
            if (!pickupField) {
                this.log('Pickup time field not found');
                return;
            }
            
            // Set default value
            const defaultPickupHour = window.productPickupTime || 13;
            pickupField.val(defaultPickupHour).trigger('change');
            
            this.log('Pickup time set to', defaultPickupHour);
            
            // Fix the styling for the pickup time field
            this.fixPickupTimeStyles();
        }
        
        /**
         * Fix pickup time field styles
         */
        fixPickupTimeStyles() {
            // Add styling for select2 fields
            $('.pickup-time-row').each(function() {
                const label = $(this).find('label');
                const selectField = $(this).find('select');
                
                // Ensure label is visible (not behind the select2 container)
                label.css({
                    'position': 'relative',
                    'z-index': '10',
                    'background': 'white',
                    'padding': '0 5px',
                    'display': 'inline-block',
                    'margin-bottom': '5px'
                });
                
                // Initialize select2 if it hasn't been
                if (selectField.length && typeof $.fn.select2 === 'function' && !selectField.hasClass('select2-hidden-accessible')) {
                    selectField.select2({
                        minimumResultsForSearch: Infinity,
                        dir: $('html').hasClass('rtl') ? 'rtl' : 'ltr'
                    });
                }
            });
        }
        
        /**
         * Add custom styles for the calendar
         */
        addCustomStyles() {
            // Remove any existing styles
            $('#mitnafun-calendar-styles').remove();
            
            const styleElement = $('<style id="mitnafun-calendar-styles"></style>');
            
            const styles = `
                /* Calendar Styles */
                .flatpickr-calendar {
                    direction: rtl;
                    font-family: 'Assistant', sans-serif;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                /* Day styling */
                .flatpickr-day {
                    border-radius: 0 !important;
                    transition: all 0.2s ease;
                }
                
                /* Start date styling */
                .flatpickr-day.selected.startRange {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white !important;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                    z-index: 3;
                }
                
                /* End date styling */
                .flatpickr-day.selected.endRange {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white !important;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                    z-index: 3;
                }
                
                /* RTL specific adjustments for start/end ranges */
                html.rtl .flatpickr-day.selected.startRange {
                    border-radius: 0 50px 50px 0 !important;
                }
                
                html.rtl .flatpickr-day.selected.endRange {
                    border-radius: 50px 0 0 50px !important;
                }
                
                /* LTR specific adjustments */
                html:not(.rtl) .flatpickr-day.selected.startRange {
                    border-radius: 50px 0 0 50px !important;
                }
                
                html:not(.rtl) .flatpickr-day.selected.endRange {
                    border-radius: 0 50px 50px 0 !important;
                }
                
                /* In range styling */
                .flatpickr-day.inRange {
                    background-color: rgba(52, 152, 219, 0.2) !important;
                    color: #333 !important;
                    box-shadow: none;
                    border-color: transparent;
                }
                
                /* Single day selection */
                .flatpickr-day.selected.startRange.endRange {
                    border-radius: 50px !important;
                }
                
                /* Reserved days styling */
                .flatpickr-day.reserved-day {
                    background-color: rgba(231, 76, 60, 0.2) !important;
                    color: #e74c3c !important;
                    border: 1px dashed #e74c3c;
                    font-weight: bold;
                }
                
                /* Weekend days styling */
                .flatpickr-day.weekend-day {
                    color: #3498db;
                    font-weight: bold;
                }
                
                /* Reservation boundary days - available for joining */
                .flatpickr-day.reservation-boundary {
                    background: linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(255, 255, 255, 0.9) 70%) !important;
                    border: 1px dashed #e74c3c;
                    position: relative;
                }
                
                .flatpickr-day.reservation-boundary::before {
                    content: '';
                    position: absolute;
                    top: 3px;
                    right: 3px;
                    width: 8px;
                    height: 8px;
                    background-color: #27ae60;
                    border-radius: 50%;
                }
                
                /* Disabled day styling */
                .flatpickr-day.disabled {
                    color: rgba(57, 57, 57, 0.3) !important;
                    background: transparent !important;
                    cursor: not-allowed;
                }
                
                /* Today styling */
                .flatpickr-day.today {
                    border-color: #3498db;
                }
                
                /* Calendar legend */
                .calendar-legend {
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #eee;
                    border-radius: 4px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: space-around;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                }
                
                .legend-color {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    margin-left: 5px;
                    border-radius: 3px;
                }
                
                .legend-color.available {
                    background: white;
                    border: 1px solid #ccc;
                }
                
                .legend-color.reserved {
                    background: rgba(231, 76, 60, 0.2);
                    border: 1px dashed #e74c3c;
                }
                
                .legend-color.selected {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    border: none;
                }
                
                /* Calendar buttons */
                .mitnafun-calendar-buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 15px;
                }
                
                .reset-dates-btn {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .confirm-dates-btn {
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .confirm-dates-btn:disabled {
                    background: #95a5a6;
                    cursor: not-allowed;
                }
                
                /* Validation messages */
                .validation-message {
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: bold;
                }
                
                .validation-message.error {
                    background-color: rgba(231, 76, 60, 0.2);
                    color: #e74c3c;
                    border: 1px solid #e74c3c;
                }
                
                .validation-message.success {
                    background-color: rgba(39, 174, 96, 0.2);
                    color: #27ae60;
                    border: 1px solid #27ae60;
                }
                
                .validation-message.info {
                    background-color: rgba(52, 152, 219, 0.2);
                    color: #3498db;
                    border: 1px solid #3498db;
                }
                
                /* Price breakdown */
                .price-breakdown-container {
                    margin: 15px 0;
                    padding: 10px 15px;
                    border: 1px solid #eee;
                    border-radius: 4px;
                    background: #f9f9f9;
                }
                
                /* Join reservation indicator */
                .join-reservation-indicator {
                    position: relative;
                    padding-right: 20px;
                }
                
                .join-reservation-indicator::before {
                    content: '⚠️';
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                }
            `;
            
            styleElement.text(styles);
            $('head').append(styleElement);
        }
        
        /**
         * Show error message
         */
        showError(message) {
            this.elements.validationMsg
                .removeClass('success info')
                .addClass('error validation-message')
                .text(message)
                .show();
                
            this.state.validSelection = false;
            this.elements.addToCartBtn.prop('disabled', true);
        }
        
        /**
         * Show success message
         */
        showSuccess(message) {
            this.elements.validationMsg
                .removeClass('error info')
                .addClass('success validation-message')
                .text(message)
                .show();
        }
        
        /**
         * Show info message
         */
        showInfo(message) {
            this.elements.validationMsg
                .removeClass('error success')
                .addClass('info validation-message')
                .text(message)
                .show();
                
            // Hide after a few seconds
            setTimeout(() => {
                this.elements.validationMsg.fadeOut();
            }, 3000);
        }
        
        /**
         * Clear validation messages
         */
        clearValidation() {
            this.elements.validationMsg.removeClass('error success info').hide();
            this.elements.maxDurationMsg.hide();
        }
        
        /**
         * Toggle weekend selection on/off
         */
        toggleWeekendMode() {
            this.log('Toggling weekend selection');
            
            // Toggle state
            this.state.weekendsDisabled = !this.state.weekendsDisabled;
            
            // Update disabled dates
            const disabledDates = this.getDisabledDates();
            
            // Update flatpickr
            if (this.flatpickr) {
                this.flatpickr.set('disable', disabledDates);
                this.flatpickr.redraw();
            }
            
            // Show feedback about the current state
            if (this.state.weekendsDisabled) {
                this.showInfo('סופי שבוע (שבת) אינם זמינים להזמנה');
            } else {
                this.showInfo('סופי שבוע (שבת) זמינים להזמנה');
            }
        }
        
        /**
         * Refresh calendar when RTL is toggled
         */
        refreshCalendar() {
            this.log('Refreshing calendar for RTL change');
            
            // Check if RTL state has changed
            const isRtl = $('html').hasClass('rtl');
            
            // Destroy and recreate flatpickr with new RTL setting
            if (this.flatpickr) {
                // Save selected dates
                const selectedDates = this.flatpickr.selectedDates;
                
                // Destroy instance
                this.flatpickr.destroy();
                
                // Configure Flatpickr with new RTL setting
                const disabledDates = this.getDisabledDates();
                
                // Create new instance
                this.flatpickr = flatpickr(this.elements.container[0], {
                    inline: true,
                    mode: "range",
                    dateFormat: "Y-m-d",
                    minDate: "today",
                    locale: this.getHebrewLocale(),
                    disable: disabledDates,
                    onChange: this.handleDateChange.bind(this),
                    onOpen: this.handleCalendarOpen.bind(this),
                    onReady: this.handleCalendarReady.bind(this),
                    onMonthChange: this.handleMonthChange.bind(this),
                    direction: isRtl ? 'rtl' : 'ltr'
                });
                
                // Restore dates if they were selected
                if (selectedDates && selectedDates.length) {
                    this.flatpickr.setDate(selectedDates);
                }
                
                // Show feedback
                this.showInfo(isRtl ? 'מצב RTL מופעל' : 'מצב RTL כבוי');
            }
        }
        
        /**
         * Update reserved dates (for testing)
         */
        updateReservedDates(dates) {
            this.log('Updating reserved dates', dates);
            
            // Update state
            this.state.reservedDates = dates || [];
            
            // Process dates
            this.processReservedDates();
            
            // Update flatpickr
            if (this.flatpickr) {
                const disabledDates = this.getDisabledDates();
                this.flatpickr.set('disable', disabledDates);
                
                // Apply custom styling to show reserved days properly
                setTimeout(() => {
                    this.applyCustomDayStyles();
                }, 100);
            }
            
            // Show feedback
            this.showInfo(`עודכנו ${this.state.reservedDates.length} תאריכים תפוסים`);
        }
        
        /**
         * Update reserved dates and refresh calendar
         * @param {Array} dates - Array of reserved dates
         */
        updateReservedDatesAndRefresh(dates) {
            try {
                this.log('Updating reserved dates', dates);
                this.state.reservedDates = dates || [];
                this.processReservedDates();
                
                // If current selection includes any reserved date, reset it
                if (this.isDateRangeConflicting(this.state.startDate, this.state.endDate)) {
                    this.showValidationMessage('תאריכים שבחרת כוללים ימים תפוסים, אנא בחר תאריכים אחרים', 'error');
                    this.resetSelection();
                }
                
                // Refresh the calendar to show new reserved dates
                this.refreshCalendar();
                
                // Apply reserved day styling
                setTimeout(() => {
                    this.applyCustomDayStyles();
                }, 200);
            } catch (error) {
                console.error('Error updating reserved dates:', error);
            }
        }
        
        /**
         * Check if a date range has any conflicts with reserved dates
         * @param {Date} startDate - Start date
         * @param {Date} endDate - End date
         * @returns {boolean} True if there's a conflict
         */
        isDateRangeConflicting(startDate, endDate) {
            if (!startDate || !endDate || this.state.reservedDates.length === 0) {
                return false;
            }
            
            // Normalize dates for comparison
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            
            // Check each day in the range
            const currentDate = new Date(start);
            while (currentDate <= end) {
                if (this.isDateReserved(currentDate)) {
                    return true;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return false;
        }
        
        /**
         * Check if a specific date is reserved
         * @param {Date} date - Date to check
         * @returns {boolean} - True if date is reserved
         */
        isDateReserved(date) {
            if (!date || this.state.reservedDates.length === 0) {
                return false;
            }
            
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            
            return this.state.reservedDates.some(reservedDate => {
                const reserved = new Date(reservedDate);
                reserved.setHours(0, 0, 0, 0);
                return reserved.getTime() === checkDate.getTime();
            });
        }
        
        /**
         * Check if two dates are the same day (ignoring time)
         */
        isSameDay(date1, date2) {
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getDate() === date2.getDate();
        }
        
        /**
         * Debug logging
         */
        log(message, data) {
            if (DEBUG) {
                if (data) {
                    console.log("[MitnafunCalendar] " + message, data);
                } else {
                    console.log("[MitnafunCalendar] " + message);
                }
            }
        }
    }
    
    // Initialize multiple calendars when document is ready
    $(document).ready(function() {
        console.log('Document is ready - initializing multi calendars');
        
        const initCalendars = function() {
            if (typeof flatpickr === 'undefined') {
                console.log('Waiting for Flatpickr to load...');
                setTimeout(initCalendars, 500);
                return;
            }
            
            console.log('Flatpickr loaded, initializing calendars');
            
            const containers = $('.mitnafun-calendar-container');
            if (containers.length === 0) {
                console.error('No calendar containers found!');
                return;
            }
            
            window.mitnafunCalendars = window.mitnafunCalendars || {};
            containers.each(function() {
                const $container = $(this);
                const pid = $container.data('product-id');
                try {
                    const inst = new MitnafunCalendar({
                        container: '#datepicker-container-' + pid,
                        startDateField: '#rental_start_date-' + pid,
                        endDateField: '#rental_end_date-' + pid,
                        rentalDatesField: '#rental_dates-' + pid,
                        priceContainer: '#price-breakdown-container-' + pid,
                        validationMsg: '#date-validation-message-' + pid,
                        maxDurationMsg: '#max-duration-message-' + pid,
                        addToCartBtn: '.single_add_to_cart_button[data-product-id="' + pid + '"]',
                        productId: pid
                    });
                    window.mitnafunCalendars[pid] = inst;
                } catch (err) {
                    console.error('Error initializing calendar for product', pid, err);
                }
            });
        };
        
        // Start initialization after a short delay
        setTimeout(initCalendars, 200);
    });
    
    // Expose to window for external access
    window.MitnafunCalendar = MitnafunCalendar;
    
})(jQuery);
