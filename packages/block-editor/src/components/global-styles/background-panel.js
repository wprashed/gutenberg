/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback, Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import BackgroundImageControl from '../background-image-control';
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import { useHasBackgroundColorPanel } from './color-panel';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundColor: true,
	gradient: true,
};

/**
 * Checks site settings to see if the requested feature's control may be used.
 *
 * @param {Object} settings Site settings.
 * @param {string} feature  Background feature to check.
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundControl( settings, feature ) {
	return Platform.OS === 'web' && settings?.background?.[ feature ];
}

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * The panel is also shown when the block has color panel background
 * support (`settings.color.background`), because background color and
 * the legacy `color.gradient` control are rendered here.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	const hasBackgroundColor = useHasBackgroundColorPanel( settings );
	const { backgroundImage, gradient } = settings?.background || {};
	return (
		Platform.OS === 'web' &&
		( backgroundImage || gradient || hasBackgroundColor )
	);
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		// Supports url() string values in theme.json.
		'string' === typeof style?.background?.backgroundImage ||
		!! style?.background?.backgroundImage?.url
	);
}

/**
 * Checks if there is a current value in the background gradient block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background gradient value set.
 */
export function hasBackgroundGradientValue( style ) {
	return (
		'string' === typeof style?.background?.gradient &&
		style?.background?.gradient !== ''
	);
}

/**
 * Checks if there is a current value for the background color (written to
 * `color.background`).
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background color value set.
 */
export function hasBackgroundColorValue( style ) {
	return !! style?.color?.background;
}

/**
 * Checks if there is a current value in the legacy `color.gradient` location
 * (used by blocks with color panel gradient support that haven't adopted the
 * `background.gradient` block support).
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a legacy color gradient value set.
 */
export function hasLegacyColorGradientValue( style ) {
	return !! style?.color?.gradient;
}

function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	headerLabel,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ headerLabel }
			resetAll={ resetAll }
			panelId={ panelId }
			hasInnerWrapper
			className="background-block-support-panel"
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			<div className="background-block-support-panel__inner-wrapper">
				{ children }
			</div>
		</ToolsPanel>
	);
}

export default function BackgroundImagePanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Background' ),
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;

	const hasBackgroundGradientControl = useHasBackgroundControl(
		settings,
		'gradient'
	);
	const hasColorPanelBackgroundSupport =
		useHasBackgroundColorPanel( settings );
	const showBackgroundColorControl =
		hasColorPanelBackgroundSupport && hasSolidColors;
	// New `background.gradient` block support — gradient lives under the
	// `background` style path.
	const showBackgroundGradientControl =
		hasGradientColors && hasBackgroundGradientControl;
	// Legacy `color.gradient` path — only rendered when the block has
	// color panel background support and hasn't adopted the newer
	// `background.gradient` support. Keeps the UI consistent for blocks
	// that still write gradients to `color.gradient`.
	const showLegacyColorGradientControl =
		hasColorPanelBackgroundSupport &&
		hasGradientColors &&
		! hasBackgroundGradientControl;
	const showBackgroundImageControl = useHasBackgroundControl(
		settings,
		'backgroundImage'
	);

	const resetAllFilter = useCallback(
		( previousValue ) => {
			const clearsColorBackground = showBackgroundColorControl;
			const clearsColorGradient =
				hasBackgroundGradientControl || showLegacyColorGradientControl;
			if ( ! clearsColorBackground && ! clearsColorGradient ) {
				return { ...previousValue, background: {} };
			}
			return {
				...previousValue,
				background: {},
				color: {
					...previousValue?.color,
					...( clearsColorBackground && { background: undefined } ),
					...( clearsColorGradient && { gradient: undefined } ),
				},
			};
		},
		[
			hasBackgroundGradientControl,
			showBackgroundColorControl,
			showLegacyColorGradientControl,
		]
	);

	if (
		! showBackgroundImageControl &&
		! showBackgroundColorControl &&
		! showBackgroundGradientControl &&
		! showLegacyColorGradientControl
	) {
		return null;
	}

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
	const encodeGradientValue = ( gradientValue ) => {
		const allGradients = gradients.flatMap(
			( { gradients: originGradients } ) => originGradients
		);
		const gradientObject = allGradients.find(
			( { gradient } ) => gradient === gradientValue
		);
		return gradientObject
			? 'var:preset|gradient|' + gradientObject.slug
			: gradientValue;
	};

	const resetBackground = () =>
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	const resetGradient = () => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			undefined
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
	};

	// Background color (written to `color.background`).
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const setBackgroundColor = ( newColor ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValue( newColor )
		);
		// Legacy `color.gradient` is mutually exclusive with
		// `color.background`. `background.gradient` is independent and
		// should not be touched.
		if ( showLegacyColorGradientControl ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};
	const resetBackgroundColor = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		if ( showLegacyColorGradientControl ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};

	// Legacy `color.gradient` setters.
	const legacyColorGradient = decodeValue( inheritedValue?.color?.gradient );
	const userLegacyColorGradient = decodeValue( value?.color?.gradient );
	const setLegacyColorGradient = ( newGradient ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue.color.background = undefined;
		onChange( newValue );
	};
	const resetLegacyColorGradient = () =>
		onChange( setImmutably( value, [ 'color', 'gradient' ], undefined ) );

	// Get current gradient value, decoding preset slug references.
	// Fall back to color.gradient for legacy blocks that haven't migrated
	// to background.gradient yet (mirrors block inspector fallback in
	// packages/block-editor/src/hooks/background.js).
	const currentGradient = decodeValue(
		value?.background?.gradient ?? value?.color?.gradient
	);
	const inheritedGradient = decodeValue(
		inheritedValue?.background?.gradient ?? inheritedValue?.color?.gradient
	);

	// Set gradient value, encoding preset matches as slug references.
	// Also clear color.gradient to migrate from the legacy location,
	// matching the block inspector behavior in hooks/background.js.
	const setGradient = ( newGradient ) => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
	};

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			{ showBackgroundImageControl && (
				<ToolsPanelItem
					className="block-editor-background-panel__item"
					hasValue={ () => hasBackgroundImageValue( value ) }
					label={ __( 'Image' ) }
					onDeselect={ resetBackground }
					isShownByDefault={ defaultControls.backgroundImage }
					panelId={ panelId }
				>
					<BackgroundImageControl
						value={ value }
						onChange={ onChange }
						settings={ settings }
						inheritedValue={ inheritedValue }
						defaultControls={ defaultControls }
						defaultValues={ defaultValues }
					/>
				</ToolsPanelItem>
			) }
			{ showBackgroundColorControl && (
				<ColorGradientDropdownItem
					className="block-editor-background-panel__item"
					label={ __( 'Color' ) }
					hasValue={ () => hasBackgroundColorValue( value ) }
					resetValue={ resetBackgroundColor }
					isShownByDefault={ defaultControls.backgroundColor }
					indicators={ [ backgroundColor ] }
					tabs={ [
						{
							key: 'background',
							label: __( 'Color' ),
							inheritedValue: backgroundColor,
							setValue: setBackgroundColor,
							userValue: userBackgroundColor,
						},
					] }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundGradientControl && (
				<ColorGradientDropdownItem
					className="block-editor-background-panel__item"
					label={ __( 'Gradient' ) }
					hasValue={ () => hasBackgroundGradientValue( value ) }
					resetValue={ resetGradient }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [ currentGradient ] }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue:
								currentGradient ?? inheritedGradient,
							setValue: setGradient,
							userValue: currentGradient,
							isGradient: true,
						},
					] }
					colorGradientControlSettings={ {
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showLegacyColorGradientControl && (
				<ColorGradientDropdownItem
					className="block-editor-background-panel__item"
					label={ __( 'Gradient' ) }
					hasValue={ () => hasLegacyColorGradientValue( value ) }
					resetValue={ resetLegacyColorGradient }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [ legacyColorGradient ] }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue: legacyColorGradient,
							setValue: setLegacyColorGradient,
							userValue: userLegacyColorGradient,
							isGradient: true,
						},
					] }
					colorGradientControlSettings={ {
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
		</Wrapper>
	);
}
