import { useMemo, useLayoutEffect } from '@wordpress/element';
import { ThemeContext } from './context';
import { useThemeProviderStyles } from './use-theme-provider-styles';
import { type ThemeProviderProps } from './types';
import styles from './style.module.css';

export const ThemeProvider = ( {
	children,
	color = {},
	cursor,
	isRoot = false,
	density,
}: ThemeProviderProps ) => {
	const { themeProviderStyles, resolvedSettings } = useThemeProviderStyles( {
		color,
		cursor,
	} );

	const contextValue = useMemo(
		() => ( {
			resolvedSettings,
		} ),
		[ resolvedSettings ]
	);

	// Mirror the wrapper's custom properties onto `document.documentElement`
	// so they reach portals and anything else rendered outside the wrapper
	// (e.g. the `html`/`body` background).
	useLayoutEffect( () => {
		if ( ! isRoot || typeof document === 'undefined' ) {
			return;
		}
		const root = document.documentElement;
		const previous = new Map< string, string >();
		const applied: string[] = [];

		for ( const [ rawKey, rawValue ] of Object.entries(
			themeProviderStyles
		) ) {
			if (
				! rawKey.startsWith( '--' ) ||
				rawValue === null ||
				rawValue === undefined
			) {
				continue;
			}
			const value = String( rawValue );
			previous.set( rawKey, root.style.getPropertyValue( rawKey ) );
			root.style.setProperty( rawKey, value );
			applied.push( rawKey );
		}

		return () => {
			for ( const key of applied ) {
				const prev = previous.get( key );
				if ( prev ) {
					root.style.setProperty( key, prev );
				} else {
					root.style.removeProperty( key );
				}
			}
		};
	}, [ isRoot, themeProviderStyles ] );

	return (
		<div
			data-wpds-density={ density }
			className={ styles.root }
			style={ themeProviderStyles }
		>
			<ThemeContext.Provider value={ contextValue }>
				{ children }
			</ThemeContext.Provider>
		</div>
	);
};
