# under-resolve1: Same-Day Booking Cutoff Fix

## Issue
- Default pickup time was hardcoded to 13:00.
- Cutoff logic incorrectly computed (used 11:00 as pickup, but cutoff remained 11).
- Restrictions still applied when multiple items in stock.

## Changes Applied

1. **content-single-product.php**
   - Changed default `pickup_override` from **13** to **11**.

2. **fallback-calendar.js**
   - In `initializeFallbackCalendar`: parsed `window.productPickupTime` as integer and recalculated `cutoffHour = pickupHour - 2` (now 9).
   - In `generateMonthCalendar`: skip disabling today when `window.stockQuantity > 1`.
   - In `checkAndHandleSameDayBooking`: early return `true` (allow booking) if `stockQuantity > 1`.

3. **last-minute-booking-check.js**
   - In `runLastMinuteCheck`: early exit and clear flag if `stockQuantity > 1`.
   - In `runLastMinuteCheck` & `checkLastMinuteBooking`: use `window.productPickupTime || window.customPickupHour` for pickup time.
   - In `checkLastMinuteBooking`: skip block logic if `stockQuantity > 1`.

## Verification
- Console logs show:
  - `Pickup hour: 11 / Cutoff hour: 9`
  - `Stock >1: skipping last-minute booking block` when stock > 1.
- Today remains selectable before 9:00 and blocked after.


’ve added the “Return Time” selector on the product page:

• In content-single-product.php
– Pulled the new ACF field return_overide_copy (defaulting to “10:00”).
– Exposed it via window.productReturnTime.
– Inserted a <select id="return_time"> next to the pickup-time field, with options 08:00–16:00 and the correct default selected.

Next up we can wire this into your JS (e.g. copy it into the hidden input or trigger notices), or move on to checkout-page display. Let me know.