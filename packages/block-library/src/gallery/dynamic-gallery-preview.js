/**
 * WordPress dependencies
 */
import {
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';
import { Placeholder, Spinner } from '@wordpress/components';
import { View } from '@wordpress/primitives';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';

/**
 * Renders the resolved image blocks as a single, non-editable preview.
 *
 * `useBlockPreview` is given the gallery's own block props (so the `<figure>`
 * stays the real block wrapper and the image figures remain direct descendants
 * for the gallery's flex/crop styles).
 *
 * @param {Object}   props
 * @param {Object[]} props.imageBlocks Non-persisted `core/image` blocks to preview.
 * @param {Object}   props.blockProps  The gallery's `useBlockProps()` result.
 */
function GalleryImagesPreview( { imageBlocks, blockProps } ) {
	const previewProps = useBlockPreview( {
		blocks: imageBlocks,
		props: blockProps,
	} );
	return <figure { ...previewProps } />;
}

/**
 * Renders a dynamic gallery in the editor: a non-editable preview of the
 * resolved images, or a placeholder while resolving or when nothing is found.
 * The gallery's provided context is supplied so the previewed images inherit
 * gallery-wide settings.
 *
 * @param {Object}   props
 * @param {Object[]} props.imageBlocks    Non-persisted `core/image` blocks to preview.
 * @param {Object}   props.galleryContext Context the gallery provides to its images.
 * @param {Object}   props.blockProps     The gallery's `useBlockProps()` result.
 * @param {boolean}  props.isResolving    Whether the source is still resolving.
 */
export default function DynamicGalleryPreview( {
	imageBlocks,
	galleryContext,
	blockProps,
	isResolving,
} ) {
	if ( ! imageBlocks.length ) {
		return (
			<View { ...blockProps }>
				<Placeholder
					icon={ sharedIcon }
					label={ __( 'Gallery' ) }
					instructions={
						isResolving
							? __( 'Loading attached images…' )
							: __( 'No images are attached to this post yet.' )
					}
				>
					{ isResolving && <Spinner /> }
				</Placeholder>
			</View>
		);
	}

	return (
		<BlockContextProvider value={ galleryContext }>
			<GalleryImagesPreview
				imageBlocks={ imageBlocks }
				blockProps={ blockProps }
			/>
		</BlockContextProvider>
	);
}
