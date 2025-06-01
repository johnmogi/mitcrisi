# MitnaFun UPro Theme - File Structure & Code Review

## File Structure
```
mitnafun_upro/
├── acf-export-2025-04-17.json      # ACF export
├── air-datepicker/                 # Datepicker assets
├── css/                            # Custom CSS files
├── fonts/                          # Font files
├── img/                            # Image assets
├── inc/                            # PHP modules
│   ├── admin-orders.php            # Admin order UI
│   ├── ajax-actions.php            # AJAX endpoint handlers
│   ├── bookings.php                # Booking logic
│   ├── checkout.php                # Checkout customizations
│   ├── direct-price-fix.php        # Price override filters
│   ├── kama_pagenavi.php           # Pagination library
│   ├── price-fix.php               # Display price adjustments
│   └── rental-pricing.php          # Rental pricing calculations
├── js/                             # Front‑end scripts
├── parts/                          # Theme parts
├── sass/                           # Sass source files
├── screenshot.png                  # Theme preview
├── template-parts/                 # Template partials
├── templates/                      # Page templates
├── woocommerce/                    # Custom WooCommerce templates
├── footer.php                      # Footer markup
├── functions.php                   # Core theme functions
├── header.php                      # Header markup
├── index.php                       # Main template
├── page.php                        # Page template
├── single.php                      # Single post template
├── style-calendar.css              # Calendar styling
├── style.css                       # Theme stylesheet
├── debug.log                       # Runtime log (should be removed)
└── error_log                       # PHP errors (should be removed)
```

## Key Files & Functions
- **functions.php** (~33k lines) implements theme setup, enqueues assets, custom hooks, shortcodes, widgets.
- **inc/admin-orders.php**: functions prefixed `mf_admin_` for filtering and displaying orders in WP admin.
- **inc/ajax-actions.php**: AJAX handlers (e.g., `mf_ajax_get_available_dates`), lacking nonce checks.
- **inc/bookings.php**: `mf_get_bookings()`, date parsing and reservation checks.
- **inc/checkout.php**: modifications to `woocommerce_checkout_fields`, custom validation.
- **inc/direct-price-fix.php**: filters like `mf_direct_price_fix` overriding price logic.
- **inc/price-fix.php**: functions adjusting displayed prices on product pages.
- **inc/rental-pricing.php**: `mf_calculate_rental_price()` computing rental fees.
- **js/**: scripts for datepicker init, booking UI, AJAX calls; ensure proper enqueue.
- **woocommerce/**: overrides templates for cart, checkout, product details.

## Identified Weaknesses & Issues
- **Monolithic code**: `functions.php` is too large, should be modularized.
- **Direct DB queries**: custom SQL not using `$wpdb->prepare`, injection risk.
- **Missing security**: AJAX endpoints lack nonce & capability checks.
- **Improper asset loading**: scripts/styles may be hardcoded rather than enqueued.
- **Debug files in repo**: `debug.log` & `error_log` tracked; should be gitignored.
- **Hardcoded text**: missing `__()`/`_e()` i18n wrappers.
- **Naming inconsistencies**: mixed prefixes (`mf_`, `mitnafun_`, none).
- **Sparse documentation**: few docblocks or comments.
- **Unused/stale files**: `acf-export-2025-04-17.json` and logs.
- **Deprecated patterns**: manual pagination lib (`kama_pagenavi`) instead of WP core.

## Next Steps
1. Refactor large files into classes/modules.
2. Secure AJAX (nonces, permissions) and use prepared statements.
3. Remove logs; update `.gitignore`.
4. Standardize naming and add docblocks.
5. Enqueue assets properly; optimize build.
6. Review WooCommerce template overrides.
```
