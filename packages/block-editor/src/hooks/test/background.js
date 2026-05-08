/**
 * Internal dependencies
 */
import {
	setBackgroundStyleDefaults,
	BACKGROUND_BLOCK_DEFAULT_VALUES,
	getEffectiveBackgroundStyle,
} from '../background';

describe( 'background', () => {
	describe( 'setBackgroundStyleDefaults', () => {
		const backgroundStyles = {
			backgroundImage: { id: 123, url: 'image.png' },
		};
		const backgroundStylesContain = {
			backgroundImage: { id: 123, url: 'image.png' },
			backgroundSize: 'contain',
		};
		const backgroundStylesNoURL = { backgroundImage: { id: 123 } };
		it.each( [
			[
				'return background size default',
				backgroundStyles,
				{
					backgroundSize:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
				},
			],
			[ 'return early if no styles are passed', undefined, undefined ],
			[
				'return early if images has no id',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return early if images has no URL',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return background position default',
				backgroundStylesContain,
				{
					backgroundPosition:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
				},
			],
			[
				'not apply background position value if one already exists in styles',
				{
					...backgroundStylesContain,
					backgroundPosition: 'center',
				},
				undefined,
			],
		] )( 'should %s', ( message, styles, expected ) => {
			const result = setBackgroundStyleDefaults( styles );
			expect( result ).toEqual( expected );
		} );
	} );
	describe( 'getEffectiveBackgroundStyle', () => {
		it( 'combines a local background image with an inherited background gradient', () => {
			const result = getEffectiveBackgroundStyle(
				{
					background: {
						backgroundImage: {
							id: 123,
							url: 'image.png',
						},
					},
				},
				{
					background: {
						gradient: 'linear-gradient(red, blue)',
					},
				}
			);

			expect( result ).toEqual( {
				background: {
					backgroundImage: {
						id: 123,
						url: 'image.png',
					},
					gradient: 'linear-gradient(red, blue)',
				},
			} );
		} );

		it( 'uses local background values over inherited background values', () => {
			const result = getEffectiveBackgroundStyle(
				{
					background: {
						backgroundImage: {
							id: 123,
							url: 'image.png',
						},
						gradient: 'linear-gradient(black, white)',
					},
				},
				{
					background: {
						backgroundImage: {
							id: 456,
							url: 'inherited-image.png',
						},
						gradient: 'linear-gradient(red, blue)',
					},
				}
			);

			expect( result.background ).toEqual( {
				backgroundImage: {
					id: 123,
					url: 'image.png',
				},
				gradient: 'linear-gradient(black, white)',
			} );
		} );
	} );
} );
