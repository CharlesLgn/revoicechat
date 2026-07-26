/**
 * Extracts an 11-character YouTube video ID from watch/short/embed/youtu.be URLs.
 * Returns null if the URL isn't a recognizable YouTube link.
 * @param {string|undefined|null} url
 * @returns {string|null}
 */
function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
}

class OpenGraphCard extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    /**
     * Builds the markup for the hero section: a YouTube iframe embed,
     * a native <video> for direct file URLs, or a fallback <img>.
     * @param {OpenGraphSchema} data
     * @returns {string}
     */
    #renderHero(data) {
        const videoUrl = data?.video?.secureUrl || data?.video?.url;
        const youTubeId = extractYouTubeId(videoUrl) || extractYouTubeId(data?.basic?.url);

        if (youTubeId) {
            const title = data?.basic?.title ?? 'YouTube video';
            return `<iframe
                src="https://www.youtube.com/embed/${youTubeId}"
                title="${title}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
            ></iframe>`;
        }

        // og:video:type "text/html" means the URL points to an embeddable
        // player page (not a raw file), so it can't go in a <video> tag.
        if (videoUrl && data?.video?.type !== 'text/html') {
            const mimeType = data.video.type || 'video/mp4';
            return `<video preload="none" controls
                           poster="${data?.image?.image}"
                           aria-label="${data?.image?.alt}"
                           style="width: 100%; height: 100%; position: absolute; background-color: black; top: 0%; left: 0%; transform: rotate(0deg) scale(1.005);">
                 <source src="${videoUrl}" type="${mimeType}">
               </video>`;
        }

        return `<img src="${data?.image?.image}" alt="${data?.image?.alt ?? ''}"/>`;
    }

    /** @param {OpenGraphSchema} data */
    set ogdata(data) {
        this.shadowRoot.innerHTML = `
        <link href="src/js/component/opengraph.component.css" rel="stylesheet" />
        <div class="card">
          <div class="body">
            <div class="site">${data?.page?.siteName}</div>
            <div class="title field-val"><a href="${data?.basic?.url}" target="_blank">${data?.basic?.title}</a></div>
            <pre class="description">${data?.page?.description}</pre>
          </div>
          <div class="hero">
          ${this.#renderHero(data)}
            <div class="hero-overlay"></div>
          </div>
        </div>
      `;

        // Lazy-load image fade-in
        this.shadowRoot.querySelectorAll('.hero img').forEach(img => {
            if (img.complete) img.classList.add('loaded');
            else img.addEventListener('load', () => img.classList.add('loaded'));
        });

        // Direct video files (e.g. twimg.com CDN links) can be short-lived,
        // signed, or blocked when hotlinked. If the <video> fails to load,
        // fall back to the thumbnail rather than leaving a blank hero.
        const video = this.shadowRoot.querySelector('.hero video');
        if (video) {
            video.addEventListener('error', () => {
                const fallback = document.createElement('img');
                fallback.src = data?.image?.image ?? '';
                fallback.alt = data?.image?.alt ?? '';
                fallback.addEventListener('load', () => fallback.classList.add('loaded'));
                video.replaceWith(fallback);
            }, {once: true});
        }
    }
}

customElements.define('revoice-opengraph-card', OpenGraphCard);