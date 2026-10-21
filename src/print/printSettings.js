export const PRINT_DPI = 300;

export const PAPER_SIZES = {
  a4: { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297 },
};

export const CARD_SIZE_PRESETS = [
  { id: '7x10', label: '7 × 10 cm', widthMm: 70, heightMm: 100 },
  { id: '9x13', label: '9 × 13 cm', widthMm: 90, heightMm: 130 },
  { id: '10x15', label: '10 × 15 cm', widthMm: 100, heightMm: 150 },
  { id: '13x18', label: '13 × 18 cm', widthMm: 130, heightMm: 180 },
  { id: '15x20', label: '15 × 20 cm', widthMm: 150, heightMm: 200 },
  { id: 'a5', label: 'A5 — 14,8 × 21 cm', widthMm: 148, heightMm: 210 },
  { id: 'a4', label: 'A4 — 21 × 29,7 cm', widthMm: 210, heightMm: 297 },
  { id: 'custom', label: 'Personalizado', widthMm: null, heightMm: null },
];

export const DEFAULT_PRINT_SETTINGS = {
  paperSize: 'a4',
  cardWidthMm: 100,
  cardHeightMm: 150,
  orientation: 'auto',
  marginMm: 5,
  gapMm: 5,
  quantityMode: 'fixed',
  quantity: 1,
  showCropMarks: true,
};

export const mmToPx = (millimeters, dpi = PRINT_DPI) => Math.round((millimeters / 25.4) * dpi);
export const mmToPoints = (millimeters) => (millimeters / 25.4) * 72;

export function orientCard(widthMm, heightMm, orientation, paper = PAPER_SIZES.a4, marginMm = 5) {
  const portrait = { widthMm: Math.min(widthMm, heightMm), heightMm: Math.max(widthMm, heightMm) };
  const landscape = { widthMm: Math.max(widthMm, heightMm), heightMm: Math.min(widthMm, heightMm) };
  if (orientation === 'portrait') return portrait;
  if (orientation === 'landscape') return landscape;
  if (fitsOnPage({ ...portrait, marginMm }, paper)) return portrait;
  if (fitsOnPage({ ...landscape, marginMm }, paper)) return landscape;
  return portrait;
}

export function fitsOnPage(settings, paper = PAPER_SIZES[settings.paperSize] || PAPER_SIZES.a4) {
  const margin = Number(settings.marginMm ?? 5);
  const width = Number(settings.widthMm ?? settings.cardWidthMm);
  const height = Number(settings.heightMm ?? settings.cardHeightMm);
  return width > 0 && height > 0 && width <= paper.widthMm - margin * 2 && height <= paper.heightMm - margin * 2;
}

export function calculateCardPosition(settings, paper = PAPER_SIZES[settings.paperSize] || PAPER_SIZES.a4) {
  const oriented = orientCard(settings.cardWidthMm, settings.cardHeightMm, settings.orientation, paper, settings.marginMm);
  return {
    ...oriented,
    xMm: (paper.widthMm - oriented.widthMm) / 2,
    yMm: (paper.heightMm - oriented.heightMm) / 2,
  };
}

export function validatePrintSettings(settings) {
  const width = Number(settings.cardWidthMm);
  const height = Number(settings.cardHeightMm);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 'Informe largura e altura maiores que zero.';
  if (width > 210 || height > 297) return 'O tamanho informado é maior que uma folha A4.';
  if ((width === 210 && height === 297) || (width === 297 && height === 210)) return '';
  const oriented = orientCard(width, height, settings.orientation, PAPER_SIZES.a4, settings.marginMm);
  if (!fitsOnPage({ ...oriented, marginMm: settings.marginMm }, PAPER_SIZES.a4)) return 'O tamanho escolhido não cabe na folha A4 com a margem atual.';
  return '';
}
