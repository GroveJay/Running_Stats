import os
import os.path
import json
from Crypto.Cipher import AES
import base64
from werkzeug.wrappers import Request, Response
from werkzeug.routing import Map, Rule
from werkzeug.exceptions import HTTPException, NotFound
from werkzeug.wsgi import SharedDataMiddleware
from werkzeug.utils import redirect
from stravalib.client import Client
from stravalib import unithelper
from inspect import getmembers
import logging

'''
athlete = client.get_athlete()
'''
logging.basicConfig(level=logging.ERROR)

meterToMile = 0.000621371
appId = "<AppId>"
appSecret = "<AppSecret>"

OAuthTokenFile = "EncryptedTokens.json"
OAuthTokenPassword = input("OAuthTokenPassword: ")

#lol, what is ECB?
cipher = AES.new(OAuthTokenPassword,AES.MODE_ECB)  # never use ECB in strong systems obviously

'''http://stackoverflow.com/a/2490376'''
def encryptToken(token):
    encryptedToken = cipher.encrypt(token)
    base64EncryptedToken = base64.b64encode(encryptedToken)
    return base64EncryptedToken.decode('utf-8')

def decryptToken(token):
    base64decoded = base64.b64decode(token)
    decryptedToken = cipher.decrypt(base64decoded)
    return decryptedToken.decode('utf-8')

def getStravaAuthParameters(athlete_id):
    parameters = {}
    parameters["state"] = athlete_id
    parameters["client_id"] = appId
    parameters["response_type"] = "code"
    parameters["redirect_uri"] = "http://grover.nothingtoseehere.xyz/Running_Stats/token_exchange"
    return parameters

def getActivityStreams(activityId, athlete_id):
    types = ['latlng','altitude','grade_smooth']
    accessToken = athleteDictionary[athlete_id]
    client = Client(access_token=accessToken)
    streams = client.get_activity_streams(activityId, types=types, resolution='high')
    return {k: v.data for k,v in streams.items()}

def getDataFromFile(dataFile):
    print("Getting Data from " + dataFile)
    r = open(dataFile, 'r')
    data = json.load(r)
    r.close()
    return data

def writeUpdatedDataToFile(data, dataFile):
    f = open(dataFile, 'w')
    print(json.dumps(data, indent=4), file=f);

def updateRunData(athlete_id):
    jsonFileName = athlete_id + ".json"
    if (not os.path.isfile(jsonFileName)):
        print("Writing a new file to " + jsonFileName)
        writeUpdatedDataToFile([], jsonFileName)
    
    accessToken = athleteDictionary[athlete_id]
    client = Client(access_token=accessToken)
    latestData = getDataFromFile(jsonFileName)
    existingActivityIds = list(d["id"] for d in latestData)

    stravaActivities = client.get_activities()
    for activity in stravaActivities:
        if (activity.id in existingActivityIds):
            print("Stopping updating activities")
            break

        a = client.get_activity(activity.id)
        if (a.type != "Run" and a.type != "Ride"):
            print("Activity was not a run, nor a bike ride")
            continue
        print("Found a new activity: ", a.id, " of type ", a.type)
        act = {}
        act["type"] = a.type
        act["date"] = a.start_date_local.strftime("%y-%m-%d")
        act["start"] = str(a.start_date_local)
        act["polyline"] = a.map.polyline
        act["id"] = a.id
        act["distance"] = unithelper.miles(a.distance).num
        act["duration"] = a.moving_time.seconds
        act["speed"] = a.average_speed.num * meterToMile * 3600
        act["pace"] = 0
        print(a.average_speed.num)
        if (a.average_speed.num != 0):
            act["pace"] = float(1 / (meterToMile*a.average_speed))
        act["name"] = a.name
        act["splits"] = []
        if (a.splits_standard is not None):
            act["splits"] = list({"time":split.elapsed_time.total_seconds() , "distance": unithelper.miles(split.distance).num } for split in a.splits_standard)

        latestData.append(act)
        writeUpdatedDataToFile(latestData, jsonFileName)

    return latestData

class Shortly():
    def __init__(self):
        self.url_map = Map([
            Rule('/', endpoint='home_url'),
            Rule('/data.json', endpoint='data'),
            Rule('/<athlete_id>_data.json', endpoint='athlete_json'),
            Rule('/<short_id>-<athlete_id>.json', endpoint='json'),
            Rule('/token_exchange', endpoint='token_exchange'),
        ])

    def on_token_exchange(self, request):
        athlete_id = request.args['state']
        athlete_token = request.args['code']
        print("Got a token to exchange for id: " + athlete_id)
        client = Client()
        accessToken = client.exchange_code_for_token(client_id=appId,
            client_secret=appSecret,
            code=athlete_token)

        '''Should verify that access token corresponds to athlete_id here
        otherwise should throw!'''
        client = Client(access_token=accessToken)
        athlete = client.get_athlete()
        if (athlete.id != athlete_id):
            print("Tried authing for an id that doesn't match, using matching id instead")
            print("Attempted Id:", athlete_id , "Actual Id:", athlete.id)
            athlete_id = str(athlete.id)

        if (athlete_id not in athleteDictionary):
            print("Athlete was not in the dictionary, adding")
            athleteDictionary[athlete_id] = accessToken
            encryptedTokens = {k: encryptToken(v.rjust(48)) for k, v in athleteDictionary.items()}
            writeUpdatedDataToFile(encryptedTokens, OAuthTokenFile)
        
        redirectUrl = "http://grover.nothingtoseehere.xyz/Running_Stats/?athlete=" + athlete_id
        return redirect(redirectUrl)

    def on_athlete_json(self, request, athlete_id):
        if (athlete_id in athleteDictionary):
            print("Found Athlete: " + athlete_id)
            return Response(json.dumps(updateRunData(athlete_id)), mimetype="application/json")
        else:
            print("Could not find athlete: " + athlete_id)
            return Response(json.dumps(getStravaAuthParameters(athlete_id)), mimetype="application/json")

    def on_home_url(self, request):
        return Response("HELLO_WORLD", mimetype='text/html')

    def on_json(self, request, short_id, athlete_id):
        return Response(json.dumps(getActivityStreams(short_id, athlete_id)), mimetype='application/json')

    def on_data(self, request):
        return Response(json.dumps(updateRunData()), mimetype='application/json')

    def dispatch_request(self, request):
        adapter = self.url_map.bind_to_environ(request.environ)
        try:
            endpoint, values = adapter.match()
            return getattr(self, 'on_' + endpoint)(request, **values)
        except NotFound as e:
            return Response("ERROR", mimetype='text/html')
        except HTTPException as e:
            return e

    def wsgi_app(self, environ, start_response):
        request = Request(environ)
        response = self.dispatch_request(request)
        return response(environ, start_response)

    def __call__(self, environ, start_response):
        return self.wsgi_app(environ, start_response)

OAuthFileData = getDataFromFile(OAuthTokenFile)
athleteDictionary = {k: decryptToken(v).strip() for k, v in OAuthFileData.items()}

if __name__ == '__main__':
    from werkzeug.serving import run_simple
    run_simple('127.0.0.1', 5000, Shortly(), use_debugger=True, use_reloader=True)