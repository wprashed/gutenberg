/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

export function useHasColorPanel( settings ) {
	const hasTextPanel = useHasTextPanel( settings );
	const hasBackgroundPanel = useHasBackgroundColorPanel( settings );
	const hasLinkPanel = useHasLinkPanel( settings );
	const hasHeadingPanel = useHasHeadingPanel( settings );
	const hasButtonPanel = useHasButtonPanel( settings );
	const hasCaptionPanel = useHasCaptionPanel( settings );

	return (
		hasTextPanel ||
		hasBackgroundPanel ||
		hasLinkPanel ||
		hasHeadingPanel ||
		hasButtonPanel ||
		hasCaptionPanel
	);
}

export function useHasTextPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.text &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasLinkPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.link &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasCaptionPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.caption &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasHeadingPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.heading &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function useHasButtonPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.button &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function useHasBackgroundColorPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.background &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function ColorToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	label,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ label || __( 'Elements' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			hasInnerWrapper
			headingLevel={ 3 }
			className="color-block-support-panel"
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			<div className="color-block-support-panel__inner-wrapper">
				{ children }
			</div>
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	text: true,
	background: true,
	link: true,
	heading: true,
	button: true,
	caption: true,
};

export default function ColorPanel( {
	as: Wrapper = ColorToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	label,
	children,
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;
	// When a block opts into background.gradient support, the gradient
	// picker moves to the Background panel. Hide it here to avoid
	// showing duplicate gradient controls.
	const hasBackgroundGradientSupport = !! settings?.background?.gradient;
	const showGradientColors =
		hasGradientColors && ! hasBackgroundGradientSupport;
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

	// BackgroundColor
	const showBackgroundPanel = useHasBackgroundColorPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const userGradient = decodeValue( value?.color?.gradient );
	const hasBackground = () =>
		!! userBackgroundColor ||
		( ! hasBackgroundGradientSupport && !! userGradient );
	const setBackgroundColor = ( newColor ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValue( newColor )
		);
		if ( ! hasBackgroundGradientSupport ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};
	const setGradient = ( newGradient ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue.color.background = undefined;
		onChange( newValue );
	};
	const resetBackground = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		if ( ! hasBackgroundGradientSupport ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};

	// Links
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeValue(
		inheritedValue?.elements?.link?.color?.text
	);
	const userLinkColor = decodeValue( value?.elements?.link?.color?.text );
	const setLinkColor = ( newColor ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValue( newColor )
			)
		);
	};
	const hoverLinkColor = decodeValue(
		inheritedValue?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const userHoverLinkColor = decodeValue(
		value?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const setHoverLinkColor = ( newColor ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', ':hover', 'color', 'text' ],
				encodeColorValue( newColor )
			)
		);
	};
	const hasLink = () => !! userLinkColor || !! userHoverLinkColor;
	const resetLink = () => {
		let newValue = setImmutably(
			value,
			[ 'elements', 'link', ':hover', 'color', 'text' ],
			undefined
		);
		newValue = setImmutably(
			newValue,
			[ 'elements', 'link', 'color', 'text' ],
			undefined
		);
		onChange( newValue );
	};

	// Text Color
	const showTextPanel = useHasTextPanel( settings );
	const textColor = decodeValue( inheritedValue?.color?.text );
	const userTextColor = decodeValue( value?.color?.text );
	const hasTextColor = () => !! userTextColor;
	const setTextColor = ( newColor ) => {
		let changedObject = setImmutably(
			value,
			[ 'color', 'text' ],
			encodeColorValue( newColor )
		);
		if ( textColor === linkColor ) {
			changedObject = setImmutably(
				changedObject,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValue( newColor )
			);
		}

		onChange( changedObject );
	};
	const resetTextColor = () => setTextColor( undefined );

	// Elements
	const elements = [
		{
			name: 'caption',
			label: __( 'Captions' ),
			showPanel: useHasCaptionPanel( settings ),
		},
		{
			name: 'button',
			label: __( 'Button' ),
			showPanel: useHasButtonPanel( settings ),
		},
		{
			name: 'heading',
			label: __( 'Heading' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h1',
			label: __( 'H1' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h2',
			label: __( 'H2' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h3',
			label: __( 'H3' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h4',
			label: __( 'H4' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h5',
			label: __( 'H5' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h6',
			label: __( 'H6' ),
			showPanel: useHasHeadingPanel( settings ),
		},
	];

	const resetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				color: undefined,
				elements: {
					...previousValue?.elements,
					link: {
						...previousValue?.elements?.link,
						color: undefined,
						':hover': {
							color: undefined,
						},
					},
					...elements.reduce( ( acc, element ) => {
						return {
							...acc,
							[ element.name ]: {
								...previousValue?.elements?.[ element.name ],
								color: undefined,
							},
						};
					}, {} ),
				},
			};
		},
		[ elements ]
	);

	const items = [
		showTextPanel && {
			key: 'text',
			label: __( 'Text' ),
			hasValue: hasTextColor,
			resetValue: resetTextColor,
			isShownByDefault: defaultControls.text,
			indicators: [ textColor ],
			tabs: [
				{
					key: 'text',
					label: __( 'Text' ),
					inheritedValue: textColor,
					setValue: setTextColor,
					userValue: userTextColor,
				},
			],
		},
		showBackgroundPanel && {
			key: 'background',
			label: __( 'Background' ),
			hasValue: hasBackground,
			resetValue: resetBackground,
			isShownByDefault: defaultControls.background,
			indicators: [
				( showGradientColors ? gradient : undefined ) ??
					backgroundColor,
			],
			tabs: [
				hasSolidColors && {
					key: 'background',
					label: __( 'Color' ),
					inheritedValue: backgroundColor,
					setValue: setBackgroundColor,
					userValue: userBackgroundColor,
				},
				showGradientColors && {
					key: 'gradient',
					label: __( 'Gradient' ),
					inheritedValue: gradient,
					setValue: setGradient,
					userValue: userGradient,
					isGradient: true,
				},
			].filter( Boolean ),
		},
		showLinkPanel && {
			key: 'link',
			label: __( 'Link' ),
			hasValue: hasLink,
			resetValue: resetLink,
			isShownByDefault: defaultControls.link,
			indicators: [ linkColor, hoverLinkColor ],
			tabs: [
				{
					key: 'link',
					label: __( 'Default' ),
					inheritedValue: linkColor,
					setValue: setLinkColor,
					userValue: userLinkColor,
				},
				{
					key: 'hover',
					label: __( 'Hover' ),
					inheritedValue: hoverLinkColor,
					setValue: setHoverLinkColor,
					userValue: userHoverLinkColor,
				},
			],
		},
	].filter( Boolean );

	elements.forEach( ( { name, label: elementLabel, showPanel } ) => {
		if ( ! showPanel ) {
			return;
		}

		const elementBackgroundColor = decodeValue(
			inheritedValue?.elements?.[ name ]?.color?.background
		);
		const elementGradient = decodeValue(
			inheritedValue?.elements?.[ name ]?.color?.gradient
		);
		const elementTextColor = decodeValue(
			inheritedValue?.elements?.[ name ]?.color?.text
		);
		const elementBackgroundUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.background
		);
		const elementGradientUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.gradient
		);
		const elementTextUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.text
		);
		const hasElement = () =>
			!! (
				elementTextUserColor ||
				elementBackgroundUserColor ||
				elementGradientUserColor
			);
		const resetElement = () => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				undefined
			);
			newValue.elements[ name ].color.gradient = undefined;
			newValue.elements[ name ].color.text = undefined;
			onChange( newValue );
		};

		const setElementTextColor = ( newTextColor ) => {
			onChange(
				setImmutably(
					value,
					[ 'elements', name, 'color', 'text' ],
					encodeColorValue( newTextColor )
				)
			);
		};
		const setElementBackgroundColor = ( newBackgroundColor ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				encodeColorValue( newBackgroundColor )
			);
			newValue.elements[ name ].color.gradient = undefined;
			onChange( newValue );
		};
		const setElementGradient = ( newGradient ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'gradient' ],
				encodeGradientValue( newGradient )
			);
			newValue.elements[ name ].color.background = undefined;
			onChange( newValue );
		};
		const supportsTextColor = true;
		// Background color is not supported for `caption`
		// as there isn't yet a way to set padding for the element.
		const supportsBackground = name !== 'caption';

		items.push( {
			key: name,
			label: elementLabel,
			hasValue: hasElement,
			resetValue: resetElement,
			isShownByDefault: defaultControls[ name ],
			indicators:
				supportsTextColor && supportsBackground
					? [
							elementTextColor,
							elementGradient ?? elementBackgroundColor,
					  ]
					: [
							supportsTextColor
								? elementTextColor
								: elementGradient ?? elementBackgroundColor,
					  ],
			tabs: [
				hasSolidColors &&
					supportsTextColor && {
						key: 'text',
						label: __( 'Text' ),
						inheritedValue: elementTextColor,
						setValue: setElementTextColor,
						userValue: elementTextUserColor,
					},
				hasSolidColors &&
					supportsBackground && {
						key: 'background',
						label: __( 'Background' ),
						inheritedValue: elementBackgroundColor,
						setValue: setElementBackgroundColor,
						userValue: elementBackgroundUserColor,
					},
				hasGradientColors &&
					supportsBackground && {
						key: 'gradient',
						label: __( 'Gradient' ),
						inheritedValue: elementGradient,
						setValue: setElementGradient,
						userValue: elementGradientUserColor,
						isGradient: true,
					},
			].filter( Boolean ),
		} );
	} );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			label={ label }
		>
			{ items.map( ( item ) => {
				const { key, ...restItem } = item;
				return (
					<ColorGradientDropdownItem
						key={ key }
						{ ...restItem }
						colorGradientControlSettings={ {
							colors,
							disableCustomColors: ! areCustomSolidsEnabled,
							gradients,
							disableCustomGradients: ! areCustomGradientsEnabled,
						} }
						panelId={ panelId }
					/>
				);
			} ) }
			{ children }
		</Wrapper>
	);
}
