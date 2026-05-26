/**
 * Static `--wp-components-*` → WPDS / `--wp-admin-theme-color` aliases.
 * Pure `var(...)` references, so they live at `:root` in the prebuilt CSS
 * rather than being re-emitted by every `<ThemeProvider>` instance.
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

export function formatLegacyWpComponentsOverridesAsCSS(): string {
	const body = LEGACY_WP_COMPONENTS_OVERRIDES.map(
		( [ name, value ] ) => `\t${ name }: ${ value };`
	).join( '\n' );

	return [
		'/* Legacy `--wp-components-*` aliases (see `legacy-overrides.ts`). */',
		':root {',
		body,
		'}',
		'',
	].join( '\n' );
}
