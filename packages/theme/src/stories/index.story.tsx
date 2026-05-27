import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	useEffect,
	useState,
	useRef,
	useId,
	createPortal,
} from '@wordpress/element';
import { ThemeProvider } from '../theme-provider';

const meta: Meta< typeof ThemeProvider > = {
	title: 'Design System/Theme/Theme Provider',
	component: ThemeProvider,
	args: {
		isRoot: true,
	},
	argTypes: {
		children: {
			control: false,
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	tags: [ 'status-private' ],
};
export default meta;

function getCSSCustomPropsFromStylesheets() {
	const semanticProps: Record< string, string > = {};
	const legacyProps: Record< string, string > = {};

	for ( const sheet of document.styleSheets ) {
		try {
			for ( const rule of sheet.cssRules || [] ) {
				const ruleStyle = ( rule as CSSStyleRule ).style;
				if ( ruleStyle ) {
					for ( const name of ruleStyle ) {
						if (
							name.startsWith( '--wp-admin-theme' ) ||
							name.startsWith( '--wp-components-color' )
						) {
							legacyProps[ name ] = ruleStyle
								.getPropertyValue( name )
								.trim();
						}
						if ( name.startsWith( '--wpds-color' ) ) {
							semanticProps[ name ] = ruleStyle
								.getPropertyValue( name )
								.trim();
						}
					}
				}
			}
		} catch ( e ) {
			// Avoid security errors from cross-origin stylesheets
			// eslint-disable-next-line no-console
			console.error( e );
			continue;
		}
	}

	return { semanticProps, legacyProps };
}

const ColorTokenTable = ( {
	tokens,
}: {
	tokens: Record< string, string >;
} ) => {
	return (
		<ul
			style={ {
				listStyle: 'none',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
			} }
		>
			{ Object.entries( tokens ).map( ( [ name ] ) => (
				<li
					key={ name }
					style={ {
						display: 'grid',
						gridTemplateColumns: '80px	1fr',
						alignItems: 'center',
						gap: '0.5rem',
					} }
				>
					<span
						style={ {
							backgroundColor: `var(${ name })`,
							border: '1px solid var(--wpds-color-stroke-surface-neutral)',
							width: '100%',
							aspectRatio: '2/1',
							display: 'block',
						} }
						aria-label={ name }
					></span>
					<code>{ name }</code>
				</li>
			) ) }
		</ul>
	);
};

const DSTokensList = () => {
	const [ props, setProps ] = useState< {
		semanticProps: Record< string, string >;
		legacyProps: Record< string, string >;
	} >( {
		semanticProps: {},
		legacyProps: {},
	} );

	useEffect( () => {
		setProps( getCSSCustomPropsFromStylesheets() );
	}, [] );

	return (
		<div style={ { color: 'var( --wpds-color-fg-content-neutral )' } }>
			<h1>Design System Color tokens</h1>
			<h2>Semantic tokens (can be consumed directly)</h2>
			<ColorTokenTable tokens={ props.semanticProps } />
			<h2>Legacy tokens (should not be consumed directly)</h2>
			<details>
				<summary>Click to expand</summary>
				<ColorTokenTable tokens={ props.legacyProps } />
			</details>
		</div>
	);
};

export const Default: StoryObj< typeof ThemeProvider > = {
	args: {
		children: <DSTokensList />,
	},
};

export const WithPicker: StoryObj< typeof ThemeProvider > = {
	render: ( args ) => {
		const id = useId();
		const [ primary, setPrimary ] = useState< undefined | string >();

		return (
			<ThemeProvider
				{ ...args }
				color={ {
					primary,
				} }
			>
				<div style={ { position: 'relative' } }>
					<div
						style={ {
							position: 'sticky',
							top: 0,
							right: 0,
							backgroundColor:
								'var(--wpds-color-bg-surface-neutral)',
							color: 'var( --wpds-color-fg-content-neutral )',
							padding: '0.5rem',
							borderRadius: '0.5rem',
							boxShadow: '0 0 0.5rem 0 rgba(0, 0, 0, 0.1)',
						} }
					>
						<div>
							<input
								type="color"
								id={ id }
								name="primary"
								value={ primary }
								onChange={ ( e ) =>
									setPrimary( e.target.value )
								}
							/>
							<label htmlFor={ id }>Pick the primary color</label>
						</div>
					</div>
					{ args.children }
				</div>
			</ThemeProvider>
		);
	},
	args: {
		children: <DSTokensList />,
	},
};

const NestingDebug = ( { bg = '', primary = '' } ) => (
	<div
		style={ {
			padding: 'var(--wpds-dimension-padding-lg)',
			color: 'var(--wpds-color-fg-content-neutral)',
			backgroundColor: 'var(--wpds-color-bg-surface-neutral)',
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: '1rem',
		} }
	>
		<pre style={ { margin: 0 } }>
			bg: { bg } | primary: { primary }
		</pre>
		<span
			style={ {
				display: 'inline-block',
				padding: 'var(--wpds-dimension-padding-sm)',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-bg-interactive-brand-strong)',
				color: 'var(--wpds-color-fg-interactive-brand-strong)',
			} }
		>
			primary
		</span>
		<span
			style={ {
				display: 'inline-block',
				marginInlineStart: '0.25rem',
				padding: 'var(--wpds-dimension-padding-sm)',
				borderRadius: '0.25rem',
				backgroundColor:
					'var(--wpds-color-bg-interactive-neutral-weak-disabled)',
				color: 'var(--wpds-color-fg-content-neutral)',
			} }
		>
			Neutral
		</span>
	</div>
);

export const NestingAndInheriting: StoryObj< typeof ThemeProvider > = {
	render: () => {
		return (
			<ThemeProvider>
				<NestingDebug bg="inherit (root)" primary="inherit (root)" />
				<div style={ { paddingInlineStart: '1rem' } }>
					<ThemeProvider
						color={ {
							bg: '#1e1e1e',
						} }
					>
						<NestingDebug bg="#1e1e1e" primary="inherit (root)" />
						<div style={ { paddingInlineStart: '1rem' } }>
							<ThemeProvider>
								<NestingDebug
									bg="inherit (#1e1e1e)"
									primary="inherit (root)"
								/>
								<div style={ { paddingInlineStart: '1rem' } }>
									<ThemeProvider
										color={ { primary: 'hotpink' } }
									>
										<NestingDebug
											bg="inherit (#1e1e1e)"
											primary="hotpink"
										/>
										<div
											style={ {
												paddingInlineStart: '1rem',
											} }
										>
											<ThemeProvider
												color={ { bg: '#f8f8f8' } }
											>
												<NestingDebug
													bg="#f8f8f8"
													primary="inherit (hotpink)"
												/>
											</ThemeProvider>
										</div>
									</ThemeProvider>
								</div>
							</ThemeProvider>
						</div>
					</ThemeProvider>
				</div>
			</ThemeProvider>
		);
	},
};

function IframeWithClonedTokenStyles( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const [ iframeLoaded, setIframeLoaded ] = useState( false );

	// Copy the stylesheets that define DS tokens into the iframe head.
	//
	// In WordPress, the editor iframe gets the prebuilt token block at `:root`
	// automatically via the `wp-theme` PHP handle (registered in
	// `lib/client-assets.php`) and any per-instance `<style>` overrides via
	// `<StyleProvider document={ iframeDocument }>` from `@wordpress/components`.
	// In Storybook there is no PHP layer, so we replicate that here by cloning
	// the prebuilt token stylesheet plus any `<style>` element emitted by a
	// nested `<ThemeProvider>` (identified by its `data-wpds-theme-provider-id`
	// attribute).
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( ! iframe || ! iframe.contentDocument ) {
			return;
		}

		const head = iframe.contentDocument.head;

		const allNodes = Array.from(
			document.head.querySelectorAll( 'style, link[rel="stylesheet"]' )
		);

		allNodes.forEach( ( node ) => {
			if ( node.tagName === 'STYLE' ) {
				// Only `<ThemeProvider>` instances with non-default settings
				// emit a `<style>` element, identifiable by this attribute.
				if (
					( node as HTMLStyleElement ).dataset.wpdsThemeProviderId !==
					undefined
				) {
					head.appendChild( node.cloneNode( true ) );
				}
			} else if ( node.tagName === 'LINK' ) {
				// Clone the prebuilt token stylesheet (`design-tokens.css`)
				// so the iframe has the `--wpds-*` `:root` block. Any other
				// stylesheets are skipped to keep the iframe minimal.
				const href = ( node as HTMLLinkElement ).href;
				if ( href.includes( 'design-tokens' ) ) {
					head.appendChild( node.cloneNode( true ) );
				}
			}
		} );

		setIframeLoaded( true );
	}, [] );

	return (
		<iframe
			ref={ iframeRef }
			style={ {
				width: '100%',
				height: '400px',
				border: '1px solid #ccc',
			} }
			title="demo"
		>
			{ iframeLoaded &&
				iframeRef.current?.contentDocument?.body &&
				createPortal(
					children,
					iframeRef.current.contentDocument.body
				) }
		</iframe>
	);
}

export const AcrossIframes: StoryObj< typeof ThemeProvider > = {
	render: ( args ) => {
		return (
			<ThemeProvider { ...args }>
				{ args.children }

				<IframeWithClonedTokenStyles>
					<div
						style={ {
							color: 'var(--wpds-color-fg-content-neutral)',
						} }
					>
						In the iframe, but outside of `ThemeProvider`
					</div>
					<ThemeProvider
						{ ...args }
						// Note: the isRoot prop is necessary to apply the DS tokens to any
						// UI rendered outside of the ThemeProvider (including overlays, etc)
						isRoot
					>
						{ args.children }
					</ThemeProvider>
				</IframeWithClonedTokenStyles>
			</ThemeProvider>
		);
	},
	args: {
		children: (
			<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } }>
				Code is poetry.{ ' ' }
				<span
					style={ {
						display: 'inline-block',
						padding: 'var(--wpds-dimension-padding-sm)',
						borderRadius: '0.25rem',
						backgroundColor:
							'var(--wpds-color-bg-interactive-brand-strong)',
						color: 'var(--wpds-color-fg-interactive-brand-strong)',
					} }
				>
					primary
				</span>
			</div>
		),
	},
};
