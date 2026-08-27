export function showModal(message, type = 'alert', title = '¡Atención! ✨') {
    return new Promise((resolve) => {
        const modal = document.getElementById('kawaii-modal');
        const titleEl = document.getElementById('modal-title');
        const msgEl = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        titleEl.textContent = title;
        msgEl.textContent = message;

        if (type === 'confirm') {
            cancelBtn.classList.remove('hidden');
            cancelBtn.style.display = 'inline-block';
        } else {
            cancelBtn.classList.add('hidden');
            cancelBtn.style.display = 'none';
        }

        modal.classList.remove('hidden');
        // Usamos un timeout pequeño para que CSS procese la transición
        setTimeout(() => modal.classList.add('show'), 10);

        const cleanup = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            }, 300);
        };

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}
