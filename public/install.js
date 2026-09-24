(() => {
  const get = id => document.getElementById(id);
  let deferredPrompt = null;
  let installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const button = get('install-confirm');

  function updateGuide() {
    button.hidden = !deferredPrompt || installed;
    get('install-message').textContent = '';
    if (installed) {
      get('install-guide').textContent = '이미 앱으로 추가되어 있어요. 기기의 말씀소리 아이콘으로 열 수 있습니다.';
      return;
    }
    if (deferredPrompt) {
      get('install-guide').textContent = '아래 설치 버튼을 누르고 브라우저 안내에 따라 추가해 주세요.';
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    get('install-guide').textContent = ios
      ? 'Safari에서 이 페이지를 열고 공유 버튼 → 홈 화면에 추가 → 추가를 눌러 주세요.'
      : /Android/.test(ua)
        ? 'Chrome에서 이 페이지를 열고 메뉴 ⋮ → 홈 화면에 추가 또는 앱 설치를 선택해 주세요. 카카오톡 안에서 열었다면 먼저 외부 브라우저로 열어 주세요.'
        : 'Chrome 또는 Edge에서 이 페이지를 열고 주소창의 설치 아이콘이나 브라우저 메뉴의 앱 설치 / 바로가기 만들기를 이용해 주세요. 메뉴 이름은 브라우저에 따라 다를 수 있습니다.';
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    if (get('install-dialog').open) updateGuide();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    updateGuide();
    get('install-message').textContent = '말씀소리를 추가했어요.';
  });
  get('install-open').onclick = () => { updateGuide(); get('install-dialog').showModal(); };
  get('install-close').onclick = () => get('install-dialog').close();
  button.onclick = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    button.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      updateGuide();
      get('install-message').textContent = choice.outcome === 'accepted'
        ? '설치 요청을 받았어요. 기기의 앱 목록이나 홈 화면을 확인해 주세요.'
        : '추가를 취소했어요. 브라우저 메뉴에서 다시 추가할 수 있습니다.';
    } catch {
      updateGuide();
      get('install-message').textContent = '설치창을 열지 못했어요. 브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 이용해 주세요.';
    } finally { button.disabled = false; }
  };
})();
