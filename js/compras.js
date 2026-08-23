function formatearPrecio(n) {
  return '$' + n.toLocaleString('es-AR');
}

function inicializarModalCompras() {
  const overlay = document.getElementById('modal-compras');
  if (!overlay) return;

  let cantidad = 0;
  let precioUnitario = 1000;
  let valorCompra = 0;

  const btnAbrir = document.getElementById('btn-compras');
  const btnCerrar = document.getElementById('cerrar-modal');
  const btnMas = document.getElementById('btn-mas');
  const btnMenos = document.getElementById('btn-menos');
  const contador = document.getElementById('contador');
  const inputPrecio = document.getElementById('precio-unitario');
  const btnIrComprar = document.getElementById('btn-ir-comprar');
  const textoTotal = document.getElementById('valor-compra');

  function recalcular() {
    valorCompra = cantidad * precioUnitario;
    contador.textContent = cantidad;
    textoTotal.textContent = formatearPrecio(valorCompra);
    btnIrComprar.disabled = cantidad < 1 || precioUnitario < 1;
  }

  btnAbrir.addEventListener('click', () => {
    overlay.hidden = false;
  });

  btnCerrar.addEventListener('click', () => {
    overlay.hidden = true;
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.hidden = true;
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) overlay.hidden = true;
  });

  btnMas.addEventListener('click', () => {
    cantidad++;
    recalcular();
  });

  btnMenos.addEventListener('click', () => {
    if (cantidad > 0) {
      cantidad--;
      recalcular();
    }
  });

  inputPrecio.addEventListener('input', () => {
    precioUnitario = parseInt(inputPrecio.value, 10);
    if (isNaN(precioUnitario) || precioUnitario < 0) precioUnitario = 0;
    recalcular();
  });

  btnIrComprar.addEventListener('click', () => {
    localStorage.setItem('compra', JSON.stringify({
      cantidad,
      precioUnitario,
      total: valorCompra
    }));
    window.location.href = 'comprar.html';
  });

  recalcular();
}

function mostrarResultadoDePago(resultado) {
  const panel = document.getElementById('pago-resultado');
  if (!panel) return false;

  const textos = {
    exito: {
      titulo: '¡Pago aprobado!',
      mensaje: 'Tu pago fue acreditado con exito. Gracias por tu compra.',
      fallo: false
    },
    pendiente: {
      titulo: 'Pago pendiente',
      mensaje: 'Tu pago quedo en proceso. Te avisaremos cuando se acredite.',
      fallo: false
    },
    fallo: {
      titulo: 'Pago no completado',
      mensaje: 'El pago fue rechazado o cancelado. Podes intentarlo de nuevo.',
      fallo: true
    }
  };

  const info = textos[resultado];
  if (!info) return false;

  panel.hidden = true;
  panel.classList.toggle('fallo', info.fallo);
  document.getElementById('resultado-titulo').textContent = info.titulo;
  document.getElementById('resultado-mensaje').textContent = info.mensaje;
  panel.hidden = false;
  return true;
}

function simularPago(boton) {
  boton.textContent = 'Procesando pago...';
  setTimeout(() => {
    localStorage.removeItem('compra');
    document.getElementById('resumen-compra').hidden = true;
    document.getElementById('pago-exitoso').hidden = false;
  }, 1200);
}

async function pagarConMercadoPago(compra, boton) {
  try {
    const r = await fetch('/.netlify/functions/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cantidad: compra.cantidad,
        precioUnitario: compra.precioUnitario
      })
    });
    if (!r.ok) return false;
    const data = await r.json();
    if (!data || !data.initPoint) return false;
    window.location.href = data.initPoint;
    return true;
  } catch (e) {
    return false;
  }
}

function inicializarPaginaComprar() {
  const panel = document.getElementById('resumen-compra');
  if (!panel) return;

  const panelVacio = document.getElementById('compra-vacia');

  const params = new URLSearchParams(window.location.search);
  const resultadoPago = params.get('pago');
  if (resultadoPago) {
    localStorage.removeItem('compra');
    panel.hidden = true;
    panelVacio.hidden = true;
    if (mostrarResultadoDePago(resultadoPago)) {
      history.replaceState({}, '', 'comprar.html');
      return;
    }
  }

  let compra = null;
  try {
    compra = JSON.parse(localStorage.getItem('compra'));
  } catch (e) {}

  if (!compra || !compra.cantidad || compra.cantidad < 1 || !compra.total) {
    panel.hidden = true;
    panelVacio.hidden = false;
    return;
  }

  document.getElementById('c-cantidad').textContent =
    compra.cantidad + (compra.cantidad === 1 ? ' unidad' : ' unidades');
  document.getElementById('c-precio').textContent = formatearPrecio(compra.precioUnitario);
  document.getElementById('c-total').textContent = formatearPrecio(compra.total);

  const btnPagar = document.getElementById('btn-pagar');

  btnPagar.addEventListener('click', async () => {
    btnPagar.disabled = true;
    const lanzado = await pagarConMercadoPago(compra, btnPagar);
    if (lanzado) return;
    simularPago(btnPagar);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarModalCompras();
  inicializarPaginaComprar();
});
