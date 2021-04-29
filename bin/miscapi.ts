#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MiscapiStack } from '../lib/miscapi-stack';

const app = new cdk.App();
new MiscapiStack(app, 'MiscapiStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
