/**
 * External dependencies
 */
import a11yPlugin from 'colord/plugins/a11y';
import { colord, extend } from 'colord';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useReducer } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { getBlockSelector } from '@wordpress/global-styles-engine';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Tooltip, Icon } from '@wordpress/components';
import { caution } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

extend( [ a11yPlugin ] );

function getComputedValue( node, property ) {
	return node.ownerDocument.defaultView
		.getComputedStyle( node )
		.getPropertyValue( property );
}

function getBlockElementColors( blockEl, blockType ) {
	if ( ! blockEl || ! blockType ) {
		return {};
	}

	// Get color-specific selectors.
	const textSelector = getBlockSelector( blockType, 'color.text', {
		fallback: true,
	} );
	const backgroundSelector = getBlockSelector(
		blockType,
		'color.background',
		{ fallback: true }
	);

	// Find target elements - querySelector handles all the complexity
	const textElement = blockEl.querySelector( textSelector ) || blockEl;
	const backgroundElement =
		blockEl.querySelector( backgroundSelector ) || blockEl;
	const linkElement = blockEl.querySelector( 'a' );

	// Get computed colors from the appropriate elements
	const textColor = getComputedValue( textElement, 'color' );
	const linkColor =
		linkElement && linkElement.textContent
			? getComputedValue( linkElement, 'color' )
			: undefined;

	let backgroundColorNode = backgroundElement;
	let backgroundColor = getComputedValue(
		backgroundColorNode,
		'background-color'
	);
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor = getComputedValue(
			backgroundColorNode,
			'background-color'
		);
	}

	return {
		textColor,
		backgroundColor,
		linkColor,
	};
}

function reducer( prevColors, newColors ) {
	const hasChanged = Object.keys( newColors ).some(
		( key ) => prevColors[ key ] !== newColors[ key ]
	);

	// Do not re-render if the colors have not changed.
	return hasChanged ? newColors : prevColors;
}

export default function BlockColorContrastChecker( { clientId, name } ) {
	const blockEl = useBlockElement( clientId );
	const [ colors, setColors ] = useReducer( reducer, {} );

	const blockType = useSelect(
		( select ) => {
			return name
				? select( blocksStore ).getBlockType( name )
				: undefined;
		},
		[ name ]
	);

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}

		// Combine `useLayoutEffect` and two rAF calls to ensure that values are read
		// after the current paint but before the next paint.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () =>
				setColors( getBlockElementColors( blockEl, blockType ) )
			)
		);
	} );

	// Runs in its own effect with dependencies so the observer is only
	// recreated when the block element or block type changes.
	useLayoutEffect( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}

		const observer = new window.MutationObserver( () => {
			setColors( getBlockElementColors( blockEl, blockType ) );
		} );

		observer.observe( blockEl, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ blockEl, blockType ] );

	return (
		<ContrastChecker
			backgroundColor={ colors.backgroundColor }
			textColor={ colors.textColor }
			linkColor={ colors.linkColor }
			enableAlphaChecker
		/>
	);
}

/**
 * Checks whether a foreground color has insufficient contrast against a
 * background color per WCAG AA (small text).
 *
 * @param {string} foreground Foreground color string (rgb/hex).
 * @param {string} background Background color string (rgb/hex).
 * @return {boolean} True when contrast is insufficient.
 */
function hasPoorContrast( foreground, background ) {
	if ( ! foreground || ! background ) {
		return false;
	}
	const colordBackground = colord( background );
	const colordForeground = colord( foreground );
	// Skip transparent colors — the checker can't accurately evaluate them.
	if ( colordBackground.alpha() < 1 || colordForeground.alpha() < 1 ) {
		return false;
	}
	return ! colordForeground.isReadable( colordBackground, {
		level: 'AA',
		size: 'small',
	} );
}

/**
 * Renders a compact warning overlay at the top of a color picker popover when
 * the block's current text/background color combination has insufficient
 * contrast. Hovering or focusing the indicator reveals the full message via a
 * Tooltip.
 *
 * Intended to be passed as the `contrastChecker` prop of
 * `ColorGradientDropdownItem`.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @param {string} props.name     Block name.
 */
export function ColorPopoverContrastChecker( { clientId, name } ) {
	const blockEl = useBlockElement( clientId );
	const [ colors, setColors ] = useReducer( reducer, {} );

	const blockType = useSelect(
		( select ) => {
			return name
				? select( blocksStore ).getBlockType( name )
				: undefined;
		},
		[ name ]
	);

	// Re-read colors on every render to catch any change.
	useLayoutEffect( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () =>
				setColors( getBlockElementColors( blockEl, blockType ) )
			)
		);
	} );

	// Watch for DOM attribute changes on the block element.
	useLayoutEffect( () => {
		if ( ! blockEl || ! blockType ) {
			return;
		}

		const observer = new window.MutationObserver( () => {
			setColors( getBlockElementColors( blockEl, blockType ) );
		} );

		observer.observe( blockEl, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ blockEl, blockType ] );

	const { backgroundColor, textColor, linkColor } = colors;

	const isPoor =
		hasPoorContrast( textColor, backgroundColor ) ||
		hasPoorContrast( linkColor, backgroundColor );

	if ( ! isPoor ) {
		return null;
	}

	const message = __(
		'This color combination may be hard for people to read.'
	);

	// Announce to screen readers whenever the warning becomes active.
	speak( message );

	return (
		<Tooltip text={ message }>
			{ /* tabIndex makes this focusable so keyboard users can trigger the tooltip. */ }
			<div
				tabIndex={ 0 }
				aria-label={ message }
				className="block-editor-color-contrast-warning"
			>
				<Icon icon={ caution } size={ 16 } />
			</div>
		</Tooltip>
	);
}
