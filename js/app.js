const STORAGE_KEY = 'es_featured_v1';
const AUTH_KEY = 'es_auth';
let MODO_SERVIDOR = false;

async function verificarSesion() {
  try {
    const res = await fetch('/api/check', { cache: 'no-store' });
    if (res.ok) {
      MODO_SERVIDOR = true;
      return true;
    }
    if (res.status === 401) {
      window.location.href = 'login.html';
      return false;
    }
  } catch (e) {}
  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    MODO_SERVIDOR = false;
    return true;
  }
  window.location.href = 'login.html';
  return false;
}

async function iniciarSesion(usuario, clave) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, clave })
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Credenciales incorrectas.' };
    return { ok: false, error: 'Error del servidor (HTTP ' + res.status + ').' };
  } catch (e) {
    if (usuario === DEFAULT_CREDENCIALES.usuario && clave === DEFAULT_CREDENCIALES.clave) {
      sessionStorage.setItem(AUTH_KEY, '1');
      return { ok: true };
    }
    return { ok: false, error: 'Credenciales incorrectas.' };
  }
}

async function cerrarSesion() {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  } catch (e) {}
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

async function obtenerDatos() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.featured && typeof json.featured.title === 'string' && json.featured.date && json.featured.image) {
        MODO_SERVIDOR = true;
        return json.featured;
      }
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d.title === 'string' && d.date && d.image) {
        return d;
      }
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA.featured));
}

async function persistirDatos(data) {
  if (MODO_SERVIDOR) {
    const res = await fetch('data.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ featured: data }, null, 2) + '\n'
    });
    if (!res.ok) {
      throw new Error('El servidor rechazo el guardado (HTTP ' + res.status + ').');
    }
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function restablecerOriginales() {
  if (MODO_SERVIDOR) {
    await persistirDatos(JSON.parse(JSON.stringify(DEFAULT_DATA.featured)));
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

function textoAltDesdePlaceholder(placeholder) {
  return placeholder.replace(/^\[FOTO:\s*/i, '').replace(/\]\s*$/, '');
}

function crearEtiquetaPlaceholder(texto) {
  const span = document.createElement('span');
  span.className = 'media-label small text-secondary px-3 text-center';
  span.textContent = texto;
  return span;
}

function crearImagen(url, altTexto, alFallar) {
  const img = document.createElement('img');
  img.className = 'media-img';
  img.alt = altTexto;
  img.src = url;
  img.addEventListener('error', () => {
    img.remove();
    if (typeof alFallar === 'function') alFallar();
  });
  return img;
}

async function renderizarDestacado() {
  const data = await obtenerDatos();

  const cat = document.getElementById('featured-category');
  if (cat) cat.textContent = data.category;

  const title = document.getElementById('featured-title');
  if (title) title.textContent = data.title;

  const day = document.getElementById('badge-day');
  const month = document.getElementById('badge-month');
  const year = document.getElementById('badge-year');
  if (day) day.textContent = data.date.day;
  if (month) month.textContent = data.date.month;
  if (year) year.textContent = data.date.year;

  const media = document.getElementById('featured-media');
  if (!media) return;

  media.querySelectorAll('.media-img, .media-label').forEach(el => el.remove());

  const fallback = () => media.appendChild(crearEtiquetaPlaceholder(data.image.placeholder));
  const alt = textoAltDesdePlaceholder(data.image.placeholder);

  if (data.image.url) {
    media.appendChild(crearImagen(data.image.url, alt, fallback));
  } else {
    fallback();
  }
}

function actualizarVistaPrevia(url, placeholderTexto) {
  const box = document.getElementById('preview');
  if (!box) return;
  box.querySelectorAll('img, .media-label').forEach(el => el.remove());
  const fallback = () => box.appendChild(crearEtiquetaPlaceholder(placeholderTexto));
  if (url) {
    box.appendChild(crearImagen(url, '', fallback));
  } else {
    fallback();
  }
}

function mostrarToast(mensaje, tipo) {
  const zona = document.getElementById('toast-zone');
  if (!zona || typeof bootstrap === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'toast align-items-center text-bg-' + tipo + ' border-0';
  el.setAttribute('role', 'alert');
  const cuerpo = document.createElement('div');
  cuerpo.className = 'd-flex';
  const texto = document.createElement('div');
  texto.className = 'toast-body';
  texto.textContent = mensaje;
  const cierre = document.createElement('button');
  cierre.type = 'button';
  cierre.className = 'btn-close btn-close-white me-2 m-auto';
  cierre.setAttribute('data-bs-dismiss', 'toast');
  cierre.setAttribute('aria-label', 'Cerrar');
  cuerpo.appendChild(texto);
  cuerpo.appendChild(cierre);
  el.appendChild(cuerpo);
  zona.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3500 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function pintarFormulario(d) {
  document.getElementById('f-categoria').value = d.category;
  document.getElementById('f-titulo').value = d.title;
  document.getElementById('f-dia').value = d.date.day;
  document.getElementById('f-mes').value = d.date.month;
  document.getElementById('f-anio').value = d.date.year;
  document.getElementById('f-url').value = d.image.url;
  document.getElementById('f-placeholder').value = d.image.placeholder;
  actualizarVistaPrevia(d.image.url, d.image.placeholder);

  const modo = document.getElementById('modo-datos');
  if (modo) {
    modo.textContent = MODO_SERVIDOR
      ? 'Modo servidor · escribe en data.json'
      : 'Modo navegador · guarda solo aqui';
  }
}

function recolectarFormulario() {
  return {
    category: document.getElementById('f-categoria').value.trim(),
    title: document.getElementById('f-titulo').value.trim(),
    date: {
      day: document.getElementById('f-dia').value.trim(),
      month: document.getElementById('f-mes').value.trim().toUpperCase(),
      year: document.getElementById('f-anio').value.trim()
    },
    image: {
      url: document.getElementById('f-url').value.trim(),
      placeholder: document.getElementById('f-placeholder').value.trim()
    }
  };
}

function completarConSemilla(datos) {
  if (!datos.category) datos.category = DEFAULT_DATA.featured.category;
  if (!datos.date.day) datos.date.day = DEFAULT_DATA.featured.date.day;
  if (!datos.date.month) datos.date.month = DEFAULT_DATA.featured.date.month;
  if (!datos.date.year) datos.date.year = DEFAULT_DATA.featured.date.year;
  if (!datos.image.placeholder) datos.image.placeholder = DEFAULT_DATA.featured.image.placeholder;
  return datos;
}

async function inicializarFormulario() {
  const autorizado = await verificarSesion();
  if (!autorizado) return;

  const datosActuales = await obtenerDatos();
  pintarFormulario(datosActuales);

  const form = document.getElementById('edit-form');
  const errorBox = document.getElementById('form-error');

  const mostrarError = mensaje => {
    errorBox.textContent = mensaje;
    errorBox.hidden = false;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.hidden = true;

    let datos = recolectarFormulario();
    if (!datos.title) {
      mostrarError('El titulo es obligatorio.');
      document.getElementById('f-titulo').focus();
      return;
    }
    datos = completarConSemilla(datos);

    const botonGuardar = form.querySelector('button[type="submit"]');
    botonGuardar.disabled = true;
    try {
      await persistirDatos(datos);
      mostrarToast('Cambios guardados. Volviendo a la portada...', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
      mostrarError('No se pudo guardar. Abriste con iniciar-servidor.bat? (' + err.message + ')');
      botonGuardar.disabled = false;
    }
  });

  document.getElementById('f-url').addEventListener('input', e => {
    actualizarVistaPrevia(e.target.value.trim(), document.getElementById('f-placeholder').value.trim());
  });

  document.getElementById('btn-confirmar-restaurar').addEventListener('click', async () => {
    const modalEl = document.getElementById('modal-restaurar');
    const modal = bootstrap.Modal.getInstance(modalEl);
    try {
      await restablecerOriginales();
      pintarFormulario(JSON.parse(JSON.stringify(DEFAULT_DATA.featured)));
      if (modal) modal.hide();
      mostrarToast('Valores originales restaurados.', 'success');
    } catch (err) {
      if (modal) modal.hide();
      mostrarError('No se pudo restaurar. Abriste con iniciar-servidor.bat? (' + err.message + ')');
    }
  });

  const salir = () => cerrarSesion();
  document.getElementById('btn-logout').addEventListener('click', salir);
  document.getElementById('btn-logout-mobile').addEventListener('click', salir);
}

function inicializarLogin() {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.hidden = true;

    const usuario = document.getElementById('l-usuario').value.trim();
    const clave = document.getElementById('l-clave').value;
    if (!usuario || !clave) {
      errorBox.textContent = 'Usuario y contraseña obligatorios.';
      errorBox.hidden = false;
      return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    const resultado = await iniciarSesion(usuario, clave);
    if (resultado.ok) {
      window.location.href = 'admin.html';
    } else {
      errorBox.textContent = resultado.error;
      errorBox.hidden = false;
      boton.disabled = false;
      document.getElementById('l-clave').value = '';
      document.getElementById('l-clave').focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('featured-media')) renderizarDestacado();
  if (document.getElementById('edit-form')) inicializarFormulario();
  if (document.getElementById('login-form')) inicializarLogin();
});
