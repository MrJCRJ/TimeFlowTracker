import type { DeviceInfo } from '@/types';

/**
 * Gera identificador único do dispositivo
 * Usa uma combinação de informações do navegador que é persistida no localStorage
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const storageKey = 'timeflow_device_id';
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    // Gera um ID único baseado em timestamp + random
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

/**
 * Detecta a plataforma do dispositivo
 */
export function detectPlatform(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const ua = navigator.userAgent.toLowerCase();

  // Detecta dispositivos móveis
  if (/android/.test(ua)) {
    return 'Android';
  }
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'iOS';
  }
  if (/windows phone/.test(ua)) {
    return 'Windows Phone';
  }

  // Detecta sistemas desktop
  if (/macintosh|mac os x/.test(ua)) {
    return 'macOS';
  }
  if (/windows/.test(ua)) {
    return 'Windows';
  }
  if (/linux/.test(ua)) {
    return 'Linux';
  }

  return 'Unknown';
}

/**
 * Gera nome amigável para o dispositivo
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Server';
  }

  const storageKey = 'timeflow_device_name';
  let deviceName = localStorage.getItem(storageKey);

  if (!deviceName) {
    const platform = detectPlatform();
    const browser = detectBrowser();
    deviceName = `${platform} - ${browser}`;
    localStorage.setItem(storageKey, deviceName);
  }

  return deviceName;
}

/**
 * Detecta o navegador
 */
export function detectBrowser(): string {
  if (typeof window === 'undefined') {
    return 'Server';
  }

  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    return 'Chrome';
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari';
  }
  if (ua.includes('Firefox')) {
    return 'Firefox';
  }
  if (ua.includes('Edg')) {
    return 'Edge';
  }
  if (ua.includes('Opera') || ua.includes('OPR')) {
    return 'Opera';
  }

  return 'Browser';
}

/**
 * Obtém informações completas do dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    platform: detectPlatform(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
  };
}

/**
 * Permite ao usuário definir um nome personalizado para o dispositivo
 */
export function setDeviceName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('timeflow_device_name', name);
  }
}

/**
 * Verifica se o código está rodando no servidor
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Verifica se o dispositivo é móvel
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const platform = detectPlatform();
  return ['Android', 'iOS', 'Windows Phone'].includes(platform);
}
