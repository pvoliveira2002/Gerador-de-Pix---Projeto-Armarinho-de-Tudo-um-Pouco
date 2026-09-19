import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/QrCropModal.js', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('recorte de QR Code existente', () => {
  it('exige confirmação em modal com recorte quadrado', () => {
    expect(template).toContain('qrCropModalTemplate()');
    expect(component).toContain('Selecione apenas o QR Code');
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
    expect(template).toContain('Recortar novamente');
  });

  it('não cria scroll na aplicação principal', () => {
    expect(css).toContain('.crop-modal{position:fixed;inset:0');
    expect(css).toContain('max-height:calc(100dvh - 36px)');
    expect(css).toContain('body{height:100dvh;overflow:hidden}');
  });
});
