'use strict';

const crypto = require('crypto');

const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-5AB9DC65C3E5';

class WebSocketServer {
  constructor() {
    this.clients = new Set();
  }

  handleUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) { socket.destroy(); return; }

    const acceptKey = crypto.createHash('sha1').update(key + WS_MAGIC_STRING).digest('base64');

    const responseHeaders = 'HTTP/1.1 101 Switching Protocols\r Upgrade: websocket\r Connection: Upgrade\r Sec-WebSocket-Accept: ' + acceptKey + '\r \r ';


    socket.write(responseHeaders);
    this.clients.add(socket);
    socket._wsBuffer = Buffer.alloc(0);

    socket.on('data', (buffer) => {
      socket._wsBuffer = Buffer.concat([socket._wsBuffer, buffer]);
      while (socket._wsBuffer.length > 0) {
        const bytesConsumed = this._handleFrame(socket, socket._wsBuffer);
        if (bytesConsumed === 0) break;
        socket._wsBuffer = socket._wsBuffer.slice(bytesConsumed);
      }
    });

    socket.on('close', () => { this.clients.delete(socket); });
    socket.on('error', () => { this.clients.delete(socket); });
    socket.on('end', () => { this.clients.delete(socket); });
  }

  _handleFrame(socket, buffer) {
    if (buffer.length < 2) return 0;
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    const opcode = firstByte & 0x0F;
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7F;
    let offset = 2;

    if (payloadLength === 126) {
      if (buffer.length < 4) return 0;
      payloadLength = buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (buffer.length < 10) return 0;
      const highBits = buffer.readUInt32BE(2);
      const lowBits = buffer.readUInt32BE(6);
      payloadLength = (highBits * Math.pow(2, 32)) + lowBits;
      offset = 10;
    }

    let maskKey = null;
    if (isMasked) {
      if (buffer.length < offset + 4) return 0;
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    if (buffer.length < offset + payloadLength) return 0;
    let payload = buffer.slice(offset, offset + payloadLength);

    if (isMasked && maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] = payload[i] ^ maskKey[i % 4];
      }
    }

    switch (opcode) {
      case 0x01:
        try { this._onMessage(socket, payload.toString('utf8')); } catch (err) {}
        break;
      case 0x08:
        this._sendCloseFrame(socket);
        this.clients.delete(socket);
        socket.end();
        break;
      case 0x09:
        this._sendPong(socket, payload);
        break;
      case 0x0A: break;
      default: break;
    }
    return offset + payloadLength;
  }

  _onMessage(socket, message) {}

  _sendCloseFrame(socket) {
    const frame = Buffer.alloc(2);
    frame[0] = 0x88; frame[1] = 0x00;
    try { socket.write(frame); } catch (err) {}
  }

  _sendPong(socket, payload) {
    const frame = Buffer.alloc(2 + payload.length);
    frame[0] = 0x8A; frame[1] = payload.length;
    payload.copy(frame, 2);
    try { socket.write(frame); } catch (err) {}
  }

  _createTextFrame(data) {
    const payload = Buffer.from(data, 'utf8');
    let frame;
    if (payload.length < 126) {
      frame = Buffer.alloc(2 + payload.length);
      frame[0] = 0x81; frame[1] = payload.length;
      payload.copy(frame, 2);
    } else if (payload.length < 65536) {
      frame = Buffer.alloc(4 + payload.length);
      frame[0] = 0x81; frame[1] = 126;
      frame.writeUInt16BE(payload.length, 2);
      payload.copy(frame, 4);
    } else {
      frame = Buffer.alloc(10 + payload.length);
      frame[0] = 0x81; frame[1] = 127;
      frame.writeUInt32BE(0, 2);
      frame.writeUInt32BE(payload.length, 6);
      payload.copy(frame, 10);
    }
    return frame;
  }

  broadcast(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const frame = this._createTextFrame(message);
    for (const client of this.clients) {
      try { client.write(frame); } catch (err) { this.clients.delete(client); }
    }
  }

  getClientCount() { return this.clients.size; }
}

module.exports = { WebSocketServer };
