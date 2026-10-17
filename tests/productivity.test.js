import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');

describe('fluxo de produtividade', () => {
  it('separa novo atendimento de restauracao completa', () => {
    expect(source).toContain('preserveProduction = true');
    expect(template).toContain('id="reset-everything"');
    expect(template).toContain('preferências de produção serão mantidas');
  });

  it('habilita copiar somente para QR gerado com payload', () => {
    expect(source).toContain("qrState.activeQrCode?.type !== 'generated' || !currentPayload");
  });

  it('protege exportacoes contra cliques repetidos e falhas', () => {
    expect(source).toContain('async function runExport');
    expect(source).toContain("button.textContent = 'Gerando…'");
    expect(source).toContain("toast('Não foi possível concluir a exportação.')");
  });

  it('oferece atalhos, repeticao, modo rapido e perfil local', () => {
    for (const fragment of ['event.ctrlKey && event.shiftKey', "event.key === 'Enter'", 'id="repeat-last"', 'id="quick-mode"', 'id="business-dialog"', 'localStorage.setItem']) expect(source + template).toContain(fragment);
  });

  it('identifica a chave automaticamente e mantém escolha manual como exceção', () => {
    expect(template).toContain('id="key-detection"');
    expect(template).toContain('id="key-type-field" hidden');
    expect(template).toContain('id="choose-key-type"');
    expect(source).toContain('function updateKeyDetection()');
    expect(source).toContain('data.keyType = inferKeyType(data.key)');
  });

  it('usa modo rápido por padrão e mantém a ação de gerar acessível', () => {
    expect(template).toContain('data-form-mode="quick"');
    expect(template).toContain('id="quick-mode" checked hidden');
    expect(template).toContain('class="btn primary generate-pix-button"');
    expect(source).toContain('setQuickMode(saved.quickMode !== false)');
    expect(source).toContain("elements.city.closest('label').hidden = enabled && Boolean(businessProfile.city)");
    expect(source).toContain("applyBusinessDefaults(); setQuickMode($('#quick-mode').checked)");
  });

  it('resume a produção e agrupa os formatos de download', () => {
    expect(template).toContain('id="operational-summary"');
    expect(template).toContain('class="download-menu unavailable"');
    expect(template).toContain('Baixar <span>▾</span>');
    expect(source).toContain("const cutLabel = cutLineSettings.enabled");
  });

  it('oferece preview ampliado e perfil com padrões de produção', () => {
    expect(template).toContain('id="expand-preview"');
    expect(template).toContain('id="preview-dialog"');
    expect(template).toContain('name="templateId"');
    expect(template).toContain('name="sizePreset"');
    expect(source).toContain("status.textContent = 'Gerando…'");
  });
});
