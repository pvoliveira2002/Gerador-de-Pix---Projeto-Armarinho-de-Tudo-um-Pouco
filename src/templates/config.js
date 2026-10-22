export const THEME_CONFIGS = {
  simple: { primary: '#17362a', secondary: '#eef3ef', background: '#ffffff', text: '#16251f', radius: 8 },
  modern: { primary: '#087a40', secondary: '#18ad5d', background: '#ffffff', text: '#102a20', radius: 22 },
  commercial: { primary: '#0a4928', secondary: '#f4cf18', background: '#fffef7', text: '#102a20', radius: 14 },
  green: { primary: '#119c72', secondary: '#76d6b5', background: '#f3fcf8', text: '#12382d', radius: 20 },
  premium: { primary: '#292722', secondary: '#a98b45', background: '#fffdf8', text: '#292722', radius: 4 },
  accessible: { primary: '#111111', secondary: '#f4cf18', background: '#ffffff', text: '#000000', radius: 2 },
  blueWave: { primary: '#1879d9', secondary: '#65b7f3', background: '#eef8ff', text: '#093a68', radius: 20 },
  royal: { primary: '#0756c9', secondary: '#48d22f', background: '#ffffff', text: '#082d66', radius: 16 },
  turquoise: { primary: '#10a994', secondary: '#7ae2d5', background: '#f4fffd', text: '#084d45', radius: 20 },
  blush: { primary: '#e94878', secondary: '#ffd4df', background: '#fff5f7', text: '#711932', radius: 22 },
  gold: { primary: '#111111', secondary: '#e7bd42', background: '#fff9e7', text: '#19150b', radius: 18 },
  neon: { primary: '#f5ad00', secondary: '#202020', background: '#080808', text: '#ffffff', radius: 12 },
  geometric: { primary: '#008f89', secondary: '#d6f2ee', background: '#ffffff', text: '#144744', radius: 10 },
  nightWave: { primary: '#23c5cf', secondary: '#082b31', background: '#07171a', text: '#ffffff', radius: 20 },
};

export const TEMPLATE_CONFIGS = [
  { id: 'simple', name: 'Simples', description: 'Limpo e ideal para impressão', layout: 'simple', qrSize: 180, title: 'PIX', subtitle: '', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'simple' },
  { id: 'modern', name: 'Moderno', description: 'Visual de ferramenta financeira', layout: 'modern', qrSize: 180, title: 'PIX', subtitle: 'Pagamento rápido e seguro', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'modern' },
  { id: 'commercial', name: 'Comercial', description: 'Para balcões e estabelecimentos', layout: 'commercial', qrSize: 184, title: 'ACEITAMOS PIX', subtitle: 'Pagamento fácil e rápido', instruction: 'APONTE A CÂMERA DO CELULAR', footer: 'Obrigado pela preferência', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'commercial' },
  { id: 'green', name: 'Verde Pix', description: 'Leve e associado ao digital', layout: 'green', qrSize: 180, title: 'PIX', subtitle: 'Prático, rápido e seguro', instruction: 'APONTE A CÂMERA PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['name', 'bank', 'key'], theme: 'green' },
  { id: 'premium', name: 'Premium', description: 'Minimalista e elegante', layout: 'premium', qrSize: 190, title: 'PIX', subtitle: '', instruction: 'ESCANEIE PARA PAGAR', footer: '', showHeader: true, showFooter: false, informationOrder: ['name', 'key', 'bank'], theme: 'premium' },
  { id: 'accessible', name: 'Fácil leitura', description: 'Alto contraste e letras grandes', layout: 'accessible', qrSize: 190, title: 'PIX', subtitle: 'PAGAMENTO', instruction: 'APONTE A CÂMERA', footer: 'PAGAMENTO VIA PIX', showHeader: true, showFooter: true, informationOrder: ['name', 'key', 'bank'], theme: 'accessible' },
  { id: 'blue-wave', name: 'Azul Curvas', description: 'Dinâmico e amigável', layout: 'blue-wave', qrSize: 182, title: 'PAGUE COM PIX', subtitle: 'Rápido, simples e seguro', instruction: 'APONTE A CÂMERA', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'blueWave' },
  { id: 'royal', name: 'Azul Royal', description: 'Impacto para o balcão', layout: 'royal', qrSize: 180, title: 'PAGUE COM PIX', subtitle: '', instruction: 'LEIA O QR CODE', footer: 'Obrigado pela preferência', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'royal' },
  { id: 'turquoise', name: 'Turquesa', description: 'Leve e contemporâneo', layout: 'turquoise', qrSize: 184, title: 'PAGUE COM PIX', subtitle: 'Pagamento instantâneo', instruction: 'ESCANEIE PARA PAGAR', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'turquoise' },
  { id: 'blush', name: 'Rosa Suave', description: 'Delicado e acolhedor', layout: 'blush', qrSize: 180, title: 'PIX', subtitle: 'Pague de forma prática', instruction: 'APONTE SUA CÂMERA', footer: 'Obrigada pela preferência', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'blush' },
  { id: 'gold', name: 'Dourado', description: 'Elegante e marcante', layout: 'gold', qrSize: 186, title: 'PAGUE COM PIX', subtitle: 'Pagamento seguro', instruction: 'ESCANEIE O CÓDIGO', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'gold' },
  { id: 'neon', name: 'Preto Neon', description: 'Alto contraste moderno', layout: 'neon', qrSize: 184, title: 'PAGUE COM PIX', subtitle: '', instruction: 'OU COM A CHAVE', footer: 'PIX • RÁPIDO • SEGURO', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'neon' },
  { id: 'geometric', name: 'Geométrico', description: 'Corporativo e organizado', layout: 'geometric', qrSize: 180, title: 'PAGUE COM PIX', subtitle: 'Escaneie o QR Code', instruction: 'APONTE A CÂMERA', footer: 'Pagamento via Pix', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'geometric' },
  { id: 'night-wave', name: 'Onda Noturna', description: 'Escuro e sofisticado', layout: 'night-wave', qrSize: 184, title: 'Pague com pix', subtitle: '', instruction: 'APONTE A CÂMERA', footer: 'Pagamento seguro', showHeader: true, showFooter: true, informationOrder: ['key', 'name', 'bank'], theme: 'nightWave' },
];

export const getTemplateConfig = (id) => TEMPLATE_CONFIGS.find((template) => template.id === id) || TEMPLATE_CONFIGS[0];
