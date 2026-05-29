/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Maps a gallery's `dynamicSource` attribute to a query for the `attachment`
 * entity (i.e. `/wp/v2/media` collection params), used to resolve the source to
 * a list of media in the editor.
 *
 * The `type` key is the dispatch discriminator. `attachedToPost` is a
 * context-relative anchor resolved here to the REST `parent` param; future
 * source types pass their REST-named fields (`author`, `categories`,
 * `after`/`before`, `media_type`, etc.) straight through. The server-side
 * counterpart is `block_core_gallery_resolve_dynamic_source()` in `index.php`.
 *
 * @param {Object} dynamicSource  The gallery's `dynamicSource` attribute.
 * @param {Object} context        Resolution context.
 * @param {number} context.postId The current post ID.
 * @return {Object|null} A `getEntityRecords` query, or `null` when the source
 *                       cannot be resolved (unknown type or missing context).
 */
export function getSourceQuery( dynamicSource, { postId } ) {
	const { type, ...rest } = dynamicSource ?? {};

	switch ( type ) {
		case 'attachedToPost':
			if ( ! postId ) {
				return null;
			}
			return {
				parent: postId,
				per_page: -1,
				...rest,
			};
	}

	// Unknown or not-yet-implemented source type.
	return null;
}

/**
 * Returns a short, human-readable label describing a `dynamicSource`, for
 * display in the editor.
 *
 * @param {Object} dynamicSource The gallery's `dynamicSource` attribute.
 * @return {string} A translated label.
 */
export function getSourceLabel( dynamicSource ) {
	switch ( dynamicSource?.type ) {
		case 'attachedToPost':
			return __( 'Images attached to this post' );
	}

	return __( 'Dynamic images' );
}
