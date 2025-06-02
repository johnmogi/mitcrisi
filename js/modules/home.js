/**
 * Home Page JavaScript
 * Handles carousels, animations, and other home page specific functionality
 */

(function($) {
    'use strict';
    
    // Initialize home page carousels
    function initHomeCarousels() {
        // Hero slider
        if ($('.hero-slider').length) {
            $('.hero-slider').each(function() {
                $(this).owlCarousel({
                    items: 1,
                    loop: true,
                    margin: 0,
                    nav: true,
                    dots: true,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    smartSpeed: 1000,
                    rtl: true,
                    navText: ['<img src="/wp-content/themes/mitnafun-upro/img/arr-2.svg">', '<img src="/wp-content/themes/mitnafun-upro/img/arr-1.svg">']
                });
            });
        }
        
        // Product carousel
        if ($('.product-carousel').length) {
            $('.product-carousel').owlCarousel({
                loop: true,
                margin: 20,
                nav: true,
                dots: false,
                rtl: true,
                navText: ['<img src="/wp-content/themes/mitnafun-upro/img/arr-2.svg">', '<img src="/wp-content/themes/mitnafun-upro/img/arr-1.svg">'],
                responsive: {
                    0: {
                        items: 1
                    },
                    576: {
                        items: 2
                    },
                    992: {
                        items: 3
                    },
                    1200: {
                        items: 4
                    }
                }
            });
        }
        
        // Testimonial slider
        if ($('.testimonial-slider').length) {
            $('.testimonial-slider').owlCarousel({
                items: 1,
                loop: true,
                margin: 0,
                nav: true,
                dots: true,
                autoplay: true,
                autoplayTimeout: 6000,
                smartSpeed: 1000,
                rtl: true,
                navText: ['<img src="/wp-content/themes/mitnafun-upro/img/arr-2.svg">', '<img src="/wp-content/themes/mitnafun-upro/img/arr-1.svg">']
            });
        }
    }
    
    // Initialize animations
    function initAnimations() {
        // Animate elements on scroll
        $('.animate-on-scroll').each(function() {
            var $this = $(this);
            
            $(window).scroll(function() {
                var topPosition = $this.offset().top;
                var scrollPosition = $(window).scrollTop() + $(window).height() * 0.8;
                
                if (scrollPosition > topPosition) {
                    $this.addClass('animated');
                }
            });
            
            // Trigger scroll to check initial view
            $(window).trigger('scroll');
        });
    }
    
    // Initialize category filters
    function initCategoryFilters() {
        $('.category-filter').on('click', function(e) {
            e.preventDefault();
            
            var category = $(this).data('category');
            
            // Update active state
            $('.category-filter').removeClass('active');
            $(this).addClass('active');
            
            // Filter products
            if (category === 'all') {
                $('.product-item').show();
            } else {
                $('.product-item').hide();
                $('.product-item[data-category="' + category + '"]').show();
            }
        });
    }
    
    // Initialize featured product tabs
    function initProductTabs() {
        $('.product-tab-link').on('click', function(e) {
            e.preventDefault();
            
            var tabId = $(this).data('tab');
            
            // Update active state
            $('.product-tab-link').removeClass('active');
            $(this).addClass('active');
            
            // Show tab content
            $('.product-tab-content').removeClass('active');
            $('#' + tabId).addClass('active');
        });
    }
    
    // Initialize text truncation
    function initTextTruncation() {
        if ($.fn.cuttr) {
            $('.truncate-text').each(function() {
                var $this = $(this);
                var length = $this.data('truncate') || 100;
                
                $this.cuttr({
                    length: length,
                    readMore: true,
                    readMoreText: 'קרא עוד',
                    readLessText: 'קרא פחות'
                });
            });
        }
    }
    
    // Initialize on document ready
    $(document).ready(function() {
        // Initialize all home page components
        initHomeCarousels();
        initAnimations();
        initCategoryFilters();
        initProductTabs();
        initTextTruncation();
        
        // Sticky header
        if ($.fn.sticky) {
            $('header').sticky({
                topSpacing: 0,
                zIndex: 999
            });
        }
        
        // Smooth scroll to anchors
        $('a[href*="#"]:not([href="#"])').on('click', function() {
            if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                
                if (target.length) {
                    $('html, body').animate({
                        scrollTop: target.offset().top - 100
                    }, 1000);
                    return false;
                }
            }
        });
    });
    
})(jQuery);
