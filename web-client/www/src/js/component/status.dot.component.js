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

    constructor(svgContent) {
        super();
        this.svgContent = svgContent;
        this.attachShadow({ mode: 'open' });
    }

    /** generate the data in slot */
    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            svg {
                display: block;
                width: 0.9rem;
                height: 0.9rem;
            }
        </style>
        ${this.svgContent}`;
    }
}

class GreenDotComponent extends ColorDotComponent {
    constructor() {
        super(`
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="var(--green-text)" stroke="rgb(31 41 55)" stroke-width="2"/>
        </svg>`);
    }
}

class OrangeDotComponent extends ColorDotComponent {
    constructor() {
        super(`
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <mask id="moon-mask">
                <rect width="16" height="16" fill="white"/>
                <circle cx="11" cy="5" r="5" fill="black"/>
            </mask>
            <circle cx="8" cy="8" r="7" fill="#FFC04E" stroke="rgb(31 41 55)" stroke-width="1" mask="url(#moon-mask)"/>
        </svg>`);
    }
}

class RedDotComponent extends ColorDotComponent {
    constructor() {
        super(`
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <mask id="minus-mask">
                <rect width="16" height="16" fill="white"/>
                <rect x="3.5" y="6.75" width="9" height="2.5" rx="1.25" fill="black"/>
            </mask>
            <circle cx="8" cy="8" r="7" fill="#ff0000" stroke="rgb(31 41 55)" stroke-width="1" mask="url(#minus-mask)"/>
        </svg>`);
    }
}

class GrayDotComponent extends ColorDotComponent {
    constructor() {
        super(`
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"
                fill="var(--gray-text)" stroke="rgb(31 41 55)" stroke-width="1"/>
        </svg>`);
    }
}

customElements.define('revoice-status-dot', DotComponent);
customElements.define('revoice-status-dot-green', GreenDotComponent);
customElements.define('revoice-status-dot-orange', OrangeDotComponent);
customElements.define('revoice-status-dot-red', RedDotComponent);
customElements.define('revoice-status-dot-gray', GrayDotComponent);