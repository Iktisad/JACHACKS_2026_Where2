https://johnabbott-my.sharepoint.com/:f:/g/personal/richard_barsalou_johnabbott_qc_ca/IgBqWcMC2fHYSaB_M9gEATtXAaeylRiI2fPlL7EZoJIGQZ0?e=5ZTx8W
floor plans

#Objective
Use the Unifi API to query the site "JAC Campus"
- Create a history of number of active wireless clients in site (graph, table, etc.)
- Create live heatmaps of occupancy based on number of wireless clients connected to rooms' corresponding access point(s)

#Rules
- provided with your unique API key for the event, PDF floor plans of Library and Herzberg building (both will be occupied during the event)
- WARNING: your API key has read/write/post permissions to a LIVE environment, do not use any DELETE, PUT, PATCH or POST methods
- do not create any new credentials (users, keys, etc.) in the platform
- all activity will be logged and may be reviewed

###Helpful tools/tips
- https://developer.ui.com/network/v10.1.84/gettingstarted
- https://unifi.ui.com/consoles/a2ceb993-b1d8-4ab6-b4fa-d77c421d266d/unifi-api/network?site=default (login required?)
- JSON to table viewer https://jsongrid.com/json-grid
- Library prefix = li, Herzberg = he


###Examples
List all sites:
curl -k -X GET "https://cd5d2039-c421-41c5-8453-d51b5ed8e6ec.unifi-hosting.ui.com/proxy/network/integration/v1/sites" -H "X-API-KEY: YOUR_API_KEY" -H "Accept: application/json"

Get all devices in site XYZ
curl -k -X GET "https://cd5d2039-c421-41c5-8453-d51b5ed8e6ec.unifi-hosting.ui.com/proxy/network/integration/v1/sites/b199057b-eb3e-38f8-a0c2-79aa971c44fe/devices" -H "X-API-KEY: YOUR_API_KEY" -H "Accept: application/json"

Get all connected clients
curl -L -g  "https://cd5d2039-c421-41c5-8453-d51b5ed8e6ec.unifi-hosting.ui.com/proxy/network/integration/v1/sites/b199057b-eb3e-38f8-a0c2-79aa971c44fe/clients?filter={type.eq('wireless'}" -H "Accept: application/json" -H "X-API-Key: YOUR_API_KEY"

Get all connected wireless clients (max 200)
curl -k -X GET "https://cd5d2039-c421-41c5-8453-d51b5ed8e6ec.unifi-hosting.ui.com/proxy/network/integration/v1/sites/88f7af54-98f8-306a-a1c7-c9349722b1f6/clients?limit=200&filter={type.eq('WIRELESS')}" -H "X-API-KEY: YOUR_API_KEY"
