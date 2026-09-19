import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const sizes = { '10x15': [10, 15], a5: [14.8, 21], a4: [21, 29.7], square: [15, 15] };

async function render(element) {
  return html2canvas(element, { scale: 3, backgroundColor: null, useCORS: true });
}

export async function downloadPng(element) {
  const canvas = await render(element);
  const link = document.createElement('a');
  link.download = 'placa-pix.png'; link.href = canvas.toDataURL('image/png'); link.click();
}

export async function downloadPdf(element, size, custom) {
  const [width, height] = size === 'custom' ? custom : sizes[size];
  const canvas = await render(element);
  const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'cm', format: [width, height] });
  const ratio = Math.min(width / canvas.width, height / canvas.height);
  const w = canvas.width * ratio, h = canvas.height * ratio;
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (width - w) / 2, (height - h) / 2, w, h);
  pdf.save('placa-pix.pdf');
}
