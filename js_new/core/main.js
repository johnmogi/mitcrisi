/**
 * Mitnafun UPro - Main JavaScript File
 * Core functionality for the theme
 */

(function($) {
    'use strict';
    
    // Document ready function
    $(document).ready(function() {
        // Initialize mobile menu
        initMobileMenu();
        
        // Initialize sticky elements
        initStickyElements();
        
        // Initialize carousels
        initCarousels();
    });
    
    // Mobile menu functionality
    function initMobileMenu() {
        $('.mobile-menu-toggle').on('click', function() {
            $('.mobile-menu').toggleClass('active');
            $('body').toggleClass('menu-open');
        });
    }
    
    // Sticky elements
    function initStickyElements() {
        if ($.fn.sticky) {
            $(".sticky-header").sticky({
                topSpacing: 0
            });
        }
    }
    
    // Owl carousel initialization
    function initCarousels() {
        if ($.fn.owlCarousel) {
            $('.owl-carousel').owlCarousel({
                loop: true,
                margin: 10,
                nav: true,
                responsive: {
                    0: {
                        items: 1
                    },
                    600: {
                        items: 3
                    },
                    1000: {
                        items: 4
                    }
                }
            });
        }
    }
    
})(jQuery);
