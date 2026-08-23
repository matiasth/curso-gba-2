let supabaseClient = null;

const INSTRUCCIONES_CONFIG =
  'Falta configurar Supabase: abre js/supabase-config.js y pega tu Project URL y anon key. ' +
  'Despues ejecuta supabase-setup.sql en el SQL Editor de tu proyecto.';

function cliente() {
  if (!supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function clonarSemilla() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA.featured));
}

async function obtenerDatos() {
  if (!configuracionLista()) return clonarSemilla();
  const { data, error } = await cliente()
    .from('site_data')
    .select('featured')
    .eq('id', 1)
    .single();
  if (error || !data || !data.featured) {
    console.warn('No se pudieron leer datos de Supabase:', error);
    return clonarSemilla();
  }
  return data.featured;
}

async function guardarDatos(featured) {
  const { data } = await cliente().auth.getSession();
  if (!data || !data.session) {
    throw new Error('Tu sesion expiro. Vuelve a iniciar sesion.');
  }
  const { error } = await cliente()
    .from('site_data')
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) {
    if (error.message && error.message.toLowerCase().includes('row-level security')) {
      throw new Error('Supabase bloqueo la escritura (RLS). Vuelve a iniciar sesion.');
    }
    throw new Error(error.message || 'Error desconocido al guardar.');
  }
}

async function verificarSesion() {
  if (!configuracionLista()) {
    window.location.href = 'login.html';
    return false;
  }
  const { data } = await cliente().auth.getSession();
  if (data && data.session) return true;
  window.location.href = 'login.html';
  return false;
}

async function iniciarSesion(email, clave) {
  const { error } = await cliente().auth.signInWithPassword({ email, password: clave });
  if (!error) return { ok: true };
  if (error.message && /invalid login credentials/i.test(error.message)) {
    return { ok: false, error: 'Email o contrasena incorrectos.' };
  }
  return { ok: false, error: error.message || 'No se pudo iniciar sesion.' };
}

async function cerrarSesion() {
  try {
    await cliente().auth.signOut();
  } catch (e) {}
  window.location.href = 'login.html';
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
  if (modo) modo.textContent = 'Base de datos · Supabase';
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
  const errorBox = document.getElementById('form-error');
  const mostrarError = mensaje => {
    errorBox.textContent = mensaje;
    errorBox.hidden = false;
  };

  if (!configuracionLista()) {
    mostrarError(INSTRUCCIONES_CONFIG);
    formDeshabilitar(true);
    return;
  }

  const autorizado = await verificarSesion();
  if (!autorizado) return;

  pintarFormulario(await obtenerDatos());

  const form = document.getElementById('edit-form');

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
      await guardarDatos(datos);
      mostrarToast('Cambios guardados en la base de datos. Volviendo a la portada...', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
      mostrarError(err.message);
      botonGuardar.disabled = false;
      if (/sesion expiro/i.test(err.message)) {
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      }
    }
  });

  document.getElementById('f-url').addEventListener('input', e => {
    actualizarVistaPrevia(e.target.value.trim(), document.getElementById('f-placeholder').value.trim());
  });

  document.getElementById('btn-confirmar-restaurar').addEventListener('click', async () => {
    const modalEl = document.getElementById('modal-restaurar');
    const modal = bootstrap.Modal.getInstance(modalEl);
    try {
      await guardarDatos(clonarSemilla());
      pintarFormulario(clonarSemilla());
      if (modal) modal.hide();
      mostrarToast('Valores originales restaurados.', 'success');
    } catch (err) {
      if (modal) modal.hide();
      mostrarError(err.message);
    }
  });

  const salir = () => cerrarSesion();
  document.getElementById('btn-logout').addEventListener('click', salir);
  document.getElementById('btn-logout-mobile').addEventListener('click', salir);
}

function formDeshabilitar(deshabilitar) {
  document.querySelectorAll('#edit-form button, #edit-form input, #edit-form textarea')
    .forEach(el => { el.disabled = deshabilitar; });
}

function inicializarLogin() {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');

  if (!configuracionLista()) {
    errorBox.textContent = INSTRUCCIONES_CONFIG;
    errorBox.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.hidden = true;

    const email = document.getElementById('l-email').value.trim();
    const clave = document.getElementById('l-clave').value;
    if (!email || !clave) {
      errorBox.textContent = 'Email y contrasena obligatorios.';
      errorBox.hidden = false;
      return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    const resultado = await iniciarSesion(email, clave);
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
