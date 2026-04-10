/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useHasTypographyPanel } from '../typography-panel';

const settingsWithColors = ( overrides = {} ) => ( {
	color: {
		palette: {
			theme: [ { slug: 'red', color: '#ff0000', name: 'Red' } ],
		},
		...overrides,
	},
} );

describe( 'useHasTypographyPanel', () => {
	// After moving top-level text color into TypographyPanel, text color
	// alone should be enough to open the panel.
	it( 'should be true when only text color is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( settingsWithColors( { text: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when only font family is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( {
				typography: {
					fontFamilies: {
						theme: [ { slug: 'sans', fontFamily: 'sans-serif' } ],
					},
				},
			} )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when only line height is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { typography: { lineHeight: true } } )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be false when no typography or text color controls are enabled', () => {
		const { result } = renderHook( () => useHasTypographyPanel( {} ) );
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be false when text color is enabled but no colors or custom support exist', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { color: { text: true } } )
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be true when text color is enabled with custom colors support', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { color: { text: true, custom: true } } )
		);
		expect( result.current ).toBeTruthy();
	} );
} );
