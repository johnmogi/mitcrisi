/**
 * Stock-Based Reservation Debug Helper
 * Shows a debug info banner on product pages to verify stock-based date filtering
 */
(function($) {
    'use strict';
    
    // Initialize on document ready
    $(document).ready(function() {
        // Only run on product pages
        if (!$('body').hasClass('single-product')) {
            return;
        }
        
        console.log('Stock debug helper initialized');
        
        // Create info banner element but don't show it yet
        const $infoBanner = $('<div id="stock-debug-info" style="position: fixed; bottom: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 10px; font-size: 12px; z-index: 9999; border-top-left-radius: 5px; display: none;">Stock Debug: Loading...</div>');
        $('body').append($infoBanner);
        
        // Get product ID from the add to cart form
        const productId = $('form.cart').data('product_id') || $('input[name="add-to-cart"]').val();
        
        if (productId) {
            // Directly fetch stock data
            fetchStockData(productId);
        }
        
        // Hook into the AJAX response for reserved dates
        $(document).ajaxSuccess(function(event, xhr, settings) {
            if (settings.data && settings.data.indexOf('action=get_reserved_dates') !== -1) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success && response.data) {
                        // Log the complete response for debugging
                        console.log('📦 Full AJAX Response:', response);
                        
                        // Update debug banner with stock info
                        const stock = response.data.stock_qty || 0;
                        const initialStock = response.data.initial_stock || stock; // Fallback to current stock if initial not available
                        const showingReserved = response.data.showing_reserved;
                        const reservedCount = response.data.reserved_dates ? response.data.reserved_dates.length : 0;
                        
                        // Log raw values for debugging
                        console.log('🔍 Raw values:', {
                            stock_qty: response.data.stock_qty,
                            initial_stock: response.data.initial_stock,
                            reserved_dates: response.data.reserved_dates,
                            buffer_dates: response.data.buffer_dates
                        });
                        
                        // Only show debug panel if WP_DEBUG is likely enabled
                        if (response.data.debug_info) {
                            const debugMsg = `Stock: ${stock} | ${showingReserved ? '✅' : '❌'} Reserved Dates | Count: ${reservedCount}`;
                            $('#stock-debug-info').html(debugMsg).show();
                            
                            // Hide after 10 seconds
                            setTimeout(function() {
                                $('#stock-debug-info').fadeOut();
                            }, 10000);
                        }
                        
                        // Log details to console
                        console.group('📅 STOCK-BASED DATE FILTERING');
                        console.log('🔄 Current Stock:', stock, `(Type: ${typeof stock})`);
                        console.log('🏷️ Initial Stock:', initialStock, `(Type: ${typeof initialStock})`);
                        console.log('📊 Available Stock:', initialStock - reservedCount, `(Initial: ${initialStock} - Reserved: ${reservedCount})`);
                        console.log('👀 Showing Reserved Dates:', showingReserved, `(Initial Stock ≤ 2: ${initialStock <= 2})`);
                        console.log('📆 Reserved Date Count:', reservedCount);
                        
                        // Add total stock breakdown to help with debugging
                        console.group('💱 STOCK BREAKDOWN');
                        console.log('☀️ Initial Stock (Total):', initialStock);
                        console.log('➖ Reserved Dates:', reservedCount);
                        console.log('= 📦 Available Stock:', initialStock - reservedCount);
                        console.groupEnd();
                        
                        if (reservedCount > 0) {
                            console.group('🗓️ Reserved Dates:');
                            response.data.reserved_dates.forEach((date, index) => {
                                console.log(`${index + 1}. ${date}`);
                            });
                            console.groupEnd();
                        } else {
                            console.log('ℹ️ No reserved dates found');
                        }
                        
                        // Log buffer dates if they exist
                        if (response.data.buffer_dates && response.data.buffer_dates.length > 0) {
                            console.group('⏳ Buffer Dates:');
                            response.data.buffer_dates.forEach((date, index) => {
                                console.log(`${index + 1}. ${date}`);
                            });
                            console.groupEnd();
                        }
                        
                        console.groupEnd();
                        
                        // Update debug banner with more detailed info
                        const debugMsg = `Stock: ${stock} (Initial: ${initialStock}) | Avail: ${initialStock - reservedCount} | ${showingReserved ? '✅' : '❌'} Reserved | Count: ${reservedCount}`;
                        $('#stock-debug-info').html(debugMsg).show();
                        
                        // Additionally, let's double-check that the calendar UI reflects this
                        setTimeout(checkCalendarDisabledDates, 500);
                    }
                } catch (e) {
                    console.error('Error processing AJAX response:', e);
                }
            }
        });
    });
    
    /**
     * Directly fetch stock data for a product
     */
    function fetchStockData(productId) {
        console.log('🔍 Directly fetching stock data for product ID:', productId);
        
        // Make AJAX request to get initial stock
        $.ajax({
            url: '/wp-admin/admin-ajax.php',
            type: 'POST',
            data: {
                action: 'get_product_stock_data',
                product_id: productId,
                nonce: typeof mitnafunFrontend !== 'undefined' ? mitnafunFrontend.nonce : ''
            },
            success: function(response) {
                console.group('📊 DIRECT STOCK DATA FETCH');
                console.log('Response:', response);
                
                if (response.success && response.data) {
                    const stock = response.data.stock_qty || 0;
                    const initialStock = response.data.initial_stock || 0;
                    
                    console.log('Current Stock:', stock);
                    console.log('Initial Stock:', initialStock);
                    
                    // Update debug banner
                    $('#stock-debug-info').html(`Stock: ${stock} | Initial: ${initialStock}`).show();
                    
                    // Add legacy stock display for compatibility
                    console.group('💱 STOCK BREAKDOWN');
                    console.log('☀️ Initial Stock (Total):', initialStock);
                    console.log('➖ Current Orders: N/A');
                    console.log('= 📦 Available Stock:', initialStock);
                    console.groupEnd();
                } else {
                    console.log('❌ Failed to get stock data');
                }
                
                console.groupEnd();
            },
            error: function(xhr, status, error) {
                console.error('❌ Error fetching stock data:', error);
            }
        });
    }
    
    /**
     * Check that calendar disabled dates match our expectation
     */
    function checkCalendarDisabledDates() {
        try {
            const $disabledDates = $('.day-cell.disabled:not(.weekend):not(.empty)');
            console.log('👉 Calendar check: Found', $disabledDates.length, 'disabled date cells (excluding weekends/empty)');
            
            // Check if any day is incorrectly disabled when stock > 1
            if ($('.stock.in-stock').text().trim().startsWith('1')) {
                console.log('👉 Stock is 1, disabled dates are expected');
            } else {
                if ($disabledDates.length > 0) {
                    console.warn('⚠️ Found disabled dates despite stock > 1');
                    
                    // Find all disabled dates (for debugging purposes)
                    const disabledDatesList = [];
                    $disabledDates.each(function() {
                        disabledDatesList.push($(this).data('date') + ' (' + $(this).text().trim() + ')');
                    });
                    console.log('Disabled dates found:', disabledDatesList);
                } else {
                    console.log('✅ Calendar UI correctly shows no disabled dates (stock > 1)');
                }
            }
        } catch (e) {
            console.error('Error checking calendar dates:', e);
        }
    }
    
})(jQuery);
