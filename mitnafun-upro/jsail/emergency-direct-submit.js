/**
 * EMERGENCY DIRECT SUBMISSION HANDLER
 * This script runs BEFORE any other scripts and hooks directly to the form elements
 * Enables future bookings even with zero stock
 * Version 2.0 - Limited logging for production
 */

// Use an Immediately Invoked Function Expression to run before anything else
(function() {
    // Just one log to confirm loading
    console.log('🚒 Future Date Booking Handler Active');
    
    // Wait for the DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚒 DOM READY - Setting up emergency handlers');
        
        // Function to check if a date is in the future (3+ days)
        function isDateInFuture(dateStr) {
            if (!dateStr) return false;
            
            // Parse date in DD.MM.YYYY format
            const parts = dateStr.split('.');
            if (parts.length !== 3) return false;
            
            const date = new Date(parts[2], parts[1] - 1, parts[0]);
            const today = new Date();
            const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
            
            return diffDays >= 3;
        }
        
        // Function to check if selected dates are in the future
        function areSelectedDatesInFuture() {
            // Check rental_dates input
            const rentalDatesInput = document.getElementById('rental_dates');
            if (rentalDatesInput && rentalDatesInput.value) {
                const dates = rentalDatesInput.value.split(' - ');
                if (dates.length > 0 && isDateInFuture(dates[0])) {
                    return true;
                }
            }
            
            // Check if any future available date is selected
            const selectedStartDate = document.querySelector('.day-cell.selected-start.future-available');
            if (selectedStartDate) {
                return true;
            }
            
            // Check for any selected future dates
            const selectedDate = document.querySelector('.day-cell.selected-start');
            if (selectedDate) {
                const dateAttr = selectedDate.getAttribute('data-date');
                if (dateAttr) {
                    return isDateInFuture(dateAttr.replace(/\-/g, '.'));
                }
            }
            
            return false;
        }
        
        // Function to immediately enable all buttons
        function forceEnableAllButtons() {
            // Get all buttons
            const buttons = document.querySelectorAll('.single_add_to_cart_button');
            
            // Enable each button
            buttons.forEach(button => {
                button.disabled = false;
                button.removeAttribute('disabled');
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.setAttribute('aria-disabled', 'false');
            });
            
            // Hide any blocking messages
            const messages = document.querySelectorAll('#zero-stock-modal, #zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning, #duplicate-order-notice');
            messages.forEach(message => {
                if (message) message.style.display = 'none';
            });
        }
        
        // Create absolute direct submission function
        function directFutureDateSubmit(isCheckout) {
            console.log('🚒 EMERGENCY DIRECT SUBMISSION INITIATED');
            
            // Get product ID
            const productId = document.querySelector('button[name="add-to-cart"]')?.value || 
                            document.querySelector('input[name="add-to-cart"]')?.value;
            
            if (!productId) {
                console.error('🚨 Missing product ID');
                return;
            }
            
            // Get or create rental dates from selected calendar cells
            let rentalDates = document.getElementById('rental_dates')?.value;
            let rentalDays = document.getElementById('rental_days')?.value;
            
            // If rental dates are missing, get them from the calendar selection
            if (!rentalDates || rentalDates === '') {
                const startCell = document.querySelector('.day-cell.selected-start');
                const endCell = document.querySelector('.day-cell.selected-end');
                
                if (startCell && endCell) {
                    // Convert ISO dates to DD.MM.YYYY format
                    const startDate = startCell.getAttribute('data-date');
                    const endDate = endCell.getAttribute('data-date');
                    
                    if (startDate && endDate) {
                        // Convert YYYY-MM-DD to DD.MM.YYYY
                        const formatDate = (dateStr) => {
                            const parts = dateStr.split('-');
                            return `${parts[2]}.${parts[1]}.${parts[0]}`;
                        };
                        
                        // Create the rental dates string
                        rentalDates = `${formatDate(startDate)} - ${formatDate(endDate)}`;
                        
                        // Calculate rental days
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        rentalDays = diffDays;
                        
                        // FORCE UPDATE the input fields (critical step!)
                        if (document.getElementById('rental_dates')) {
                            document.getElementById('rental_dates').value = rentalDates;
                        }
                        
                        if (document.getElementById('rental_days')) {
                            document.getElementById('rental_days').value = rentalDays;
                        }
                        
                        console.log('💡 Created rental data from calendar cells:', { rentalDates, rentalDays });
                    }
                }
            }
            
            // Double check we have all required data
            if (!productId || !rentalDates) {
                console.error('🚨 Still missing required data', { productId, rentalDates, rentalDays });
                
                // Last resort: try direct form submission
                if (document.querySelector('form.cart')) {
                    console.log('💥 LAST RESORT: Direct form submission');
                    document.querySelector('form.cart').submit();
                }
                return;
            }
            
            // Create a form element
            const form = document.createElement('form');
            form.style.display = 'none';
            form.method = 'post';
            form.action = isCheckout ? '/checkout/' : window.location.href;
            
            // Add product ID
            const productIdInput = document.createElement('input');
            productIdInput.type = 'hidden';
            productIdInput.name = 'add-to-cart';
            productIdInput.value = productId;
            form.appendChild(productIdInput);
            
            // Add rental dates
            const datesInput = document.createElement('input');
            datesInput.type = 'hidden';
            datesInput.name = 'rental_dates';
            datesInput.value = rentalDates;
            form.appendChild(datesInput);
            
            // Add rental days
            const daysInput = document.createElement('input');
            daysInput.type = 'hidden';
            daysInput.name = 'rental_days';
            daysInput.value = rentalDays;
            form.appendChild(daysInput);
            
            // Add checkout flag if needed
            if (isCheckout) {
                const checkoutInput = document.createElement('input');
                checkoutInput.type = 'hidden';
                checkoutInput.name = 'checkout';
                checkoutInput.value = '1';
                form.appendChild(checkoutInput);
            }
            
            // Add the form to the document and submit
            document.body.appendChild(form);
            console.log('🚒 SUBMITTING EMERGENCY FORM', { isCheckout, productId, rentalDates, rentalDays });
            form.submit();
        }
        
        // Function to enable all calendar cells that are in the future
        function enableFutureDateCells() {
            const today = new Date();
            const allCells = document.querySelectorAll('.day-cell');
            
            allCells.forEach(cell => {
                const dateAttr = cell.getAttribute('data-date');
                if (dateAttr) {
                    const cellDate = new Date(dateAttr);
                    const diffDays = Math.ceil((cellDate - today) / (1000 * 60 * 60 * 24));
                    
                    // If date is at least 3 days in future, make it selectable
                    if (diffDays >= 3) {
                        cell.classList.remove('disabled');
                        cell.setAttribute('data-selectable', 'true');
                        cell.removeAttribute('title');
                        // Add the future-available class if not already present
                        if (!cell.classList.contains('future-available')) {
                            cell.classList.add('future-available');
                        }
                    }
                }
            });
        }
        
        // Function to set up the emergency handlers
        function setupEmergencyHandlers() {
            // Always run the date cell enabler regardless of current selection
            // This ensures future dates are always selectable
            enableFutureDateCells();
            
            // UNCONDITIONALLY enable buttons when this script runs
            // This ensures buttons are always clickable
            forceEnableAllButtons();
            
            // For past dates, just do the basic fixes but don't take over form submission
            if (!areSelectedDatesInFuture()) {
                return;
            }
            
            console.log('🚒 FUTURE DATES DETECTED - Setting up emergency handlers');
            
            // Find all relevant buttons
            const addToCartButtons = document.querySelectorAll('.single_add_to_cart_button:not(.btn-redirect)');
            const checkoutButtons = document.querySelectorAll('.single_add_to_cart_button.btn-redirect');
            
            // Add event listeners with the highest possible priority
            addToCartButtons.forEach(button => {
                // First remove any existing handlers
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add our handler that can't be overridden
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    console.log('🚒 ADD TO CART BUTTON CLICKED - Using emergency submission');
                    directFutureDateSubmit(false);
                    return false;
                }, true); // Use capture phase to ensure our handler runs first
            });
            
            checkoutButtons.forEach(button => {
                // First remove any existing handlers
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add our handler that can't be overridden
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    console.log('🚒 CHECKOUT BUTTON CLICKED - Using emergency submission');
                    directFutureDateSubmit(true);
                    return false;
                }, true); // Use capture phase to ensure our handler runs first
            });
            
            // Enable all buttons
            document.querySelectorAll('.single_add_to_cart_button').forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            });
            
            // Hide any zero stock messages
            const messages = document.querySelectorAll('#zero-stock-modal, #zero-stock-message-floating, #zero-stock-overlay, #empty-stock-warning');
            messages.forEach(message => {
                if (message) message.style.display = 'none';
            });
            
            console.log('🚒 EMERGENCY HANDLERS SETUP COMPLETE');
        }
        
        // Run now
        setupEmergencyHandlers();
        
        // Also run when dates are changed or confirmed
        document.addEventListener('change', function(e) {
            if (e.target && e.target.id === 'rental_dates') {
                setTimeout(setupEmergencyHandlers, 100);
            }
        });
        
        // Monitor clicks on confirm-dates buttons
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('confirm-dates')) {
                setTimeout(setupEmergencyHandlers, 300);
            }
        });
        
        // Run periodically to ensure compliance
        setInterval(setupEmergencyHandlers, 1000);
    });
})();
