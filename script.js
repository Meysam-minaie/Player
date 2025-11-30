(function(){
  // --- CINEMATIC INTRO ---
  const overlay = document.getElementById('overlay');
  const welcome1 = document.getElementById('welcome1');
  const welcome2 = document.getElementById('welcome2');
  const welcome3 = document.getElementById('welcome3');
  const playerWrap = document.getElementById('playerWrap');

  function cinematicIntro() {
    setTimeout(() => { welcome1.style.opacity = 1; welcome1.style.transform = 'translateZ(0px)'; }, 800);
    setTimeout(() => { welcome1.style.opacity = 0; }, 1800);
    setTimeout(() => { welcome2.style.opacity = 1; welcome2.style.transform = 'translateZ(0px)'; }, 2000);
    setTimeout(() => { welcome2.style.opacity = 0; }, 3000);
    setTimeout(() => { welcome3.style.opacity = 1; welcome3.style.transform = 'translateZ(0px)'; }, 3200);
    setTimeout(() => { welcome3.style.opacity = 0; }, 4700);
    setTimeout(() => { overlay.style.opacity = 0; playerWrap.style.opacity = 1; setTimeout(()=>overlay.style.display='none',1000); }, 4900);
  }
  window.addEventListener('load', cinematicIntro);

  // --- PLAYER VARIABLES ---
  const video = document.getElementById('video');
  const controls = document.getElementById('controls');
  const playBtn = document.getElementById('playBtn');
  const centerPlayBtn = document.getElementById('centerPlayBtn');
  const muteBtn = document.getElementById('muteBtn');
  const volumeSlider = document.getElementById('volume');
  const progressWrap = document.getElementById('progressWrap');
  const bar = document.getElementById('bar');
  const currentTimeEl = document.getElementById('currentTime');
  const totalDurationEl = document.getElementById('totalDuration');
  const seekTooltip = document.getElementById('seekTooltip'); 
  const fsBtn = document.getElementById('fsBtn');
  const pipBtn = document.getElementById('pipBtn');
  const loaderWrap = document.getElementById('loaderWrap');
  const ccBtn = document.getElementById('ccBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  
  let isSubtitleEnabled = true;
  const customSubtitleLayer = document.getElementById('customSubtitleLayer');
  const customSubtitleText = document.getElementById('customSubtitleText');
  
  let hideControlsTimer;
  let isDragging = false;

  // --- SUBTITLES ---
  function initSubtitles() {
    const track = video.textTracks[0];
    if(track) {
        track.mode = 'hidden'; 
        ccBtn.classList.add('active');
        track.oncuechange = () => {
             if(isSubtitleEnabled && track.activeCues[0]) {
                 customSubtitleText.textContent = track.activeCues[0].text;
                 customSubtitleLayer.style.display = 'block';
             } else {
                 customSubtitleText.textContent = '';
                 customSubtitleLayer.style.display = 'none';
             }
        };
    }
  }
  video.addEventListener('loadedmetadata', initSubtitles);

  // --- MENU LISTENERS ---
  const panels = {
      main: document.getElementById('mainMenuPanel'), 
      speed: document.getElementById('speedPanel')
  };
  function switchPanel(name) {
      Object.values(panels).forEach(p => p.classList.remove('active-panel'));
      panels[name].classList.add('active-panel');
  }
  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); });
  window.addEventListener('click', (e) => {
    if(!e.target.closest('.settings-menu-container') && !e.target.closest('#settingsBtn')) {
        settingsMenu.classList.remove('active'); setTimeout(() => switchPanel('main'), 300); 
    }
  });
  document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); switchPanel('main'); });
  });
  document.getElementById('toSpeedBtn').addEventListener('click', () => switchPanel('speed'));

  document.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
          video.playbackRate = parseFloat(btn.dataset.speed);
          document.querySelectorAll('[data-speed]').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          document.getElementById('currentSpeedText').textContent = btn.textContent;
          switchPanel('main');
      });
  });

  // --- PLAYBACK CONTROLS ---
  function togglePlay(){ if (video.paused) video.play(); else video.pause(); }
  function updatePlayState() {
    if(video.paused || video.ended) {
        playBtn.querySelector('i').textContent = 'play_arrow';
        playerWrap.classList.add('paused'); showControls();
        centerPlayBtn.querySelector('i').textContent = 'play_arrow';
        centerPlayBtn.classList.add('show-icon'); setTimeout(()=>centerPlayBtn.classList.remove('show-icon'), 800);
    } else {
        playBtn.querySelector('i').textContent = 'pause';
        playerWrap.classList.remove('paused'); startHideTimer();
        centerPlayBtn.querySelector('i').textContent = 'pause';
        centerPlayBtn.classList.add('show-icon'); setTimeout(()=>centerPlayBtn.classList.remove('show-icon'), 800);
    }
  }
  playBtn.addEventListener('click', togglePlay);
  video.addEventListener('play', updatePlayState);
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('click', (e) => { if(window.innerWidth > 768) togglePlay(); });

  // --- TOUCH / MOUSE CONTROLS ---
  function showControls() { playerWrap.classList.remove('hide-controls'); clearTimeout(hideControlsTimer); }
  function hideControls() { if (!video.paused && !settingsMenu.classList.contains('active')) playerWrap.classList.add('hide-controls'); }
  function startHideTimer() { clearTimeout(hideControlsTimer); hideControlsTimer = setTimeout(hideControls, 3000); }
  playerWrap.addEventListener('mousemove', () => { showControls(); if(!video.paused) startHideTimer(); });

  let lastTapTime = 0;
  playerWrap.addEventListener('touchstart', (e) => {
      if(e.target.closest('.controls') || e.target.closest('.settings-menu-container')) return;
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      lastTapTime = currentTime;
      if (tapLength < 300 && tapLength > 0) {
          e.preventDefault(); 
          const touchX = e.changedTouches[0].clientX;
          if(touchX < playerWrap.offsetWidth / 2) {
              video.currentTime -= 10; showFeedback(document.getElementById('seekFeedbackLeft'));
          } else {
              video.currentTime += 10; showFeedback(document.getElementById('seekFeedbackRight'));
          }
      } else {
          setTimeout(() => {
              if (new Date().getTime() - lastTapTime >= 300) {
                  if(playerWrap.classList.contains('hide-controls')) { showControls(); startHideTimer(); } else { hideControls(); }
              }
          }, 300);
      }
  });
  function showFeedback(el) { el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

  // --- PROGRESS BAR LOGIC ---
  progressWrap.addEventListener('mousedown', (e)=>{ isDragging = true; seek(e); });
  progressWrap.addEventListener('touchstart', (e)=>{ isDragging = true; seek(e.touches[0]); }, {passive: false});
  window.addEventListener('mousemove', (e)=>{ if(isDragging) seek(e); });
  window.addEventListener('touchmove', (e)=>{ if(isDragging) seek(e.touches[0]); }, {passive: false});
  window.addEventListener('mouseup', ()=>{ isDragging = false; });
  window.addEventListener('touchend', ()=>{ isDragging = false; });

  progressWrap.addEventListener('mousemove', (e) => {
      const rect = progressWrap.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const safePct = Math.min(Math.max(0, pct), 1);
      seekTooltip.style.left = (safePct * 100) + '%';
      seekTooltip.textContent = formatTime(safePct * (video.duration || 0));
  });

  function seek(e) {
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
    bar.style.width = (pct*100)+'%';
    video.currentTime = pct * video.duration;
  }

  // --- TIME UPDATE ---
  function formatTime(s){
    if (!isFinite(s)) return '00:00';
    const m = Math.floor(s/60), sec = Math.floor(s%60), h = Math.floor(s/3600);
    if (h > 0) return `${h}:${String(m%60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }
  
  video.addEventListener('timeupdate', ()=>{
    if(!isDragging) {
        const pct = (video.currentTime / video.duration) * 100;
        bar.style.width = pct + '%';
        currentTimeEl.textContent = formatTime(video.currentTime);
    }
  });
  video.addEventListener('loadedmetadata', ()=> totalDurationEl.textContent = formatTime(video.duration));

  // --- EXTRA CONTROLS ---
  volumeSlider.addEventListener('input', () => { video.volume = volumeSlider.value; video.muted = video.volume === 0; });
  muteBtn.addEventListener('click', () => { video.muted = !video.muted; });
  fsBtn.addEventListener('click', () => !document.fullscreenElement ? playerWrap.requestFullscreen() : document.exitFullscreen());
  pipBtn.addEventListener('click', () => document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture());
  ccBtn.addEventListener('click', () => { 
      isSubtitleEnabled = !isSubtitleEnabled; 
      ccBtn.classList.toggle('active', isSubtitleEnabled);
      if(!isSubtitleEnabled) customSubtitleText.textContent = '';
  });
  video.addEventListener('waiting', ()=>loaderWrap.classList.add('active'));
  video.addEventListener('playing', ()=>loaderWrap.classList.remove('active'));

})();
