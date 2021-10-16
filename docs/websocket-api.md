# Sineware Cloud Service Websockets Gateway
The gateway server uses JSON messages.

Send and Receive are from the client perspective unless otherwise noted.

In general, all messages sent to the gateway will be responded to with a "-ack" 
action and success state. 

# Identification
(type: user or device)
Send:
```json
{"action":  "hello", "payload": {"type": "user", "token": "token_goes_here", "info":  {}} }
```
Receive:
```json
{"action":  "hello-ack", "payload": {"success": true} }
```

You can receive a token by authenticating with AuthServer first.

# General
Receive:
```json
{"action":  "error", "payload": {"message": "Some unexpected error message"} }
```

# Internal Messages
These are only able to be used by superusers.
