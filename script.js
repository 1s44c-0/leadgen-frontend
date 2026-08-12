const orderTriggers = document.querySelectorAll('.order-trigger');
const orderModal = document.querySelector('[data-modal="orderModal"]');
const successModal = document.querySelector('[data-modal="successModal"]');
const closeButtons = document.querySelectorAll('[data-close]');
const faqCards = document.querySelectorAll('.faq-card');
const orderForm = document.getElementById('orderForm');
const submitButton = orderForm.querySelector('.submit-button');
const formMessage = orderForm.querySelector('.form-message');

// ============================================================
// API ENDPOINT
// ============================================================

// LOCAL DEVELOPMENT
// const endpoint = 'http://127.0.0.1:8000/api/orders/create/';
const endpoint = 'https://leadgen-project-aydp.onrender.com/api/orders/create/';
// ============================================================
// MODALS
// ============================================================

function toggleModal(modal, open) {
    if (!modal) return;

    modal.classList.toggle('active', open);
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
}

function openOrderModal() {
    resetForm();
    toggleModal(orderModal, true);
}

function closeOrderModal() {
    toggleModal(orderModal, false);
}

function openSuccessModal() {
    toggleModal(successModal, true);
}

function closeSuccessModal() {
    toggleModal(successModal, false);
}

// ============================================================
// RESET FORM
// ============================================================

function resetForm() {
    orderForm.reset();
    formMessage.textContent = '';
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
}

// ============================================================
// ORDER MODAL EVENTS
// ============================================================

orderTriggers.forEach((button) => {
    button.addEventListener('click', openOrderModal);
});

closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const trigger = event.currentTarget;
        const parentModal = trigger.closest('.modal-overlay');

        if (parentModal === orderModal) {
            closeOrderModal();
        } else if (parentModal === successModal) {
            closeSuccessModal();
        }
    });
});

if (orderModal) {
    orderModal.addEventListener('click', (event) => {
        if (event.target === orderModal) {
            closeOrderModal();
        }
    });
}

if (successModal) {
    successModal.addEventListener('click', (event) => {
        if (event.target === successModal) {
            closeSuccessModal();
        }
    });
}

// ============================================================
// FAQ
// ============================================================

faqCards.forEach((card) => {
    const question = card.querySelector('.faq-question');

    if (!question) return;

    question.addEventListener('click', () => {
        const expanded = card.classList.toggle('active');
        const icon = question.querySelector('.faq-icon');

        if (icon) {
            icon.textContent = expanded ? '−' : '+';
        }
    });
});

// ============================================================
// FORM DATA
// ============================================================

function getFormData() {
    const formData = new FormData(orderForm);

    return {
        full_name: formData.get('full_name')?.trim() || '',
        phone_number: formData.get('phone_number')?.trim() || '',
        email: formData.get('email')?.trim() || '',
        product: formData.get('product') || '',
        quantity: Number(formData.get('quantity')) || 1,
        address: formData.get('address')?.trim() || '',
        note: formData.get('note')?.trim() || ''
    };
}

// ============================================================
// ERROR HANDLING
// ============================================================

function showError(message) {
    formMessage.textContent = message;
}

function clearError() {
    formMessage.textContent = '';
}

// ============================================================
// LOADING STATE
// ============================================================

function setLoading(active) {
    submitButton.disabled = active;
    submitButton.classList.toggle('loading', active);

    if (active) {
        submitButton.innerHTML =
            '<span class="spinner"></span>Submitting your order...';
    } else {
        submitButton.textContent = 'Submit Order';
    }
}

// ============================================================
// SUBMIT ORDER TO BACKEND
// ============================================================

async function submitOrderToBackend() {
    const data = getFormData();

    setLoading(true);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseText = await response.text();
        let dataResp;

        try {
            dataResp = JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                `Server returned ${response.status}: ${responseText}`
            );
        }

        if (!response.ok) {
            console.error('Backend error:', dataResp);

            const errorMessage =
                dataResp.message ||
                dataResp.detail ||
                dataResp.error ||
                `Server returned ${response.status}.`;

            throw new Error(errorMessage);
        }

        if (!dataResp.success) {
            throw new Error(
                dataResp.message ||
                'Unable to process your order right now.'
            );
        }

        const paymentUrl =
            dataResp.payment_url ||
            dataResp.authorization_url ||
            dataResp.data?.authorization_url;

        if (!paymentUrl) {
            console.error('Backend response:', dataResp);
            throw new Error('Payment URL missing from server response.');
        }

        // Redirect immediately to Paystack
        window.location.href = paymentUrl;

    } catch (error) {
        console.error('Order submission error:', error);
        showError(
            error.message ||
            'Unable to process your order right now. Please try again.'
        );
        setLoading(false);
    }
}

// ============================================================
// FORM SUBMIT
// ============================================================

orderForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    clearError();

    const data = getFormData();

    if (
        !data.full_name ||
        !data.phone_number ||
        !data.email ||
        !data.product ||
        !data.address
    ) {
        showError('Please complete all required fields.');
        return false;
    }

    submitOrderToBackend();
    return false;
});

// ============================================================
// ESCAPE KEY
// ============================================================

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (orderModal && orderModal.classList.contains('active')) {
            closeOrderModal();
        }

        if (successModal && successModal.classList.contains('active')) {
            closeSuccessModal();
        }
    }
});

// ============================================================
// HANDLE PAYMENT RETURN
// ============================================================

(function handlePaymentReturn() {
    try {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');

        if (payment === 'success') {
            if (orderModal && orderModal.classList.contains('active')) {
                closeOrderModal();
            }

            openSuccessModal();

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        } else if (payment === 'failed') {
            showError('Payment failed or cancelled. Please try again.');

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    } catch (error) {
        console.error('Payment return handling error:', error);
    }
})();