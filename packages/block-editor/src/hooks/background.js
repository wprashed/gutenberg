/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';
import { ColorPopoverContrastChecker } from './contrast-checker';
import {
	default as StylesBackgroundPanel,
	useHasBackgroundPanel,
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
} from '../components/global-styles/background-panel';
export const BACKGROUND_SUPPORT_KEY = 'background';

// Initial control values.
export const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

/**
 * Determine whether there is block support for background.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Background image feature to check for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBackgroundSupport( blockName, feature = 'any' ) {
	const support = getBlockSupport( blockName, BACKGROUND_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return (
			!! support?.backgroundImage ||
			!! support?.backgroundSize ||
			!! support?.backgroundRepeat ||
			!! support?.gradient
		);
	}

	return !! support?.[ feature ];
}

export function setBackgroundStyleDefaults( backgroundStyle ) {
	if ( ! backgroundStyle || ! backgroundStyle?.backgroundImage?.url ) {
		return;
	}

	let backgroundStylesWithDefaults;

	// Set block background defaults.
	if ( ! backgroundStyle?.backgroundSize ) {
		backgroundStylesWithDefaults = {
			backgroundSize: BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
		};
	}

	if (
		'contain' === backgroundStyle?.backgroundSize &&
		! backgroundStyle?.backgroundPosition
	) {
		backgroundStylesWithDefaults = {
			backgroundPosition:
				BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
		};
	}
	return backgroundStylesWithDefaults;
}

function useBlockProps( { name, style } ) {
	if (
		! hasBackgroundSupport( name ) ||
		! style?.background?.backgroundImage
	) {
		return;
	}

	const backgroundStyles = setBackgroundStyleDefaults( style?.background );

	if ( ! backgroundStyles ) {
		return;
	}

	return {
		style: {
			...backgroundStyles,
		},
	};
}

/**
 * Generates a CSS class name if an background image is set.
 *
 * @param {Object} style A block's style attribute.
 *
 * @return {string} CSS class name.
 */
export function getBackgroundImageClasses( style ) {
	return hasBackgroundImageValue( style ) ||
		hasBackgroundGradientValue( style )
		? 'has-background'
		: '';
}

function BackgroundInspectorControl( {
	children,
	backgroundGradientSupported = false,
} ) {
	const resetAllFilter = useCallback(
		( attributes ) => {
			const updatedClassName = attributes.className?.includes(
				'has-background'
			)
				? attributes.className
						.split( ' ' )
						.filter( ( c ) => c !== 'has-background' )
						.join( ' ' ) || undefined
				: attributes.className;
			return {
				...attributes,
				className: updatedClassName,
				backgroundColor: undefined,
				gradient: undefined,
				style: cleanEmptyObject( {
					...attributes.style,
					background: undefined,
					color: {
						...attributes.style?.color,
						background: undefined,
						gradient: backgroundGradientSupported
							? undefined
							: attributes.style?.color?.gradient,
					},
				} ),
			};
		},
		[ backgroundGradientSupported ]
	);
	return (
		<InspectorControls group="background" resetAllFilter={ resetAllFilter }>
			{ children }
		</InspectorControls>
	);
}

export function BackgroundImagePanel( {
	clientId,
	name,
	setAttributes,
	settings,
} ) {
	const { style, className, backgroundColor, gradient } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const blockAttributes = getBlockAttributes( clientId );
			return {
				style: blockAttributes?.style,
				className: blockAttributes?.className,
				backgroundColor: blockAttributes?.backgroundColor,
				gradient: blockAttributes?.gradient,
			};
		},
		[ clientId ]
	);

	const backgroundGradientSupported = hasBackgroundSupport(
		name,
		'gradient'
	);

	// Must be declared before the early return to follow Rules of Hooks.
	// Passes backgroundGradientSupported so that "Reset All" also clears
	// the legacy color.gradient value when background.gradient is supported.
	const as = useCallback(
		( { children } ) => (
			<BackgroundInspectorControl
				backgroundGradientSupported={ backgroundGradientSupported }
			>
				{ children }
			</BackgroundInspectorControl>
		),
		[ backgroundGradientSupported ]
	);

	const colorSupport = getBlockSupport( name, 'color' );
	const hasColorBackgroundSupport =
		colorSupport && colorSupport.background !== false;
	const hasColorGradientSupport = !! colorSupport?.gradients;

	if (
		! useHasBackgroundPanel( settings ) ||
		( ! hasBackgroundSupport( name ) &&
			! hasColorBackgroundSupport &&
			! hasColorGradientSupport )
	) {
		return null;
	}

	const onChange = ( newStyle ) => {
		// Extract background color slug from style.color.background.
		const newBackgroundColorValue = newStyle?.color?.background;
		const newBackgroundColorSlug = newBackgroundColorValue?.startsWith(
			'var:preset|color|'
		)
			? newBackgroundColorValue.substring( 'var:preset|color|'.length )
			: undefined;

		// Extract gradient slug — prefer the new background.gradient path
		// when backgroundGradientSupported, fall back to color.gradient.
		const newGradientValue = backgroundGradientSupported
			? newStyle?.background?.gradient
			: newStyle?.color?.gradient;
		const newGradientSlug = newGradientValue?.startsWith(
			'var:preset|gradient|'
		)
			? newGradientValue.substring( 'var:preset|gradient|'.length )
			: undefined;
		const cleanedColorGradient = newGradientSlug
			? undefined
			: newStyle?.color?.gradient;

		// Strip slug-resolved values out of the style object so they don't
		// get persisted as inline values alongside the attribute slugs.
		const cleanedStyle = {
			...newStyle,
			color: {
				...newStyle?.color,
				background: newBackgroundColorSlug
					? undefined
					: newBackgroundColorValue,
				// When background.gradient is supported, always clear the
				// legacy color.gradient path on write.
				gradient: backgroundGradientSupported
					? undefined
					: cleanedColorGradient,
			},
		};
		if ( backgroundGradientSupported ) {
			cleanedStyle.background = {
				...cleanedStyle.background,
				gradient: newGradientSlug
					? undefined
					: newStyle?.background?.gradient,
			};
		}

		const isMigrating =
			backgroundGradientSupported && !! style?.color?.gradient;
		const newAttributes = {
			style: cleanEmptyObject( cleanedStyle ),
			backgroundColor: newBackgroundColorSlug,
			gradient: newGradientSlug,
		};

		// When migrating from color.gradient to background.gradient, preserve
		// the has-background class so existing styles relying on it (e.g.
		// theme padding) are not silently broken. Only add the class when a
		// gradient value is being set — not when it is being cleared/reset.
		// Conversely, if the gradient is cleared and has-background was added
		// during a previous migration, remove it so it does not linger.
		const hasNewGradient =
			!! newGradientSlug ||
			!! ( backgroundGradientSupported
				? newStyle?.background?.gradient
				: newStyle?.color?.gradient );
		if ( isMigrating && hasNewGradient ) {
			newAttributes.className = clsx( className, 'has-background' );
		} else if (
			! hasNewGradient &&
			className?.includes( 'has-background' )
		) {
			newAttributes.className =
				className
					.split( ' ' )
					.filter( ( c ) => c !== 'has-background' )
					.join( ' ' ) || undefined;
		}

		setAttributes( newAttributes );
	};

	// Fold the backgroundColor / gradient attribute slugs back into the style
	// object the panel consumes, so preset selections round-trip correctly.
	// When background.gradient is supported but not yet explicitly set, fall
	// back to color.gradient for display. Any write from this panel migrates
	// the value to background.gradient and clears color.gradient atomically.
	const styleValue = {
		...style,
		color: {
			...style?.color,
			background: backgroundColor
				? 'var:preset|color|' + backgroundColor
				: style?.color?.background,
			gradient:
				! backgroundGradientSupported && gradient
					? 'var:preset|gradient|' + gradient
					: style?.color?.gradient,
		},
		...( backgroundGradientSupported && {
			background: {
				...style?.background,
				gradient: gradient
					? 'var:preset|gradient|' + gradient
					: style?.background?.gradient ?? style?.color?.gradient,
			},
		} ),
	};

	const updatedSettings = {
		...settings,
		background: {
			...settings.background,
			backgroundSize:
				settings?.background?.backgroundSize &&
				hasBackgroundSupport( name, 'backgroundSize' ),
		},
	};

	const backgroundDefaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
	const colorDefaultControls = getBlockSupport( name, [
		'color',
		'__experimentalDefaultControls',
	] );
	const defaultControls = {
		...backgroundDefaultControls,
		backgroundColor: colorDefaultControls?.background,
		// Mirror the old combined background/gradient affordance: if background
		// color was shown by default under the legacy color panel, also show
		// the gradient item by default in the new background panel.
		gradient:
			backgroundDefaultControls?.gradient ??
			colorDefaultControls?.background,
	};

	return (
		<StylesBackgroundPanel
			as={ as }
			panelId={ clientId }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			defaultControls={ defaultControls }
			value={ styleValue }
			colorContrastChecker={
				<ColorPopoverContrastChecker
					clientId={ clientId }
					name={ name }
				/>
			}
		/>
	);
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
