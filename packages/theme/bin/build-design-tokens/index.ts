import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, build } from '@terrazzo/parser';
import config from '../../terrazzo.config';
import { formatLegacyWpComponentsOverridesAsCSS } from '../../src/legacy-overrides';

const sources = await Promise.all(
	config.tokens.map( async ( tokenUrl: URL ) => ( {
		filename: tokenUrl,
		src: await readFile( fileURLToPath( tokenUrl ), 'utf8' ),
	} ) )
);

const {
	tokens: parsedTokens,
	sources: parsedSources,
	resolver,
} = await parse( sources, {
	config,
	skipLint: true,
} );

// Temporary workaround for Terrazzo bug where `alphabetize: false` leaves token
// map keys in JSON Pointer form (e.g. `#/foo/bar`) while `aliasOf` references
// remain dot-delimited (e.g. `foo.bar`), breaking alias lookups. Transforms the
// map keys using the already-normalized `token.id`.
//
// See: https://github.com/terrazzoapp/terrazzo/issues/734
const tokens = Object.fromEntries(
	Object.values( parsedTokens ).map( ( token ) => [ token.id, token ] )
);

const { outputFiles } = await build( tokens, {
	sources: parsedSources,
	config,
	resolver,
} );

const outDir = fileURLToPath( config.outDir );

const legacyWpComponentsOverridesCSS = formatLegacyWpComponentsOverridesAsCSS();

for ( const file of outputFiles ) {
	const filePath = resolve( outDir, file.filename );
	await mkdir( dirname( filePath ), { recursive: true } );

	// For the public CSS entry point, append the static legacy
	// `--wp-components-*` aliases at `:root`. These are pure `var(...)`
	// references that used to be emitted by every `<ThemeProvider>` instance
	// at runtime. Hoisting them to the prebuilt CSS removes per-instance
	// duplication and makes the aliases available globally — including in
	// portals — without requiring a provider in the cascade.
	const contents =
		file.filename === 'css/design-tokens.css'
			? `${ file.contents }\n${ legacyWpComponentsOverridesCSS }`
			: file.contents;

	await writeFile( filePath, contents );
}
