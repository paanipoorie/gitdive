// Landing page: sound toggle button
const soundButton = document.querySelector('#soundButton');
let soundOn = true;

soundButton?.addEventListener('click', () => {
  soundOn = !soundOn;
  soundButton.textContent = soundOn ? '♪ ON' : '♪ OFF';
});
