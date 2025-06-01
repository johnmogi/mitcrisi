# Bugfix: Fallback Calendar Two-Step Date Selection

**Date:** 2025-04-24

## Overview

This document summarizes the recent bug fixes and improvements made to the fallback calendar system in the Mitnafun rental booking theme. The goal was to restore reliable two-step date selection and ensure seamless WooCommerce checkout integration when AirDatepicker is unavailable.

### Key Objectives

- Enable users to select a start date and an end date in two clicks.
- Validate selected ranges against reserved dates, maximum rental length, and bookability.
- Provide clear Hebrew UI feedback and a confirmation step.
- Set hidden form fields for WooCommerce and enable the Add to Cart button.
- Improve UX by scrolling to checkout and allowing selection resets.

---

## Changes Implemented

### 1. setupDateSelectionHandlers

- Delegated click events on `.day-cell` to handle dynamic content.
- Ignored clicks on disabled or unavailable dates.
- First click: sets the start date and shows a single-date info message.
- Second click: sets the end date, sorts dates, and triggers validation.
- Automatically resets selection if two dates already exist.

### 2. validateDateRange

- Ensures two dates are selected and orders them chronologically.
- Calculates rental days excluding Saturdays (`calculateRentalDaysExcludingSaturdays`).
- Checks for reserved dates in the range (`rangeContainsReservedDates`).
- Enforces a maximum of 7 rental days (configurable via `window.maxRentalDays`).
- Validates each day’s bookability (`isDateBookable`).
- Displays Hebrew error messages for invalid selections.

### 3. updateSelectedRangeDisplay

- Injects or updates the `#date-validation-message` container.
- Shows:
  - **Info**: single date selected — prompts to pick an end date.
  - **Pending**: valid range selected — presents the green "אשר תאריכים" button.
  - **Success**: dates confirmed — shows a summary with a "[שנה בחירה]" link.
- Binds click handlers for confirm and clear actions.

### 4. confirmSelectedDates

- Marks `window.datesConfirmed = true` and applies the `confirmed` CSS class.
- Formats dates as `DD.MM.YYYY` and calculates rental days.
- Sets or appends hidden inputs:
  - `rental_start_date`
  - `rental_end_date`
  - `rental_days`
- Stores confirmed dates and days in `localStorage`.
- Forces pickup time to **13:00** and persists it.
- Enables the Add to Cart button and scrolls to it for user convenience.
- Calls `applyPerDayPricing` and shows return/weekend notices.

### 5. Utility Functions

- **clearAllDateSelections()** & **clearDateSelection()**:
  - Reset UI classes, hide messages, and disable the Add to Cart button.
- **checkIfRangeIncludesFriday()**:
  - Shows a weekend return notice if the range spans a Friday.

### 6. Day Count & Button Enable Fixes

- `calculateRentalDaysExcludingSaturdays` now counts days properly: selecting N dates yields N-1 rental days, skipping Saturdays.
- Added logic in `confirmSelectedDates` & `updateSelectedRangeDisplay` to enable the Add to Cart button by removing the `disabled` attribute, class, and setting `aria-disabled="false"`.
- Styled the “אשר תאריכים” confirmation button with a green background, white text, and bold font for better UX.

### 7. Weekend Notice & Error Suppression

- `.weekend-return-notice` is now always hidden regardless of booking spanning a weekend to avoid duplicate messaging.
- Commented out `console.error` in `rental-dates-handler.js` to suppress AirDatepicker initialization errors; fallback UI displays a styled error message instead.

### 8. Template Adjustments

- Commented out the `#simple-notice` block in `content-single-product.php` to remove placeholder messaging.
- Updated `.example-breakdown` markup and RTL formatting for the example price breakdown in the WooCommerce template.
- Restyled `#weekend-return-notice` in the template with updated copy and CSS for clarity.

### 9. Next Steps: Same-Day Booking Debugging

- Simulate Israel UTC+2 at cutoff boundary (earliestPickupHour - 2) to confirm `isDateBookable` behaves correctly for today.
- Write unit tests or mock `Date` to test same-day booking logic at different hours.
- Add debug logs for `currentHourInIsrael` vs `cutoffHour` in staging to monitor behavior.
- Verify UI classes (`disabled`, `bookable`) update correctly for same-day selection before and after cutoff.

## 2023-06-07 Updates

### Fixed JavaScript Syntax Errors
- Removed multiple duplicate `confirmSelectedDates` functions that were causing JavaScript syntax errors
- Consolidated all date confirmation logic into a single, robust implementation
- Ensured proper variable declarations to prevent redeclaration errors
- Added missing `setupPickupTimeField` function that was causing a reference error

### Improved Calendar Functionality Stability
- Ensured consistent handling of date validation and confirmation
- Fixed potential issues with rental day calculations
- Improved error messaging and UI feedback throughout the booking process
- Added proper validation for same-day bookings
- Fixed UI notices to only appear when relevant (not preemptively)

### Same-Day Booking Improvements
- Implemented more user-friendly same-day booking restrictions
- Late booking notices now only appear when user selects today's date (not before any selection)
- Added comprehensive date range validation that handles same-day booking constraints
- Made error messages more clear about why same-day booking might be restricted

### Next Steps
- Test the calendar thoroughly with different date selections
- Verify that late same-day booking restrictions work correctly
- Confirm duplicate order prevention is functioning as expected

---

## Verification Steps

1. Load a product page where AirDatepicker is disabled.
2. Click any available date cell — it should highlight as the start.
3. Click a second date — valid ranges highlight and show "אשר תאריכים".
4. Click "אשר תאריכים" — confirmation message appears, fields set, and the Add to Cart button is enabled.
5. Inspect hidden `rental_*` inputs and local/session storage for correct values.

---

## Next Steps

- Monitor edge cases (same-day booking, max days, disabled dates).
- Incrementally re-add advanced reserved-date logic as needed.
- Review and refine calendar CSS in `styles.css` for visual consistency.
