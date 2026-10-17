export const onlyDigits = (value = '') => value.replace(/\D/g, '');

export function normalizeText(value, maxLength) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

export function normalizePhone(value) {
  const raw = String(value || '').trim();
  let digits = onlyDigits(raw);
  if (!digits) return raw;

  // Preserve international numbers already entered in E.164 form.
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;

  // Friendly Brazilian input: country code is optional and a trunk zero is tolerated.
  if (digits.startsWith('55') && digits.length >= 12) {
    let national = digits.slice(2);
    if (national.startsWith('0') && national.length >= 11) national = national.slice(1);
    return `+55${national}`;
  }
  if (digits.startsWith('0') && digits.length >= 11) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return raw;
}

export function normalizeKey(type, value) {
  const trimmed = value.trim();
  if (type === 'cpf') return onlyDigits(trimmed);
  if (type === 'cnpj') return trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (type === 'phone') return normalizePhone(trimmed);
  if (type === 'email') return trimmed.toLowerCase();
  return trimmed.toLowerCase();
}

export function formatPixKey(type, value) {
  const normalized = normalizeKey(type, value);
  if (type === 'cpf' && /^\d{11}$/.test(normalized)) return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (type === 'cnpj' && /^[A-Z0-9]{14}$/.test(normalized)) return normalized.replace(/(.{2})(.{3})(.{3})(.{4})(.{2})/, '$1.$2.$3/$4-$5');
  if (type === 'phone' && /^\+55\d{10,11}$/.test(normalized)) {
    const national = normalized.slice(3); const prefix = national.length === 11 ? 5 : 4;
    return `+55 (${normalized.slice(3, 5)}) ${normalized.slice(5, 5 + prefix)}-${normalized.slice(5 + prefix)}`;
  }
  return normalized;
}
