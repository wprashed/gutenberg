/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import InspectorControls from '../inspector-controls';
import { useBorderPanelLabel } from '../../hooks/border';
import { useBlockSettings } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { ElementsEdit } from '../../hooks/elements';
import { ColorToolsPanel } from '../global-styles/color-panel';

function SectionBlockColorControls( {
	blockName,
	clientId,
	contentClientIds,
} ) {
	const settings = useBlockSettings( blockName );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { hasButtons, hasHeading } = useSelect(
		( select ) => {
			const blockNames =
				select( blockEditorStore ).getBlockNamesByClientId(
					contentClientIds
				);
			return {
				hasButtons: blockNames.includes( 'core/buttons' ),
				hasHeading: blockNames.includes( 'core/heading' ),
			};
		},
		[ contentClientIds ]
	);

	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	return (
		<ElementsEdit
			clientId={ clientId }
			name={ blockName }
			settings={ settings }
			setAttributes={ setAttributes }
			asWrapper={ ColorToolsPanel }
			label={ __( 'Elements' ) }
			defaultControls={ {
				button: hasButtons,
				heading: hasHeading,
			} }
		/>
	);
}

const StylesTab = ( {
	blockName,
	clientId,
	hasBlockStyles,
	isSectionBlock,
	contentClientIds,
} ) => {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );

	return (
		<>
			{ hasBlockStyles && <BlockStyles clientId={ clientId } /> }
			{ isSectionBlock && (
				<>
					<SectionBlockColorControls
						blockName={ blockName }
						clientId={ clientId }
						contentClientIds={ contentClientIds }
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background' ) }
						className="background-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
				</>
			) }
			{ ! isSectionBlock && (
				<>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background' ) }
						className="background-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot group="filter" />
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="dimensions"
						label={ __( 'Dimensions' ) }
					/>
					<InspectorControls.Slot
						group="border"
						label={ borderPanelLabel }
					/>
					<InspectorControls.Slot group="styles" />
					<InspectorControls.Slot
						group="elements"
						label={ __( 'Elements' ) }
						className="elements-block-support-panel__inner-wrapper"
					/>
				</>
			) }
		</>
	);
};

export default StylesTab;
