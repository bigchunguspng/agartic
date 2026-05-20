'use strict';

// region ELEMENTS

const vp            = document.getElementById('viewport');
const cw            = document.getElementById('canvas-wrapper');
const canvas_draw   = document.getElementById('canvas-draw');
const canvas_over   = document.getElementById('canvas-over');
const imgv_wrapper  = document.getElementById('imgv-wrapper');
const imgv_sel      = document.getElementById('imgv_sel');
const handle_tl     = document.getElementById('handle_tl');
const handle_tr     = document.getElementById('handle_tr');
const handle_bl     = document.getElementById('handle_bl');
const handle_br     = document.getElementById('handle_br');

const panel_main    = document.getElementById('panel-main');
const panel_aux     = document.getElementById('panel-aux');

const butt_zoom_1   = document.getElementById('button_zoom_1');
const butt_zoom_2   = document.getElementById('button_zoom_2');
const butt_zoom_in  = document.getElementById('button_zoom_in');
const butt_zoom_out = document.getElementById('button_zoom_out');

const tool_pick     = document.getElementById('tool_pick');
const tool_drag     = document.getElementById('tool_drag');
const tool_draw     = document.getElementById('tool_draw');
const tool_rect     = document.getElementById('tool_rect');
const tool_laso     = document.getElementById('tool_laso');
const tool_imgv     = document.getElementById('tool_imgv');

const butt_undo     = document.getElementById('button_undo');
const butt_redo     = document.getElementById('button_redo');
const butt_copy     = document.getElementById('button_copy');
const butt_paste    = document.getElementById('button_paste');
const butt_save     = document.getElementById('button_save');
const butt_nuke     = document.getElementById('button_nuke');

const butt_bs_less  = document.getElementById('button_thickness_less');
const butt_bs_more  = document.getElementById('button_thickness_more');

const butt_ok_imgv  = document.getElementById('button_ok_imgv');
const butt_no_imgv  = document.getElementById('button_no_imgv');
const butt_no_cp    = document.getElementById('button_no_cp');
const butt_s1_imgv  = document.getElementById('button_zoom_1_imgv');
const butt_s2_imgv  = document.getElementById('button_zoom_2_imgv');
const butt_vf_imgv  = document.getElementById('button_vflip_imgv');
const butt_hf_imgv  = document.getElementById('button_hflip_imgv');

const brush_cursor  = document.getElementById('brush_cursor');
const in_thickness  = document.getElementById('input_thickness');
const cp_input_col  = document.getElementById('input_cp_col');
const cp_input_txt  = document.getElementById('input_cp_txt');

const tips_imgv     = document.getElementById('tips_imgv');
const tips_draw     = document.getElementById('tips_draw');
const tips_bs       = document.getElementById('tips_bs');
const brush_inputs  = document.getElementById('brush_inputs');
const color_inputs  = document.getElementById('color_inputs');

// endregion

// region TOOLS

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

function getCanvasCursorXY() {
    const x = Math.floor((mouse.x - cw_x) / cw_scale);
    const y = Math.floor((mouse.y - cw_y) / cw_scale);
    return { x, y };
}

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
    cw_scale = Math.max(MIN_CW_SCALE, Math.min(MAX_CW_SCALE, cw_scale * factor));
    cw_x = x - cw_true_x * cw_scale;
    cw_y = y - cw_true_y * cw_scale;
    cw_transform();
}
function cw_setup_size() {
    canvas_draw.width  = cw_true_w;
    canvas_draw.height = cw_true_h;
    canvas_over.width  = cw_true_w;
    canvas_over.height = cw_true_h;
}
function SETUP_CW_ZOOM() {
    vp.addEventListener('wheel', e => {
        e.preventDefault();
        if (document.activeElement === in_thickness && in_thickness.matches(':focus-visible')) {
            e.deltaY > 0 ? thickness_less(e) : thickness_more(e);
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
    });
    window.addEventListener('resize', () => {
        // keep canvas position relative to center
        cw_x -= (window.w - window.innerWidth)  / 2;
        cw_y -= (window.h - window.innerHeight) / 2;
        cw_transform();
    });
    butt_zoom_1   .addEventListener('click', cw_resize_true_scale);
    butt_zoom_2   .addEventListener('click', cw_resize_fit_screen);
    butt_zoom_in  .addEventListener('click', e => cw_zoom(e, false, true));
    butt_zoom_out .addEventListener('click', e => cw_zoom(e, true, true));
}
// endregion

// region CANVAS DRAG

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
// endregion

// region HISTORY

const history_channel = new BroadcastChannel('history_sync');

let history = [], history_len = 0;

async function history_load() {
    history     = await db_get('history')     ?? [];
    history_len = await db_get('history_len') ?? 0;
    history_draw();
}
async function history_save() {
    await db_set('history',     history);
    await db_set('history_len', history_len);
    history_channel.postMessage({ key: 'history',     value: history     });
    history_channel.postMessage({ key: 'history_len', value: history_len });
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
        cd_apply_history_pen(item.pen, item.path);
    }
}
function history_write(item) {
    history[history_len++] = item;
    history.length = history_len;
    history_save();
}
function history_undo() {
    if (imgv) return placing_image_exit();
    if (history_len) {
        history_len--;
        history_draw();
        history_save();
    }
}
function history_redo() {
    if (history_len < history.length) {
        history_len++;
        history_draw();
        history_save();
    }
}
function history_clear() {
    if (confirm('😳 NUKE THE WHOLE THING!?')) {
        history = [];
        history_len = 0;
        cd_clear();
        history_save();
    }
}
function SETUP_HISTORY_SYNC() {
    history_channel.onmessage = (e) => {
        const { key, value } = e.data;
        if      (key === 'history')     history     = value;
        else if (key === 'history_len') history_len = value;
        else return;
        history_draw();
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
// endregion

// region DRAWING

const cd_ctx = canvas_draw.getContext('2d', { willReadFrequently: true });

let drawing_enabled = false;
let drawing_now     = false;
let pen_path = [];
let pen;
let color = 'black';
let thickness;

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
    if (drawing_enabled && !drawing_now) {
        drawing_now = true;
        pen = { color, size: thickness };
        pen_path = [];
        pen_path.push(getCanvasCursorXY());
    }
}
function drawing_draw() {
    if (drawing_enabled && drawing_now) {
        const prev = pen_path[pen_path.length - 1];
        const curr = getCanvasCursorXY();
        pen_path.push(curr);
        cd_draw_segment(prev.x, prev.y, curr.x, curr.y, pen);
    }
}
function drawing_stop() {
    if (drawing_now) {
        drawing_now = false;
        if (pen_path.length === 1) {
            const p = getCanvasCursorXY();
            cd_draw_dot(p.x, p.y, pen);
        }
        history_write({ type: 0, pen, path: pen_path });
    }
}

function cd_clear() {
    cd_ctx.fillStyle = 'white';
    cd_ctx.fillRect(0, 0, canvas_draw.width, canvas_draw.height);
}
function cd_draw_segment(x1, y1, x2, y2, pen) {
    cd_ctx.globalCompositeOperation  = 'source-over'; // todo experiment with values
    cd_ctx.lineJoin = cd_ctx.lineCap = 'round';
    cd_ctx.strokeStyle = pen.color;
    cd_ctx.lineWidth   = pen.size;
    cd_ctx.beginPath();
    cd_ctx.moveTo(x1, y1); // todo optimize?
    cd_ctx.lineTo(x2, y2);
    cd_ctx.stroke();
}
function cd_draw_dot(x, y, pen) {
    cd_ctx.fillStyle = pen.color;
    cd_ctx.beginPath();
    cd_ctx.arc(x, y, pen.size / 2, 0, 2 * Math.PI);
    cd_ctx.fill();
}
function cd_draw_pasted_image(e, paste_another_img) {
    imgv_draw_image(cd_ctx);
    if (!paste_another_img) placing_image_exit();

    history_write({ type: 1, data: canvas_draw.toDataURL('image/webp', 0.95) });
}
function cd_apply_history_pen(pen, path) {
    if (path.length > 1) {
        let prev = path[0];
        for (let i = 1; i < path.length; i++) {
            const curr = path[i];
            cd_draw_segment(prev.x, prev.y, curr.x, curr.y, pen);
            prev = curr;
        }
    }
    else {
        const p = path[0];
        cd_draw_dot(p.x, p.y, pen);
    }
}
function cd_apply_history_img(data) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = data;
    }).then(img => { cd_ctx.drawImage(img, 0, 0); });
}
function set_thickness(value) {
    thickness = Math.min(Math.max(value, 1), 999);
    in_thickness.value = thickness;
    if (brush_cursor.style.display !== 'none')
        brush_cursor_RENDER();
}
function thickness_less(e) { set_thickness(e.shiftKey ? Math.floor(thickness / 1.5) : thickness - 1); }
function thickness_more(e) { set_thickness(e.shiftKey ? Math.ceil (thickness * 1.5) : thickness + 1); }
function brush_cursor_RENDER() {
    const cc = getCanvasCursorXY();
    const style  = brush_cursor.style;
    style.width  = `${Math.round(thickness * cw_scale)}px`;
    style.height = `${Math.round(thickness * cw_scale)}px`;
    style.left = `${Math.round(cw_x + cc.x * cw_scale)}px`;
    style.top  = `${Math.round(cw_y + cc.y * cw_scale)}px`;
    brush_cursor.style.borderColor = brush_cursor_get_color();
}
function brush_cursor_get_color() {
    const { x, y } = getCanvasCursorXY();
    if (thickness >= 10) {
        const o = 0.5 * thickness * 0.7071067811865476;
        const r = 0.5 * thickness;
        const c = [
            cd_lightness_at(x + o, y + o),
            cd_lightness_at(x + o, y - o),
            cd_lightness_at(x - o, y + o),
            cd_lightness_at(x - o, y - o),
            cd_lightness_at(x, y + r),
            cd_lightness_at(x, y - r),
            cd_lightness_at(x + r, y),
            cd_lightness_at(x - r, y),
        ];
        const min = Math.min(...c);
        const max = Math.max(...c);
        const avg = c.reduce((acc, val) => acc + val, 0) / c.length;
        const v = 255 - avg;
        const  range = max - min;
        return range > 160 ? `rgb(${v},${v},${v})` : avg < 127 ? 'white' : 'black';
    }
    else
        return cd_lightness_at(x, y) < 120 ? 'white' : 'black';
}
function cd_lightness_at(x, y) {
    const [r, g, b, a] = cd_ctx.getImageData(x, y, 1, 1).data;
    return a > 0 ? 0.2126 * r + 0.7152 * g + 0.0722 * b : 255;
}
function SETUP_DRAWING() {
    butt_bs_less.onclick = thickness_less;
    butt_bs_more.onclick = thickness_more;
    canvas_draw.addEventListener('pointerdown', drawing_start);
    document.addEventListener('pointermove',    drawing_draw);
    document.addEventListener('pointerup',      drawing_stop);
    document.addEventListener('keydown', e => {
        if (!drawing_enabled || anyInp()) return;
        if      (key_is(e, 'w^S')) bind(e, butt_bs_more, () => thickness_more(e));
        else if (key_is(e, 's^S')) bind(e, butt_bs_less, () => thickness_less(e));
        else if (key_is(e, 'z^s')) fx_click(brush_inputs, 0) || in_thickness.focus() || e.preventDefault();
    });
    in_thickness.addEventListener('focus', () => {
        tips_bs.classList.remove('hide');
        tips_draw.classList.add('move');
    });
    in_thickness.addEventListener('blur', () => {
        tips_bs.classList.add('hide');
        tips_draw.classList.remove('move');
    });
    in_thickness.addEventListener('keydown', e => {
        if (key_is(e, 'Tab') || key_is(e, 'Enter')) {
            fx_click(brush_inputs, 2);
            set_thickness(in_thickness.value);
        }
        else if (key_is(e, 'Escape')) {
            fx_click(brush_inputs, 1);
            in_thickness.value = thickness;
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
// endregion

// region IMAGE SAVE
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
// endregion

// region IMAGE COPY
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
// endregion

// region IMAGE PASTE
function image_paste(e) {
    const items = Array.from(e.clipboardData?.items);
    const item  = items.find(i => i.type.startsWith('image'));
    if   (item) loadPastedImage(item.getAsFile());
}
function image_paste_button() {
    navigator.clipboard.read().then(items => {
        const item  = items.find(i => i.types.some(t => t.startsWith('image')));
        if   (item) {
            const type = item.types.find(t => t.startsWith('image'));
            item.getType(type).then(blob => loadPastedImage(blob));
        }
    });
}
function loadPastedImage(blob) {
    if (imgv) cd_draw_pasted_image(null, true);

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        placing_image_start(img);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}
function SETUP_IMAGE_PASTE() {
    butt_paste  .onclick = image_paste_button;
    butt_ok_imgv.onclick = cd_draw_pasted_image;
    butt_no_imgv.onclick = placing_image_exit;
    document.addEventListener('paste', function (e) {
        if (!anyInp()) fx_click(butt_paste) || image_paste(e);
    });
    document.addEventListener('keydown', e => {
        if (imgv && !anySel()) {
            if      (key_is(e, 'Enter' )) cd_draw_pasted_image();
            else if (key_is(e, 'Tab'   )) cd_draw_pasted_image();
            else if (key_is(e, 'Space' )) cd_draw_pasted_image();
            else if (key_is(e, 'Escape')) placing_image_exit();
        }
    });
}
// endregion

// region PLACING IMAGE

const MIN_IMG_SIZE = 10;

const co_ctx = canvas_over.getContext('2d');

const class_from_handle = new Map();
{
    class_from_handle.set(handle_tl, 'resizing-tl');
    class_from_handle.set(handle_tr, 'resizing-tr');
    class_from_handle.set(handle_bl, 'resizing-bl');
    class_from_handle.set(handle_br, 'resizing-br');
}

let imgv = null;

function placing_image_start(img) {
    imgv = {
        img: img,
        x: 0,
        y: 0,
        drag_x: 0,
        drag_y: 0, // cursor to pasted image 0,0
        w:     img.width,
        h:     img.height,
        w_og:  img.width,
        h_og:  img.height,
        ratio: img.width / img.height,
        hflip: false,
        vflip: false,
        grabbed_handle: null,
        is_dragging: false,
        is_resizing: false,
        mod_keep_ratio:     false, // shift
        mod_drag_by_handle: false, //  ctrl
        mod_drag_canvas:    false, //   alt
        mod_resize_centered: () => imgv.mod_drag_canvas,
    };
    tool_activate(tool_imgv);
    placing_image_RENDER();
    tips_imgv   .classList.remove('hide');
    imgv_wrapper.classList.remove('hide');
    vp.classList.add('img-draggable');
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
    imgv_sel.style.left   = `${imgv.x}px`;
    imgv_sel.style.top    = `${imgv.y}px`;
    imgv_sel.style.width  = `${imgv.w}px`;
    imgv_sel.style.height = `${imgv.h}px`;
}
function imgv_draw_image(ctx) {
    const { img, x, y, w, h, hflip, vflip } = imgv;
    if (vflip || hflip) {
        ctx.setTransform(
            hflip ? -1 : 1, 0, 0,
            vflip ? -1 : 1,
            hflip ? x + w : x,
            vflip ? y + h : y
        );
        ctx.drawImage(img, 0, 0, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    else
        ctx.drawImage(img, x, y, w, h);
}
function imgv_interaction_start(e) {
    if (imgv) {
        if (imgv.grabbed_handle = e.target.closest('.handle')) {
            imgv.is_resizing = true;
            vp.classList.add(class_from_handle.get(imgv.grabbed_handle));
        }
        else if (imgv.mod_drag_canvas) {
            cw_drag_enable();
            cw_drag_start();
        }
        else { // image drag
            imgv.is_dragging = true;
            vp.classList.add('img-dragging');
            const cc = getCanvasCursorXY();
            imgv.drag_x = cc.x - imgv.x;
            imgv.drag_y = cc.y - imgv.y;
        }
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
                const cc = getCanvasCursorXY();
                imgv.drag_x = cc.x - imgv.x;
                imgv.drag_y = cc.y - imgv.y;
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
        imgv_interact(); // todo or call simplified version imgv_update()
    }
}
function imgv_interact() {
    if (!imgv) return;

    const cc = getCanvasCursorXY();

    if (imgv.is_dragging) {
        if (imgv.mod_drag_canvas) {
            cw_drag();
        }
        else { // drag image
            imgv.x = cc.x - imgv.drag_x;
            imgv.y = cc.y - imgv.drag_y;
        }
    }
    else if (imgv.is_resizing) {
        if (imgv.mod_drag_by_handle) {
            imgv.x = cc.x - imgv.drag_x;
            imgv.y = cc.y - imgv.drag_y;
        }
        const  og = { x: imgv.x, y: imgv.y, w: imgv.w, h: imgv.h };
        const   g = imgv.grabbed_handle.classList;
        let w = g.contains('l') ? og.w + (og.x - cc.x) : cc.x - og.x;
        let h = g.contains('t') ? og.h + (og.y - cc.y) : cc.y - og.y;
        w = Math.max(w, MIN_IMG_SIZE);
        h = Math.max(h, MIN_IMG_SIZE);
        if (imgv.mod_keep_ratio) {
            if (w / h > imgv.ratio) {
                w = Math.max(h * imgv.ratio, MIN_IMG_SIZE);
                h = w / imgv.ratio;
            }
            else {
                h = Math.max(w / imgv.ratio, MIN_IMG_SIZE);
                w = h * imgv.ratio;
            }
        }
        const    c = imgv.mod_resize_centered();
        imgv.x = c ? og.x + (og.w - w) / 2 : g.contains('l') ? og.x + og.w - w : og.x;
        imgv.y = c ? og.y + (og.h - h) / 2 : g.contains('t') ? og.y + og.h - h : og.y;
        imgv.w = w;
        imgv.h = h;
    }
    else return;
    placing_image_RENDER();
}
function imgv_interaction_stop() {
    if (imgv) {
        const resizing_class = class_from_handle.get(imgv.grabbed_handle);
        imgv.is_dragging = false;
        imgv.is_resizing = false;
        imgv.grabbed_handle = null;
        vp.classList.remove('img-dragging');
        vp.classList.remove(resizing_class);
        if (imgv.mod_drag_canvas) cw_drag_disable();
    }
}
function imgv_resize_true_scale() {
    imgv.x = imgv.x - Math.floor((imgv.w_og - imgv.w) / 2);
    imgv.y = imgv.y - Math.floor((imgv.h_og - imgv.h) / 2);
    imgv.w = imgv.w_og;
    imgv.h = imgv.h_og;
    placing_image_RENDER();
}
function imgv_resize_stretch() {
    imgv.x = 0;
    imgv.y = 0;
    imgv.w = canvas_draw.width;
    imgv.h = canvas_draw.height;
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
function SETUP_IMAGE_PLACING() {
    butt_s1_imgv.onclick = imgv_resize_true_scale;
    butt_s2_imgv.onclick = imgv_resize_stretch;
    butt_vf_imgv.onclick = imgv_vflip;
    butt_hf_imgv.onclick = imgv_hflip;
    document.addEventListener('pointerdown', imgv_interaction_start);
    document.addEventListener('pointermove', imgv_interact);
    document.addEventListener('pointerup',   imgv_interaction_stop);
    document.addEventListener('keydown',     imgv_interaction_apply_mods);
    document.addEventListener('keyup',       imgv_interaction_apply_mods);
    document.addEventListener('keydown', e => {
        if (imgv) {
            if      (key_is(e, '1^a')) bind(e, butt_s1_imgv, imgv_resize_true_scale);
            else if (key_is(e, '2^a')) bind(e, butt_s2_imgv, imgv_resize_stretch);
            else if (key_is(e, 'w'  )) bind(e, butt_vf_imgv, imgv_vflip);
            else if (key_is(e, 'd'  )) bind(e, butt_hf_imgv, imgv_hflip);
        }
    });
}
// endregion

// region COLOR PICKER

let cp = false;

function cp_start() {
    canvas_draw.classList.add('eyedropper');
    cp = true;
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
        input_color_update(cp_input_txt.value = '#' + hex);
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
    cp_input_txt.value = value;
}
function input_color_update(value) {
    cp_input_col.value = value;
    cp_input_col.style.setProperty('--color', value);
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
function SETUP_COLOR_PICKER() {
    butt_no_cp.onclick = () => cp_apply_color_and_exit(color);
    cp_input_col.addEventListener('input',  () => cp_apply_color                (cp_input_col.value));
    cp_input_col.addEventListener('change', () => cp_apply_color_and_exit       (cp_input_col.value));
    cp_input_txt.addEventListener('input',  () => input_color_update(valid_color(cp_input_txt.value)));
    cp_input_txt.addEventListener('keydown', e => {
        if (key_is(e, 'Tab') || key_is(e, 'Enter')) {
            const new_color = valid_color(cp_input_txt.value);
            fx_click(color_inputs, 3);
            cp
                ? cp_apply_color_and_exit(new_color)  // cp -> exit
                : cp_apply_color         (new_color); // drawing/…
        }
        else if (key_is(e, 'Escape')) {
            fx_click(color_inputs, 2);
            cp_apply_color(color); // reset
        }
        else return;
        // leave input field
        cp_input_txt.blur();
        e.preventDefault();
    });
    cp_input_txt.addEventListener('blur', () => cp_apply_color(color)); // reset
    canvas_draw.addEventListener('pointermove', cp_pick_from_canvas);
    canvas_draw.addEventListener('click', () => cp_apply_color_and_exit(cp_input_col.value));
    document.addEventListener('keydown', e => {
        if (anySel()) return;
        if (cp || drawing_enabled) {
            if      (key_is(e, 'c^s')) fx_click(color_inputs, 1) || cp_input_txt.focus() || e.preventDefault();
            else if (key_is(e, 'x^s')) fx_click(color_inputs, 0) || cp_input_col.click();
        }
        if (cp && key_is(e, 'Escape')) cp_apply_color_and_exit(color); // esc -> exit cp
    });
}
// endregion

// region DB

const DB_NAME = 'db_agartic', DB_VERSION = 1, DB_STORE_NAME = 'kv';

function db_open() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = e => {
            const db = request.result;
            switch (e.oldVersion) {
                case 0:
                    db.createObjectStore(DB_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => reject (request.error);
    });
}
function db_get(key) {
    return db_open().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE_NAME, 'readonly');
            const request = tx.objectStore(DB_STORE_NAME).get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror   = () => reject (request.error);
        });
    });
}
function db_set(key, value) {
    return db_open().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE_NAME, 'readwrite');
            const request = tx.objectStore(DB_STORE_NAME).put(value, key);
            request.onsuccess = () => resolve();
            request.onerror   = () => reject (request.error);
        });
    });
}
// endregion

// region HACKS

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
// endregion

// region UTILS

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
// endregion

// region INIT
SETUP_HOOKS_PRE();
{
    SETUP_HISTORY_SYNC();
    SETUP_HISTORY_CTL();
    SETUP_TOOLS();
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
    cw_setup_size();
    cw_resize_true_scale();
    cp_color_inputs_update_both(color);
    set_thickness(3);
    history_load();
}
// endregion