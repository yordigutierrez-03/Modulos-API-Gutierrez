const API = "/api/v1";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  usuario: null,
  vista: "inicio",
  datos: {},
  cargando: new Set(),
};

const METADATA = {
  inicio: { titulo: "Resumen general", migas: "INICIO" },
  carreras: { titulo: "Carreras", migas: "CATÁLOGOS / CARRERAS" },
  estudiantes: { titulo: "Estudiantes", migas: "CATÁLOGOS / ESTUDIANTES" },
  docentes: { titulo: "Docentes", migas: "CATÁLOGOS / DOCENTES" },
  asignaturas: { titulo: "Asignaturas", migas: "CATÁLOGOS / ASIGNATURAS" },
  periodos: { titulo: "Periodos académicos", migas: "CATÁLOGOS / PERIODOS" },
  aulas: { titulo: "Aulas", migas: "CATÁLOGOS / AULAS" },
  secciones: { titulo: "Secciones", migas: "ACADÉMICO / SECCIONES" },
  matriculas: { titulo: "Matrículas", migas: "ACADÉMICO / MATRÍCULAS" },
  calificaciones: { titulo: "Calificaciones", migas: "ACADÉMICO / CALIFICACIONES" },
  usuarios: { titulo: "Usuario y rol", migas: "SISTEMA / USUARIO" },
};

const CONFIG = {
  carreras: {
    endpoint: "carreras",
    titulo: "Carreras",
    descripcion: "Catálogo de carreras y duración de cada programa.",
    buscar: true,
    columnas: [
      ["codigo", "Código"], ["nombre", "Nombre"], ["duracion_anios", "Duración"], ["activo", "Estado"],
    ],
    form: [
      ["codigo", "Código", "text", true], ["nombre", "Nombre", "text", true], ["duracion_anios", "Duración en años", "number", true, { min: 1, max: 10 }], ["activo", "Estado", "select", true, { options: [[true, "Activa"], [false, "Inactiva"]] }],
    ],
    payload: normalizeCareer,
  },
  estudiantes: {
    endpoint: "estudiantes", titulo: "Estudiantes", descripcion: "Registro y seguimiento de estudiantes.", buscar: true,
    columnas: [["cuenta", "Cuenta"], ["nombre", "Estudiante"], ["correo", "Correo"], ["carrera_nombre", "Carrera"], ["estado", "Estado"]],
    form: [
      ["nombres", "Nombres", "text", true], ["apellidos", "Apellidos", "text", true], ["cuenta", "Número de cuenta", "text", true], ["correo", "Correo", "email", true], ["telefono", "Teléfono", "text", false], ["fecha_nacimiento", "Fecha de nacimiento", "date", true], ["carrera_id", "Carrera", "select", true, { source: "carreras" }], ["estado", "Estado", "select", true, { options: [["ACTIVO", "Activo"], ["INACTIVO", "Inactivo"], ["GRADUADO", "Graduado"]] }],
    ],
    payload: normalizeStudent,
    extraRow: actionsStudent,
  },
  docentes: {
    endpoint: "docentes", titulo: "Docentes", descripcion: "Profesores, especialidades y estado laboral.", buscar: true,
    columnas: [["numero_empleado", "Empleado"], ["nombre", "Docente"], ["correo", "Correo"], ["especialidad", "Especialidad"], ["estado", "Estado"]],
    form: [["numero_empleado", "N.º de empleado", "text", true], ["nombres", "Nombres", "text", true], ["apellidos", "Apellidos", "text", true], ["correo", "Correo", "email", true], ["especialidad", "Especialidad", "text", true], ["estado", "Estado", "select", true, { options: [["ACTIVO", "Activo"], ["INACTIVO", "Inactivo"]] }]],
    payload: normalizeTeacher,
    extraRow: actionsTeacher,
  },
  asignaturas: {
    endpoint: "asignaturas", titulo: "Asignaturas", descripcion: "Plan de estudios, UV y requisitos.", buscar: true,
    columnas: [["codigo", "Código"], ["nombre", "Asignatura"], ["unidades_valorativas", "UV"], ["carrera_nombre", "Carrera"], ["requisito_codigo", "Requisito"], ["activo", "Estado"]],
    form: [["codigo", "Código", "text", true], ["nombre", "Nombre", "text", true], ["unidades_valorativas", "UV", "number", true, { min: 1, max: 8 }], ["carrera_id", "Carrera", "select", true, { source: "carreras" }], ["requisito_id", "Requisito", "select", false, { source: "asignaturas", empty: "Sin requisito" }], ["activo", "Estado", "select", true, { options: [[true, "Activa"], [false, "Inactiva"]] }]],
    payload: normalizeSubject,
  },
  periodos: {
    endpoint: "periodos", titulo: "Periodos académicos", descripcion: "Control de los periodos activos y sus fechas.",
    columnas: [["nombre", "Periodo"], ["fecha_inicio", "Inicio"], ["fecha_fin", "Fin"], ["activo", "Estado"]],
    form: [["anio", "Año", "number", true, { min: 2020, max: 2100 }], ["numero", "Número", "number", true, { min: 1, max: 3 }], ["fecha_inicio", "Fecha inicial", "date", true], ["fecha_fin", "Fecha final", "date", true], ["activo", "Estado", "select", true, { options: [[true, "Activo"], [false, "Inactivo"]] }]],
    payload: normalizePeriod,
  },
  aulas: {
    endpoint: "aulas", titulo: "Aulas", descripcion: "Espacios físicos y capacidad disponible.",
    columnas: [["codigo", "Código"], ["edificio", "Edificio"], ["capacidad", "Capacidad"], ["activo", "Estado"]],
    form: [["codigo", "Código", "text", true], ["edificio", "Edificio", "text", true], ["capacidad", "Capacidad", "number", true, { min: 1, max: 200 }], ["activo", "Estado", "select", true, { options: [[true, "Activa"], [false, "Inactiva"]] }]],
    payload: normalizeRoom,
  },
  secciones: {
    endpoint: "secciones", titulo: "Secciones", descripcion: "Oferta académica, horarios, docente y aula.", buscar: true,
    columnas: [["codigo", "Sección"], ["asignatura_nombre", "Asignatura"], ["docente_nombre", "Docente"], ["periodo_nombre", "Periodo"], ["horario", "Horario"], ["cupos", "Cupos"], ["estado", "Estado"]],
    form: [["codigo", "Código de sección", "text", true], ["asignatura_id", "Asignatura", "select", true, { source: "asignaturas" }], ["docente_id", "Docente", "select", true, { source: "docentes" }], ["periodo_id", "Periodo", "select", true, { source: "periodos" }], ["aula_id", "Aula", "select", false, { source: "aulas", empty: "Sin aula" }], ["dias", "Días (ej. LU-MI)", "text", true], ["hora_inicio", "Hora inicio", "time", true], ["hora_fin", "Hora fin", "time", true], ["cupo_maximo", "Cupo máximo", "number", true, { min: 1, max: 200 }], ["estado", "Estado", "select", true, { options: [["ABIERTA", "Abierta"], ["CERRADA", "Cerrada"], ["FINALIZADA", "Finalizada"]] }]],
    payload: normalizeSection,
    extraRow: actionsSection,
  },
};

function normalizeCareer(data) { return { codigo: data.codigo, nombre: data.nombre, duracion_anios: Number(data.duracion_anios), activo: data.activo === true || data.activo === "true" }; }
function normalizeStudent(data) { return { cuenta: data.cuenta, nombres: data.nombres, apellidos: data.apellidos, correo: data.correo, telefono: data.telefono || null, fecha_nacimiento: data.fecha_nacimiento, carrera_id: Number(data.carrera_id), estado: data.estado }; }
function normalizeTeacher(data) { return { numero_empleado: data.numero_empleado, nombres: data.nombres, apellidos: data.apellidos, correo: data.correo, especialidad: data.especialidad, estado: data.estado }; }
function normalizeSubject(data) { return { codigo: data.codigo, nombre: data.nombre, unidades_valorativas: Number(data.unidades_valorativas), carrera_id: Number(data.carrera_id), requisito_id: data.requisito_id ? Number(data.requisito_id) : null, activo: data.activo === true || data.activo === "true" }; }
function normalizePeriod(data) { return { anio: Number(data.anio), numero: Number(data.numero), fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin, activo: data.activo === true || data.activo === "true" }; }
function normalizeRoom(data) { return { codigo: data.codigo, edificio: data.edificio, capacidad: Number(data.capacidad), activo: data.activo === true || data.activo === "true" }; }
function normalizeSection(data) { return { codigo: data.codigo, asignatura_id: Number(data.asignatura_id), docente_id: Number(data.docente_id), periodo_id: Number(data.periodo_id), aula_id: data.aula_id ? Number(data.aula_id) : null, dias: data.dias, hora_inicio: data.hora_inicio, hora_fin: data.hora_fin, cupo_maximo: Number(data.cupo_maximo), estado: data.estado }; }

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[ch]));
}

function notify(message, kind = "ok") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast visible ${kind}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = data?.detail || data?.mensaje || data || `Error HTTP ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.map(x => x.msg || x).join("; ") : detail);
  }
  return data;
}

// ---------- Login ----------
$("#formulario-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#boton-entrar");
  const message = $("#mensaje-login");
  message.textContent = "";
  button.disabled = true;
  button.textContent = "Entrando...";
  try {
    state.usuario = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario: $("#campo-usuario").value.trim(), clave: $("#campo-clave").value }),
    });
    sessionStorage.setItem("usuarioAcademico", JSON.stringify(state.usuario));
    await entrarAlDashboard();
  } catch (error) {
    message.textContent = error.message || "No se pudo iniciar sesión.";
  } finally {
    button.disabled = false;
    button.textContent = "Entrar al sistema";
  }
});

async function entrarAlDashboard() {
  $("#vista-login").classList.add("oculto");
  $("#vista-dashboard").classList.remove("oculto");
  actualizarUsuarioUI();
  await prepararModulos();
  navegar("inicio");
}

function actualizarUsuarioUI() {
  const nombre = state.usuario?.nombre_completo || "Usuario";
  const rol = state.usuario?.rol || "DOCENTE";
  $("#titulo-bienvenida").textContent = nombre;
  $("#chip-usuario").textContent = `Rol: ${rol}`;
  $("#nombre-usuario-lateral").textContent = nombre;
  $("#rol-usuario-lateral").textContent = rol;
  $("#avatar-usuario").textContent = nombre.charAt(0).toUpperCase();
  if (rol !== "ADMIN") document.body.classList.add("rol-docente");
}

$("#boton-salir").addEventListener("click", () => {
  sessionStorage.removeItem("usuarioAcademico");
  state.usuario = null;
  $("#vista-dashboard").classList.add("oculto");
  $("#vista-login").classList.remove("oculto");
  $("#formulario-login").reset();
  document.body.classList.remove("rol-docente");
});

// ---------- Navegación ----------
function navegar(vista) {
  state.vista = vista;
  $$(".modulo").forEach(section => section.classList.remove("visible"));
  $("#vista-" + vista).classList.add("visible");
  $$(".nav-item, .acceso-card").forEach(btn => btn.classList.toggle("activo", btn.dataset.vista === vista));
  const meta = METADATA[vista];
  $("#titulo-vista").textContent = meta.titulo;
  $("#migas-pan").textContent = meta.migas;
  if (vista !== "inicio") cargarModulo(vista);
}

$$("[data-vista]").forEach(button => button.addEventListener("click", () => navegar(button.dataset.vista)));


$("#boton-tema").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  localStorage.setItem("temaAcademico", dark ? "light" : "dark");
});

function prepararTema() {
  const saved = localStorage.getItem("temaAcademico");
  if (saved) document.documentElement.dataset.theme = saved;
}

// ---------- Inicio ----------
async function cargarDashboard() {
  try {
    const data = await api("/reportes/dashboard");
    const items = [
      ["estudiantes_activos", "Estudiantes activos", "👨‍🎓"],
      ["docentes_activos", "Docentes activos", "👨‍🏫"],
      ["carreras_activas", "Carreras activas", "▤"],
      ["asignaturas_activas", "Asignaturas activas", "▦"],
      ["secciones_abiertas", "Secciones abiertas", "☷"],
      ["matriculas_activas", "Matrículas activas", "▣"],
    ];
    $("#fila-tarjetas").innerHTML = items.map(([key, label, icon]) => `
      <article class="tarjeta-kpi">
        <div class="kpi-icon">${icon}</div>
        <div class="valor">${data[key] ?? 0}</div>
        <div class="etiqueta-kpi">${label}</div>
      </article>`).join("");
  } catch (error) { notify(error.message, "error"); }
}

// ---------- Render modular ----------
async function prepararModulos() {
  Object.keys(CONFIG).forEach(key => {
    $("#vista-" + key).innerHTML = crearModuloBase(key, CONFIG[key]);
    conectarFormularioGenerico(key);
    conectarFiltroGenerico(key);
  });
  montarMatriculas();
  montarCalificaciones();
  montarUsuarios();
  await cargarDashboard();
}

function crearModuloBase(key, config) {
  const search = config.buscar ? `<input class="campo-busqueda" id="buscar-${key}" type="search" placeholder="Buscar..." />` : "";
  const button = `<button class="boton boton-principal" data-nuevo="${key}">＋ Nuevo ${singular(key)}</button>`;
  return `
    <div class="encabezado-modulo">
      <div><p class="eyebrow">MÓDULO UML</p><h2>${config.titulo}</h2><p>${config.descripcion}</p></div>
      <div class="acciones-modulo">${search}${button}</div>
    </div>
    <section class="tarjeta tarjeta-formulario oculto" id="form-${key}">
      <div class="encabezado-tarjeta"><div><p class="eyebrow">REGISTRO</p><h3 id="form-titulo-${key}">Nuevo ${singular(key)}</h3></div><button class="boton boton-cerrar" data-cancelar="${key}">×</button></div>
      <form class="rejilla-formulario" id="crud-form-${key}">
        ${renderFields(config.form)}
        <div class="form-actions"><button class="boton boton-principal" type="submit">Guardar</button><button class="boton boton-secundario" type="button" data-cancelar="${key}">Cancelar</button></div>
      </form>
      <p class="mensaje" id="form-message-${key}" aria-live="polite"></p>
    </section>
    <section class="tarjeta">
      <div class="encabezado-tarjeta"><div><p class="eyebrow">LISTADO</p><h3>Registros</h3></div></div>
      <div class="contenedor-tabla"><table><thead><tr>${config.columnas.map(([_, label]) => `<th>${label}</th>`).join("")}<th>Acciones</th></tr></thead><tbody id="tabla-${key}"></tbody></table></div>
      <p class="texto-vacio oculto" id="vacio-${key}">No hay registros para mostrar.</p>
    </section>`;
}

function renderFields(fields = []) {
  return `<input type="hidden" name="id" />` + fields.map(([name, label, type, required, options = {}]) => {
    let input = "";
    if (type === "select") {
      const source = options.source ? `<option value="">Cargando...</option>` : (options.options || []).map(([v, l]) => `<option value="${escapeHtml(v)}">${l}</option>`).join("");
      if (!source && options.empty) input = `<select name="${name}" ${required ? "required" : ""}><option value="">${options.empty}</option></select>`;
      else input = `<select name="${name}" ${required ? "required" : ""}>${options.empty ? `<option value="">${options.empty}</option>` : ""}${source}</select>`;
    } else input = `<input name="${name}" type="${type}" ${required ? "required" : ""} ${options.min !== undefined ? `min="${options.min}"` : ""} ${options.max !== undefined ? `max="${options.max}"` : ""} />`;
    return `<div class="campo"><label>${label}</label>${input}</div>`;
  }).join("");
}

function singular(key) {
  const map = { carreras: "carrera", estudiantes: "estudiante", docentes: "docente", asignaturas: "asignatura", periodos: "periodo", aulas: "aula", secciones: "sección" };
  return map[key] || key;
}

function valorDeFormularioParaCampo(input, value) {
  if (!input) return;
  if (input.tagName === "SELECT" && (input.dataset.boolean === "true" || ["true", "false"].every(valor => [...input.options].some(op => op.value === valor)))) {
    input.value = Boolean(value) ? "true" : "false";
    return;
  }
  input.value = value ?? "";
}

function invalidarDatosRelacionados(key) {
  delete state.datos[key];
  for (const [otherKey, config] of Object.entries(CONFIG)) {
    const dependeDe = (config.form || []).some(([, , , , options]) => options?.source === key);
    if (dependeDe) delete state.datos[otherKey];
  }
}

async function refrescarDespuesDeCambio(key) {
  invalidarDatosRelacionados(key);
  await cargarModulo(key);
  await cargarDashboard();
}

function conectarFormularioGenerico(key) {
  const config = CONFIG[key];
  const form = $("#crud-form-" + key);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#form-message-" + key);
    message.textContent = "Guardando...";
    message.className = "mensaje";
    const submitButton = form.closest("section")?.querySelector('button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Guardando..."; }
    try {
      const raw = Object.fromEntries(new FormData(form).entries());
      const id = raw.id;
      delete raw.id;
      const payload = config.payload(raw);
      const method = id ? "PUT" : "POST";
      const url = id ? `/${config.endpoint}/${id}` : `/${config.endpoint}`;
      await api(url, { method, body: JSON.stringify(payload) });
      notify(id ? "Registro actualizado correctamente." : "Registro creado correctamente.");
      cerrarFormulario(key);
      await refrescarDespuesDeCambio(key);
    } catch (error) {
      message.textContent = error.message;
      message.className = "mensaje error-text";
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Guardar"; }
    }
  });

  $$(`[data-cancelar="${key}"]`).forEach(btn => btn.addEventListener("click", () => cerrarFormulario(key)));
  document.querySelector(`[data-nuevo="${key}"]`).addEventListener("click", () => abrirNuevo(key));

}

function conectarFiltroGenerico(key) {
  const search = $("#buscar-" + key);
  if (!search) return;
  search.addEventListener("input", () => cargarModulo(key));
}

async function cargarModulo(key) {
  if (key === "inicio") return cargarDashboard();
  if (key === "matriculas") return cargarMatriculas();
  if (key === "calificaciones") return cargarCalificaciones();
  if (key === "usuarios") return montarUsuarios();
  const config = CONFIG[key];
  const search = $("#buscar-" + key);
  const query = search?.value?.trim() ? `?buscar=${encodeURIComponent(search.value.trim())}` : "";
  try {
    const list = await api(`/${config.endpoint}${query}`);
    state.datos[key] = list;
    await cargarSelects(key);
    renderTable(key, list);
  } catch (error) { notify(error.message, "error"); }
}

async function cargarSelects(key) {
  const fields = CONFIG[key].form || [];
  for (const [, name, , , options] of fields) {
    if (!options?.source) continue;
    let sourceData = state.datos[options.source];
    if (!sourceData) {
      const endpoint = options.source === "asignaturas" ? "asignaturas" : options.source;
      try { sourceData = await api(`/${endpoint}`); state.datos[options.source] = sourceData; } catch { sourceData = []; }
    }
    const select = $(`#crud-form-${key} [name="${name}"]`);
    if (!select) continue;
    let empty = options.empty ? `<option value="">${options.empty}</option>` : `<option value="">Seleccione...</option>`;
    if (options.source === "carreras") select.innerHTML = empty + sourceData.map(x => `<option value="${x.id}">${escapeHtml(x.codigo)} — ${escapeHtml(x.nombre)}</option>`).join("");
    else if (options.source === "docentes") select.innerHTML = empty + sourceData.map(x => `<option value="${x.id}">${escapeHtml(x.numero_empleado)} — ${escapeHtml(x.nombres)} ${escapeHtml(x.apellidos)}</option>`).join("");
    else if (options.source === "asignaturas") select.innerHTML = empty + sourceData.map(x => `<option value="${x.id}">${escapeHtml(x.codigo)} — ${escapeHtml(x.nombre)}</option>`).join("");
    else if (options.source === "periodos") select.innerHTML = empty + sourceData.map(x => `<option value="${x.id}">${escapeHtml(x.nombre)}</option>`).join("");
    else if (options.source === "aulas") select.innerHTML = empty + sourceData.map(x => `<option value="${x.id}">${escapeHtml(x.codigo)} — ${escapeHtml(x.edificio)}</option>`).join("");
  }
}

function renderTable(key, rows) {
  const config = CONFIG[key];
  const tbody = $("#tabla-" + key);
  const empty = $("#vacio-" + key);
  if (!rows.length) { tbody.innerHTML = ""; empty.classList.remove("oculto"); return; }
  empty.classList.add("oculto");
  tbody.innerHTML = rows.map(row => {
    const cells = config.columnas.map(([field]) => `<td>${renderCell(field, row)}</td>`).join("");
    const extra = config.extraRow ? config.extraRow(row) : "";
    return `<tr>${cells}<td><div class="acciones-fila">${extra}<button class="boton-mini editar" data-editar="${key}" data-id="${row.id}">Editar</button><button class="boton-mini peligro" data-eliminar="${key}" data-id="${row.id}">Eliminar</button></div></td></tr>`;
  }).join("");
  wireTableButtons(key);
}

function renderCell(field, row) {
  if (field === "activo") return badge(row.activo ? "ACTIVO" : "INACTIVO");
  if (field === "estado") return badge(row.estado);
  if (field === "nombre") return escapeHtml(`${row.nombres || ""} ${row.apellidos || ""}`.trim() || row.nombre);
  if (field === "horario") return `${escapeHtml(row.dias)} · ${escapeHtml(row.hora_inicio)}–${escapeHtml(row.hora_fin)}`;
  if (field === "cupos") return `${row.matriculados ?? 0} / ${row.cupo_maximo ?? 0}`;
  if (field === "requisito_codigo") return escapeHtml(row.requisito_codigo || "—");
  if (field === "fecha_inicio" || field === "fecha_fin") return escapeHtml(formatDate(row[field]));
  return escapeHtml(row[field] ?? "—");
}

function badge(value) {
  const cls = ["ACTIVO", "ABIERTA", "MATRICULADA", "APROBADA"].includes(value) ? "ok" : ["REPROBADA", "CANCELADA", "INACTIVO"].includes(value) ? "danger" : "neutral";
  return `<span class="estado ${cls}">${escapeHtml(String(value).replaceAll("_", " "))}</span>`;
}

function wireTableButtons(key) {
  $$(`[data-editar="${key}"]`).forEach(button => button.addEventListener("click", () => abrirEdicion(key, Number(button.dataset.id))));
  $$(`[data-eliminar="${key}"]`).forEach(button => button.addEventListener("click", () => eliminarGenerico(key, Number(button.dataset.id))));
  $$(`[data-report="historial"]`).forEach(btn => btn.addEventListener("click", () => abrirHistorial(Number(btn.dataset.id))));
  $$(`[data-report="carga"]`).forEach(btn => btn.addEventListener("click", () => abrirCargaDocente(Number(btn.dataset.id))));
  $$(`[data-report="seccion"]`).forEach(btn => btn.addEventListener("click", () => abrirListaSeccion(Number(btn.dataset.id))));
}

function actionsStudent(row) { return `<button class="boton-mini" data-report="historial" data-id="${row.id}">Historial</button>`; }
function actionsTeacher(row) { return `<button class="boton-mini" data-report="carga" data-id="${row.id}">Carga docente</button>`; }
function actionsSection(row) { return `<button class="boton-mini" data-report="seccion" data-id="${row.id}">Lista</button>`; }

function abrirNuevo(key) {
  const form = $(`#crud-form-${key}`);
  form.reset();
  $("#form-titulo-" + key).textContent = `Nuevo ${singular(key)}`;
  $("#form-message-" + key).textContent = "";
  $("#form-" + key).classList.remove("oculto");
  cargarSelects(key);
}

function abrirEdicion(key, id) {
  const row = (state.datos[key] || []).find(x => x.id === id);
  if (!row) return;
  const form = $(`#crud-form-${key}`);
  Object.entries(row).forEach(([keyName, value]) => {
    const input = form.elements.namedItem(keyName);
    if (!input) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else valorDeFormularioParaCampo(input, value);
  });
  const idField = form.elements.namedItem("id");
  idField.value = row.id;
  $("#form-titulo-" + key).textContent = `Editar ${singular(key)}`;
  $("#form-" + key).classList.remove("oculto");
  cargarSelects(key).then(() => Object.entries(row).forEach(([keyName, value]) => {
    const input = form.elements.namedItem(keyName);
    if (input && value != null && keyName !== "id") valorDeFormularioParaCampo(input, value);
  }));
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarFormulario(key) {
  $(`#form-${key}`).classList.add("oculto");
  $(`#crud-form-${key}`).reset();
  $(`#form-message-${key}`).textContent = "";
}

async function eliminarGenerico(key, id) {
  if (!confirm(`¿Seguro que deseas eliminar este ${singular(key)}?`)) return;
  try {
    await api(`/${CONFIG[key].endpoint}/${id}`, { method: "DELETE" });
    notify("Registro eliminado correctamente.");
    await refrescarDespuesDeCambio(key);
  } catch (error) { notify(error.message, "error"); }
}

// ---------- Matrículas ----------
function montarMatriculas() {
  $("#vista-matriculas").innerHTML = `
    <div class="encabezado-modulo">
      <div><p class="eyebrow">ACADÉMICO</p><h2>Matrículas</h2><p>Inscripción, cancelación y seguimiento por período.</p></div>
      <div class="acciones-modulo"><button class="boton boton-principal" id="btn-nueva-matricula">＋ Nueva matrícula</button></div>
    </div>
    <section class="tarjeta tarjeta-formulario" id="panel-nueva-matricula">
      <div class="encabezado-tarjeta"><div><p class="eyebrow">REGISTRO</p><h3>Nueva matrícula</h3></div></div>
      <form id="form-matricula" class="rejilla-formulario">
        <div class="campo"><label>Estudiante</label><select id="matricula-estudiante" required></select></div>
        <div class="campo"><label>Sección disponible</label><select id="matricula-seccion" required></select></div>
        <div class="form-actions"><button class="boton boton-principal" type="submit">Registrar matrícula</button><button class="boton boton-secundario" type="button" id="btn-cancelar-panel-matricula">Cerrar</button></div>
      </form>
      <p id="mensaje-matricula" class="mensaje"></p>
    </section>
    <section class="tarjeta"><div class="encabezado-tarjeta"><div><p class="eyebrow">HISTORIAL</p><h3>Registros</h3></div><select id="filtro-estado-matricula" class="filtro-compacto"><option value="">Todos</option><option>MATRICULADA</option><option>CANCELADA</option><option>APROBADA</option><option>REPROBADA</option></select></div>
      <div class="contenedor-tabla"><table><thead><tr><th>Cuenta</th><th>Estudiante</th><th>Asignatura</th><th>Sección</th><th>Periodo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="tabla-matriculas"></tbody></table></div>
      <p id="vacio-matriculas" class="texto-vacio oculto">No hay matrículas.</p>
    </section>`;
  $("#panel-nueva-matricula").classList.add("oculto");
  $("#btn-nueva-matricula").addEventListener("click", async () => { $("#panel-nueva-matricula").classList.toggle("oculto"); await cargarOpcionesMatricula(); });
  $("#btn-cancelar-panel-matricula").addEventListener("click", () => $("#panel-nueva-matricula").classList.add("oculto"));
  $("#filtro-estado-matricula").addEventListener("change", cargarMatriculas);
  $("#form-matricula").addEventListener("submit", registrarMatricula);
}

async function cargarOpcionesMatricula() {
  const [students, sections] = await Promise.all([api("/estudiantes?estado=ACTIVO"), api("/secciones/disponibles")]);
  $("#matricula-estudiante").innerHTML = `<option value="">Seleccione...</option>` + students.map(s => `<option value="${s.id}">${escapeHtml(s.cuenta)} — ${escapeHtml(s.nombres)} ${escapeHtml(s.apellidos)}</option>`).join("");
  $("#matricula-seccion").innerHTML = `<option value="">Seleccione...</option>` + sections.map(s => `<option value="${s.id}">${escapeHtml(s.asignatura_codigo)} — ${escapeHtml(s.asignatura_nombre)} | ${escapeHtml(s.codigo)} | Cupos ${s.cupos_disponibles}</option>`).join("");
}

async function registrarMatricula(event) {
  event.preventDefault();
  try {
    await api("/matriculas", { method: "POST", body: JSON.stringify({ estudiante_id: Number($("#matricula-estudiante").value), seccion_id: Number($("#matricula-seccion").value) }) });
    notify("Matrícula registrada correctamente.");
    $("#form-matricula").reset();
    await cargarMatriculas();
    await cargarOpcionesMatricula();
    cargarDashboard();
  } catch (error) { $("#mensaje-matricula").textContent = error.message; }
}

async function cargarMatriculas() {
  try {
    const stateFilter = $("#filtro-estado-matricula")?.value || "";
    const list = await api(`/matriculas${stateFilter ? `?estado=${stateFilter}` : ""}`);
    state.datos.matriculas = list;
    $("#tabla-matriculas").innerHTML = list.map(m => `<tr>
      <td>${escapeHtml(m.estudiante_cuenta)}</td><td>${escapeHtml(m.estudiante_nombre)}</td><td>${escapeHtml(m.asignatura_codigo)} — ${escapeHtml(m.asignatura_nombre)}</td><td>${escapeHtml(m.seccion_codigo)}</td><td>${escapeHtml(m.periodo_nombre)}</td><td>${badge(m.estado)}</td>
      <td class="acciones-fila">${m.estado === "MATRICULADA" ? `<button class="boton-mini" data-cancelar-matricula="${m.id}">Cancelar</button>` : ""}<button class="boton-mini peligro" data-eliminar-matricula="${m.id}">Eliminar</button></td>
    </tr>`).join("");
    $("#vacio-matriculas").classList.toggle("oculto", list.length > 0);
    $$(`[data-cancelar-matricula]`).forEach(b => b.addEventListener("click", () => cancelarMatricula(Number(b.dataset.cancelarMatricula))));
    $$(`[data-eliminar-matricula]`).forEach(b => b.addEventListener("click", () => eliminarMatricula(Number(b.dataset.eliminarMatricula))));
  } catch (error) { notify(error.message, "error"); }
}

async function cancelarMatricula(id) {
  if (!confirm("¿Cancelar esta matrícula? El cupo volverá a estar disponible.")) return;
  try { await api(`/matriculas/${id}/cancelar`, { method: "PATCH" }); notify("Matrícula cancelada."); await cargarMatriculas(); cargarDashboard(); } catch (error) { notify(error.message, "error"); }
}
async function eliminarMatricula(id) {
  if (!confirm("¿Eliminar definitivamente la matrícula?")) return;
  try { await api(`/matriculas/${id}`, { method: "DELETE" }); notify("Matrícula eliminada."); await cargarMatriculas(); cargarDashboard(); } catch (error) { notify(error.message, "error"); }
}

// ---------- Calificaciones ----------
function montarCalificaciones() {
  $("#vista-calificaciones").innerHTML = `
    <div class="encabezado-modulo"><div><p class="eyebrow">ACADÉMICO</p><h2>Calificaciones</h2><p>Registra parciales; la nota final y el estado se calculan automáticamente.</p></div></div>
    <section class="tarjeta tarjeta-formulario">
      <form id="form-calificacion" class="rejilla-formulario">
        <input type="hidden" id="calificacion-matricula-id" />
        <div class="campo campo-ancho"><label>Matrícula</label><select id="calificacion-matricula" required></select></div>
        <div class="campo"><label>Primer parcial</label><input id="calificacion-p1" type="number" min="0" max="100" step="0.01" required /></div>
        <div class="campo"><label>Segundo parcial</label><input id="calificacion-p2" type="number" min="0" max="100" step="0.01" required /></div>
        <div class="campo"><label>Tercer parcial</label><input id="calificacion-p3" type="number" min="0" max="100" step="0.01" required /></div>
        <div class="campo"><label>Observación</label><input id="calificacion-observacion" maxlength="250" placeholder="Comentario opcional" /></div>
        <div class="form-actions"><button class="boton boton-principal" type="submit">Guardar calificación</button><button class="boton boton-secundario" type="button" id="btn-limpiar-calificacion">Limpiar</button></div>
      </form>
      <p id="mensaje-calificacion" class="mensaje"></p>
    </section>
    <section class="tarjeta"><div class="encabezado-tarjeta"><div><p class="eyebrow">REGISTROS</p><h3>Calificaciones</h3></div></div><div class="contenedor-tabla"><table><thead><tr><th>Matrícula</th><th>P1</th><th>P2</th><th>P3</th><th>Final</th><th>Resultado</th><th>Acciones</th></tr></thead><tbody id="tabla-calificaciones"></tbody></table></div></section>`;
  $("#form-calificacion").addEventListener("submit", guardarCalificacion);
  $("#btn-limpiar-calificacion").addEventListener("click", limpiarCalificacion);
}

async function cargarCalificaciones() {
  try {
    const [grades, enrollments] = await Promise.all([api("/calificaciones"), api("/matriculas")]);
    state.datos.calificaciones = grades;
    const disponibles = enrollments.filter(m => m.estado !== "CANCELADA");
    $("#calificacion-matricula").innerHTML = `<option value="">Seleccione...</option>` + disponibles.map(m => `<option value="${m.id}">${escapeHtml(m.estudiante_cuenta)} — ${escapeHtml(m.estudiante_nombre)} · ${escapeHtml(m.asignatura_codigo)} · ${escapeHtml(m.seccion_codigo)}</option>`).join("");
    $("#tabla-calificaciones").innerHTML = grades.map(g => `<tr><td>${g.matricula_id}</td><td>${g.primer_parcial}</td><td>${g.segundo_parcial}</td><td>${g.tercer_parcial}</td><td><strong>${g.nota_final}</strong></td><td>${badge(g.resultado)}</td><td><div class="acciones-fila"><button class="boton-mini" data-editar-cal="${g.matricula_id}">Editar</button><button class="boton-mini peligro" data-eliminar-cal="${g.matricula_id}">Eliminar</button></div></td></tr>`).join("");
    $$(`[data-editar-cal]`).forEach(b => b.addEventListener("click", () => editarCalificacion(Number(b.dataset.editarCal), grades)));
    $$(`[data-eliminar-cal]`).forEach(b => b.addEventListener("click", () => eliminarCalificacion(Number(b.dataset.eliminarCal))));
  } catch (error) { notify(error.message, "error"); }
}

async function editarCalificacion(matriculaId, list) {
  const current = await api(`/calificaciones/matricula/${matriculaId}`);
  $("#calificacion-matricula").value = String(matriculaId);
  $("#calificacion-p1").value = current.primer_parcial;
  $("#calificacion-p2").value = current.segundo_parcial;
  $("#calificacion-p3").value = current.tercer_parcial;
  $("#calificacion-observacion").value = current.observacion || "";
  $("#vista-calificaciones").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function guardarCalificacion(event) {
  event.preventDefault();
  const id = Number($("#calificacion-matricula").value);
  if (!id) return;
  try {
    const saved = await api(`/calificaciones/matricula/${id}`, { method: "PUT", body: JSON.stringify({ primer_parcial: Number($("#calificacion-p1").value), segundo_parcial: Number($("#calificacion-p2").value), tercer_parcial: Number($("#calificacion-p3").value), observacion: $("#calificacion-observacion").value || null }) });
    notify(`Calificación guardada. Nota final: ${saved.nota_final}`);
    limpiarCalificacion();
    await cargarCalificaciones();
    await cargarMatriculas();
    cargarDashboard();
  } catch (error) { $("#mensaje-calificacion").textContent = error.message; }
}
function limpiarCalificacion() { $("#form-calificacion").reset(); $("#mensaje-calificacion").textContent = ""; }
async function eliminarCalificacion(matriculaId) {
  if (!confirm("¿Eliminar la calificación de esta matrícula? La matrícula volverá a estado MATRICULADA.")) return;
  try { await api(`/calificaciones/matricula/${matriculaId}`, { method: "DELETE" }); notify("Calificación eliminada."); await cargarCalificaciones(); await cargarMatriculas(); cargarDashboard(); } catch (error) { notify(error.message, "error"); }
}

// ---------- Usuario / rol ----------
function montarUsuarios() {
  $("#vista-usuarios").innerHTML = `
    <div class="encabezado-modulo"><div><p class="eyebrow">SISTEMA</p><h2>Usuario y rol</h2><p>Información de la sesión actual y permisos disponibles.</p></div></div>
    <section class="perfil-grid">
      <article class="tarjeta perfil-card"><div class="perfil-avatar">${escapeHtml((state.usuario?.nombre_completo || "U").charAt(0).toUpperCase())}</div><p class="eyebrow">SESIÓN ACTUAL</p><h3>${escapeHtml(state.usuario?.nombre_completo)}</h3><p class="usuario-texto">@${escapeHtml(state.usuario?.usuario)}</p><span class="rol-chip">ROL: ${escapeHtml(state.usuario?.rol)}</span></article>
      <article class="tarjeta"><p class="eyebrow">UML</p><h3>Rol</h3><div class="rol-lista"><div><strong>ADMIN</strong><span>Gestiona todos los módulos y catálogos.</span></div><div><strong>DOCENTE</strong><span>Consulta información académica y registra calificaciones.</span></div></div></article>
    </section>`;
}

// ---------- Reportes ----------
async function abrirHistorial(estudianteId) {
  try {
    const data = await api(`/reportes/historial-estudiante/${estudianteId}`);
    openModal("Historial del estudiante", `
      <div class="reporte-resumen"><div><span>Cuenta</span><strong>${escapeHtml(data.estudiante.cuenta)}</strong></div><div><span>Carrera</span><strong>${escapeHtml(data.estudiante.carrera_nombre)}</strong></div><div><span>Asignaturas</span><strong>${data.resumen.asignaturas_cursadas}</strong></div><div><span>UV aprobadas</span><strong>${data.resumen.unidades_valorativas_aprobadas}</strong></div></div>
      <div class="contenedor-tabla"><table><thead><tr><th>Periodo</th><th>Asignatura</th><th>Sección</th><th>Estado</th><th>Nota</th></tr></thead><tbody>${data.historial.map(x => `<tr><td>${escapeHtml(x.periodo)}</td><td>${escapeHtml(x.asignatura_codigo)} — ${escapeHtml(x.asignatura)}</td><td>${escapeHtml(x.seccion)}</td><td>${badge(x.estado)}</td><td>${x.nota_final ?? "—"}</td></tr>`).join("")}</tbody></table></div>`);
  } catch (error) { notify(error.message, "error"); }
}

async function abrirCargaDocente(docenteId) {
  try {
    const data = await api(`/reportes/carga-docente/${docenteId}`);
    openModal("Carga docente", `<div class="reporte-resumen"><div><span>Docente</span><strong>${escapeHtml(data.docente.nombre)}</strong></div><div><span>Secciones</span><strong>${data.total_secciones}</strong></div></div><div class="lista-reportes">${data.secciones.map(x => `<div class="reporte-item"><strong>${escapeHtml(x.asignatura_codigo)} — ${escapeHtml(x.asignatura)}</strong><span>Sección ${escapeHtml(x.seccion)} · ${escapeHtml(x.periodo)} · ${escapeHtml(x.dias)} ${escapeHtml(x.hora_inicio)}–${escapeHtml(x.hora_fin)}</span><span>${x.estudiantes} estudiantes</span></div>`).join("") || '<p class="texto-vacio">Sin carga registrada.</p>'}</div>`);
  } catch (error) { notify(error.message, "error"); }
}

async function abrirListaSeccion(seccionId) {
  try {
    const data = await api(`/reportes/lista-seccion/${seccionId}`);
    openModal("Lista de sección", `<div class="reporte-resumen"><div><span>Asignatura</span><strong>${escapeHtml(data.seccion.asignatura_codigo)} — ${escapeHtml(data.seccion.asignatura)}</strong></div><div><span>Docente</span><strong>${escapeHtml(data.seccion.docente)}</strong></div><div><span>Cupos disponibles</span><strong>${data.cupos_disponibles}</strong></div></div><div class="contenedor-tabla"><table><thead><tr><th>Cuenta</th><th>Estudiante</th><th>Correo</th><th>Estado</th><th>Nota</th></tr></thead><tbody>${data.estudiantes.map(x => `<tr><td>${escapeHtml(x.cuenta)}</td><td>${escapeHtml(x.estudiante)}</td><td>${escapeHtml(x.correo)}</td><td>${badge(x.estado)}</td><td>${x.nota_final ?? "—"}</td></tr>`).join("")}</tbody></table></div>`);
  } catch (error) { notify(error.message, "error"); }
}

function openModal(title, content) {
  $("#modal-titulo").textContent = title;
  $("#modal-contenido").innerHTML = content;
  $("#modal").classList.remove("oculto");
}
function closeModal() { $("#modal").classList.add("oculto"); }
$("#modal-cerrar").addEventListener("click", closeModal);
$("#modal").addEventListener("click", event => { if (event.target.id === "modal") closeModal(); });

function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

// ---------- Init ----------
prepararTema();
try {
  const saved = sessionStorage.getItem("usuarioAcademico");
  if (saved) state.usuario = JSON.parse(saved);
} catch {}

if (state.usuario) entrarAlDashboard().catch(error => notify(error.message, "error"));
