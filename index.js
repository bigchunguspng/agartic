'use strict';

//#region ELEMENTS

const vp            = document.getElementById('viewport');
const cw            = document.getElementById('canvas-wrapper');
const canvas_draw   = document.getElementById('canvas-draw');
const canvas_over   = document.getElementById('canvas-over');
const canvas_info   = document.getElementById('canvas-info');
const imgv_wrapper  = document.getElementById('imgv-wrapper');
const imgv_sel      = document.getElementById('imgv_sel');
const hand_tl       = document.getElementById('handle_tl');
const hand_tt       = document.getElementById('handle_tt');
const hand_tr       = document.getElementById('handle_tr');
const hand_rr       = document.getElementById('handle_rr');
const hand_br       = document.getElementById('handle_br');
const hand_bb       = document.getElementById('handle_bb');
const hand_bl       = document.getElementById('handle_bl');
const hand_ll       = document.getElementById('handle_ll');

const panel_main    = document.getElementById('panel-main');
const panel_aux     = document.getElementById('panel-aux');

const butt_zoom_1   = document.getElementById('butt_zoom_1');
const butt_zoom_2   = document.getElementById('butt_zoom_2');
const butt_zoom_in  = document.getElementById('butt_zoom_in');
const butt_zoom_out = document.getElementById('butt_zoom_out');

const tool_pick     = document.getElementById('tool_pick');
const tool_drag     = document.getElementById('tool_drag');
const tool_draw     = document.getElementById('tool_draw');
const tool_rect     = document.getElementById('tool_rect');
const tool_laso     = document.getElementById('tool_laso');
const tool_imgv     = document.getElementById('tool_imgv');

const butt_undo     = document.getElementById('butt_undo');
const butt_redo     = document.getElementById('butt_redo');
const butt_copy     = document.getElementById('butt_copy');
const butt_paste    = document.getElementById('butt_paste');
const butt_save     = document.getElementById('butt_save');
const butt_nuke     = document.getElementById('butt_nuke');

const butt_bs_less  = document.getElementById('butt_bs_less');
const butt_bs_more  = document.getElementById('butt_bs_more');
const butt_inv_col  = document.getElementById('butt_inv_color');
const butt_cp_no    = document.getElementById('butt_cp_no');
const butt_dw_mode  = document.getElementById('butt_dw_mode');

const butt_imgv_ok  = document.getElementById('butt_imgv_ok');
const butt_imgv_no  = document.getElementById('butt_imgv_no');
const butt_imgv_s1  = document.getElementById('butt_imgv_zoom_1');
const butt_imgv_s2  = document.getElementById('butt_imgv_zoom_2');
const butt_imgv_s3  = document.getElementById('butt_imgv_zoom_3');
const butt_imgv_vf  = document.getElementById('butt_imgv_vflip');
const butt_imgv_hf  = document.getElementById('butt_imgv_hflip');
const butt_imgv_rl  = document.getElementById('butt_imgv_rot_l');
const butt_imgv_rr  = document.getElementById('butt_imgv_rot_r');
const butt_imgv_re  = document.getElementById('butt_imgv_restore');
const butt_imgv_c   = document.getElementById('butt_imgv_m_crop');
const butt_imgv_x   = document.getElementById('butt_imgv_m_drag');

const brush_cursor  = document.getElementById('brush_cursor');
const in_thickness  = document.getElementById('input_thickness');
const input_cp_col  = document.getElementById('input_cp_col');
const input_cp_txt  = document.getElementById('input_cp_txt');
const in_imgv_rot   = document.getElementById('input_rotate');

const tips_imgv     = document.getElementById('tips_imgv');
const tips_draw     = document.getElementById('tips_draw');
const tips_bs       = document.getElementById('tips_bs');

const inputs_brush  = document.getElementById('inputs_brush');
const inputs_color  = document.getElementById('inputs_color');
const inputs_imgv   = document.getElementById('inputs_imgv');

const drop_overlay  = document.getElementById("drop-overlay");

//#endregion

//#region TOOLS

const tools = [tool_pick, tool_drag, tool_draw, tool_rect, tool_laso, tool_imgv];
const panel_aux_items = Array.from(panel_aux.children);

let tool_active, tool_last;

function tool_activate(tool) {
    if (tool === tool_active) return;

    if      (tool_active === tool_drag) cw_drag_disable();
    else if (tool_active === tool_draw) drawing_disable();
    else if (tool_active === tool_pick) cp_exit();

    tools.forEach(x => x.classList.remove('active'));
    tool.classList.add('active');
    tool_last = tool_active;
    tool_active = tool;
    panel_aux_items.forEach(x => x.classList.toggle('hide', !x.classList.contains(tool.id)));

    if      (tool_active === tool_drag) cw_drag_enable();
    else if (tool_active === tool_draw) drawing_enable();
    else if (tool_active === tool_pick) cp_start();
}
function SETUP_TOOLS() {
    tool_activate(tool_draw);
    panel_main.addEventListener('click', e => {
        const tool = tools.find(x => x.contains(e.target));
        if (tool) tool_activate(tool);
    });
    window.addEventListener('keydown', e => {
        if (imgv || anyInp()) return;
        if      (key_is(e, 'c')) bind(e, tool_pick, () => tool_activate(tool_pick));
        else if (key_is(e, 'e')) bind(e, tool_pick, () => tool_activate(tool_pick)); // I got used to it from prev ver.
        else if (key_is(e, 'x')) bind(e, tool_drag, () => tool_activate(tool_drag));
        else if (key_is(e, 'd')) bind(e, tool_draw, () => tool_activate(tool_draw));
        else if (key_is(e, 'r')) bind(e, tool_rect, () => tool_activate(tool_rect));
        else if (key_is(e, 'q')) bind(e, tool_laso, () => tool_activate(tool_laso));
    });
    setup_yn_toggle(in_thickness, inputs_brush);
    setup_yn_toggle(input_cp_txt, inputs_color, 1);
    setup_yn_toggle(in_imgv_rot,  inputs_imgv);
}
//#endregion

//#region CANVAS GENERAL

let cw_true_w;
let cw_true_h;

function cw_init_size() {
    cw_true_w = localStorage.getItem('cw_w') ?? 1280;
    cw_true_h = localStorage.getItem('cw_h') ?? 720;
    cw_set_size();
    cw_resize_true_scale();
}
function cw_change_true_size() {
    const input = prompt('Change canvas size:', '1280 720');
    const dims = input.split(' ').filter(Boolean); // ignore empty
    const nw = parseInt(dims[0]);
    const nh = parseInt(dims[1] ?? dims[0]);
    if (nw && nh) {
        cw_true_w = nw;
        cw_true_h = nh;
        localStorage.setItem('cw_w', cw_true_w);
        localStorage.setItem('cw_h', cw_true_h);
        cw_set_size();
        cw_resize_true_scale();
        history_draw();
    }
    else {
        alert(`S-Sorry artist-kun, I... d-don't understand you...

Type in two numbers separated by a whitespace.
Or a single number to make canvas square.`);
        cw_change_true_size();
    }
}
function cw_set_size() {
    cw.style.width  = `${cw_true_w}px`;
    cw.style.height = `${cw_true_h}px`;
    canvas_draw.width  = cw_true_w;
    canvas_draw.height = cw_true_h;
    canvas_over.width  = cw_true_w;
    canvas_over.height = cw_true_h;
    canvas_info.width  = cw_true_w;
    canvas_info.height = cw_true_h;
}
function getCanvasCursorXY() {
    const x = Math.floor((mouse.x - cw_x) / cw_scale);
    const y = Math.floor((mouse.y - cw_y) / cw_scale);
    return { x, y };
}
function SETUP_CW() {
    document.addEventListener('keydown', e => {
        if (key_is(e, 'F1^a' )) cw_change_true_size() || e.preventDefault();
    });
}
//#endregion

//#region CANVAS ZOOM

let cw_x, cw_y, cw_scale = 1;

let cw_pixelated = false;

const MIN_CW_SCALE = 0.05;
const MAX_CW_SCALE = 20;
const CW_ZOOM_FACTOR_DEFAULT = 1.1;
const CW_ZOOM_FACTOR_SHIFT   = 1.35;

function cw_transform() {
    cw.style.transform = `translate(${Math.floor(cw_x)}px, ${Math.floor(cw_y)}px) scale(${cw_scale})`;
    brush_cursor_RENDER();
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
    cw_scale = math_clamp(MIN_CW_SCALE, MAX_CW_SCALE, cw_scale * factor);
    cw_x = x - cw_true_x * cw_scale;
    cw_y = y - cw_true_y * cw_scale;
    cw_transform();
}
function cw_pixelated_toggle() {
    cw_pixelated = !cw_pixelated;
    cw.classList.toggle('pixelated', cw_pixelated);
}
function SETUP_CW_ZOOM() {
    vp.addEventListener('wheel', e => {
        e.preventDefault();
        if      (input_active(in_thickness)) { // OFFTOP
            e.deltaY > 0 ? thickness_less(e) : thickness_more(e);
        }
        else if (input_active(in_imgv_rot)) {  // OFFTOP
            const mul1 = e.shiftKey   ?  5 : 1;
            const mul2 = e.deltaY > 0 ? -1 : 1;
            imgv_rotate(mul1 * mul2);
        }
        else if (e.ctrlKey) {
            cw_zoom(e, e.deltaY > 0);
        }
        else {
            cw_x -= e.shiftKey ? e.deltaY : e.deltaX;
            cw_y -= e.shiftKey ? e.deltaX : e.deltaY;
            cw_transform();
        }
    }, { passive: false });
    window.addEventListener('keydown', e => {
        if      (key_is(e, '1^c')) bind(e, butt_zoom_1, cw_resize_true_scale);
        else if (key_is(e, '2^c')) bind(e, butt_zoom_2, cw_resize_fit_screen);
        else if (key_is(e, '='  )) bind(e, butt_zoom_in,  () => cw_zoom(e, false, true));
        else if (key_is(e, '-'  )) bind(e, butt_zoom_out, () => cw_zoom(e, true,  true));
        else if (key_is(e, 'F1' )) cw_pixelated_toggle() || e.preventDefault();
    });
    window.addEventListener('resize', () => {
        // keep canvas position relative to center
        cw_x -= (window.w - window.innerWidth)  / 2;
        cw_y -= (window.h - window.innerHeight) / 2;
        cw_transform();
    });
    butt_zoom_1  .onclick = cw_resize_true_scale;
    butt_zoom_2  .onclick = cw_resize_fit_screen;
    butt_zoom_in .onclick = e => cw_zoom(e, false, true);
    butt_zoom_out.onclick = e => cw_zoom(e, true,  true);
}
//#endregion

//#region CANVAS DRAG

let   cw_draggable = false;
let   cw_dragging  = false;
const cw_dragging_from = {
    mouse_x: 0,
    mouse_y: 0,
    cw_x: 0,
    cw_y: 0,
};

function cw_drag_enable() {
    vp.classList.add('draggable');
    cw_draggable = true;
}
function cw_drag_disable() {
    vp.classList.remove('draggable');
    cw_draggable = false;
    cw_drag_stop();
}
function cw_drag_start() {
    if (cw_draggable && !cw_dragging) {
        cw_dragging = true;
        vp.classList.add('dragging');
        cw_dragging_from.mouse_x = mouse.x;
        cw_dragging_from.mouse_y = mouse.y;
        cw_dragging_from.cw_x = cw_x;
        cw_dragging_from.cw_y = cw_y;
    }
}
function cw_drag() {
    if (cw_draggable && cw_dragging) {
        cw_x = cw_dragging_from.cw_x + (mouse.x - cw_dragging_from.mouse_x);
        cw_y = cw_dragging_from.cw_y + (mouse.y - cw_dragging_from.mouse_y);
        cw_transform();
    }
}
function cw_drag_stop() {
    if (cw_dragging) {
        cw_dragging = false;
        vp.classList.remove('dragging');
    }
}

function SETUP_CW_DRAG() {
    vp    .addEventListener('pointerdown', e => e.button === 0 && cw_drag_start());
    window.addEventListener('pointermove', cw_drag);
    window.addEventListener('pointerup',   cw_drag_stop);
}
//#endregion

//#region HISTORY

const history_channel = new BroadcastChannel('history_sync');

let history = [], history_len = 0;

async function history_load() {
    history = [];
    history_len = await db_get('state', 'history_len') ?? 0;
    const db = await db_open();
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    await new Promise((resolve, reject) => {
        const request = store.openCursor();
        request.onerror = reject;
        request.onsuccess = e => {
            const cursor = e.target.result;
            if  (!cursor) return resolve();
            history[cursor.key] = cursor.value;
            cursor.continue();
        };
    });
    history_draw();
}
function history_draw() {
    const i_last_image = history_get_last_image_index() ?? -1;
    if   (i_last_image < 0) {
        cd_clear();
        history_draw_pen_from(0);
    }
    else // start from the last image to avoid blinking
        cd_apply_history_img(history[i_last_image].data).then(() => history_draw_pen_from(i_last_image + 1));
}
function history_get_last_image_index() {
    for (let i = history_len - 1; i >= 0; i--) if (history[i].type === 1) return i;
}
function history_draw_pen_from(offset) {
    for (let i = offset; i < history_len; i++) {
        const item = history[i];
        cd_apply_history_pen(item.pen, item.path, item.type);
    }
}
async function history_write(item) {
    if (history.length > history_len) await history_discard_pending();
    const id = history.length = history_len;
    history[id] = item;
    history_len++;
    await db_set('history', id, item);
    await db_set('state', 'history_len', history_len);
    history_channel.postMessage({ type: 'append', id });
}
async function history_discard_pending() {
    console.log('discard');
    const db = await db_open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        const request = store.delete(IDBKeyRange.lowerBound(history_len));
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => resolve();
        tx.onerror    = () => reject(tx.error);
    });
}
async function history_undo() {
    if (imgv) return placing_image_exit();
    if (history_len) {
        history_len--;
        await history_move();
    }
}
async function history_redo() {
    if (history_len < history.length) {
        history_len++;
        await history_move();
    }
}
async function history_move() {
    history_draw();
    await db_set('state', 'history_len', history_len);
    history_channel.postMessage({ type: 'cursor', value: history_len, });
}
async function history_clear() {
    if (confirm('😳 NUKE THE WHOLE THING!?')) {
        history = [];
        history_len = 0;
        cd_clear();
        const db = await db_open();
        {
            const tx = db.transaction(['state', 'history'], 'readwrite');
            tx.objectStore('state').put(0, 'history_len');
            tx.objectStore('history').clear();
        }
        history_channel.postMessage({ type: 'clear' });
    }
}
function SETUP_HISTORY_SYNC() {
    history_channel.onmessage = async (e) => {
        const    message = e.data;
        if      (message.type === 'append') {
            history[message.id] = await db_get('history', message.id);
            history_len = message.id + 1;
            history_draw();
        }
        else if (message.type === 'cursor') {
            history_len = message.value;
            history_draw();
        }
        else if (message.type === 'clear') {
            history = [];
            history_len = 0;
            cd_clear();
        }
    };
}
function SETUP_HISTORY_CTL() {
    butt_undo.onclick = history_undo;
    butt_redo.onclick = history_redo;
    butt_nuke.onclick = history_clear;
    document.addEventListener('keydown', function (e) {
        if (anyInp()) return;
        if      (key_is(e, 'y^c' )) bind(e, butt_redo, history_redo);
        else if (key_is(e, 'z^cs')) bind(e, butt_redo, history_redo);
        else if (key_is(e, 'z^c' )) bind(e, butt_undo, history_undo);
        else if (key_is(e, 'd^c' )) bind(e, butt_nuke, history_clear);
    });
}
//#endregion

//#region DRAWING

const HIS_BRUSH = 0, HIS_IMAGE = 1, HIS_PENCIL = 2; // HIS = HISTORY
const drawing_modes = [HIS_BRUSH, HIS_PENCIL];
const LOCK_X = 1, LOCK_Y = 2;
const cd_ctx = canvas_draw.getContext('2d');

let drawing_enabled = false;
let drawing = null;
let color = 'black';
let thickness = 2;
let thickness_temp;
let drawing_mode_i = 0;
let drawing_mode = drawing_modes[drawing_mode_i];

function drawing_enable() {
    brush_cursor.classList.add('drawing');
    canvas_draw.classList.add('drawing');
    tips_draw.classList.remove('hide');
    drawing_enabled = true;
}
function drawing_disable() {
    brush_cursor.classList.remove('drawing');
    canvas_draw.classList.remove('drawing');
    tips_draw.classList.add('hide');
    drawing_enabled = false;
    drawing_stop();
}
function drawing_start() {
    if (drawing_enabled && !drawing) {
        drawing = {
            pen: { color, size: thickness },
            path: [],
        };
        drawing.path.push(getCanvasCursorXY());
        butt_dw_mode.classList.add('off');
    }
}
function drawing_draw(e) {
    if (drawing_enabled && drawing) {
        const p1 = drawing.path.at(-1)
        const p2 = getCanvasCursorXY();
        if (e.shiftKey || e.ctrlKey) { // draw along axis
            // shift - lock axis on start, ctrl - pick axis each segment
            const steep = e.shiftKey && drawing.lock
                ? drawing.lock === LOCK_Y
                : Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x);
            if   (steep) p2.x = p1.x;
            else         p2.y = p1.y;
            if (e.shiftKey) drawing.lock = steep ? LOCK_Y : LOCK_X;
        }
        else
            drawing.lock = null;
        drawing.path.push(p2);
        cd_draw_segment(p1, p2, drawing.pen, drawing_mode);
    }
}
function drawing_stop(e) {    
    if (drawing) {
        if (drawing.path.length === 1) {
            const p = getCanvasCursorXY();
            cd_draw_dot(p, drawing.pen, drawing_mode);
        }
        else if (e.altKey) { // close path
            const p1 = drawing.path.at(-1);
            const p2 = drawing.path[0];
            if (e.shiftKey || e.ctrlKey) {
                const p0 = drawing.path.at(-2)
                const steep = Math.abs(p0.y - p1.y) > Math.abs(p0.x - p1.x);
                const pm = steep ? new Vek2(p1.x, p2.y) : new Vek2(p2.x, p1.y); // mid-point
                drawing.path.push(pm);
                drawing.path.push(p2);
                cd_draw_segment(p1, pm, drawing.pen, drawing_mode);
                cd_draw_segment(pm, p2, drawing.pen, drawing_mode);
            }
            else {
                drawing.path.push(p2);
                cd_draw_segment(p1, p2, drawing.pen, drawing_mode);
            }
        }
        history_write({ type: drawing_mode, pen: drawing.pen, path: drawing.path });
        drawing = null;
        butt_dw_mode.classList.remove('off');
    }
}

function cd_clear() {
    cd_ctx.fillStyle = 'white';
    cd_ctx.fillRect(0, 0, canvas_draw.width, canvas_draw.height);
}
function cd_draw_segment(p1, p2, pen, type) {
    if (type === HIS_PENCIL) {
        cd_ctx.fillStyle = pen.color;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const steep = Math.abs(dy / dx) > 1; // vertical > horizontal
        //    steep ? flip axes so one with longer range becomes x
        const a1 = steep ? p1.y : p1.x;
        const a2 = steep ? p2.y : p2.x; // a -   arg axis (like x)
        const b1 = steep ? p1.x : p1.y;
        const b2 = steep ? p2.x : p2.y; // b - value axis (like y)
        const k  = steep ? dx / dy : dy / dx; // slope
        const c  = b1 - k * a1 // b-intercept
        const step = a1 < a2 ? 1 : -1;
        const o1 = pen.size % 2 == 1 ? 0.5 : 0;
        const o  = pen.size / 2 + o1;
        for (let a = a1; a != a2; a += step) {
            const b = Math.round(k * a + c);
            const x = steep ? b : a;
            const y = steep ? a : b; // restore axes
            cd_ctx.fillRect(x - o, y - o, pen.size, pen.size);
        }
    }
    else {
        cd_ctx.globalCompositeOperation  = 'source-over'; // todo experiment with values
        cd_ctx.lineJoin = cd_ctx.lineCap = 'round';
        cd_ctx.strokeStyle = pen.color;
        cd_ctx.lineWidth   = pen.size;
        cd_ctx.beginPath();
        cd_ctx.moveTo(p1.x, p1.y);
        cd_ctx.lineTo(p2.x, p2.y);
        cd_ctx.stroke();
    }
}
function cd_draw_dot(point, pen, type) {
    const { x, y } = point;
    if (type === HIS_PENCIL) {
        cd_ctx.fillStyle = pen.color;
        const o1 = pen.size % 2 == 1 ? 0.5 : 0;
        const o  = pen.size / 2 + o1;
        cd_ctx.fillRect(x - o, y - o, pen.size, pen.size);
    }
    else {
        cd_ctx.fillStyle = pen.color;
        cd_ctx.beginPath();
        cd_ctx.arc(x, y, pen.size / 2, 0, 2 * Math.PI);
        cd_ctx.fill();
    }
}
function cd_draw_pasted_image(e, paste_another_img) {
    imgv_draw_image(cd_ctx);
    if (!paste_another_img) placing_image_exit();

    canvas_draw.toBlob((blob) => {
        history_write({ type: HIS_IMAGE, data: blob });
    }, 'image/webp', 0.95);
}
function cd_apply_history_pen(pen, path, type) {
    if (path.length > 1) {
        let p1 = path[0];
        for (let i = 1; i < path.length; i++) {
            const p2 = path[i];
            cd_draw_segment(p1, p2, pen, type);
            p1 = p2;
        }
    }
    else
        cd_draw_dot(path[0], pen, type);
}
function cd_apply_history_img(data) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = data instanceof Blob
            ? URL.createObjectURL(data)
            : data; // base64, legacy v1 support
    }).then(img => cd_ctx.drawImage(img, 0, 0));
}
function set_thickness(value) {
    thickness = math_clamp(1, 999, value);
    in_thickness.value = thickness;
    if (brush_cursor.style.display !== 'none')
        brush_cursor_RENDER();
}
function thickness_less(e) { set_thickness(e.shiftKey ? Math.floor(thickness / 1.5) : thickness - 1); }
function thickness_more(e) { set_thickness(e.shiftKey ? Math.ceil (thickness * 1.5) : thickness + 1); }
function brush_cursor_RENDER() {
    const cc = getCanvasCursorXY();
    const style  = brush_cursor.style;
    const offset = drawing_mode === HIS_PENCIL && thickness % 2 == 1 ? 0.5 : 0;
    style.width  = `${Math.round(thickness * cw_scale)}px`;
    style.height = `${Math.round(thickness * cw_scale)}px`;
    style.left = `${Math.round(cw_x + cc.x * cw_scale - offset * cw_scale)}px`;
    style.top  = `${Math.round(cw_y + cc.y * cw_scale - offset * cw_scale)}px`;
    brush_cursor.style.borderColor = brush_cursor_get_color();
}
function brush_cursor_get_color() {
    const { x, y } = getCanvasCursorXY();
    if (thickness >= 10) {
        const o = 0.5 * thickness * 0.7071067811865476;
        const r = 0.5 * thickness;
        const d = thickness + 1;
        const data = cd_ctx.getImageData(x - r, y - r, d, d).data;
        const points = [
            [x + o, y + o],
            [x + o, y - o],
            [x - o, y + o],
            [x - o, y - o],
            [x, y + r],
            [x, y - r],
            [x + r, y],
            [x - r, y],
        ];
        const c = points.map(([px, py]) => {
            const ix = Math.floor(px - x + r);
            const iy = Math.floor(py - y + r);
            const i = (iy * d + ix) * 4;
            return data[i + 3] === 0
                ? 255
                : 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        });
        const min = Math.min(...c);
        const max = Math.max(...c);
        const avg = c.reduce((acc, val) => acc + val, 0) / c.length;
        const v = 255 - avg;
        const  range = max - min;
        return range > 160 ? `rgb(${v},${v},${v})` : avg < 127 ? 'white' : 'black';
    }
    else {
        const [r, g, b, a] = cd_ctx.getImageData(x, y, 1, 1).data;
        const  c = a > 0 ? 0.2126 * r + 0.7152 * g + 0.0722 * b : 255;
        return c < 120 ? 'white' : 'black';
    }
}
function drawing_toggle_mode() {
    if (!drawing) {
        drawing_mode_i = (drawing_mode_i + 1) % drawing_modes.length;
        drawing_mode = drawing_modes[drawing_mode_i];
        const shape = butt_dw_mode.getElementsByTagName('div')[0];
        const pencil = drawing_mode === HIS_PENCIL;
        brush_cursor.style.borderRadius = pencil ? '0' : '50%';
        shape.classList.toggle('round', !pencil);
    }
}
function SETUP_DRAWING() {
    butt_bs_less.onclick = thickness_less;
    butt_bs_more.onclick = thickness_more;
    butt_dw_mode.onclick = drawing_toggle_mode;
    canvas_draw.addEventListener('pointerdown', drawing_start);
    document.addEventListener('pointermove',    drawing_draw);
    document.addEventListener('pointerup',      drawing_stop);
    document.addEventListener('keydown', e => {
        if (!drawing_enabled || anyInp()) return;
        if      (key_is(e, 'w^S')) bind(e, butt_bs_more, () => thickness_more(e));
        else if (key_is(e, 's^S')) bind(e, butt_bs_less, () => thickness_less(e));
        else if (key_is(e, 'z^s')) fx_click(inputs_brush, 0) || in_thickness.focus() || e.preventDefault();
        else if (key_is(e, 'z'  )) bind(e, butt_dw_mode, drawing_toggle_mode);
    });
    in_thickness.addEventListener('focus', () => {
        thickness_temp = thickness;
        tips_bs.classList.remove('hide');
        tips_draw.classList.add('move');
    });
    in_thickness.addEventListener('blur', () => {
        tips_bs.classList.add('hide');
        tips_draw.classList.remove('move');
    });
    in_thickness.addEventListener('keydown', e => {
        if (key_is(e, 'Tab') || key_is(e, 'Enter')) {
            fx_click(inputs_brush, 2);
            set_thickness(in_thickness.value);
        }
        else if (key_is(e, 'Escape')) {
            fx_click(inputs_brush, 1);
            set_thickness(thickness_temp);
        }
        else return;
        // leave input field
        in_thickness.blur();
        e.preventDefault();
    });
}
function SETUP_BRUSH_CURSOR() {
    canvas_draw.addEventListener('pointerenter', () => {
        brush_cursor.classList.add('on-canvas');
        brush_cursor_RENDER();
    });
    canvas_draw.addEventListener('pointerleave', () => {
        brush_cursor.classList.remove('on-canvas');
    });
    canvas_draw.addEventListener('pointermove', () => {
        brush_cursor_RENDER();
    });
}
//#endregion

//#region IMAGE SAVE
function cd_save_image() {
    canvas_draw.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agartic-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, 'image/png');
}
function SETUP_IMAGE_SAVE() {
    butt_save.onclick = cd_save_image;
    document.addEventListener('keydown', e => {
        if (key_is(e, 's^c')) bind(e, butt_save, cd_save_image);
    });
}
//#endregion

//#region IMAGE COPY
function cd_copy_to_clipboard() {
    const callback = (blob) => {
        let item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => temp_fx(cw, 'fx-copied', 500));
    };
    canvas_draw.toBlob(callback, 'image/png');
}
function SETUP_IMAGE_COPY() {
    butt_copy.onclick = cd_copy_to_clipboard;
    document.addEventListener('copy', () => {
        if (!anySel()) fx_click(butt_copy) || cd_copy_to_clipboard();
    });
}
//#endregion

//#region IMAGE PASTE
function image_paste__kbd(e) {
    const items = Array.from(e.clipboardData?.items);
    const item  = items.find(i => i.type.startsWith('image'));
    if   (item) image_paste(item.getAsFile());
}
function image_paste__button() {
    navigator.clipboard.read().then(items => {
        const item  = items.find(i => i.types.some(t => t.startsWith('image')));
        if   (item) {
            const type = item.types.find(t => t.startsWith('image'));
            item.getType(type).then(blob => image_paste(blob));
        }
    });
}
function image_paste(blob) {
    if (imgv) cd_draw_pasted_image(null, true);

    const url = URL.createObjectURL(blob);
    image_init(url);
}
function image_read_input(file) {
    if (imgv) cd_draw_pasted_image(null, true);

    const reader = new FileReader();
    reader.onload = () => {
        const url = reader.result;
        image_init(url);
    };
    reader.readAsDataURL(file);
}
function image_init(url) {
    const img = new Image();
    img.onload = () => {
        placing_image_start(img);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

let image_input_drag_counter = 0;

function image_input_update() {
    const b = image_input_drag_counter > 0;
    if  (!b)  image_input_drag_counter = 0;
    drop_overlay.classList.toggle("active", b);
}
function SETUP_IMAGE_PASTE() {
    butt_paste  .onclick = image_paste__button;
    butt_imgv_ok.onclick = cd_draw_pasted_image;
    butt_imgv_no.onclick = placing_image_exit;
    document.addEventListener('paste', function (e) {
        if (!anyInp()) fx_click(butt_paste) || image_paste__kbd(e);
    });
    document.addEventListener('keydown', e => {
        if (imgv && !anySel()) {
            if      (key_is(e, 'Enter' )) cd_draw_pasted_image();
            else if (key_is(e, 'Tab'   )) cd_draw_pasted_image();
            else if (key_is(e, 'Space' )) cd_draw_pasted_image();
            else if (key_is(e, 'Escape')) placing_image_exit();
        }
    });
    document.addEventListener("dragenter", () => {
        image_input_drag_counter++;
        image_input_update();
    });
    document.addEventListener("dragleave", () => {
        image_input_drag_counter--;
        image_input_update();
    });
    document.addEventListener("drop", e => {
        image_input_drag_counter = 0;
        image_input_update();
        const file = e.dataTransfer.files?.[0];
        if   (file?.type.startsWith("image/"))
            image_read_input(file);
    });
}
//#endregion

//#region PLACING IMAGE

const MIN_IMG_SIZE = 10;

const co_ctx = canvas_over.getContext('2d');

let imgv = null;
let imgv_pixelated = false;

function placing_image_start(img) {
    imgv = {
        img: img,
        og:   new Size      (img.width, img.height),
        curr: new Rekt(0, 0, img.width, img.height),
        crop: new Rekt(0, 0, 1, 1),
        /* drag start snapshot - cursor on image */ drag_ci:   new Vek2(),
        /* drag start snapshot - crop */            drag_crop: new Rekt(),
        hflip: false,
        vflip: false,
        rotate: 0,
        in_crop_mode: false,
        grabbed_handle: null,
        is_dragging: false,
        is_resizing: false,
        /*  shift */ mod_keep_ratio:     false,
        /*   ctrl */ mod_drag_by_handle: false,
        /*    alt */ mod_drag_canvas:    false,
        /*    alt */ mod_resize_centered: () => imgv.mod_drag_canvas,
        crop_real_ratio: () => { // + L + XXL + you're sus
          return (imgv.og.w * imgv.crop.w)
               / (imgv.og.h * imgv.crop.h);
        },
        // selection frame on image, px
        crop_real_i: () => {
            const x = imgv.crop.x * imgv.curr.w;
            const y = imgv.crop.y * imgv.curr.h;
            const w = imgv.crop.w * imgv.curr.w;
            const h = imgv.crop.h * imgv.curr.h;
            return new Rekt(x, y, w, h);
        },
        // selection frame on canvas, px
        crop_real_c: () => {
            const { x, y, w, h } = imgv.crop_real_i();
            const ox = x + imgv.curr.x;
            const oy = y + imgv.curr.y; // offset xy
            return new Rekt(ox, oy, w, h);
        },
        // center of selection frame, px
        pivot_point: () => {
            const { x, y, w, h } = imgv.crop_real_c();
            const cx = x + w / 2;
            const cy = y + h / 2; // center xy
            return new Vek2(cx, cy);
        },
    };
    tool_activate(tool_imgv);
    placing_image_RENDER();
    imgv_handles_reset_style();
    imgv_enter_drag_mode();
    in_imgv_rot.value = 0;
    tips_imgv   .classList.remove('hide');
    imgv_wrapper.classList.remove('hide');
    vp.classList.add('img-draggable');
    imgv_sel.style.transform = '';
}
function placing_image_exit() {
    imgv = null;
    fx_click(tool_last);
    tool_activate(tool_last);
    tips_imgv   .classList.add('hide');
    imgv_wrapper.classList.add('hide');
    vp.classList.remove('img-draggable');
    vp.classList.remove('img-dragging');
    co_ctx.clearRect(0, 0, canvas_over.width, canvas_over.height);
}
function placing_image_RENDER() {
    co_ctx.clearRect(0, 0, canvas_over.width, canvas_over.height);
    imgv_draw_image(co_ctx);
    const { x, y, w, h } = imgv.crop_real_c();
    imgv_sel.style.left   = `${x}px`;
    imgv_sel.style.top    = `${y}px`;
    imgv_sel.style.width  = `${w}px`;
    imgv_sel.style.height = `${h}px`;
    if (debug_points.length) {
        ci_ctx.clearRect(0, 0, canvas_over.width, canvas_over.height);
        if (DEBUG) {
            debug_points.forEach(x => debug_point_at(x.p, x.color));
        }
    }
}
function imgv_draw_image(ctx_2D) {
    const { hflip, vflip, rotate } = imgv;
    if (vflip || hflip || rotate) {
        const pp = imgv.pivot_point();
        const sx = hflip ? -1 : 1;
        const sy = vflip ? -1 : 1;
        const rad = math_rad_from_deg(rotate);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        ctx_2D.setTransform(
            cos *  sx,
            sin *  sx,
            sin * -sy, // bau 😭😂👌💔
            cos *  sy,
            pp.x - (cos * sx) * pp.x - (sin * -sy) * pp.y,
            pp.y - (sin * sx) * pp.x - (cos *  sy) * pp.y
        );
        // todo fix resizing cropped image
        imgv_draw_image_internal(ctx_2D);
        ctx_2D.setTransform(1, 0, 0, 1, 0, 0);
    }
    else
        imgv_draw_image_internal(ctx_2D);
}
function imgv_draw_image_internal(ctx_2D) {
    const { img, og, crop } = imgv;
    const c = imgv.crop_real_c();
    ctx_2D.drawImage(
        img,
        og.w * crop.x,
        og.h * crop.y,
        og.w * crop.w,
        og.h * crop.h,
        c.x,
        c.y,
        c.w,
        c.h,
    );
}

function imgv_interaction_start(e) {
    if (imgv) {
        if (imgv.grabbed_handle = e.target.closest('.handle')) {
            imgv.is_resizing = true;
            vp.dataset.cursor = imgv.grabbed_handle.dataset.cursor;
        }
        else if (imgv.mod_drag_canvas) {
            cw_drag_enable();
            cw_drag_start();
        }
        else { // image drag
            imgv.is_dragging = true;
            vp.classList.add('img-dragging');
            imgv_save_drag_snapshots();
        }
    }
}
function imgv_interaction_stop() {
    if (imgv) {
        imgv.is_dragging = false;
        imgv.is_resizing = false;
        imgv.grabbed_handle = null;
        vp.classList.remove('img-dragging');
        vp.dataset.cursor = '';
        if (imgv.mod_drag_canvas)
            cw_drag_disable();
    }
}
function imgv_interaction_apply_mods(e) {
    if (imgv) {
        if (!imgv.mod_keep_ratio && e.shiftKey) {
            // ~
        }
        else if (imgv.mod_keep_ratio && !e.shiftKey) {
            // ~
        }
        if (!imgv.mod_drag_by_handle && e.ctrlKey) {
            if (imgv.is_resizing) {
                imgv_save_drag_snapshots();
            }
        }
        else if (imgv.mod_drag_by_handle && !e.ctrlKey) {
            // ~
        }
        if (!imgv.mod_drag_canvas && e.altKey) {
            if (imgv.is_dragging) cw_drag_enable() || cw_drag_start();
        }
        else if (imgv.mod_drag_canvas && !e.altKey) {
            if (cw_draggable) cw_drag_disable();
            e.preventDefault(); // firefox menu bar
        }
        imgv.mod_keep_ratio     = e.shiftKey;
        imgv.mod_drag_by_handle = e. ctrlKey;
        imgv.mod_drag_canvas    = e.  altKey;
        imgv_interact();
    }
}
function imgv_save_drag_snapshots() {
    const cc = getCanvasCursorXY();
    imgv.drag_ci.x = cc.x - imgv.curr.x;
    imgv.drag_ci.y = cc.y - imgv.curr.y;
    imgv.drag_crop.x = imgv.crop.x;
    imgv.drag_crop.y = imgv.crop.y;
    imgv.drag_crop.w = imgv.crop.w;
    imgv.drag_crop.h = imgv.crop.h;
}

function imgv_interact() {
    if (imgv) {
        if (imgv.is_dragging && imgv.mod_drag_canvas)
            return cw_drag();
        const render = imgv.in_crop_mode
            ? imgv_interact_crop_mode()
            : imgv_interact_move_mode();
        if (render) placing_image_RENDER();
    }
}
function imgv_interact_move_mode() { // IMAGE
    let cc = getCanvasCursorXY();
    if (imgv.is_dragging) {
        imgv_interact_drag_image(cc);
        return true;
    }
    else if (imgv.is_resizing) {
        if (imgv.mod_drag_by_handle) {
            imgv_interact_drag_image(cc);
        }
        const { x, y, w, h } = imgv.crop_real_c();
        if (imgv.rotate) {
            const rad = math_rad_from_deg(imgv.rotate);
            debug_points.length = 0;
            const pp = imgv.pivot_point();
            const { lh, th, vh, hh } = imgv_AnalyzeHandle();
            let oc = imgv_OppositeCornerXY(x, y, w, h, lh, th, vh, hh);
            oc = math_rotate_point(oc, pp, -rad);
            cc = math_rotate_point(cc, oc,  rad);

            let nw = vh ? w :   Math.abs(cc.x - oc.x);
            let nh = hh ? h :   Math.abs(cc.y - oc.y); // todo abs -> proper formula for t/l
            nw = Math.max(nw, MIN_IMG_SIZE);
            nh = Math.max(nh, MIN_IMG_SIZE);
            if (imgv.mod_keep_ratio) {
                const { w, h } = imgv_KeepRatio(cc, oc, nw, nh, vh, hh, imgv.crop_real_ratio());
                nw = w;
                nh = h;
            }
            const    centered = imgv.mod_resize_centered();
            let nx = centered ? pp.x - nw / 2 :   vh ? oc.x - nw / 2 :   lh ? oc.x - nw :   oc.x;
            let ny = centered ? pp.y - nh / 2 :   hh ? oc.y - nh / 2 :   th ? oc.y - nh :   oc.y;
            // ^ tl-corner of image rotated around { centered ? pp : oc }
            // center of image image placed at nx,ny
            const center_new = { x: nx + nw / 2, y: ny + nh / 2 };
            const center_rot = centered ? pp : math_rotate_point(center_new, oc, -rad);
            // ^ centered ? pp : center rotated back around oc
            if (DEBUG) {
                debug_point_push({ x: nx,      y: ny      }, 'lime');
                debug_point_push({ x: nx,      y: ny + nh }, 'green');
                debug_point_push({ x: nx + nw, y: ny      }, 'green');
                debug_point_push({ x: nx + nw, y: ny + nh }, 'green');
                debug_point_push(pp, 'red');
                debug_point_push(oc, 'black');
                debug_point_push(cc, 'blue');
                debug_point_push(center_new, 'orange');
                debug_point_push(center_rot, 'gold');
            }
            const c_new = new Rekt(
                center_rot.x - nw / 2,
                center_rot.y - nh / 2,
                nw, nh
            );
            imgv.curr = imgv_curr_from_crop_real_c(c_new);
            // todo fix - oppo corner shakes a bit
        }
        else {
            const c_new = imgv_interact_resize_straight(cc, x, y, w, h, imgv.crop_real_ratio());
            imgv.curr = imgv_curr_from_crop_real_c(c_new);
        }
        return true;
    }
}
function imgv_curr_from_crop_real_c(crop_real_c) {
    const w = crop_real_c.w / imgv.crop.w;
    const h = crop_real_c.h / imgv.crop.h;
    const x = crop_real_c.x - imgv.crop.x * w;
    const y = crop_real_c.y - imgv.crop.y * h;
    return new Rekt(x, y, w, h);
}
function imgv_interact_crop_mode() { // CROP
    let cc = getCanvasCursorXY();
    if (imgv.is_dragging) {
        imgv_interact_drag_cropping(cc);
        return true;
    }
    else if (imgv.is_resizing) {
        if (imgv.mod_drag_by_handle) {
            imgv_interact_drag_cropping(cc);
        }
        const { x, y, w, h } = imgv.crop_real_c();
        if (imgv.rotate) {
            const rad = math_rad_from_deg(imgv.rotate);
            const pp = imgv.pivot_point();
            cc = math_rotate_point(cc, pp, rad);
        }
        const ratio = imgv.curr.w / imgv.curr.h;
        const cr = imgv_interact_resize_straight(cc, x, y, w, h, ratio); // crop resized
        const nx = (cr.x - imgv.curr.x) / imgv.curr.w;
        const ny = (cr.y - imgv.curr.y) / imgv.curr.h;
        imgv.crop.x = math_clamp(0, 1, nx);
        imgv.crop.y = math_clamp(0, 1, ny);
        imgv.crop.w = math_clamp(0, 1 - imgv.crop.x, (cr.w / imgv.curr.w - imgv.crop.x + nx));
        imgv.crop.h = math_clamp(0, 1 - imgv.crop.y, (cr.h / imgv.curr.h - imgv.crop.y + ny));
        return true;
    }
}
function imgv_interact_drag_image(cc) {
    imgv.curr.x = cc.x - imgv.drag_ci.x;
    imgv.curr.y = cc.y - imgv.drag_ci.y;
}
function imgv_interact_drag_cropping(cc) {
    // todo handle rotated / flipped image ★
    const { x, y, w, h } = imgv.crop;
    if (x > 0.0 || y > 0.0 || w < 1.0 || h < 1.0) {
        const cc_dx = cc.x - imgv.drag_ci.x - imgv.curr.x;
        const cc_dy = cc.y - imgv.drag_ci.y - imgv.curr.y; // cursor difference
        imgv.crop.x = imgv.drag_crop.x + cc_dx / imgv.curr.w;
        imgv.crop.y = imgv.drag_crop.y + cc_dy / imgv.curr.h;
        if (imgv.crop.x < 0.0)
            imgv.crop.x = 0.0;
        if (imgv.crop.x > 1.0 - imgv.crop.w)
            imgv.crop.x = 1.0 - imgv.crop.w;
        if (imgv.crop.y < 0.0)
            imgv.crop.y = 0.0;
        if (imgv.crop.y > 1.0 - imgv.crop.h)
            imgv.crop.y = 1.0 - imgv.crop.h;
    }
}
function imgv_interact_resize_straight(cc, x, y, w, h, ratio) {
    const { lh, th, vh, hh } = imgv_AnalyzeHandle();
    let oc = imgv_OppositeCornerXY(x, y, w, h, lh, th, vh, hh);
    let nw = vh ? w :   lh ? w + (x - cc.x) :   cc.x - x;
    let nh = hh ? h :   th ? h + (y - cc.y) :   cc.y - y; // n = new
    nw = Math.max(nw, MIN_IMG_SIZE);
    nh = Math.max(nh, MIN_IMG_SIZE);
    if (imgv.mod_keep_ratio) {
        const { w, h } = imgv_KeepRatio(cc, oc, nw, nh, vh, hh, ratio);
        nw = w;
        nh = h;
    }
    const      center = imgv.mod_resize_centered();
    const rx = center ? x + (w - nw) / 2 :   vh ? oc.x - nw / 2 :   lh ? oc.x - nw :   x;
    const ry = center ? y + (h - nh) / 2 :   hh ? oc.y - nh / 2 :   th ? oc.y - nh :   y;
    const rw = nw;
    const rh = nh; // r = result
    return new Rekt(rx, ry, rw, rh);
}
function imgv_KeepRatio(cc, oc, w, h, vh, hh, ratio) {
    const d2 = Math.pow(cc.x - oc.x, 2) + Math.pow(cc.y - oc.y, 2);
    // todo check direction, don't treat it like abs
    if (hh) {
        w = Math.pow(d2, 0.5); // distance cc <-> oc = w
        h = w / ratio;
    }
    else if (vh) {
        h = Math.pow(d2, 0.5); // distance cc <-> oc = h
        w = h * ratio;
    }
    else {
        const ratio2 = Math.pow(ratio, 2); // = w2 / h2
        const w2_to_wh_sum2 = ratio2 / (1 + ratio2); // = w2 / (h2 + w2)
        const w2 = d2 * w2_to_wh_sum2;
        w = Math.pow(w2, 0.5); // distance cc <-> oc = diagonal
        h = w / ratio;
    }
    if (ratio < 1) {
        w = Math.max(w, MIN_IMG_SIZE);
        h = w / ratio; // tall
    }
    else {
        h = Math.max(h, MIN_IMG_SIZE);
        w = h * ratio; // wide
    }
    return new Size(w, h);
}
function imgv_OppositeCornerXY(x, y, w, h, lh, th, vh, hh){
    let oc_x = vh ? x + w / 2 :   lh ? x + w :   x;
    let oc_y = hh ? y + h / 2 :   th ? y + h :   y;
    return new Vek2(oc_x, oc_y); // opposite to grabbed handle
}
function imgv_AnalyzeHandle() {
    const classList = imgv.grabbed_handle.classList;
    return {
        lh: classList.contains('l'),
        th: classList.contains('t'),
        vh: classList.contains('v'),
        hh: classList.contains('h'),
    };
}

function imgv_resize_true_scale() {
    imgv.curr.x = imgv.curr.x + Math.floor((imgv.curr.w - imgv.og.w) / 2);
    imgv.curr.y = imgv.curr.y + Math.floor((imgv.curr.h - imgv.og.h) / 2);
    imgv.curr.w = imgv.og.w;
    imgv.curr.h = imgv.og.h;
    placing_image_RENDER();
}
function imgv_resize_stretch() {
    imgv.curr.x = 0;
    imgv.curr.y = 0;
    imgv.curr.w = canvas_draw.width;
    imgv.curr.h = canvas_draw.height;
    placing_image_RENDER();
}
function imgv_resize_stretch_crop() {
    const c = new Rekt(
        0, 0,
        canvas_draw.width,
        canvas_draw.height
    );
    imgv.curr = imgv_curr_from_crop_real_c(c);
    placing_image_RENDER();
}
function imgv_vflip() {
    imgv.vflip = !imgv.vflip;
    placing_image_RENDER();
}
function imgv_hflip() {
    imgv.hflip = !imgv.hflip;
    placing_image_RENDER();
}
function imgv_restore() {
    if (imgv.in_crop_mode) {
        imgv.crop = new Rekt(0, 0, 1, 1);
    }
    else {
        imgv.vflip  = imgv.hflip        = false;
        imgv.rotate = in_imgv_rot.value = 0;
        imgv_sel.style.transform = '';
        imgv_handles_restyle();
    }
    placing_image_RENDER();
}
function imgv_rotate(deg) {
    imgv.rotate = in_imgv_rot.value = (360 + imgv.rotate + deg % 360) % 360; // [0,360)
    imgv_sel.style.transform = `rotate(${imgv.rotate}deg)`;
    placing_image_RENDER();
    imgv_handles_restyle();
}
function imgv_enter_crop_mode() {
    imgv.in_crop_mode = true;
    imgv_set_mode();
}
function imgv_enter_drag_mode() {
    imgv.in_crop_mode = false;
    imgv_set_mode();
}
function imgv_set_mode() {
    butt_imgv_c.classList.remove('active')
    butt_imgv_x.classList.remove('active')
    const active = imgv.in_crop_mode ? butt_imgv_c : butt_imgv_x;
    active.classList.add('active');
    panel_aux_items
        .filter (x => x.classList.contains('tool_imgv') && x.classList.contains('modal'))
        .forEach(x => x.classList.toggle('hide', !x.classList.contains(active.dataset.mode)));
}
function imgv_pixelated_toggle() {
    imgv_pixelated = !imgv_pixelated;
    cd_ctx.imageSmoothingEnabled = !imgv_pixelated;
    co_ctx.imageSmoothingEnabled = !imgv_pixelated;
    placing_image_RENDER();
}

const handles = [ hand_tl, hand_tt, hand_tr, hand_rr, hand_br, hand_bb, hand_bl, hand_ll ];
const handle_cursors = [ 'nw', 'ns', 'ne', 'ew', 'nw', 'ns', 'ne', 'ew' ];

function imgv_handles_restyle() {
    const j = Math.floor((imgv.rotate + 22.5) / 45);
    for (let i = 0; i < 8; i++)
        handles[(8 + i - j) % 8].dataset.cursor = handle_cursors[i];
}
function imgv_handles_reset_style() {
    for (let i = 0; i < 8; i++)
        handles[i].dataset.cursor = handle_cursors[i];
}

function SETUP_IMAGE_PLACING() {
    butt_imgv_s1.onclick = imgv_resize_true_scale;
    butt_imgv_s2.onclick = imgv_resize_stretch;
    butt_imgv_s3.onclick = imgv_resize_stretch_crop;
    butt_imgv_vf.onclick = imgv_vflip;
    butt_imgv_hf.onclick = imgv_hflip;
    butt_imgv_rl.onclick = e => imgv_rotate(e.shiftKey ? -15 : -90);
    butt_imgv_rr.onclick = e => imgv_rotate(e.shiftKey ? +15 : +90);
    butt_imgv_re.onclick = imgv_restore;
    butt_imgv_c .onclick = imgv_enter_crop_mode;
    butt_imgv_x .onclick = imgv_enter_drag_mode;
    document.addEventListener('pointerdown', imgv_interaction_start);
    document.addEventListener('pointermove', imgv_interact);
    document.addEventListener('pointerup',   imgv_interaction_stop);
    document.addEventListener('keydown',     imgv_interaction_apply_mods);
    document.addEventListener('keyup',       imgv_interaction_apply_mods);
    document.addEventListener('keydown', e => {
        if (imgv && !anySel()) {
            if      (key_is(e, '1^a')) bind(e, butt_imgv_s1, imgv_resize_true_scale);
            else if (key_is(e, '2^a')) bind(e, butt_imgv_s2, imgv_resize_stretch);
            else if (key_is(e, '3^a')) bind(e, butt_imgv_s3, imgv_resize_stretch_crop);
            else if (key_is(e, 'w'  )) bind(e, butt_imgv_vf, imgv_vflip);
            else if (key_is(e, 'd'  )) bind(e, butt_imgv_hf, imgv_hflip);
            else if (key_is(e, 'r'  )) bind(e, butt_imgv_re, imgv_restore);
            else if (key_is(e, 'c'  )) bind(e, butt_imgv_c, imgv_enter_crop_mode);
            else if (key_is(e, 'x'  )) bind(e, butt_imgv_x, imgv_enter_drag_mode);
            else if (key_is(e, 'q^S')) bind(e, butt_imgv_rl, () => imgv_rotate(e.shiftKey ? -15 : -90));
            else if (key_is(e, 'e^S')) bind(e, butt_imgv_rr, () => imgv_rotate(e.shiftKey ? +15 : +90));
            else if (key_is(e, 'q^a')) fx_click(inputs_imgv, 0) || in_imgv_rot.focus() || e.preventDefault();
            else if (key_is(e, 'F2' )) imgv_pixelated_toggle() || e.preventDefault();
        }
    });
    in_imgv_rot.addEventListener('keydown', e => {
        if (key_is(e, 'Tab') || key_is(e, 'Enter')) {
            fx_click(inputs_imgv, 2);
            imgv_rotate(in_imgv_rot.value - imgv.rotate);
        }
        else if (key_is(e, 'Escape')) {
            fx_click(inputs_imgv, 1);
        }
        else return;
        // leave input field
        in_imgv_rot.blur();
        e.preventDefault();
        e.stopPropagation(); // don't exit imgv
    });
}
//#endregion

//#region COLOR PICKER

let cp = false;

function cp_start() {
    canvas_draw.classList.add('eyedropper');
    cp = true;
    cp_pick_from_canvas();
}
function cp_exit() {
    canvas_draw.classList.remove('eyedropper');
    cp = false;
}
function cp_pick_from_canvas() {
    if (cp) {
        const { x, y } = getCanvasCursorXY();
        const [r, g, b] = cd_ctx.getImageData(x, y, 1, 1).data;
        const hex = ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
        input_color_update(input_cp_txt.value = '#' + hex);
    }
}
function cp_apply_color_and_exit(value) {
    if (cp) {
        cp_apply_color(value);
        cp_exit();
        fx_click(tool_last);
        tool_activate(tool_last);
    }
}
function cp_apply_color(value) {
    color = value;
    cp_color_inputs_update_both(color);
}
function cp_color_inputs_update_both(value) {
    input_color_update(value);
    input_cp_txt.value = value;
}
function input_color_update(value) {
    input_cp_col.value = value;
    input_cp_col.style.setProperty('--color', value);
}
function valid_color(input) {
    const style = new Option().style;
    style.color = input;
    if (style.color !== '') return input;
    return string_to_color(input);
}
function string_to_color(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    const rgb = hash >>> 0;
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b =  rgb        & 0xff;
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function invert_color() {
    let hex = input_cp_col.value.replace('#', '');
    if (hex.length === 3)
        hex = hex.split('').map(c => c + c).join('');
    const r = 255 - parseInt(hex.slice(0, 2), 16);
    const g = 255 - parseInt(hex.slice(2, 4), 16);
    const b = 255 - parseInt(hex.slice(4, 6), 16);
    const inverted = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
    cp_apply_color(inverted)
}
function SETUP_COLOR_PICKER() {
    butt_cp_no.onclick = () => cp_apply_color_and_exit(color);
    butt_inv_col.onclick = invert_color;
    input_cp_col.addEventListener('input',  () => cp_apply_color                (input_cp_col.value));
    input_cp_col.addEventListener('change', () => cp_apply_color_and_exit       (input_cp_col.value));
    input_cp_txt.addEventListener('input',  () => input_color_update(valid_color(input_cp_txt.value)));
    input_cp_txt.addEventListener('keydown', e => {
        if (key_is(e, 'Tab') || key_is(e, 'Enter')) {
            const new_color = valid_color(input_cp_txt.value);
            fx_click(inputs_color, 3);
            cp
                ? cp_apply_color_and_exit(new_color)  // cp -> exit
                : cp_apply_color         (new_color); // drawing/…
        }
        else if (key_is(e, 'Escape')) {
            fx_click(inputs_color, 2);
            cp_apply_color(color); // reset
        }
        else return;
        // leave input field
        input_cp_txt.blur();
        e.preventDefault();
    });
    input_cp_txt.addEventListener('blur', () => cp_apply_color(color)); // reset
    canvas_draw.addEventListener('pointermove', cp_pick_from_canvas);
    canvas_draw.addEventListener('click', () => cp_apply_color_and_exit(input_cp_col.value));
    document.addEventListener('keydown', e => {
        if (anySel()) return;
        if (cp || drawing_enabled) {
            if      (key_is(e, 'c^s')) fx_click(inputs_color, 1) || input_cp_txt.focus() || e.preventDefault();
            else if (key_is(e, 'x^s')) fx_click(inputs_color, 0) || input_cp_col.click();
            else if (key_is(e, 'v'  )) bind(e, butt_inv_col, invert_color);
        }
        if (cp && key_is(e, 'Escape')) cp_apply_color_and_exit(color); // esc -> exit cp
    });
}
//#endregion

//#region DB

const DB_NAME = 'db_agartic', DB_VERSION = 2;

let db;

async function db_open() {
    if    (db) return db;
    return db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = e => {
            const db = request.result;
            if (e.oldVersion === 0) {
                db.createObjectStore('state');
                db.createObjectStore('history');
                console.info('AGARTIC [DB MIGRATION] v0 -> v2');
            }
            if (e.oldVersion === 1) {
                const tx = request.transaction;
                const kv = tx.objectStore('kv');
                const state   = db.createObjectStore('state');
                const history = db.createObjectStore('history');
                const req_his = kv.get('history');
                const req_len = kv.get('history_len');
                req_len.onsuccess = () => state.put(req_len.result ?? 0, 'history_len');
                req_his.onsuccess = () => {
                    const old = req_his.result ?? [];
                    for (let i = 0; i < old.length; i++)
                        history.put(old[i], i);
                };
                db.deleteObjectStore('kv');
                console.info('AGARTIC [DB MIGRATION] v1 -> v2');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => reject (request.error);
    });
}
async function db_get(store, key) {
    const db = await db_open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => reject (request.error);
    });
}
async function db_set(store, key, value) {
    const db = await db_open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const request = tx.objectStore(store).put(value, key);
        request.onsuccess = () => resolve();
        request.onerror   = () => reject (request.error);
    });
}
//#endregion

//#region DEBUG

const ci_ctx = canvas_info.getContext('2d');
const debug_points = [];

let DEBUG = false;

function debug_point_push(p, color) {
    debug_points.push({p, color});
}
function debug_point_at(p, color) {
    ci_ctx.fillStyle = color;
    ci_ctx.beginPath();
    ci_ctx.arc(p.x, p.y, 15 / 2, 0, 2 * Math.PI);
    ci_ctx.fill();
}
//#endregion

//#region HACKS

const mouse = { x: 0, y: 0 };

function SETUP_HOOKS_PRE() {
    window.w = window.innerWidth;
    window.h = window.innerHeight;
    window.addEventListener('pointerenter', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { capture: true });
    window.addEventListener('pointermove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { capture: true });
    panel_main.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel_aux .addEventListener('pointerdown', (e) => e.stopPropagation());
}
function SETUP_HOOKS_POST() {
    window.addEventListener('resize', () => {
        window.w = window.innerWidth;
        window.h = window.innerHeight;
    });
    document.addEventListener('keydown', e => {
        // remove selection on Esc
        if (key_is(e, 'Escape') && anySel()) {
            const sel = window.getSelection();
            if   (sel && !sel.isCollapsed)
                return sel.removeAllRanges();
            const el = document.activeElement;
            if   (el_is_text_input(el))
                return el.selectionStart = el.selectionEnd = 0;
        }
        // prevent phantom selection on Ctrl+A
        if (key_is(e, 'a^c') && !anySel()) {
            e.preventDefault();
        }
    });
}
//#endregion

//#region UTILS

/** Shortcut syntax: <key>[^mods].
 * <br/> [cas] - required mods (Ctrl, Alt, Shift).
 * <br/> [CAS] -  allowed mods (Ctrl, Alt, Shift).
 */
function key_is(e, shortcut) {
    let [key, mods] = shortcut.split('^');
    if (key.length === 1) {
        const c = key.charCodeAt(0);
        if   (c >= 97 && c <= 122)
            key = 'Key' + String.fromCharCode(c - 32);
    }
    mods ??= '';
    return (e.code === key || key.length === 1 && e.key === key)
           && (mods.includes('C') || e. ctrlKey === mods.includes('c'))
           && (mods.includes('S') || e.shiftKey === mods.includes('s'))
           && (mods.includes('A') || e.  altKey === mods.includes('a'));
}
/** Usage: <pre>if (key_is(e, 's^c')) bind(e, butt_save, save);</pre> */
function bind(e, butt, logic) {
    e.preventDefault();
    fx_click(butt);
    logic();
}
function fx_click(butt, index) {
    const kbd = butt.getElementsByTagName('kbd')[index ?? 0];
    temp_fx(kbd, 'fx-clicked', 100);
}
function temp_fx(el, css_class, time) {
    el.classList.add(css_class);
    setTimeout(() => el.classList.remove(css_class), time);
}
function input_active(el) {
    return document.activeElement === el && el.matches(':focus-visible');
}
function setup_yn_toggle(el_input, el_inputs, index) {
    el_input.addEventListener('focus', () => yn_toggle_active(el_inputs, true,  index));
    el_input.addEventListener('blur',  () => yn_toggle_active(el_inputs, false, index));
}
function yn_toggle_active(el_inputs, b, index) {
    const yn = el_inputs.getElementsByTagName('kbd');
    index ??= 0;
    yn[index + 1].classList.toggle('active', b);
    yn[index + 2].classList.toggle('active', b);
}

/** Check if anything is selected OR if any text input field is active. */
function anySel() {
    return !window.getSelection()?.isCollapsed || anyInp();
}
/** Check if any text input field is active. */
function anyInp() {
    return el_is_text_input(document.activeElement);
}
function el_is_text_input(el) {
    return  el && (
            el.isContentEditable
        ||  el.tagName === 'TEXTAREA'
        || (el.tagName === 'INPUT' && text_input_types.has(el.type)));
}
const text_input_types = new Set(['text', 'number']);

function math_clamp(min, max, value) {
    return Math.max(min, Math.min(max, value));
}
function math_rad_from_deg(deg) {
    return deg / 180 * Math.PI;
}
function math_rotate_point(p, pivot, rad) {
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = pivot.x + dx * cos + dy * sin;
    const y = pivot.y - dx * sin + dy * cos;
    return { x, y };
}

function Vek2(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
}
function Size(w, h) {
    this.w = w ?? 0;
    this.h = h ?? 0;
}
function Rekt(x, y, w, h) {
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.w = w ?? 0;
    this.h = h ?? 0;
}
//#endregion

//#region INIT
SETUP_HOOKS_PRE();
{
    SETUP_HISTORY_SYNC();
    SETUP_HISTORY_CTL();
    SETUP_TOOLS();
    SETUP_CW();
    SETUP_CW_DRAG();
    SETUP_CW_ZOOM();
    SETUP_DRAWING();
    SETUP_BRUSH_CURSOR();
    SETUP_IMAGE_SAVE();
    SETUP_IMAGE_COPY();
    SETUP_IMAGE_PASTE();
    SETUP_IMAGE_PLACING();
    SETUP_COLOR_PICKER();
}
SETUP_HOOKS_POST();
{
    cw_init_size();
    cp_color_inputs_update_both(color);
    set_thickness(2);
    history_load();
}
//#endregion

// ← line count