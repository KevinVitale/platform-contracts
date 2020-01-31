import { DeploymentStage, Manager } from '@imtbl/deployment-utils';

import { CoreStage } from './01_core';
import { ForwarderStage } from './00_forwarder';

const config = require('dotenv').config({ path: '../../.env' }).parsed;

async function start() {
  const args = require('minimist')(process.argv.slice(2));

  let stages: DeploymentStage[] = [];

  if (args.all) {
    args.forwarder = true;
    args.core = true;
  }

  if (args.forwarder) {
    stages.push(new ForwarderStage(config.PRIVATE_KEY, config.RPC_ENDPOINT));
  }

  if (args.core) {
    stages.push(new CoreStage(config.PRIVATE_KEY, config.RPC_ENDPOINT));
  }

  const newManager = new Manager(stages);

  console.log(stages);
  try {
    await newManager.deploy();
  } catch (error) {
    console.log(error);
  }
}

start();
