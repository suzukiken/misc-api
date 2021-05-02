import boto3

cloudformation_client = boto3.client('cloudformation')

def lambda_handler(event, context):
    
    next_token = None
    exports = []
    
    while True:
        if next_token:
            res = cloudformation_client.list_exports(NextToken=next_token)
        else:
            res = cloudformation_client.list_exports()
        
        for export in res['Exports']:
            exports.append(export)
        
        next_token = res.get('NextToken')
        
        if not next_token:
            break

    outputlist = []
    
    for export in exports:
        outputlist.append({
            'stack': export['ExportingStackId'],
            'name': export['Name'], 
            'value': export['Value']
        })
    
    return outputlist