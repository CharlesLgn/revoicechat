import {containsOnlyEmotes, countEmotes} from "../lib/emote.utils.js";
import MediaServer from "../app/media/media.server.js";
import CoreServer from "../app/core/core.server.js";
import {isUUID, isValidGifUrl} from "../lib/string.utils.js";
import {renderEmojis} from "./emoji.component.js";
import Modal from "./modal.component.js";
import {sanitizeHtml} from "../lib/tools.js";

class MessageComponent extends HTMLElement {
    /** @type string */
    markdown
    /** @type MessageReaction[] */
    reactions
    /** @type TextPattern[] */
    textPatterns

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.markdown = '';
        this.reactions = []
        this.textPatterns = []
    }

    static get observedAttributes() {
        return ['markdown', 'theme', 'updated-time', 'data-theme'];
    }

    /** generate the data in slot */
    connectedCallback() {
        this.#setupShadowDOM();
        this.#render();
        this.#updateTheme()
    }

    /** update the data in slot */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'markdown' && oldValue !== newValue) {
            this.markdown = newValue || '';
            this.#render();
        } else if ((name === 'theme' || name === 'data-theme') && oldValue !== newValue) {
            this.#updateTheme();
        } else if (name === 'updated-time' && oldValue !== newValue) {
            this.#updateRender();
        }
    }

    #setupShadowDOM() {
        // Create the shadow DOM structure
        this.shadowRoot.innerHTML = `
                    <link href="src/js/component/message.component.css" rel="stylesheet" />
                    <div class="container">
                        <div class="markdown-content">
                            <div id="medias"></div>
                            <div id="content"></div>
                            <div id="open-graph"></div>
                            <div id="reactions" class="message-reactions"></div>
                        </div>
                        <slot name="medias" style="display: none;"></slot>
                        <slot name="content" style="display: none;"></slot>
                        <slot name="reactions" style="display: none;"></slot>
                        <slot name="textPatterns" style="display: none;"></slot>
                    </div>
                `;
    }

    #handleSlottedMedias() {
        this.medias = this.mediaSlot
    }

    #handleSlottedContent() {
        this.markdown = this.contentSlot
        if (this.markdown) {
            this.#render();
        }
    }

    #handleSlottedReaction() {
        this.reactions = this.reactionsSlot
    }

    #handleSlottedTextPatterns() {
        this.textPatterns = this.textPatternsSlot
    }

    #hideSlots() {
        this.shadowRoot.querySelector('.container').className = 'container';
    }

    #updateTheme() {
        let theme = getComputedStyle(this).getPropertyValue("--hljs-theme").trim();
        theme = theme.substring(1, theme.length - 1)
        const link = document.createElement("link");
        link.id = "highlightjs-theme";
        link.rel = "stylesheet";
        link.href = theme;
        this.shadowRoot.appendChild(link);
    }

    #updateRender() {
        const content = this.contentSlot;
        if (this.markdown !== content) {
            this.markdown = content
            this.#renderContent();
        }
        const medias = this.mediaSlot;
        if (this.medias !== medias) {
            this.medias = medias
            this.#renderMedias();
        }
        const reactions = this.reactionsSlot;
        if (this.reactions !== reactions) {
            this.reactions = reactions
            this.#renderReactions();
        }
        renderEmojis(this.shadowRoot);
    }

    async #render() {

        // Check if there's slotted content
        if (!this.markdown) {
            this.#handleSlottedContent();
        }
        this.#handleSlottedMedias();
        this.#handleSlottedReaction();
        this.#handleSlottedTextPatterns();
        this.#renderMedias();
        this.#renderContent()
        this.#renderOpenGraph()
        this.#renderReactions()
        renderEmojis(this.shadowRoot);
    }

    #renderContent() {
        const contentDiv = this.shadowRoot.getElementById('content');
        contentDiv.innerHTML = ''
        if (typeof marked === 'undefined') {
            contentDiv.innerHTML = '<p style="color: #ff6b6b;">marked.js library not loaded</p>';
            return;
        }
        try {
            this.#setupMarked()
            this.#hideSlots();
            if (this.markdown) {
                if (containsOnlyEmotes(this.markdown, this.#emotesNames())) {
                    contentDiv.innerHTML = this.#injectTextPattern(this.#removeTags(this.markdown))
                    if (countEmotes(this.markdown, this.#emotesNames()) === 1) {
                        contentDiv.classList.add('stickers-emoji')
                    } else {
                        contentDiv.classList.add('only-emoji')
                    }
                } else if (isValidGifUrl(this.markdown)) {
                    contentDiv.innerHTML = `<img src="${this.markdown}" alt="gif"/>`
                } else {
                    let htmlContent = marked.parse(this.#removeTags(this.markdown));
                    htmlContent = this.#injectTextPattern(htmlContent);
                    contentDiv.innerHTML += htmlContent;
                }
            }

            this.#renderCodeTemplate(contentDiv);

        } catch (error) {
            console.error('Markdown parsing error:', error);
            contentDiv.innerHTML = `<p style="color: #ff6b6b;">Error parsing markdown: ${error.message}</p>`;
        }
    }

    #renderCodeTemplate(contentDiv) {
        for (const block of contentDiv.querySelectorAll('pre code')) {
            hljs.highlightElement(block);
        }
    }

    /** Identify HTML tags in the input string. Replacing the identified HTML tag with a null string.*/
    #removeTags(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.innerHTML = String(str);
        return div.textContent || "";
    }

    #injectTextPattern(inputText) {
        for (let textPattern of this.textPatterns) {
            const pattern = sanitizeHtml(textPattern.pattern)
            const replacedValue = this.#textPatternToHtml(textPattern)
            if (replacedValue !== '') {
                inputText = inputText.replace(pattern, replacedValue)
            }
        }
        return inputText;
    }

    /** @param {TextPattern} textPattern */
    #textPatternToHtml(textPattern) {
        if (textPattern.type === "USER_MENTION" || textPattern.type === "ROLE_MENTION") {
            const mention = /** @type MessageMention */ textPattern.data
            const currentUserMentioned = mention.currentUserMentioned ? "connectedUser" : ""
            return `<span class="mention ${currentUserMentioned}" data-mention-id="${mention.id}">
                        @${mention.mentionName}
                     </span>`
        } else if (textPattern.type === "EMOTE") {
            const emote = /** @type EmoteRepresentation */ textPattern.data
            return `<img class="emoji" src="${MediaServer.emote(emote.id)}" alt="${emote.name}" title=":${emote.name}:">`
        }
        return '';
    }

    #setupMarked() {
        const renderer = new marked.Renderer();
        renderer.heading = function ({tokens: e, depth: t}) {
            const text = this.parser.parse(e);
            const DIV = document.createElement('div');
            DIV.innerHTML = text
            const p = DIV.children.item(0)
            p.innerHTML = '#'.repeat(t) + " " + p.innerHTML;
            return p.innerHTML;
        }
        renderer.link = function ({href: e, title: t, tokens: n}) {
            // Allow only http(s), www, or IP-style links
            if (/^(https?:\/\/|www\.|(\d{1,3}\.){3}\d{1,3})/.test(e)) {
                return `<a href="${e}" target="_blank" rel="noopener noreferrer">${e}</a>`;
            }
            return this.parser.parse(n);
        }

        marked.use({renderer})
        marked.use({
            breaks: true,
            gfm: true
        });
    }

    #renderMedias() {
        const mediaElt = this.shadowRoot.getElementById('medias');
        mediaElt.innerHTML = "";
        if (this.medias) {
            for (const media of this.medias) {
                if (media.status === "STORED") {
                    mediaElt.innerHTML += `<revoice-attachement-message id="${media.id}" name="${media.name}" type="${media.type}"></revoice-attachement-message>`
                }
            }
        }
    }

    /** @return {string[]} */
    #emotesNames() {
        return Array.from(this.textPatterns)
            .filter(item => item.type === "EMOTE")
            .map(item => item.data.name)
    }

    #renderOpenGraph() {
        if (this.getAttribute("url-preview") === "false") {
            return
        }
        const openGraphCard = this.shadowRoot.getElementById('open-graph');
        const id = this.getAttribute("id")
        CoreServer.fetch(`/message/${id}/open-graph`)
            .then(res => {
                if (res) {
                    const card = document.createElement("revoice-opengraph-card")
                    card.ogdata = res
                    openGraphCard.innerHTML = '';
                    openGraphCard.appendChild(card)
                }
            })
    }

    #renderReactions() {
        if (this.reactions.length === 0) {
            return
        }
        const REACTIONS = this.shadowRoot.getElementById('reactions');
        REACTIONS.innerHTML = ''
        const printReaction = (element, emoji, number) => {
            element.innerHTML = ''
            if (number <= 0) {
                element.remove()
            } else {
                element.appendChild(isUUID(emoji) ? this.#emoji(emoji) : this.#span(emoji))
                element.appendChild(this.#span(number))
            }

        }
        for (const reaction of this.reactions) {
            const self = reaction.users.includes(RVC.user.id);
            const emoji = document.createElement("div");
            printReaction(emoji, reaction.emoji, reaction.users.length)
            emoji.className = `message-reaction ${self ? 'self' : ''}`
            emoji.onclick = () => {
                void CoreServer.fetch(`/message/${this.id}/reaction/${reaction.emoji}`, 'POST');
                printReaction(emoji, reaction.emoji, reaction.users.length + (self ? -1 : 1))
            }
            emoji.addEventListener('contextmenu', async (e) => {
                e.preventDefault();
                const users = await CoreServer.fetch(`/server/${RVC.server.id}/user`, 'GET');
                await Modal.toggle({
                    html: `
                        <div class='popup'>
                            ${reaction.users
                        .map(u => users.find(usr => usr.id === u))
                        .map(u => this.#createUser(u))
                        .join("")}
                        </div>`,
                    didOpen: () => {
                        const titre = document.querySelector('.dialog-title');
                        titre.appendChild(isUUID(reaction.emoji) ? this.#emoji(reaction.emoji) : this.#span(reaction.emoji))
                    }
                })
            });
            REACTIONS.appendChild(emoji)
        }
    }

    #createUser(user) {
        return `<div class="${user.id} user-profile">
                    <div class="relative">
                        <img src="${MediaServer.profiles(user.id)}" alt="PFP"
                             style="border-radius: 9999px;width: 2rem; height: 2rem; aspect-ratio: auto;"
                             class="icon"
                             data-id="${user.id}"
                             name="user-picture-${user.id}" />
                    </div>
                    <div class="user">
                        <h2 class="name" title="${user.displayName}" name="user-name-${user.id}">${user.displayName}</h2>
                    </div>
                </div>`;
    }

    /** @param {string} data */
    #span(data) {
        const span = document.createElement("span")
        span.style.display = "flex"
        span.style.alignItems = "center"
        span.innerText = data
        return span;
    }

    /** @param {string} emoji */
    #emoji(emoji) {
        const img = document.createElement("img")
        img.src = MediaServer.emote(emoji)
        img.className = 'emoji'
        img.alt = emoji
        return img;
    }

    get contentSlot() {
        const contentSlot = this.shadowRoot.querySelector('slot[name="content"]');
        const slottedElements = contentSlot.assignedElements();
        for (const element of slottedElements) {
            if (element.tagName === 'SCRIPT' && element.type === 'text/markdown') {
                return element.textContent.trim();
            }
        }
        return '';
    }

    get mediaSlot() {
        return this.#jsonSlot("medias");
    }

    get reactionsSlot() {
        return this.#jsonSlot("reactions");
    }

    get textPatternsSlot() {
        const contentSlot = this.shadowRoot.querySelector(`slot[name="textPatterns"]`);
        const slottedElements = contentSlot.assignedElements();
        for (const element of slottedElements) {
            if (element.tagName === 'SCRIPT' && element.type === 'application/json') {
                return element.textContent.trim() ? JSON.parse(element.textContent.trim()) : [];
            }
        }
        return [];
    }

    #jsonSlot(name) {
        const contentSlot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
        const slottedElements = contentSlot.assignedElements();
        for (const element of slottedElements) {
            if (element.tagName === 'SCRIPT' && element.type === 'application/json') {
                return JSON.parse(element.textContent);
            }
        }
        return null;
    }
}

customElements.define('revoice-message', MessageComponent);