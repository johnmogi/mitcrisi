/**
 * Emergency fix for the date parsing issue on product pages
 * This script runs after all other scripts to fix any date processing errors
 */
jQuery(document).ready(function($) {
    console.log("Fixes script loaded");
    
    // Wait a short time to ensure all other scripts have run
    setTimeout(function() {
        try {
            // Fix for the split error on product pages
            if (window.bookedDates && window.bookedDates.length > 0) {
                console.log("Applying fixes to rental dates processing");
                
                // Get all script tags in the page
                const scripts = document.getElementsByTagName('script');
                
                // Flag to track if we've fixed the issue
                let fixApplied = false;
                
                // Look for inline scripts that might be causing the error
                for (let i = 0; i < scripts.length; i++) {
                    const scriptContent = scripts[i].innerHTML;
                    
                    // Check if the script contains problematic date processing code
                    if (scriptContent && (
                        scriptContent.includes('bookedDates.map') ||
                        scriptContent.includes('split') && scriptContent.includes('bookedDates')
                    )) {
                        console.log("Found problematic script, applying fix");
                        
                        // Override any problematic functions with safe versions
                        window.parseRentalDates = function(dates) {
                            if (!dates || !Array.isArray(dates) || dates.length === 0) {
                                return [];
                            }
                            
                            const parsedDates = [];
                            
                            dates.forEach(function(dateRange) {
                                if (!dateRange) return;
                                
                                try {
                                    const rangeParts = dateRange.split(' - ');
                                    if (rangeParts.length !== 2) return;
                                    
                                    const startParts = rangeParts[0].split('.');
                                    const endParts = rangeParts[1].split('.');
                                    
                                    if (startParts.length !== 3 || endParts.length !== 3) return;
                                    
                                    const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
                                    const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
                                    
                                    let currentDate = new Date(startDate);
                                    while (currentDate <= endDate) {
                                        parsedDates.push(new Date(currentDate));
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }
                                } catch (e) {
                                    console.error("Error parsing date range:", e);
                                }
                            });
                            
                            return parsedDates;
                        };
                        
                        // Apply the fix
                        window.parsedBookedDates = window.parseRentalDates(window.bookedDates);
                        console.log("Parsed booked dates:", window.parsedBookedDates);
                        
                        fixApplied = true;
                        break;
                    }
                }
                
                if (!fixApplied) {
                    console.log("No problematic scripts found, applying general fix");
                    window.parsedBookedDates = [];
                    
                    window.bookedDates.forEach(function(dateRange) {
                        if (!dateRange) return;
                        
                        try {
                            const rangeParts = dateRange.split(' - ');
                            if (rangeParts.length !== 2) return;
                            
                            console.log("Parsed date range parts:", rangeParts);
                        } catch (e) {
                            console.error("General fix - Error parsing date range:", e);
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error in fixes script:", e);
        }
    }, 500); // Wait 500ms
});
