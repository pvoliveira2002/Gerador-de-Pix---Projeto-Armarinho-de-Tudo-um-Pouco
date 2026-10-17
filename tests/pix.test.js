import { describe, expect, it } from 'vitest';
import { detectPixKeyType, isValidCpf, isValidCnpj, validateKey } from '../src/pix/validators.js';
import { formatPixKey, normalizeKey } from '../src/pix/normalize.js';
import { crc16, generatePixPayload } from '../src/pix/payload.js';

const base = { name: 'JOAO DA SILVA', city: 'SAO PAULO', keyType: 'email', key: 'pix@example.com', amount: '', description: '', txid: '' };

describe('chaves Pix', () => {
  it('formata as chaves para leitura sem alterar o valor normalizado', () => {
    expect(formatPixKey('cpf', '52998224725')).toBe('529.982.247-25');
    expect(formatPixKey('cnpj', '00000000E08G12')).toBe('00.000.000/E08G-12');
    expect(formatPixKey('phone', '21999999999')).toBe('+55 (21) 99999-9999');
  });
  it('valida CPF e remove máscara', () => { expect(isValidCpf('529.982.247-25')).toBe(true); expect(normalizeKey('cpf', '529.982.247-25')).toBe('52998224725'); });
  it('valida CNPJ', () => expect(isValidCnpj('04.252.011/0001-10')).toBe(true));
  it.each([
    ['(21) 99999-9999', '+5521999999999'],
    ['21 99999-9999', '+5521999999999'],
    ['55 21 99999-9999', '+5521999999999'],
    ['+55 (21) 99999-9999', '+5521999999999'],
    ['021 99999-9999', '+5521999999999'],
    ['0055 21 99999-9999', '+5521999999999'],
  ])('normaliza celular %s no formato E.164', (input, expected) => {
    expect(normalizeKey('phone', input)).toBe(expected);
    expect(validateKey('phone', input)).toBe(true);
  });
  it('rejeita telefone curto ou sem código internacional válido', () => {
    expect(validateKey('phone', '9999-9999')).toBe(false);
    expect(validateKey('phone', '+0123456789')).toBe(false);
  });
  it('valida e-mail segundo o formato DICT e normaliza maiúsculas', () => {
    expect(normalizeKey('email', 'Pix+Loja@Example.COM')).toBe('pix+loja@example.com');
    expect(validateKey('email', 'Pix+Loja@Example.COM')).toBe(true);
    expect(validateKey('email', 'pix@-example.com')).toBe(false);
    expect(validateKey('email', `${'a'.repeat(72)}@x.com`)).toBe(false);
  });
  it('valida chave aleatória UUID e rejeita texto fora do formato', () => {
    expect(validateKey('random', '123e4567-e89b-42d3-a456-426614174000')).toBe(true);
    expect(validateKey('random', 'chave-aleatoria')).toBe(false);
  });
  it('aceita CNPJ numérico e o novo CNPJ alfanumérico', () => {
    expect(validateKey('cnpj', '04.252.011/0001-10')).toBe(true);
    expect(normalizeKey('cnpj', '00.000.000/E08G-12')).toBe('00000000E08G12');
    expect(validateKey('cnpj', '00.000.000/E08G-12')).toBe(true);
  });
  it('diferencia automaticamente CPF e celular com 11 dígitos', () => {
    expect(detectPixKeyType('529.982.247-25')).toBe('cpf');
    expect(detectPixKeyType('(21) 99999-9999')).toBe('phone');
    expect(detectPixKeyType('+55 21 99999-9999')).toBe('phone');
    expect(detectPixKeyType('00.000.000/E08G-12')).toBe('cnpj');
    expect(detectPixKeyType('Pix+Loja@Example.COM')).toBe('email');
    expect(detectPixKeyType('123e4567-e89b-42d3-a456-426614174000')).toBe('random');
    expect(detectPixKeyType('não é uma chave')).toBeNull();
  });
});

describe('payload BR Code', () => {
  it('calcula CRC16/CCITT-FALSE conhecido', () => expect(crc16('123456789')).toBe('29B1'));
  it('gera Pix sem valor e TXID padrão', () => { const payload = generatePixPayload(base); expect(payload).not.toContain('540'); expect(payload).toContain('62070503***'); expect(payload.slice(-8, -4)).toBe('6304'); expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4))); });
  it('gera Pix com valor fixado em duas casas', () => expect(generatePixPayload({ ...base, amount: '25,5' })).toContain('540525.50'));
  it('inclui TXID alfanumérico', () => expect(generatePixPayload({ ...base, txid: 'PEDIDO123' })).toContain('0509PEDIDO123'));
  it('inclui estrutura obrigatória completa', () => { const payload = generatePixPayload(base); expect(payload).toMatch(/^00020126/); expect(payload).toContain('0014br.gov.bcb.pix'); expect(payload).toContain('52040000'); expect(payload).toContain('5303986'); expect(payload).toContain('5802BR'); });
});
