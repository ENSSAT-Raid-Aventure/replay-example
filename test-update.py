import json
import requests
import calendar
import datetime
import time
from pprint import pprint
from urllib2 import Request, urlopen, URLError

url_update = "http://localhost:8080/api/update"
url_start = "http://localhost:8080/api/start"
device_id = "020000FFFF00A122"

with open('exemple_carte/halage1.json') as data_file:
    data = json.load(data_file)
#pprint(type(data[0].geometry.coordinates))
try:
    r_ = requests.get(url_start)
except URLError, e:
    pprint("fail chef")
for coordinate in data[0]["geometry"]["coordinates"]:
    #pprint(coordinate)
    try:
        data_ = {}
        data_["device_id"] = device_id
        data_["new_position"] = {}
        data_["new_position"] = coordinate
        data_["time"] = calendar.timegm(datetime.datetime.now().timetuple())
        pprint(data_)
        r = requests.put(url_update,data = data_)
    except URLError, e:
        print 'No kittez. Got an error code:', e
    time.sleep(1);

_data = {}
_data['device_id'] = dev_id
_data['new_position'] = {}
_data['new_position']['lat'] = gps_data['coordinate'][0]
_data['new_position']['lat'] = gps_data['coordinate'][1]
_data['time'] = gps_data['timestamp']
#live_api_url = "http://84.39.44.100:8080"
if live_api_url:
    url = live_api_url + "/api/update"
    requests.put(url=url, data=_data)
