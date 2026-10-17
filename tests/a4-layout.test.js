import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculateA4Layout, calculateBestOrientation, calculateLayoutFromPrintSettings } from '../src/print/calculateA4Layout.js';
import { CARD_SIZE_PRESETS, DEFAULT_PRINT_SETTINGS, PAPER_SIZES } from '../src/print/printSettings.js';

const exporter = readFileSync(new URL('../src/export/exporter.js', import.meta.url), 'utf8');

const layout = (overrides = {}) => calculateA4Layout({
  paperWidthMm: 210,
  paperHeightMm: 297,
  cardWidthMm: 100,
  cardHeightMm: 150,
  marginMm: 5,
  gapMm: 5,
  quantity: 1,
  allowRotation: true,
  ...overrides,
});

describe('distribuição automática na A4', () => {
  it('considera margem e gap e escolhe a rotação com maior capacidade', () => {
    const result = layout({ quantity: 2 });
    expect(result.itemsPerPage).toBe(2);
    expect(result.orientationUsed).toBe('rotated');
    expect(result.positions).toMatchObject([
      { xMm: 30, yMm: 46, widthMm: 150, heightMm: 100, rotation: 90 },
      { xMm: 30, yMm: 151, widthMm: 150, heightMm: 100, rotation: 90 },
    ]);
  });

  it('gera páginas suficientes e centraliza novamente a última página', () => {
    const result = calculateA4Layout({ paperWidthMm: 210, paperHeightMm: 297, cardWidthMm: 90, cardHeightMm: 130, marginMm: 5, gapMm: 5, quantity: 10, allowRotation: true });
    expect(result.itemsPerPage).toBe(4);
    expect(result.pageCount).toBe(3);
    expect(result.pages.map((page) => page.count)).toEqual([4, 4, 2]);
    expect(result.pages[2].positions[0].yMm).toBe(83.5);
    expect(result.pages[2].positions[1].yMm).toBe(83.5);
  });

  it('preencher folha usa exatamente a capacidade máxima', () => {
    const result = layout({ quantity: 'fill' });
    expect(result.quantity).toBe(result.itemsPerPage);
    expect(result.pageCount).toBe(1);
  });

  it.each([3, 5, 10])('respeita gap de %s mm sem ultrapassar a área útil', (gapMm) => {
    const result = layout({ cardWidthMm: 70, cardHeightMm: 100, quantity: 'fill', gapMm });
    for (const position of result.positions) {
      expect(position.xMm).toBeGreaterThanOrEqual(5);
      expect(position.yMm).toBeGreaterThanOrEqual(5);
      expect(position.xMm + position.widthMm).toBeLessThanOrEqual(205);
      expect(position.yMm + position.heightMm).toBeLessThanOrEqual(292);
    }
  });

  it('respeita orientações normal, girada e automática', () => {
    const normal = layout({ allowRotation: false, quantity: 'fill' });
    const automatic = layout({ allowRotation: true, quantity: 'fill' });
    expect(normal.orientationUsed).toBe('normal');
    expect(normal.itemsPerPage).toBe(1);
    expect(automatic.orientationUsed).toBe('rotated');
    expect(automatic.itemsPerPage).toBe(2);
  });

  it('calcula todos os presets e personalizado instantaneamente', () => {
    for (const preset of CARD_SIZE_PRESETS.filter((item) => item.id !== 'custom')) {
      const result = calculateLayoutFromPrintSettings({ ...DEFAULT_PRINT_SETTINGS, cardWidthMm: preset.widthMm, cardHeightMm: preset.heightMm, quantityMode: 'fill' }, PAPER_SIZES.a4);
      expect(result.itemsPerPage).toBeGreaterThanOrEqual(1);
      expect(result.pages).toHaveLength(1);
    }
    expect(layout({ cardWidthMm: 50, cardHeightMm: 50, quantity: 'fill' }).itemsPerPage).toBe(15);
  });

  it('exportador cria uma página A4 para cada item de pages', () => {
    expect(exporter).toContain('layout.pages.forEach');
    expect(exporter).toContain("pdf.addPage([paper.widthMm, paper.heightMm], 'portrait')");
    expect(exporter).toContain('page.positions.forEach');
  });

  it('prefere a orientacao original quando uma unica placa cabe igualmente nas duas', () => {
    const result = calculateBestOrientation({ paperWidthMm: 210, paperHeightMm: 297, cardWidthMm: 100, cardHeightMm: 150, marginMm: 5, gapMm: 5, quantity: 1 });
    expect(result.rotation).toBe(0);
    expect(result.orientation).toBe('portrait');
  });

  it.each([3, 5])('inclui offset externo de %s mm na ocupacao', (offsetMm) => {
    const result = layout({ cardWidthMm: 70, cardHeightMm: 100, quantity: 'fill', cutLineOffsetMm: offsetMm });
    for (const position of result.positions) {
      expect(position.xMm).toBe(position.cutLineXmm + offsetMm);
      expect(position.yMm).toBe(position.cutLineYmm + offsetMm);
      expect(position.cutLineWidthMm).toBe(position.widthMm + offsetMm * 2);
      expect(position.cutLineHeightMm).toBe(position.heightMm + offsetMm * 2);
      expect(position.cutLineXmm).toBeGreaterThanOrEqual(5);
      expect(position.cutLineXmm + position.cutLineWidthMm).toBeLessThanOrEqual(205);
    }
  });

  it('linha desligada nao reserva offset; linha ligada reserva o valor configurado', () => {
    const base = { ...DEFAULT_PRINT_SETTINGS, cardWidthMm: 70, cardHeightMm: 100, quantityMode: 'fill' };
    const disabled = calculateLayoutFromPrintSettings({ ...base, cutLineSettings: { enabled: false, offsetMm: 5 } }, PAPER_SIZES.a4);
    const enabled = calculateLayoutFromPrintSettings({ ...base, cutLineSettings: { enabled: true, offsetMm: 5 } }, PAPER_SIZES.a4);
    expect(disabled.positions[0].xMm).toBe(disabled.positions[0].cutLineXmm);
    expect(enabled.positions[0].xMm).toBe(enabled.positions[0].cutLineXmm + 5);
    expect(enabled.itemsPerPage).toBeLessThanOrEqual(disabled.itemsPerPage);
  });

  it.each([[80, 120], [100, 200], [120, 120], [180, 100], [200, 100]])('calcula tamanho personalizado %s x %s mm sem ultrapassar A4', (cardWidthMm, cardHeightMm) => {
    const result = layout({ cardWidthMm, cardHeightMm, quantity: 4, cutLineOffsetMm: 3 });
    for (const page of result.pages) for (const position of page.positions) {
      expect(position.cutLineXmm).toBeGreaterThanOrEqual(5);
      expect(position.cutLineYmm).toBeGreaterThanOrEqual(5);
      expect(position.cutLineXmm + position.cutLineWidthMm).toBeLessThanOrEqual(205);
      expect(position.cutLineYmm + position.cutLineHeightMm).toBeLessThanOrEqual(292);
    }
  });
});
