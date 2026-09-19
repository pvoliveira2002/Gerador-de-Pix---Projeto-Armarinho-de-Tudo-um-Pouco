import './styles.css';
import QRCode from 'qrcode';
import { appTemplate } from './ui/template.js';
import { generatePixPayload } from './pix/payload.js';
import { normalizeKey } from './pix/normalize.js';
import { validatePixForm } from './pix/validators.js';
import { QrCropModal } from './components/QrCropModal.js';

document.querySelector('#app').innerHTML = appTemplate();
const $ = (selector) => document.querySelector(selector);
let currentPayload = '';
let activeStep = 1;
let highestUnlockedStep = 1;

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
const qrCropModal = new QrCropModal({
  onMessage: toast,
  onConfirm: ({ croppedUrl }) => {
    $('#uploaded-qr').src = croppedUrl;
    $('#cropped-qr-thumb').src = croppedUrl;
    $('#cropped-qr-summary').hidden = false;
    $('#uploaded-qr').hidden = false; $('#qr-canvas').hidden = true; $('#qr-placeholder').hidden = true;
    setPlateData({ name: $('#upload-name').value, bank: $('#upload-bank').value, key: $('#upload-key').value, keyType: 'random' });
    showEditor(); toast('Recorte aplicado à placa.');
  },
});
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
function showEditor() { unlockStep(2); document.querySelectorAll('.preview-actions button:not(#new-pix)').forEach((button) => { button.disabled = false; }); $('#status-pill').textContent = 'Pronto'; $('#status-pill').classList.add('ready'); }
function setPlateData(data) {
  $('.out-name').textContent = data.name || 'Nome do recebedor';
  $('.out-social').textContent = data.displayName || '';
  $('.out-bank').textContent = data.bank || 'Banco não informado';
  $('.out-key').textContent = data.key ? normalizeKey(data.keyType, data.key) : '';
  $('.out-amount').textContent = data.amount ? `R$ ${Number(String(data.amount).replace(',', '.')).toFixed(2).replace('.', ',')}` : '';
}

document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.mode').forEach((b) => b.classList.toggle('active', b === button));
  const generate = button.dataset.mode === 'generate';
  $('#generate-form').hidden = !generate; $('#upload-form').hidden = generate;
}));

$('#pix-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  document.querySelectorAll('.error').forEach((el) => { el.textContent = ''; el.closest('label')?.classList.remove('invalid'); });
  const errors = validatePixForm(data);
  Object.entries(errors).forEach(([field, message]) => { const el = document.querySelector(`[data-error="${field}"]`); if (el) { el.textContent = message; el.closest('label').classList.add('invalid'); } });
  if (Object.keys(errors).length) return;
  currentPayload = generatePixPayload(data);
  await QRCode.toCanvas($('#qr-canvas'), currentPayload, { width: 220, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#101828', light: '#ffffff' } });
  $('#qr-placeholder').hidden = true; $('#uploaded-qr').hidden = true; $('#qr-canvas').hidden = false;
  $('#payload').value = currentPayload; $('#payload-result').hidden = false;
  setPlateData(data); showEditor(); toast('QR Code Pix gerado com sucesso.');
});

function resetApplication() {
  $('#pix-form').reset();
  $('#upload-name').value = ''; $('#upload-bank').value = ''; $('#upload-key').value = ''; $('#logo-upload').value = ''; $('#qr-upload').value = '';
  currentPayload = ''; highestUnlockedStep = 1; activeStep = 1;
  $('#payload-result').hidden = true; $('#cropped-qr-summary').hidden = true; $('#cropped-qr-thumb').removeAttribute('src'); $('#qr-canvas').hidden = true; $('#uploaded-qr').hidden = true; $('#uploaded-qr').removeAttribute('src'); $('#qr-placeholder').hidden = false;
  $('.logo-slot').hidden = true; $('.logo-slot').innerHTML = '';
  $('#status-pill').textContent = 'Aguardando dados'; $('#status-pill').classList.remove('ready'); $('#step1-continue').disabled = true;
  document.querySelectorAll('.preview-actions button:not(#new-pix)').forEach((button) => { button.disabled = true; });
  setPlateData({}); goToStep(1); toast('Dados apagados.');
}
$('#clear').addEventListener('click', resetApplication);

async function copyPayload() { if (!currentPayload) return toast('Gere um Pix primeiro.'); await navigator.clipboard.writeText(currentPayload); toast('Pix Copia e Cola copiado.'); }
$('#copy-payload').addEventListener('click', copyPayload); $('#copy-bottom').addEventListener('click', copyPayload);

function loadQr(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return toast('Selecione uma imagem PNG, JPG ou WEBP.');
  qrCropModal.open(file).catch(() => toast('Não foi possível abrir esta imagem.'));
}
$('#qr-upload').addEventListener('change', (e) => { loadQr(e.target.files[0]); e.target.value = ''; });
['dragover', 'drop'].forEach((type) => $('#dropzone').addEventListener(type, (e) => { e.preventDefault(); if (type === 'drop') loadQr(e.dataTransfer.files[0]); }));
$('#recrop-qr').addEventListener('click', () => qrCropModal.open().catch(() => toast('Não foi possível reabrir esta imagem.')));
['upload-name', 'upload-bank', 'upload-key'].forEach((id) => $(`#${id}`).addEventListener('input', () => setPlateData({ name: $('#upload-name').value, bank: $('#upload-bank').value, key: $('#upload-key').value, keyType: 'random' })));

document.querySelectorAll('[data-template]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-template]').forEach((b) => b.classList.toggle('selected', b === button)); $('#plate').className = `plate ${button.dataset.template}`; unlockStep(3); toast('Modelo selecionado.'); }));
document.querySelectorAll('.step-item').forEach((button) => button.addEventListener('click', () => goToStep(Number(button.dataset.stepTarget))));
document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => { const next = Number(button.dataset.next); unlockStep(next); goToStep(next); }));
document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => goToStep(Number(button.dataset.back))));
document.querySelectorAll('[data-toggle]').forEach((input) => input.addEventListener('change', () => $(`.${input.dataset.toggle}`).hidden = !input.checked));
[['primary-color','--primary'],['secondary-color','--secondary'],['background-color','--plate-bg'],['text-color','--plate-text']].forEach(([id, prop]) => $(`#${id}`).addEventListener('input', (e) => $('#plate').style.setProperty(prop, e.target.value)));
$('#qr-size').addEventListener('input', (e) => $('#plate').style.setProperty('--qr-size', `${e.target.value}px`));
$('#radius').addEventListener('input', (e) => $('#plate').style.setProperty('--radius', `${e.target.value}px`));
$('#logo-upload').addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $('.logo-slot').innerHTML = `<img src="${reader.result}" alt="Logo" />`; $('.logo-slot').hidden = false; }; reader.readAsDataURL(file); });
$('#art-size').addEventListener('change', (e) => $('#custom-size').hidden = e.target.value !== 'custom');
$('#download-png').addEventListener('click', async () => { const { downloadPng } = await import('./export/exporter.js'); await downloadPng($('#plate')); toast('PNG baixado.'); });
$('#download-pdf').addEventListener('click', async () => { const { downloadPdf } = await import('./export/exporter.js'); await downloadPdf($('#plate'), $('#art-size').value, [Number($('#custom-width').value), Number($('#custom-height').value)]); toast('PDF baixado.'); });
$('#print').addEventListener('click', () => window.print());
$('#action-copy').addEventListener('click', copyPayload);
$('#action-png').addEventListener('click', async () => { const { downloadPng } = await import('./export/exporter.js'); await downloadPng($('#plate')); toast('PNG baixado.'); });
$('#action-pdf').addEventListener('click', async () => { const { downloadPdf } = await import('./export/exporter.js'); await downloadPdf($('#plate'), $('#art-size').value, [Number($('#custom-width').value), Number($('#custom-height').value)]); toast('PDF baixado.'); });
$('#action-print').addEventListener('click', () => window.print());
$('#new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = false; });
$('#cancel-new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = true; });
$('#confirm-new-pix').addEventListener('click', () => { $('#new-pix-dialog').hidden = true; resetApplication(); });

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
