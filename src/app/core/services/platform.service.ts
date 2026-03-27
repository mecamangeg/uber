import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  readonly isNative: boolean;
  readonly platform: string;

  constructor() {
    try {
      this.isNative = Capacitor.isNativePlatform();
      this.platform = Capacitor.getPlatform();
    } catch {
      this.isNative = false;
      this.platform = 'web';
    }
  }
}
