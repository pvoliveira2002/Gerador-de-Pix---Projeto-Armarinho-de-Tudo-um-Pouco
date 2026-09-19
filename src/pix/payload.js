import { normalizeKey, normalizeText } from './normalize.js';

export const tlv = (id, value) => `${id}${String(new TextEncoder().encode(value).length).padStart(2, '0')}${value}`;

export function crc16(payload) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(payload)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(data) {
  const key = normalizeKey(data.keyType, data.key);
  let merchantAccount = tlv('00', 'br.gov.bcb.pix') + tlv('01', key);
  const description = normalizeText(data.description || '', 72);
  if (description) merchantAccount += tlv('02', description);

  let payload = tlv('00', '01');
  payload += tlv('26', merchantAccount);
  payload += tlv('52', '0000');
  payload += tlv('53', '986');
  const amount = String(data.amount || '').replace(',', '.');
  if (amount) payload += tlv('54', Number(amount).toFixed(2));
  payload += tlv('58', 'BR');
  payload += tlv('59', normalizeText(data.name, 25));
  payload += tlv('60', normalizeText(data.city, 15));
  payload += tlv('62', tlv('05', data.txid ? data.txid.toUpperCase() : '***'));
  const withCrcId = `${payload}6304`;
  return withCrcId + crc16(withCrcId);
}
