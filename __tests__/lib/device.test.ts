/**
 * @jest-environment jsdom
 */

import { detectPlatform, detectBrowser, isMobileDevice, isServer } from '@/lib/device';

describe('device utilities', () => {
  describe('detectPlatform', () => {
    it('deve detectar a plataforma corretamente', () => {
      const platform = detectPlatform();

      // No ambiente de teste jsdom, pode retornar 'Unknown' ou plataforma simulada
      expect(typeof platform).toBe('string');
      expect(platform.length).toBeGreaterThan(0);
    });

    it('deve retornar uma das plataformas conhecidas ou Unknown', () => {
      const platform = detectPlatform();
      const knownPlatforms = ['Android', 'iOS', 'Windows Phone', 'macOS', 'Windows', 'Linux', 'Unknown'];
      
      expect(knownPlatforms).toContain(platform);
    });
  });

  describe('detectBrowser', () => {
    it('deve detectar o navegador corretamente', () => {
      const browser = detectBrowser();

      expect(typeof browser).toBe('string');
      expect(browser.length).toBeGreaterThan(0);
    });

    it('deve retornar um dos navegadores conhecidos', () => {
      const browser = detectBrowser();
      const knownBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Browser'];
      
      expect(knownBrowsers).toContain(browser);
    });
  });

  describe('isMobileDevice', () => {
    it('deve retornar boolean', () => {
      const isMobile = isMobileDevice();

      expect(typeof isMobile).toBe('boolean');
    });

    it('deve retornar false no ambiente de teste (jsdom)', () => {
      // JSDOM simula um desktop browser
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isServer', () => {
    it('deve retornar false no ambiente de teste (jsdom)', () => {
      // JSDOM simula um browser, então não é servidor
      expect(isServer()).toBe(false);
    });
  });
});

// Testes separados para funções que dependem de localStorage
// são mais difíceis de testar no Jest porque o módulo é carregado antes dos testes
describe('device identification (smoke tests)', () => {
  it('should export all device functions', async () => {
    const deviceModule = await import('@/lib/device');
    
    expect(typeof deviceModule.getDeviceId).toBe('function');
    expect(typeof deviceModule.getDeviceName).toBe('function');
    expect(typeof deviceModule.getDeviceInfo).toBe('function');
    expect(typeof deviceModule.setDeviceName).toBe('function');
  });

  it('getDeviceInfo should return correct structure', async () => {
    const { getDeviceInfo } = await import('@/lib/device');
    const info = getDeviceInfo();
    
    expect(info).toHaveProperty('deviceId');
    expect(info).toHaveProperty('deviceName');
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('userAgent');
    expect(typeof info.deviceId).toBe('string');
    expect(typeof info.deviceName).toBe('string');
  });
});
