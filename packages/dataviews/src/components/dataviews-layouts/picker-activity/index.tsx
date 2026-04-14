/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { VisuallyHidden, Spinner, Composite } from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../dataviews-context';
import { useIsMultiselectPicker } from '../../dataviews-picker-footer';
import type {
	NormalizedField,
	ViewPickerActivity as ViewPickerActivityType,
	ViewPickerActivityProps,
} from '../../../types';
import type { SetSelection } from '../../../types/private';

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

interface PickerActivityItemProps< Item > {
	view: ViewPickerActivityType;
	multiselect?: boolean;
	selection: string[];
	onChangeSelection: SetSelection;
	getItemId: ( item: Item ) => string;
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	otherFields: NormalizedField< Item >[];
}

function PickerActivityItem< Item >( {
	view,
	multiselect,
	selection,
	onChangeSelection,
	getItemId,
	item,
	titleField,
	mediaField,
	descriptionField,
	otherFields,
}: PickerActivityItemProps< Item > ) {
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	const density = view.layout?.density ?? 'balanced';

	const mediaContent =
		showMedia && density !== 'compact' && mediaField?.render ? (
			<mediaField.render
				item={ item }
				field={ mediaField }
				config={ {
					sizes: density === 'comfortable' ? '32px' : '24px',
				} }
			/>
		) : null;

	const renderedMediaField = (
		<div className="dataviews-view-picker-activity__item-type-icon">
			{ mediaContent || (
				<span
					className="dataviews-view-picker-activity__item-bullet"
					aria-hidden="true"
				/>
			) }
		</div>
	);

	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	const renderedDescriptionField =
		showDescription && descriptionField?.render ? (
			<descriptionField.render item={ item } field={ descriptionField } />
		) : null;

	const verticalGap = useMemo( () => {
		switch ( density ) {
			case 'comfortable':
				return 'md';
			default:
				return 'sm';
		}
	}, [ density ] );

	return (
		<Composite.Item
			role="option"
			aria-label={
				titleField
					? titleField.getValue( { item } ) || undefined
					: undefined
			}
			aria-selected={ isSelected }
			className={ clsx(
				'dataviews-view-picker-activity__item',
				density === 'compact' && 'is-compact',
				density === 'balanced' && 'is-balanced',
				density === 'comfortable' && 'is-comfortable',
				isSelected && 'is-selected'
			) }
			onClick={ () => {
				if ( isSelected ) {
					onChangeSelection(
						selection.filter( ( itemId ) => id !== itemId )
					);
				} else {
					const newSelection = multiselect
						? [ ...selection, id ]
						: [ id ];
					onChangeSelection( newSelection );
				}
			} }
			render={ <div /> }
		>
			<Stack direction="row" gap="lg" justify="start" align="flex-start">
				<Stack
					direction="column"
					gap="xs"
					align="center"
					className="dataviews-view-picker-activity__item-type"
				>
					{ renderedMediaField }
				</Stack>
				<Stack
					direction="column"
					gap={ verticalGap }
					align="flex-start"
					className="dataviews-view-picker-activity__item-content"
				>
					{ renderedTitleField && (
						<div className="dataviews-view-picker-activity__item-title">
							{ renderedTitleField }
						</div>
					) }
					{ renderedDescriptionField && (
						<div className="dataviews-view-picker-activity__item-description">
							{ renderedDescriptionField }
						</div>
					) }
					<div className="dataviews-view-picker-activity__item-fields">
						{ otherFields.map( ( field ) => (
							<div
								key={ field.id }
								className="dataviews-view-picker-activity__item-field"
							>
								<VisuallyHidden
									as="span"
									className="dataviews-view-picker-activity__item-field-label"
								>
									{ field.label }
								</VisuallyHidden>
								<span className="dataviews-view-picker-activity__item-field-value">
									<field.render
										item={ item }
										field={ field }
									/>
								</span>
							</div>
						) ) }
					</div>
				</Stack>
			</Stack>
		</Composite.Item>
	);
}

export default function ViewPickerActivity< Item >( {
	data,
	fields,
	getItemId,
	isLoading,
	onChangeSelection,
	selection,
	view,
	actions,
	className,
	empty,
}: ViewPickerActivityProps< Item > ) {
	const { itemListLabel } = useContext( DataViewsContext );
	const isMultiselect = useIsMultiselectPicker( actions );

	const titleField = fields.find(
		( field ) => field.id === view?.titleField
	);
	const mediaField = fields.find(
		( field ) => field.id === view?.mediaField
	);
	const descriptionField = fields.find(
		( field ) => field.id === view?.descriptionField
	);
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	const hasData = !! data?.length;

	if ( ! hasData ) {
		return (
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! isLoading,
				} ) }
			>
				{ isLoading ? (
					<p>
						<Spinner />
					</p>
				) : (
					empty
				) }
			</div>
		);
	}

	return (
		<Composite
			orientation="vertical"
			role="listbox"
			aria-multiselectable={ isMultiselect }
			aria-label={ itemListLabel }
			className={ clsx( 'dataviews-view-picker-activity', className ) }
		>
			{ data.map( ( item ) => (
				<PickerActivityItem
					key={ getItemId( item ) }
					view={ view }
					multiselect={ isMultiselect }
					selection={ selection }
					onChangeSelection={ onChangeSelection }
					getItemId={ getItemId }
					item={ item }
					titleField={ titleField }
					mediaField={ mediaField }
					descriptionField={ descriptionField }
					otherFields={ otherFields }
				/>
			) ) }
		</Composite>
	);
}
