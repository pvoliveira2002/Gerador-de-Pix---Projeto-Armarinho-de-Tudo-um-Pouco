import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TEMPLATE_CONFIGS, THEME_CONFIGS, getTemplateConfig } from '../src/templates/config.js';

const renderer = readFileSync(new URL('../src/components/TemplateRenderer.js', import.meta.url), 'utf8');
const gallery = readFileSync(new URL('../src/components/TemplateGallery.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('galeria reutilizável de modelos', () => {
  it('define seis modelos completos e um tema para cada um', () => {
    expect(TEMPLATE_CONFIGS).toHaveLength(6);
    for (const template of TEMPLATE_CONFIGS) {
      expect(template).toMatchObject({ id: expect.any(String), name: expect.any(String), description: expect.any(String), layout: expect.any(String), qrSize: expect.any(Number), informationOrder: expect.any(Array) });
      expect(THEME_CONFIGS[template.theme]).toBeDefined();
      expect(template.qrSize).toBeGreaterThanOrEqual(180);
      expect(template.qrSize).toBeLessThanOrEqual(190);
    }
  });

  it('usa Simples como modelo padrão', () => {
    expect(TEMPLATE_CONFIGS[0].id).toBe('simple');
    expect(getTemplateConfig('inexistente').id).toBe('simple');
    expect(main).toContain("applyTemplate($('#plate'), getTemplateConfig('simple'))");
  });

  it('clona a placa compartilhada e reutiliza a imagem do QR', () => {
    expect(renderer).toContain('sourcePlate.cloneNode(true)');
    expect(renderer).toContain('qrImageUrl');
    expect(renderer).not.toContain('QRCode.toCanvas');
    expect(gallery).toContain('getQrImage');
  });

  it('troca o preview imediatamente e destaca o selecionado', () => {
    expect(gallery).toContain("card.addEventListener('click'");
    expect(gallery).toContain("card.classList.toggle('selected', selected)");
    expect(main).toContain("applyTemplate($('#plate'), getTemplateConfig(id))");
  });

  it('mantém QR quadrado e informações dentro dos containers', () => {
    expect(css).toContain('.template-mini-plate .qr-shell img');
    expect(css).toContain('object-fit:contain;border-radius:0');
    expect(css).toContain('.out-name{max-width:100%');
    expect(css).toContain('.out-key{max-width:100%');
  });
});
