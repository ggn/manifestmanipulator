import json
import urllib.request
import re
import hmac
import binascii
import hashlib
import boto3

def lambda_handler(event, context):
    path = event['path']
header = event['headers']
bucket_name = 'YOUR_BUCKET' //SOURCE BUCKET
status = event['queryStringParameters'].get('hdnts')
if status:
    token = event['queryStringParameters']['hdnts']
s3_client = boto3.client('s3')
response_url = s3_client.generate_presigned_url('get_object',
    Params = {
        'Bucket': bucket_name,
        'Key': path[1: ]
    },
    ExpiresIn = 60)
print(response_url)
data = urllib.request.urlopen(response_url)
line = data.read().decode("utf-8")
if '.m3u8' in line:
    encoded_content = line.replace('.m3u8', '.m3u8?hdnts=' + token)
elif '.ts' in line:
    encoded_content = line.replace('.ts', '.ts?hdnts=' + token)
elif '.mpd' in line:
    encoded_content = line.replace('.mpd', '.mpd?hdnts=' + token)
elif '.mp4' in line:
    encoded_content = line.replace('.mp4', '.mp4?hdnts=' + token)
return {
    'statusCode': 200,
    'body': encoded_content
}
else :
    return {
        'statusCode': 403,
        'body': 'Forbidden'
    }
