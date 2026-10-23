import type { MonitorConfig } from '@watchtower/runtime';
import { decryptSecret } from './product-secrets.js';
export function hydrateMonitorConfig(value:MonitorConfig & {encryptedSteps?:string}):MonitorConfig {
 const {encryptedSteps,...config}=value;
 if(!encryptedSteps)return config;
 try{config.steps=JSON.parse(decryptSecret(encryptedSteps).steps ?? '') as MonitorConfig['steps'];}
 catch{return {...config,configurationError:'CREDENTIALS_UNCONFIGURED'};}
 return config;
}
