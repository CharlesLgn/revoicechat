export class CryptoPacket {
    /**
     * REQUEST key :
     * [ 1 byte  ] Packet type REQUEST
     * [ 8 bytes ] RequestId
     * [ N bytes ] Temporary public key
     *
     * ANSWER key :
     * [ 1 byte  ] Packet type ANSWER
     * [ 8 bytes ] RequestId
     * [ N bytes ] Encrypted Voice Key
     *
     * DATA :
     * [  1 byte  ] Packet type DATA
     * [ 12 bytes ] Initiation Vector
     * [  N bytes ] Payload
     */

    static DATA = 0;
    static REQUEST = 1;
    static ANSWER = 2;

    #encryptionKey;
    #temporaryKeys;
    #requestId;
    #sendCallback;

    constructor(sendCallback) {
        this.#sendCallback = sendCallback;
    }

    async init(onlySelf) {
        if (onlySelf) {
            await this.#generateEncryptionKey();
        } else {
            await this.#requestEncryptionKey();
        }
    }

    async #generateEncryptionKey() {
        this.#encryptionKey = await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true, // extractable
            ["encrypt", "decrypt"],
        );
    }

    async #requestEncryptionKey() {
        if (!this.#temporaryKeys) {
            this.#temporaryKeys = await crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"],
            );
            this.#requestId = crypto.getRandomValues(new Uint8Array(8));
        }

        const exportedPublic = await crypto.subtle.exportKey("spki", this.#temporaryKeys.publicKey);

        const buffer = new ArrayBuffer(1 + 8 + exportedPublic.byteLength);
        const uint8buffer = new Uint8Array(buffer);
        let offset = 0;

        // Set type REQUEST
        uint8buffer.set([CryptoPacket.REQUEST], 0);
        offset += 1;

        // Set requestId
        uint8buffer.set(this.#requestId, offset);
        offset += 8;

        // Set publicKey
        uint8buffer.set(new Uint8Array(exportedPublic), offset);

        this.#sendCallback(buffer);
    }

    async #importEncryptionKey(data) {
        // No temp keys OR Not our requestID
        if (!this.#temporaryKeys || new Uint8Array(data.slice(0, 8)).toBase64() != this.#requestId.toBase64()) {
            return;
        }

        const voiceKeyBuffer = data.slice(8);
        const decryptedVoiceKey = await crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            this.#temporaryKeys.privateKey,
            voiceKeyBuffer,
        );

        this.#encryptionKey = await crypto.subtle.importKey("raw", decryptedVoiceKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);

        this.#temporaryKeys = null;
    }

    async #exportVoiceKey(data) {
        const requestId = new Uint8Array(data.slice(0, 8));
        const publicKeyBuffer = data.slice(8);

        const publicKey = await crypto.subtle.importKey(
            "spki",
            publicKeyBuffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            false,
            ["encrypt"],
        );

        const exportedVoiceKey = await crypto.subtle.exportKey("raw", this.#encryptionKey);

        const encryptedVoiceKey = await crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            publicKey,
            exportedVoiceKey,
        );

        const buffer = new ArrayBuffer(1 + 8 + encryptedVoiceKey.byteLength);
        const uint8buffer = new Uint8Array(buffer);
        let offset = 0;

        // Set type ANSWER
        uint8buffer.set([CryptoPacket.ANSWER], offset);
        offset += 1;

        // Set requestId
        uint8buffer.set(requestId, offset);
        offset += 8;

        // Set data
        uint8buffer.set(new Uint8Array(encryptedVoiceKey), offset);

        this.#sendCallback(buffer);
    }

    async encrypt(data) {
        if (!this.#encryptionKey) {
            console.warn("encryptionKey not found to encrypt");
            return;
        }

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptData = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.#encryptionKey, data);
        const buffer = new ArrayBuffer(1 + 12 + encryptData.byteLength);
        const uint8buffer = new Uint8Array(buffer);
        let offset = 0;

        // Set type DATA
        uint8buffer.set([CryptoPacket.DATA], offset);
        offset += 1;

        // Set IV
        uint8buffer.set(iv, offset);
        offset += 12;

        // Set payload
        uint8buffer.set(new Uint8Array(encryptData), offset);

        this.#sendCallback(buffer);
    }

    async #decryptData(data) {
        if (!this.#encryptionKey) {
            console.warn("encryptionKey not found to decrypt");
            this.#requestEncryptionKey();
            return null;
        }

        const iv = new Uint8Array(data, 0, 12);
        const payload = new Uint8Array(data, 12, data.byteLength - 12);
        return await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.#encryptionKey, payload);
    }

    /**
     * @param {ArrayBuffer} data
     */
    async decrypt(data) {
        const type = new Uint8Array(data)[0];
        const payload = data.slice(1);

        switch (type) {
            case CryptoPacket.DATA:
                return await this.#decryptData(payload);

            case CryptoPacket.REQUEST:
                await this.#exportVoiceKey(payload);
                return null;

            case CryptoPacket.ANSWER:
                await this.#importEncryptionKey(payload);
                return null;
        }
    }
}
