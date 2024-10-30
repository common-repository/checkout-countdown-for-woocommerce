/* global ccfwooLocal */
/**
 * Global Checkout Countdown Status via the window.ccfwooController object.
 *
 * STOP the countdown window.ccfwooController.stopInterval();
 * RESTART the countdown by setting window.ccfwooController.startInterval();
 */

var ccfwooController = {
	counting: false,
	interval: false,
	htmlElements: false,
	forceStop: false, // Used to override the criteria.
	config: ccfwooLocal, // localized data.
	setElements(classNames) {
		const classes = classNames ? classNames : "checkout-countdown-wrapper";
		const elements = document.getElementsByClassName(classes);
		this.htmlElements = elements;

		return elements;
	},
	getElements() {
		return this.htmlElements;
	},
	setHtml(textType, elements, duration) {
		// DOM elements.
		elements = elements ? elements : this.htmlElements;
		// Duration for counting down.
		duration = duration ? duration : false;

		if (!elements || !textType) {
			return false;
		}

		let i;

		for (i = 0; i < elements.length; i++) {
			// Get the content which is inside the wrapper.
			const contentElement = elements[i].firstElementChild;

			if (textType === "loading") {
				ccfwooLoadingHTML(contentElement);
			}
			if (textType === "counting") {
				ccfwooUpdateCountingHTML(contentElement, duration);
			}
			if (textType === "expired") {
				ccfwooFinishedCountingHTML(contentElement);
			}
			if (
				textType === "banner" &&
				!elements[i]?.classList.contains("checkout-countdown-notice")
			) {
				ccfwooBannerHTML(contentElement);
			}
		}

		return true;
	},
	isCounting() {
		return this.counting;
	},
	hasCartCriteria() {
		var cartFragment = document.querySelector(".ccfwoo-cart-fragment");

		if (cartFragment && !this.forceStop) {
			var hasValidCart =
				cartFragment.getAttribute("data-has-cart-criteria") &&
				cartFragment.getAttribute("data-has-cart-criteria") == true;

			return hasValidCart;
		}

		return false;
	},
	setIsCounting(value) {
		if (value === false) {
			ccfwooController.classes("remove", "checkout-countdown-is-counting");
		} else {
			ccfwooController.classes("add", "checkout-countdown-is-counting");
			ccfwooController.classes("remove", "checkout-countdown-is-hidden");
			ccfwooController.classes("remove", "checkout-countdown-is-expired");
		}

		this.counting = value;
	},
	stopInterval(clearDate) {
		if (clearDate === true) {
			localStorage.removeItem("ccfwoo_end_date");
		}

		this.setIsCounting(false);
		clearInterval(this.interval);
	},
	startInterval() {
		// we are only counting if there's a cart.
		if (this.hasCartCriteria()) {
			this.setIsCounting(true);
		} else {
			this.setIsCounting(false);
		}

		this.interval = setInterval(ccfwooCounter, 1000);
	},
	restartInterval() {
		// Restart the countdown.
		this.stopInterval(true);
		this.setHtml("loading");
		this.startInterval();
	},
	setNewDate(seconds) {
		// If manual seconds, otherwise settings page minutes to seconds.
		const addOnSeconds = seconds ? seconds : 60 * ccfwooLocal.ccfwoo_minutes;

		const date = new Date();
		date.setSeconds(date.getSeconds() + addOnSeconds);

		localStorage.setItem("ccfwoo_end_date", date);

		return date;
	},
	triggerEvent(target, eventName) {
		// Create the event.
		eventName = new Event(eventName, { bubbles: true });

		if (target === "document") {
			document.dispatchEvent(eventName);
		}
		if (target === "window") {
			window.dispatchEvent(eventName);
		}
		if (target === "body") {
			const getBody = document.getElementsByTagName("BODY")[0];
			getBody.dispatchEvent(eventName);
		}
	},
	classes(type, classNames, newClassNames) {
		const elements = this.htmlElements;

		if (!elements) {
			return false;
		}

		let i;
		// foreach HTML element.
		for (i = 0; i < elements.length; i++) {
			if (type === "add") {
				elements[i].classList.add(classNames);
			}
			if (type === "remove") {
				elements[i].classList.remove(classNames);
			}
			if (type === "replace" && newClassNames) {
				elements[i].classList.remove(classNames);
				elements[i].classList.add(newClassNames);
			}
		}
	},
};

/**
 * Init Checkout Countdown.
 */
document.addEventListener("DOMContentLoaded", function (event) {
	// eslint-disable-line
	ccfwooController.setElements(); // Get instances of Checkout Countdown in the DOM.
	// Register new event, ccfwooHasLoaded.
	ccfwooController.triggerEvent("document", "ccfwooLoaded", true);

	ccfwooCounter(); // Run without delay once.

	ccfwooController.startInterval(); // Start the interval.

	// Add CSS Class when counting.
	if (ccfwooController.isCounting()) {
		ccfwooController.classes("add", "checkout-countdown-is-counting");
	}
});

/**
 * Event when the countdown has finished counting.
 */
document.addEventListener("ccfwooFinishedCounting", function (event) {
	// eslint-disable-line
	ccfwooController.classes("remove", "checkout-countdown-is-counting");
});

/**
 * Handles the countdown as an interval.
 */
function ccfwooCounter() {
	// Stop early if no cart available and display the banner.
	if (!ccfwooController.hasCartCriteria()) {
		ccfwooController.setHtml("banner");
		ccfwooController.classes("remove", "checkout-countdown-is-counting");
		ccfwooController.stopInterval(true);
		return;
	}

	// Workout the start and end dates.
	const range = ccfwooGetDurationRange();
	// Get duration in a nice formats.
	const duration = ccfwooFormatDuration(range.start, range.end);

	// Stop if zero or below.
	if (duration.isPast === true) {
		// Set loading dots.
		ccfwooController.setHtml("loading");
		// Stop the interval and clear date.
		ccfwooController.stopInterval(true);
		// Dispatch our reached zero event.
		ccfwooController.triggerEvent("document", "ccfwooReachedZero", true);
		// Wait a second.
		setTimeout(function () {
			// stop here if we are still counting.
			if (ccfwooController.isCounting()) {
				return;
			}
			// Expired text.
			ccfwooController.classes("add", "checkout-countdown-is-expired");
			ccfwooController.setHtml("expired");

			ccfwooController.triggerEvent("document", "ccfwooFinishedCounting", true);
		}, 1000);
		// Wait 5 seconds and display default text.
		setTimeout(function () {
			// stop here if we are still counting.
			if (ccfwooController.isCounting()) {
				return;
			}
			ccfwooController.setHtml("banner");
		}, parseInt(ccfwooLocal.expired_message_seconds) * 1000); // Default 6.
	} else {
		// Update the counter in the DOM.
		ccfwooController.setHtml("counting", false, duration);
	}
}

/**
 * Set the counting html in the DOM.
 */
function ccfwooUpdateCountingHTML(element, duration) {
	// Exit if no element.
	if (!element) {
		return;
	}

	let string = ccfwooLocal.countdown_text.replace(
		"{minutes}",
		duration.minutes
	);
	string = string.replace("{seconds}", duration.seconds);
	string = string.replace("{hours}", duration.hours);
	string = string.replace("{days}", duration.days);

	element.innerHTML = string;
}

/**
 * Set the loading dots in the DOM.
 */
function ccfwooLoadingHTML(element) {
	// Exit if no element.
	if (!element) {
		return;
	}

	element.innerHTML = ccfwooLocal.loading_html;
}
/**
 * Set the banner html in the DOM.
 */
function ccfwooBannerHTML(element) {
	if (!element) {
		return;
	}
	// Banner message if selected.
	if (
		ccfwooLocal.enable_banner_message === "on" &&
		ccfwooLocal.banner_message_text
	) {
		element.innerHTML = ccfwooLocal.banner_message_text;
	}
}

function ccfwooFinishedCountingHTML(element) {
	// Exit if no element.
	if (!element) {
		return;
	}

	element.innerHTML = ccfwooLocal.expired_text;
}

/**
 * Get the duration range (start and end) dates of our countdown.
 */
function ccfwooGetDurationRange() {
	const rightNow = new Date();

	let endDate = localStorage.getItem("ccfwoo_end_date")
		? localStorage.getItem("ccfwoo_end_date")
		: false;

	if (endDate) {
		endDate = new Date(endDate);
	} else {
		endDate = ccfwooController.setNewDate();
	}

	const range = {
		start: rightNow,
		end: endDate,
	};

	return range;
}

/**
 * Work out the duration and format it into nice object with additional details.
 */
function ccfwooFormatDuration(startDate, endDate) {
	const diff = new Date(endDate) - new Date(startDate);

	const ValidDates = Number.isInteger(diff);

	const weekdays = Math.floor(diff / 1000 / 60 / 60 / 24 / 7);
	const days = Math.floor(diff / 1000 / 60 / 60 / 24 - weekdays * 7);
	const hours = Math.floor(
		diff / 1000 / 60 / 60 - weekdays * 7 * 24 - days * 24
	);
	const minutes = Math.floor(
		diff / 1000 / 60 - weekdays * 7 * 24 * 60 - days * 24 * 60 - hours * 60
	);
	const seconds = Math.floor(
		diff / 1000 -
			weekdays * 7 * 24 * 60 * 60 -
			days * 24 * 60 * 60 -
			hours * 60 * 60 -
			minutes * 60
	);
	const milliseconds = Math.floor(
		diff -
			weekdays * 7 * 24 * 60 * 60 * 1000 -
			days * 24 * 60 * 60 * 1000 -
			hours * 60 * 60 * 1000 -
			minutes * 60 * 1000 -
			seconds * 1000
	);

	// Check if the start date is past the end date.
	const isPast = diff / 1000 <= 0 ? true : false;

	const formattedDifference = {
		milliseconds,
		seconds: ccfwooLeadingZero(seconds),
		minutes: ccfwooLeadingZero(minutes),
		hours,
		days,
		weekdays,
		totalSeconds: diff / 1000,
		isPast,
		ValidDates,
	};

	return formattedDifference;
}

/**
 * Add leading zeros to any number.
 */
function ccfwooLeadingZero(number) {
	if (ccfwooLocal.leading_zero === "on") {
		// Set numbers to be 2 sizes, e.g 05.
		const size = 2;

		number = number.toString();

		while (number.length < size) number = "0" + number;

		return number;
	}

	return number;
}
