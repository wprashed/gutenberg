/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const WARNING_TEXT = 'This color combination may be hard for people to read';

test.describe( 'Contrast Checker', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show warning inside color popover for insufficient contrast', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Black text on Black background' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		const lowContrastWarning = page.locator(
			'.block-editor-contrast-checker'
		);

		// Set text color to black.
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		// Close the text color popover before opening background.
		await textButton.click();

		// Open background color popover and set to black.
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Warning should appear inside the open background color popover.
		await expect( lowContrastWarning ).toBeVisible();
		await expect( lowContrastWarning ).toContainText( WARNING_TEXT );

		// Close the background color popover.
		await backgroundButton.click();
		// Warning should not be visible when the popover is closed.
		await expect( lowContrastWarning ).toBeHidden();

		// Reopen the text color popover — warning should also appear there.
		await textButton.click();
		await expect( lowContrastWarning ).toBeVisible();
		await expect( lowContrastWarning ).toContainText( WARNING_TEXT );
		await textButton.click();
	} );

	test( 'should not show warning for sufficient contrast', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const lowContrastWarning = page.locator(
			'.block-editor-contrast-checker'
		);

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Black text on White background' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Close the text color popover before opening background.
		await textButton.click();
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'White' } ).click();

		// Warning should not appear — contrast is sufficient.
		await expect( lowContrastWarning ).toBeHidden();

		// Close the background color popover.
		await backgroundButton.click();
		await expect( lowContrastWarning ).toBeHidden();
	} );

	test( 'should hide warning when contrast is fixed', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const lowContrastWarning = page.locator(
			'.block-editor-contrast-checker'
		);

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Text with poor contrast' },
		} );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );

		// Set poor contrast: black text on black background.
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Verify warning appears in the open background popover.
		await expect( lowContrastWarning ).toBeVisible();

		// Fix contrast: change background to white (while popover is still open).
		await page.getByRole( 'option', { name: 'White' } ).click();

		// Verify warning disappears once contrast is fixed.
		await expect( lowContrastWarning ).toBeHidden();

		await backgroundButton.click();
	} );

	test( 'should show warning for insufficient contrast on buttons', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const lowContrastWarning = page.locator(
			'.block-editor-contrast-checker'
		);

		// Insert a button block.
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Button text' );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		// Set background to black (poor contrast with black text).
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();

		// Verify warning appears in the open background popover.
		await expect( lowContrastWarning ).toBeVisible();
		await expect( lowContrastWarning ).toContainText( WARNING_TEXT );

		await backgroundButton.click();
	} );

	test( 'should not show warning for sufficient contrast on buttons', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const lowContrastWarning = page.locator(
			'.block-editor-contrast-checker'
		);

		// Insert a button block.
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Button text' );

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const typographyPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} );
		const backgroundPanel = editorSettings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} );

		const textButton = typographyPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await expect( textButton ).toBeVisible();
		await textButton.click();
		await page.getByRole( 'option', { name: 'Black' } ).click();
		await textButton.click();

		// Set background to white (good contrast with black text).
		const backgroundButton = backgroundPanel.getByRole( 'button', {
			name: 'Color',
			exact: true,
		} );
		await backgroundButton.click();
		await page.getByRole( 'option', { name: 'White' } ).click();

		// Verify no warning appears.
		await expect( lowContrastWarning ).toBeHidden();

		await backgroundButton.click();
	} );
} );
