/**
 * This class should be unnecessary but the backend has a bug and will drop connection if packet exceed 64KB
 * 
 * This class represent a Large Packet Sender.
 * With this, you can transmit data larger than websocket allow (i.e more than 64KB),
 * by sclicing and sending those slices one at a time.
 * Overhead is minimal (only 16 Bytes).
 * Data size can be up to 4GB (limit of header using Uint32 to represent the size of data)
 * Format : 
 * [ 4 bytes ] Payload byte length
 * [ 4 bytes ] index of payload
 * [ 4 bytes ] total of payload
 * [ 4 bytes ] unused / reserved
 * [ X bytes ] Payload 
 * @constructor Take a WebSocket as parameter
 */
export class LargePacket {
    static headerByteLength = 16;
    static maxPayloadByteLength = 64 * 1024 - LargePacket.headerByteLength; // 64KB - 16B (reserved for header)

    #socket;

    /**
     *
     * @param {WebSocket} socket WebSocket setup to send data to a LargePacket
     */
    constructor(socket) {
        this.#socket = socket;
    }

    init(onOpenCallback, receiveCallback) {
        this.#socket.onopen = async () => {
            await onOpenCallback();
        };
        this.#socket.onmessage = async (message) => {
            await this.#receive(message.data, receiveCallback);
        };
    }

    /**
     * Send data through socket
     * @param {*} rawData Any data
     */
    send(rawData) {
        if (this.#socket.readyState === WebSocket.OPEN) {
            const total = Math.ceil(rawData.byteLength / LargePacket.maxPayloadByteLength);

            for (let index = 0; index < total; index++) {
                const start = index * LargePacket.maxPayloadByteLength;
                const end = Math.min(start + LargePacket.maxPayloadByteLength, rawData.byteLength);
                const payload = rawData.slice(start, end);

                // Header 16B (4x 4B) : rawData byte length | index of payload | total of payload | reserved
                const header = new Uint32Array([rawData.byteLength, index, total]);
                const packet = new Uint8Array(LargePacket.headerByteLength + payload.byteLength);

                packet.set(new Uint8Array(header.buffer), 0);
                packet.set(new Uint8Array(payload), LargePacket.headerByteLength);

                this.#socket.send(packet);
            }
        }
    }

    #buffer = [];
    #received = 0;

    async #receive(data, callback) {
        const array = new Uint8Array(data);
        const view = new DataView(array.buffer);

        const fullPayloadByteLength = view.getUint32(0, true);
        const index = view.getUint32(4, true);
        const total = view.getUint32(8, true);
        const chunkData = array.slice(LargePacket.headerByteLength);

        this.#buffer[index] = chunkData;
        this.#received++;

        if (this.#received === total) {
            const rawData = new Uint8Array(fullPayloadByteLength);

            // Reconstruct full payload
            let offset = 0;
            for (const payload of this.#buffer) {
                rawData.set(new Uint8Array(payload), offset);
                offset += payload.length;
            }

            // Cleanup for next rawData
            this.#received = 0;
            this.#buffer = [];

            // Finally call the callback function
            await callback(rawData.buffer);
        }
    }
}