// region ELEMENTS

const vp = document.getElementById("viewport");
const cw = document.getElementById("canvas-wrapper");
const canvasA = document.getElementById('canvas-draw');
const canvasB = document.getElementById('canvas-over');

const button_zoom_in  = document.getElementById("button_zoom_in");
const button_zoom_out = document.getElementById("button_zoom_out");
const button_zoom_1   = document.getElementById("button_zoom_1");
const button_zoom_2   = document.getElementById("button_zoom_2");

const tool_pick = document.getElementById("tool_pick");
const tool_drag = document.getElementById("tool_drag");
const tool_draw = document.getElementById("tool_draw");
const tool_rect = document.getElementById("tool_rect");
const tool_laso = document.getElementById("tool_laso");

const panel_main = document.getElementById("panel-main");
const panel_aux  = document.getElementById("panel-aux");

// endregion

// region TOOLS

const tools = [tool_pick, tool_drag, tool_draw, tool_rect, tool_laso];
const panel_aux_items = Array.from(panel_aux.children);

let tool_active;

function tool_activate(tool) {
    tools.forEach(x => x.classList.remove("active"));
    tool.classList.add('active');
    tool_active = tool;
    panel_aux_items.forEach(x => x.classList.toggle('hide', !x.classList.contains(tool.id)));
    if (tool_active !== tool_drag) cw_drag_stop();
}
function SETUP_TOOLS() {
    tool_activate(tool_draw);
    panel_main.addEventListener("click", e => {
        const tool = tools.find(x => x.contains(e.target));
        if (tool) tool_activate(tool);
    });
    window.addEventListener("keydown", e => {
       if      (e.key === 'c') e.preventDefault() || tool_activate(tool_pick);
       else if (e.key === 'x') e.preventDefault() || tool_activate(tool_drag);
       else if (e.key === 'd') e.preventDefault() || tool_activate(tool_draw);
       else if (e.key === 'r') e.preventDefault() || tool_activate(tool_rect);
       else if (e.key === 'q') e.preventDefault() || tool_activate(tool_laso);
    });
}
// endregion

// region CANVAS ZOOM

let cw_true_w = 1280;
let cw_true_h = 720;

let cw_x, cw_y, cw_scale = 1;

const MIN_CW_SCALE = 0.05;
const MAX_CW_SCALE = 20;
const CW_ZOOM_FACTOR_DEFAULT = 1.1;
const CW_ZOOM_FACTOR_SHIFT   = 1.35;

function cw_transform() {
    cw.style.transform = `translate(${cw_x}px, ${cw_y}px) scale(${cw_scale})`;
}
function cw_resize_true_scale() {
    cw_scale = 1;
    cw_x = (vp.clientWidth  - cw_true_w) / 2;
    cw_y = (vp.clientHeight - cw_true_h) / 2;
    cw_transform();
}
function cw_resize_fit_screen() {
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    cw_scale = Math.min(vw / cw_true_w, vh / cw_true_h);
    cw_x = (vw - cw_true_w * cw_scale) / 2;
    cw_y = (vh - cw_true_h * cw_scale) / 2;
    cw_transform();
}
function cw_zoom(e, out, centered) {
    let factor = e.shiftKey ? CW_ZOOM_FACTOR_SHIFT : CW_ZOOM_FACTOR_DEFAULT;
    if (out) factor = 1 / factor;
    const x = centered ? window.w / 2 : mouse.x;
    const y = centered ? window.h / 2 : mouse.y;
    const cw_true_x = (x - cw_x) / cw_scale;
    const cw_true_y = (y - cw_y) / cw_scale;
    cw_scale = Math.max(MIN_CW_SCALE, Math.min(MAX_CW_SCALE, cw_scale * factor));
    cw_x = x - cw_true_x * cw_scale;
    cw_y = y - cw_true_y * cw_scale;
    cw_transform();
}

function SETUP_CW_ZOOM() {
    vp.addEventListener("wheel", e => {
        e.preventDefault();
        if (e.ctrlKey) {
            cw_zoom(e, e.deltaY > 0);
        }
        else {
            if (e.shiftKey) cw_x -= e.deltaY;
            else            cw_y -= e.deltaY;
            cw_transform();
        }
    }, { passive: false });
    window.addEventListener("keydown", e => {
        if (e.ctrlKey) {
            if (e.key === '1') {
                e.preventDefault();
                cw_resize_true_scale();
            }
            if (e.key === '2') {
                e.preventDefault();
                cw_resize_fit_screen();
            }
        }
    });
    window.addEventListener("resize", () => {
        // keep canvase position relative to center
        cw_x -= (window.w - window.innerWidth)  / 2;
        cw_y -= (window.h - window.innerHeight) / 2;
        cw_transform();
    });
    button_zoom_1   .addEventListener("click", _ => cw_resize_true_scale());
    button_zoom_2   .addEventListener("click", _ => cw_resize_fit_screen());
    button_zoom_in  .addEventListener("click", e => cw_zoom(e, false, true));
    button_zoom_out .addEventListener("click", e => cw_zoom(e, true, true));
}
// endregion

// region CANVAS DRAG

let   cw_dragging = false;
const cw_dragging_from = {
    mouse_x: 0,
    mouse_y: 0,
    cw_x: 0,
    cw_y: 0,
};

function cw_drag_start() {
    if (!cw_dragging) {
        cw_dragging = true;
        vp.classList.add('dragging');
        cw_dragging_from.mouse_x = mouse.x;
        cw_dragging_from.mouse_y = mouse.y;
        cw_dragging_from.cw_x = cw_x;
        cw_dragging_from.cw_y = cw_y;
    }
}
function cw_drag() {
    if (cw_dragging) {
        cw_x = cw_dragging_from.cw_x + (mouse.x - cw_dragging_from.mouse_x);
        cw_y = cw_dragging_from.cw_y + (mouse.y - cw_dragging_from.mouse_y);
        cw_transform();
    }
}
function cw_drag_stop() {
    if (cw_dragging) {
        cw_dragging = false;
        vp.classList.remove("dragging");
    }
}

function SETUP_CW_DRAG() {
    vp    .addEventListener('mousedown', e => e.button === 0 && cw_drag_start());
    window.addEventListener('mousemove', _ => cw_drag());
    window.addEventListener('mouseup',   _ => cw_drag_stop());
}
// endregion

// region HISTORY

// endregion

// region DRAW

// endregion

// region HACKS

const mouse = { x: 0, y: 0 };

function SETUP_HOOKS_PRE() {
    window.w = window.innerWidth;
    window.h = window.innerHeight;
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        if (cw_dragging) {
            cw_drag();
        }
    });
}
function SETUP_HOOKS_POST() {
    window.addEventListener("resize", () => {
        window.w = window.innerWidth;
        window.h = window.innerHeight;
    });
}
// endregion

// region INIT
SETUP_HOOKS_PRE();
SETUP_TOOLS();
SETUP_CW_DRAG();
SETUP_CW_ZOOM();
SETUP_HOOKS_POST();
cw_resize_true_scale();
// endregion