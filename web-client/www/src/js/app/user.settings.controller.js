import VoiceCall from "./voice/voice.js";
import {LanguageController} from "./language.controller.js";
import {SpinnerOnButton} from "../component/button.spinner.component.js";
import {getAllDeclaredDataThemes} from "../component/theme.component.js";
import {i18n} from "../lib/i18n.js";
import MediaServer from "./media/media.server.js";
import CoreServer from "./core/core.server.js";
import Modal from "../component/modal.component.js";
import {copyToClipboard, getUserLanguage} from "../lib/tools.js";
import {handleDragAndDrop} from "./file/drag.and.drop.js";
import {addEmoteViaDragAndDrop} from "../component/emoji.manager.component.js";

export default class UserSettingsController {
    #user;
    #room;
    #inputTest = {
        active: false,
        animationId: null,
        audioContext: null,
        gainNode: null,
        gateNode: null,
        compressorNode: null,
    }
    #currentTab;
    #theme = 'dark';
    #lang = getUserLanguage();
    /** @type {"default"|"compact"}  */
    messageSetting = 'default';
    #password = {
        password: '',
        newPassword: '',
        confirmPassword: '',
    }
    #newProfilPictureFile;

    voice = structuredClone(VoiceCall.DEFAULT_SETTINGS);
    #audioOutput = {
        notification: 0.25,
        voice: 1,
        stream: 0.5,
    }

    constructor(user) {
        this.#user = user;

        // Add events
        this.#selectEventHandler();
        this.#overviewEventHandler();
        this.#audioInputEventHandler();
        this.#audioOutputEventHandler();

        this.select('overview');
    }

    setRoom(room) {
        this.#room = room;
    }

    async save() {
        const settings = {
            voice: this.voice,
            theme: this.#theme,
            lang: this.#lang,
            audioOutput: this.#audioOutput,
            messageSetting: this.messageSetting,
        }
        await CoreServer.fetch(`/settings/me`, 'PATCH', settings);
    }

    async load() {
        const storedSettings = await CoreServer.fetch(`/settings/me`, 'GET');
        if (storedSettings !== null) {
            this.#loadVoiceSettings(storedSettings);
            this.#loadAudioSettings(storedSettings);
            this.#loadTheme(storedSettings);
            this.#loadLang(storedSettings);
            this.#loadMessageSettings(storedSettings);
        }
        document.documentElement.dataset.theme = this.#theme;

        // UI
        this.#overviewLoad();
        await this.#authSettingsOverviewLoad();
        this.#themeLoadPreviews();
        this.#messageSettingsLoad();
        this.#emoteLoad();
        this.#audioInputLoad();
        this.#audioOutputLoad();
        await LanguageController.loadAvailableLanguage();
    }


    #loadVoiceSettings(storedSettings) {
        if (storedSettings.voice) {
            this.voice.self = storedSettings.voice.self || this.voice.self;
            this.voice.users = storedSettings.voice.users || this.voice.users;
            this.voice.compressor = storedSettings.voice.compressor || this.voice.compressor;
            this.voice.gate = storedSettings.voice.gate || this.voice.gate;
            this.voice.noiseSuppression = storedSettings.voice.noiseSuppression || this.voice.noiseSuppression;
        }
    }

    #loadAudioSettings(storedSettings) {
        if (storedSettings.audioOutput) {
            this.#audioOutput = storedSettings.audioOutput;
        }
    }

    #loadTheme(storedSettings) {
        if (storedSettings.theme) {
            this.#theme = storedSettings.theme;
            this.#loadInTextarea();
        }
    }

    #loadLang(storedSettings) {
        if (storedSettings.lang) {
            this.#lang = storedSettings.lang;
        }
    }

    #loadMessageSettings(storedSettings) {
        if (storedSettings.messageSetting) {
            this.messageSetting = storedSettings.messageSetting;
        }
    }

    /** @return {string} */
    getLanguage() {
        return this.#lang;
    }

    /** @return {string} */
    getMessageSetting() {
        return this.messageSetting;
    }

    /** @param {string} messageSetting */
    setMessageSetting(messageSetting) {
        this.messageSetting = messageSetting;
    }

    /** @param {string} lang */
    setLangage(lang) {
        this.#lang = lang
    }

    select(name) {
        if (this.#currentTab) {
            document.getElementById(`user-setting-tab-${this.#currentTab}`).classList.remove("active");
            document.getElementById(`user-setting-content-${this.#currentTab}`).classList.add("hidden");
        }

        this.#currentTab = name;
        document.getElementById(`user-setting-tab-${name}`).classList.add('active');
        document.getElementById(`user-setting-content-${name}`).classList.remove('hidden');
    }

    #selectEventHandler() {
        const parameters = ['overview', 'appearance', 'emotes', 'audio-input', 'audio-output'];
        for (const param of parameters) {
            document.getElementById(`user-setting-tab-${param}`).addEventListener('click', () => this.select(param));
        }

        document.getElementById(`user-setting-tab-logout`).addEventListener('click', () => this.#user.logout());
    }

    #overviewLoad() {
        this.#newProfilPictureFile = null
        document.getElementById("setting-user-uuid").innerText = this.#user.id;
        document.getElementById("settings-user-name").value = this.#user.displayName;
        document.getElementById('settings-user-login').innerText = this.#user.login;
        document.getElementById("setting-user-picture").src = MediaServer.profiles(this.#user.id);
        document.getElementById("setting-user-picture").dataset.id = this.#user.id;
        document.getElementById("overview-picture-new").addEventListener("change", () => {
            this.#changePicture(document.getElementById("overview-picture-new").files[0]);
        });
        handleDragAndDrop('user-setting-content-overview', (event) => {
            const file = event.dataTransfer.files.item(0);
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (file && validTypes.includes(file.type))
                this.#changePicture(file);
        });
    }

    #changePicture(file) {
        if (file) {
            this.#newProfilPictureFile = file;
            document.getElementById("overview-picture").value = file.name;
            document.getElementById("setting-user-picture").src = URL.createObjectURL(file);
            document.getElementById("setting-user-picture").style.display = "block";
        }
    }

    async #authSettingsOverviewLoad() {
        /** @type {UserAuthSettings} */
        const authSettings = await CoreServer.fetch(`/settings/me/auth`, 'GET');
        const activeTotp = document.getElementById('user-totp-status-active');
        const inactiveTotp = document.getElementById('user-totp-status-inactive');
        activeTotp.classList.add('hidden')
        inactiveTotp.classList.add('hidden')
        if (authSettings.totpActive) {
            activeTotp.classList.remove('hidden')
        } else {
            inactiveTotp.classList.remove('hidden')
        }
        const badge = document.getElementById('user-recovery-code-left')
        badge.dataset.i18nValue = authSettings.remainingRecoveryCode.toString();
        if (authSettings.remainingRecoveryCode <= 4) {
            badge.classList.add('red')
            badge.classList.remove('yellow')
        } else {
            badge.classList.remove('red')
            badge.classList.add('yellow')
        }
    }

    #overviewEventHandler() {
        document.getElementById('overview-save').addEventListener('click', () => this.#overviewSave());
        document.getElementById('regenerate-recover-codes').addEventListener('click', () => this.#regenerateRecoverCodes());
        document.getElementById('generate-totp-workflow').addEventListener('click', () => this.#newTotpWorkflow());
        document.getElementById('setting-user-picture').addEventListener('click', () => this.#overviewSelectPicture());
        document.getElementById('overlay-setting-user-picture').addEventListener('click', () => this.#overviewSelectPicture());
        document.getElementById('setting-user-uuid-copy').addEventListener('click', () => this.#copyUserUUID());
    }

    async #overviewSave() {
        const spinner = new SpinnerOnButton("overview-save")
        spinner.run()
        await this.#overviewChangeData();
        await this.#overviewChangePicture();
        spinner.success()
    }

    async #regenerateRecoverCodes() {
        let password = ''
        Modal.toggle({
            title: i18n.translateOne("user.password.enter"),
            showCancelButton: true,
            html: `
            <form class='popup' id="regenerate-recovery-code-form">
              <input type="password" name="password" id="regenerate-recovery-code-password">
            </form>`,
            didOpen: async () => {
                const select = document.getElementById('regenerate-recovery-code-password');
                select.oninput = () => { password = select.value };
                i18n.translatePage(document.getElementById("modal-serverId"))
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const recovered = await CoreServer.fetch(`/auth/recovery-codes`, 'POST', {
                    username: this.#user.login,
                    password: password
                });
                if (!recovered) {
                    await Modal.toggleError('')
                }
                if (recovered.error) {
                    await Modal.toggleError(recovered.error)
                } else {
                    await Modal.toggle({
                        icon: "success",
                        html: `<div data-i18n="login.register.success.recover.codes">your recover codes</div>
                               <div style="background-color: var(--pri-bg-color); padding: 1rem; margin: 1rem;">
                                  <div class="icon" id="recover-codes-clip" style="position: absolute; cursor: pointer;">
                                      <revoice-icon-clipboard></revoice-icon-clipboard>
                                  </div>
                                  <code id="recover-codes"></code>
                               </div>`,
                        width:'30rem',
                        didOpen: async () => {
                            const codes = document.getElementById('recover-codes');
                            codes.innerText = recovered.join('\n')
                            const clipButton = document.getElementById('recover-codes-clip');
                            clipButton.onclick = () => {
                                copyToClipboard(recovered.join('\n'))
                            }
                        },
                        allowOutsideClick: false,
                    })
                }
            }
        });
    }

    #newTotpWorkflow() {
        let password = ''
        Modal.toggle({
            title: i18n.translateOne("user.password.enter"),
            showCancelButton: true,
            html: `
            <form class='popup' id="generate-totp-workflow-form">
              <input type="password" name="password" id="generate-totp-workflow-password">
            </form>`,
            didOpen: async () => {
                const select = document.getElementById('generate-totp-workflow-password');
                select.oninput = () => { password = select.value };
                i18n.translatePage(document.getElementById("modal-serverId"))
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const workflow = await CoreServer.simpleFetch(`/auth/totp-secret`, 'POST', {
                    username: this.#user.login,
                    password: password
                });
                const url = workflow.headers.get('x-totp-url')
                if (workflow.ok) {
                    const blob = await workflow.blob();
                    const png = URL.createObjectURL(blob);
                    await this.#toggleTOTPValidation(url, png)
                } else {
                    await Modal.toggleError('')
                }
            }
        });
    }

    async #toggleTOTPValidation(url, png, error = false) {
        let code = ''
        await Modal.toggle({
            icon: error ? "error" : "success",
            showCancelButton: true,
            html: `<div data-i18n="login.register.success.recover.codes">your recover codes</div>
                   <form class="popup" style="display: flex; flex-direction: column; background-color: var(--pri-bg-color); padding: 1rem; margin: 1rem;">
                      <img src="${png}" alt="${url}"/>
                      <code style="overflow-wrap: break-word;">${url}</code>
                      <input type="text" name="password" id="totp-code">
                   </form>`,
            width: '30rem',
            didOpen: async () => {
                const select = document.getElementById('totp-code');
                select.oninput = () => { code = select.value };
            },
            allowOutsideClick: false,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const workflow = await CoreServer.simpleFetch(`/auth/totp-secret`, 'PUT', code);
                if (workflow.ok) {
                    await this.#authSettingsOverviewLoad();
                    await Modal.toggle({icon: "success", title: i18n.translateOne('login.register.success.recover.codes')})
                } else {
                    await this.#toggleTOTPValidation(url, png, true)
                }
            }
        })
    }

    async #overviewChangeData() {
        const displayName = document.getElementById("settings-user-name").value
        const password = document.getElementById("settings-user-old-password").value
        const newPassword = document.getElementById("settings-user-new-password").value
        const confirmPassword = document.getElementById("settings-user-new-password-confirm").value
        if (displayName && displayName !== "") {
            const result = await CoreServer.fetch(`/user/me`, 'PATCH', {
                displayName: displayName,
                password: {
                    password: password,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                }
            });
            if (result) {
                this.#user.displayName = result.displayName
                document.getElementById("settings-user-name").value = result.displayName;
            }
        } else {
            await Modal.toggleError(i18n.translateOne("user.name.error"));
        }
    }

    async #overviewChangePicture() {
        if (document.getElementById("overview-picture").value && this.#newProfilPictureFile) {
            const formData = new FormData();
            formData.append("file", this.#newProfilPictureFile);
            await MediaServer.fetch(`/profiles/${this.#user.id}`, 'POST', formData);
            this.#newProfilPictureFile = null
            document.getElementById("overview-picture").value = null
        }
    }

    #overviewSelectPicture() {
        document.getElementById("overview-picture-new").click();
    }

    #copyUserUUID() {
        copyToClipboard(this.#user.id);
    }

    #themeLoadPreviews() {
        const themeForm = document.getElementById("setting-themes-form");
        for (const theme of getAllDeclaredDataThemes()) {
            const button = document.createElement('button');
            button.onclick = () => this.#themeChange(theme);
            button.className = "theme-select-button";
            button.innerHTML = `<revoice-theme-preview theme="${theme}"></revoice-theme-preview>`;
            themeForm.appendChild(button)
        }
    }

    #messageSettingsLoad() {
        const select = document.getElementById("setting-message-selection");
        for (const key of ["default", "compact"]) {
            const option = document.createElement('option');
            option.value = key
            option.innerText = key
            option.selected = (key === RVC.user.settings.getMessageSetting())
            select.appendChild(option);
        }
        select.addEventListener("change", async (event) => {
            const value = event.target.value;
            RVC.user.settings.setMessageSetting(value);
            await RVC.user.settings.save();
            this.buildMessageExemple();
            await this.#reloadMessage();
        });
    }

    buildMessageExemple() {
        const holder = document.querySelector("#setting-message-exemple")
        for (const elt of holder.querySelectorAll("div")) {
            elt.remove();
        }
        holder.append(this.#fakeMessage("Hello world 🦜"));
        const translatedMessage1 = this.#fakeMessage(i18n.translateOne("user.message.exemple1.body"));
        const translatedMessage2 = this.#fakeMessage(i18n.translateOne("user.message.exemple2.body"));
        holder.append(translatedMessage1);
        holder.append(translatedMessage2);
        holder.append(this.#fakeMessage("🦜"));
    }

    #fakeMessage(text) {
        const message = /** @type {MessageRepresentation} */{
            id: "setting-message-exemple-body",
            text: text,
            roomId: "test",
            createdDate: "2025-12-23 24:00Z",
            updatedDate: null,
            medias: [],
            emotes: [],
            reactions: [],
            user: {
                id: this.#user.id,
                displayName: this.#user.displayName,
            },
        }
        return RVC.room.textController.create(message, {urlPreview: false});
    }


    async #reloadMessage() {
        RVC.room.textController.clearCache();
        await RVC.room.textController.load(RVC.room.id);
    }

    #themeChange(theme) {
        this.#theme = theme;
        this.save();
        for (const elt of document.querySelectorAll("revoice-message")) {
            elt.dataset.theme = theme;
        }
        this.#loadInTextarea();
        document.documentElement.dataset.theme = theme;
        for (const elt of document.querySelectorAll(`revoice-theme-preview`)) {
            elt.parentElement.disabled = false
        }
        document.querySelector(`revoice-theme-preview[theme="${theme}"]`).parentElement.disabled = true;
    }

    #loadInTextarea() {
        for (const elt of document.querySelectorAll("revoice-textarea")) {
            elt.dataset.theme = this.#theme;
        }
    }

    #emoteLoad() {
        const emoteForm = document.getElementById("user-setting-emotes-form");
        CoreServer.fetch(`/emote/me`).then(response => {
            emoteForm.innerHTML = `
            <script type="application/json" slot="emojis-data">
                ${JSON.stringify(response)}
            </script>`;
        });
        handleDragAndDrop('user-setting-content-emotes', (event) => addEmoteViaDragAndDrop(emoteForm, event));
        handleDragAndDrop('user-setting-content-overview', (event) => {
            const file = event.dataTransfer.files.item(0);
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (file && validTypes.includes(file.type))
                this.#changePicture(file);
        });
    }

    // Audio Input
    #audioInputEventHandler() {
        document.getElementById('compressor-enabled').addEventListener('click', () => this.#compressorEnabled());
        document.getElementById('rnoise-enabled').addEventListener('click', () => this.#rnoiseEnabled());
        document.getElementById('agc-enabled').addEventListener("click", () => this.#agcEnabled());

        const testElement = document.getElementById('audio-input-test');
        testElement.addEventListener("click", async () => await this.#audioInputTest(testElement));

        const parameters = [
            'input-volume',
            'gate-threshold',
        ]

        for (const param of parameters) {
            const element = document.getElementById(param);
            element.addEventListener('input', () => this.#audioInputUpdateUI(param, element));
            element.addEventListener('change', () => this.#audioInputApplyParameter(param, element));
        }
    }

    #audioInputLoad() {
        // Volume
        i18n.updateValue(document.getElementById("input-volume-label"), String(Math.round(this.voice.self.volume * 100)));
        document.getElementById("input-volume").value = this.voice.self.volume;

        // Voice detection
        i18n.updateValue(document.getElementById("gate-threshold-label"), (this.voice.gate.threshold).toString());
        document.getElementById("gate-threshold").value = this.voice.gate.threshold;
        document.getElementById("gate-threshold").title = this.voice.gate.threshold + "dB";

        // Compressor
        const buttonEnabled = document.getElementById('compressor-enabled')
        buttonEnabled.classList.remove('active');
        if (this.voice.compressor.enabled) {
            buttonEnabled.classList.add('active');
        }

        // Legacy noise removal
        const buttonRNoiseEnabled = document.getElementById('rnoise-enabled')
        buttonRNoiseEnabled.classList.remove('active');
        if (this.voice.noiseSuppression.legacy) {
            buttonRNoiseEnabled.classList.add('active');
        }

        // Legacy noise removal
        const buttonAGCEnabled = document.getElementById('agc-enabled')
        buttonAGCEnabled.classList.remove("active");
        if (this.voice.autoGainControl) {
            buttonAGCEnabled.classList.add("active");
        }
    }

    #audioInputUpdateUI(param, element) {
        switch (param) {
            case 'input-volume':
                i18n.updateValue(document.getElementById("input-volume-label"), String(Math.round(element.value * 100)));
                if (this.#inputTest.active) {
                    this.#inputTest.gainNode.gain.setValueAtTime(Number.parseFloat(element.value), this.#inputTest.audioContext.currentTime);
                }
                break;
            case 'gate-threshold': {
                i18n.updateValue(document.getElementById("gate-threshold-label"), (element.value).toString());
                if (this.#inputTest.active) {
                    this.#inputTest.gateNode.parameters.get("threshold").setValueAtTime(Number.parseFloat(element.value), this.#inputTest.audioContext.currentTime);
                }
                break;
            }
        }
    }

    #audioInputApplyParameter(param, element) {
        switch (param.split('-')[0]) {
            case 'input':
                this.#inputVolumeUpdate(element);
                break;
            case 'gate':
                this.#gateApplyParameter(param, element);
                break;
        }
    }

    #inputVolumeUpdate(data) {
        this.voice.self.volume = Number.parseFloat(data.value)
        this.save();
        this.#room.voiceController.setSelfVolume();
    }

    #gateApplyParameter(param, data) {
        if (param === 'gate-threshold') {
            this.voice.gate.threshold = Number.parseInt(data.value);
        }

        this.save();
        this.#room.voiceController.updateGate();
    }

    async #audioInputTest(element) {
        this.#inputTest.active = !this.#inputTest.active;

        if (this.#inputTest.active) {
            await this.#startInputTest();
            element.innerText = "Stop test";
        }
        else {
            await this.#stopInputTest();
            element.innerText = "Start test";
        }
    }

    async #startInputTest() {
        let displayLevel = 0;

        this.#inputTest.audioContext = new AudioContext();
        await this.#inputTest.audioContext.audioWorklet.addModule("src/js/app/utils/audio.processors.js");

        const gateLevel = document.getElementById('gate-level');
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: this.voice.noiseSuppression.legacy,
                autoGainControl: this.voice.autoGainControl,
            },
        });
        const micSource = this.#inputTest.audioContext.createMediaStreamSource(stream);

        // Filters
        const filterHigh = this.#inputTest.audioContext.createBiquadFilter();
        filterHigh.type = "highpass";
        filterHigh.frequency.value = 40;
        filterHigh.Q.value = 0.7;

        const filterLow = this.#inputTest.audioContext.createBiquadFilter();
        filterLow.type = "lowpass";
        filterLow.frequency.value = 8000;
        filterLow.Q.value = 0.7;

        micSource.connect(filterHigh);
        filterHigh.connect(filterLow);

        // Gain
        this.#inputTest.gainNode = this.#inputTest.audioContext.createGain();
        this.#inputTest.gainNode.gain.setValueAtTime(this.voice.self.volume, this.#inputTest.audioContext.currentTime);
        filterLow.connect(this.#inputTest.gainNode);

        // Gate
        this.#inputTest.gateNode = new AudioWorkletNode(this.#inputTest.audioContext, "NoiseGate", {
            parameterData: {
                attack: VoiceCall.GATE_SETTINGS.attack,
                release: VoiceCall.GATE_SETTINGS.release,
                threshold: this.voice.gate.threshold,
            },
        });
        this.#inputTest.gainNode.connect(this.#inputTest.gateNode);

        let previousNode = this.#inputTest.gainNode;

        // Compressor
        if (this.voice.compressor.enabled) {
            this.#inputTest.compressorNode = this.#inputTest.audioContext.createDynamicsCompressor();
            this.#inputTest.compressorNode.attack.setValueAtTime(VoiceCall.COMPRESSOR_SETTINGS.attack, this.#inputTest.audioContext.currentTime);
            this.#inputTest.compressorNode.knee.setValueAtTime(VoiceCall.COMPRESSOR_SETTINGS.knee, this.#inputTest.audioContext.currentTime);
            this.#inputTest.compressorNode.ratio.setValueAtTime(VoiceCall.COMPRESSOR_SETTINGS.ratio, this.#inputTest.audioContext.currentTime);
            this.#inputTest.compressorNode.release.setValueAtTime(VoiceCall.COMPRESSOR_SETTINGS.release, this.#inputTest.audioContext.currentTime);
            this.#inputTest.compressorNode.threshold.setValueAtTime(VoiceCall.COMPRESSOR_SETTINGS.threshold, this.#inputTest.audioContext.currentTime);

            // Connect gate to compressor
            this.#inputTest.gainNode.connect(this.#inputTest.compressorNode);
            
            previousNode = this.#inputTest.compressorNode;
        }

        // Loopback
        previousNode.connect(this.#inputTest.audioContext.destination);        

        // Analyser
        const analyser = this.#inputTest.audioContext.createAnalyser();
        analyser.fftSize = 1024;
        previousNode.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);

        function update() {
            const rmsToDb = (rms) => 20 * Math.log10(rms);
            analyser.getFloatTimeDomainData(buffer);

            let sum = 0;
            for (const element of buffer) {
                sum += element * element;
            }

            const rms = Math.sqrt(sum / buffer.length);
            const normalized = Math.max(0, Math.min(1, (rmsToDb(rms) + 60) / 60));

            displayLevel += (normalized - displayLevel) * 0.3;
            displayLevel = Math.max(0.001, Math.min(1, (displayLevel)));

            gateLevel.style.width = `${displayLevel * 100}%`;
            requestAnimationFrame(update);
        }

        update();
    }

    async #stopInputTest() {
        await this.#inputTest.audioContext?.close();
    }

    #compressorEnabled() {
        this.voice.compressor.enabled = !this.voice.compressor.enabled;
        this.save();
        this.#audioInputLoad();

        if (this.#inputTest.active) {
            this.#stopInputTest();
            this.#startInputTest();
        }
    }

    #rnoiseEnabled() {
        this.voice.noiseSuppression.legacy = !this.voice.noiseSuppression.legacy;
        this.save();
        this.#audioInputLoad();

        if (this.#inputTest.active) {
            this.#stopInputTest();
            this.#startInputTest();
        }
    }

    #agcEnabled() {
        this.voice.autoGainControl = !this.voice.autoGainControl;
        this.save();
        this.#audioInputLoad();

        if (this.#inputTest.active) {
            this.#stopInputTest();
            this.#startInputTest();
        }
    }

    // Audio Output
    getNotificationVolume() {
        return this.#audioOutput.notification;
    }

    getVoiceVolume() {
        return this.#audioOutput.voice;
    }

    getStreamVolume() {
        return this.#audioOutput.stream;
    }

    #audioOutputEventHandler() {
        const parameters = [
            'output-notification-volume',
            'output-voice-volume',
            'output-stream-volume',
        ]

        for (const param of parameters) {
            const element = document.getElementById(param);
            element.addEventListener('input', () => this.#audioOutputUpdateUI(param, element.value));
            element.addEventListener('change', () => this.#audioOutputApplyParameter(param, element.value));
        }
    }

    #audioOutputLoad() {
        document.getElementById('output-notification-volume').value = this.#audioOutput.notification;
        this.#audioOutputUpdateUI('output-notification-volume', this.#audioOutput.notification);

        document.getElementById('output-voice-volume').value = this.#audioOutput.voice;
        this.#audioOutputUpdateUI('output-voice-volume', this.#audioOutput.voice);

        document.getElementById('output-stream-volume').value = this.#audioOutput.stream;
        this.#audioOutputUpdateUI('output-stream-volume', this.#audioOutput.stream);
    }

    #audioOutputUpdateUI(param, value) {
        switch (param) {
            case 'output-notification-volume':
                document.getElementById('output-notification-label').innerText = `${Math.round(value * 100)}%`;
                break;
            case 'output-voice-volume':
                document.getElementById('output-voice-label').innerText = `${Math.round(value * 100)}%`;
                break;
            case 'output-stream-volume':
                document.getElementById('output-stream-label').innerText = `${Math.round(value * 100)}%`;
                break;
        }
    }

    #audioOutputApplyParameter(param, value) {
        switch (param) {
            case 'output-notification-volume':
                this.#audioOutput.notification = value;
                break;
            case 'output-voice-volume':
                this.#audioOutput.voice = value;
                break;
            case 'output-stream-volume':
                this.#audioOutput.stream = value;
                break;
        }

        this.save();
        this.#room.voiceController.setOutputVolume(this.getVoiceVolume());
    }
}