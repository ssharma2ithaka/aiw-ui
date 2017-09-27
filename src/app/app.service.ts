/**
 * AppConfig
 * - Global service used to maintain configuration variables
 * - Provides support for WLV options
 */
import { Injectable } from '@angular/core';

// Import all WLV configs
import { WLV_SAHARA } from './white-label-config.ts'

@Injectable()
export class AppConfig {
  // Default values
  public pageTitle = 'Artstor'
  public logoUrl = '/assets/img/logo-v1-1.png'

  constructor() {
    let WLVConfig = this.getWLVConfig()
    if (WLVConfig) {
      this.pageTitle = WLVConfig.pageTitle
      this.logoUrl = WLVConfig.logoUrl
    }
  }
  
  getWLVConfig() {
    if (document.location.hostname.indexOf('sahara.artstor.org') > -1 || document.location.hostname.indexOf('sahara.test.artstor.org') > -1) {
      return WLV_SAHARA
    } else {
      return null
    }
  }
}
