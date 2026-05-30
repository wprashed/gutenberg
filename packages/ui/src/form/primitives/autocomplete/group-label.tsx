import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteGroupLabelProps } from './types';

/**
 * A label for the group of items it is associated with.
 */
export const GroupLabel = forwardRef<
	HTMLDivElement,
	AutocompleteGroupLabelProps
>( function GroupLabel( { children, ...restProps }, ref ) {
	return (
		<_Autocomplete.GroupLabel ref={ ref } { ...restProps }>
			{ children }
		</_Autocomplete.GroupLabel>
	);
} );
