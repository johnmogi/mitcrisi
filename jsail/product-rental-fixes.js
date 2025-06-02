/**
 * Product Rental Fixes
 * - Adds Order Now button
 * - Handles checkout redirect
 * - Works with existing datepicker
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only run on product pages with rental form
    const cartForm = document.querySelector('form.cart');
    if (!cartForm) return;

    // 1. Hide quantity container
    const quantityContainer = document.querySelector('.quantity-container');
    if (quantityContainer) {
        quantityContainer.style.display = 'none';
    }

    // 2. Add Order Now button
    addOrderButton(cartForm);

    // 3. Watch for date changes to enable/disable buttons
    setupDateMonitoring();
});

/**
 * Add Order Now button next to Add to Cart
 */
function addOrderButton(cartForm) {
    const addToCartBtn = document.querySelector('.single_add_to_cart_button');
    if (!addToCartBtn || document.querySelector('.btn-order-now')) return;

    // Create order button
    const orderBtn = addToCartBtn.cloneNode(true);
    orderBtn.classList.add('btn-order-now', 'btn-yellow');
    orderBtn.classList.remove('alt');
    orderBtn.textContent = 'הזמן';

    // Create wrap if needed
    if (!addToCartBtn.parentElement.classList.contains('btn-wrap')) {
        const btnWrap = document.createElement('div');
        btnWrap.className = 'btn-wrap';
        addToCartBtn.parentNode.insertBefore(btnWrap, addToCartBtn);
        btnWrap.appendChild(addToCartBtn);
        btnWrap.appendChild(orderBtn);
    } else {
        // Add to existing wrap
        addToCartBtn.parentNode.insertBefore(orderBtn, addToCartBtn.nextSibling);
    }

    // Add click handler
    orderBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const redirectInput = document.querySelector('input[name="redirect"]');
        if (redirectInput) {
            redirectInput.value = 'checkout';
        }
        cartForm.submit();
    });
}

/**
 * Monitor date selection and update button states
 */
function setupDateMonitoring() {
    const rentalDatesInput = document.getElementById('rental_dates');
    if (!rentalDatesInput) return;

    // Check initial state
    updateButtonState(rentalDatesInput.value);

    // Watch for changes
    rentalDatesInput.addEventListener('change', function() {
        updateButtonState(this.value);
    });

    // Also watch for datepicker interactions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.air-datepicker-cell')) {
            setTimeout(() => {
                updateButtonState(rentalDatesInput.value);
            }, 100);
        }
    });

    // Periodic check in case of dynamic updates
    setInterval(() => {
        updateButtonState(rentalDatesInput.value);
    }, 1000);
}

/**
 * Update button states based on date selection
 */
function updateButtonState(dateValue) {
    const buttons = document.querySelectorAll('.single_add_to_cart_button, .btn-order-now');
    if (!buttons.length) return;

    const hasDates = dateValue && dateValue.trim() !== '';

    buttons.forEach(button => {
        if (hasDates) {
            button.classList.remove('disabled');
            button.disabled = false;
        } else {
            button.classList.add('disabled');
            button.disabled = true;
        }
    });
}
