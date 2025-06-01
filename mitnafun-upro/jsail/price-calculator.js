/**
 * Mitnafun Price Calculator - Discount Functionality
 * 
 * This file integrates with the fallback calendar system to display
 * multi-day discount pricing on product pages.
 */

(function($) {
    'use strict';
    
    // DIRECT INTEGRATION: Immediately hook into the rental fields after document ready
    $(document).ready(function() {
        setTimeout(function() {
            // Check if dates are already selected
            const dateRange = $('#rental_dates').val();
            const rentalDays = $('#rental_days').val();
            
            console.log('🚀 DIRECT INTEGRATION - Initial check:', { dateRange, rentalDays });
            
            if (dateRange && rentalDays) {
                createDiscountDisplay();
            }
            
            // Also set up a hook to monitor for changes to the rental_days field
            observeFormFieldChanges();
        }, 1000); // Wait 1 second after page load to ensure calendar has initialized
    });

    // Initialize on document ready
    $(document).ready(function() {
        initPriceCalculator();
    });

    /**
     * Initialize the price calculator by setting up required event listeners
     */
    function initPriceCalculator() {
        console.log('🔥 Price Calculator initializing');

        // Get the global values
        const basePrice = parseFloat(window.basePrice) || 0;
        const discountType = window.discountType || 'percentage';
        const discountValue = parseInt(window.discountValue) || 50;

        console.log('🔥 Price Calculator using:', { basePrice, discountType, discountValue });

        // DIRECT INSERTION - Create a MutationObserver to watch for changes to validation message
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const validationMsg = document.getElementById('date-validation-message');
                    if (validationMsg && validationMsg.style.display === 'block') {
                        console.log('📌 OBSERVER: Date validation message is visible - calculating discount');
                        setTimeout(function() {
                            const days = parseInt($('#rental_days').val());
                            const price = parseFloat(window.basePrice);
                            console.log('📌 Using direct values:', { days, price });
                            updatePriceBreakdown(price, days, 'percentage', 50);
                        }, 100);
                    }
                }
            });
        });

        // Start observing the validation message
        const validationMsg = document.getElementById('date-validation-message');
        if (validationMsg) {
            observer.observe(validationMsg, { attributes: true });
            console.log('📌 Observer attached to date validation message');
        }

        // Directly hook into your fallback calendar system by inserting our script
        // after where the calendar system calculates the price
        if (typeof window.calculateRentalPrice === 'function') {
            const originalCalculateRentalPrice = window.calculateRentalPrice;
            window.calculateRentalPrice = function() {
                const result = originalCalculateRentalPrice.apply(this, arguments);
                console.log('🔥 Intercepted calculateRentalPrice - result:', result);
                
                // After calculation, run our price breakdown
                const days = parseInt($('#rental_days').val());
                updatePriceBreakdown(basePrice, days, discountType, discountValue);
                
                return result;
            };
            console.log('🔥 Successfully hooked into calculateRentalPrice function');
        }

        // Also listen for the clear date selection link
        $(document).on('click', '#clear-date-selection', function(e) {
            console.log('🔥 Date selection cleared, removing breakdown');
            $('.mitnafun-breakdown').remove();
        });

        // Try immediate calculation in case dates are already selected
        setTimeout(function() {
            if ($('#rental_dates').val()) {
                console.log('🔥 Initial calculation for existing dates');
                updatePriceFromRentalFields();
                createDiscountDisplay(); // Also try the direct method
            }
        }, 500);
    }
    
    /**
     * Get data from the rental fields and trigger price breakdown calculation
     */
    function updatePriceFromRentalFields() {
        // Get values directly from the calendar system fields
        const rentalDays = parseInt($('#rental_days').val(), 10);
        const basePrice = parseFloat(window.basePrice) || 0;
        const discountType = window.discountType || 'percentage';
        const discountValue = parseInt(window.discountValue) || 50;
        
        console.log('🔥 Updating price breakdown with:', { rentalDays, basePrice, discountType, discountValue });
        
        // Only proceed if we have valid rental days
        if (rentalDays && !isNaN(rentalDays) && basePrice) {
            // Call the price breakdown function with our values
            updatePriceBreakdown(basePrice, rentalDays, discountType, discountValue);
        } else {
            console.log('🔥 Missing required values for price calculation', { rentalDays, basePrice });
        }
    }
    
    /**
     * Create discount display by directly reading form values
     * This is a more direct approach that doesn't rely on hooks
     */
    function createDiscountDisplay() {
        const rentalDays = parseInt($('#rental_days').val(), 10);
        const basePrice = parseFloat(window.basePrice) || 0;
        const discountType = window.discountType || 'percentage';
        const discountValue = parseInt(window.discountValue) || 50;
        const dateValidationMsg = $('#date-validation-message');
        // If validation message is visible, assume dates are valid and show breakdown
        if (dateValidationMsg.length && dateValidationMsg.css('display') === 'block' && rentalDays && !isNaN(rentalDays) && basePrice) {
            window.mitnafunBreakdownShouldShow = true;
            updatePriceBreakdown(basePrice, rentalDays, discountType, discountValue);
        } else {
            // Hide breakdown if dates become invalid
            window.mitnafunBreakdownShouldShow = false;
            $('.mitnafun-breakdown').remove();
        }
    }
    
    /**
     * Direct HTML display of discount breakdown without relying on existing DOM elements
     */
    function showDirectDiscountBreakdown(basePrice, totalDays, discountType, discountValue) {
        console.log('🔥 DIRECT DISCOUNT BREAKDOWN:', { basePrice, totalDays, discountType, discountValue });
        
        // Calculate prices
        let additionalDaysPrice = 0;
        let savings = 0;
        let totalPrice = basePrice; // First day is always full price
        
        // If more than one day, calculate additional days with discount
        if (totalDays > 1) {
            const additionalDays = totalDays - 1;
            
            // Calculate based on discount type
            if (discountType === 'percentage') {
                // Calculate discounted price for additional days
                const discountedDailyRate = basePrice * (1 - (discountValue / 100));
                additionalDaysPrice = discountedDailyRate * additionalDays;
                
                // Calculate savings (what full price would have been minus actual price)
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            } else {
                // Fixed discount
                const discountedDailyRate = Math.max(0, basePrice - discountValue);
                additionalDaysPrice = discountedDailyRate * additionalDays;
                
                // Calculate savings (what full price would have been minus actual price)
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            }
            
            // Add to total price
            totalPrice += additionalDaysPrice;
        }
        
        // Ensure values are properly rounded for display
        totalPrice = Math.round(totalPrice * 100) / 100;
        additionalDaysPrice = Math.round(additionalDaysPrice * 100) / 100;
        savings = Math.round(savings * 100) / 100;
        
        // Format the discount label
        const discountLabel = (discountType === 'percentage') 
            ? discountValue + '% הנחה' 
            : discountValue + ' ₪ הנחה';
        
        // Format price with Hebrew currency formatter
        function formatCurrency(amount) {
            return new Intl.NumberFormat('he-IL', { 
                style: 'currency', 
                currency: 'ILS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }
        
        // First, remove any existing discounts
        $('.mitnafun-breakdown').remove();

// Enhanced: Show breakdown after confirmation with debug and retry
(function() {
    let breakdownRetryCount = 0;
    const maxBreakdownRetries = 3;

    function injectBreakdownWithDebug(basePrice, totalDays, discountType, discountValue, additionalDaysPrice, discountLabel, totalPrice, savings) {
        $('.mitnafun-breakdown').remove();
        console.log('[Breakdown Debug] Attempting injection', {
            basePrice, totalDays, discountType, discountValue, additionalDaysPrice, discountLabel, totalPrice, savings,
            mitnafunBreakdownShouldShow: window.mitnafunBreakdownShouldShow,
            fallbackCalendarExists: $('.fallback-calendar').length,
            retry: breakdownRetryCount
        });

        if (!window.mitnafunBreakdownShouldShow) {
            console.warn('[Breakdown Debug] mitnafunBreakdownShouldShow is false, not injecting breakdown.');
            return;
        }
        if (!$('.fallback-calendar').length && breakdownRetryCount < maxBreakdownRetries) {
            console.warn('[Breakdown Debug] .fallback-calendar not found, retrying injection...');
            breakdownRetryCount++;
            setTimeout(function() {
                injectBreakdownWithDebug(basePrice, totalDays, discountType, discountValue, additionalDaysPrice, discountLabel, totalPrice, savings);
            }, 500);
            return;
        }
        breakdownRetryCount = 0; // Reset on success
        const directHtml = `
        <div class="mitnafun-breakdown" style="border: 2px solid #43a047; padding: 18px; margin: 18px 0; background: linear-gradient(90deg, #e8f5e9 60%, #b9f6ca 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(67,160,71,0.08);">
            <p style="font-weight: bold; margin-bottom: 10px; font-size: 18px; color: #388e3c; display: flex; align-items: center;">
                <span style="font-size: 22px; margin-left: 8px;">✅</span> פירוט תמחור לתקופת השכירות:
            </p>
            <ul style="list-style: none; padding-right: 15px; margin: 0 0 15px 0;">
                <li style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>יום ראשון:</span>
                    <span>${formatCurrency(basePrice)} <span style="color: #388e3c;">(מחיר מלא)</span></span>
                </li>
                ${totalDays > 1 ? `
                <li style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>${totalDays - 1} ימים נוספים:</span>
                    <span>${formatCurrency(additionalDaysPrice)} <span style="color: #388e3c; font-weight: bold">(${discountLabel})</span></span>
                </li>` : ''}
            </ul>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #43a047;">
                <p style="font-weight: bold; margin: 8px 0 0; font-size: 20px; display: flex; justify-content: space-between; color: #2e7d32;">
                    <span>סה"כ לתשלום:</span>
                    <span>${formatCurrency(totalPrice)}</span>
                </p>
                ${savings > 0 ? `
                <p style="color: #43a047; text-align: center; margin: 10px 0 0; font-weight: bold; font-size: 16px;">
                    🎉 חסכת ${formatCurrency(savings)} עם ההנחה לימים נוספים!
                </p>` : ''}
            </div>
        </div>
        `;
        if ($('.fallback-calendar').length) {
            $('.fallback-calendar').after(directHtml);
            console.log('[Breakdown Debug] Breakdown injected after .fallback-calendar');
        } else {
            $('form.cart').before(directHtml);
            console.log('[Breakdown Debug] Breakdown injected before form.cart as fallback');
        }
    }

    // Expose for manual debugging
    window.forceBreakdownRetry = function() {
        breakdownRetryCount = 0;
        // Use last known values if available, else use defaults
        if (window.lastBreakdownArgs) {
            injectBreakdownWithDebug.apply(null, window.lastBreakdownArgs);
        } else {
            alert('No breakdown args available for retry');
        }
    };

    // Patch updatePriceBreakdown to use the new debug-injector
    const originalUpdatePriceBreakdown = window.updatePriceBreakdown;
    window.updatePriceBreakdown = function(basePrice, totalDays, discountType, discountValue) {
        // Compute all values as in the original
        let additionalDaysPrice = 0;
        let savings = 0;
        let totalPrice = basePrice;
        if (totalDays > 1) {
            const additionalDays = totalDays - 1;
            if (discountType === 'percentage') {
                const discountedDailyRate = basePrice * (1 - (discountValue / 100));
                additionalDaysPrice = discountedDailyRate * additionalDays;
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            } else {
                const discountedDailyRate = Math.max(0, basePrice - discountValue);
                additionalDaysPrice = discountedDailyRate * additionalDays;
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            }
            totalPrice += additionalDaysPrice;
        }
        const discountLabel = (discountType === 'percentage') 
            ? discountValue + '% הנחה' 
            : discountValue + ' ₪ הנחה';
        // Save args for manual retry
        window.lastBreakdownArgs = [basePrice, totalDays, discountType, discountValue, additionalDaysPrice, discountLabel, totalPrice, savings];
        injectBreakdownWithDebug(basePrice, totalDays, discountType, discountValue, additionalDaysPrice, discountLabel, totalPrice, savings);
    };
})();

        
        console.log('🔥 DIRECT PRICE BREAKDOWN INSERTED', { totalPrice, savings });
    }
    
    /**
     * Set up mutation observer to watch for changes to the rental_days field
     */
    function observeFormFieldChanges() {
        // Watch for changes to the rental_days hidden input
        const rentalDaysInput = document.getElementById('rental_days');
        if (rentalDaysInput) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        console.log('🔥 rental_days value changed to:', rentalDaysInput.value);
                        createDiscountDisplay();
                    }
                });
            });
            
            observer.observe(rentalDaysInput, { attributes: true });
            console.log('🔥 Observing rental_days field for changes');
            
            // Also check for form submissions
            $('form.cart').on('submit', function() {
                console.log('🔥 Form submission detected, checking discount');
                createDiscountDisplay();
            });
        }
        
        // Also watch for the validation message becoming visible
        const validationMsg = document.getElementById('date-validation-message');
        if (validationMsg) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (validationMsg.style.display === 'block') {
                            console.log('🔥 Validation message visible, creating discount display');
                            setTimeout(createDiscountDisplay, 100);
                        }
                    }
                });
            });
            
            observer.observe(validationMsg, { attributes: true });
        }
    }

    /**
     * Update the price breakdown display based on the selected rental period
     */
    // --- DEBUG/RETRY VERSION ONLY ---
    // All breakdown display logic is handled by this debug/retry version
    // Do not use any legacy or duplicate breakdown code
    // All triggers and observers must call this function
    function updatePriceBreakdown(basePrice, totalDays, discountType, discountValue) {
        console.log('🔥 Price calculation parameters:', {
            basePrice, 
            totalDays, 
            discountType, 
            discountValue
        });
        
        // Directly inject a debug message on the page to confirm JS execution
        $('form.cart').before('<div class="debug-marker" style="display:none;">Price calculator running</div>');

        if (!basePrice || isNaN(basePrice)) {
            console.error('Invalid basePrice:', basePrice);
            return;
        }
        
        // Calculate prices
        let additionalDaysPrice = 0;
        let savings = 0;
        let totalPrice = basePrice; // First day is always full price
        
        // If more than one day, calculate additional days with discount
        if (totalDays > 1) {
            const additionalDays = totalDays - 1;
            
            // Calculate based on discount type
            if (discountType === 'percentage') {
                // Calculate discounted price for additional days
                const discountedDailyRate = basePrice * (1 - (discountValue / 100));
                additionalDaysPrice = discountedDailyRate * additionalDays;
                
                // Calculate savings (what full price would have been minus actual price)
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            } else {
                // Fixed discount
                const discountedDailyRate = Math.max(0, basePrice - discountValue);
                additionalDaysPrice = discountedDailyRate * additionalDays;
                
                // Calculate savings (what full price would have been minus actual price)
                savings = (basePrice * additionalDays) - additionalDaysPrice;
            }
            
            // Add to total price
            totalPrice += additionalDaysPrice;
        }
        
        // Ensure values are properly rounded for display
        totalPrice = Math.round(totalPrice * 100) / 100;
        additionalDaysPrice = Math.round(additionalDaysPrice * 100) / 100;
        savings = Math.round(savings * 100) / 100;
        
        // Format the discount label
        const discountLabel = (discountType === 'percentage') 
            ? discountValue + '% הנחה' 
            : discountValue + ' ₪ הנחה';
        
        // Format price with Hebrew currency formatter
        function formatCurrency(amount) {
            return new Intl.NumberFormat('he-IL', { 
                style: 'currency', 
                currency: 'ILS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }
        
        // Create the updatePriceBreakdown function if it doesn't exist
        if (typeof window.updatePriceBreakdown !== 'function') {
            window.updatePriceBreakdown = function(basePrice, totalDays, discountType, discountValue) {
                console.log('Price breakdown:', {
                    basePrice: basePrice,
                    totalDays: totalDays,
                    discountType: discountType,
                    discountValue: discountValue
                });
                
                // Add the price breakdown logic directly here if needed
                // This is a fallback implementation
                
                // Calculate final price
                let finalPrice = basePrice;
                
                // Apply day multiplier
                if (totalDays > 1) {
                    finalPrice = basePrice * totalDays;
                }
                
                // Apply discount
                if (discountType === 'percentage' && discountValue > 0) {
                    const discountAmount = finalPrice * (discountValue / 100);
                    finalPrice = finalPrice - discountAmount;
                } else if (discountType === 'fixed' && discountValue > 0) {
                    finalPrice = finalPrice - discountValue;
                }
                
                return finalPrice;
            };
        }
        
        // Now safely call the function
        try {
            window.updatePriceBreakdown(basePrice, totalDays, discountType, discountValue);
        } catch(e) {
            console.error('Error in price breakdown:', e);
        }
    }

})(jQuery);
