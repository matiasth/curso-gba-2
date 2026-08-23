const STORAGE_KEY = 'es_featured_v1';
let MODO_SERVIDOR = false;

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

  MODO_SERVIDOR = false;
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
      throw new Error('El servidor rechazó el guardado (HTTP ' + res.status + ').');
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
  span.className = 'media-label';
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
  box.querySelectorAll('.media-img, .media-label').forEach(el => el.remove());
  const fallback = () => box.appendChild(crearEtiquetaPlaceholder(placeholderTexto));
  if (url) {
    box.appendChild(crearImagen(url, '', fallback));
  } else {
    fallback();
  }
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
      ? 'Modo servidor: los cambios se escriben en data.json'
      : 'Modo sin servidor: los cambios se guardan solo en este navegador';
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

async function inicializarFormulario() {
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

    const datos = recolectarFormulario();
    if (!datos.title) {
      mostrarError('El título es obligatorio.');
      document.getElementById('f-titulo').focus();
      return;
    }
    if (!datos.category) datos.category = DEFAULT_DATA.featured.category;
    if (!datos.date.day) datos.date.day = DEFAULT_DATA.featured.date.day;
    if (!datos.date.month) datos.date.month = DEFAULT_DATA.featured.date.month;
    if (!datos.date.year) datos.date.year = DEFAULT_DATA.featured.date.year;
    if (!datos.image.placeholder) datos.image.placeholder = DEFAULT_DATA.featured.image.placeholder;

    const botonGuardar = form.querySelector('button[type="submit"]');
    botonGuardar.disabled = true;
    try {
      await persistirDatos(datos);
      window.location.href = 'index.html';
    } catch (err) {
      mostrarError('No se pudo guardar. ¿Abriste la página con iniciar-servidor.bat? (' + err.message + ')');
      botonGuardar.disabled = false;
    }
  });

  document.getElementById('f-url').addEventListener('input', e => {
    actualizarVistaPrevia(e.target.value.trim(), document.getElementById('f-placeholder').value.trim());
  });

  document.getElementById('btn-restaurar').addEventListener('click', async () => {
    if (confirm('¿Restaurar los valores originales de la semilla? Se descartarán los cambios actuales.')) {
      try {
        await restablecerOriginales();
        pintarFormulario(JSON.parse(JSON.stringify(DEFAULT_DATA.featured)));
        actualizarVistaPrevia(DEFAULT_DATA.featured.image.url, DEFAULT_DATA.featured.image.placeholder);
      } catch (err) {
        mostrarError('No se pudo restaurar. ¿Abriste la página con iniciar-servidor.bat? (' + err.message + ')');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('featured-media')) renderizarDestacado();
  if (document.getElementById('edit-form')) inicializarFormulario();
});
