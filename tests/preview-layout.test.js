import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { generatePixPayload } from '../src/pix/payload.js';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/ui/template.js', import.meta.url), 'utf8');
const scenarios = [
  ['CPF, nome curto, com banco e valor', { name: 'ANA', city: 'RECIFE', keyType: 'cpf', key: '529.982.247-25', amount: '25.00', bank: 'Nubank' }],
  ['CPF, nome longo, sem banco e sem valor', { name: 'MARIA APARECIDA DOS SANTOS', city: 'SAO PAULO', keyType: 'cpf', key: '52998224725', amount: '', bank: '' }],
  ['telefone, nome curto, sem banco e com valor', { name: 'JOAO', city: 'NITEROI', keyType: 'phone', key: '(21) 99999-9999', amount: '10,50', bank: '' }],
  ['telefone, nome longo, com banco e sem valor', { name: 'JOAO CARLOS DE OLIVEIRA', city: 'RIO DE JANEIRO', keyType: 'phone', key: '+5521999999999', amount: '', bank: 'Banco do Brasil' }],
];

describe('estrutura da pré-visualização', () => {
  it('mantém a ordem vertical pedida', () => {
    const plateMarkup = template.slice(template.indexOf('<article id="plate"'), template.indexOf('</article>'));
    const order = ['plate-header', 'qr-shell', 'scan-text', 'plate-info', 'out-name', 'out-bank', 'out-key', '<footer>Pagamento via Pix'];
    let previous = -1;
    for (const marker of order) {
      const current = plateMarkup.indexOf(marker);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it('reserva 16 px e limita o QR visual a 180 px', () => {
    expect(css).toContain('--qr-size:180px');
    expect(css).toMatch(/\.qr-shell\{[^}]*padding:16px/);
    expect(css).toMatch(/\.qr-shell canvas,.qr-shell img\{[^}]*width:var\(--qr-size\)!important[^}]*height:var\(--qr-size\)!important/);
  });

  it('remove de fato o placeholder quando hidden', () => {
    expect(css).toContain('#qr-placeholder[hidden]');
    expect(css).toContain('display:none!important');
  });

  it.each(scenarios)('gera conteúdo válido no cenário %s', (_label, data) => {
    const payload = generatePixPayload({ description: '', txid: '', ...data });
    expect(payload).toMatch(/^00020126/);
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
    if (data.amount) expect(payload).toContain('54');
    else expect(payload).not.toContain('540');
  });
});
