/**
 * Internal dependencies
 */
import { pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import { getUpdatedLinkTargetSettings } from '../image/utils';

/**
 * Builds the attributes for a `core/image` block from a media (attachment)
 * record, applying the gallery-wide settings that affect how the image renders.
 *
 * Used to construct the (non-persisted) image blocks previewed when a gallery
 * runs in dynamic mode, and the real image blocks created when a dynamic gallery
 * is converted ("pinned") back to individual images. The frontend equivalent is
 * `block_core_gallery_render_dynamic_image()` in `index.php`.
 *
 * @param {Object} media             A media object as returned by the REST API.
 * @param {Object} galleryAttributes The gallery block's attributes.
 * @return {Object} Attributes to pass to `createBlock( 'core/image', ... )`.
 */
export default function buildImageBlockAttributes( media, galleryAttributes ) {
	const { sizeSlug, linkTo, linkTarget, aspectRatio } = galleryAttributes;

	return {
		id: media.id,
		...pickRelevantMediaFiles( media, sizeSlug ),
		...getHrefAndDestination( media, linkTo ),
		...getUpdatedLinkTargetSettings( linkTarget, galleryAttributes ),
		sizeSlug,
		caption: media.caption?.raw || '',
		alt: media.alt_text || '',
		aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
	};
}
