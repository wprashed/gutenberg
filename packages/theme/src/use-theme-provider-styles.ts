import type { CSSProperties } from 'react';
import {
	ColorSpace,
	clone,
	set,
	to,
	sRGB,
	HSL,
	type PlainColorObject,
} from 'colorjs.io/fn';
import memoize from 'memize';
import { useMemo, useContext } from '@wordpress/element';
import { ThemeContext } from './context';
import colorTokens from './prebuilt/ts/color-tokens';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from './color-ramps';
import { getColorString } from './color-ramps/lib/color-utils';
import type { ThemeProviderProps } from './types';

type Entry = [ string, string ];

const getCachedBgRamp = memoize( buildBgRamp, { maxSize: 10 } );
const getCachedAccentRamp = memoize( buildAccentRamp, { maxSize: 10 } );

function customRgbFormat( color: PlainColorObject ): string {
	const rgb = to( color, sRGB );
	return rgb.coords
		.map( ( n ) => Math.round( ( n ?? 0 ) * 255 ) )
		.join( ', ' );
}

function legacyWpAdminThemeOverridesCSS( accent: string ): Entry[] {
	ColorSpace.register( sRGB );
	const parsedAccent = to( accent, HSL );
	const parsedL = parsedAccent.coords[ 2 ] ?? 0;

	// Create darker version of accent —
	const darker10 = set(
		clone( parsedAccent ),
		[ HSL, 'l' ],
		Math.max( 0, parsedL - 5 ) // L reduced by 5%
	);
	const darker20 = set(
		clone( parsedAccent ),
		[ HSL, 'l' ],
		Math.max( 0, parsedL - 10 ) // L reduced by 10%
	);

	return [
		[ '--wp-admin-theme-color', getColorString( parsedAccent ) ],
		[ '--wp-admin-theme-color--rgb', customRgbFormat( parsedAccent ) ],
		[ '--wp-admin-theme-color-darker-10', getColorString( darker10 ) ],
		[
			'--wp-admin-theme-color-darker-10--rgb',
			customRgbFormat( darker10 ),
		],
		[ '--wp-admin-theme-color-darker-20', getColorString( darker20 ) ],
		[
			'--wp-admin-theme-color-darker-20--rgb',
			customRgbFormat( darker20 ),
		],
	];
}

function colorTokensCSS(
	computedColorRamps: Map< string, RampResult >
): Entry[] {
	const entries: Entry[] = [];

	for ( const [ rampName, { ramp } ] of computedColorRamps ) {
		for ( const [ tokenName, tokenValue ] of Object.entries( ramp ) ) {
			const key = `${ rampName }-${ tokenName }`;
			const aliasedBy = colorTokens[ key ] ?? [];
			for ( const aliasedId of aliasedBy ) {
				entries.push( [ `--wpds-color-${ aliasedId }`, tokenValue ] );
			}
		}
	}

	return entries;
}

function generateStyles( {
	primary,
	primaryIsDefault,
	computedColorRamps,
}: {
	primary: string;
	primaryIsDefault: boolean;
	computedColorRamps: Map< string, RampResult >;
} ): CSSProperties {
	return Object.fromEntries(
		[
			// Semantic color tokens.
			colorTokensCSS( computedColorRamps ),
			// Legacy `--wp-admin-theme-color*` overrides — only emitted when
			// the resolved primary differs from the prebuilt default. WP Core
			// already provides default values for these custom properties, and
			// the static `--wp-components-*` aliases that depend on them are
			// emitted at `:root` by the prebuilt design tokens CSS.
			primaryIsDefault ? [] : legacyWpAdminThemeOverridesCSS( primary ),
		].flat()
	);
}

export function useThemeProviderStyles( {
	color = {},
	cursor,
}: {
	color?: ThemeProviderProps[ 'color' ];
	cursor?: ThemeProviderProps[ 'cursor' ];
} = {} ) {
	const { resolvedSettings: inheritedSettings } = useContext( ThemeContext );

	// Compute settings:
	// - used provided prop value;
	// - otherwise, use inherited value from parent instance;
	// - otherwise, use fallback value (where applicable).
	const primary =
		color.primary ??
		inheritedSettings.color?.primary ??
		DEFAULT_SEED_COLORS.primary;
	const bg =
		color.bg ?? inheritedSettings.color?.bg ?? DEFAULT_SEED_COLORS.bg;
	const cursorControl = cursor?.control ?? inheritedSettings.cursor?.control;

	const resolvedSettings = useMemo(
		() => ( {
			color: {
				primary,
				bg,
			},
			cursor: cursorControl ? { control: cursorControl } : undefined,
		} ),
		[ primary, bg, cursorControl ]
	);

	// When the resolved settings match the built-in defaults (i.e. no override
	// is contributed by this provider or any ancestor provider, and no cursor
	// is set), the prebuilt CSS at `:root` already provides all the necessary
	// values. In that case we skip computing and emitting any inline CSS so
	// that the `<style>` element in `ThemeProvider` short-circuits.
	const primaryIsDefault = primary === DEFAULT_SEED_COLORS.primary;
	const bgIsDefault = bg === DEFAULT_SEED_COLORS.bg;
	const resolvesToDefaults =
		primaryIsDefault && bgIsDefault && cursorControl === undefined;

	const colorStyles = useMemo( () => {
		if ( primaryIsDefault && bgIsDefault ) {
			return undefined;
		}

		// Determine which seeds are needed for generating ramps.
		const seeds = {
			...DEFAULT_SEED_COLORS,
			bg,
			primary,
		};

		// Generate ramps.
		const computedColorRamps = new Map< string, RampResult >();
		const bgRamp = getCachedBgRamp( seeds.bg );
		Object.entries( seeds ).forEach( ( [ rampName, seed ] ) => {
			if ( rampName === 'bg' ) {
				computedColorRamps.set( rampName, bgRamp );
			} else {
				computedColorRamps.set(
					rampName,
					getCachedAccentRamp( seed, bgRamp )
				);
			}
		} );

		return generateStyles( {
			primary: seeds.primary,
			primaryIsDefault,
			computedColorRamps,
		} );
	}, [ primary, bg, primaryIsDefault, bgIsDefault ] );

	const themeProviderStyles: CSSProperties | undefined = useMemo( () => {
		if ( resolvesToDefaults ) {
			return undefined;
		}
		return {
			...colorStyles,
			...( cursorControl && {
				'--wpds-cursor-control': cursorControl,
			} ),
		};
	}, [ colorStyles, cursorControl, resolvesToDefaults ] );

	return {
		resolvedSettings,
		themeProviderStyles,
	};
}
