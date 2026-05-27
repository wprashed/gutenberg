/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

describe( 'useThemeProviderStyles', () => {
	describe( 'when settings resolve to the WPDS defaults', () => {
		it( 'returns `undefined` styles when no overrides are passed', () => {
			const { result } = renderHook( () => useThemeProviderStyles() );
			expect( result.current.themeProviderStyles ).toBeUndefined();
		} );

		it.each( [
			// Uppercase hex
			[ 'uppercase hex', '#3858E9', '#FCFCFC' ],
			// Mixed case hex
			[ 'mixed case hex', '#3858E9', '#fCfCfC' ],
			// `rgb()` of the same color
			[ 'rgb()', 'rgb(56, 88, 233)', 'rgb(252, 252, 252)' ],
		] )(
			'treats %s representations of the defaults as defaults',
			( _, primary, bg ) => {
				const { result } = renderHook( () =>
					useThemeProviderStyles( {
						color: { primary, bg },
					} )
				);
				expect( result.current.themeProviderStyles ).toBeUndefined();
			}
		);

		it( 'still emits the cursor variable when only `cursor.control` is set', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					cursor: { control: 'pointer' },
				} )
			);
			expect( result.current.themeProviderStyles ).toEqual( {
				'--wpds-cursor-control': 'pointer',
			} );
		} );
	} );

	describe( 'when settings differ from the WPDS defaults', () => {
		it( 'emits `--wp-admin-theme-color*` overrides when `color.primary` differs', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: { primary: 'hotpink' },
				} )
			);
			expect( result.current.themeProviderStyles ).toBeDefined();
			expect(
				Object.keys( result.current.themeProviderStyles ?? {} )
			).toEqual(
				expect.arrayContaining( [
					'--wp-admin-theme-color',
					'--wp-admin-theme-color--rgb',
					'--wp-admin-theme-color-darker-10',
					'--wp-admin-theme-color-darker-20',
				] )
			);
		} );

		it( 'does not emit `--wp-admin-theme-color*` overrides when only `color.bg` differs', () => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: { bg: '#222222' },
				} )
			);
			expect( result.current.themeProviderStyles ).toBeDefined();
			expect(
				Object.keys( result.current.themeProviderStyles ?? {} )
			).toEqual(
				expect.not.arrayContaining( [ '--wp-admin-theme-color' ] )
			);
		} );
	} );

	describe( 'when seeds are unparseable', () => {
		it( 'does not silently treat an unparseable `color.primary` as default', () => {
			// `equals( 'not-a-color', '#3858e9' )` throws; the hook's
			// `try/catch` swallows that so `primaryIsDefault` stays `false`
			// and the emission path runs. The downstream `to(...)` call in
			// `legacyWpAdminThemeOverridesCSS` is what surfaces the parse
			// error (matching the pre-existing behavior from #77653).
			expect( () =>
				renderHook( () =>
					useThemeProviderStyles( {
						color: { primary: 'not-a-color' },
					} )
				)
			).toThrow();
		} );
	} );
} );
