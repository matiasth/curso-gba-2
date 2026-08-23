# Prompt: Clon fiel de la portada de "Eurovision Spain"

> Copia todo el contenido de este archivo y pégalo como prompt único en OpenCode.
> Es 100% autocontenido: no necesita ninguna imagen externa.

---

## ROL Y OBJETIVO

Actúa como desarrollador front-end senior. Crea el código HTML5 semántico + CSS (embebido en un único archivo `index.html`) que reproduzca **lo más fielmente posible** la portada del sitio web "Eurovision Spain", basándote **exclusivamente** en la especificación de este documento. No hay imagen de referencia: esta especificación es la única fuente de verdad.

**Reglas estrictas:**
- NO inventes secciones adicionales (sin footer, sin menús de navegación extra, sin banners).
- NO uses JavaScript salvo que sea imprescindible (no lo es).
- NO cargues imágenes externas: usa placeholders CSS según se indica.
- Todo el texto visible debe coincidir EXACTAMENTE con los textos literales indicados abajo.

---

## 1. ENTREGABLE

Un único archivo `index.html` autocontenido:

- `<style>` embebido en el `<head>`.
- Sin dependencias externas (ni Google Fonts ni CDNs): usa una pila de fuentes de sistema.
- Código limpio, indentado, sin comentarios innecesarios.

---

## 2. ESTILOS BASE Y PALETA DE COLORES

**Tipografía:** `"Segoe UI", Roboto, Helvetica Neue, Arial, sans-serif`. Color base de texto `#1a1a1a`.

**Paleta corporativa (defínela como variables CSS en `:root`):**

| Variable | Valor | Uso |
|---|---|---|
| `--azul-principal` | `#0033A0` | Enlace VOTA, icono hamburguesa activo, hover |
| `--azul-logo` | `#2B407C` | Logotipo "EUROVISION SPAIN" |
| `--rosa` | `#D11D5D` | Overlays de fecha y enlaces de categoría |
| `--gris-fondo` | `#F4F4F4` | Fondos neutros |
| `--gris-placeholder` | `#d8d8d8` | Fondo de los placeholders de imagen |
| `--blanco` | `#FFFFFF` | Fondo de página |
| `--texto` | `#1a1a1a` | Titulares |
| `--texto-suave` | `#6b6b6b` | Textos secundarios del widget |

**Layout base:**
- `.container`: `max-width: 1200px; margin: 0 auto; padding: 0 20px;`
- `body { margin: 0; background: var(--blanco); }`

---

## 3. HEADER (`<header>`)

Flexbox: `display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid #e5e5e5;`

### 3.1 Lado izquierdo — Marca
- Enlace `<a>` conteniendo un flexbox horizontal con `gap:10px`.
- Icono hamburguesa decorativo a la izquierda: tres barras horizontales (`<span>` apilados o SVG), color `var(--azul-logo)`, cada barra ~22px de ancho × 3px de alto, separadas 4px.
- Texto del logo en dos líneas, `text-transform:uppercase`, `font-weight:800`, `font-size:1.15rem`, `line-height:1.1`, `letter-spacing:0.02em`, color `var(--azul-logo)`:
  - Línea 1: `EUROVISION`
  - Línea 2: `SPAIN`

### 3.2 Lado derecho — Utilidades
Contenedor flexbox `align-items:center; gap:24px;`.

**A) Widget "Eurocanción del día":**
- Flexbox horizontal `align-items:center; gap:12px; padding-right:24px; border-right:1px solid #cccccc;`
- Bloque de texto:
  - Línea superior: `<span>` — `LA EUROCANCIÓN DEL DÍA` — `font-size:0.7rem`, `font-weight:700`, `color:#1a1a1a`, `text-transform:uppercase`.
  - Línea inferior: `<span>` — `La teva decisió / Get A Life - Susanne Georgi (2009)` — `font-size:0.7rem`, `color:var(--texto-suave)`.
  - Debajo, alineado a la derecha: enlace `VOTA` — `color:var(--azul-principal)`, `font-weight:700`, `font-size:0.75rem`, `text-transform:uppercase`.
- Avatar circular: elemento de 48px de diámetro, `border-radius:50%`, fondo `#bfbfbf`, `border:2px solid #3fa34d` (verde fino). Dentro, centrado, un emoji o iniciales `SG` en blanco `font-size:1rem`.

**B) Contenedor de iconos:** flexbox `gap:14px`. Todos los iconos son SVG inline de 20×20px:
1. Icono de usuario/persona — color `#333333`, dentro de botón circular transparente de 40px con borde `1px solid #dddddd`.
2. Icono de calendario — igual al anterior.
3. Icono de lupa/búsqueda — igual al anterior.
4. Botón circular de menú: círculo de 40px relleno con `background:var(--azul-principal)` e icono hamburguesa de tres líneas blancas centrado.

Todos los botones: `border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:50%;`

---

## 4. CONTENIDO PRINCIPAL (`<main class="container">`)

Cuadrícula CSS: `display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:32px; padding:32px 20px;`

### 4.1 Columna A — Noticia destacada (`<article class="featured">`)

**Imagen (placeholder):**
- `<div class="media featured-media">` con `position:relative; aspect-ratio:16/9; background:var(--gris-placeholder); overflow:hidden;`
- Centrado dentro del placeholder: `<span>` con el texto `[FOTO: Fachada del edificio moderno de AVROTROS con su logotipo azul visible]` — `color:#888888; font-size:0.9rem; text-align:center; padding:0 24px;`

**Overlay de fecha (reutilizable, clase `.date-badge`):**
```css
.date-badge {
  position: absolute; top: 0; left: 0;
  background: var(--rosa); color: #fff;
  text-align: center; padding: 10px 14px;
  display: flex; flex-direction: column;
}
.date-badge .day   { font-size: 1.8rem; font-weight: 800; line-height: 1; }
.date-badge .month { font-size: 0.85rem; font-weight: 600; letter-spacing: .05em; }
.date-badge .year  { font-size: 0.85rem; font-weight: 400; }
```

**Cuerpo del artículo (debajo de la imagen):**
- Categoría: `<a class="category">Países Bajos</a>` — `display:inline-block; margin-top:16px; color:var(--rosa); font-weight:700; font-size:0.95rem;`
- Título: `<h1 class="title">` — `margin:8px 0 0; font-size:2.1rem; line-height:1.25; font-weight:800; color:var(--texto);`

**Texto literal del H1:**
```
El Gobierno neerlandés apunta a otra televisión pública si AVROTROS renuncia a Eurovisión 2027
```

### 4.2 Columna B — Cuadrícula secundaria

`<div class="grid-secondary">` con `display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px;`

Cada artículo `<article class="article-small">` replica la estructura de la destacada con estos cambios:
- Placeholder: `aspect-ratio:4/3;`
- Overlay de fecha idéntico (`.date-badge`) sobre cada placeholder.
- Categoría: mismo estilo rosa, `font-size:0.85rem`.
- Título: `<h3 class="title">` — `margin:6px 0 0; font-size:1.05rem; line-height:1.35; font-weight:700; color:var(--texto);`

**Los 4 artículos, en orden (fila 1 izquierda→derecha, fila 2 izquierda→derecha):**

| # | Fecha (día/mes/año) | Texto del placeholder | Categoría | Título literal |
|---|---|---|---|---|
| 1 | 21 / AGO / 2026 | `[FOTO: Loreen actuando en un escenario oscuro con luces rojas]` | Suiza | `Suiza ya busca a su representante para Eurovisión 2027` |
| 2 | 20 / AGO / 2026 | `[FOTO: Vista aérea nocturna de la ciudad de Burgas con un gran estadio abovedado iluminado]` | Eurovisión | `Burgas recibe una financiación millonaria del Gobierno búlgaro para organizar Eurovisión 2027` |
| 3 | 20 / AGO / 2026 | `[FOTO: Petter Settman, hombre con barba y traje, hablando en un escenario]` | Eurovision Asia | `Petter Settman, productor de Eurovisión Asia, dimite por «motivos personales»` |
| 4 | 20 / AGO / 2026 | `[FOTO: Hans Abrahamsson, hombre con gafas y camisa gris, sonriendo frente a un panel de televisión]` | Suecia | `Hans Abrahamsson será el nuevo director del <em>Melodifestivalen</em>` |

⚠️ Nota del artículo 4: la palabra *Melodifestivalen* va en cursiva (`<em>`).

---

## 5. RESPONSIVIDAD

Usa media queries con estos puntos de corte:

- **≤1024px:** `main` pasa a UNA columna (destacada arriba, secundaria debajo). La cuadrícula secundaria mantiene sus 2 columnas. El widget de Eurocanción puede ocultar su línea inferior si desborda.
- **≤768px:** header en columna (`flex-direction:column; gap:16px;`), utilidades envueltas con `flex-wrap:wrap; justify-content:center;`. Cuadrícula secundaria a UNA columna. El H1 baja a `1.6rem`.
- **≤480px:** H1 a `1.35rem`; ocultar el bloque de texto del widget dejando solo el avatar y los iconos si es necesario para evitar overflow horizontal.

Nunca debe aparecer scroll horizontal en ningún breakpoint.

---

## 6. INTERACTIVIDAD (CSS)

- Transición global en enlaces: `transition:color .2s ease;`
- Hover de categorías: cambia a `var(--azul-principal)`.
- Hover de titulares (el enlace que envuelve al título): cambia a `var(--azul-principal)`.
- Hover de `VOTA`: subrayado (`text-decoration:underline`).
- Los placeholders y overlays no necesitan interacción.

---

## 7. ACCESIBILIDAD

- HTML5 semántico: `<header>`, `<main>`, `<article>`, `<section>`, `<nav>`.
- Los placeholders llevan `role="img"` y `aria-label` descriptivo (el texto de la etiqueta, sin corchetes).
- Botones de icono con `aria-label` ("Perfil de usuario", "Calendario", "Buscar", "Menú").
- Jerarquía correcta de encabezados: un solo `<h1>` (la destacada), `<h3>` en las secundarias.
- Contraste AA en todos los textos.

---

## 8. CHECKLIST DE AUTOVERIFICACIÓN (ejecuta antes de responder)

1. ¿El archivo es un único `index.html` autocontenido sin dependencias externas?
2. ¿La portada muestra exactamente 1 noticia destacada + 4 secundarias en cuadrícula 2×2?
3. ¿Cada imagen tiene su overlay rosa de fecha en la esquina superior izquierda con día/mes/año correctos?
4. ¿Los 5 títulos y las 5 categorías coinciden EXACTAMENTE (tildes incluidas) con la tabla del punto 4.2?
5. ¿El header tiene logo a la izquierda y (widget + avatar + 3 iconos + botón azul) a la derecha?
6. ¿A 375px de ancho no aparece scroll horizontal y todo se apila en una columna?
7. ¿Los hovers cambian el color a azul principal?

Si algún punto falla, corrígelo antes de entregar. Al terminar, indica brevemente cómo abrir el archivo en el navegador.
