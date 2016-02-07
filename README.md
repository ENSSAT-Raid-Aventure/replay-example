# replay-example
Exemple de replay d'un parcours avec fichiers Geojson et Leaflet

### npm install
* http
* url
* querystring
* express
* body-parser
* socket.io
* underscore
* fs
* assert
* mongodb

##DOCS

###API
######Mise à jour de la base pour un utilisateur donné (device_id)
    PUT : http://localhost:8080/api/update?
    device_id=020000FFFF00A120&
    new_position={lat:-5.456863,lng:45,64863}
######Ajout utilisateur dans la base
    POST : http://localhost:8080/api/add-user?
    user={"test":true,"dev_id":"020000FFFF00A122","team":{"type":"homme","name":"Team de test"}}
