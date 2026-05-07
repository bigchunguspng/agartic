"use strict";

// region ELEMENTS

const vp            = document.getElementById("viewport");
const cw            = document.getElementById("canvas-wrapper");
const canvas_draw   = document.getElementById('canvas-draw');
const canvas_over   = document.getElementById('canvas-over');

const panel_main    = document.getElementById("panel-main");
const panel_aux     = document.getElementById("panel-aux");

const butt_zoom_1   = document.getElementById("button_zoom_1");
const butt_zoom_2   = document.getElementById("button_zoom_2");
const butt_zoom_in  = document.getElementById("button_zoom_in");
const butt_zoom_out = document.getElementById("button_zoom_out");

const tool_pick     = document.getElementById("tool_pick");
const tool_drag     = document.getElementById("tool_drag");
const tool_draw     = document.getElementById("tool_draw");
const tool_rect     = document.getElementById("tool_rect");
const tool_laso     = document.getElementById("tool_laso");
const tool_imgv     = document.getElementById('tool_imgv');

const butt_undo     = document.getElementById('button_undo');
const butt_redo     = document.getElementById('button_redo');
const butt_copy     = document.getElementById('button_copy');
const butt_paste    = document.getElementById('button_paste');
const butt_save     = document.getElementById('button_save');
const butt_delete   = document.getElementById('button_delete');

const butt_bs_less  = document.getElementById('button_thickness_less');
const butt_bs_more  = document.getElementById('button_thickness_more');

const butt_imgv_ok  = document.getElementById('okButton');
const butt_imgv_no  = document.getElementById('cancelButton');

const brush_cursor  = document.getElementById('brush_cursor');
const out_thickness = document.getElementById('out_thickness');

// endregion

// region TOOLS

const tools = [tool_pick, tool_drag, tool_draw, tool_rect, tool_laso, tool_imgv];
const panel_aux_items = Array.from(panel_aux.children);

let tool_active, tool_last;

function tool_activate(tool) {
    if      (tool_active === tool_drag) cw_drag_disable();
    else if (tool_active === tool_draw) drawing_disable();

    tools.forEach(x => x.classList.remove("active"));
    tool.classList.add('active');
    tool_last = tool_active;
    tool_active = tool;
    panel_aux_items.forEach(x => x.classList.toggle('hide', !x.classList.contains(tool.id)));

    if      (tool_active === tool_drag) cw_drag_enable();
    else if (tool_active === tool_draw) drawing_enable();
}
function SETUP_TOOLS() {
    tool_activate(tool_draw);
    panel_main.addEventListener("click", e => {
        const tool = tools.find(x => x.contains(e.target));
        if (tool) tool_activate(tool);
    });
    window.addEventListener("keydown", e => {
        if (e.ctrlKey || e.altKey || e.shiftKey) return;
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
    cw.style.transform = `translate(${Math.floor(cw_x)}px, ${Math.floor(cw_y)}px) scale(${cw_scale})`;
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
            else if (e.key === '2') {
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
    butt_zoom_1   .addEventListener("click", _ => cw_resize_true_scale());
    butt_zoom_2   .addEventListener("click", _ => cw_resize_fit_screen());
    butt_zoom_in  .addEventListener("click", e => cw_zoom(e, false, true));
    butt_zoom_out .addEventListener("click", e => cw_zoom(e, true, true));
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
    vp.classList.add("draggable");
    cw_draggable = true;
}
function cw_drag_disable() {
    vp.classList.remove("draggable");
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

let history_past   = [];
let history_future = [];

function history_load() {
    console.log('fetchAndDrawHistory');
    history_past   = JSON.parse(localStorage.getItem('history_past'))   ?? [];
    history_future = JSON.parse(localStorage.getItem('history_future')) ?? [];
    history_draw();
}
function history_save() {
    localStorage.setItem('history_past',   JSON.stringify(history_past));
    localStorage.setItem('history_future', JSON.stringify(history_future));
}
function history_draw() {
    console.log('drawHistory');
    const i_last_image = history_past.findLastIndex(x => x.type === 1);
    if   (i_last_image < 0) {
        cd_clear();
        history_draw_pen_from(i_last_image + 1);
    }
    else // start from the last image to avoid blinking
        cd_apply_history_img(history_past[i_last_image].data).then(_ => history_draw_pen_from(i_last_image + 1));
}
function history_draw_pen_from(offset) {
    for (let i = offset; i < history_past.length; i++) {
        const item = history_past[i];
        cd_apply_history_pen(item.pen, item.path);
    }
}
function history_write(item) {
    console.log('historyPush');
    history_past.push(item);
    history_future = [];
    history_save();
}
function history_undo() {
    console.log('undo');
    if (imgv) return placing_image_exit();
    if (history_past.length) {
        history_future.push(history_past.pop());
        history_draw();
        history_save();
    }
}
function history_redo() {
    console.log('redo');
    if (history_future.length) {
        history_past.push(history_future.pop());
        history_draw();
        history_save();
    }
}
function history_clear() {
    history_past   = [];
    history_future = [];
    cd_clear();
    history_save();
}
function SETUP_HISTORY_SYNC() {
    window.addEventListener('storage', (e) => {
        if      (e.key === 'history_past') {
            history_past   = JSON.parse(e.newValue);
            history_draw();
        }
        else if (e.key === "history_future")
            history_future = JSON.parse(e.newValue);
    });
}
function SETUP_HISTORY_CTL() {
    butt_undo.onclick = history_undo;
    butt_redo.onclick = history_redo;
    butt_delete.onclick = history_clear;
    document.addEventListener('keydown', function (e) {
        console.log('document.keydown');
        if      (e.ctrlKey && !e.shiftKey && !e.altKey) {
            if      (e.code === 'KeyY') e.preventDefault() || history_redo();
            else if (e.code === 'KeyZ') e.preventDefault() || history_undo();
            else if (e.code === "KeyD") e.preventDefault() || history_clear();
        }
        else if (e.ctrlKey &&  e.shiftKey && !e.altKey) {
            if      (e.code === 'KeyZ') e.preventDefault() || history_redo();
        }
    });
}
// endregion

// region DRAWING

const cd_ctx = canvas_draw.getContext('2d');

let drawing_enabled = false;
let drawing_now     = false;
let pen_path = [];
let pen;
let color = "black";
let thickness;

function drawing_enable() {
    brush_cursor.classList.add('drawing');
    canvas_draw.classList.add('drawing');
    drawing_enabled = true;
}
function drawing_disable() {
    brush_cursor.classList.remove('drawing');
    canvas_draw.classList.remove('drawing');
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
    console.log('clearCanvas');
    cd_ctx.fillStyle = "white";
    cd_ctx.fillRect(0, 0, canvas_draw.width, canvas_draw.height);
}
function cd_draw_segment(x1, y1, x2, y2, pen) {
    console.log('drawCanvas');
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
function cd_draw_pasted_image() {
    console.log('drawPastedImage');
    const { img, x, y, w, h } = imgv;
    cd_ctx.drawImage(img, x, y, w, h);
    const data = canvas_draw.toDataURL("image/webp", 0.95);

    placing_image_exit();
    history_write({ type: 1, data });
}
function cd_apply_history_pen(pen, path) {
    console.log('applyPenDrawing');
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
    console.log('drawImage');
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = data;
    }).then(img => { cd_ctx.drawImage(img, 0, 0); });
}
function set_thickness(value) {
    console.log('setThickness');
    thickness = Math.min(Math.max(value, 1), 999);
    out_thickness.innerText = thickness;
    const style = brush_cursor.style;
    if   (style.display !== 'none') {
        const x = parseFloat(style.left);
        const y = parseFloat(style.top);
        const r = parseFloat(style.width);
        brush_cursor_move_and_resize(x, y, r);
    }
}
function thickness_less(e) { set_thickness(e.shiftKey ? Math.floor(thickness / 1.5) : thickness - 1); }
function thickness_more(e) { set_thickness(e.shiftKey ? Math.ceil (thickness * 1.5) : thickness + 1); }
function brush_cursor_move_and_resize(x, y, r) {
    const difference = (r - thickness) / 2;
    const style  = brush_cursor.style;
    style.width  = `${thickness}px`;
    style.height = `${thickness}px`;
    style.left = `${x + difference}px`;
    style.top  = `${y + difference}px`;
}
function SETUP_DRAWING() {
    butt_bs_less.onclick = thickness_less;
    butt_bs_more.onclick = thickness_more;
    canvas_draw.addEventListener('mousedown', e => {
        console.log('canvasA.mousedown SETUP_DRAWING');
        drawing_start();
    });
    document.addEventListener('mousemove', e => {
        console.log('document.mousemove SETUP_DRAWING');
        drawing_draw();
    });
    document.addEventListener('mouseup', e => {
        console.log('document.mouseup SETUP_DRAWING');
        drawing_stop();
    });
    document.addEventListener('keydown', e => {
        if (!drawing_enabled || e.ctrlKey || e.altKey) return;
        if      (e.code === 'KeyW') thickness_more(e);
        else if (e.code === 'KeyS') thickness_less(e);
    });
}
function SETUP_BRUSH_CURSOR() {
    canvas_draw.addEventListener('mouseenter', () => {
        console.log('canvasA.mouseenter CURSOR');
        brush_cursor.classList.add('on-canvas');
        brush_cursor_move_and_resize(mouse.x, mouse.y, 0);
    });
    canvas_draw.addEventListener('mouseleave', () => {
        console.log('canvasA.mouseleave CURSOR');
        brush_cursor.classList.remove('on-canvas');
    });
    canvas_draw.addEventListener('mousemove', e => {
        console.log('canvasA.mousemove CURSOR');
        const { x, y } = getCanvasCursorXY();
        const [r, g, b, a] = cd_ctx.getImageData(x, y, 1, 1).data;
        brush_cursor_move_and_resize(e.pageX, e.pageY, 0);
        brush_cursor.style.borderColor = (a > 0 && r + g + b < 480) ? 'white' : 'black';
        // ^ todo thickness > 10 && take 4 more samples && some are dark and some are light - make gray (add it to move and resize func)
    });
}
// endregion

// region ...
function cw_setup_size() {
    canvas_draw.width = 1280;
    canvas_draw.height = 720;
    canvas_over.width = 1280;
    canvas_over.height = 720;
}

/** Cursor position relative to canvas 0,0. */
function getCanvasCursorXY() {
    console.log('getCanvasCursorXY');
    const rect = canvas_draw.getBoundingClientRect();
    const x = Math.floor(mouse.x - rect.left);
    const y = Math.floor(mouse.y - rect.top);
    console.log(mouse.x, mouse.y, x, y, rect.left, rect.top);
    return { x, y };
}
// todo use this ↓ in keydown / copy / paste handlers
/** Check if something on page is selected OR text input field is active. */
function isActiveOrInSelection() {
    console.log('isActiveOrInSelection');
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return 1;

    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return 1;

    return 0;
}
// endregion

// region IMAGE COPY
function cd_copy_to_clipboard() {
    console.log('copyCanvasToClipboard');
    const callback = (blob) => {
        let item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(fx_cd_copy);
    };
    canvas_draw.toBlob(callback, 'image/png');
}
function fx_cd_copy() {
    canvas_over.classList.add('fx-copied');
    setTimeout(() => canvas_over.classList.remove('fx-copied'), 500);
}
function SETUP_IMAGE_COPY() {
    butt_copy.onclick = cd_copy_to_clipboard;
    document.addEventListener('copy', _ => {
        console.log('document.copy');
        if (isActiveOrInSelection()) return;

        cd_copy_to_clipboard();
    });
}
// endregion

// region IMAGE PASTE
function image_paste(e) {
    console.log('image_paste');
    const items = Array.from(e.clipboardData?.items);
    const item  = items.find(i => i.type.startsWith("image"));
    if   (item) loadPastedImage(item.getAsFile());
}
function image_paste_button() {
    console.log("image_paste_button");
    navigator.clipboard.read().then(items => {
        const item  = items.find(i => i.types.some(t => t.startsWith('image')));
        if   (item) {
            const type = item.types.find(t => t.startsWith('image'));
            item.getType(type).then(blob => loadPastedImage(blob));
        }
    });
}
function loadPastedImage(blob) {
    if (imgv) cd_draw_pasted_image();

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
    butt_imgv_ok.onclick = cd_draw_pasted_image;
    butt_imgv_no.onclick = placing_image_exit;
    document.addEventListener('paste', function (e) {
        console.log('document.paste');
        if (!isActiveOrInSelection()) image_paste(e);
    });
    document.addEventListener('keydown', e => {
        console.log('document.keydown');
        if (imgv && !isActiveOrInSelection()) {
            if      (e.code === "Enter" ) cd_draw_pasted_image();
            else if (e.code === "Tab"   ) cd_draw_pasted_image();
            else if (e.code === "Space" ) cd_draw_pasted_image();
            else if (e.code === "Escape") placing_image_exit();
        }
    });
}
// endregion

// region PLACING IMAGE

const  HANDLE_SIZE = 10;
const MIN_IMG_SIZE = 10;

const co_ctx = canvas_over.getContext('2d');

let imgv = null;

let dragOffset = { x: 0, y: 0 }; // cursor coords rel. to pasted image 0,0

function placing_image_start(img) {
    console.log('enterImagePlacingMode');
    imgv = {
        img: img,
        x: 0,
        y: 0,
        w:     img.width,
        h:     img.height,
        ratio: img.width / img.height,
        grabbed_handle: null,
        is_dragging: false,
        is_resizing: false,
        is_mouseup: () => !imgv.is_dragging && !imgv.is_resizing,
        mod_keep_ratio:     false, // shift
        mod_drag_by_handle: false, //  ctrl
        mod_drag_canvas:    false, //   alt
        mod_resize_centered: () => imgv.mod_drag_canvas,
    };
    tool_activate(tool_imgv);
    placing_image_RENDER();
    vp.classList.add('img-draggable');
    canvas_over.classList.add('img-draggable');
}
function placing_image_exit() {
    console.log('exitImagePlacingMode');
    imgv = null;
    tool_activate(tool_last);
    vp.classList.remove('img-draggable');
    vp.classList.remove('img-dragging');
    canvas_over.classList.remove('img-draggable');
}
function placing_image_RENDER() {
    console.log('renderPastedImageOverlay');
    co_ctx.clearRect(0, 0, canvas_over.width, canvas_over.height);
    if (imgv) {
        const { img, x, y, w, h } = imgv;
        co_ctx.drawImage(img, x, y, w, h);
        co_ctx.fillStyle = 'black';
        for (const handle of imgv_get_handles()) {
            let hx = handle.x - HANDLE_SIZE / 2;
            let hy = handle.y - HANDLE_SIZE / 2;
            co_ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE);
        }
        window.requestAnimationFrame(placing_image_RENDER);
        // todo ^ request frame only if something changed
    }
}
function imgv_get_cursor_style() {
    console.log('getImagePlacementModeCursor');
    const cc = getCanvasCursorXY();
    const  handle = imgv_get_handle_name_at_cc(cc.x, cc.y);
    return handle === 'nw' || handle === 'se' ? 'nwse-resize'
        :  handle === 'ne' || handle === 'sw' ? 'nesw-resize' : '';
}
function imgv_get_handle_name_at_cc(cc_x, cc_y) {
    console.log('getHandleUnderMouse');
    for (const handle of imgv_get_handles()) {
        if (cc_x >= handle.x - HANDLE_SIZE &&
            cc_x <= handle.x + HANDLE_SIZE &&
            cc_y >= handle.y - HANDLE_SIZE &&
            cc_y <= handle.y + HANDLE_SIZE) return handle.name;
    }
}
function imgv_get_handles() {
    console.log('getResizeHandles');
    const s = imgv;
    return [
        { name: "nw", x: s.x,       y: s.y       },
        { name: "ne", x: s.x + s.w, y: s.y       },
        { name: "sw", x: s.x,       y: s.y + s.h },
        { name: "se", x: s.x + s.w, y: s.y + s.h },
    ];
}
function imgv_interaction_start() {
    if (imgv) {
        const cc = getCanvasCursorXY();
        const { x, y } = imgv;
        if (imgv.grabbed_handle = imgv_get_handle_name_at_cc(cc.x, cc.y)) {
            imgv.is_resizing = true;
        }
        else if (imgv.mod_drag_canvas) {
            cw_drag_enable();
            cw_drag_start();
        }
        else { // image drag
            imgv.is_dragging = true;
            vp.classList.add('img-dragging');
            dragOffset.x = cc.x - x;
            dragOffset.y = cc.y - y;
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
                dragOffset.x = cc.x - imgv.x;
                dragOffset.y = cc.y - imgv.y;
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

    if (imgv.is_mouseup()) {
        if (!imgv.mod_drag_by_handle) // change cursor if over handle
            canvas_over.style.cursor = imgv_get_cursor_style();
    }
    else {
        const cc = getCanvasCursorXY();

        if (imgv.is_dragging) {
            if (imgv.mod_drag_canvas) {
                cw_drag();
            }
            else { // drag image
                imgv.x = cc.x - dragOffset.x;
                imgv.y = cc.y - dragOffset.y;
            }
        }
        else if (imgv.is_resizing) {
            if (imgv.mod_drag_by_handle) {
                imgv.x = cc.x - dragOffset.x;
                imgv.y = cc.y - dragOffset.y;
            }
            const  og = { x: imgv.x, y: imgv.y, w: imgv.w, h: imgv.h };
            const   g = imgv.grabbed_handle;
            let w = g.includes('w') ? og.w + (og.x - cc.x) : cc.x - og.x;
            let h = g.includes('n') ? og.h + (og.y - cc.y) : cc.y - og.y;
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
            imgv.x = c ? og.x + (og.w - w) / 2 : g.includes('w') ? og.x + og.w - w : og.x;
            imgv.y = c ? og.y + (og.h - h) / 2 : g.includes('n') ? og.y + og.h - h : og.y;
            imgv.w = w;
            imgv.h = h;
        }
    }
}
function imgv_interaction_stop() {
    if (imgv) {
        imgv.is_dragging = false;
        imgv.is_resizing = false;
        imgv.grabbed_handle = null;
        vp.classList.remove('img-dragging');
        if (imgv.mod_drag_canvas) cw_drag_disable();
    }
}
function SETUP_IMAGE_PLACING() {
    document.addEventListener("mousedown", imgv_interaction_start);
    document.addEventListener("mousemove", imgv_interact);
    document.addEventListener("mouseup",   imgv_interaction_stop);
    document.addEventListener("keydown",   imgv_interaction_apply_mods);
    document.addEventListener("keyup",     imgv_interaction_apply_mods);
}
// endregion

// region COLOR ------ TODO!!!!!
let eyeDropping = false;
let eyeDropColor = 'white';

function SETUP_COLOR_PICKER() {
    canvas_draw.addEventListener('mousemove', _ => {
        console.log('canvasA.mousemove');
        if (eyeDropping) {
            const { x, y } = getCanvasCursorXY();
            const [r, g, b] = cd_ctx.getImageData(x, y, 1, 1).data;
            eyeDropColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            updateInputColor(eyeDropColor);
        }
    });
    canvas_draw.addEventListener('click', _ => {
        console.log('canvasA.click');
        if (eyeDropping) {
            setColor(eyeDropColor);
            exitEyeDropping();
        }
    });
    document.addEventListener('keydown', e => {
        console.log('document.keydown');
        if (!isActiveOrInSelection()) {
            if      (e.code === 'KeyE')                enterEyeDropping();
            else if (e.key === 'Escape' && eyeDropping) exitEyeDropping();
        }
    });
}
// endregion

// region HACKS

const mouse = { x: 0, y: 0 };

function SETUP_HOOKS_PRE() {
    window.w = window.innerWidth;
    window.h = window.innerHeight;
    window.addEventListener('mouseenter', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { capture: true });
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { capture: true });
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
{
    SETUP_HISTORY_SYNC();
    SETUP_HISTORY_CTL();
    SETUP_TOOLS();
    SETUP_CW_DRAG();
    SETUP_CW_ZOOM();
    SETUP_DRAWING();
    SETUP_BRUSH_CURSOR();
    SETUP_IMAGE_COPY();
    SETUP_IMAGE_PASTE();
    SETUP_IMAGE_PLACING();
    SETUP_COLOR_PICKER();
}
SETUP_HOOKS_POST();
{
    cw_setup_size();
    cw_resize_true_scale();
    set_thickness(3);
    history_load();
}
// endregion