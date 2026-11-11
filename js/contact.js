document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const TO = 'your-email@gmail.com'; // <- change this
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email, message } = form.elements;
    const subject = encodeURIComponent(`Portfolio message from ${name.value.trim()}`);
    const body = encodeURIComponent(`${message.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`);
    location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your email app…';
    form.reset();
    setTimeout(() => (status.textContent = ''), 5000);
  });
});
