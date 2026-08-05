import { shopExample } from './shop-example.js';
import { preparePhase } from './prepare.js';
import { buildPhase } from './build.js';
import { sellPhase } from './sell.js';
import { armPhase } from './arm.js';
import { prompts } from './prompts.js';
import { troubleshooting } from './troubleshooting.js';

export const playbook = {
  title: 'LINE AI Sales Agent Playbook',
  byline: '@pun_nattapatch',
  exampleBusiness: shopExample,
  phases: [preparePhase, buildPhase, sellPhase, armPhase],
  prompts,
  troubleshooting,
};
