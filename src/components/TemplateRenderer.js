import { THEME_CONFIGS } from '../templates/config.js';
import { normalizeKey } from '../pix/normalize.js';

export function getPixDisplayData(data = {}) {
  const hasAmount = data.amount !== undefined && data.amount !== null && String(data.amount).trim() !== '';
  return {
    name: String(data.name || '').trim() || 'Nome do recebedor',
    displayName: String(data.displayName || '').trim(),
    bank: String(data.bank || '').trim() || 'Banco',
    key: data.key ? normalizeKey(data.keyType, String(data.key)) : 'Sua chave Pix',
    amount: hasAmount ? `R$ ${Number(String(data.amount).replace(',', '.')).toFixed(2).replace('.', ',')}` : '',
  };
}

export function renderPixData(element, data) {
  const display = getPixDisplayData(data);
  element.querySelector('.out-name').textContent = display.name;
  element.querySelector('.out-social').textContent = display.displayName;
  element.querySelector('.out-bank').textContent = display.bank;
  element.querySelector('.out-key').textContent = display.key;
  element.querySelector('.out-amount').textContent = display.amount;
}

function reorderInformation(container, order) {
  const elements = {
    name: container.querySelector('.out-name'),
    social: container.querySelector('.out-social'),
    bank: container.querySelector('.out-bank'),
    key: container.querySelector('.out-key'),
    amount: container.querySelector('.out-amount'),
  };
  order.forEach((key) => elements[key] && container.append(elements[key]));
  ['social', 'amount'].forEach((key) => elements[key] && container.append(elements[key]));
}

export function applyTemplate(element, templateConfig) {
  const theme = THEME_CONFIGS[templateConfig.theme];
  element.className = `plate ${templateConfig.layout}`;
  element.dataset.template = templateConfig.id;
  element.style.setProperty('--primary', theme.primary);
  element.style.setProperty('--secondary', theme.secondary);
  element.style.setProperty('--plate-bg', theme.background);
  element.style.setProperty('--plate-text', theme.text);
  element.style.setProperty('--radius', `${theme.radius}px`);
  element.style.setProperty('--qr-size', `${templateConfig.qrSize}px`);
  const header = element.querySelector('.plate-header');
  header.hidden = !templateConfig.showHeader;
  header.querySelector('span').textContent = templateConfig.title;
  header.querySelector('small').textContent = templateConfig.subtitle;
  header.querySelector('small').hidden = !templateConfig.subtitle;
  element.querySelector('.scan-text').textContent = templateConfig.instruction;
  const footer = element.querySelector('footer');
  footer.textContent = templateConfig.footer;
  footer.hidden = !templateConfig.showFooter;
  reorderInformation(element.querySelector('.plate-info'), templateConfig.informationOrder);
}

export function createScaledPreview(sourcePlate, templateConfig, qrImageUrl) {
  const clone = sourcePlate.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  applyTemplate(clone, templateConfig);
  const qrShell = clone.querySelector('.qr-shell');
  qrShell.innerHTML = qrImageUrl ? `<img src="${qrImageUrl}" alt="" />` : '<span class="template-qr-placeholder"></span>';
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.add('template-mini-plate');
  return clone;
}
