import { createScaledPreview } from './TemplateRenderer.js';

export class TemplateGallery {
  constructor({ container, templates, sourcePlate, getQrImage, onSelect }) {
    this.container = container;
    this.templates = templates;
    this.sourcePlate = sourcePlate;
    this.getQrImage = getQrImage;
    this.onSelect = onSelect;
    this.selectedId = templates[0].id;
  }

  select(id, notify = true) {
    this.selectedId = id;
    this.container.querySelectorAll('.template-card').forEach((card) => {
      const selected = card.dataset.templateId === id;
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-pressed', String(selected));
      card.querySelector('.template-selected').hidden = !selected;
    });
    if (notify) this.onSelect(id);
  }

  render() {
    const qrImageUrl = this.getQrImage();
    this.container.replaceChildren();
    this.templates.forEach((template) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'template-card';
      card.dataset.templateId = template.id;
      card.innerHTML = `<span class="template-viewport"></span><span class="template-card-copy"><strong>${template.name}</strong><small>${template.description}</small></span><span class="template-selected" hidden>✓ Selecionado</span>`;
      card.querySelector('.template-viewport').append(createScaledPreview(this.sourcePlate, template, qrImageUrl));
      card.addEventListener('click', () => this.select(template.id));
      this.container.append(card);
    });
    this.select(this.selectedId, false);
  }
}
