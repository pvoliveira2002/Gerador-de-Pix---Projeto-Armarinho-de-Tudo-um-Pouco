import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cropToSource, getImageMetrics } from '../src/components/QrCropModal.js';

const component = readFileSync(new URL('../src/components/QrCropModal.js', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('recorte de QR Code existente', () => {
  it('exige confirmação em modal com recorte quadrado', () => {
    expect(template).toContain('qrCropModalTemplate()');
    expect(component).toContain('Selecione apenas a área do QR Code.');
    expect(component).toContain('Confirmar recorte');
    expect(component).toContain('this.crop.size');
  });

  it('oferece detecção automática com fallback manual', () => {
    expect(component).toContain("'BarcodeDetector' in window");
    expect(component).toContain("formats: ['qr_code']");
    expect(component).toContain('Ajuste o recorte manualmente');
  });

  it('gera PNG com margem branca e sem suavização', () => {
    expect(component).toContain("context.fillStyle = '#fff'");
    expect(component).toContain('context.imageSmoothingEnabled = false');
    expect(component).toContain("canvas.toDataURL('image/png')");
  });

  it('usa apenas o recorte confirmado no preview e permite recortar novamente', () => {
    expect(main).toContain("$('#uploaded-qr').src = croppedUrl");
    expect(main).toContain("$('#recrop-qr').addEventListener");
    expect(main).toContain("$('#replace-qr').addEventListener");
    expect(template).toContain('Recortar novamente');
    expect(template).toContain('Trocar imagem');
  });

  it('não cria scroll na aplicação principal', () => {
    expect(css).toContain('.crop-modal{position:fixed;inset:0');
    expect(css).toContain('max-height:calc(100dvh - 36px)');
    expect(css).toContain('body{height:100dvh;overflow:hidden}');
  });

  it.each([
    ['print vertical', 1080, 2400],
    ['print horizontal', 2400, 1080],
    ['imagem quadrada com espaço', 3000, 3000],
  ])('preserva geometria quadrada para %s', (_label, width, height) => {
    const metrics = getImageMetrics(width, height, 640, 390, 1.8, { x: 12, y: -8 });
    const size = Math.min(metrics.width, metrics.height) * 0.25;
    const crop = { x: metrics.x + size, y: metrics.y + size, size };
    const source = cropToSource(crop, metrics, width, height);
    expect(source.size).toBeGreaterThan(0);
    expect(source.x + source.size).toBeLessThanOrEqual(width);
    expect(source.y + source.size).toBeLessThanOrEqual(height);
  });

  it('mantém estado original, recortado e QR ativo separados', () => {
    expect(main).toContain('originalQrImage: null');
    expect(main).toContain('croppedQrImage: null');
    expect(main).toContain('activeQrCode: null');
    expect(main).toContain("type: 'imported', image: croppedUrl");
    expect(main).toContain("type: 'generated', payload: currentPayload");
  });
});
