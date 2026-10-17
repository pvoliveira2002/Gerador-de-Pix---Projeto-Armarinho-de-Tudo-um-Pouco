import './styles.css';
import QRCode from 'qrcode';
import { appTemplate } from './ui/template.js';
import { generatePixPayload } from './pix/payload.js';
import { detectPixKeyType, validateKey, validatePixForm } from './pix/validators.js';
import { formatPixKey, normalizeKey } from './pix/normalize.js';
import { QrCropModal } from './components/QrCropModal.js';
import { TemplateGallery } from './components/TemplateGallery.js';
import { applyTemplate, renderPixData } from './components/TemplateRenderer.js';
import { TEMPLATE_CONFIGS, getTemplateConfig } from './templates/config.js';
import { CARD_SIZE_PRESETS, DEFAULT_PRINT_SETTINGS, PAPER_SIZES, calculateCardPosition, validatePrintSettings } from './print/printSettings.js';
import { calculateLayoutFromPrintSettings } from './print/calculateA4Layout.js';

document.querySelector('#app').innerHTML = appTemplate();
const $ = (selector) => document.querySelector(selector);
let currentPayload = '';
const pixData = { name: '', displayName: '', bank: '', key: '', keyType: '', amount: '' };
const qrState = { originalQrImage: null, croppedQrImage: null, activeQrCode: null };
const printSettings = { ...DEFAULT_PRINT_SETTINGS };
const cutLineSettings = { enabled: true, style: 'dotted', offsetMm: 5, color: '#555555', strokeWidth: 1 };
let previewMode = 'card';
let activeStep = 1;
let highestUnlockedStep = 1;
let lastJob = null;
let manualKeyType = false;
const STORAGE_KEY = 'gerador-pix-preferencias-v1';
const PROFILE_KEY = 'gerador-pix-estabelecimento-v1';

function readLocal(key, fallback = {}) { try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return { ...fallback }; } }
function writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Não foi possível salvar as preferências neste dispositivo.'); } }
let businessProfile = readLocal(PROFILE_KEY, { name: '', bank: '', city: '', primary: '#0a7a41', secondary: '#f4cc12', logo: '', templateId: 'simple', sizePreset: '10x15' });

function inferKeyType(value) {
  return detectPixKeyType(value);
}
function parseAmount(value) { const raw = String(value || '').trim(); return raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/[^\d.]/g, ''); }

const KEY_TYPE_LABELS = { cpf: 'CPF', cnpj: 'CNPJ', phone: 'Celular', email: 'E-mail', random: 'Chave aleatória' };
function updateKeyDetection() {
  const keyInput = $('#pix-form').elements.key;
  const typeSelect = $('#pix-form').elements.keyType;
  const message = $('#key-detection');
  const value = keyInput.value.trim();
  const detected = manualKeyType ? typeSelect.value : detectPixKeyType(value);
  message.classList.remove('valid', 'invalid');
  if (!value) { message.textContent = 'Digite a chave para identificação automática.'; if (!manualKeyType) typeSelect.value = ''; return; }
  if (!manualKeyType) typeSelect.value = detected || '';
  if (!detected) { message.textContent = 'Não foi possível identificar. Confira a chave ou escolha o tipo manualmente.'; message.classList.add('invalid'); return; }
  if (!validateKey(detected, value)) { message.textContent = `Formato reconhecido como ${KEY_TYPE_LABELS[detected]}, mas a chave parece inválida.`; message.classList.add('invalid'); return; }
  message.textContent = `${manualKeyType ? 'Tipo escolhido' : 'Tipo identificado'}: ${KEY_TYPE_LABELS[detected]} • Será usado: ${normalizeKey(detected, value)}`;
  message.classList.add('valid');
}

function productionPreferences() {
  return { printSettings: { ...printSettings }, cutLineSettings: { ...cutLineSettings }, templateId: templateGallery?.selectedId || 'simple', quickMode: $('#quick-mode')?.checked || false };
}
function saveProductionPreferences() { writeLocal(STORAGE_KEY, productionPreferences()); }

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
const qrCropModal = new QrCropModal({
  onMessage: toast,
  onConfirm: ({ croppedUrl, originalQrImage }) => {
    qrState.originalQrImage = originalQrImage;
    qrState.croppedQrImage = croppedUrl;
    qrState.activeQrCode = { type: 'imported', image: croppedUrl };
    $('#uploaded-qr').src = croppedUrl;
    $('#cropped-qr-thumb').src = croppedUrl;
    $('#cropped-qr-summary').hidden = false;
    $('#uploaded-qr').hidden = false; $('#qr-canvas').hidden = true; $('#qr-placeholder').hidden = true;
    setPlateData({ name: $('#upload-name').value, bank: $('#upload-bank').value, key: $('#upload-key').value, keyType: 'random' });
    templateGallery.render();
    showEditor(); toast('Recorte aplicado à placa.');
  },
});
const templateGallery = new TemplateGallery({
  container: $('#template-gallery'),
  templates: TEMPLATE_CONFIGS,
  sourcePlate: $('#plate'),
  getQrImage: () => {
    if (qrState.activeQrCode?.type === 'imported') return qrState.croppedQrImage;
    if (qrState.activeQrCode?.type === 'generated' && !$('#qr-canvas').hidden) return $('#qr-canvas').toDataURL('image/png');
    return '';
  },
  onSelect: (id) => {
    applyTemplate($('#plate'), getTemplateConfig(id));
    refreshPaperPreview();
    unlockStep(3);
    saveProductionPreferences();
    toast('Modelo selecionado.');
  },
});
applyTemplate($('#plate'), getTemplateConfig('simple'));
templateGallery.render();
function goToStep(step) {
  if (step > highestUnlockedStep) return;
  activeStep = step;
  document.querySelectorAll('[data-stage]').forEach((panel) => { panel.hidden = Number(panel.dataset.stage) !== step; panel.classList.toggle('active', Number(panel.dataset.stage) === step); });
  $('.form-panel').hidden = step !== 1;
  $('#editor').hidden = step === 1;
  document.querySelectorAll('.step-item').forEach((item) => {
    const itemStep = Number(item.dataset.stepTarget);
    item.disabled = itemStep > highestUnlockedStep;
    item.classList.toggle('active', itemStep === step);
    item.classList.toggle('completed', itemStep < step || itemStep < highestUnlockedStep);
  });
}
function unlockStep(step) {
  highestUnlockedStep = Math.max(highestUnlockedStep, step);
  $('#step1-continue').disabled = false;
  goToStep(activeStep);
}
function updateActionAvailability() {
  const ready = Boolean(qrState.activeQrCode);
  document.querySelectorAll('#action-png,#action-pdf,#action-pdf-a4,#action-print-a4').forEach((button) => { button.disabled = !ready; });
  $('#action-copy').disabled = qrState.activeQrCode?.type !== 'generated' || !currentPayload;
  $('.download-menu').classList.toggle('unavailable', !ready); if (!ready) $('.download-menu').removeAttribute('open');
}
function showEditor() { unlockStep(2); updateActionAvailability(); $('#status-pill').textContent = 'Pronto'; $('#status-pill').classList.add('ready'); }
function setPlateData(data) {
  Object.assign(pixData, { name: '', displayName: '', bank: '', key: '', keyType: '', amount: '' }, data);
  renderPixData($('#plate'), pixData);
  refreshPaperPreview();
}

function getActiveQrImage() {
  if (qrState.activeQrCode?.type === 'imported') return qrState.croppedQrImage;
  if (qrState.activeQrCode?.type === 'generated' && !$('#qr-canvas').hidden) return $('#qr-canvas').toDataURL('image/png');
  return '';
}

function createPaperCardClone() {
  const clone = $('#plate').cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  const qrShell = clone.querySelector('.qr-shell');
  const qrImage = getActiveQrImage();
  if (qrImage) qrShell.innerHTML = `<img src="${qrImage}" alt="" />`;
  clone.classList.add('paper-preview-card');
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

function getA4Layout() {
  return calculateLayoutFromPrintSettings({ ...printSettings, cutLineSettings }, PAPER_SIZES.a4);
}

function getOutputSettings() { return { ...printSettings, cutLineSettings: { ...cutLineSettings } }; }

function updateCardCutLinePreview(widthMm) {
  const plate = $('#plate');
  plate.classList.toggle('cut-line-enabled', cutLineSettings.enabled);
  plate.style.setProperty('--cut-line-style', cutLineSettings.style);
  plate.style.setProperty('--cut-line-color', cutLineSettings.color);
  plate.style.setProperty('--cut-line-offset-px', `${Math.max(4, cutLineSettings.offsetMm / widthMm * 390)}px`);
}

function refreshPaperPreview() {
  const baseError = validatePrintSettings(printSettings);
  const layout = getA4Layout();
  const error = baseError || (!layout.itemsPerPage ? 'O tamanho escolhido não cabe na folha A4 considerando a linha de recorte.' : '');
  $('#size-error').textContent = error;
  const physicalItem = layout.positions[0] || calculateCardPosition(printSettings);
  $('#physical-summary').querySelector('strong').textContent = `${physicalItem.widthMm.toLocaleString('pt-BR')} × ${physicalItem.heightMm.toLocaleString('pt-BR')} mm`;
  updateCardCutLinePreview(physicalItem.widthMm);
  $('#auto-orientation-result').textContent = `${printSettings.orientation === 'auto' ? 'Orientação automática' : 'Orientação'}: ${physicalItem.widthMm > physicalItem.heightMm ? 'Paisagem' : 'Retrato'}`;
  const layer = $('#paper-layout-layer');
  layer.replaceChildren();
  const paper = PAPER_SIZES.a4;
  layout.positions.forEach((item) => {
    const placement = { left: item.xMm / paper.widthMm * 100, top: item.yMm / paper.heightMm * 100, width: item.widthMm / paper.widthMm * 100, height: item.heightMm / paper.heightMm * 100 };
    const slot = document.createElement('div');
    slot.className = 'paper-card-slot';
    Object.assign(slot.style, { left: `${placement.left}%`, top: `${placement.top}%`, width: `${placement.width}%`, height: `${placement.height}%` });
    const cardClone = createPaperCardClone();
    cardClone.style.setProperty('--paper-rotation', `${item.rotation || 0}deg`);
    slot.append(cardClone);
    layer.append(slot);
    if (cutLineSettings.enabled) {
      const cutLine = document.createElement('div');
      cutLine.className = 'preview-cut-line';
      Object.assign(cutLine.style, { left: `${item.cutLineXmm / paper.widthMm * 100}%`, top: `${item.cutLineYmm / paper.heightMm * 100}%`, width: `${item.cutLineWidthMm / paper.widthMm * 100}%`, height: `${item.cutLineHeightMm / paper.heightMm * 100}%`, borderStyle: cutLineSettings.style, borderColor: cutLineSettings.color });
      layer.append(cutLine);
    }
    if (printSettings.showCropMarks) {
      const marks = document.createElement('div');
      marks.className = 'preview-crop-marks';
      const markBox = cutLineSettings.enabled ? { left: item.cutLineXmm / paper.widthMm * 100, top: item.cutLineYmm / paper.heightMm * 100, width: item.cutLineWidthMm / paper.widthMm * 100, height: item.cutLineHeightMm / paper.heightMm * 100 } : placement;
      Object.assign(marks.style, { left: `${markBox.left}%`, top: `${markBox.top}%`, width: `${markBox.width}%`, height: `${markBox.height}%` });
      const markGap = Math.min(1, printSettings.gapMm / 4);
      const markLength = Math.min(3, Math.max(0.5, printSettings.gapMm / 2 - markGap));
      marks.style.setProperty('--crop-x-gap', `${markGap / item.widthMm * 100}%`);
      marks.style.setProperty('--crop-x-length', `${markLength / item.widthMm * 100}%`);
      marks.style.setProperty('--crop-y-gap', `${markGap / item.heightMm * 100}%`);
      marks.style.setProperty('--crop-y-length', `${markLength / item.heightMm * 100}%`);
      marks.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
      layer.append(marks);
    }
  });
  const distribution = layout.pages.map((page) => `Folha ${page.pageNumber}: ${page.count}`).join(' • ');
  const copyLabel = layout.quantity === 1 ? '1 cópia' : `${layout.quantity} cópias`;
  const cutLabel = cutLineSettings.enabled ? `Linha ${cutLineSettings.offsetMm.toLocaleString('pt-BR')} mm` : 'Sem linha de recorte';
  $('#operational-summary').innerHTML = `<span>${(physicalItem.widthMm / 10).toLocaleString('pt-BR')} × ${(physicalItem.heightMm / 10).toLocaleString('pt-BR')} cm</span><i></i><span>${copyLabel}</span><i></i><span>A4</span><i></i><span>${cutLabel}</span>`;
  $('#layout-result').querySelector('strong').textContent = printSettings.quantityMode === 'fill' ? `Máximo: ${layout.itemsPerPage} cópias` : `${copyLabel} • ${layout.pageCount} ${layout.pageCount === 1 ? 'folha A4' : 'folhas A4'}`;
  $('#layout-result').querySelector('small').textContent = `${distribution || 'O tamanho não cabe na folha'}${layout.orientationUsed === 'rotated' ? ' • Placas giradas para melhor aproveitamento' : ''}`;
  requestAnimationFrame(() => {
    layer.querySelectorAll('.paper-card-slot').forEach((slot) => {
      const clone = slot.querySelector('.paper-preview-card');
      if (!clone || !slot.clientWidth) return;
      const rotated = clone.style.getPropertyValue('--paper-rotation') === '90deg';
      const visualWidth = rotated ? clone.scrollHeight : 390;
      const visualHeight = rotated ? 390 : clone.scrollHeight;
      const scale = Math.min(slot.clientWidth / visualWidth, slot.clientHeight / visualHeight);
      clone.style.setProperty('--paper-scale', String(scale));
    });
  });
  document.querySelectorAll('#action-png,#action-pdf,#action-pdf-a4,#action-print-a4').forEach((button) => { button.disabled = Boolean(error) || !layout.itemsPerPage || !qrState.activeQrCode; });
}

function setPreviewMode(mode) {
  previewMode = mode;
  $('#card-preview-host').hidden = mode !== 'card';
  $('#paper-preview-host').hidden = mode !== 'paper';
  document.querySelectorAll('[data-preview-mode]').forEach((button) => button.classList.toggle('active', button.dataset.previewMode === mode));
  if (mode === 'paper') refreshPaperPreview();
}

function parseCentimeters(value) { return Number(String(value).trim().replace(',', '.')); }

function updatePrintSettings() {
  const error = validatePrintSettings(printSettings);
  refreshPaperPreview();
  if (!error) unlockStep(4);
}

document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.mode').forEach((b) => b.classList.toggle('active', b === button));
  const generate = button.dataset.mode === 'generate';
  $('#generate-form').hidden = !generate; $('#upload-form').hidden = generate;
}));

$('#pix-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  data.amount = parseAmount(data.amount);
  if (!manualKeyType) data.keyType = inferKeyType(data.key) || '';
  if ($('#quick-mode').checked && !data.city && businessProfile.city) data.city = businessProfile.city;
  event.currentTarget.elements.keyType.value = data.keyType;
  if (data.city) event.currentTarget.elements.city.value = data.city;
  document.querySelectorAll('.error').forEach((el) => { el.textContent = ''; el.closest('label')?.classList.remove('invalid'); });
  const errors = validatePixForm(data);
  Object.entries(errors).forEach(([field, message]) => { const el = document.querySelector(`[data-error="${field}"]`); if (el) { el.textContent = message; el.closest('label').classList.add('invalid'); } });
  if (Object.keys(errors).length) return;
  currentPayload = generatePixPayload(data);
  await QRCode.toCanvas($('#qr-canvas'), currentPayload, { width: 220, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#101828', light: '#ffffff' } });
  qrState.activeQrCode = { type: 'generated', payload: currentPayload };
  $('#qr-placeholder').hidden = true; $('#uploaded-qr').hidden = true; $('#qr-canvas').hidden = false;
  $('#payload').value = currentPayload; $('#payload-result').hidden = false;
  setPlateData(data); templateGallery.render(); showEditor(); toast('QR Code Pix gerado com sucesso.');
});

$('#pix-form').elements.key.addEventListener('input', updateKeyDetection);
$('#pix-form').elements.key.addEventListener('blur', (event) => { const type = manualKeyType ? $('#pix-form').elements.keyType.value : detectPixKeyType(event.target.value); if (type && validateKey(type, event.target.value)) { event.target.value = formatPixKey(type, event.target.value); updateKeyDetection(); } });
$('#pix-form').elements.keyType.addEventListener('change', updateKeyDetection);
$('#pix-form').elements.amount.addEventListener('blur', (event) => { const raw = parseAmount(event.target.value); if (raw && Number(raw) > 0) event.target.value = Number(raw).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });
$('#choose-key-type').addEventListener('click', () => {
  manualKeyType = $('#key-type-field').hidden;
  $('#key-type-field').hidden = !manualKeyType;
  $('#choose-key-type').textContent = manualKeyType ? 'Usar identificação automática' : 'Escolher tipo manualmente';
  if (!manualKeyType) $('#pix-form').elements.keyType.value = '';
  updateKeyDetection();
  if (manualKeyType) $('#pix-form').elements.keyType.focus();
});

function captureCurrentJob() {
  if (!qrState.activeQrCode) return;
  lastJob = { mode: qrState.activeQrCode.type, form: Object.fromEntries(new FormData($('#pix-form'))), upload: { name: $('#upload-name').value, bank: $('#upload-bank').value, key: $('#upload-key').value }, payload: currentPayload, originalQrImage: qrState.originalQrImage, croppedQrImage: qrState.croppedQrImage };
  $('#repeat-last').disabled = false;
}

function applyBusinessDefaults() {
  const form = $('#pix-form');
  if (businessProfile.name) form.elements.name.value = businessProfile.name;
  if (businessProfile.bank) form.elements.bank.value = businessProfile.bank;
  if (businessProfile.city) form.elements.city.value = businessProfile.city;
}

function resetApplication({ preserveProduction = true, remember = true } = {}) {
  if (remember) captureCurrentJob();
  $('#pix-form').reset();
  manualKeyType = false; $('#key-type-field').hidden = true; $('#choose-key-type').textContent = 'Escolher tipo manualmente'; updateKeyDetection();
  $('#upload-name').value = ''; $('#upload-bank').value = ''; $('#upload-key').value = ''; $('#logo-upload').value = ''; $('#qr-upload').value = '';
  currentPayload = ''; qrState.originalQrImage = null; qrState.croppedQrImage = null; qrState.activeQrCode = null; highestUnlockedStep = 1; activeStep = 1;
  $('#payload-result').hidden = true; $('#cropped-qr-summary').hidden = true; $('#cropped-qr-thumb').removeAttribute('src'); $('#qr-canvas').hidden = true; $('#uploaded-qr').hidden = true; $('#uploaded-qr').removeAttribute('src'); $('#qr-placeholder').hidden = false;
  $('#plate').querySelector('.logo-slot').hidden = true; $('#plate').querySelector('.logo-slot').innerHTML = '';
  $('#status-pill').textContent = 'Aguardando dados'; $('#status-pill').classList.remove('ready'); $('#step1-continue').disabled = true;
  document.querySelectorAll('#action-copy,#action-png,#action-pdf,#action-pdf-a4,#action-print-a4').forEach((button) => { button.disabled = true; });
  updateActionAvailability();
  Object.assign(pixData, { name: '', displayName: '', bank: '', key: '', keyType: '', amount: '' });
  setPlateData({});
  if (!preserveProduction) {
    Object.assign(printSettings, DEFAULT_PRINT_SETTINGS); Object.assign(cutLineSettings, { enabled: true, style: 'dotted', offsetMm: 5, color: '#555555', strokeWidth: 1 });
    localStorage.removeItem(STORAGE_KEY); applyTemplate($('#plate'), getTemplateConfig('simple')); templateGallery.selectedId = 'simple';
    $('#print-quantity').value = '1'; $('#print-gap').value = '5'; $('#show-crop-marks').checked = true; $('#show-cut-line').checked = true; $('#cut-line-style').value = 'dotted'; $('#cut-line-offset').value = '5'; $('#custom-cut-offset').hidden = true;
    document.querySelector('[name="card-orientation"][value="auto"]').checked = true; document.querySelectorAll('[data-size]').forEach((item) => item.classList.toggle('selected', item.dataset.size === '10x15')); setQuickMode(true);
  }
  templateGallery.render(); applyBusinessDefaults(); goToStep(1); refreshPaperPreview();
  requestAnimationFrame(() => $('#pix-form').elements.name.focus());
  toast(preserveProduction ? 'Novo atendimento pronto.' : 'Aplicativo restaurado.');
}
$('#clear').addEventListener('click', () => resetApplication({ remember: false }));

async function copyPayload() { if (!currentPayload) return toast('Gere um Pix primeiro.'); await navigator.clipboard.writeText(currentPayload); toast('Pix Copia e Cola copiado.'); }
$('#copy-payload').addEventListener('click', copyPayload);

function loadQr(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return toast('Selecione uma imagem PNG, JPG ou WEBP.');
  qrCropModal.open(file).catch(() => toast('Não foi possível abrir esta imagem.'));
}
$('#qr-upload').addEventListener('change', (e) => { loadQr(e.target.files[0]); e.target.value = ''; });
['dragover', 'drop'].forEach((type) => $('#dropzone').addEventListener(type, (e) => { e.preventDefault(); if (type === 'drop') loadQr(e.dataTransfer.files[0]); }));
$('#recrop-qr').addEventListener('click', () => qrCropModal.open(qrState.originalQrImage).catch(() => toast('Não foi possível reabrir esta imagem.')));
$('#replace-qr').addEventListener('click', () => $('#qr-upload').click());
['upload-name', 'upload-bank', 'upload-key'].forEach((id) => $(`#${id}`).addEventListener('input', () => setPlateData({ name: $('#upload-name').value, bank: $('#upload-bank').value, key: $('#upload-key').value, keyType: 'random' })));

document.querySelectorAll('.step-item').forEach((button) => button.addEventListener('click', () => goToStep(Number(button.dataset.stepTarget))));
document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => { const next = Number(button.dataset.next); unlockStep(next); goToStep(next); }));
document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => goToStep(Number(button.dataset.back))));
document.querySelectorAll('[data-preview-mode]').forEach((button) => button.addEventListener('click', () => setPreviewMode(button.dataset.previewMode)));
document.querySelectorAll('[data-size]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-size]').forEach((item) => item.classList.toggle('selected', item === button));
  const preset = CARD_SIZE_PRESETS.find((item) => item.id === button.dataset.size);
  $('#custom-dimensions').hidden = preset.id !== 'custom';
  if (preset.id !== 'custom') { printSettings.cardWidthMm = preset.widthMm; printSettings.cardHeightMm = preset.heightMm; }
  else { printSettings.cardWidthMm = parseCentimeters($('#card-width-cm').value) * 10; printSettings.cardHeightMm = parseCentimeters($('#card-height-cm').value) * 10; }
  updatePrintSettings(); saveProductionPreferences();
}));
['card-width-cm', 'card-height-cm'].forEach((id) => $(`#${id}`).addEventListener('input', () => {
  printSettings.cardWidthMm = parseCentimeters($('#card-width-cm').value) * 10;
  printSettings.cardHeightMm = parseCentimeters($('#card-height-cm').value) * 10;
  updatePrintSettings();
}));
document.querySelectorAll('[name="card-orientation"]').forEach((input) => input.addEventListener('change', () => { printSettings.orientation = input.value; updatePrintSettings(); }));
$('#show-crop-marks').addEventListener('change', (event) => { printSettings.showCropMarks = event.target.checked; refreshPaperPreview(); });
$('#show-cut-line').addEventListener('change', (event) => { cutLineSettings.enabled = event.target.checked; refreshPaperPreview(); });
$('#cut-line-style').addEventListener('change', (event) => { cutLineSettings.style = event.target.value; refreshPaperPreview(); });
$('#cut-line-offset').addEventListener('change', (event) => {
  $('#custom-cut-offset').hidden = event.target.value !== 'custom';
  if (event.target.value !== 'custom') cutLineSettings.offsetMm = Number(event.target.value);
  else cutLineSettings.offsetMm = parseCentimeters($('#cut-line-custom-mm').value);
  refreshPaperPreview();
});
$('#cut-line-custom-mm').addEventListener('change', (event) => { cutLineSettings.offsetMm = Math.max(0, Math.min(20, parseCentimeters(event.target.value) || 0)); event.target.value = cutLineSettings.offsetMm; refreshPaperPreview(); });
document.querySelectorAll('[data-quantity-mode]').forEach((button) => button.addEventListener('click', () => {
  printSettings.quantityMode = button.dataset.quantityMode;
  document.querySelectorAll('[data-quantity-mode]').forEach((item) => item.classList.toggle('selected', item === button));
  $('#quantity-settings').classList.toggle('fill-mode', printSettings.quantityMode === 'fill');
  refreshPaperPreview(); saveProductionPreferences();
}));
$('#print-quantity').addEventListener('change', (event) => { printSettings.quantity = Math.max(1, Math.min(100, Math.floor(Number(event.target.value) || 1))); event.target.value = printSettings.quantity; refreshPaperPreview(); });
$('#print-gap').addEventListener('change', (event) => { printSettings.gapMm = Math.max(0, Math.min(30, Number(event.target.value) || 0)); event.target.value = printSettings.gapMm; refreshPaperPreview(); });
document.querySelectorAll('[data-toggle]').forEach((input) => input.addEventListener('change', () => { $('#plate').querySelector(`.${input.dataset.toggle}`).hidden = !input.checked; refreshPaperPreview(); }));
[['primary-color','--primary'],['secondary-color','--secondary'],['background-color','--plate-bg'],['text-color','--plate-text']].forEach(([id, prop]) => $(`#${id}`).addEventListener('input', (e) => { $('#plate').style.setProperty(prop, e.target.value); refreshPaperPreview(); }));
$('#qr-size').addEventListener('input', (e) => { $('#plate').style.setProperty('--qr-size', `${e.target.value}px`); refreshPaperPreview(); });
$('#radius').addEventListener('input', (e) => { $('#plate').style.setProperty('--radius', `${e.target.value}px`); refreshPaperPreview(); });
$('#logo-upload').addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const logoSlot = $('#plate').querySelector('.logo-slot'); logoSlot.innerHTML = `<img src="${reader.result}" alt="Logo" />`; logoSlot.hidden = false; refreshPaperPreview(); }; reader.readAsDataURL(file); });
$('#action-copy').addEventListener('click', copyPayload);
async function runExport(button, label, task) {
  const original = button.innerHTML; const status = $('#status-pill'); const previousStatus = status.textContent;
  button.disabled = true; button.textContent = 'Gerando…'; status.textContent = 'Gerando…'; status.classList.add('working');
  try { await task(); toast(label); } catch (error) { console.error(error); toast('Não foi possível concluir a exportação.'); }
  finally { button.innerHTML = original; status.textContent = previousStatus; status.classList.remove('working'); button.closest('details')?.removeAttribute('open'); updateActionAvailability(); refreshPaperPreview(); }
}
$('#action-png').addEventListener('click', () => runExport($('#action-png'), 'PNG gerado em 300 DPI.', async () => { const { downloadPng } = await import('./export/exporter.js'); await downloadPng($('#plate'), getOutputSettings()); }));
$('#action-pdf').addEventListener('click', () => runExport($('#action-pdf'), 'PDF da placa gerado.', async () => { const { downloadPdf } = await import('./export/exporter.js'); await downloadPdf($('#plate'), getOutputSettings()); }));
$('#action-pdf-a4').addEventListener('click', () => { const error = validatePrintSettings(printSettings); if (error) return toast(error); return runExport($('#action-pdf-a4'), 'PDF A4 gerado.', async () => { const { downloadA4Pdf } = await import('./export/exporter.js'); await downloadA4Pdf($('#plate'), getOutputSettings()); }); });
$('#action-print-a4').addEventListener('click', () => { const error = validatePrintSettings(printSettings); if (error) return toast(error); const printWindow = window.open('about:blank', '_blank'); if (!printWindow) return toast('Permita pop-ups para abrir a impressão A4.'); printWindow.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Preparando a folha A4…</p>'; $('#print-hint').hidden = false; return runExport($('#action-print-a4'), 'Use Tamanho real / 100% na impressão.', async () => { const { printA4 } = await import('./export/exporter.js'); await printA4($('#plate'), getOutputSettings(), printWindow); }); });
$('#new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = false; });
$('#cancel-new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = true; });
$('#confirm-new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = true; resetApplication(); });
$('#reset-everything').addEventListener('click', () => { $('#new-pix-dialog').hidden = true; resetApplication({ preserveProduction: false }); });

function setQuickMode(enabled) {
  $('#quick-mode').checked = enabled; $('#pix-form').classList.toggle('quick-mode', enabled);
  document.querySelectorAll('[data-form-mode]').forEach((button) => button.classList.toggle('active', (button.dataset.formMode === 'quick') === enabled));
  for (const name of ['displayName', 'description', 'txid']) $('#pix-form').elements[name].closest('label').hidden = enabled;
  $('#pix-form').elements.keyType.closest('label').hidden = enabled || !manualKeyType;
  $('#pix-form').elements.city.closest('label').hidden = enabled && Boolean(businessProfile.city);
  saveProductionPreferences();
}
$('#quick-mode').addEventListener('change', (event) => setQuickMode(event.target.checked));
document.querySelectorAll('[data-form-mode]').forEach((button) => button.addEventListener('click', () => setQuickMode(button.dataset.formMode === 'quick')));

$('#repeat-last').addEventListener('click', async () => {
  if (!lastJob) return;
  if (lastJob.mode === 'generated') {
    document.querySelector('[data-mode="generate"]').click();
    Object.entries(lastJob.form).forEach(([name, value]) => { if ($('#pix-form').elements[name]) $('#pix-form').elements[name].value = value; });
    await $('#pix-form').requestSubmit();
  } else if (lastJob.croppedQrImage) {
    document.querySelector('[data-mode="upload"]').click();
    qrState.originalQrImage = lastJob.originalQrImage; qrState.croppedQrImage = lastJob.croppedQrImage; qrState.activeQrCode = { type: 'imported', image: lastJob.croppedQrImage };
    $('#upload-name').value = lastJob.upload.name; $('#upload-bank').value = lastJob.upload.bank; $('#upload-key').value = lastJob.upload.key;
    $('#uploaded-qr').src = lastJob.croppedQrImage; $('#cropped-qr-thumb').src = lastJob.croppedQrImage; $('#uploaded-qr').hidden = false; $('#qr-placeholder').hidden = true; $('#cropped-qr-summary').hidden = false;
    setPlateData({ ...lastJob.upload, keyType: 'random' }); showEditor();
  }
  toast('Atendimento anterior recuperado.');
});

function openBusinessSettings() {
  const form = $('#business-form'); for (const name of ['name', 'bank', 'city', 'primary', 'secondary', 'templateId', 'sizePreset']) form.elements[name].value = businessProfile[name] || form.elements[name].value;
  const preview = $('#profile-logo-preview'); preview.innerHTML = businessProfile.logo ? `<img src="${businessProfile.logo}" alt="Logo atual" />` : 'LOJA';
  $('#business-dialog').hidden = false; requestAnimationFrame(() => form.elements.name.focus());
}
$('#business-settings').addEventListener('click', openBusinessSettings);
$('#cancel-business').addEventListener('click', () => { $('#business-dialog').hidden = true; });
$('#clear-business').addEventListener('click', () => { localStorage.removeItem(PROFILE_KEY); businessProfile = { name: '', bank: '', city: '', primary: '#0a7a41', secondary: '#f4cc12', logo: '', templateId: 'simple', sizePreset: '10x15' }; $('#business-form').reset(); $('#profile-logo-preview').textContent = 'LOJA'; toast('Perfil restaurado.'); });
$('#business-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const file = event.currentTarget.elements.logo.files[0];
  if (file && file.size > 2 * 1024 * 1024) return toast('Use uma logo de até 2 MB.');
  if (file) data.logo = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); else data.logo = businessProfile.logo;
  businessProfile = { ...businessProfile, ...data }; writeLocal(PROFILE_KEY, businessProfile); $('#business-dialog').hidden = true; applyBusinessDefaults();
  $('#primary-color').value = businessProfile.primary; $('#secondary-color').value = businessProfile.secondary; $('#primary-color').dispatchEvent(new Event('input')); $('#secondary-color').dispatchEvent(new Event('input'));
  if (businessProfile.logo) { const logo = $('#plate').querySelector('.logo-slot'); logo.innerHTML = `<img src="${businessProfile.logo}" alt="Logo" />`; logo.hidden = false; refreshPaperPreview(); }
  const preset = CARD_SIZE_PRESETS.find((item) => item.id === businessProfile.sizePreset);
  if (preset) {
    printSettings.cardWidthMm = preset.widthMm; printSettings.cardHeightMm = preset.heightMm;
    document.querySelectorAll('[data-size]').forEach((item) => item.classList.toggle('selected', item.dataset.size === preset.id));
    $('#custom-dimensions').hidden = true; $('#card-width-cm').value = preset.widthMm / 10; $('#card-height-cm').value = preset.heightMm / 10;
  }
  templateGallery.selectedId = businessProfile.templateId; applyTemplate($('#plate'), getTemplateConfig(businessProfile.templateId)); templateGallery.render(); saveProductionPreferences(); refreshPaperPreview();
  toast('Dados fixos salvos neste dispositivo.');
});

$('#business-form').elements.logo.addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('#profile-logo-preview').innerHTML = `<img src="${reader.result}" alt="Nova logo" />`; }; reader.readAsDataURL(file); });

$('#expand-preview').addEventListener('click', () => { const host = $('#expanded-preview-host'); host.replaceChildren(createPaperCardClone()); $('#preview-dialog').hidden = false; });
$('#close-preview').addEventListener('click', () => { $('#preview-dialog').hidden = true; $('#expanded-preview-host').replaceChildren(); });
$('#preview-dialog').addEventListener('click', (event) => { if (event.target === $('#preview-dialog')) $('#close-preview').click(); });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { $('#new-pix-dialog').hidden = true; $('#business-dialog').hidden = true; $('#preview-dialog').hidden = true; $('#expanded-preview-host').replaceChildren(); document.querySelectorAll('.download-menu[open]').forEach((menu) => menu.removeAttribute('open')); }
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'n') { event.preventDefault(); $('#new-pix').click(); }
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p') { event.preventDefault(); if (!$('#action-pdf-a4').disabled) $('#action-pdf-a4').click(); }
  if (event.ctrlKey && !event.shiftKey && event.key === 'Enter') { event.preventDefault(); document.querySelector('[data-mode="generate"]').click(); $('#pix-form').requestSubmit(); }
});

function restoreProductionPreferences() {
  const saved = readLocal(STORAGE_KEY);
  if (saved.printSettings) Object.assign(printSettings, saved.printSettings);
  if (saved.cutLineSettings) Object.assign(cutLineSettings, saved.cutLineSettings);
  const templateId = saved.templateId || 'simple'; templateGallery.selectedId = templateId; applyTemplate($('#plate'), getTemplateConfig(templateId)); templateGallery.render();
  $('#print-quantity').value = printSettings.quantity; $('#print-gap').value = printSettings.gapMm;
  const selectedPreset = CARD_SIZE_PRESETS.find((item) => item.widthMm === printSettings.cardWidthMm && item.heightMm === printSettings.cardHeightMm)?.id || 'custom';
  document.querySelectorAll('[data-size]').forEach((item) => item.classList.toggle('selected', item.dataset.size === selectedPreset)); $('#custom-dimensions').hidden = selectedPreset !== 'custom';
  $('#card-width-cm').value = printSettings.cardWidthMm / 10; $('#card-height-cm').value = printSettings.cardHeightMm / 10;
  const orientationInput = document.querySelector(`[name="card-orientation"][value="${printSettings.orientation}"]`); if (orientationInput) orientationInput.checked = true;
  $('#show-crop-marks').checked = printSettings.showCropMarks; $('#show-cut-line').checked = cutLineSettings.enabled; $('#cut-line-style').value = cutLineSettings.style;
  const standardOffset = [3, 5].includes(cutLineSettings.offsetMm); $('#cut-line-offset').value = standardOffset ? String(cutLineSettings.offsetMm) : 'custom'; $('#custom-cut-offset').hidden = standardOffset; $('#cut-line-custom-mm').value = cutLineSettings.offsetMm;
  setQuickMode(saved.quickMode !== false); applyBusinessDefaults();
  if (businessProfile.primary) { $('#primary-color').value = businessProfile.primary; $('#plate').style.setProperty('--primary', businessProfile.primary); }
  if (businessProfile.secondary) { $('#secondary-color').value = businessProfile.secondary; $('#plate').style.setProperty('--secondary', businessProfile.secondary); }
  if (businessProfile.logo) { const logo = $('#plate').querySelector('.logo-slot'); logo.innerHTML = `<img src="${businessProfile.logo}" alt="Logo" />`; logo.hidden = false; }
  refreshPaperPreview();
}

document.addEventListener('change', (event) => { if (event.target.matches('[data-size],[name="card-orientation"],#show-crop-marks,#show-cut-line,#cut-line-style,#cut-line-offset,[data-quantity-mode]')) saveProductionPreferences(); });
document.addEventListener('input', (event) => { if (event.target.matches('#print-quantity,#print-gap,#cut-line-custom-mm')) saveProductionPreferences(); });

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  $('#install-app').hidden = false;
});
$('#install-app').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') toast('Aplicativo instalado com sucesso.');
  installPrompt = null;
  $('#install-app').hidden = true;
});
window.addEventListener('appinstalled', () => { $('#install-app').hidden = true; toast('Aplicativo instalado.'); });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => toast('Não foi possível ativar o modo offline.')));
}

restoreProductionPreferences();
