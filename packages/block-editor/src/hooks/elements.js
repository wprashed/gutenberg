/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	useHasColorPanel,
	default as StylesColorPanel,
} from '../components/global-styles/color-panel';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';
import { COLOR_SUPPORT_KEY } from './color';

function ElementsInspectorControl( { children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
			const updatedStyle = resetAllFilter( attributes.style );
			return {
				...attributes,
				style: cleanEmptyObject( updatedStyle ),
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="elements"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function ElementsEdit( {
	clientId,
	name,
	setAttributes,
	settings,
	asWrapper,
	label,
	defaultControls,
} ) {
	const isEnabled = useHasColorPanel( settings );

	const style = useSelect(
		( select ) => {
			if ( ! isEnabled ) {
				return undefined;
			}
			const attributes =
				select( blockEditorStore ).getBlockAttributes( clientId );
			return attributes?.style;
		},
		[ clientId, isEnabled ]
	);

	const value = useMemo( () => style, [ style ] );

	const onChange = ( newStyle ) => {
		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	if ( ! isEnabled ) {
		return null;
	}

	defaultControls = defaultControls
		? defaultControls
		: getBlockSupport( name, [
				COLOR_SUPPORT_KEY,
				'__experimentalDefaultControls',
		  ] );

	const Wrapper = asWrapper || ElementsInspectorControl;

	return (
		<StylesColorPanel
			as={ Wrapper }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
			label={ label }
		/>
	);
}
