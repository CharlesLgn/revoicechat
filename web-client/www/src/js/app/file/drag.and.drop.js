function isExternalFileDrag(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}

/**
 * @param {string} id
 * @param {(DragEvent) => void} func
 */
export function handleDragAndDrop(id, func) {
    const dropzone = document.getElementById(id);
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, e => {
            if (!isExternalFileDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
        });
    });

    let dragCounter = 0;

    dropzone.addEventListener('dragenter', e => {
        if (!isExternalFileDrag(e)) return;
        e.preventDefault();
        dragCounter++;
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', e => {
        if (!isExternalFileDrag(e)) return;
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropzone.classList.remove('dragover');
        }
    });

    dropzone.addEventListener('dragover', e => {
        if (!isExternalFileDrag(e)) return;
        e.preventDefault()
    });

    dropzone.addEventListener('drop', e => {
        if (!isExternalFileDrag(e)) return;
        e.preventDefault();
        dragCounter = 0;
        dropzone.classList.remove('dragover');
        func(e);
    });
}