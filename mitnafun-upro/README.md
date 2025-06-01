# MitnaFun Rental Booking System

## Overview
A custom WooCommerce theme and rental booking system for MitnaFun, built on WordPress. Provides a robust calendar-based rental workflow, fully localized in Hebrew.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Features](#features)
4. [Recent Bug Fixes](#recent-bug-fixes)
5. [Known Weaknesses & Blame](#known-weaknesses--blame)
6. [Future Improvements](#future-improvements)

## Installation
1. Clone the repo into your WordPress `themes/` directory.
2. Activate the `mitnafun_upro` theme.
3. Ensure WooCommerce is installed and activated.
4. Import demo product settings if available.

## Configuration
- Set rental cutoff time and maximum rental days in `fallback-calendar.js` globals.
- Translation strings can be customized via `inc/checkout.php` filters.

## Features
- **Calendar-Based Booking**: Interactive fallback calendar with disabled dates for reservations and Shabbat.
- **Same-Day Booking Restriction**: Block bookings after cutoff hour (e.g., 11:00 for 13:00 pickup).
- **Hebrew Localization**: All front-end labels, messages, and headings in Hebrew.
- **Two-Step Confirmation**: Select date range then confirm before Add to Cart.
- **Dynamic Pricing Breakdown**: Calculates and displays rental cost with discounts.

## Recent Bug Fixes

### 1. Same-Day Booking Bypass
- **Issue**: Multiple rapid clicks on confirm allowed bypassing cutoff.
- **Fix**: In `fallback-calendar.js`, added double-check validation on confirm handler and disabled button on error.
- **Blame**: Initial implementation lacked defense-in-depth; `forceEnableToday` flag defaults allowed late bookings.

### 2. Reserved Dates Clearing on Reload
- **Issue**: After initial load, `calendar-test.js` reinitialized calendar with empty disabled dates, clearing reservations.
- **Fix**: Removed auto-reinit in `calendar-test.js`. Now only logs status and attempts recovery **if** calendar is empty, using `window.processedBookedDates`.
- **Blame**: Testing script (`calendar-test.js`) incorrectly used hardcoded empty array.

### 3. Unwanted Popup on Thank You Page
- **Issue**: Conditions popup (`#auto-popup`) appeared on thank you page.
- **Fix**: In `script.js`, updated popup trigger to exclude pages containing `.woocommerce-order` class.
- **Blame**: Trigger logic was too generic (`.checkout` class) and did not distinguish thank you view.

### 4. Duplicate Blocks on Thank You Page
- **Issue**: Breadcrumb and heading blocks duplicated due to including `order-received.php` within `thankyou.php`.
- **Fix**: Removed `wc_get_template('checkout/order-received.php')` calls and inlined success message directly in `thankyou.php`.
- **Blame**: Template override used both base and child template redundantly.

### 5. Cart Empty Redirect Loop
- **Issue**: Empty cart redirect loop on checkout.
- **Fix**: Updated `inc/checkout.php` to only redirect when cart contains items.
- **Blame**: Conditional check missing `!WC()->cart->is_empty()` guard.

### 6. Special Date Handling (Early Return & Return Date Booking)
- **Issue**: New booking rules (allowing last-day and day-before bookings) were blocked by old validation logic; missing message function.
- **Fix**: Overhauled `validateDateRange` and `confirmSelectedDates` in `fallback-calendar.js`:
  - Replaced all `showDateValidationMessage` calls with `updateSelectedRangeDisplay`.
  - Added detection of `window.returnDates` and `window.earlyReturnDates` to allow special dates.
  - Bypassed strict validation when these special dates are selected.
  - Displayed tailored Hebrew notices for each case (pickup delay or early return).
  - Simplified calendar UI rendering for single-day and range selections.
- **Files Changed**: `fallback-calendar.js`, `return-date-handler.js`, `early-return-handler.js`.
- **Blame**: Initial logic didn't account for new booking exceptions and lacked proper UI hooks.

### 7. Debug Logging Enhancements
- **Issue**: Hard to debug calendar date selection, validation, and UI update flows.
- **Fix**: Added `console.log` statements across key functions in `fallback-calendar.js`:
  - `calculateRentalDaysExcludingSaturdays`
  - `applyDateSelectionToCalendar`
  - `validateDateRange`
  - `confirmSelectedDates`
- **Benefit**: Clear tracing of date calculations and selection states, simplifying troubleshooting.

### 8. Consistent Cutoff-Time & Same-Day Booking
- **Issue**: Cutoff logic mismatch between calendar rendering and confirmation allowed invalid same-day selections.
- **Fix**: Standardized all time checks in `fallback-calendar.js` to use `window.productPickupTime - 2`. Added special handling for today's date in both `isDateBookable` and `validateDateRange`, with a `forceEnableToday` override for testing.
- **Benefit**: Uniform booking availability rules and clear Hebrew error messages when booking past cutoff time.

## Homepage Cosmetic Updates
- **Testimonials Section** (`template-parts/builder/section-google_reviews.php`):
  - Replaced dynamic ACF title/text with static heading `לקוחות מספרים`.
  - Removed subtitle `<p>לקוחות מספרים</p>` block.
  - Updated Trustindex review count from `81` to `96` via injected JavaScript.

## Footer Year Update
- **File**: `footer.php`
- **Change**: Replaced static copyright year text (`2024`) with dynamic `<?php echo date('Y'); ?>` to always reflect the current year.

## Known Weaknesses & Blame
- **Client-Side Only Validation**: Booking restrictions are enforced only in JS; no server-side enforcement.
  - *Risk*: Users could craft manual POST requests to bypass.
  - *Blame*: Time constraints; server-side hooks not yet implemented.
- **Race Conditions on Init**: Calendar and rental-dates-handler both initialize fallback calendar; potential duplicates.
  - *Risk*: Duplicated event handlers or DOM resets.
  - *Blame*: Lack of centralized init orchestration.
- **Global Variables Pollution**: Use of `window.*` for settings (e.g., `processedBookedDates`, `discountValue`).
  - *Risk*: Name collisions, hard to maintain.
  - *Blame*: Quick integration over modular architecture.

## Future Improvements
- **Server-Side Validation**: Add `woocommerce_add_to_cart_validation` hook to enforce date restrictions.
- **Modular JS Build**: Refactor into ES modules or Webpack for cleaner organization.
- **Automated Tests**: Integration tests for calendar behavior and checkout flows.
- **Accessibility Enhancements**: ARIA labels for calendar controls.
# mitnutfun5
