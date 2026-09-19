import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('shell desktop sem scroll global', () => {
  it('expõe somente as três abas principais e oculta exportação da navegação', () => {
    expect(template).toContain('class="step-navigation app-tabs"');
    expect(template).toContain('class="step-item export-step"');
    expect(css).toContain('.app-tabs i,.app-tabs .export-step{display:none}');
  });

  it('mantém todas as ações junto ao preview', () => {
    for (const id of ['new-pix', 'action-copy', 'action-png', 'action-pdf', 'action-print']) {
      expect(template).toContain(`id="${id}"`);
    }
    expect(css).toContain('.preview-actions{flex:0 0 auto');
  });

  it('mostra seis modelos em grade compacta', () => {
    const models = [...template.matchAll(/data-template="([^"]+)"/g)].map((match) => match[1]);
    expect(models).toEqual(['simple', 'modern', 'commercial', 'green', 'premium', 'accessible']);
    expect(css).toContain('.template-list{grid-template-columns:repeat(3,1fr)');
  });

  it('tem adaptações para notebooks e telas estreitas', () => {
    expect(css).toContain('@media(max-height:820px) and (min-width:901px)');
    expect(css).toContain('@media(max-width:900px)');
    expect(css).toContain('@media(max-width:560px)');
  });
});
