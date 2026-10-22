import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const templateConfigSource = readFileSync(new URL('../src/templates/config.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('shell desktop sem scroll global', () => {
  it('expõe as quatro abas principais no mesmo painel', () => {
    expect(template).toContain('class="step-navigation app-tabs"');
    expect(template).toContain('<b>Tamanho</b>');
    expect(template).not.toContain('class="step-item export-step"');
    expect(css).toContain('.app-tabs i');
  });

  it('mantém todas as ações junto ao preview', () => {
    for (const id of ['new-pix', 'action-copy', 'action-png', 'action-pdf', 'action-pdf-a4', 'action-print-a4']) {
      expect(template).toContain(`id="${id}"`);
    }
    expect(css).toContain('.preview-actions{flex:0 0 auto');
  });

  it('mostra a coleção de modelos em grade compacta', () => {
    const models = [...templateConfigSource.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
    expect(models).toEqual(['simple', 'modern', 'commercial', 'green', 'premium', 'accessible', 'blue-wave', 'royal', 'turquoise', 'blush', 'gold', 'neon', 'geometric', 'night-wave']);
    expect(css).toContain('.template-gallery{display:grid;grid-template-columns:repeat(3');
  });

  it('tem adaptações para notebooks e telas estreitas', () => {
    expect(css).toContain('@media(max-height:820px) and (min-width:901px)');
    expect(css).toContain('@media(max-width:900px)');
    expect(css).toContain('@media(max-width:560px)');
  });
});
