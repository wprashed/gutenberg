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
		density,
	} );

	const contextValue = useMemo(
		() => ( {
			resolvedSettings,
		} ),
		[ resolvedSettings ]
	);

	// When this provider is the root, mirror its CSS custom properties onto
	// `document.documentElement` so the values are also available to portals,
	// the `html`/`body` background, and anything else that renders outside
	// the wrapper. Previously this was done via a `:root:has(...)` rule
	// inside a per-instance `<style>` element; using inline styles plus this
	// effect avoids that extra DOM node and the doubled-class specificity
	// hack it depended on.
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
		<div className={ styles.root } style={ themeProviderStyles }>
			<ThemeContext.Provider value={ contextValue }>
				{ children }
			</ThemeContext.Provider>
		</div>
	);
};
