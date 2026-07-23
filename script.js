const orderTriggers = document.querySelectorAll('.order-trigger');
const orderModal = document.querySelector('[data-modal="orderModal"]');
const successModal = document.querySelector('[data-modal="successModal"]');
const closeButtons = document.querySelectorAll('[data-close]');
const faqCards = document.querySelectorAll('.faq-card');
const orderForm = document.getElementById('orderForm');
const submitButton = orderForm.querySelector('.submit-button');
const formMessage = orderForm.querySelector('.form-message');
const endpoint = 'https://leadgen-project-aydp.onrender.com/api/orders/create/';

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

function resetForm() {
  orderForm.reset();
  formMessage.textContent = '';
  submitButton.classList.remove('loading');
  submitButton.disabled = false;
}

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

orderModal.addEventListener('click', (event) => {
  if (event.target === orderModal) {
    closeOrderModal();
  }
});

successModal.addEventListener('click', (event) => {
  if (event.target === successModal) {
    closeSuccessModal();
  }
});

faqCards.forEach((card) => {
  const question = card.querySelector('.faq-question');
  question.addEventListener('click', () => {
    const expanded = card.classList.toggle('active');
    const icon = question.querySelector('.faq-icon');
    icon.textContent = expanded ? '−' : '+';
  });
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

function showError(message) {
  formMessage.textContent = message;
}

function clearError() {
  formMessage.textContent = '';
}

function setLoading(active) {
  submitButton.disabled = active;
  submitButton.classList.toggle('loading', active);
  const existingSpinner = submitButton.querySelector('.spinner');

  if (active) {
    if (!existingSpinner) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      submitButton.prepend(spinner);
    }
    submitButton.textContent = 'Submitting your order...';
    submitButton.prepend(submitButton.querySelector('.spinner'));
  } else {
    if (existingSpinner) {
      existingSpinner.remove();
    }
    submitButton.textContent = 'Submit Order';
  }
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const data = getFormData();

  if (!data.full_name || !data.phone_number || !data.product || !data.address) {
    showError('Please complete all required fields.');
    return;
  }

  if (data.email && !validateEmail(data.email)) {
    showError('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to submit your order at this time.');
    }

    closeOrderModal();
    setTimeout(() => {
      openSuccessModal();
      resetForm();
    }, 200);
  } catch (error) {
    showError('Submission failed. Please try again.');
    console.error('Order submission error:', error);
  } finally {
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Order';
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (orderModal.classList.contains('active')) {
      closeOrderModal();
    }
    if (successModal.classList.contains('active')) {
      closeSuccessModal();
    }
  }
});
