// UI Controls for Spray Paint System

export function setupSprayUI(spraySystem) {
  const crosshair = document.getElementById('spray-crosshair');
  const toggleButton = document.getElementById('toggle-spray');
  const clearButton = document.getElementById('clear-graffiti');
  const sizeSlider = document.getElementById('spray-size');
  const sizeValue = document.getElementById('size-value');
  const opacitySlider = document.getElementById('spray-opacity');
  const opacityValue = document.getElementById('opacity-value');
  const colorSwatches = document.querySelectorAll('.color-swatch');

  let sprayModeActive = true;

  // Initialize first color as selected
  if (colorSwatches.length > 0) {
    colorSwatches[0].classList.add('selected');
  }

  // Show crosshair and activate spray mode by default
  crosshair.classList.add('active');
  toggleButton.classList.add('active');
  toggleButton.textContent = 'Spray Mode: ON';

  // Toggle spray mode
  toggleButton.addEventListener('click', () => {
    sprayModeActive = !sprayModeActive;

    if (sprayModeActive) {
      crosshair.classList.add('active');
      toggleButton.classList.add('active');
      toggleButton.textContent = 'Spray Mode: ON';
      spraySystem.enable();
    } else {
      crosshair.classList.remove('active');
      toggleButton.classList.remove('active');
      toggleButton.textContent = 'Spray Mode: OFF';
      spraySystem.disable();
    }
  });

  // Keyboard shortcut for toggling spray mode (V key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'v' || e.key === 'V') {
      toggleButton.click();
    }
  });

  // Clear all graffiti
  clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all graffiti?')) {
      spraySystem.clearAllGraffiti();
    }
  });

  // Color selection
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      // Remove selected class from all swatches
      colorSwatches.forEach(s => s.classList.remove('selected'));

      // Add selected class to clicked swatch
      swatch.classList.add('selected');

      // Update spray color
      const color = swatch.getAttribute('data-color');
      spraySystem.setColor(color);

      // Update crosshair color
      crosshair.style.textShadow = `0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px ${color}`;
    });
  });

  // Size slider
  sizeSlider.addEventListener('input', (e) => {
    const size = parseFloat(e.target.value);
    sizeValue.textContent = size.toFixed(1);
    spraySystem.setSize(size);
  });

  // Opacity slider
  opacitySlider.addEventListener('input', (e) => {
    const opacity = parseFloat(e.target.value);
    opacityValue.textContent = opacity.toFixed(1);
    spraySystem.setOpacity(opacity);
  });

  return {
    isSprayModeActive: () => sprayModeActive,
    toggleSprayMode: () => toggleButton.click()
  };
}
