// Debug script for calendar integration
jQuery(document).ready(function($) {
    console.log("===== CALENDAR DEBUG SCRIPT STARTED =====");
    
    // Only run on single product pages
    if (typeof window.bookedDates !== 'undefined') {
        console.log("Product ID:", window.product_id || calendar_debug_data?.product_id || "Unknown");
        console.log("Rental dates array:", window.bookedDates);
        console.log("Rental dates JSON:", JSON.stringify(window.bookedDates));
        console.log("Rental dates length:", window.bookedDates ? window.bookedDates.length : 0);
        
        // Direct database query for this product
        $.ajax({
            url: '/wp-admin/admin-ajax.php',
            type: 'POST',
            data: {
                action: 'debug_rental_dates',
                product_id: window.product_id || calendar_debug_data?.product_id || 497
            },
            success: function(response) {
                console.log("===== DIRECT DATABASE QUERY RESULTS =====");
                console.log("AJAX Response:", response);
                
                if (response.db_results && response.db_results.length > 0) {
                    console.log("Found " + response.db_results.length + " bookings in database");
                    
                    // Log each booking
                    response.db_results.forEach(function(booking, index) {
                        console.log("Booking #" + (index + 1) + ":");
                        console.log(" - Product: " + booking.product_name);
                        console.log(" - Rental dates: " + booking.rental_dates);
                        console.log(" - Product ID: " + booking.product_id);
                    });
                    
                    console.log("Query used:", response.db_query);
                } else {
                    console.log("No bookings found in database for product ID: " + (window.product_id || calendar_debug_data?.product_id || 497));
                }
                
                // Check if there's a discrepancy
                if (window.bookedDates && window.bookedDates.length === 0 && 
                    response.db_results && response.db_results.length > 0) {
                    console.error("DISCREPANCY DETECTED: Database shows bookings but bookedDates in JavaScript is empty");
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX Error:", error);
                console.error("Status:", status);
                console.error("Response:", xhr.responseText);
            }
        });
        
        // Test database connection with a simpler query
        $.ajax({
            url: '/wp-admin/admin-ajax.php',
            type: 'POST',
            data: {
                action: 'test_database_connection'
            },
            success: function(response) {
                console.log("===== DATABASE CONNECTION TEST =====");
                console.log("Database connection test:", response);
            },
            error: function(xhr, status, error) {
                console.error("Database connection test error:", error);
            }
        });
    } else {
        console.log("bookedDates variable not found on page");
    }
    
    console.log("===== CALENDAR DEBUG SCRIPT COMPLETED =====");
});
