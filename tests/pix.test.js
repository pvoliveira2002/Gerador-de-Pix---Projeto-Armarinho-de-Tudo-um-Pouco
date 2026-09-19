import { describe, expect, it } from 'vitest';
import { isValidCpf, isValidCnpj, validateKey } from '../src/pix/validators.js';
import { normalizeKey } from '../src/pix/normalize.js';
import { crc16, generatePixPayload } from '../src/pix/payload.js';

const base = { name: 'JOAO DA SILVA', city: 'SAO PAULO', keyType: 'email', key: 'pix@example.com', amount: '', description: '', txid: '' };

describe('chaves Pix', () => {
  it('valida CPF e remove máscara', () => { expect(isValidCpf('529.982.247-25')).toBe(true); expect(normalizeKey('cpf', '529.982.247-25')).toBe('52998224725'); });
  it('valida CNPJ', () => expect(isValidCnpj('04.252.011/0001-10')).toBe(true));
  it('normaliza celular brasileiro', () => expect(normalizeKey('phone', '(21) 99999-9999')).toBe('+5521999999999'));
  it('valida e-mail', () => expect(validateKey('email', 'pix@example.com')).toBe(true));
  it('valida chave aleatória UUID', () => expect(validateKey('random', '123e4567-e89b-42d3-a456-426614174000')).toBe(true));
});

describe('payload BR Code', () => {
  it('calcula CRC16/CCITT-FALSE conhecido', () => expect(crc16('123456789')).toBe('29B1'));
  it('gera Pix sem valor e TXID padrão', () => { const payload = generatePixPayload(base); expect(payload).not.toContain('540'); expect(payload).toContain('62070503***'); expect(payload.slice(-8, -4)).toBe('6304'); expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4))); });
  it('gera Pix com valor fixado em duas casas', () => expect(generatePixPayload({ ...base, amount: '25,5' })).toContain('540525.50'));
  it('inclui TXID alfanumérico', () => expect(generatePixPayload({ ...base, txid: 'PEDIDO123' })).toContain('0509PEDIDO123'));
  it('inclui estrutura obrigatória completa', () => { const payload = generatePixPayload(base); expect(payload).toMatch(/^00020126/); expect(payload).toContain('0014br.gov.bcb.pix'); expect(payload).toContain('52040000'); expect(payload).toContain('5303986'); expect(payload).toContain('5802BR'); });
});
