<?php
/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/archive-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://woo.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.4.0
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );



?>


    <section class="category">
        <div class="content-width">
            <h1><?php the_archive_title('', false)        ?></h1>
            <div action="#">
                <div class="select-line">
                    <div class="wrap">
                        <div class="select-line">
                            <div class="wrap">
                                <?php 
                                $terms = get_terms(['taxonomy' => 'product_cat']); 
                                
                                // Get current category ID
                                $current_cat_id = 0;
                                if (is_product_category()) {
                                    $current_cat = get_queried_object();
                                    if ($current_cat) {
                                        $current_cat_id = $current_cat->term_id;
                                    }
                                }
                                
                                // Don't show the current category or 'uncategorised' initially
                                foreach ($terms as $term) { 
                                    // Skip 'uncategorised' category completely
                                    if (strtolower($term->slug) === 'uncategorised') {
                                        continue;
                                    }
                                    
                                    // For the current category, add a hidden class that can be toggled with JS
                                    $hide_class = '';
                                    if ($term->term_id == $current_cat_id) {
                                        $hide_class = 'initially-hidden';
                                    }
                                ?>
                                <div class="input-wrap-checkbox <?php echo $hide_class; ?>">
                                    <label>
                                        <a class="<?php echo ($term->term_id == $current_cat_id) ? 'selected' : ''; ?>" href="<?php echo get_term_link($term); ?>">
                                           <?php echo $term->name; ?>
                                        </a>
                                    </label>
                                </div>
                                <?php } ?>
                                
                                <script>
                                // Add JavaScript to show the initially hidden category when any other category is clicked
                                jQuery(document).ready(function($) {
                                    // When any category link is clicked
                                    $('.input-wrap-checkbox a').on('click', function() {
                                        // Show all categories that might be hidden
                                        $('.input-wrap-checkbox.initially-hidden').removeClass('initially-hidden');
                                    });
                                });
                                </script>
                                
                                <style>
                                /* Hide the initially hidden categories */
                                .input-wrap-checkbox.initially-hidden {
                                    display: none;
                                }
                                </style>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content">

                    <?php
                    while ( have_posts() ) {
                        the_post();

                        /**
                         * Hook: woocommerce_shop_loop.
                         */
                        do_action( 'woocommerce_shop_loop' );

                        wc_get_template_part( 'content', 'product' );
                    }

                    ?>

                </div>
                <div class="">
                    <?php woocommerce_pagination() ?>
                </div>
            </div>
        </div>
    </section>

    <section class="btn-block">
        <div class="bg">
            <img src="<?= get_template_directory_uri() ?>/img/after-6-1.svg" alt="" class="img-1">
            <img src="<?= get_template_directory_uri() ?>/img/after-6-2.svg" alt="" class="img-2">
        </div>
        <div class="content-width">
            <div class="btn-wrap">
                <a href="<?php the_permalink(389) ?>" class="btn-border"><img src="<?= get_template_directory_uri() ?>/img/icon-6.svg" alt=""><span>פתח את המדריך למשתמש</span></a>
            </div>
        </div>
    </section>

    <?php get_template_part('parts/faq') ?>

    <?php get_template_part('template-parts/builder/section-google_reviews') ?>


 <?php get_footer() ?>
