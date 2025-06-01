/**
 * Date Parser for Rental Dates
 * Correctly parses rental date ranges and prepares them for the datepicker
 */
jQuery(document).ready(function($) {
    console.log("Date Parser loaded");
    
    // Process booked dates from the PHP data
    if (typeof window.bookedDates !== 'undefined') {
        console.log("Product ID:", window.product_id || "Unknown");
        console.log("Rental dates:", window.bookedDates);
        console.log("Initial booked dates from PHP:", window.bookedDates);
        
        // Parse date ranges into individual dates
        console.log("Starting to parse dates...");
        
        try {
            // Make sure bookedDates is an array
            if (!Array.isArray(window.bookedDates)) {
                console.log("bookedDates is not an array, converting...");
                window.bookedDates = [window.bookedDates];
            }
            
            // Process each date range
            const allBookedDates = window.bookedDates.flatMap(function(dateRange) {
                console.log("Processing date range:", dateRange);
                
                // Skip if dateRange is invalid
                if (!dateRange || dateRange === '') {
                    console.log("Empty date range, skipping");
                    return [];
                }
                
                // Parse date range (format: DD.MM.YYYY - DD.MM.YYYY)
                const rangeParts = dateRange.split(' - ');
                if (rangeParts.length !== 2) {
                    console.log("Invalid date range format:", dateRange);
                    return [];
                }
                
                const startParts = rangeParts[0].split('.');
                const endParts = rangeParts[1].split('.');
                
                // Validate parts
                if (startParts.length !== 3 || endParts.length !== 3) {
                    console.log("Invalid date format in range:", dateRange);
                    return [];
                }
                
                // Format: DD.MM.YYYY -> create Date objects (note: month is 0-indexed in JS Date)
                const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
                const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
                
                console.log("Parsed start date:", startDate);
                console.log("Parsed end date:", endDate);
                
                // Create array of all dates in the range
                const datesInRange = [];
                let currentDate = new Date(startDate);
                
                while (currentDate <= endDate) {
                    datesInRange.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                return datesInRange;
            });
            
            console.log("All parsed booked dates:", allBookedDates);
            
            // Store all dates for use with the datepicker
            window.parsedBookedDates = allBookedDates;
            
            // Update datepicker to reflect booked dates
            if (typeof AirDatepicker !== 'undefined' && allBookedDates.length > 0) {
                // Datepicker API usage depends on the specific implementation
            }
        } catch (error) {
            console.error("Error parsing dates:", error);
        }
    } else {
        console.log("No booked dates found");
    }
});
