// ============================================================
// Meu Perfil — foto de perfil do usuário (jogador ou mestre).
// A imagem é redimensionada no navegador (canvas) e salva em base64
// no próprio documento users/{uid}, no campo "avatarImage" — mesmo
// esquema já usado para a imagem de aparência da ficha.
// ============================================================

const AVATAR_MAX_DIM = 320;
let pendingAvatar = null; // base64 escolhido mas ainda não salvo
let currentUser = null;
let currentProfile = null;

function renderAvatarPreview(dataUrl) {
  const box = document.getElementById('avatarPreviewBox');
  box.innerHTML = dataUrl
    ? `<img src="${dataUrl}" alt="Foto de perfil" class="profile-avatar">`
    : `<div class="profile-avatar-placeholder">👤</div>`;
}

function readAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Escolha um arquivo de imagem válido.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        // Recorta para quadrado (centro) antes de redimensionar.
        const side = Math.min(width, height);
        const sx = (width - side) / 2;
        const sy = (height - side) / 2;
        const dim = Math.min(AVATAR_MAX_DIM, side);
        const canvas = document.createElement('canvas');
        canvas.width = dim; canvas.height = dim;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler esse arquivo.'));
    reader.readAsDataURL(file);
  });
}

function showProfileError(msg) {
  const el = document.getElementById('profileError');
  if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
  el.textContent = msg;
  el.style.display = 'block';
}

async function saveAvatar(imageOrNull) {
  const saveBtn = document.getElementById('saveAvatarBtn');
  const rmBtn = document.getElementById('removeAvatarBtn');
  showProfileError('');
  saveBtn.disabled = true; rmBtn.disabled = true;
  try {
    await db.collection('users').doc(currentUser.uid).update({ avatarImage: imageOrNull || '' });
    currentProfile.avatarImage = imageOrNull || '';
    pendingAvatar = null;
    renderAvatarPreview(imageOrNull || '');
    document.getElementById('avatarMsg').textContent = imageOrNull
      ? 'Foto salva com sucesso.'
      : 'Foto removida.';
  } catch (err) {
    showProfileError('Erro ao salvar: ' + err.message);
  } finally {
    saveBtn.disabled = false; rmBtn.disabled = false;
  }
}

guardPage(null, (user, profile) => {
  currentUser = user;
  currentProfile = profile;
  renderTopbar(profile);

  document.getElementById('profileName').textContent = profile.name || '—';
  document.getElementById('profileEmail').textContent = profile.email || user.email || '—';
  document.getElementById('profileRole').textContent = profile.role === 'master' ? 'Conta de Mestre' : 'Conta de Jogador';
  renderAvatarPreview(profile.avatarImage || '');

  document.getElementById('avatarInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    showProfileError('');
    try {
      pendingAvatar = await readAndResizeImage(file);
      renderAvatarPreview(pendingAvatar);
      document.getElementById('avatarMsg').textContent = 'Clique em "Salvar foto" para confirmar.';
    } catch (err) {
      showProfileError(err.message);
    }
  });

  document.getElementById('saveAvatarBtn').addEventListener('click', () => {
    if (!pendingAvatar) { showProfileError('Escolha uma imagem antes de salvar.'); return; }
    saveAvatar(pendingAvatar);
  });

  document.getElementById('removeAvatarBtn').addEventListener('click', () => {
    document.getElementById('avatarInput').value = '';
    saveAvatar('');
  });

  document.getElementById('profileLogoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    location.href = 'index.html';
  });

  document.getElementById('profileDeleteAccountBtn').addEventListener('click', deleteOwnAccount);
});
