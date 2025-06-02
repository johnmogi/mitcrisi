/**
 * Mitnafun Calendar Loader
 * This script loads the new calendar system and disables the legacy calendar
 */
(function($) {
    'use strict';

    // Configuration
    const CONFIG = {
        enableNewCalendar: true,
        disableLegacyCalendar: true,
        debug: true
    };

    // Debug logging
    function log(message, data) {
        if (CONFIG.debug) {
            if (data) {
                console.log("[CalendarLoader] " + message, data);
            } else {
                console.log("[CalendarLoader] " + message);
            }
        }
    }

    // Load required libraries
    function loadLibraries() {
        log('Loading required libraries');

        // Load Flatpickr if not already loaded
        if (typeof flatpickr === 'undefined') {
            log('Loading Flatpickr');
            
            // Load Flatpickr CSS
            $('<link>')
                .attr({
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'
                })
                .appendTo('head');
            
            // Load Flatpickr JavaScript
            $.getScript('https://cdn.jsdelivr.net/npm/flatpickr')
                .done(function() {
                    log('Flatpickr loaded successfully');
                    
                    // Load Hebrew locale for Flatpickr
                    if (typeof flatpickr.l10ns.he === 'undefined') {
                        $.getScript('https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/he.js')
                            .done(function() {
                                log('Hebrew locale loaded');
                                
                                // After all libraries are loaded, initialize calendar
                                initializeCalendar();
                            })
                            .fail(function() {
                                log('Failed to load Hebrew locale');
                            });
                    } else {
                        // If Hebrew locale already exists, initialize
                        initializeCalendar();
                    }
                })
                .fail(function() {
                    log('Failed to load Flatpickr');
                });
        } else {
            log('Flatpickr already loaded');
            
            // Load Hebrew locale if needed
            if (typeof flatpickr.l10ns.he === 'undefined') {
                $.getScript('https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/he.js')
                    .done(function() {
                        log('Hebrew locale loaded');
                        initializeCalendar();
                    })
                    .fail(function() {
                        log('Failed to load Hebrew locale');
                    });
            } else {
                initializeCalendar();
            }
        }
        
        // Load Select2 if not already loaded
        if (typeof $.fn.select2 === 'undefined') {
            log('Loading Select2');
            
            // Load Select2 CSS
            $('<link>')
                .attr({
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css'
                })
                .appendTo('head');
            
            // Load Select2 JavaScript
            $.getScript('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js')
                .done(function() {
                    log('Select2 loaded successfully');
                })
                .fail(function() {
                    log('Failed to load Select2');
                });
        } else {
            log('Select2 already loaded');
        }
    }

    // Initialize the new calendar
    function initializeCalendar() {
        if (!CONFIG.enableNewCalendar) {
            log('New calendar is disabled in configuration');
            return;
        }
        log('Initializing new calendar instances');
        const data = window.mitnafunCalendarData || {};
        // Seed reserved dates for the calendar
        window.bookedDates = data.booking_dates || [];

        // Instantiate calendar for each product container
        $('.mitnafun-calendar-container').each(function() {
            const $wrapper = $(this);
            const productId = $wrapper.data('product-id');
            const options = {
                container: `#datepicker-container-${productId}`,
                startDateField: `#rental_start_date-${productId}`,
                endDateField: `#rental_end_date-${productId}`,
                rentalDatesField: `#rental_dates-${productId}`,
                priceContainer: `#price-breakdown-container-${productId}`,
                pickupHourField: `#pickup_hour-${productId}`,
                addToCartBtn: `.add-to-cart-btn[data-product-id="${productId}"]`,
                validationMsg: `#date-validation-message-${productId}`,
                maxDurationMsg: `#max-duration-message-${productId}`,
                productId: productId,
                ajaxUrl: data.ajax_url,
                bookedDates: window.bookedDates,
                businessHours: data.business_hours,
                maxRentalDays: data.max_rental_days,
                basePrice: data.base_price,
                discountType: data.discount_type,
                discountValue: data.discount_value
            };
            new MitnafunCalendar(options);
            // Initialize test controls for this instance
            initializeTestControls();
        });
    }

    // Initialize test controls if they exist
    function initializeTestControls() {
        if ($('#calendar-test-controls').length > 0) {
            log('Initializing test controls');
            
            // Toggle weekends button
            $('#toggle-weekends').on('click', function() {
                log('Toggle weekends clicked');
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.toggleWeekendSelection();
                }
            });
            
            // Toggle RTL button
            $('#toggle-rtl').on('click', function() {
                log('Toggle RTL clicked');
                $('html').toggleClass('rtl');
                
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.refreshCalendar();
                }
            });
            
            // Add test reserved dates button
            $('#add-test-dates').on('click', function() {
                log('Add test dates clicked');
                
                // Generate some test dates (next 3 Mondays)
                const testDates = [];
                const now = new Date();
                let date = new Date(now);
                
                // Find next Monday
                date.setDate(date.getDate() + (8 - date.getDay()) % 7);
                
                // Add 3 Mondays
                for (let i = 0; i < 3; i++) {
                    testDates.push(new Date(date));
                    date.setDate(date.getDate() + 7);
                }
                
                log('Generated test dates', testDates);
                
                if (window.mitnafunCalendar) {
                    window.mitnafunCalendar.updateReservedDates(testDates);
                }
            });
            
            // Clear test log button
            $('#clear-test-log').on('click', function() {
                $('#test-log').html('');
            });
        }
    }

    // Disable legacy calendar code
    function disableLegacyCalendar() {
        if (!CONFIG.disableLegacyCalendar) {
            log('Legacy calendar disabling is disabled in configuration');
            return;
        }
        
        log('Disabling legacy calendar code');
        
        // Remove legacy calendar elements
        $('.fake-calendar-field').hide();
        
        // Disable legacy scripts by overriding their functions
        if (window.initializeCalendar) {
            window.initializeCalendar_original = window.initializeCalendar;
            window.initializeCalendar = function() {
                log('Blocked legacy initializeCalendar()');
                return false;
            };
        }
        
        if (window.initializeDatepicker) {
            window.initializeDatepicker_original = window.initializeDatepicker;
            window.initializeDatepicker = function() {
                log('Blocked legacy initializeDatepicker()');
                return false;
            };
        }
        
        // Prevent any air-datepicker initialization
        if ($.fn.datepicker) {
            $.fn.datepicker_original = $.fn.datepicker;
            $.fn.datepicker = function() {
                log('Blocked legacy air-datepicker initialization');
                return $(this);
            };
        }
        
        // Monitor for DOM changes to block any attempts to reinitialize
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                            const node = mutation.addedNodes[i];
                            
                            // Check if the added node is a legacy calendar element
                            if ($(node).hasClass('air-datepicker') || 
                                $(node).hasClass('datepicker-here') ||
                                $(node).find('.air-datepicker').length > 0) {
                                
                                log('Removing detected legacy calendar elements');
                                $(node).removeClass('air-datepicker datepicker-here');
                                $(node).find('.air-datepicker, .datepicker-here').remove();
                            }
                        }
                    }
                });
            });
            
            // Observe the entire document
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            log('Set up mutation observer to block legacy calendar');
        }
    }

    // Initialize the calendar on document ready
    $(document).ready(function() {
        log('Document ready, starting calendar loader');
        
        // First disable the legacy calendar
        disableLegacyCalendar();
        
        // Then load required libraries and initialize
        loadLibraries();
    });

})(jQuery);
