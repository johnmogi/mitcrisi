so we will begin fixing the frontend calendar with the following issues

irst things first there are a lot of haywire files
these are all inside the js folder

<!-- list out the relevant and irelevant files to the calendar and the booking process -->

current status, before checking the files, the situation is likewise
past dates are semi selectable, this needs to be blocked

lets take this use case
this product

אנה ואלזה 4X3.5	5	
Order #912: 15.05.2025 - 19.05.2025
Order #911: 16.05.2025 - 19.05.2025
Order #901: 09.06.2025 - 11.06.2025
Order #900: 06.06.2025 - 09.06.2025
Order #896: 30.04.2025 - 01.05.2025

on the FE it looks like this

<div class="fallback-calendar" bis_skin_checked="1"><div class="month-header" bis_skin_checked="1">
                <div class="month-year" bis_skin_checked="1">מאי 2025</div>
                <button id="prevMonthBtn" class="nav-btn">&lt;</button>
                <button id="nextMonthBtn" class="nav-btn">&gt;</button>
            </div><div class="calendar-days-header" bis_skin_checked="1"><div class="day-name" bis_skin_checked="1">א</div><div class="day-name" bis_skin_checked="1">ב</div><div class="day-name" bis_skin_checked="1">ג</div><div class="day-name" bis_skin_checked="1">ד</div><div class="day-name" bis_skin_checked="1">ה</div><div class="day-name" bis_skin_checked="1">ו</div><div class="day-name" bis_skin_checked="1">ש</div></div><div class="calendar-days" bis_skin_checked="1"><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell" data-date="2025-05-01" data-selectable="true" bis_skin_checked="1">1</div><div class="day-cell" data-date="2025-05-02" data-selectable="true" bis_skin_checked="1">2</div><div class="day-cell weekend disabled" data-date="2025-05-03" data-selectable="false" bis_skin_checked="1">3</div><div class="day-cell" data-date="2025-05-04" data-selectable="true" bis_skin_checked="1">4</div><div class="day-cell" data-date="2025-05-05" data-selectable="true" bis_skin_checked="1">5</div><div class="day-cell" data-date="2025-05-06" data-selectable="true" bis_skin_checked="1">6</div><div class="day-cell" data-date="2025-05-07" data-selectable="true" bis_skin_checked="1">7</div><div class="day-cell" data-date="2025-05-08" data-selectable="true" bis_skin_checked="1">8</div><div class="day-cell" data-date="2025-05-09" data-selectable="true" bis_skin_checked="1">9</div><div class="day-cell weekend disabled" data-date="2025-05-10" data-selectable="false" bis_skin_checked="1">10</div><div class="day-cell today" data-date="2025-05-11" data-selectable="true" bis_skin_checked="1">11</div><div class="day-cell" data-date="2025-05-12" data-selectable="true" bis_skin_checked="1">12</div><div class="day-cell" data-date="2025-05-13" data-selectable="true" bis_skin_checked="1">13</div><div class="day-cell early-return-date" data-date="2025-05-14" data-selectable="true" data-early-return="true" bis_skin_checked="1">14</div><div class="day-cell early-return-date" data-date="2025-05-15" data-selectable="true" data-early-return="true" bis_skin_checked="1">15</div><div class="day-cell" data-date="2025-05-16" data-selectable="true" bis_skin_checked="1">16</div><div class="day-cell weekend disabled" data-date="2025-05-17" data-selectable="false" bis_skin_checked="1">17</div><div class="day-cell" data-date="2025-05-18" data-selectable="true" bis_skin_checked="1">18</div><div class="day-cell return-date" data-date="2025-05-19" data-selectable="true" data-return-date="true" bis_skin_checked="1">19</div><div class="day-cell" data-date="2025-05-20" data-selectable="true" bis_skin_checked="1">20</div><div class="day-cell" data-date="2025-05-21" data-selectable="true" bis_skin_checked="1">21</div><div class="day-cell" data-date="2025-05-22" data-selectable="true" bis_skin_checked="1">22</div><div class="day-cell" data-date="2025-05-23" data-selectable="true" bis_skin_checked="1">23</div><div class="day-cell weekend" data-date="2025-05-24" data-selectable="true" bis_skin_checked="1">24</div><div class="day-cell" data-date="2025-05-25" data-selectable="true" bis_skin_checked="1">25</div><div class="day-cell" data-date="2025-05-26" data-selectable="true" bis_skin_checked="1">26</div><div class="day-cell" data-date="2025-05-27" data-selectable="true" bis_skin_checked="1">27</div><div class="day-cell" data-date="2025-05-28" data-selectable="true" bis_skin_checked="1">28</div><div class="day-cell" data-date="2025-05-29" data-selectable="true" bis_skin_checked="1">29</div><div class="day-cell" data-date="2025-05-30" data-selectable="true" bis_skin_checked="1">30</div><div class="day-cell weekend" data-date="2025-05-31" data-selectable="true" bis_skin_checked="1">31</div></div><div class="calendar-legend" bis_skin_checked="1">
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color available"></span> פנוי</div>
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color disabled"></span> תפוס</div>
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color weekend"></span> שבת (סגור)</div>
            
                <div class="legend-item" bis_skin_checked="1">
                    <span class="legend-color early-return"></span> החזרה מוקדמת (עד 09:00)
                </div>
            
                <div class="legend-item" bis_skin_checked="1">
                    <span class="legend-color return-date"></span> יום החזרה (ניתן להזמין)
                </div>
            </div></div>

            so the days are no longer markked correctly

            also the stock for thiws product is currently at 2
            meaning the 1st and last day should not apear at all cueerently on this product

            last but not least there are too many debug console log
             we need to clean up a bit

jquery-migrate.min.js:2 JQMIGRATE: Migrate is installed, version 3.4.1
 🌍 Global basePrice set to: 520
 🌍 Global variables: Object
 🔄 Setting global discount values: percentage 50
 Using fallback calendar system instead of Air Datepicker
zero-stock-validator-new.js:7 🛑 Zero Stock Validator loaded - USER-FRIENDLY VERSION
אנה-ואלזה-43-5/:1689 [WEEKEND OVERRIDE] Applying weekend booking fixes
אנה-ואלזה-43-5/:1738 [WEEKEND OVERRIDE] Weekend booking fixes applied
אנה-ואלזה-43-5/:1744  🔍 SCRIPT LOADING CHECK:
אנה-ואלזה-43-5/:1748  critical-fixes.js not detected, loading it now
אנה-ואלזה-43-5/:1757  Document is ready
price-calculator.js:38 🔥 Price Calculator initializing
price-calculator.js:45 🔥 Price Calculator using: Object
price-calculator.js:69 📌 Observer attached to date validation message
script.js:2 Document is ready
last-minute-booking-check.js:19 LAST-MINUTE CHECK: Script loaded - running initial check
last-minute-booking-check.js:47 Stock >1: skipping last-minute cutoff check
last-minute-booking-check.js:331 LAST-MINUTE CHECK: Adding hook for date selection
calendar-initializer.js:6 Calendar initializer running...
fallback-calendar.js:185 Initializing fallback calendar system
fallback-calendar.js:189 Received dates for initialization: Array(3)
fallback-calendar.js:193 Using already formatted dates from rental-dates-handler
fallback-calendar.js:214 Container cleared, proceeding with initialization
fallback-calendar.js:234 Pickup hour: 11 / Cutoff hour: 9
fallback-calendar.js:243 Disabled dates prepared successfully: Array(3)
fallback-calendar.js:282 Current hour: 7 / Cutoff hour: 9
fallback-calendar.js:290 PRODUCTION MODE: Today is still available for booking (before cutoff time)
fallback-calendar.js:296 Final disabled dates set: Array(3)
fallback-calendar.js:307 Generating calendar with month: 4 year: 2025
fallback-calendar.js:448 Generating month calendar with month: 4 year: 2025
fallback-calendar.js:526 Calendar successfully generated
fallback-calendar.js:634 Setting up date selection handlers
fallback-calendar.js:1863 Pickup time field not found, skipping initialization
fallback-calendar.js:348 Fallback calendar initialization completed successfully
calendar-initializer.js:31 Calendar initialized successfully
calendar-test.js:6 Calendar test script running...
calendar-test.js:10 Found datepicker container, initializing test...
pickup-time-handler.js:11 Initializing Unified Pickup Time Handler
pickup-time-handler.js:23 Pickup time field not found, skipping initialization
rental-dates-handler.js:6 Rental Dates Handler loaded Object
rental-dates-handler.js:15 Processing rental data for product ID: 463
rental-dates-handler.js:1062 No reserved dates found for this product
early-return-handler.js:7 Early Return Handler loaded
return-date-handler.js:7 Return Date Handler loaded
duplicate-booking-fix.js:7 🔄 Enhanced Duplicate Booking Fix loaded
stock-aware-validation.js:7 Stock-aware validation loaded
emergency-fix.js:6 🚨 Emergency fix loaded - Direct targeting of validation error
emergency-fix.js:164 👁️ Error message observer attached
stock-debug-helper.js:15 Stock debug helper initialized
stock-parallel-orders.js:18 🔥 Stock parallel orders handler initialized
stock-parallel-orders.js:31 🔥 Product stock quantity: 2
stock-parallel-orders.js:73 🔥 Stock > 1: Enabling parallel bookings mode
stock-parallel-orders.js:85 🔥 Parallel booking mode enabled for this product (stock > 1)
zero-stock-validator-new.js:21 🛑 Current stock quantity: 2
zero-stock-validator-new.js:196 🛑 CRITICAL: Force initializing all event handlers
zero-stock-validator-new.js:229 🛑 Attached zero stock handler to button: single_add_to_cart_button btn-default btn-blue btn-mini disabled
zero-stock-validator-new.js:229 🛑 Attached zero stock handler to button: single_add_to_cart_button btn-redirect btn-default btn-yellow btn-mini disabled
zero-stock-validator-new.js:286 🛑 Attached zero stock handler to form: cart
zero-stock-validator-new.js:292 🛑 Patching validateDateRange to enforce zero stock check
menu.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
icon-1.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
icon-close.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
after-7.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
last-minute-booking-check.js:83 LAST-MINUTE CHECK: Running check
last-minute-booking-check.js:87 LAST-MINUTE CHECK: No dates selected, skipping check
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: Array(0)
early-return-handler.js:83 Identified early return dates: Array(4)
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: Array(0)
return-date-handler.js:75 Identified return dates: Array(3)
icon-7.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
icon-f1.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
actions.js:9 undefined
price-calculator.js:18 🚀 DIRECT INTEGRATION - Initial check: Object
rental-dates-handler.js:1062 No reserved dates found for this product
stock-aware-validation.js:28 Patching validateDateRange to be stock-aware
icon-f2.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
icon-f3.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
icon-19.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
del.svg:1 
            
            
           Failed to load resource: the server responded with a status of 404 ()
rental-dates-handler.js:30 AJAX theme reserved_dates: Array(4)
rental-dates-handler.js:36 Final bookedDates: Array(4)
rental-dates-handler.js:60 [RentalDates] processBookedDates for product 463: Array(4)
rental-dates-handler.js:38 Processed dates after AJAX: Array(11)
rental-dates-handler.js:554 Formatted dates ready for datepicker: Array(11)
rental-dates-handler.js:557  Reserved Dates for Calendar:
rental-dates-handler.js:558 Array(11)
rental-dates-handler.js:566 Total reserved dates: 11
rental-dates-handler.js:590 Datepicker container found: true
rental-dates-handler.js:940 Attempting to use fallback calendar
fallback-calendar.js:185 Initializing fallback calendar system
fallback-calendar.js:189 Received dates for initialization: Array(11)
fallback-calendar.js:193 Using already formatted dates from rental-dates-handler
fallback-calendar.js:214 Container cleared, proceeding with initialization
fallback-calendar.js:234 Pickup hour: 11 / Cutoff hour: 9
fallback-calendar.js:243 Disabled dates prepared successfully: Array(11)
fallback-calendar.js:282 Current hour: 7 / Cutoff hour: 9
fallback-calendar.js:290 PRODUCTION MODE: Today is still available for booking (before cutoff time)
fallback-calendar.js:296 Final disabled dates set: Array(11)
fallback-calendar.js:307 Generating calendar with month: 4 year: 2025
fallback-calendar.js:448 Generating month calendar with month: 4 year: 2025
fallback-calendar.js:526 Calendar successfully generated
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: Array(4)
early-return-handler.js:83 Identified early return dates: Array(4)
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: Array(4)
return-date-handler.js:75 Identified return dates: Array(3)
stock-aware-validation.js:28 Patching validateDateRange to be stock-aware
fallback-calendar.js:634 Setting up date selection handlers
fallback-calendar.js:1863 Pickup time field not found, skipping initialization
fallback-calendar.js:348 Fallback calendar initialization completed successfully
rental-dates-handler.js:949  Calendar system ready with disabled dates: Array(11)
query-monitor.js:390 PHP Errors in Ajax Response
query-monitor.js:403 Object
(anonymous) @ query-monitor.js:403
query-monitor.js:403 Object
(anonymous) @ query-monitor.js:403
stock-debug-helper.js:45 📅 STOCK-BASED DATE FILTERING
stock-debug-helper.js:46 Product Stock: 2
stock-debug-helper.js:47 Showing Reserved Dates: undefined
stock-debug-helper.js:48 Reserved Date Count: 4
stock-debug-helper.js:50 Reserved Dates: Array(4)
stock-parallel-orders.js:110 🔥 Stock > 1: No date restrictions needed in calendar
 ⏱️ After timeout, global variables: Object
pickup-time-handler.js:23 Pickup time field not found, skipping initialization
stock-debug-helper.js:70 👉 Calendar check: Found 11 disabled date cells (excluding weekends/empty)
stock-debug-helper.js:77 ⚠️ Found disabled dates despite stock > 1
checkCalendarDisabledDates @ stock-debug-helper.js:77
stock-debug-helper.js:84 Disabled dates found: Array(11)
stock-parallel-orders.js:116 🔥 Found 11 disabled dates to enable for parallel booking
calendar-test.js:15 SUCCESS: Calendar initialization function found!
calendar-test.js:21 Calendar system is operational - no reinitialization needed

