import { normalizeKey, onlyDigits } from './normalize.js';

function repeated(value) { return /^(\d)\1+$/.test(value); }

export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || repeated(cpf)) return false;
  for (let digit = 9; digit < 11; digit += 1) {
    let sum = 0;
    for (let i = 0; i < digit; i += 1) sum += Number(cpf[i]) * (digit + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(cpf[digit])) return false;
  }
  return true;
}

export function isValidCnpj(value) {
  const cnpj = String(value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || repeated(cnpj)) return false;
  const charValue = (character) => character.charCodeAt(0) - 48;
  const calc = (base) => {
    let weight = base.length - 7;
    const sum = [...base].reduce((total, n) => {
      const result = total + charValue(n) * weight--;
      if (weight < 2) weight = 9;
      return result;
    }, 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return calc(cnpj.slice(0, 12)) === Number(cnpj[12]) && calc(cnpj.slice(0, 13)) === Number(cnpj[13]);
}

export function validateKey(type, value) {
  const key = normalizeKey(type, value);
  if (type === 'cpf') return isValidCpf(key);
  if (type === 'cnpj') return isValidCnpj(key);
  if (type === 'phone') return /^\+[1-9]\d{1,14}$/.test(key);
  if (type === 'email') return /^[a-z0-9.!#$'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/.test(key) && key.length <= 77;
  if (type === 'random') return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  return false;
}

export function detectPixKeyType(value) {
  const raw = String(value || '').trim();
  const digits = onlyDigits(raw);
  if (raw.includes('@')) return 'email';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return 'random';
  if (isValidCpf(raw)) return 'cpf';
  if (digits.length === 14 || /^[A-Za-z0-9.\/-]{14,18}$/.test(raw) && /[A-Za-z]/.test(raw)) return 'cnpj';
  if (validateKey('phone', raw)) return 'phone';
  return null;
}

export function validatePixForm(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Informe o nome do recebedor.';
  if (!data.city.trim()) errors.city = 'Informe a cidade do recebedor.';
  if (!data.key.trim() || !validateKey(data.keyType, data.key)) {
    errors.key = data.keyType === 'phone' ? 'Digite um celular válido com DDD.' : 'Digite uma chave Pix válida.';
  }
  const value = String(data.amount || '').replace(',', '.');
  if (value && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0)) errors.amount = 'Informe um valor maior que zero.';
  if (data.txid && !/^[A-Za-z0-9]{1,25}$/.test(data.txid)) errors.txid = 'Use até 25 letras ou números.';
  return errors;
}
