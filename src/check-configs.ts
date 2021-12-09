import versionsJson from '../configs/versions.json'

interface Rules {
  [channel: string]: {pattern: string, optional: boolean}
}

const rules: Rules = {
  'beta-opt-in': {
    pattern: '03\\d{13}',
    optional: false,
  },
  'beta-traffic': {
    pattern: '03\\d{13}',
    optional: false,
  },
  control: {
    pattern: '02\\d{13}',
    optional: false,
  },
  'experimental-opt-in': {
    pattern: '00\\d{13}',
    optional: false,    
  },
  'experimental-traffic': {
    pattern: '00\\d{13}',
    optional: false,
  },
  experimentA: {  
    pattern: '10\\d{13}',
    optional: true,
  },
  experimentB: {  
    pattern: '11\\d{13}',
    optional: true,
  },
  experimentC: {  
    pattern: '12\\d{13}',
    optional: true,
  },
  lts: {
    pattern: '01\\d{13}',
    optional: false,
  },
  nightly: {
    pattern: '04\\d{13}',
    optional: false,
  },
  'nightly-control': {
    pattern: '05\\d{13}',
    optional: false,
  },
  stable: {
    pattern: '01\\d{13}',
    optional: false,
  },
};

interface Versions {
  [channel: string]: string | null;
}

export const versions: Versions = {...versionsJson};

export function checkVersionPattern(channel: string): boolean {
  const {pattern, optional} = rules[channel];
  const version = versions[channel];

  if (!version && !optional) {
    throw new Error('Version cannot be null');
  }

  if (version && !new RegExp(pattern).test(version)) {
    throw new Error(`Version ${version} does not match pattern ${pattern}`);
  }

  return true;
}
