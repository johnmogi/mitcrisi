/**
 * Date-Aware Stock Management
 * 
 * Enhances the calendar system with intelligent stock management that takes
 * booking dates into account when determining product availability
 */
(function($) {
    'use strict';
    
    // Global variables
    let effectiveStockData = {};
    let originalStockQuantity = 0;
    
    // Initialize on document ready
    $(document).ready(function() {
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        console.log('Date-aware stock management initialized');
        
        // Get product ID from mitnafunFrontend global
        const productId = window.mitnafunFrontend?.productId || 0;
        if (!productId) {
            console.warn('Product ID not found, stock management disabled');
            return;
        }
        
        // Get product stock quantity
        originalStockQuantity = parseFloat($('input.qty').attr('max') || 0);
        console.log('Original stock quantity:', originalStockQuantity);
        
        // Initialize enhanced date validation
        initDateAwareValidation();
        
        // Hook into existing calendar events
        hookCalendarEvents();
    });
    
    /**
     * Initialize enhanced date validation system
     */
    function initDateAwareValidation() {
        // Check effective stock when dates are selected
        $(document).on('dateSelected', function(e, startDate, endDate) {
            if (!startDate || !endDate) return;
            
            // Format dates for AJAX
            const formattedStart = formatDateForServer(startDate);
            const formattedEnd = formatDateForServer(endDate);
            
            // Check effective stock for selected date range
            checkEffectiveStock(formattedStart, formattedEnd);
        });
    }
    
    /**
     * Hook into existing calendar events
     */
    function hookCalendarEvents() {
        // Wait for calendar to be fully initialized
        const checkCalendar = setInterval(function() {
            if (window.validateDateRange) {
                clearInterval(checkCalendar);
                
                // Preserve original validation function
                const originalValidate = window.validateDateRange;
                
                // Override with our enhanced version
                window.validateDateRange = function() {
                    // Call original validation first
                    const originalResult = originalValidate.apply(this, arguments);
                    
                    // If original validation failed, return false
                    if (!originalResult) {
                        return false;
                    }
                    
                    // Apply our enhanced date-aware validation
                    return enhancedDateValidation();
                };
                
                console.log('Calendar validation enhanced with date-aware stock checking');
            }
        }, 500);
    }
    
    /**
     * Enhanced date validation that uses effective stock
     */
    function enhancedDateValidation() {
        // Get selected dates from global variables
        if (!window.selectedDates || window.selectedDates.length !== 2) {
            return true; // No date range selected yet
        }
        
        const startDate = window.selectedDates[0];
        const endDate = window.selectedDates[1];
        
        // Check if we have effective stock data for this range
        const rangeKey = formatDateForServer(startDate) + '_' + formatDateForServer(endDate);
        
        if (!effectiveStockData[rangeKey]) {
            // We don't have data yet, assume valid and data will be loaded
            return true;
        }
        
        // Check if this range would exceed stock
        if (effectiveStockData[rangeKey].wouldConflict) {
            // Show error message
            const message = 'תאריכים אלו אינם זמינים עקב הזמנות קיימות';
            $('#date-validation-message').html(message).addClass('error').show();
            return false;
        }
        
        // Update UI based on effective stock
        updateUIForEffectiveStock(effectiveStockData[rangeKey]);
        
        return true;
    }
    
    /**
     * Check effective stock for a date range via AJAX
     */
    function checkEffectiveStock(startDate, endDate) {
        // Skip if we already have this data
        const rangeKey = startDate + '_' + endDate;
        if (effectiveStockData[rangeKey]) {
            console.log('Using cached effective stock data for', startDate, 'to', endDate);
            updateUIForEffectiveStock(effectiveStockData[rangeKey]);
            return;
        }
        
        // Get product ID
        const productId = window.mitnafunFrontend?.productId || 0;
        
        // Prepare data for AJAX request
        const data = {
            action: 'check_effective_stock',
            product_id: productId,
            start_date: startDate,
            end_date: endDate,
            nonce: window.mitnafunFrontend?.nonce || ''
        };
        
        console.log('Checking effective stock for', startDate, 'to', endDate);
        
        // Make AJAX request
        $.post(window.mitnafunFrontend?.ajaxUrl || '', data, function(response) {
            if (!response.success) {
                console.error('Error checking effective stock:', response.data?.message);
                return;
            }
            
            // Store response data
            effectiveStockData[rangeKey] = response.data;
            console.log('Effective stock data:', response.data);
            
            // Update UI based on effective stock
            updateUIForEffectiveStock(response.data);
            
            // Re-validate date range
            if (typeof window.validateDateRange === 'function') {
                window.validateDateRange();
            }
        }).fail(function(xhr, textStatus, errorThrown) {
            console.error('AJAX error checking effective stock:', textStatus, errorThrown);
        });
    }
    
    /**
     * Update UI elements based on effective stock
     */
    function updateUIForEffectiveStock(data) {
        // If we're dealing with the last item, apply special UI rules
        if (data.isLastItem) {
            console.log('Last item booking detected - enabling special behaviors');
            
            // Add class to body to trigger CSS rules
            $('body').addClass('last-item-booking');
            
            // Show pickup/return time fields
            $('.pickup-time-field, .return-time-field').show();
            
            // Add note about last item
            if ($('.last-item-note').length === 0) {
                $('<div class="last-item-note">זהו המוצר האחרון הזמין לתאריכים אלו</div>')
                    .insertAfter('.stock.in-stock');
            }
        } else {
            console.log('Multiple items available - disabling special behaviors');
            
            // Remove class from body
            $('body').removeClass('last-item-booking');
            
            // Hide pickup/return time fields if stock > 1
            if (originalStockQuantity > 1) {
                $('.pickup-time-field, .return-time-field').hide();
            }
            
            // Remove last item note
            $('.last-item-note').remove();
        }
    }
    
    /**
     * Format a date object for server (YYYY-MM-DD)
     */
    function formatDateForServer(date) {
        if (!date) return '';
        
        // If date is a string in ISO format, parse it
        if (typeof date === 'string' && date.includes('-')) {
            return date;
        }
        
        // If date is a DD.MM.YYYY string, convert to YYYY-MM-DD
        if (typeof date === 'string' && date.includes('.')) {
            const parts = date.split('.');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        
        // If date is a Date object, format it
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        return '';
    }
    
})(jQuery);
