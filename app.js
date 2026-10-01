const WA_NUMERO = "573214978435";
const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
if (!("IntersectionObserver" in window)) document.documentElement.classList.remove("js");


// =========================================================
// DATOS DE PRODUCTOS (121 productos, ver productos.js)
// =========================================================
      // =========================================================
// ESTADO GLOBAL
// =========================================================
let categoriaActual = "mujer";
let filtroActual = "todos";
let carrito = [];
try { carrito = (JSON.parse(localStorage.getItem("carrito")) || []).map((it) => ({ ...it, cantidad: it.cantidad || 1 })); } catch (e) { carrito = []; }
let productoModalActual = null;
let tallaSeleccionada = "50ml";

// =========================================================
// UTILIDAD - ESCAPAR TEXTO (seguridad al insertar en HTML)
// =========================================================
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML.replace(/"/g, "&quot;");
}

// =========================================================
// CREAR TARJETA DE PRODUCTO (HTML reutilizable)
// =========================================================
function crearTarjetaHTML(categoria, idxOriginal, prod) {
  const precio = prod.esEconomico
    ? `<span class="precio-actual">Desde ${prod.precio50}</span>`
    : `${prod.precioAnterior ? `<s class="precio-tachado">${prod.precioAnterior}</s>` : ""}<span class="precio-actual">${prod.precioPromocion}</span>`;
  return `
    <article class="producto" data-index="${idxOriginal}" data-categoria="${categoria}">
      <button type="button" class="imagen-producto" onclick="abrirDetalle('${categoria}', ${idxOriginal})" aria-label="Ver detalle de ${escaparHTML(prod.nombre)}">
        <img src="${prod.img}" alt="${escaparHTML(prod.nombre)}" loading="lazy" width="400" height="400">
      </button>
      <div class="info-producto">
        <h3 class="nombre-locion">${escaparHTML(prod.nombre)}</h3>
        <p class="precio-tarjeta">${precio}</p>
      </div>
      <div class="acciones">
        <button class="boton-ver-detalle" onclick="abrirDetalle('${categoria}', ${idxOriginal})" aria-label="Ver detalle de ${escaparHTML(prod.nombre)}">Detalle</button>
        <button class="boton-agregar-carrito" onclick="agregarAlCarrito('${categoria}', ${idxOriginal})" aria-label="Agregar ${escaparHTML(prod.nombre)} al carrito">Agregar</button>
      </div>
    </article>`;
}

// =========================================================
// MONTAR PRODUCTOS EN EL DOM (observer + contador carrito)
// =========================================================
function montarProductosEnDOM(html) {
  const contenedor = document.getElementById("contenedor-catalogo");
  contenedor.innerHTML = html;

  if (window.observador) window.observador.disconnect();
  window.observador = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".producto").forEach((el) => {
    window.observador.observe(el);
  });

  actualizarContadorCarrito();
}

// =========================================================
// RENDERIZAR CATÁLOGO
// =========================================================
function renderizarCatalogo(categoria, filtro) {
  const contenedor = document.getElementById("contenedor-catalogo");
  const productosCat = productos[categoria] || [];
  let productosFiltrados = productosCat;

  if (filtro !== "todos") {
    if (filtro === "precio-bajo") {
      productosFiltrados = productosFiltrados.filter((p) => {
        const precio = parseInt(
          p.precioPromocion
            ? p.precioPromocion.replace(/[$.]/g, "")
            : "0",
        );
        return precio < 100000;
      });
    } else if (filtro === "precio-alto") {
      productosFiltrados = productosFiltrados.filter((p) => {
        const precio = parseInt(
          p.precioPromocion
            ? p.precioPromocion.replace(/[$.]/g, "")
            : "0",
        );
        return precio >= 100000;
      });
    } else {
      productosFiltrados = productosFiltrados.filter(
        (p) => p.tipo === filtro,
      );
    }
  }

  if (productosFiltrados.length === 0) {
    contenedor.innerHTML = `<p style="text-align:center; color:#888; grid-column:1/-1;">No hay productos que coincidan con este filtro.</p>`;
    return;
  }

  let html = "";
  productosFiltrados.forEach((prod) => {
    const idxOriginal = productosCat.indexOf(prod);
    html += crearTarjetaHTML(categoria, idxOriginal, prod);
  });

  montarProductosEnDOM(html);
}

// =========================================================
// BUSCADOR DE LOCIONES
// =========================================================
let temporizadorBusqueda = null;

function buscarLocion(textoCrudo) {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(
    () => ejecutarBusqueda(textoCrudo),
    150,
  );
}

function ejecutarBusqueda(textoCrudo) {
  const texto = textoCrudo.trim();
  const botonLimpiar = document.getElementById("boton-limpiar-busqueda");
  botonLimpiar.style.display = texto ? "block" : "none";

  if (!texto) {
    // Sin texto: volver al catálogo normal por categoría
    document.getElementById("filtros-adicionales").style.display = "flex";
    renderizarCatalogo(categoriaActual, filtroActual);
    return;
  }

  // Mientras se busca, ocultamos los filtros de precio/tipo (no aplican a una búsqueda global)
  document.getElementById("filtros-adicionales").style.display = "none";

  const textoBusqueda = norm(texto);
  let resultados = [];

  Object.keys(productos).forEach((categoria) => {
    productos[categoria].forEach((prod, idxOriginal) => {
      const coincide =
        norm(prod.nombre).includes(textoBusqueda) ||
        (prod.desc && norm(prod.desc).includes(textoBusqueda));
      if (coincide) {
        resultados.push({ categoria, idxOriginal, prod });
      }
    });
  });

  mostrarResultadosBusqueda(resultados, texto);
}

function mostrarResultadosBusqueda(resultados, textoBuscado) {
  if (resultados.length === 0) {
    const textoSeguro = escaparHTML(textoBuscado);
    const mensajeWhatsApp = `Hola, estoy buscando la loción "${textoBuscado}". ¿La manejan?`;
    const html = `
              <div class="sin-resultados">
                  <p class="sin-resultados-texto">No encontramos "<strong>${textoSeguro}</strong>" en nuestro catálogo.</p>
                  <p class="sin-resultados-subtexto">Puede que la tengamos disponible aunque no aparezca aquí. Pregúntanos directamente y te confirmamos.</p>
                  <a href="https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensajeWhatsApp)}" target="_blank" rel="noopener noreferrer" class="boton-dorado">Preguntar por WhatsApp</a>
              </div>
          `;
    document.getElementById("contenedor-catalogo").innerHTML = html;
    if (window.observador) window.observador.disconnect();
    return;
  }

  let html = "";
  resultados.forEach(({ categoria, idxOriginal, prod }) => {
    html += crearTarjetaHTML(categoria, idxOriginal, prod);
  });

  montarProductosEnDOM(html);
}

function limpiarBusqueda() {
  const input = document.getElementById("buscador-locion");
  input.value = "";
  input.focus();
  ejecutarBusqueda("");
}

// =========================================================
// CAMBIAR CATEGORÍA
// =========================================================
function mostrarCatalogo(categoria, boton) {
  categoriaActual = categoria;
  document
    .querySelectorAll(".boton-categoria")
    .forEach((btn) => { btn.classList.remove("activo"); btn.setAttribute("aria-pressed", "false"); });
  boton.classList.add("activo");
  boton.setAttribute("aria-pressed", "true");

  // Al cambiar de categoría, se limpia cualquier búsqueda activa
  const buscador = document.getElementById("buscador-locion");
  if (buscador.value) {
    buscador.value = "";
    document.getElementById("boton-limpiar-busqueda").style.display =
      "none";
  }
  document.getElementById("filtros-adicionales").style.display = "flex";

  renderizarCatalogo(categoria, filtroActual);
  if (document.querySelector(".categorias").getBoundingClientRect().top < 80)
          document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

// =========================================================
// APLICAR FILTROS ADICIONALES
// =========================================================
function aplicarFiltros(filtro, boton) {
  filtroActual = filtro;
  document
    .querySelectorAll(".filtro-opcion")
    .forEach((btn) => { btn.classList.remove("activo"); btn.setAttribute("aria-pressed", "false"); });
  boton.classList.add("activo");
  boton.setAttribute("aria-pressed", "true");
  renderizarCatalogo(categoriaActual, filtro);
}

// =========================================================
// MODAL - ABRIR
// =========================================================
function abrirDetalle(categoria, index) {
  const prod = productos[categoria][index];
  productoModalActual = { categoria, index };

  document.getElementById("modal-spinner").style.display = "block";
  document.getElementById("modal-imagen").style.display = "none";

  document.getElementById("modal-nombre").textContent = prod.nombre;
  document.getElementById("modal-descripcion").textContent = prod.desc;

  const esEconomico = prod.esEconomico || false;
  if (esEconomico) {
    document.getElementById("modal-precios").style.display = "none";
    document.getElementById("modal-precios-tamanos").style.display =
      "flex";
    document.getElementById("modal-precio-50").textContent =
      prod.precio50;
    document.getElementById("modal-precio-100").textContent =
      prod.precio100;
    document.getElementById("modal-selector-talla").style.display =
      "flex";
    tallaSeleccionada = "50ml";
    document
      .querySelectorAll("#modal-selector-talla button")
      .forEach((btn) => {
        btn.classList.toggle("activo", btn.dataset.talla === "50ml");
      });
  } else {
    document.getElementById("modal-precios").style.display = "flex";
    document.getElementById("modal-precios-tamanos").style.display =
      "none";
    document.getElementById("modal-precio-anterior").textContent =
      prod.precioAnterior;
    document.getElementById("modal-precio-promocion").textContent =
      prod.precioPromocion;
    document.getElementById("modal-selector-talla").style.display =
      "none";
  }

  const img = document.getElementById("modal-imagen");
  img.onload = function () {
    document.getElementById("modal-spinner").style.display = "none";
    img.style.display = "block";
  };
  img.onerror = function () {
    document.getElementById("modal-spinner").style.display = "none";
    img.style.display = "block";
    img.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5-5 5-4-4-3 3"/%3E%3C/svg%3E';
  };
  img.src = prod.img;

  actualizarBotonWhatsApp(prod);

  document.getElementById("modal-overlay").classList.add("activo");
  document.body.classList.add("sin-scroll");
}

function actualizarBotonWhatsApp(prod) {
  const esEconomico = prod.esEconomico || false;
  let mensaje = `Hola, estoy interesado en ${prod.nombre}`;
  if (esEconomico) {
    mensaje += ` (talla ${tallaSeleccionada}: ${tallaSeleccionada === "50ml" ? prod.precio50 : prod.precio100})`;
  } else {
    mensaje += ` (${prod.precioPromocion})`;
  }
  document.getElementById("modal-whatsapp").href =
    `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function seleccionarTalla(talla, boton) {
  tallaSeleccionada = talla;
  document
    .querySelectorAll("#modal-selector-talla button")
    .forEach((btn) => { btn.classList.remove("activo"); btn.setAttribute("aria-pressed", "false"); });
  boton.classList.add("activo");
  boton.setAttribute("aria-pressed", "true");
  if (productoModalActual) {
    const prod =
      productos[productoModalActual.categoria][productoModalActual.index];
    actualizarBotonWhatsApp(prod);
  }
}

function cerrarDetalle() {
  document.getElementById("modal-overlay").classList.remove("activo");
  document.body.classList.remove("sin-scroll");
  productoModalActual = null;
}

function cerrarDetalleSiEsFondo(event) {
  if (event.target.id === "modal-overlay") cerrarDetalle();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarDetalle();
    cerrarCarrito();
  }
});

// =========================================================
// CARRITO - AGREGAR
// =========================================================
const precioNum = (t) => parseInt(String(t).replace(/\D/g, "")) || 0;
const fmtCOP = (n) => "$" + n.toLocaleString("es-CO");
const totalCarrito = () => carrito.reduce((s, i) => s + precioNum(i.precio) * i.cantidad, 0);
function guardarCarrito() { try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch (e) {} }

function meterAlCarrito(categoria, index, talla) {
  const prod = productos[categoria][index];
  const eco = prod.esEconomico || false;
  const t = eco ? talla : null;
  const precio = eco ? (t === "100ml" ? prod.precio100 : prod.precio50) : prod.precioPromocion;
  const ya = carrito.find((i) => i.categoria === categoria && i.index === index && i.talla === t);
  if (ya) ya.cantidad++;
  else carrito.push({ nombre: prod.nombre, categoria, index, talla: t, precio, cantidad: 1 });
  guardarCarrito();
  actualizarContadorCarrito();
  mostrarToast(`"${prod.nombre}" agregado al carrito.`);
}
function agregarAlCarrito(categoria, index) { meterAlCarrito(categoria, index, "50ml"); }
function agregarAlCarritoDesdeModal() {
  if (productoModalActual) meterAlCarrito(productoModalActual.categoria, productoModalActual.index, tallaSeleccionada);
}

function actualizarContadorCarrito() {
  const n = carrito.reduce((s, i) => s + i.cantidad, 0);
  const c = document.getElementById("carrito-contador");
  c.textContent = n;
  c.style.display = n === 0 ? "none" : "flex";
}
function abrirCarrito() {
  document.getElementById("modal-carrito-overlay").classList.add("activo");
  document.body.classList.add("sin-scroll");
  renderizarCarrito();
}
function cerrarCarrito() {
  document.getElementById("modal-carrito-overlay").classList.remove("activo");
  document.body.classList.remove("sin-scroll");
}
function cerrarCarritoSiEsFondo(event) { if (event.target.id === "modal-carrito-overlay") cerrarCarrito(); }

function renderizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  document.getElementById("carrito-total").textContent = "Total: " + fmtCOP(totalCarrito());
  if (!carrito.length) { lista.innerHTML = `<div class="carrito-vacio">Tu carrito está vacío</div>`; return; }
  lista.innerHTML = carrito.map((it, i) => `
    <div class="item-carrito">
      <div class="item-carrito-info">
        <span class="item-carrito-nombre">${escaparHTML(it.nombre)}</span>
        <span class="item-carrito-precio">${fmtCOP(precioNum(it.precio) * it.cantidad)}</span>
        ${it.talla ? `<span class="item-carrito-talla">${it.talla}</span>` : ""}
      </div>
      <div class="cantidad">
        <button onclick="cambiarCantidad(${i}, -1)" aria-label="Quitar una unidad de ${escaparHTML(it.nombre)}">−</button>
        <span aria-live="polite">${it.cantidad}</span>
        <button onclick="cambiarCantidad(${i}, 1)" aria-label="Agregar una unidad de ${escaparHTML(it.nombre)}">+</button>
      </div>
      <button class="boton-eliminar-item" onclick="eliminarDelCarrito(${i})" aria-label="Eliminar ${escaparHTML(it.nombre)}">Eliminar</button>
    </div>`).join("");
}
function cambiarCantidad(i, d) {
  carrito[i].cantidad += d;
  if (carrito[i].cantidad < 1) carrito.splice(i, 1);
  guardarCarrito(); actualizarContadorCarrito(); renderizarCarrito();
}
function eliminarDelCarrito(i) { carrito.splice(i, 1); guardarCarrito(); actualizarContadorCarrito(); renderizarCarrito(); }
function vaciarCarrito() {
  if (!carrito.length) return;
  if (confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
    carrito = []; guardarCarrito(); actualizarContadorCarrito(); renderizarCarrito();
  }
}
function lineasPedido() {
  return carrito.map((it, i) => `${i + 1}. ${it.nombre}${it.talla ? ` (${it.talla})` : ""} x${it.cantidad} — ${fmtCOP(precioNum(it.precio) * it.cantidad)}`).join("\n");
}
function abrirWhatsAppPedido(intro, cierre) {
  if (!carrito.length) { mostrarToast("Tu carrito está vacío. Agrega productos primero."); return; }
  const mensaje = `${intro}\n\n${lineasPedido()}\n\nTotal: ${fmtCOP(totalCarrito())}${cierre}`;
  window.open(`https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  cerrarCarrito();
}
function enviarCarritoPorWhatsApp() { abrirWhatsAppPedido("Hola BRAAMOD, me gustaría pedir los siguientes productos:", ""); }
// Aún no hay pago automático: se pide el pago por WhatsApp.
function pagarConNequi() { abrirWhatsAppPedido("Hola BRAAMOD, quiero hacer este pedido:", "\n\nQuiero pagar por Nequi. ¿Me envían los datos de pago?"); }

// ---------- Menú hamburguesa ----------
function toggleMenu() {
  const nav = document.getElementById("nav-principal");
  const btn = document.getElementById("menu-hamburguesa");
  const abierto = nav.classList.toggle("abierto");
  btn.classList.toggle("activo", abierto);
  btn.setAttribute("aria-expanded", abierto);
  document.body.classList.toggle("sin-scroll", abierto);
}

function cerrarMenu() {
  const nav = document.getElementById("nav-principal");
  const btn = document.getElementById("menu-hamburguesa");
  nav.classList.remove("abierto");
  btn.classList.remove("activo");
  btn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sin-scroll");
}

// =========================================================
// TOAST (reemplaza alert nativo)
// =========================================================
function mostrarToast(mensaje) {
  let toast = document.getElementById("toast-braamod");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-braamod";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

// =========================================================
// INICIALIZAR
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  renderizarCatalogo("mujer", "todos");
  actualizarContadorCarrito();
});

// ---------- Accesibilidad de los modales (foco y tabulador) ----------
(function () {
  let previo = null;
  const abrir = (n, id) => { const o = window[n]; window[n] = function () { previo = document.activeElement; o.apply(this, arguments); const c = document.querySelector("#" + id + " .modal-cerrar"); if (c) c.focus(); }; };
  const cerrar = (n, id) => { const o = window[n]; window[n] = function () { const abierto = document.getElementById(id).classList.contains("activo"); o.apply(this, arguments); if (abierto && previo && previo.focus) previo.focus(); }; };
  abrir("abrirDetalle", "modal-overlay"); abrir("abrirCarrito", "modal-carrito-overlay");
  cerrar("cerrarDetalle", "modal-overlay"); cerrar("cerrarCarrito", "modal-carrito-overlay");
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const o = document.querySelector(".modal-overlay.activo");
    if (!o) return;
    const f = [...o.querySelectorAll("button, a[href]")].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  document.addEventListener("DOMContentLoaded", () =>
    document.querySelectorAll(".boton-categoria, .filtro-opcion").forEach((b) => b.setAttribute("aria-pressed", b.classList.contains("activo"))));
})();
