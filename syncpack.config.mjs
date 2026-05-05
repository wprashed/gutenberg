/** @type {import('syncpack').RcFile} */
export default {
	versionGroups: [
		{
			label: 'Internal @wordpress/* workspace packages: ignore (workspaces are the source of truth).',
			dependencies: [ '@wordpress/**' ],
			packages: [ '**' ],
			isIgnored: true,
		},
		{
			label: 'peerDependencies use intentionally wide ranges; only enforce that the ranges are mutually satisfiable.',
			dependencyTypes: [ 'peer' ],
			policy: 'sameRange',
		},
		{
			label: 'All dependencies must use the same version across the repo.',
			dependencies: [ '**' ],
			packages: [ '**' ],
		},
	],
	semverGroups: [
		{
			label: 'All dependencies must use caret ranges.',
			packages: [ '**' ],
			dependencyTypes: [ 'prod', 'dev' ],
			range: '^',
		},
	],
};
