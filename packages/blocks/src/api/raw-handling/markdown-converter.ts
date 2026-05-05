/**
 * External dependencies
 */
import { Marked, type Tokens } from 'marked';

// Skip escaping `"` and `'` so shortcodes like `[gallery ids="123"]` survive
// for the shortcode converter to match.
function escapeBodyText( value: string ): string {
	return value
		.replace( /&(?!#?\w+;)/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

const converter = new Marked( {
	gfm: true,
	breaks: true,
	renderer: {
		// Match showdown's `omitExtraWLInCodeBlocks`: marked appends `\n`
		// before `</code>`, which leaks into the Code block's content as a
		// trailing blank line.
		code( { text, lang }: Tokens.Code ): string {
			const language = ( lang || '' ).match( /\S*/ )?.[ 0 ];
			const cls = language
				? ` class="${ language } language-${ language }"`
				: '';
			return `<pre><code${ cls }>${ escapeBodyText(
				text
			) }</code></pre>`;
		},
		text( this: any, token: Tokens.Text | Tokens.Escape ): string {
			if ( 'tokens' in token && token.tokens ) {
				return this.parser.parseInline( token.tokens );
			}
			if ( 'escaped' in token && token.escaped ) {
				return token.text;
			}
			return escapeBodyText( token.text );
		},
	},
} );

/**
 * Corrects the Slack Markdown variant of the code block.
 * If uncorrected, it will be converted to inline code.
 *
 * @see https://get.slack.help/hc/en-us/articles/202288908-how-can-i-add-formatting-to-my-messages-#code-blocks
 *
 * @param text The potential Markdown text to correct.
 *
 * @return The corrected Markdown.
 */
function slackMarkdownVariantCorrector( text: string ): string {
	return text.replace(
		/((?:^|\n)```)([^\n`]+)(```(?:$|\n))/,
		( match, p1, p2, p3 ) => `${ p1 }\n${ p2 }\n${ p3 }`
	);
}

function bulletsToAsterisks( text: string ): string {
	return text.replace( /(^|\n)•( +)/g, '$1*$2' );
}

/**
 * Converts a piece of text into HTML based on any Markdown present.
 * Also decodes any encoded HTML.
 *
 * @param text The plain text to convert.
 *
 * @return HTML.
 */
export default function markdownConverter( text: string ): string {
	return converter.parse(
		slackMarkdownVariantCorrector( bulletsToAsterisks( text ) ),
		{ async: false }
	);
}
