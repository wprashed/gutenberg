import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteGroupProps } from './types';

/**
 * Groups related items together with an associated label rendered by
 * `Autocomplete.GroupLabel`. When `items` is provided, child
 * `Autocomplete.Collection` components iterate over them.
 */
export const Group = forwardRef< HTMLDivElement, AutocompleteGroupProps >(
	function Group( { children, ...restProps }, ref ) {
		return (
			<_Autocomplete.Group ref={ ref } { ...restProps }>
				{ children }
			</_Autocomplete.Group>
		);
	}
);
