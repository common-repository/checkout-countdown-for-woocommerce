<?php

/**
 * Add the countdown as a shortcode [checkout_countdown]
 */
function ccfwoo_shortcode() {
	$shortcode = ccfwoo_countdown_html_content( 'shortcode' );

	return $shortcode;
}
add_shortcode( 'checkout_countdown', 'ccfwoo_shortcode' );

/**
 * Legacy shortcodes [cc_countdown] [cc-countdown]
 */
add_shortcode( 'cc_countdown', 'ccfwoo_shortcode' );
add_shortcode( 'cc-countdown', 'ccfwoo_shortcode' );


/**
 * Display the countdown as a checkout notice.
 */
function ccfwoo_checkout_notice() {

	$locations = is_array( ccfwoo_get_option( 'countdown_locations' ) ) ? ccfwoo_get_option( 'countdown_locations' ) : [];

	if ( ! in_array( 'checkout-notice', $locations, true ) ) {
		return;
	}

	return ccfwoo_countdown_html_content( 'notice' );

}

add_action( 'woocommerce_before_checkout_form', 'ccfwoo_checkout_notice', 1 );

/**
 * Display the countdown as a cart notice.
 */
function ccfwoo_cart_notice() {

	$locations = is_array( ccfwoo_get_option( 'countdown_locations' ) ) ? ccfwoo_get_option( 'countdown_locations' ) : [];

	if ( ! in_array( 'cart-notice', $locations, true ) ) {
		return;
	}
	return ccfwoo_countdown_html_content( 'notice' );

}

add_action( 'woocommerce_before_cart', 'ccfwoo_cart_notice', 1 );

/**
 * Display the banner content on the HTML.
 */
function ccfwoo_display_bar() {
	$locations = is_array( ccfwoo_get_option( 'countdown_locations' ) ) ? ccfwoo_get_option( 'countdown_locations' ) : [];

	if ( ! in_array( 'bar', $locations, true ) ) {
		return;
	}

	echo ccfwoo_countdown_html_content( 'bar' );
}
add_action( 'wp_head', 'ccfwoo_display_bar', 100 );

/**
 * Use the newer wp_body_open hook to place the html at the top of th body. Older themes may not be supported, which is why we check.
 */
function ccfwoo_prefer_body_open_for_html() {
	if ( has_action( 'wp_body_open' ) ) {
		remove_action( 'wp_head', 'ccfwoo_display_bar', 100 );
		add_action( 'wp_body_open', 'ccfwoo_display_bar', 110 );
	}
}
add_action( 'wp_loaded', 'ccfwoo_prefer_body_open_for_html', 10 );

/**
 * Loading dots as html.
 */
function ccfwoo_loading_html() {
	$loading_dots = '<div class="checkout-countdown-loading">
    <div class="checkout-countdown-loading-dot"></div>
    <div class="checkout-countdown-loading-dot"></div>
    <div class="checkout-countdown-loading-dot"></div>
	</div>';

	return $loading_dots;
}

/**
 * HTML Content for the countdown.
 * Can also return as WC notice.
 */
function ccfwoo_countdown_html_content( $type ) {

	$loading_dots = ccfwoo_loading_html();
	$has_cart_criteria = ccfwoo_has_cart_criteria();

	$classes = array( 'checkout-countdown-wrapper' );

	if ( ccfwoo_get_option( 'enable_banner_message' ) !== 'on' && ! $has_cart_criteria ) {
		$classes[] = 'checkout-countdown-is-hidden';
	}

	switch ( $type ) {
		case 'shortcode':
			$classes[] = 'checkout-countdown-shortcode';
			break;
		case 'bar':
			$classes[] = 'checkout-countdown-bar';
			break;
		case 'notice':
			$classes[] = 'checkout-countdown-notice';
			break;
	}

	$html = '<div class="' . implode( ' ', $classes ) . '">';
	$html .= '<div class="checkout-countdown-content">';
	$html .= $loading_dots;
	$html .= '</div>';
	$html .= '</div>';

	/**
	 * Notices should be printed as WC notices - they won't display the optional welcome message.
	 */
	if ( $type === 'notice' ) {
		if ( ! $has_cart_criteria ) {
			return '';
		}

		return wc_print_notice( $html, 'error' );
	}

	return $html;
}
