/**
 * Stock-Aware Validation
 * Fixes the issue where dates are incorrectly shown as unavailable 
 * when there is still available stock
 */
jQuery(document).ready(function($) {
    console.log('Stock-aware validation loaded');
    
    // Wait for calendar to initialize
    setTimeout(function() {
        patchDateValidation();
    }, 1000);
    
    // Also run when the DOM might have changed
    $(document).on('calendar-initialized', patchDateValidation);
    
    /**
     * Patches the validateDateRange function to be stock-aware
     */
    function patchDateValidation() {
        // Ensure calendar system is loaded
        if (typeof window.validateDateRange !== 'function') {
            console.log('Calendar validation not found, will try again');
            setTimeout(patchDateValidation, 1000);
            return;
        }
        
        console.log('Patching validateDateRange to be stock-aware');
        
        // Save original function
        window._originalValidateDateRange = window.validateDateRange;
        
        // Override with stock-aware version
        window.validateDateRange = function() {
            // Get available stock
            const stockQuantity = window.stockQuantity || window.productStockQty || 1;
            
            // If only one item in stock, use the original validation
            if (stockQuantity <= 1) {
                return window._originalValidateDateRange();
            }
            
            // For multi-stock items, override the validation
            try {
                // Skip if no dates selected
                if (!window.selectedDates || window.selectedDates.length !== 2) {
                    return false;
                }
                
                // Sort selected dates
                const [startDate, endDate] = [...window.selectedDates].sort((a, b) => new Date(a) - new Date(b));
                
                console.log('Stock-aware validation for', formatDate(startDate), 'to', formatDate(endDate));
                
                // Get all dates in the range
                const dateRange = [];
                const currentDate = new Date(startDate);
                
                while (currentDate <= endDate) {
                    dateRange.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                // Check each date if it exceeds available stock
                let hasInsufficientStock = false;
                
                for (let i = 0; i < dateRange.length; i++) {
                    const dateISO = formatDateISO(dateRange[i]);
                    
                    // Skip weekends in validation
                    const dayOfWeek = dateRange[i].getDay();
                    if (dayOfWeek === 6) { // Saturday
                        continue;
                    }
                    
                    // Skip special dates (return, early-return)
                    if ((window.returnDates && window.returnDates.includes(dateISO)) ||
                        (window.earlyReturnDates && window.earlyReturnDates.includes(dateISO))) {
                        continue;
                    }
                    
                    // Check reservation count against stock
                    if (window.reservationCounts && window.reservationCounts[dateISO]) {
                        const count = window.reservationCounts[dateISO];
                        
                        if (count >= stockQuantity) {
                            console.log('Date exceeds stock:', dateISO, count, '>=', stockQuantity);
                            hasInsufficientStock = true;
                            break;
                        }
                    }
                }
                
                // If any date exceeds stock, show error
                if (hasInsufficientStock) {
                    updateSelectedRangeDisplay("טווח התאריכים מכיל תאריך שאינו זמין", 'error');
                    return false;
                }
                
                // Otherwise, validation passes
                return true;
            } catch (error) {
                console.error('Error in stock-aware validation:', error);
                // Fall back to original validation on error
                return window._originalValidateDateRange();
            }
        };
        
        // Helper function borrowed from calendar
        function formatDateISO(date) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        // Helper function borrowed from calendar
        function formatDate(date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        }
    }
});
