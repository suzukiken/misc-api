import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Miscapi from '../lib/miscapi-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Miscapi.MiscapiStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
