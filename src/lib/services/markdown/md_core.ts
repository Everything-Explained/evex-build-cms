import Markdown from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import Token from 'markdown-it/lib/token';


export function useMarkdown() { return md; }



const md = new Markdown({
  xhtmlOut: true,
  breaks: true,
  typographer: true,
  quotes: '“”‘’',
  linkify: true,
});


// eslint-disable-next-line @typescript-eslint/no-var-requires
md.use(require('markdown-it-deflist'));

// eslint-disable-next-line @typescript-eslint/no-var-requires
md.use(require('./video_plugin'), {
  youtube: {
    width: 'auto',
    height: 'auto',
    nocookie: true,
    parameters: {
      rel: 0,
    }
  }
});

applyCustomLinks();


function applyCustomLinks() {
  const defaultLinkRenderer = md.renderer.rules.link_open || defaultRenderer;

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const link = tokens[idx]!.attrGet('href')!.toLowerCase();
    applyLinkTargetBlank(tokens, idx, link) || applyVueRouterLinks(tokens, idx, link);
    return defaultLinkRenderer(tokens, idx, options, env, self);
  };
}

/** Convert all external links to `<a target="_blank">` */
function applyLinkTargetBlank(tokens: Token[], idx: number, link: string) {
  if (link.startsWith('http')) {
    tokens[idx].attrPush(['target', '_blank']);
    tokens[idx].attrPush(['rel', 'noopener']); // Prevent new tab access to window.opener
    return true;
  }
  return false;
}

/** Convert all internal links to link with custom onclick handler */
function applyVueRouterLinks(tokens: Token[], idx: number, link: string) {
  const linkOpen = tokens[idx];
  linkOpen.attrSet(
    'onclick',
    `event.preventDefault(); window.$router.push('${link}')`
  );
}


function defaultRenderer(tokens: Token[], idx: number, options: Markdown.Options, env: any, self: Renderer) {
  return self.renderToken(tokens, idx, options);
}





