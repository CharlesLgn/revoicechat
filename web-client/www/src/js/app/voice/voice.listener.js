export default class Listener {
    #id;
    #decoder;
    #playhead = 0;
    #muted;
    #gainNode;
    #outputGain;
    #audioContext;
    #controller;

    constructor(id, controller, codec, settings, audioContext, outputGain) {
        this.#id = id;
        this.#controller = controller;
        this.#audioContext = audioContext;
        this.#outputGain = outputGain;
        this.#muted = settings.muted;

        // Gain
        try {
            this.#gainNode = audioContext.createGain();
        }
        catch {
            throw new Error(`Can't create gainNode for user ${id}`);
        }
        
        this.#gainNode.gain.setValueAtTime(settings.volume, audioContext.currentTime);
        this.#gainNode.connect(this.#outputGain);

        this.#outputGain.connect(this.#audioContext.destination);

        // Set user decoder
        this.#decoder = new AudioDecoder({
            output: (audioData) => {
                this.#playback(audioData);
            },
            error: (error) => {
                throw new Error(`Decoder setup failed:\n${error.name}\nCurrent codec :${codec}`);
            },
        });

        this.#decoder.configure(codec);
    }

    async close() {
        await this.#decoder.flush();
        this.#decoder.close();
    }

    setMute(muted) {
        this.#muted = muted;
    }

    setVolume(volume) {
        this.#gainNode.gain.setValueAtTime(volume, this.#audioContext.currentTime);
    }

    #playback(audioData) {
        const buffer = this.#audioContext.createBuffer(audioData.numberOfChannels, audioData.numberOfFrames, audioData.sampleRate);

        const channelData = new Float32Array(audioData.numberOfFrames);
        audioData.copyTo(channelData, { planeIndex: 0 });
        buffer.copyToChannel(channelData, 0);

        // Play the audio buffer
        const source = this.#audioContext.createBufferSource();
        source.buffer = buffer;

        source.connect(this.#gainNode); // Connect audio source to gain

        this.#playhead = Math.max(this.#playhead, this.#audioContext.currentTime) + buffer.duration;
        source.start(this.#playhead);
        audioData.close();
    }

    decodeAudio(decodedVoiceTransport, selfDeaf) {
        // User self mute
        this.#controller.setUserMute(this.#id, decodedVoiceTransport.user.selfMute);

        // User self deaf
        this.#controller.setUserDeaf(this.#id, decodedVoiceTransport.user.selfDeaf);

        // If user sending packet is locally muted OR we are deaf, we stop
        if (this.#muted || selfDeaf) {
            this.#controller.setUserGlow(this.#id, false);
            return;
        }

        // User gate open/close
        this.#controller.setUserGlow(this.#id, decodedVoiceTransport.user.gateState);

        // Decode and read audio
        if (this.#decoder !== null && this.#decoder.state === "configured") {
            this.#decoder.decode(
                new EncodedAudioChunk({
                    type: "key",
                    timestamp: Math.round(decodedVoiceTransport.timestamp * 1000),
                    data: new Uint8Array(decodedVoiceTransport.data),
                }),
            );
        } else {
            console.error(`User '${this.#id}' has no decoder`);
        }
    }
}