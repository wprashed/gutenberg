/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Inner blocks templates', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-templates'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( {
			postType: 'page',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-templates'
		);
	} );

	test( 'applying block templates asynchronously does not create a persistent change in the editor', async ( {
		editor,
		page,
	} ) => {
		// DEBUG INSTRUMENTATION: forward browser console output (including
		// [RTC DEBUG] warnings from saveEntityRecord and the Yjs undo manager)
		// to the test runner. Stack traces are captured via console.warn's
		// `stack: new Error().stack` field. Remove before merge.
		page.on( 'console', ( msg ) => {
			const text = msg.text();
			if (
				text.includes( 'RTC DEBUG' ) ||
				msg.type() === 'warning' ||
				msg.type() === 'error'
			) {
				// Try to resolve JSHandle args to get the stack field too.
				Promise.all(
					msg.args().map( ( a ) => a.jsonValue().catch( () => null ) )
				)
					.then( ( vals ) => {
						// eslint-disable-next-line no-console
						console.log(
							`[browser:${ msg.type() }]`,
							...vals.map( ( v ) =>
								typeof v === 'string' ? v : JSON.stringify( v )
							)
						);
					} )
					.catch( () => {
						// eslint-disable-next-line no-console
						console.log( `[browser:${ msg.type() }] ${ text }` );
					} );
			}
		} );
		page.on( 'pageerror', ( err ) => {
			// eslint-disable-next-line no-console
			console.log( `[browser:pageerror] ${ err.message }` );
		} );

		await editor.insertBlock( {
			name: 'test/test-inner-blocks-async-template',
		} );

		const blockWithTemplateContent = editor.canvas.locator(
			'role=document[name="Block: Test Inner Blocks Async Template"i] >> text=OneTwo'
		);

		// The block template content appears asynchronously, so wait for it.
		await expect( blockWithTemplateContent ).toBeVisible();

		// Publish the post, then reload.
		await editor.publishPost();
		await page.reload();

		// Wait for the block that was inserted to appear with its templated content.
		await expect( blockWithTemplateContent ).toBeVisible();

		// DEBUG INSTRUMENTATION: capture editor state and Y.Doc state right
		// before the dirty-state assertions. Remove before merge.
		const debugState = await page.evaluate( () => {
			const wp = window.wp;
			const data = wp?.data;
			if ( ! data ) {
				return { error: 'wp.data not available' };
			}
			const editorStore = data.select( 'core/editor' );
			const coreStore = data.select( 'core' );
			const post = editorStore?.getCurrentPost?.();
			const postId = post?.id;
			const postType = post?.type;
			const editedRecord = coreStore?.getEditedEntityRecord?.(
				'postType',
				postType,
				postId
			);
			const nonTransientEdits =
				coreStore?.getEntityRecordNonTransientEdits?.(
					'postType',
					postType,
					postId
				);
			const hasUndo = coreStore?.hasUndo?.();
			const isDirty = editorStore?.isEditedPostDirty?.();
			const blocks = data.select( 'core/block-editor' )?.getBlocks?.();
			return {
				postId,
				postType,
				hasUndo,
				isDirty,
				editedContent:
					editedRecord?.content?.raw ?? editedRecord?.content,
				nonTransientEditKeys: nonTransientEdits
					? Object.keys( nonTransientEdits )
					: null,
				nonTransientEdits,
				blockCount: blocks?.length,
				topBlockName: blocks?.[ 0 ]?.name,
				topBlockInnerCount: blocks?.[ 0 ]?.innerBlocks?.length,
				topBlockInnerSummary: blocks?.[ 0 ]?.innerBlocks?.map(
					( b ) => ( {
						name: b.name,
						content: b.attributes?.content?.toString?.(),
					} )
				),
			};
		} );
		// eslint-disable-next-line no-console
		console.log(
			'[RTC DEBUG test] pre-assertion state',
			JSON.stringify( debugState, null, 2 )
		);

		// The template resolution shouldn't cause the post to be dirty.
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);
		const undoButton = editorTopBar.locator( 'role=button[name="Undo"i]' );
		const updateButton = editorTopBar.locator(
			'role=button[name="Save"i]'
		);
		await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		await expect( updateButton ).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
