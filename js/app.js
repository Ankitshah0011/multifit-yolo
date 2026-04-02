// App controller for Template 2 (Logo Scan mode)
(function () {
  const $ = (sel) => document.querySelector(sel);

  const ctaBtn = $('#cta-btn');
  const modal = $('#modal');
  const stepPermissions = $('#step-permissions');
  const stepCamera = $('#step-camera');
  const stepAnimation = $('#step-animation');
  const stepEnrollment = $('#step-enrollment');
  const stepSuccess = $('#step-success');
  const stepNotEligible = $('#step-not-eligible');
  const stepMismatch = $('#step-mismatch');
  const btnGrant = $('#btn-grant');
  const btnCapture = $('#btn-capture');
  const btnClose = $('#btn-close');
  const btnRetry = $('#btn-retry');
  const permissionError = $('#permission-error');
  const videoEl = $('#camera-preview');
  const cameraCanvas = $('#camera-canvas');
  const meltCanvas = $('#melt-canvas');
  const distanceMsg = $('#distance-msg');
  const enrollForm = $('#enrollment-form');
  const btnEnroll = $('#btn-enroll');
  const btnSuccessClose = $('#btn-success-close');

  function showStep(step) {
    document.querySelectorAll('.modal__step').forEach((s) => s.classList.remove('active'));
    step.classList.add('active');
  }

  LogoScanner.loadReferences();

  ctaBtn.addEventListener('click', () => {
    modal.hidden = false;
    showStep(stepPermissions);
  });

  modal.querySelector('.modal__backdrop').addEventListener('click', () => {
    Camera.stop();
    modal.hidden = true;
  });

  btnClose.addEventListener('click', () => { modal.hidden = true; });

  async function startCamera() {
    await Camera.start(videoEl, 'environment');
  }

  btnGrant.addEventListener('click', async () => {
    btnGrant.disabled = true;
    btnGrant.textContent = 'REQUESTING...';
    permissionError.hidden = true;

    try {
      await Promise.all([startCamera(), Location.request()]);

      const result = Location.isEligible();
      if (!result.eligible) {
        Camera.stop();
        distanceMsg.textContent = `You are approximately ${result.distance} km away from MultiFit.`;
        showStep(stepNotEligible);
        btnGrant.disabled = false;
        btnGrant.textContent = 'CONTINUE';
        return;
      }

      showStep(stepCamera);
      btnGrant.disabled = false;
      btnGrant.textContent = 'CONTINUE';
    } catch (err) {
      console.error('Permission error:', err);
      permissionError.hidden = false;
      btnGrant.disabled = false;
      btnGrant.textContent = 'CONTINUE';
    }
  });

  btnCapture.addEventListener('click', async () => {
    const wrapper = $('.camera-wrapper');
    wrapper.style.opacity = '0.5';
    setTimeout(() => (wrapper.style.opacity = '1'), 150);

    const captured = Camera.capture(videoEl, cameraCanvas);
    Camera.stop();

    const result = await LogoScanner.analyze(captured);
    if (!result.match) {
      showStep(stepMismatch);
      return;
    }

    showStep(stepAnimation);
    await MeltEffect.run(captured, meltCanvas, 3500);
    showStep(stepEnrollment);
  });

  enrollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnEnroll.disabled = true;
    btnEnroll.textContent = 'SUBMITTING...';

    const name = $('#enroll-name').value.trim();
    const phone = $('#enroll-phone').value.trim();
    const age = $('#enroll-age').value.trim();
    const location = $('#enroll-location').value.trim();
    const budget = $('#enroll-budget').value;
    const duration = $('#enroll-duration').value;

    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzDZE-azcMNGpNINqErgDEf4dTqY6LG3PMWMfeOdPALWhXJ_RVB0aQ6FJSKHxU01Q6aRA/exec';

    const params = new URLSearchParams({ name, phone, age, location, budget, duration });
    const url = `${SHEET_URL}?${params.toString()}`;

    // Use hidden iframe to bypass CORS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    // Clean up after 5 seconds
    setTimeout(() => {
      iframe.remove();
    }, 5000);

    // Show success after a short delay
    setTimeout(() => {
      showStep(stepSuccess);
      btnEnroll.disabled = false;
      btnEnroll.textContent = 'CLAIM FREE TRIAL';
    }, 1000);
  });

  btnSuccessClose.addEventListener('click', () => {
    modal.hidden = true;
    enrollForm.reset();
  });

  btnRetry.addEventListener('click', async () => {
    btnRetry.disabled = true;
    btnRetry.textContent = 'STARTING CAMERA...';
    try {
      await startCamera();
      showStep(stepCamera);
    } catch (err) {
      console.error('Camera restart error:', err);
    }
    btnRetry.disabled = false;
    btnRetry.textContent = 'TRY AGAIN';
  });
})();
