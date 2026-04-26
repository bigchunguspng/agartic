// ELEMENTS

const vp = document.getElementById("viewport");
const cw = document.getElementById("canvas-wrapper");

// region CANVAS ZOOM / DRAG

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
function cw_zoom(e, out) {
    let factor = e.shiftKey ? CW_ZOOM_FACTOR_SHIFT : CW_ZOOM_FACTOR_DEFAULT;
    if (out) factor = 1 / factor;
    const cw_true_x = (mouse.x - cw_x) / cw_scale;
    const cw_true_y = (mouse.y - cw_y) / cw_scale;
    cw_scale = Math.max(MIN_CW_SCALE, Math.min(MAX_CW_SCALE, cw_scale * factor));
    cw_x = mouse.x - cw_true_x * cw_scale;
    cw_y = mouse.y - cw_true_y * cw_scale;
    cw_transform();
}

let   cw_dragging = false;
const cw_dragging_from = {
    mouse_x: 0,
    mouse_y: 0,
    cw_x: 0,
    cw_y: 0,
};
function cw_drag_start() {
    if (!cw_dragging){
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
    vp    .addEventListener('mousedown',  e => e.button === 0 && cw_drag_start());
    window.addEventListener('mousemove', () => cw_drag());
    window.addEventListener('mouseup',   () => cw_drag_stop());
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
        cw_x -= (window.w - window.innerWidth)  / 2;
        cw_y -= (window.h - window.innerHeight) / 2;
        cw_transform();
    });
}
// endregion

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

// region INIT
SETUP_HOOKS_PRE();
SETUP_CW_DRAG();
SETUP_CW_ZOOM();
SETUP_HOOKS_POST();
cw_resize_true_scale();
// endregion