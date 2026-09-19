import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
const serviceWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

function pngSize(relativePath) {
  const data = readFileSync(new URL(relativePath, import.meta.url));
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

describe('PWA instalável', () => {
  it('possui manifesto standalone com identidade da loja', () => {
    expect(manifest.name).toContain('Armarinho de Tudo um Pouco');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0a4928');
    expect(html).toContain('rel="manifest"');
  });

  it('inclui ícones nos tamanhos exigidos e versão maskable', () => {
    expect(existsSync(new URL('../public/icons/icon-192.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../public/icons/icon-512.png', import.meta.url))).toBe(true);
    expect(pngSize('../public/icons/icon-192.png')).toEqual([192, 192]);
    expect(pngSize('../public/icons/icon-512.png')).toEqual([512, 512]);
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('registra service worker e oferece instalação', () => {
    expect(main).toContain("window.addEventListener('beforeinstallprompt'");
    expect(main).toContain("navigator.serviceWorker.register('/sw.js')");
    expect(serviceWorker).toContain("self.addEventListener('fetch'");
    expect(serviceWorker).toContain("caches.match('/index.html')");
  });
});
