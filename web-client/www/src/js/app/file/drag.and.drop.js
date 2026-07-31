/**
 * @param {string} id
 * @param {(Event) => void} func
 */
export function handleDragAndDrop(id, func) {
    const dropzone = document.getElementById(id);
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    let dragCounter = 0;

    dropzone.addEventListener('dragenter', e => {
        e.preventDefault();
        dragCounter++;
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', e => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropzone.classList.remove('dragover');
        }
    });

    dropzone.addEventListener('dragover', e => e.preventDefault());

    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dragCounter = 0;
        dropzone.classList.remove('dragover');
        func(e);
    });
}