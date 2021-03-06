import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from '@aws-cdk/aws-lambda';
import { PythonFunction } from "@aws-cdk/aws-lambda-python";

export class MiscapiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const basename = this.node.tryGetContext('basename')
    const appsyncapiid_exportname = this.node.tryGetContext('appsyncapiid_exportname')
    const appsyncapiarn_exportname = this.node.tryGetContext('appsyncapiarn_exportname')
    const appsyncapiurl_exportname = this.node.tryGetContext('appsyncapiurl_exportname')

    // appsync api

    const api = new appsync.GraphqlApi(this, "api", {
      name: basename,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      schema: new appsync.Schema({
        filePath: "graphql/schema.graphql",
      }),
    });

    // AppSync Datasource

    const none_datasource = new appsync.NoneDataSource(this, 'datasource', {
      api: api
    })
    
    //AppSync Resolver for No Datasource. This resolver is just return IPaddress

    none_datasource.createResolver({
      typeName: "Query",
      fieldName: "getIpaddress",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        `{
          "version": "2018-05-29",
          "payload": {
            "ipaddress": "$context.identity.sourceIp[0]"
          }
        }`
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `$util.toJson($ctx.result)`
      ),
    })
    
    // Lambda to get Cfn outputs
    
    const role = new iam.Role(this, "role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCloudFormationReadOnlyAccess")
      ]
    })
    
    const list_cfn_exports_function = new PythonFunction(this, "list_cfn_exports", {
      entry: "lambda",
      index: "list_cfn_exports.py",
      handler: "lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(30),
      role: role
    })
    
    const lambda_exports_datasource = api.addLambdaDataSource(
      "lambda_outputs_datasource",
      list_cfn_exports_function
    )

    lambda_exports_datasource.createResolver({
      typeName: "Query",
      fieldName: "listCloudFormationExports",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    })
    
    // GraphQL endpoint and arns
    
    new cdk.CfnOutput(this, 'appsyncapiid_out', {
      value: api.apiId,
      exportName: appsyncapiid_exportname
    })
    
    new cdk.CfnOutput(this, 'appsyncapiarn_out', {
      value: api.arn,
      exportName: appsyncapiarn_exportname
    })
    
    new cdk.CfnOutput(this, 'appsyncapiurl_out', {
      value: api.graphqlUrl,
      exportName: appsyncapiurl_exportname
    })
  }
}

