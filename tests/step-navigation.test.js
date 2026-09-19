import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('navegação da fase 1', () => {
  it('expõe as quatro etapas na ordem correta', () => {
    const labels = ['Dados', 'Modelo', 'Personalizar', 'Exportar'];
    let previous = -1;
    for (const label of labels) {
      const current = template.indexOf(`<b>${label}</b>`);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it('inicia etapas futuras bloqueadas e libera após QR válido', () => {
    expect(template).toMatch(/data-step-target="2" disabled/);
    expect(template).toMatch(/id="step1-continue"[^>]*disabled/);
    expect(source).toContain('function unlockStep(step)');
    expect(source).toContain('function showEditor() { unlockStep(2)');
  });

  it('possui voltar, continuar e clique em etapa concluída', () => {
    expect(template).toContain('data-back="1"');
    expect(template).toContain('data-next="4"');
    expect(source).toContain("document.querySelectorAll('.step-item')");
  });

  it('mantém a aplicação em 100dvh e limita scroll aos painéis', () => {
    expect(css).toContain('body{height:100dvh;overflow:hidden}');
    expect(css).toContain('.control-column>.panel{height:100%;min-height:0;overflow-y:auto');
    expect(css).toContain('.preview-panel{position:static;height:100%');
  });
});
