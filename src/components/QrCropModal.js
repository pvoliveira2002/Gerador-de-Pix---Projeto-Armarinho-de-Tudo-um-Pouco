const MIN_CROP_SIZE = 72;
const OUTPUT_MAX_SIZE = 1600;
const QUIET_ZONE_RATIO = 0.06;

export function qrCropModalTemplate() {
  return `
    <div class="crop-modal" id="qr-crop-modal" hidden>
      <section class="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <header class="crop-header"><div><span>Recortar QR Code</span><h2 id="crop-title">Selecione apenas o QR Code</h2></div><button type="button" class="crop-close" data-crop-cancel aria-label="Fechar">×</button></header>
        <div class="crop-workspace">
          <div class="crop-stage" id="crop-stage">
            <img id="crop-image" alt="Imagem selecionada para recorte" draggable="false" />
            <div class="crop-selection" id="crop-selection" tabindex="0" aria-label="Área quadrada de recorte">
              <span class="crop-grid"></span><i class="crop-handle" aria-hidden="true"></i>
            </div>
          </div>
          <p class="crop-help">Arraste o quadrado para posicionar. Use a alça no canto para ajustar o tamanho.</p>
        </div>
        <footer class="crop-actions"><button type="button" class="btn ghost" data-crop-cancel>Cancelar</button><button type="button" class="btn outline" id="auto-detect-qr">Auto detectar</button><button type="button" class="btn primary" id="confirm-crop">Confirmar recorte</button></footer>
      </section>
    </div>`;
}

export class QrCropModal {
  constructor({ onConfirm, onMessage }) {
    this.modal = document.querySelector('#qr-crop-modal');
    this.stage = document.querySelector('#crop-stage');
    this.image = document.querySelector('#crop-image');
    this.selection = document.querySelector('#crop-selection');
    this.onConfirm = onConfirm;
    this.onMessage = onMessage;
    this.sourceFile = null;
    this.sourceUrl = '';
    this.crop = { x: 0, y: 0, size: 100 };
    this.pointer = null;

    this.modal.querySelectorAll('[data-crop-cancel]').forEach((button) => button.addEventListener('click', () => this.close()));
    document.querySelector('#auto-detect-qr').addEventListener('click', () => this.autoDetect());
    document.querySelector('#confirm-crop').addEventListener('click', () => this.confirm());
    this.selection.addEventListener('pointerdown', (event) => this.startPointer(event));
    window.addEventListener('pointermove', (event) => this.movePointer(event));
    window.addEventListener('pointerup', () => { this.pointer = null; });
    window.addEventListener('resize', () => { if (!this.modal.hidden) this.resetCrop(); });
  }

  async open(file = this.sourceFile) {
    if (!file) return;
    this.sourceFile = file;
    if (this.sourceUrl) URL.revokeObjectURL(this.sourceUrl);
    this.sourceUrl = URL.createObjectURL(file);
    this.image.src = this.sourceUrl;
    await this.image.decode();
    this.modal.hidden = false;
    requestAnimationFrame(() => this.resetCrop());
  }

  close() { this.modal.hidden = true; this.pointer = null; }

  imageMetrics() {
    const stageWidth = this.stage.clientWidth;
    const stageHeight = this.stage.clientHeight;
    const scale = Math.min(stageWidth / this.image.naturalWidth, stageHeight / this.image.naturalHeight);
    const width = this.image.naturalWidth * scale;
    const height = this.image.naturalHeight * scale;
    return { x: (stageWidth - width) / 2, y: (stageHeight - height) / 2, width, height, scale };
  }

  resetCrop() {
    const metrics = this.imageMetrics();
    const size = Math.min(metrics.width, metrics.height) * 0.72;
    this.crop = { x: metrics.x + (metrics.width - size) / 2, y: metrics.y + (metrics.height - size) / 2, size };
    this.renderCrop();
  }

  renderCrop() {
    this.selection.style.transform = `translate(${this.crop.x}px, ${this.crop.y}px)`;
    this.selection.style.width = `${this.crop.size}px`;
    this.selection.style.height = `${this.crop.size}px`;
  }

  startPointer(event) {
    event.preventDefault();
    this.selection.setPointerCapture?.(event.pointerId);
    this.pointer = {
      mode: event.target.classList.contains('crop-handle') ? 'resize' : 'move',
      startX: event.clientX,
      startY: event.clientY,
      crop: { ...this.crop },
    };
  }

  movePointer(event) {
    if (!this.pointer) return;
    const metrics = this.imageMetrics();
    const dx = event.clientX - this.pointer.startX;
    const dy = event.clientY - this.pointer.startY;
    if (this.pointer.mode === 'move') {
      this.crop.x = Math.max(metrics.x, Math.min(this.pointer.crop.x + dx, metrics.x + metrics.width - this.crop.size));
      this.crop.y = Math.max(metrics.y, Math.min(this.pointer.crop.y + dy, metrics.y + metrics.height - this.crop.size));
    } else {
      const available = Math.min(metrics.x + metrics.width - this.pointer.crop.x, metrics.y + metrics.height - this.pointer.crop.y);
      this.crop.size = Math.max(MIN_CROP_SIZE, Math.min(this.pointer.crop.size + Math.max(dx, dy), available));
    }
    this.renderCrop();
  }

  async autoDetect() {
    if (!('BarcodeDetector' in window)) {
      this.onMessage('Detecção automática indisponível neste navegador. Ajuste o recorte manualmente.');
      return;
    }
    try {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const results = await detector.detect(this.image);
      if (!results.length) throw new Error('not-found');
      const box = results[0].boundingBox;
      const metrics = this.imageMetrics();
      const padding = Math.max(box.width, box.height) * 0.08;
      const originalSize = Math.min(Math.max(box.width, box.height) + padding * 2, Math.min(this.image.naturalWidth, this.image.naturalHeight));
      const originalX = Math.max(0, Math.min(box.x - (originalSize - box.width) / 2, this.image.naturalWidth - originalSize));
      const originalY = Math.max(0, Math.min(box.y - (originalSize - box.height) / 2, this.image.naturalHeight - originalSize));
      this.crop = { x: metrics.x + originalX * metrics.scale, y: metrics.y + originalY * metrics.scale, size: originalSize * metrics.scale };
      this.renderCrop();
      this.onMessage('QR Code localizado. Confira o recorte antes de confirmar.');
    } catch {
      this.onMessage('Não foi possível detectar o QR Code. Ajuste o recorte manualmente.');
    }
  }

  confirm() {
    const metrics = this.imageMetrics();
    const sourceX = Math.max(0, (this.crop.x - metrics.x) / metrics.scale);
    const sourceY = Math.max(0, (this.crop.y - metrics.y) / metrics.scale);
    const sourceSize = Math.min(this.crop.size / metrics.scale, this.image.naturalWidth - sourceX, this.image.naturalHeight - sourceY);
    const contentSize = Math.min(Math.round(sourceSize), OUTPUT_MAX_SIZE);
    const quietZone = Math.max(16, Math.round(contentSize * QUIET_ZONE_RATIO));
    const canvas = document.createElement('canvas');
    canvas.width = contentSize + quietZone * 2;
    canvas.height = contentSize + quietZone * 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(this.image, sourceX, sourceY, sourceSize, sourceSize, quietZone, quietZone, contentSize, contentSize);
    const croppedUrl = canvas.toDataURL('image/png');
    this.onConfirm({ croppedUrl, sourceFile: this.sourceFile });
    this.close();
  }
}
