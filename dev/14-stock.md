<!-- ok the site looks good but ive missed a key detail

the whole check by availability mechanism should only start once there is only 1 item in stock

once there is 2 items or more  in stock the mechanism should not be active

please asses the required development in place -->



big issue the quantity for 1 day counts as 2
although we placed a mechanism to calculate the price with discounts
when ordering a product for 1 days i still get billed for 2

as in 
<div class="text" bis_skin_checked="1">
                        <div class="info" bis_skin_checked="1">
                            <p class="name"><a href="https://mitnafun.johnmogi.local/product/%d7%90%d7%a0%d7%94-%d7%95%d7%90%d7%9c%d7%96%d7%94-43-5/">אנה ואלזה 4X3.5</a></p>
                            <p>30.04.2025 - 01.05.2025</p>
                                                                    
                                                        </div>
                        <div class="cost" bis_skin_checked="1">
                            <span class="woocommerce-Price-amount amount"><bdi>940.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span><div class="mitnafun-breakdown" bis_skin_checked="1"><div class="breakdown-toggle" bis_skin_checked="1">פירוט תמחור <span class="toggle-icon">-</span></div><div class="breakdown-content" style="" bis_skin_checked="1"><p><strong>פירוט תמחור לתקופת השכירות:</strong></p><ul><li>יום ראשון: <span class="woocommerce-Price-amount amount"><bdi>520.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> (מחיר מלא)</li><li>1 ימים נוספים: <span class="woocommerce-Price-amount amount"><bdi>420.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> (100 ₪ הנחה)</li></ul><p><strong>סה"כ: <span class="woocommerce-Price-amount amount"><bdi>940.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span> (חסכת <span class="woocommerce-Price-amount amount"><bdi>100.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span>)</strong></p></div></div>                        </div>
                        <div class="delete" bis_skin_checked="1">
                            <a href="https://mitnafun.johnmogi.local/basket/?remove_item=71f584eeb8d95a12b7894c2ab55c0a58&amp;_wpnonce=0ac841d3c5" class="remove remove_from_cart_button" aria-label="להסיר את אנה ואלזה 4X3.5 מעגלת הקניות" data-product_id="463" data-cart_item_key="71f584eeb8d95a12b7894c2ab55c0a58" data-product_sku=""><img src="https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/del.svg" alt=""></a>                        </div>
                    </div>

this logic needs to be reflected on all 3 areas - product display, 
floating popup cart and review order/ checkout page

currently the days count is correct the price is incorrect

at the above example it should have been only charged for the 1 day, no need for a discount, if the client have made the same order but as 2 days or more then yes the discount should have gone into play.



next item

 JQMIGRATE: Migrate is installed, version 3.4.1
 🌍 Global basePrice set to: 520
 🌍 Global variables: Object
 🔄 Setting global discount values: percentage 50
 Using fallback calendar system instead of Air Datepicker
 [WEEKEND OVERRIDE] Applying weekend booking fixes
 [WEEKEND OVERRIDE] Weekend booking fixes applied
  🔍 SCRIPT LOADING CHECK:
  critical-fixes.js not detected, loading it now
  Document is ready
 Document is ready
 LAST-MINUTE CHECK: Script loaded - running initial check
 LAST-MINUTE CHECK: Current time is 9:26
 LAST-MINUTE CHECK: Pickup hour: 13
 LAST-MINUTE CHECK: Cutoff hour: 11
 LAST-MINUTE CHECK: Is past cutoff? false
 LAST-MINUTE CHECK: Adding hook for date selection
 Calendar initializer running...
 Initializing fallback calendar system
 Received dates for initialization: Array(3)
 Using already formatted dates from rental-dates-handler
 Container cleared, proceeding with initialization
 Disabled dates prepared successfully: Array(3)
 Current hour: 9 / Cutoff hour: 11
 PRODUCTION MODE: Today is still available for booking (before cutoff time)
 Final disabled dates set: Array(3)
 Generating calendar with month: 3 year: 2025
 Generating month calendar with month: 3 year: 2025
 Calendar successfully generated
 Setting up date selection handlers
 Pickup time field set to 13:00
 Fallback calendar initialization completed successfully
 Calendar initialized successfully
 Calendar test script running...
 Found datepicker container, initializing test...
 Initializing Unified Pickup Time Handler
 Pickup time field not found, skipping initialization
 Rental Dates Handler loaded Object
 Processing rental data for product ID: 463
 No reserved dates found for this product
 Early Return Handler loaded
 Return Date Handler loaded
menu.svg:1  Failed to load resource: the server responded with a status of 404 ()
icon-1.svg:1  Failed to load resource: the server responded with a status of 404 ()
 LAST-MINUTE CHECK: Running check
 LAST-MINUTE CHECK: No dates selected, skipping check
 Initializing early return handler
 Processing early return dates from booked dates: Array(0)
 Identified early return dates: Array(0)
 Initializing return date handler
 Processing return dates from booked dates: Array(0)
 Identified return dates: Array(0)
 undefined
icon-close.svg:1  Failed to load resource: the server responded with a status of 404 ()
 No reserved dates found for this product
icon-19.svg:1  Failed to load resource: the server responded with a status of 404 ()
after-7.svg:1  Failed to load resource: the server responded with a status of 404 ()
icon-7.svg:1  Failed to load resource: the server responded with a status of 404 ()
 ⏱️ After timeout, global variables: Object
 Generating month calendar with month: 4 year: 2025
 Calendar successfully generated
 Initializing early return handler
 Processing early return dates from booked dates: Array(0)
 Identified early return dates: Array(0)
 Initializing return date handler
 Processing return dates from booked dates: Array(0)
 Identified return dates: Array(0)
icon-f1.svg:1  Failed to load resource: the server responded with a status of 404 ()
icon-f2.svg:1  Failed to load resource: the server responded with a status of 404 ()
 AJAX theme reserved_dates: Array(0)
 Final bookedDates: Array(0)
 [RentalDates] processBookedDates for product 463: Array(0)
 No date ranges provided
 Processed dates after AJAX: Array(0)
 Formatted dates ready for datepicker: Array(0)
  Reserved Dates for Calendar:
 Array(0)
 Total reserved dates: 0
 Datepicker container found: true
 Attempting to use fallback calendar
 Initializing fallback calendar system
 Received dates for initialization: Array(0)
 Using already formatted dates from rental-dates-handler
 Container cleared, proceeding with initialization
 Disabled dates prepared successfully: Array(0)
 Current hour: 9 / Cutoff hour: 11
 PRODUCTION MODE: Today is still available for booking (before cutoff time)
 Final disabled dates set: Array(0)
 Generating calendar with month: 3 year: 2025
 Generating month calendar with month: 3 year: 2025
 Calendar successfully generated
 Initializing early return handler
 Processing early return dates from booked dates: Array(0)
 Identified early return dates: Array(0)
 Initializing return date handler
 Processing return dates from booked dates: Array(0)
 Identified return dates: Array(0)
 Setting up date selection handlers
 Pickup time field set to 13:00
 Fallback calendar initialization completed successfully
  Calendar system ready with disabled dates: Array(0)
icon-f3.svg:1  Failed to load resource: the server responded with a status of 404 ()
 SUCCESS: Calendar initialization function found!
 Calendar system is operational - no reinitialization needed
 Pickup time field not found, skipping initialization
 Date cell clicked: 30.04.2025
 Updating calendar selection with dates: Array(1)
 Same-day booking detected, checking time restrictions
 Current hour: 9 Cutoff hour: 11
 Before cutoff time, proceeding normally
 Generating month calendar with month: 4 year: 2025
 Calendar successfully generated
 Initializing early return handler
 Processing early return dates from booked dates: Array(0)
 Identified early return dates: Array(0)
 Initializing return date handler
 Processing return dates from booked dates: Array(0)
 Identified return dates: Array(0)
 Date cell clicked: 01.05.2025
 Updating calendar selection with dates: Array(2)
 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
 Total rental days: 2
 Total rental days after 24h adjustment: 1
 Same-day booking detected, checking time restrictions
 Current hour: 9 Cutoff hour: 11
 Before cutoff time, proceeding normally
 Validating date range: 2025-04-30 to 2025-05-01
 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
 Total rental days: 2
 Total rental days after 24h adjustment: 1
 Using local user time: Object
 Current hour: 9 Cutoff hour: 11
 Today IS bookable (before cutoff time)
 Using local user time: Object
 Date range validation passed
 Confirming selected dates
 Validating date range: 2025-04-30 to 2025-05-01
 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
 Total rental days: 2
 Total rental days after 24h adjustment: 1
 Using local user time: Object
 Current hour: 9 Cutoff hour: 11
 Today IS bookable (before cutoff time)
 Using local user time: Object
 Date range validation passed
 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
 Total rental days: 2
 Total rental days after 24h adjustment: 1
 Rental days: 1
 Base price: 520
 Using global discount type: percentage
 Using global discount value: 50
 Using discount settings: Object
 Calculated rental price: 520
 Updating calendar selection with dates: Array(2)
 Generating month calendar with month: 3 year: 2025
 Calendar successfully generated
 Initializing early return handler
 Processing early return dates from booked dates: Array(0)
 Identified early return dates: Array(0)
 Initializing return date handler
 Processing return dates from booked dates: Array(0)
 Identified return dates: Array(0)
 Date cell clicked: 30.04.2025
 Updating calendar selection with dates: Array(0)
 Updating calendar selection with dates: Array(1)
 Same-day booking detected, checking time restrictions
 Current hour: 9 Cutoff hour: 11
 Before cutoff time, proceeding normally
 Generating month calendar with month: 4 year: 2025
fallback-calendar.js:512 Calendar successfully generated
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: Array(0)
early-return-handler.js:83 Identified early return dates: Array(0)
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: Array(0)
return-date-handler.js:75 Identified return dates: Array(0)
fallback-calendar.js:645 Date cell clicked: 01.05.2025
fallback-calendar.js:887 Updating calendar selection with dates: Array(2)
fallback-calendar.js:42 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1824 Same-day booking detected, checking time restrictions
fallback-calendar.js:1833 Current hour: 9 Cutoff hour: 11
fallback-calendar.js:1847 Before cutoff time, proceeding normally
fallback-calendar.js:1886 Validating date range: 2025-04-30 to 2025-05-01
fallback-calendar.js:42 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1140 Using local user time: Object
fallback-calendar.js:1173 Current hour: 9 Cutoff hour: 11
fallback-calendar.js:1180 Today IS bookable (before cutoff time)
fallback-calendar.js:1140 Using local user time: Object
fallback-calendar.js:1968 Date range validation passed


i was able to place the order after the designated time
jquery-migrate.min.js:2 JQMIGRATE: Migrate is installed, version 3.4.1
מלך-האריות-2/:1144 🌍 Global basePrice set to: 500
מלך-האריות-2/:1147 🌍 Global variables: {discountType: 'percentage', discountValue: 50, maxRentalDays: 14}
מלך-האריות-2/:1336 🔄 Setting global discount values: percentage 50
air-datepicker.js:4 Using fallback calendar system instead of Air Datepicker
 [WEEKEND OVERRIDE] Applying weekend booking fixes
 [WEEKEND OVERRIDE] Weekend booking fixes applied
  🔍 SCRIPT LOADING CHECK:
  critical-fixes.js not detected, loading it now
  Document is ready
 Document is ready
 LAST-MINUTE CHECK: Script loaded - running initial check
 LAST-MINUTE CHECK: Current time is 9:58
 LAST-MINUTE CHECK: Pickup hour: 13
 LAST-MINUTE CHECK: Cutoff hour: 11
 LAST-MINUTE CHECK: Is past cutoff? false
 LAST-MINUTE CHECK: Adding hook for date selection
 Calendar initializer running...
fallback-calendar.js:185 Initializing fallback calendar system
fallback-calendar.js:189 Received dates for initialization: (3) ['2025-05-27', '2025-05-28', '2025-05-16']
fallback-calendar.js:193 Using already formatted dates from rental-dates-handler
fallback-calendar.js:214 Container cleared, proceeding with initialization
fallback-calendar.js:243 Disabled dates prepared successfully: (3) ['2025-05-27', '2025-05-28', '2025-05-16']
fallback-calendar.js:282 Current hour: 9 / Cutoff hour: 11
fallback-calendar.js:290 PRODUCTION MODE: Today is still available for booking (before cutoff time)
fallback-calendar.js:296 Final disabled dates set: (3) ['2025-05-27', '2025-05-28', '2025-05-16']
fallback-calendar.js:307 Generating calendar with month: 3 year: 2025
fallback-calendar.js:448 Generating month calendar with month: 3 year: 2025
fallback-calendar.js:526 Calendar successfully generated
fallback-calendar.js:634 Setting up date selection handlers
fallback-calendar.js:1818 Pickup time field set to 11:00
fallback-calendar.js:348 Fallback calendar initialization completed successfully
calendar-initializer.js:31 Calendar initialized successfully
calendar-test.js:6 Calendar test script running...
calendar-test.js:10 Found datepicker container, initializing test...
pickup-time-handler.js:11 Initializing Unified Pickup Time Handler
pickup-time-handler.js:23 Pickup time field not found, skipping initialization
rental-dates-handler.js:6 Rental Dates Handler loaded {productId: '465', bookedDates: Array(0), reservedRanges: Array(0), ajaxUrl: 'https://mitnafun.johnmogi.local/wp-admin/admin-ajax.php', nonce: 'fba03204ee'}
rental-dates-handler.js:15 Processing rental data for product ID: 465
rental-dates-handler.js:1062 No reserved dates found for this product
early-return-handler.js:7 Early Return Handler loaded
return-date-handler.js:7 Return Date Handler loaded
last-minute-booking-check.js:76 LAST-MINUTE CHECK: Running check
last-minute-booking-check.js:80 LAST-MINUTE CHECK: No dates selected, skipping check
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: []
early-return-handler.js:83 Identified early return dates: []
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: []
return-date-handler.js:75 Identified return dates: []
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:666 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/menu.svg 404 (Not Found)
actions.js:9 undefined
rental-dates-handler.js:1062 No reserved dates found for this product
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:680 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-close.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:670 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-1.svg 404 (Not Found)
מלך-האריות-2/:1155 ⏱️ After timeout, global variables: {basePrice: 500, discountType: 'percentage', discountValue: 50}
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1466 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-f1.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1298 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-7.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1269 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/after-7.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1555 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-19.svg 404 (Not Found)
calendar-test.js:15 SUCCESS: Calendar initialization function found!
calendar-test.js:21 Calendar system is operational - no reinitialization needed
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1476 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-f3.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1471 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-f2.svg 404 (Not Found)
%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/:1583 
            
            
           GET https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/del.svg 404 (Not Found)
pickup-time-handler.js:23 Pickup time field not found, skipping initialization
rental-dates-handler.js:30 AJAX theme reserved_dates: []
rental-dates-handler.js:36 Final bookedDates: []
rental-dates-handler.js:60 [RentalDates] processBookedDates for product 465: []
rental-dates-handler.js:66 No date ranges provided
rental-dates-handler.js:38 Processed dates after AJAX: []
 Formatted dates ready for datepicker: []
  Reserved Dates for Calendar:
 
rental-dates-handler.js:566 Total reserved dates: 0
rental-dates-handler.js:590 Datepicker container found: true
rental-dates-handler.js:940 Attempting to use fallback calendar
fallback-calendar.js:185 Initializing fallback calendar system
fallback-calendar.js:189 Received dates for initialization: []
fallback-calendar.js:193 Using already formatted dates from rental-dates-handler
fallback-calendar.js:214 Container cleared, proceeding with initialization
fallback-calendar.js:243 Disabled dates prepared successfully: []
fallback-calendar.js:282 Current hour: 9 / Cutoff hour: 11
fallback-calendar.js:290 PRODUCTION MODE: Today is still available for booking (before cutoff time)
fallback-calendar.js:296 Final disabled dates set: []
fallback-calendar.js:307 Generating calendar with month: 3 year: 2025
fallback-calendar.js:448 Generating month calendar with month: 3 year: 2025
fallback-calendar.js:526 Calendar successfully generated
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: []
early-return-handler.js:83 Identified early return dates: []
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: []
return-date-handler.js:75 Identified return dates: []
fallback-calendar.js:634 Setting up date selection handlers
fallback-calendar.js:1818 Pickup time field set to 11:00
fallback-calendar.js:348 Fallback calendar initialization completed successfully
rental-dates-handler.js:949  Calendar system ready with disabled dates: []
fallback-calendar.js:659 Date cell clicked: 30.04.2025
fallback-calendar.js:1861 Same-day booking detected, checking time restrictions
fallback-calendar.js:1870 Current hour: 9 Cutoff hour: 11
fallback-calendar.js:1884 Before cutoff time, proceeding normally
fallback-calendar.js:924 Updating calendar selection with dates: (2) ['30.04.2025', '01.05.2025']
fallback-calendar.js:42 Calculating rental days from Wed Apr 30 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1861 Same-day booking detected, checking time restrictions
fallback-calendar.js:1870 Current hour: 9 Cutoff hour: 11
fallback-calendar.js:1884 Before cutoff time, proceeding normally
fallback-calendar.js:448 Generating month calendar with month: 4 year: 2025
fallback-calendar.js:526 Calendar successfully generated
early-return-handler.js:19 Initializing early return handler
early-return-handler.js:45 Processing early return dates from booked dates: []
early-return-handler.js:83 Identified early return dates: []
return-date-handler.js:19 Initializing return date handler
return-date-handler.js:45 Processing return dates from booked dates: []
return-date-handler.js:75 Identified return dates: []
fallback-calendar.js:659 Date cell clicked: 01.05.2025
fallback-calendar.js:924 Updating calendar selection with dates: []
fallback-calendar.js:924 Updating calendar selection with dates: (2) ['01.05.2025', '02.05.2025']
fallback-calendar.js:42 Calculating rental days from Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Fri May 02 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:99 Adjusted days considering weekend: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1270 Confirming selected dates
fallback-calendar.js:1923 Validating date range: 2025-05-01 to 2025-05-02
fallback-calendar.js:42 Calculating rental days from Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Fri May 02 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:99 Adjusted days considering weekend: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1177 Using local user time: {date: '30.4.2025, 9:58:46', hour: 9}
fallback-calendar.js:1177 Using local user time: {date: '30.4.2025, 9:58:46', hour: 9}
fallback-calendar.js:2005 Date range validation passed
fallback-calendar.js:42 Calculating rental days from Thu May 01 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ)) to Fri May 02 2025 00:00:00 GMT+0200 (שעון מרכז אירופה (קיץ))
fallback-calendar.js:85 Total rental days: 2
fallback-calendar.js:99 Adjusted days considering weekend: 2
fallback-calendar.js:105 Total rental days after 24h adjustment: 1
fallback-calendar.js:1361 Rental days: 1
fallback-calendar.js:1454 Base price: 500
fallback-calendar.js:1472 Using global discount type: percentage
fallback-calendar.js:1477 Using global discount value: 50
fallback-calendar.js:1498 Using discount settings: {type: 'percentage', value: 50}
fallback-calendar.js:1565 Calculated rental price: 500
fallback-calendar.js:924 Updating calendar selection with dates: (2) ['01.05.2025', '02.05.2025']

<div class="content" bis_skin_checked="1">
            
<div class="slider-wrap" bis_skin_checked="1">
    <div class="swiper product-slider swiper-initialized swiper-horizontal swiper-pointer-events swiper-rtl swiper-backface-hidden" bis_skin_checked="1">
        <div class="swiper-wrapper" id="swiper-wrapper-e8ded247199e222b" aria-live="polite" bis_skin_checked="1" style="transform: translate3d(0px, 0px, 0px);">
                        <div class="swiper-slide swiper-slide-active" style="width: 652px;" role="group" aria-label="1 / 4" bis_skin_checked="1">
                <a href="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8.png" data-fancybox="gallery">
                    <img width="1024" height="1024" src="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-1024x1024.png" class="attachment-large size-large" alt="" decoding="async" fetchpriority="high" srcset="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-1024x1024.png 1024w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-300x300.png 300w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-100x100.png 100w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-600x600.png 600w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-150x150.png 150w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8-768x768.png 768w, https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/img-prod-8.png 1191w" sizes="(max-width: 1024px) 100vw, 1024px">                </a>
            </div>
                                            <div class="swiper-slide swiper-slide-next" style="width: 652px;" role="group" aria-label="2 / 4" bis_skin_checked="1">
                        <a href="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-2.jpeg" data-fancybox="gallery">
                            <img src="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-2-1024x768.jpeg" alt="">
                        </a>
                    </div>
                                        <div class="swiper-slide" style="width: 652px;" role="group" aria-label="3 / 4" bis_skin_checked="1">
                        <a href="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-3.jpeg" data-fancybox="gallery">
                            <img src="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-3-1024x768.jpeg" alt="">
                        </a>
                    </div>
                                        <div class="swiper-slide" role="group" aria-label="4 / 4" style="width: 652px;" bis_skin_checked="1">
                        <a href="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-4.jpeg" data-fancybox="gallery">
                            <img src="https://mitnafun.johnmogi.local/wp-content/uploads/2024/04/מלך-האריות-4-1024x768.jpeg" alt="">
                        </a>
                    </div>
                    
        </div>
        <div class="swiper-button-next product-next product-btn" tabindex="0" role="button" aria-label="Next slide" aria-controls="swiper-wrapper-e8ded247199e222b" aria-disabled="false" bis_skin_checked="1"><img src="https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-7.svg" alt=""></div>
        <div class="swiper-button-prev product-prev product-btn swiper-button-disabled" tabindex="-1" role="button" aria-label="Previous slide" aria-controls="swiper-wrapper-e8ded247199e222b" aria-disabled="true" bis_skin_checked="1"><img src="https://mitnafun.johnmogi.local/wp-content/themes/mitnafun_upro/img/icon-7.svg" alt=""></div>
    <span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span></div>
</div>





            <div class="text-wrap" bis_skin_checked="1">
                <ul class="list-info">
                    <li>הסדנה 1, כפר סבא</li>
                </ul>

                <h1 class="product_title entry-title">מלך האריות</h1><p class="price"><span class="woocommerce-Price-amount amount"><bdi>500.00&nbsp;<span class="woocommerce-Price-currencySymbol">₪</span></bdi></span></p>
<div class="product_meta" bis_skin_checked="1">

	
	
	<span class="posted_in">קטגוריה: <a href="https://mitnafun.johnmogi.local/product-category/%d7%9e%d7%aa%d7%a0%d7%a4%d7%97%d7%99%d7%9d-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94/" rel="tag">מתנפחים להשכרה</a></span>
	
	
</div>

                <p class="stock in-stock">1 במלאי</p>

                <div class="rental-form-section" bis_skin_checked="1">
                    <!-- Simple Notice - Always Visible at Top -->
                    <!-- <div id="simple-notice" class="return-time-notice info" style="margin-bottom: 15px; background-color: #e3f2fd; border: 1px solid #90caf9; padding: 8px; border-radius: 4px;">
                        <strong style="color: #1565c0;">שימו לב</strong>
                        <span> - בחרו תאריכי השכרה לקבלת מידע מלא</span>
                    </div> -->
                    
                    <!-- Early discount incentive message - only shown if there's an actual discount -->
                                        <script>
                        // Make discount values available globally
                        window.discountType = 'percentage';
                        window.discountValue = 50;
                        console.log('🔄 Setting global discount values:', window.discountType, window.discountValue);
                    </script>
                    
                                                            
                    <h3>תאריכי השכרה</h3>
                    <div class="rental-dates-label" bis_skin_checked="1">תאריכי השכרה <span class="required">*</span></div><div id="datepicker-container" bis_skin_checked="1"><div class="fallback-calendar" bis_skin_checked="1"><div class="month-header" bis_skin_checked="1">
                <div class="month-year" bis_skin_checked="1">מאי 2025</div>
                <button id="prevMonthBtn" class="nav-btn">&lt;</button>
                <button id="nextMonthBtn" class="nav-btn">&gt;</button>
            </div><div class="calendar-days-header" bis_skin_checked="1"><div class="day-name" bis_skin_checked="1">א</div><div class="day-name" bis_skin_checked="1">ב</div><div class="day-name" bis_skin_checked="1">ג</div><div class="day-name" bis_skin_checked="1">ד</div><div class="day-name" bis_skin_checked="1">ה</div><div class="day-name" bis_skin_checked="1">ו</div><div class="day-name" bis_skin_checked="1">ש</div></div><div class="calendar-days" bis_skin_checked="1"><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell empty" data-selectable="true" bis_skin_checked="1"></div><div class="day-cell selected start-date selected-start" data-date="2025-05-01" data-selectable="true" bis_skin_checked="1" style="background-color: rgb(0, 123, 255); color: white; font-weight: bold; border-radius: 24px; box-shadow: rgb(0, 123, 255) 0px 0px 0px 2px, white 0px 0px 0px 3px; border: 2px solid white; position: relative; z-index: 10; transform: scale(1.1);">1</div><div class="day-cell selected end-date selected-end" data-date="2025-05-02" data-selectable="true" bis_skin_checked="1" style="background-color: rgb(0, 123, 255); color: white; font-weight: bold; border-radius: 24px; box-shadow: rgb(0, 123, 255) 0px 0px 0px 2px, white 0px 0px 0px 3px; border: 2px solid white; position: relative; z-index: 10; transform: scale(1.1);">2</div><div class="day-cell weekend" data-date="2025-05-03" data-selectable="true" bis_skin_checked="1">3</div><div class="day-cell" data-date="2025-05-04" data-selectable="true" bis_skin_checked="1">4</div><div class="day-cell" data-date="2025-05-05" data-selectable="true" bis_skin_checked="1">5</div><div class="day-cell" data-date="2025-05-06" data-selectable="true" bis_skin_checked="1">6</div><div class="day-cell" data-date="2025-05-07" data-selectable="true" bis_skin_checked="1">7</div><div class="day-cell" data-date="2025-05-08" data-selectable="true" bis_skin_checked="1">8</div><div class="day-cell" data-date="2025-05-09" data-selectable="true" bis_skin_checked="1">9</div><div class="day-cell weekend" data-date="2025-05-10" data-selectable="true" bis_skin_checked="1">10</div><div class="day-cell" data-date="2025-05-11" data-selectable="true" bis_skin_checked="1">11</div><div class="day-cell" data-date="2025-05-12" data-selectable="true" bis_skin_checked="1">12</div><div class="day-cell" data-date="2025-05-13" data-selectable="true" bis_skin_checked="1">13</div><div class="day-cell" data-date="2025-05-14" data-selectable="true" bis_skin_checked="1">14</div><div class="day-cell" data-date="2025-05-15" data-selectable="true" bis_skin_checked="1">15</div><div class="day-cell" data-date="2025-05-16" data-selectable="true" bis_skin_checked="1">16</div><div class="day-cell weekend" data-date="2025-05-17" data-selectable="true" bis_skin_checked="1">17</div><div class="day-cell" data-date="2025-05-18" data-selectable="true" bis_skin_checked="1">18</div><div class="day-cell" data-date="2025-05-19" data-selectable="true" bis_skin_checked="1">19</div><div class="day-cell" data-date="2025-05-20" data-selectable="true" bis_skin_checked="1">20</div><div class="day-cell" data-date="2025-05-21" data-selectable="true" bis_skin_checked="1">21</div><div class="day-cell" data-date="2025-05-22" data-selectable="true" bis_skin_checked="1">22</div><div class="day-cell" data-date="2025-05-23" data-selectable="true" bis_skin_checked="1">23</div><div class="day-cell weekend" data-date="2025-05-24" data-selectable="true" bis_skin_checked="1">24</div><div class="day-cell" data-date="2025-05-25" data-selectable="true" bis_skin_checked="1">25</div><div class="day-cell" data-date="2025-05-26" data-selectable="true" bis_skin_checked="1">26</div><div class="day-cell" data-date="2025-05-27" data-selectable="true" bis_skin_checked="1">27</div><div class="day-cell" data-date="2025-05-28" data-selectable="true" bis_skin_checked="1">28</div><div class="day-cell" data-date="2025-05-29" data-selectable="true" bis_skin_checked="1">29</div><div class="day-cell" data-date="2025-05-30" data-selectable="true" bis_skin_checked="1">30</div><div class="day-cell weekend" data-date="2025-05-31" data-selectable="true" bis_skin_checked="1">31</div></div><div class="calendar-legend" bis_skin_checked="1">
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color available"></span> פנוי</div>
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color disabled"></span> תפוס</div>
                <div class="legend-item" bis_skin_checked="1"><span class="legend-color weekend"></span> שבת (סגור)</div>
            
                <div class="legend-item" bis_skin_checked="1">
                    <span class="legend-color early-return"></span> החזרה מוקדמת (עד 09:00)
                </div>
            
                <div class="legend-item" bis_skin_checked="1">
                    <span class="legend-color return-date"></span> יום החזרה (ניתן להזמין)
                </div>
            </div></div></div>
                    <div id="date-validation-message" class="validation-message success" style="display: block;" bis_skin_checked="1">התאריכים אושרו בהצלחה: 01.05.2025 - 02.05.2025 
        (1 יום לחיוב) <a href="#" id="clear-date-selection" style="margin-right:10px; font-size:0.8em;">[שנה בחירה]</a></div>
                    <!-- Weekend notice moved to more prominent position -->
                    <div id="weekend-return-notice" style="margin: 15px 0px; padding: 12px; background-color: rgb(255, 248, 229); border: 1px solid rgb(255, 183, 77); border-radius: 4px; display: none;" bis_skin_checked="1">
                    <strong style="color: #ef6c00;">לתשומת לבכם:</strong> ההחזרה מתוכננת לשעה <strong>10:00</strong>.  
החזרה באיחור עלולה להוביל לחיוב נוסף לפי תנאי ההשכרה.
</div>

                    <div id="max-duration-message" class="validation-message info" style="display: none" bis_skin_checked="1">ניתן להזמין עד <span id="max-days">14</span> ימים</div>
                    
                    <!-- Price Breakdown Section -->
                    <div id="price-breakdown-container" class="price-breakdown-container" style="display: none; margin: 15px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px;" bis_skin_checked="1">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 16px;">פירוט תמחור לתקופת השכירה:</h4>
                        <ul id="price-breakdown-list" style="margin: 0 0 10px 0; padding-right: 20px;">
                            <!-- Will be populated by JavaScript -->
                        </ul>
                        <p id="price-breakdown-total" style="margin: 5px 0 0; font-weight: bold; color: #333;">
                            <!-- Will be populated by JavaScript -->
                        </p>
                    </div>
                    
                    <div id="hours-selection" class="hours-selection" style="display: none" bis_skin_checked="1">
                        <h4>שעת לקיחה והחזרה</h4>
                        <div class="pickup-time-row" bis_skin_checked="1">
                            <div class="pickup-label" bis_skin_checked="1">שעת לקיחה:</div>
                            <select name="pickup_hour" id="pickup_hour">
                                <option value="9">9:00</option>
                                <option value="10">10:00</option>
                                <option value="11">11:00</option>
                                <option value="12">12:00</option>
                                <option value="13">13:00</option>
                                <option value="14">14:00</option>
                                <option value="15">15:00</option>
                                <option value="16">16:00</option>
                                <option value="17">17:00</option>
                            </select>
                        </div>
                        <div class="return-time-row" bis_skin_checked="1">
                            <div class="return-label" bis_skin_checked="1">שעת החזרה (משוערת):</div>
                            <select name="return_hour" id="return_hour">
                                <option value="9">9:00</option>
                                <option value="10">10:00</option>
                                <option value="11">11:00</option>
                                <option value="12">12:00</option>
                                <option value="13">13:00</option>
                                <option value="14">14:00</option>
                                <option value="15">15:00</option>
                                <option value="16">16:00</option>
                                <option value="17">17:00</option>
                            </select>
                        </div>
                    </div>
                </div>

                <form class="cart" action="https://mitnafun.johnmogi.local/product/%d7%9e%d7%9c%d7%9a-%d7%94%d7%90%d7%a8%d7%99%d7%95%d7%aa-2/" method="post" enctype="multipart/form-data">
                    <input type="hidden" id="rental_dates" name="rental_dates" class="date-picker-field" value="01.05.2025 - 02.05.2025">
                    <input type="hidden" id="rental_hours" name="rental_hours">
                    
                    <!-- Add initial discount information notice that matches minicart format exactly -->
                                        
                    <div style="display: none" bis_skin_checked="1">
                        <div class="quantity" bis_skin_checked="1">
		<label class="screen-reader-text" for="quantity_6811d82586925">כמות של מלך האריות</label>
	<input type="number" id="quantity_6811d82586925" class="input-text qty text" name="quantity" value="1" aria-label="כמות המוצר" size="4" min="1" max="" step="1" placeholder="" inputmode="numeric" autocomplete="off">
	</div>
                    </div>
                    <div class="btn-wrap" bis_skin_checked="1">
                        <button type="submit" name="add-to-cart" value="465" class="single_add_to_cart_button btn-default btn-blue btn-mini" aria-disabled="false" style="opacity: 1; cursor: pointer;">הוסף לסל</button>
                        <button type="submit" name="add-to-cart" value="465" class="single_add_to_cart_button btn-redirect btn-default btn-yellow btn-mini" aria-disabled="false" style="opacity: 1; cursor: pointer;">הזמן</button>
                    </div>
                    <input type="hidden" name="redirect" value="">
                <input type="hidden" id="rental_start_date" name="rental_start_date" value="01.05.2025"><input type="hidden" id="rental_end_date" name="rental_end_date" value="02.05.2025"><input type="hidden" id="rental_days" name="rental_days" value="1"><input type="hidden" id="calculated_total_price" name="calculated_total_price" value="500"></form>
                
                <!-- Return Conditions - Shown After Date Selection -->
                <div id="return-conditions-notice" class="return-time-notice warning" style="margin: 15px 0px; background-color: rgb(255, 248, 229); border: 1px solid rgb(255, 183, 77); padding: 12px; border-radius: 4px;" bis_skin_checked="1">
                    <strong style="display: block; margin-bottom: 8px; color: #e65100; font-size: 16px;">תנאי החזרת ציוד - חשוב לקרוא!</strong>
                    <ul style="margin: 0; padding-right: 20px; font-size: 14px;">
                        <li style="margin-bottom: 6px;">יש להחזיר את הציוד מקופל וקשור כראוי</li>
                        <li style="margin-bottom: 6px;">מתקנים מתנפחים יבשים אסור להרטיב</li>
                        <li style="margin-bottom: 6px;">ציוד שיוחזר פגום יחויב בהתאם</li>
                    </ul>
                    <p style="margin: 8px 0 0; font-weight: bold; color: #e65100;">לקוחות שלא יעמדו בתנאים אלו יחויבו בתשלום נוסף!</p>
                </div>
                
                <!-- Return Time Notice -->
                <div id="return-time-notice" class="return-time-notice info" bis_skin_checked="1">
                    <strong>שימו לב!</strong> החזרת הציוד מתבצעת עד השעה 10:00 בבוקר.
                </div>
                
                <div id="weekend-return-notice" class="weekend-return-notice info" style="display: none;" bis_skin_checked="1">
                    <strong>שימו לב!</strong> השכרת הציוד כוללת את סוף השבוע, החזרתו תתבצע ביום ראשון.
                </div>
                
                            </div>
        </div>

- next item
-

next in place, the custom retun hour
we have currently place a custom pickup mechanism

this acf custom field once the site admin chooses the pickup hour 
--

we need a new field that acts in a similar fashion but as the return hour, if the admin chooses it it will be reflected on the checkout and the product page as a notice


return_overide_copy

             "key": "field_6811d2468c9bb",
                "label": "שעת החזרה מותאמת",
                "name": "return_overide_copy",
                "aria-label": "",
                "type": "number",
                "instructions": "",
                "required": 0,
                "conditional_logic": 0,
                "wrapper": {
                    "width": "",
                    "class": "",
                    "id": ""
                },
                "default_value": "10:00",


                designated targets

                product page

                <div id="early-return-notice" style="margin: 15px 0; padding: 12px; background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px;" bis_skin_checked="1">
                    <strong style="color: #0d47a1;">שימו לב!</strong> עבור תאריך זה יש הזמנה למחרת.
                    <div style="margin-top: 5px;" bis_skin_checked="1">יש להחזיר את הציוד <strong>עד השעה 09:00</strong> בבוקר.</div>
                </div>

                this message needs to be similar in fashion and added to adjacent location (they can both apear at the same time if the client tries to order a secondary item that has both reserved dates on 1st and last days of the booking)
                needless to say once the user begins a new selection those messages should not be visible

                on the checkout / review page 
                <div class="main" bis_skin_checked="1">
                    <h3 class="title">איסוף עצמי</h3>
                    <div class="form-wrap form-default" bis_skin_checked="1">
                        <div class="input-wrap" bis_skin_checked="1">
                            <input type="text" name="billing_first_name" id="name" placeholder="" required="">
                            <label for="name">שם פרטי *</label>
                        <div data-lastpass-icon-root="" style="position: relative !important; height: 0px !important; width: 0px !important; float: left !important;" bis_skin_checked="1"></div></div>
                        <div class="input-wrap" bis_skin_checked="1">
                            <input type="text" name="billing_last_name" id="surname" placeholder="" required="">
                            <label for="surname">שם משפחה *</label>
                        </div>
                        <div class="input-wrap" bis_skin_checked="1">
                            <input type="email" name="billing_email" id="email" placeholder="example@gmail.com" required="">
                            <label for="email">כתובת אימייל *</label>
                        </div>
                        <div class="input-wrap" bis_skin_checked="1">
                            <input type="tel" name="billing_phone" id="tel" placeholder="" required="" class="tel">
                            <label for="tel">מספר טלפון *</label>
                        </div>
                        <div class="input-wrap" bis_skin_checked="1">
                            <input type="number" name="billing_guests" id="number" placeholder="10" required="">
                            <label for="number">כמות המשתתפים *</label>
                        </div>


                                                <div class="input-wrap" bis_skin_checked="1">
                            <label for="pickup_time">שעת איסוף *</label>
                            <span class="woocommerce-input-wrapper">
                                <div class="pickup-time-wrapper" bis_skin_checked="1"><select class="select select2-time select2-hidden-accessible" data-placeholder="שעת איסוף" name="order_comments" id="pickup_time" tabindex="-1" aria-hidden="true"><option value="8:00">8:00</option><option value="9:00">9:00</option><option value="10:00">10:00</option><option value="11:00">11:00</option><option value="12:00">12:00</option><option value="13:00">13:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option><option value="16:00">16:00</option></select><div class="pickup-time-notice" style="display: none;" bis_skin_checked="1"></div><div class="pickup-time-error" bis_skin_checked="1"></div></div><div class="business-hours-info" bis_skin_checked="1">
            <strong>שעות פעילות:</strong><br>
            א׳–ה׳: 08:00–16:00<br>
            ו׳: 08:00–14:00
        </div><span class="select2 select2-container select2-container--default" dir="rtl" style="width: 100%;"><span class="selection"><span class="select2-selection select2-selection--single" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-labelledby="select2-pickup_time-container" role="combobox"><span class="select2-selection__rendered" id="select2-pickup_time-container" role="textbox" aria-readonly="true" title="11:00">11:00</span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                            </span>
                        </div>
                        
                        <div class="input-wrap-checked" bis_skin_checked="1">
                            <input type="checkbox" name="billing_check" id="check" value="1">
                            <label for="check">הנני מאשר כי קיבלתי לידי את התנאים הכלליים המצורפים על נספחיהם, אלה הוסברו לי ואני מסכים לתוכנם</label>
                        </div>

                        <div class="input-wrap-checked" style="margin-top: 20px;" bis_skin_checked="1">
                            <input type="checkbox" name="billing_check2" id="check2" value="1">
                            <label for="check2">החזרת המוצר תעשה עד 10:00 בבוקר למחרת יום ההשכרה, למעט השכרות בסוף השבוע בהן יוחזר המוצר ביום ראשון.</label>
                        </div>
                    </div>




                </div>

                we need to place an additional message box that contains the new return hour

                the layout is currently a bit off
                [family] [name]
                [email] [phone]
                [guests] [pickup time (bigger height)] 

                would like it to be as - 
                [family] [name]
                [email] [phone]
                [guests]
                [pickup time]  [return time]
