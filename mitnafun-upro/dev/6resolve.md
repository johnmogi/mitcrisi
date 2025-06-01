# Mitnafun Calendar System Rebuild Plan

## Background
The current calendar implementation for the Mitnafun rental system has accumulated several issues:
- Weekend booking validation problems
- Inconsistent price calculations, especially with weekend selections
- UI styling issues with the pickup time field
- No reset functionality for date selections
- Styling persistence issues requiring frequent fixes

## Rebuild Approach
Rather than continuing to patch the existing system, a complete rebuild is recommended for better maintainability and reliability.

## Implementation Timeline (8-12 prompts)

### Phase 1: Analysis & Planning (1-2 prompts)
- Integration Points:
  - Single-product template (`woocommerce/content-single-product.php`) where the calendar is rendered.
  - WooCommerce AJAX endpoint (`admin-ajax.php`) to fetch reservation dates.
  - Product meta fields (`_rental_start_date`, `_rental_end_date`, `_rental_pickup_time`, `_rental_discount_type`, `_rental_discount_value`).
  - Script enqueue & localization in `functions.php` via `wp_enqueue_script` and `wp_localize_script`.
- User Interactions & Requirements:
  - Date-range selection with visual cues for available, reserved, and joinable days.
  - Same-day booking cutoff (2 hours before pickup time).
  - Joining bookings at reservation boundaries (start/end).
  - Weekend toggle (enable/disable Saturdays/Shabbat and Sundays).
  - Reset selection functionality.
  - Confirmation step to enable "Add to Cart" and auto-scroll.
  - Dynamic price breakdown display with tiered discounts.
- Calendar Library & Approach:
  - Flatpickr for date-range picker (RTL support, disable callback, custom styling).
  - jQuery for DOM manipulation and AJAX requests.
  - Patch existing `mitnafun-calendar.js` to support multi-instance initialization and live-data fetch.

### Phase 2: Core Calendar Implementation (2-3 prompts)
- Step 2.1: Setup calendar container markup in `content-single-product.php` or test page with unique IDs/data-attributes.
- Step 2.2: Enqueue Flatpickr JS/CSS in `functions.php` to ensure assets load correctly before init.
- Step 2.3: Update `mitnafun-calendar.js`:
  * Cache DOM elements (`cacheElements()`): container, start/end inputs, validation message area.
  * Implement `processReservedDates()`: read `window.bookedDates` or AJAX data into an array of YYYY-MM-DD strings.
  * Implement `initFlatpickr()`:
    - Use `mode: 'range'`, `inline: true`, and `locale` from options.
    - Provide `disable` callback to block Saturdays (if weekends disabled) and reserved dates.
  * Add event handlers:
    - `onChange`: call `validateDateRange()`, update hidden date fields, and trigger `updatePriceBreakdown()`.
    - `onOpen`/`onMonthChange`: call `applyCustomDayStyles()` to mark reserved and joinable dates.
- Step 2.4: Add custom day CSS in `addCustomStyles()`: `.flatpickr-day.reserved`, `.flatpickr-day.weekend`, `.flatpickr-day.joinable`.
- Step 2.5: Manual test:
  - Toggle weekends on/off, pick a valid range avoiding disabled days.
  - Confirm reserved days block selection and joinable boundaries work.
  - Verify date fields and price container update correctly.

### Phase 3: Hebrew/RTL Support (1 prompt)
- Ensure proper Hebrew text display
- Implement RTL layout adjustments
- Localize all text elements

### Phase 4: Price Calculation (1-2 prompts)
- Implement clean price calculation logic
- Support for percentage and fixed discounts
- Create price breakdown display

### Phase 5: Pickup Time Integration (1 prompt)
- Implement pickup time selection interface
- Fix UI styling issues from the previous implementation
- Connect to form submission process

### Phase 6: Visual Styling (1-2 prompts)
- Implement Airbnb-style visual elements
- Ensure consistent styling across all states
- Add hover effects and transitions

### Phase 7: Testing & Refinement (1-2 prompts)
- Test all functionality thoroughly
- Address edge cases
- Implement smooth transition from old to new system

## Implementation Strategy
1. Create new implementation without modifying existing code
2. Test thoroughly to ensure all functionality works correctly
3. Switch over by disabling old calendar code and enabling new implementation

This approach minimizes risk by allowing fallback to the existing system if needed.

## Key Features to Include
1. Weekend booking support
2. Reset button functionality
3. Clear visual indication of selection states
4. Consistent price calculation with discounts
5. Properly styled pickup time fields
6. Comprehensive error handling
7. Support for RTL and Hebrew localization

## Patch Plan

To address issues via targeted patches rather than a full rebuild:

1. Inject data-attributes & initialization logic for multiple calendars in the existing JS (≈ 45 min)
2. Hook the existing AJAX endpoint into the calendar class to fetch/update live reservation data (≈ 45 min)
3. Tweak CSS and template markup for two calendars, controls, and legend (≈ 30 min)
4. Perform a quick QA pass: same-day cutoff, join-on-boundary logic, weekend toggles (≈ 45 min)
5. Polish error/success messages, minor RTL/hebrew layout fixes (≈ 30 min)

**Total Estimated Time: ≈ 3.5 hours**

Next Steps:
- Review this patch plan and confirm before applying edits to `mitnafun-calendar.js`.
- Proceed step-by-step: start with JS patch for multi-calendar support.
