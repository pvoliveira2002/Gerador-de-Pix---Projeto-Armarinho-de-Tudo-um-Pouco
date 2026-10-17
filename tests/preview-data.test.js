import { describe, expect, it } from 'vitest';
import { getPixDisplayData } from '../src/components/TemplateRenderer.js';
import { TEMPLATE_CONFIGS } from '../src/templates/config.js';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

describe('integração entre dados Pix e preview', () => {
  it('exibe nome, banco e chave realmente preenchidos', () => {
    expect(getPixDisplayData({
      name: 'Paulo victor',
      bank: 'Caixa',
      keyType: 'cpf',
      key: '198.140.877-00',
    })).toMatchObject({
      name: 'Paulo victor',
      bank: 'Caixa',
      key: '19814087700',
    });
  });

  it('usa placeholders somente quando os campos estão vazios', () => {
    expect(getPixDisplayData({ name: ' ', bank: '', key: '' })).toMatchObject({
      name: 'Nome do recebedor',
      bank: 'Banco',
      key: 'Sua chave Pix',
    });
  });

  it('mantém os mesmos dados ao trocar entre todos os modelos', () => {
    const data = getPixDisplayData({ name: 'Paulo victor', bank: 'Caixa', keyType: 'phone', key: '(11) 99999-9999' });
    for (const template of TEMPLATE_CONFIGS) {
      expect(template.informationOrder).toContain('name');
      expect(template.informationOrder).toContain('bank');
      expect(template.informationOrder).toContain('key');
      expect(data).toMatchObject({ name: 'Paulo victor', bank: 'Caixa', key: '+5511999999999' });
    }
  });

  it('renderiza explicitamente dentro de #plate, não em uma miniatura global', () => {
    expect(main).toContain("renderPixData($('#plate'), pixData)");
    expect(main).not.toContain("$('.out-name').textContent");
    expect(main).not.toContain("$('.out-bank').textContent");
    expect(main).not.toContain("$('.out-key').textContent");
  });
});
