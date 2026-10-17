export const THEME_CONFIGS = {
  simple: { primary: '#17362a', secondary: '#eef3ef', background: '#ffffff', text: '#16251f', radius: 8 },
  modern: { primary: '#087a40', secondary: '#18ad5d', background: '#ffffff', text: '#102a20', radius: 22 },
  commercial: { primary: '#0a4928', secondary: '#f4cf18', background: '#fffef7', text: '#102a20', radius: 14 },
  green: { primary: '#119c72', secondary: '#76d6b5', background: '#f3fcf8', text: '#12382d', radius: 20 },
  premium: { primary: '#292722', secondary: '#a98b45', background: '#fffdf8', text: '#292722', radius: 4 },
  accessible: { primary: '#111111', secondary: '#f4cf18', background: '#ffffff', text: '#000000', radius: 2 },
};

export const TEMPLATE_CONFIGS = [
  { id: 'simple', name: 'Simples', description: 'Limpo e ideal para impressão', layout: 'simple', qrSize: 180, title: 'PIX', subtitle: '', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'simple' },
  { id: 'modern', name: 'Moderno', description: 'Visual de ferramenta financeira', layout: 'modern', qrSize: 180, title: 'PIX', subtitle: 'Pagamento rápido e seguro', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'modern' },
  { id: 'commercial', name: 'Comercial', description: 'Para balcões e estabelecimentos', layout: 'commercial', qrSize: 184, title: 'ACEITAMOS PIX', subtitle: 'Pagamento fácil e rápido', instruction: 'APONTE A CÂMERA DO CELULAR', footer: 'Obrigado pela preferência', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'commercial' },
  { id: 'green', name: 'Verde Pix', description: 'Leve e associado ao digital', layout: 'green', qrSize: 180, title: 'PIX', subtitle: 'Prático, rápido e seguro', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'green' },
  { id: 'premium', name: 'Premium', description: 'Minimalista e elegante', layout: 'premium', qrSize: 190, title: 'PIX', subtitle: '', instruction: 'ESCANEIE PARA PAGAR', footer: '', showHeader: true, showFooter: false, informationOrder: ['name', 'key', 'bank'], theme: 'premium' },
  { id: 'accessible', name: 'Fácil leitura', description: 'Alto contraste e letras grandes', layout: 'accessible', qrSize: 190, title: 'PIX', subtitle: 'PAGAMENTO', instruction: 'APONTE A CÂMERA', footer: 'PAGAMENTO VIA PIX', showHeader: true, showFooter: true, informationOrder: ['name', 'key', 'bank'], theme: 'accessible' },
];

export const getTemplateConfig = (id) => TEMPLATE_CONFIGS.find((template) => template.id === id) || TEMPLATE_CONFIGS[0];
