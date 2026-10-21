import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CARD_SIZE_PRESETS, DEFAULT_PRINT_SETTINGS, PAPER_SIZES, calculateCardPosition, fitsOnPage, mmToPoints, mmToPx, orientCard, validatePrintSettings } from '../src/print/printSettings.js';

const exporter = readFileSync(new URL('../src/export/exporter.js', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('tamanho físico e folha A4', () => {
  it('define A4 real e todos os tamanhos solicitados em milímetros', () => {
    expect(PAPER_SIZES.a4).toMatchObject({ widthMm: 210, heightMm: 297 });
    expect(CARD_SIZE_PRESETS.map(({ id, widthMm, heightMm }) => [id, widthMm, heightMm])).toEqual([
      ['7x10', 70, 100], ['9x13', 90, 130], ['10x15', 100, 150], ['13x18', 130, 180], ['15x20', 150, 200], ['a5', 148, 210], ['a4', 210, 297], ['custom', null, null],
    ]);
  });

  it('centraliza exatamente uma placa 10 × 15 cm na A4', () => {
    expect(calculateCardPosition(DEFAULT_PRINT_SETTINGS)).toEqual({ widthMm: 100, heightMm: 150, xMm: 55, yMm: 73.5 });
  });

  it('aplica retrato, paisagem e automática sem aproximação em pixels', () => {
    expect(orientCard(100, 150, 'portrait')).toEqual({ widthMm: 100, heightMm: 150 });
    expect(orientCard(100, 150, 'landscape')).toEqual({ widthMm: 150, heightMm: 100 });
    expect(orientCard(100, 150, 'auto')).toEqual({ widthMm: 100, heightMm: 150 });
  });

  it('valida margem de 5 mm e rejeita medidas inválidas', () => {
    expect(fitsOnPage({ cardWidthMm: 200, cardHeightMm: 287, marginMm: 5 })).toBe(true);
    expect(validatePrintSettings({ ...DEFAULT_PRINT_SETTINGS, cardWidthMm: 0 })).toContain('maiores que zero');
    expect(validatePrintSettings({ ...DEFAULT_PRINT_SETTINGS, cardWidthMm: 201, cardHeightMm: 288 })).toContain('não cabe');
    expect(validatePrintSettings({ ...DEFAULT_PRINT_SETTINGS, cardWidthMm: 300 })).toContain('maior que uma folha A4');
    expect(validatePrintSettings({ ...DEFAULT_PRINT_SETTINGS, cardWidthMm: 210, cardHeightMm: 297 })).toBe('');
  });

  it('converte 100 × 150 mm para aproximadamente 1181 × 1772 px em 300 DPI', () => {
    expect(mmToPx(100)).toBe(1181);
    expect(mmToPx(150)).toBe(1772);
    expect(mmToPoints(25.4)).toBeCloseTo(72, 8);
  });

  it('gera PDF A4 em mm e posiciona a placa usando medidas físicas', () => {
    expect(exporter).toContain("unit: 'mm'");
    expect(exporter).toContain("format: [paper.widthMm, paper.heightMm]");
    expect(exporter).toContain('position.xMm, position.yMm, position.widthMm, position.heightMm');
    expect(exporter).toContain('if (settings.showCropMarks && !layout.fullPage) addCropMarks');
    expect(template).toContain('data-size="a4"');
  });

  it('mantém preview proporcional sem scroll global', () => {
    expect(template).toContain('data-preview-mode="paper"');
    expect(css).toContain('aspect-ratio:210/297');
    expect(css).toContain('body{height:100dvh;overflow:hidden}');
  });
});
