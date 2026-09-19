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
  const digits = onlyDigits(value);
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  return digits.length >= 10 ? `+55${digits}` : value.trim();
}

export function normalizeKey(type, value) {
  const trimmed = value.trim();
  if (type === 'cpf' || type === 'cnpj') return onlyDigits(trimmed);
  if (type === 'phone') return normalizePhone(trimmed);
  if (type === 'email') return trimmed.toLowerCase();
  return trimmed.toLowerCase();
}
