/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getSourceQuery } from './dynamic-source';
import buildImageBlockAttributes from './build-image-block-attributes';

const EMPTY_ARRAY = [];

/**
 * Resolves a gallery's `dynamicSource` to the media it should display and the
 * (non-persisted) `core/image` blocks used to preview it in the editor.
 *
 * @param {Object} attributes     The gallery block's attributes.
 * @param {Object} context        Resolution context.
 * @param {number} context.postId The current post ID.
 * @return {Object} `{ media, imageBlocks, isResolving }`.
 */
export default function useDynamicImages( attributes, { postId } ) {
	const { dynamicSource } = attributes;

	const query = useMemo(
		() =>
			dynamicSource ? getSourceQuery( dynamicSource, { postId } ) : null,
		[ dynamicSource, postId ]
	);

	const { media, isResolving } = useSelect(
		( select ) => {
			if ( ! query ) {
				return { media: EMPTY_ARRAY, isResolving: false };
			}
			const selectorArgs = [ 'postType', 'attachment', query ];
			return {
				media:
					select( coreStore ).getEntityRecords( ...selectorArgs ) ??
					EMPTY_ARRAY,
				isResolving: ! select( coreStore ).hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ query ]
	);

	const imageBlocks = useMemo(
		() =>
			media.map( ( mediaItem ) =>
				createBlock(
					'core/image',
					buildImageBlockAttributes( mediaItem, attributes )
				)
			),
		// Rebuilt when the resolved media or any gallery setting changes.
		[ media, attributes ]
	);

	return { media, imageBlocks, isResolving };
}
