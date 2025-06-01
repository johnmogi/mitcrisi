/**
 * Stock Data Integrator for Mitnafun
 * Fetches accurate stock data from the admin plugin and updates the calendar
 */
(function($) {
    'use strict';
    
    // Only run on product pages
    $(document).ready(function() {
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        // Check if stock is zero directly from DOM
        const stockText = $('.stock').text().trim();
        const stockMatch = stockText.match(/\d+/);
        const stockFromDOM = stockMatch ? parseInt(stockMatch[0], 10) : 1;
        
        // Immediately block booking if stock is zero
        if (stockFromDOM === 0) {
            console.error('[Stock Integrator] Stock is 0 - blocking all booking immediately');
            window.zeroStockProduct = true;
            disableBookingForZeroStock();
        }
        
        // Get product ID from global variable
        const productId = window.mitnafunFrontend && mitnafunFrontend.productId ? mitnafunFrontend.productId : 0;
        if (!productId) {
            console.warn('[Stock Integrator] No product ID found');
            return;
        }
        
        // Initialize stock data
        getAccurateStockData(productId);
        
        // Re-initialize whenever the calendar is updated
        $(document).on('calendar-initialized', function() {
            getAccurateStockData(productId);
        });
    });
    
    /**
     * Fetches accurate stock data from the mitnafun-order-admin plugin
     */
    function getAccurateStockData(productId) {
        // Use the product_reserved_dates endpoint to get reservation data
        $.ajax({
            url: mitnafunFrontend.ajaxUrl,
            type: 'POST',
            data: {
                action: 'get_product_reserved_dates',
                product_id: productId,
                nonce: mitnafunFrontend.nonce
            },
            success: function(response) {
                if (response.success && response.data) {
                    // Process the stock and reservation data
                    processStockData(response.data);
                } else {
                    console.error('[Stock Integrator] Failed to get stock data:', 
                                 response.data ? response.data.message : 'Unknown error');
                }
            },
            error: function(xhr, status, error) {
                console.error('[Stock Integrator] AJAX error:', error);
            }
        });
    }
    
    /**
     * Process stock data and update globals for the calendar system
     */
    function processStockData(data) {
        if (!data) return;
        
        // Extract and save the reserved dates
        const reservedDates = data.reserved_dates || [];
        const upcomingDates = data.upcoming_dates || [];
        
        // Get product information from WooCommerce using multiple methods to ensure accuracy
        let stockQuantity = 0;
        
        // Method 1: Check .stock element text (most reliable)
        const stockText = $('.stock').text().trim();
        const stockMatch = stockText.match(/(\d+)/);
        if (stockMatch && stockMatch[1]) {
            stockQuantity = parseInt(stockMatch[1], 10);
        }
        
        // Method 2: Check if we have it in window variables
        if (stockQuantity <= 0 && typeof window.productStockQty !== 'undefined') {
            stockQuantity = parseInt(window.productStockQty) || 0;
        }
        
        // Method 3: Check product data passed from PHP
        if (stockQuantity <= 0 && window.mitnafunFrontend && mitnafunFrontend.stockQty) {
            stockQuantity = parseInt(mitnafunFrontend.stockQty) || 0;
        }
        
        // Check if stock is actually 0 and warn about it
        if (stockQuantity < 1) {
            console.warn('[Stock Integrator] Stock is 0 - all booking should be prevented');
            // Store original stock value of 0
            window.zeroStockProduct = true;
            // Immediately apply zero-stock blocking
            disableBookingForZeroStock();
        }
        
        // Store globally for other scripts to use
        window.accurateStockQty = stockQuantity;
        window.reservedDateObjects = reservedDates;
        
        // Safely set window.productStockQty to avoid read-only property error
        try {
            window.productStockQty = stockQuantity;
        } catch (e) {
            console.log('🔄 Cannot set window.productStockQty directly, using alternative method');
            // Create a new variable to store the stock quantity that other scripts can use
            window.mitnafunStockQty = stockQuantity;
            
            // Dispatch an event for other scripts to listen to
            $(document).trigger('stockDataUpdated', {
                stockQuantity: stockQuantity
            });
        }
        
        console.info('[Stock Integrator] Updated stock data:', {
            productId: data.product_id,
            stockQty: stockQuantity,
            reservedDates: reservedDates.length,
            upcomingDates: upcomingDates.length
        });
        
        // Force global variable for other scripts - safely
        try {
            window.stockQuantity = stockQuantity;
        } catch (e) {
            console.log('🔄 Cannot set window.stockQuantity directly, using alternative method');
            // Define a property getter for compatibility
            if (typeof Object.defineProperty === 'function') {
                Object.defineProperty(window, '_stockQtyValue', {
                    value: stockQuantity,
                    writable: true
                });
                
                // Add a getter to mimic the original property
                Object.defineProperty(window, 'stockQuantity', {
                    get: function() { return window._stockQtyValue; }
                });
            }
        }
        
        // Calculate reservation counts per date
        const reservationCounts = {};
        
        // Process each reservation and count dates
        reservedDates.forEach(function(reservation) {
            if (!reservation.start_date || !reservation.end_date) return;
            
            // Create date range
            const start = new Date(reservation.start_date);
            const end = new Date(reservation.end_date);
            const current = new Date(start);
            
            // Count each date in the reservation
            while (current <= end) {
                const dateKey = formatDateISO(current);
                
                if (!reservationCounts[dateKey]) {
                    reservationCounts[dateKey] = 1;
                } else {
                    reservationCounts[dateKey]++;
                }
                
                // Move to next day
                current.setDate(current.getDate() + 1);
            }
        });
        
        // Store reservation counts globally
        window.reservationCounts = reservationCounts;
        
        // Update calendar display if needed
        updateCalendarWithStockData(stockQuantity, reservationCounts);
    }
    
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
     * Handles booking for zero-stock products in a smarter way
     * Instead of completely blocking, allow future bookings after all current reservations end
     */
    function disableBookingForZeroStock() {
        console.warn('[Stock Integrator] Smart handling for zero-stock product');
        
        // Step 1: Clear any existing date selections
        $('.day-cell').removeClass('selected start-date selected-start end-date selected-end in-range');
        
        // Step 2: Find the last reserved date to determine "free future" threshold
        let lastReservationDate = null;
        let reservationDates = [];
        
        // Collect all dates that have reservations
        $('.day-cell[data-reservations]').each(function() {
            const dateStr = $(this).data('date');
            if (dateStr) {
                reservationDates.push(new Date(dateStr));
            }
        });
        
        // Find the latest reserved date
        if (reservationDates.length > 0) {
            lastReservationDate = new Date(Math.max.apply(null, reservationDates));
            console.info('[Stock Integrator] Last reservation date:', formatDateISO(lastReservationDate));
            
            // Add a 1-day buffer after the last reservation
            lastReservationDate.setDate(lastReservationDate.getDate() + 1);
        } else {
            // If no reservations, set threshold to 7 days from now
            lastReservationDate = new Date();
            lastReservationDate.setDate(lastReservationDate.getDate() + 7);
        }
        
        // Step 3: Update calendar with a dual approach
        $('.day-cell').each(function() {
            const $cell = $(this);
            const dateStr = $cell.data('date');
            
            if (!dateStr) return; // Skip empty cells
            
            const cellDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Past dates are always disabled
            if (cellDate < today) {
                $cell.addClass('disabled').removeClass('selectable');
                $cell.attr('data-selectable', 'false');
                return;
            }
            
            // If before or equal to last reservation, respect reservation blocks
            if (cellDate <= lastReservationDate) {
                // If it has reservations or is already disabled, keep it disabled
                if ($cell.attr('data-reservations') || $cell.hasClass('disabled')) {
                    $cell.addClass('disabled').removeClass('selectable');
                    $cell.attr('data-selectable', 'false');
                }
                // Otherwise, enable it for booking
                else {
                    $cell.removeClass('disabled').addClass('selectable');
                    $cell.attr('data-selectable', 'true');
                }
            }
            // Future dates after last reservation are all available
            else {
                // Weekend days should still be affected by weekend blocking
                if (!$cell.hasClass('weekend') || $cell.hasClass('weekend') && $cell.attr('data-selectable') !== 'false') {
                    $cell.removeClass('disabled').addClass('selectable future-available');
                    $cell.attr('data-selectable', 'true');
                }
            }
        });
        
        // Step 4: Update messaging to indicate future availability
        // A) Update calendar title with warning that is less severe
        $('.month-year').addClass('limited-stock-warning').css({
            'color': 'orange',
            'font-weight': 'bold'
        });
        
        // B) Display helpful message about future availability
        let $validationMessage = $('#date-validation-message');
        if ($validationMessage.length) {
            $validationMessage.html('אין מלאי זמין כרגע, אבל ניתן להזמין לתאריכים עתידיים פנויים').removeClass('error').addClass('info').show();
        } else {
            // Create a message container if it doesn't exist
            $('<div id="date-validation-message" class="validation-message info" style="display:block;margin:15px 0;padding:10px;background-color:#e3f2fd;border:1px solid #90caf9;border-radius:4px;color:#0d47a1;">אין מלאי זמין כרגע, אבל ניתן להזמין לתאריכים עתידיים פנויים</div>')
                .insertAfter('.rental-dates-label');
        }
        
        // C) Reset add to cart buttons (they'll be enabled when dates are selected)
        $('.single_add_to_cart_button').prop('disabled', true).addClass('disabled');
        $('.single_add_to_cart_button').css({
            'opacity': '0.5',
            'cursor': 'not-allowed'
        });
    }
    
    /**
     * Update calendar display with accurate stock data
     * 
     * SIMPLIFIED LOGIC:
     * - If stock > 1: Don't block any dates (all available)
     * - If stock ≤ 1: Show normal blocking based on reserved dates
     */
    function updateCalendarWithStockData(stockQuantity, reservationCounts) {
        // Short delay to ensure calendar is ready
        setTimeout(function() {
            // First, reset all cells to be selectable (except weekends)
            resetCalendarCells();
            
            // Get all day cells
            const $dayCells = $('.day-cell');
            
            console.info('[Stock Integrator] Stock quantity:', stockQuantity);
            
            // SIMPLE CLIENT VIEW: If stock > 1, no blocking at all (except past dates and weekends)
            if (stockQuantity > 1) {
                console.info('[Stock Integrator] Stock > 1: Not blocking any future dates');
                
                // Keep track of which dates have reservations for debugging
                let reservedDateCount = 0;
                for (const date in reservationCounts) {
                    if (reservationCounts[date] > 0) {
                        reservedDateCount++;
                    }
                }
                console.info(`[Stock Integrator] Ignoring ${reservedDateCount} reserved dates due to stock > 1`);
                
                // Add subtle indicators for admin debugging if needed
                if (window.location.href.includes('debug=')) {
                    $dayCells.each(function() {
                        const $cell = $(this);
                        const dateStr = $cell.data('date');
                        
                        if (!dateStr) return;
                        
                        const count = reservationCounts[dateStr] || 0;
                        if (count > 0) {
                            $cell.attr('data-reservations', count);
                            $cell.addClass('admin-view-reserved');
                        }
                    });
                }
            }
            // If stock ≤ 1, use traditional booking system with reserved dates
            else {
                console.info('[Stock Integrator] Stock ≤ 1: Showing normal date blocking');
                
                $dayCells.each(function() {
                    const $cell = $(this);
                    const dateStr = $cell.data('date');
                    
                    // Skip if no date or is weekend
                    if (!dateStr || $cell.hasClass('weekend')) {
                        return;
                    }
                    
                    // Check if this is a special date type (early-return or return date)
                    const isEarlyReturn = $cell.hasClass('early-return-date') || $cell.attr('data-early-return') === 'true';
                    const isReturnDate = $cell.hasClass('return-date') || $cell.attr('data-return-date') === 'true';
                    const isSpecialDate = isEarlyReturn || isReturnDate;
                    
                    // Get reservation count for this date
                    const count = reservationCounts[dateStr] || 0;
                    
                    // If reservations exist AND it's not a special date, disable it
                    if (count > 0 && !isSpecialDate) {
                        // Standard reserved date - disable
                        $cell.addClass('disabled').attr('data-selectable', 'false');
                        $cell.attr('title', 'תפוס - אין מלאי זמין');
                        $cell.attr('data-reservations', count);
                    }
                    // For special dates (early-return or return date), keep them selectable
                    else if (isSpecialDate) {
                        // Remove disabled class and ensure it's selectable
                        $cell.removeClass('disabled').attr('data-selectable', 'true');
                        
                        // Add appropriate title based on type
                        if (isEarlyReturn) {
                            $cell.attr('title', 'החזרה מוקדמת - ניתן להזמנה'); // Early return - Available for booking
                            // Ensure it has the early-return-date class
                            $cell.addClass('early-return-date');
                        } else {
                            $cell.attr('title', 'יום החזרה - ניתן להזמנה'); // Return date - Available for booking
                            // Ensure it has the return-date class
                            $cell.addClass('return-date');
                        }
                    }
                });
            }
            
            // Always block past dates regardless of stock
            blockPastDates();
            
            // Trigger event for other scripts
            $(document).trigger('stock-data-updated', [stockQuantity, reservationCounts]);
            
        }, 500); // Wait for calendar to fully render
    }
    
    /**
     * Reset all calendar cells to default state
     */
    function resetCalendarCells() {
        // First, save and restore the weekend classes - ensure weekends are correctly marked
        const weekendCells = $('.day-cell.weekend').map(function() {
            return $(this).data('date');
        }).get();
        
        // Get all date cells
        const $dayCells = $('.day-cell');
        
        // Clear all classes and status for all cells
        $dayCells.each(function() {
            const $cell = $(this);
            const dateStr = $cell.data('date');
            
            // Skip empty cells
            if (!dateStr) return;
            
            // Force the cell to be enabled by default
            $cell.removeClass('disabled past-date partial-booking selected return-date early-return-date')
                 .attr('data-selectable', 'true')
                 .removeAttr('data-reservations')
                 .removeAttr('title');
                 
            // Add weekend class back if this was a weekend
            if (weekendCells.includes(dateStr)) {
                $cell.addClass('weekend');
            }
            
            // Also reset today class
            const today = new Date();
            const formattedToday = formatDateISO(today);
            
            if (dateStr === formattedToday) {
                $cell.addClass('today');
            }
        });
        
        // Log that cells have been reset
        console.info('[Stock Integrator] Calendar cells reset to default state');
    }
    
    /**
     * Block past dates in the calendar
     */
    function blockPastDates() {
        // Get current date as string (YYYY-MM-DD) for easier comparison
        const today = new Date();
        const formattedToday = formatDateISO(today);
        
        // Debug log
        console.info('[Stock Integrator] Today is:', formattedToday);
        
        // Get all day cells
        $('.day-cell').each(function() {
            const $cell = $(this);
            const dateStr = $cell.data('date');
            
            if (!dateStr) return;
            
            // Compare date strings directly (YYYY-MM-DD format ensures correct ordering)
            if (dateStr < formattedToday) {
                $cell.addClass('disabled past-date')
                     .attr('data-selectable', 'false')
                     .attr('title', 'תאריך עבר - לא ניתן להזמנה');
                     
                console.log('[Stock Integrator] Marked past date:', dateStr);
            } else if (dateStr === formattedToday) {
                // Today is special - check if we're past cutoff time
                const currentHour = new Date().getHours();
                const cutoffHour = window.datepickerCutoffHour || 11; // Default cutoff at 11 AM
                
                if (currentHour >= cutoffHour) {
                    $cell.addClass('disabled past-date')
                         .attr('data-selectable', 'false')
                         .attr('title', 'כבר מאוחר מדי להזמין היום');
                         
                    console.log('[Stock Integrator] Today is past cutoff time:', currentHour, '>=', cutoffHour);
                } else {
                    // Today is available (before cutoff)
                    $cell.addClass('today')
                         .removeClass('disabled')
                         .attr('data-selectable', 'true')
                         .attr('title', 'זמין להזמנה היום');
                         
                    console.log('[Stock Integrator] Today is available (before cutoff):', currentHour, '<', cutoffHour);
                }
            } else {
                // Future date - ensure it's not incorrectly marked as past
                $cell.removeClass('past-date');
            }
        });
    }
    
})(jQuery);
