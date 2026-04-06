/** Custom Modal Implementation using native <dialog> */
export default class FancyBox {
    static #instance = new FancyBox();

    /** @param {{src: string, alt: string, caption: string,}} options */
    static toggle(options) {
        FancyBox.#instance.fire(options);
    }

    constructor() {
        const dialogHTML = `
            <div id="custom-fancy-box-modal" class="custom-dialog">
                 <div class="modal-box">
                    <button class="modal-close" id="modal-close" aria-label="Close">
                        <revoice-icon-circle-x></revoice-icon-circle-x>
                    </button>
                    <img id="modal-img" src="" alt="" />
                    <p id="modal-caption"></p>
                    <div class="modal-toolbar">
                        <a id="btn-open" class="modal-btn" href="#" target="_blank" rel="noopener">
                            <revoice-icon-open-in-browser></revoice-icon-open-in-browser>
                            Open in browser
                        </a>
                        <a id="btn-download" class="modal-btn" href="#" download>
                            <revoice-icon-download></revoice-icon-download>
                            Download
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        this.modal = document.getElementById('custom-fancy-box-modal');
        this.modalImg = document.getElementById('modal-img');
        this.modalCap = document.getElementById('modal-caption');
        this.btnOpen = document.getElementById('btn-open');
        this.btnDl = document.getElementById('btn-download');
        this.btnClose = document.getElementById('modal-close');

        this.btnClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', e => {
            if (e.target === this.modal) this.closeModal();
        });
        this.#addStyles()
    }

    #addStyles() {
        if (document.getElementById('dialog-fancy-box-styles')) return;
        document.head.insertAdjacentHTML(
            'beforeend',
            `<link id="dialog-fancy-box-styles" href="src/js/component/fancy.box.component.css" rel="stylesheet" />`
        );
    }

    /** @param {{src: string, alt: string, caption: string,}} opt */
    fire(opt) {
        this.modalImg.src = opt.src;
        this.modalImg.alt = opt.alt || '';
        this.modalCap.textContent = opt.caption || '';
        this.btnOpen.href = opt.src;
        this.btnDl.href = opt.src;
        const filename = opt.src.split('/').pop().split('?')[0] || 'image.jpg';
        this.btnDl.download = filename.includes('.') ? filename : filename + '.jpg';
        this.modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.btnClose.focus();
    }

    closeModal() {
        this.modal.classList.remove('open');
        document.body.style.overflow = '';
        this.modalImg.src = '';
    }
}