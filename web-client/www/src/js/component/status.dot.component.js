class DotComponent extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'color' && oldValue !== newValue) {
            this.#setupDOM();
        }
    }

    /** generate the data in slot */
    connectedCallback() {
        this.#setupDOM()
    }

    #setupDOM() {
        this.shadowRoot.innerHTML = `
        <style>
            .dot {
                position: absolute;
                right: -0.25rem;
                bottom: -0.15rem;
                width: 0.9rem;
                height: 0.9rem;
            }
        </style>
        <div id="dot" class="dot">
            <revoice-status-dot-${this.colorAttribute}></revoice-status-dot-${this.colorAttribute}>
        </div>`
    }

    get colorAttribute() {
        const color = this.getAttribute("color");
        return ["gray", "green", "orange", "red"].includes(color) ? color : "gray";
    }
}

class ColorDotComponent extends HTMLElement {

    constructor(color) {
        super();
        this.color = color;
        this.attachShadow({ mode: 'open' });
    }

    /** generate the data in slot */
    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            .dot {
                background-color: ${this.color};
                width: 0.9rem;
                height: 0.9rem;
                border-style: solid;
                border-width: 2px;
                border-color: rgb(31 41 55);
                border-radius: 9999px;
                
            }
        </style>
        <div id="dot" class="dot"></div>`
    }
}

class GreenDotComponent extends ColorDotComponent {
    constructor() {super('var(--green-text)');}
}

class OrangeDotComponent extends ColorDotComponent {
    constructor() {super('#fb883c');}
}

class RedDotComponent extends ColorDotComponent {
    constructor() {super('#ff0000');}
}

class GrayDotComponent extends ColorDotComponent {
    constructor() {super('var(--gray-text)');}
}

customElements.define('revoice-status-dot', DotComponent);
customElements.define('revoice-status-dot-green', GreenDotComponent);
customElements.define('revoice-status-dot-orange', OrangeDotComponent);
customElements.define('revoice-status-dot-red', RedDotComponent);
customElements.define('revoice-status-dot-gray', GrayDotComponent);