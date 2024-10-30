<?php

/**
 * Generate the HTML for the cart fragment. This will keep our cart criteria up to date.
 * @return string The generated HTML with no visuals, data is stored as an attribute.
 */
function ccfwoo_get_cart_fragment_html() {

	$data_attribute = ccfwoo_has_cart_criteria();

	return '<div class="ccfwoo-cart-fragment" data-has-cart-criteria="' . esc_attr( $data_attribute ) . '"></div>';
}

/**
 * Filter to add custom cart fragment.
 *
 * @param array $fragments Fragments to refresh via AJAX.
 * @return array Modified fragments.
 */
function ccfwoo_cart_fragments( $fragments ) {

	$fragments['.ccfwoo-cart-fragment'] = ccfwoo_get_cart_fragment_html();

	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'ccfwoo_cart_fragments', 10, 1 );

/**
 * Output the cart fragment HTML in the WP footer.
 */
function ccfwoo_output_cart_fragment_html() {
	echo ccfwoo_get_cart_fragment_html();
}
add_action( 'wp_footer', 'ccfwoo_output_cart_fragment_html' );
