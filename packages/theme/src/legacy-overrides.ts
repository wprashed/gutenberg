/**
 * Static legacy CSS custom property aliases that map the (now-deprecated)
 * `--wp-components-*` token surface onto the new design system tokens, and
 * onto WP Core's `--wp-admin-theme-color*` family.
 *
 * These mappings contain only `var(...)` references — they do not depend on
 * any runtime theme settings — so they live in the prebuilt CSS at `:root`
 * instead of being re-emitted by every `<ThemeProvider>` instance.
 *
 * Both this module and the `bin/build-design-tokens` script consume this
 * constant so that there is a single source of truth.
 */
export const LEGACY_WP_COMPONENTS_OVERRIDES: ReadonlyArray<
	readonly [ string, string ]
> = [
	[ '--wp-components-color-accent', 'var(--wp-admin-theme-color)' ],
	[
		'--wp-components-color-accent-darker-10',
		'var(--wp-admin-theme-color-darker-10)',
	],
	[
		'--wp-components-color-accent-darker-20',
		'var(--wp-admin-theme-color-darker-20)',
	],
	[
		'--wp-components-color-accent-inverted',
		'var(--wpds-color-fg-interactive-brand-strong)',
	],
	[
		'--wp-components-color-background',
		'var(--wpds-color-bg-surface-neutral-strong)',
	],
	[
		'--wp-components-color-foreground',
		'var(--wpds-color-fg-content-neutral)',
	],
	[
		'--wp-components-color-foreground-inverted',
		'var(--wpds-color-bg-surface-neutral)',
	],
	[
		'--wp-components-color-gray-100',
		'var(--wpds-color-bg-surface-neutral)',
	],
	[
		'--wp-components-color-gray-200',
		'var(--wpds-color-stroke-surface-neutral)',
	],
	[
		'--wp-components-color-gray-300',
		'var(--wpds-color-stroke-surface-neutral)',
	],
	[
		'--wp-components-color-gray-400',
		'var(--wpds-color-stroke-interactive-neutral)',
	],
	[
		'--wp-components-color-gray-600',
		'var(--wpds-color-stroke-interactive-neutral)',
	],
	[
		'--wp-components-color-gray-700',
		'var(--wpds-color-fg-content-neutral-weak)',
	],
	[
		'--wp-components-color-gray-800',
		'var(--wpds-color-fg-content-neutral)',
	],
];

/**
 * Format `LEGACY_WP_COMPONENTS_OVERRIDES` as a `:root { ... }` CSS rule, ready
 * to be appended to the prebuilt `design-tokens.css` file.
 */
export function formatLegacyWpComponentsOverridesAsCSS(): string {
	const body = LEGACY_WP_COMPONENTS_OVERRIDES.map(
		( [ name, value ] ) => `\t${ name }: ${ value };`
	).join( '\n' );

	return [
		'/* -------------------------------------------',
		' * Legacy `--wp-components-*` aliases.',
		' * Pure `var(...)` references — emitted at `:root` so that any DOM',
		' * subtree (including portals) inherits them without depending on a',
		' * `<ThemeProvider>` instance being present in the cascade.',
		' * ------------------------------------------- */',
		':root {',
		body,
		'}',
		'',
	].join( '\n' );
}
