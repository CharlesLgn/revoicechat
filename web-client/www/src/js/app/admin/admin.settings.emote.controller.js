import CoreServer from "../core/core.server.js";
import {handleDragAndDrop} from "../file/drag.and.drop.js";
import {addEmoteViaDragAndDrop} from "../../component/emoji.manager.component.js";

export class AdminSettingsEmoteController {

    async load() {
        const response = await CoreServer.fetch(`/emote/global`);
        const emojiManager = document.createElement('revoice-emoji-manager');
        emojiManager.setAttribute('path', `global`);
        emojiManager.id = "admin-setting-emotes-form";
        emojiManager.innerHTML = `<script type="application/json" slot="emojis-data">${JSON.stringify(response)}</script>`;
        document.getElementById("admin-setting-content-emotes").appendChild(emojiManager);
        handleDragAndDrop('admin-setting-content-emotes', (event) => addEmoteViaDragAndDrop(emojiManager, event));
    }
}