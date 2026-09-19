import { qrCropModalTemplate } from '../components/QrCropModal.js';

export function appTemplate() {
  return `
    <header class="topbar">
      <div class="brand"><img class="brand-logo" src="/icons/icon-192.png" alt="Armarinho de Tudo um Pouco" /><div><strong>Gerador Pix QR</strong><small>Armarinho de Tudo um Pouco</small></div></div>
      <div class="topbar-actions"><span class="privacy">🔒 Seus dados ficam neste dispositivo</span><button class="install-app" id="install-app" hidden>Instalar aplicativo</button></div>
    </header>
    <main>
      <section class="hero"><span class="eyebrow">RÁPIDO • SEGURO • GRATUITO</span><h1>Crie sua placa Pix em poucos minutos.</h1><p>Gere um QR Code Pix válido ou use uma imagem existente. Personalize e baixe pronto para imprimir.</p></section>
      <nav class="step-navigation app-tabs" aria-label="Ferramentas de edição">
        <button class="step-item active" data-step-target="1"><span>1</span><b>Dados</b><small>Dados do Pix</small></button><i></i>
        <button class="step-item" data-step-target="2" disabled><span>2</span><b>Modelo</b><small>Escolha o visual</small></button><i></i>
        <button class="step-item" data-step-target="3" disabled><span>3</span><b>Personalizar</b><small>Ajuste a placa</small></button><i></i>
        <button class="step-item export-step" data-step-target="4" disabled><span>4</span><b>Exportar</b><small>Baixe ou imprima</small></button>
      </nav>
      <section class="workspace">
        <div class="control-column">
          <section class="panel form-panel stage-panel active" data-stage="1">
            <nav class="mode-tabs" aria-label="Modo de criação"><button class="mode active" data-mode="generate"><b>✦</b><span>Gerar QR Code Pix<small>Crie a partir da chave Pix</small></span></button><button class="mode" data-mode="upload"><b>↑</b><span>Usar QR Code existente<small>Envie uma imagem pronta</small></span></button></nav>
            <div id="generate-form">
              <div class="section-title"><span>1</span><div><h2>Dados do Pix</h2><p>Preencha as informações do recebedor</p></div></div>
              <form id="pix-form" novalidate>
                <label class="full">Nome do recebedor *<input name="name" maxlength="25" placeholder="Ex: João da Silva" /><small class="error" data-error="name"></small></label>
                <label class="full">Nome social ou para exibição <span class="optional">Opcional</span><input name="displayName" maxlength="40" placeholder="Ex: João" /></label>
                <label>Banco <span class="optional">Opcional</span><input name="bank" list="banks" placeholder="Selecione ou digite" /><datalist id="banks"><option>Nubank</option><option>Caixa</option><option>Banco do Brasil</option><option>Itaú</option><option>Bradesco</option><option>Santander</option><option>Inter</option><option>Mercado Pago</option><option>PicPay</option></datalist></label>
                <label>Tipo da chave *<select name="keyType"><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="phone">Celular</option><option value="email">E-mail</option><option value="random">Chave aleatória</option></select></label>
                <label class="full">Chave Pix *<input name="key" placeholder="Digite a chave Pix" /><small class="error" data-error="key"></small></label>
                <label>Cidade do recebedor *<input name="city" maxlength="15" placeholder="Ex: São Paulo" /><small class="error" data-error="city"></small></label>
                <label>Valor <span class="optional">Opcional</span><div class="money"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" /></div><small class="error" data-error="amount"></small></label>
                <label>Descrição <span class="optional">Opcional</span><input name="description" maxlength="72" placeholder="Ex: Pagamento" /></label>
                <label>Identificador / TXID <span class="optional">Opcional</span><input name="txid" maxlength="25" placeholder="Ex: PEDIDO123" /><small class="error" data-error="txid"></small></label>
                <div class="form-actions full"><button type="button" class="btn ghost" id="clear">Limpar dados</button><button class="btn primary" type="submit">Gerar QR Code <span>→</span></button></div>
              </form>
            </div>
            <div id="upload-form" hidden>
              <div class="section-title"><span>1</span><div><h2>Enviar QR Code</h2><p>Use a imagem fornecida pelo cliente</p></div></div>
              <label class="dropzone" id="dropzone"><input id="qr-upload" type="file" accept="image/png,image/jpeg,image/webp" hidden /><b>↑</b><strong>Arraste a imagem aqui</strong><span>ou clique para selecionar</span><small>PNG, JPG, JPEG ou WEBP</small></label>
              <div class="cropped-qr-summary" id="cropped-qr-summary" hidden><img id="cropped-qr-thumb" alt="QR Code recortado" /><div><strong>QR Code recortado</strong><small>Pronto para usar na placa</small></div><button type="button" class="btn outline" id="recrop-qr">Recortar novamente</button></div>
              <label>Nome para exibição <span class="optional">Opcional</span><input id="upload-name" placeholder="Ex: João da Silva" /></label>
              <label>Banco <span class="optional">Opcional</span><input id="upload-bank" placeholder="Ex: Nubank" /></label>
              <label>Chave Pix <span class="optional">Opcional</span><input id="upload-key" placeholder="Informação visual" /></label>
            </div>
            <div class="stage-actions"><span></span><button class="btn primary" id="step1-continue" data-next="2" disabled>Continuar <span>→</span></button></div>
          </section>
          <section id="editor" class="editor panel" hidden>
            <div class="stage-panel" data-stage="2">
              <div class="editor-title"><div><span class="step">2</span><h2>Escolha do modelo</h2></div><p>Selecione o visual da sua placa</p></div>
              <fieldset><legend>Modelos disponíveis</legend><div class="template-list"><button data-template="simple">Simples</button><button class="selected" data-template="modern">Moderno</button><button data-template="commercial">Comercial</button><button data-template="green">Verde Pix</button><button data-template="premium">Premium</button><button data-template="accessible">Leitura fácil</button></div></fieldset>
              <div class="stage-actions"><button class="btn ghost" data-back="1">← Voltar</button><button class="btn primary" data-next="3">Continuar <span>→</span></button></div>
            </div>
            <div class="stage-panel" data-stage="3" hidden>
              <div class="editor-title"><div><span class="step">3</span><h2>Personalize sua placa</h2></div><p>Ajuste os detalhes</p></div>
              <div class="controls-grid">
                <fieldset><legend>Exibir informações</legend><div class="checks"><label><input type="checkbox" data-toggle="out-name" checked /> Nome</label><label><input type="checkbox" data-toggle="out-bank" checked /> Banco</label><label><input type="checkbox" data-toggle="out-key" checked /> Chave</label><label><input type="checkbox" data-toggle="out-social" /> Nome social</label><label><input type="checkbox" data-toggle="out-amount" /> Valor</label><label><input type="checkbox" data-toggle="scan-text" checked /> Texto de instrução</label></div></fieldset>
                <fieldset><legend>Cores e estilo</legend><div class="color-controls"><label>Principal <input type="color" id="primary-color" value="#0a7a41" /></label><label>Secundária <input type="color" id="secondary-color" value="#f4cc12" /></label><label>Fundo <input type="color" id="background-color" value="#ffffff" /></label><label>Texto <input type="color" id="text-color" value="#102a20" /></label></div><label class="range-label">Tamanho do QR <input type="range" id="qr-size" min="150" max="220" value="180" /></label><label class="range-label">Bordas <input type="range" id="radius" min="0" max="32" value="22" /></label><label class="logo-upload">Adicionar logo <input type="file" id="logo-upload" accept="image/*" /></label></fieldset>
                <fieldset><legend>Tamanho da arte</legend><select id="art-size"><option value="10x15">10 × 15 cm</option><option value="a5">A5</option><option value="a4">A4</option><option value="square">Quadrado</option><option value="custom">Personalizado</option></select><div id="custom-size" hidden><input id="custom-width" type="number" min="5" max="100" value="15" aria-label="Largura em centímetros" /> × <input id="custom-height" type="number" min="5" max="100" value="20" aria-label="Altura em centímetros" /> cm</div></fieldset>
              </div>
              <div class="stage-actions"><button class="btn ghost" data-back="2">← Voltar</button><button class="btn primary" data-next="4">Continuar <span>→</span></button></div>
            </div>
            <div class="stage-panel" data-stage="4" hidden>
              <div class="export-ready"><span>✓</span><h2>Sua placa está pronta</h2><p>Baixe o arquivo ou imprima diretamente.</p></div>
              <div class="export-actions"><button class="btn dark" id="download-png">Baixar PNG</button><button class="btn outline" id="download-pdf">Baixar PDF</button><button class="btn outline" id="print">Imprimir</button><button class="btn outline" id="copy-bottom">Copiar Pix</button></div>
              <div class="stage-actions"><button class="btn ghost" data-back="3">← Voltar</button><span></span></div>
            </div>
          </section>
        </div>
        <aside class="panel preview-panel">
          <div class="preview-heading"><div><b>Pré-visualização</b><small>Sua placa aparecerá aqui</small></div><span id="status-pill" class="status">Aguardando dados</span></div>
          <div id="plate-wrap"><article id="plate" class="plate modern"><div class="plate-header"><span>PIX</span><small>Pagamento rápido e seguro</small></div><div class="pix-card-content"><div class="logo-slot" hidden></div><div class="qr-shell"><div id="qr-placeholder"><b>⌗</b><span>Seu QR Code</span></div><canvas id="qr-canvas" hidden></canvas><img id="uploaded-qr" alt="QR Code enviado" hidden /></div><p class="scan-text">APONTE A CÂMERA PARA PAGAR</p><div class="plate-info"><strong class="out-name">Nome do recebedor</strong><span class="out-social" hidden></span><span class="out-bank">Banco</span><code class="out-key">Sua chave Pix</code><span class="out-amount" hidden></span></div></div><footer>Pagamento via Pix</footer></article></div>
          <div id="payload-result" hidden><div class="payload-title"><b>Pix Copia e Cola</b><button id="copy-payload" class="text-btn">Copiar</button></div><textarea id="payload" readonly></textarea></div>
          <div class="preview-actions" aria-label="Ações da placa"><button class="btn ghost" id="new-pix">Novo Pix</button><button class="btn outline" id="action-copy" disabled>Copiar Pix</button><button class="btn dark" id="action-png" disabled>PNG</button><button class="btn outline" id="action-pdf" disabled>PDF</button><button class="btn outline" id="action-print" disabled>Imprimir</button></div>
        </aside>
      </section>
    </main>
    <footer class="site-footer">Gerador Pix QR • Nenhum dado é enviado ou armazenado.</footer><div id="toast" role="status"></div>
    <div class="confirm-dialog" id="new-pix-dialog" hidden><div class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">Começar um novo Pix?</h2><p>Todos os dados preenchidos e as personalizações serão apagados.</p><div><button class="btn ghost" id="cancel-new-pix">Cancelar</button><button class="btn primary" id="confirm-new-pix">Começar novamente</button></div></div></div>
    ${qrCropModalTemplate()}`;
}
