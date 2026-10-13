---
title: TCP three-way handshake
subtitle: How two hosts agree to talk (minilab fixture)
template: sheet
theme: blueprint
cols: 3
style: off
source: RFC 9293 · SkilledDragon fixture
---
TCP opens a connection with three messages. Sequence numbers keep both sides in step.

## A Three-way handshake {span=2}
```sequence num
participants: Client, Server
note Server: LISTEN
Client -> Server: SYN, seq=x
note Client: SYN_SENT
Server -> Client: SYN+ACK, seq=y, ack=x+1
Client -> Server: ACK, ack=y+1
note Client, Server: ESTABLISHED
```

## B Why three messages
1. The server learns that the client can send.
2. The client learns that the server can send and receive.
3. The server learns that the client can receive.

## C Flags
| Flag | Job | In handshake |
|---|---|---|
| SYN | Start a connection | ok steps 1, 2 |
| ACK | Confirm receipt | ok steps 2, 3 |
| FIN | Stop sending | no not used |
