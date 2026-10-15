// Share sheets for the Trident app (moved out of index.html on 15/10 so the
// fast app, which runs in this page, gets them too). WhatsApp hand-off, the
// deal pack PDF and Facebook images open the phone's own share sheet.
(function () {
  var st = document.createElement('style');
  st.textContent = '.tl-sheet{position:fixed;inset:0;z-index:1000;background:rgba(14,26,24,.55);display:flex;align-items:flex-end;justify-content:center}\n.tl-sheet .box{width:100%;max-width:520px;box-sizing:border-box;background:#FFFFFF;color:#17221F;border-radius:14px 14px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px}\n.tl-sheet h2{margin:0;font-size:17px}\n.tl-sheet p{color:#55625E;font-size:14px;max-height:30vh;overflow:auto;white-space:pre-wrap}\n.tl-sheet a,.tl-sheet button{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:8px;font:700 16px system-ui,sans-serif;text-decoration:none}\n.tl-sheet a{background:#1B4B45;color:#FFFFFF}\n.tl-sheet .tl-quiet{background:#FFFFFF;color:#1B4B45;border:1.5px solid #DCE3E0}';
  (document.head || document.documentElement).appendChild(st);
  // 15/10 (Dave: tapping the calculator's minus quickly zoomed the page):
  // taps on buttons and links never double-tap zoom; pinch zoom still works.
  var tz = document.createElement('style');
  tz.textContent = 'html{-webkit-text-size-adjust:100%}button,a,input,select,label,[role="button"],.btn,.step,.stepper button{touch-action:manipulation}'
    // 15/10 (Dave: the Back button sat up in the clock and battery): page
    // headers start below the phone's status bar, like the Today header does.
    + '.bar{padding-top:calc(env(safe-area-inset-top,0px) + 10px)}'
    + '.hero{padding-top:calc(env(safe-area-inset-top,0px) + 18px)}'
    + '.gwrap .back,.gwrap .star{top:calc(env(safe-area-inset-top,0px) + 12px)}';
  (document.head || document.documentElement).appendChild(tz);
  // WhatsApp hand-off (05/10). Links opened from inside the app land in an
  // in-app browser on iPhone, which can't open WhatsApp. The app asks this
  // page instead, and the tap on "Open WhatsApp" here opens it directly.
  // Only WhatsApp links from the Apps Script app are accepted.
  function waUrl(raw) {
    var u; try { u = new URL(String(raw)); } catch (e) { return null; }
    if (u.protocol === 'https:' && (u.hostname === 'wa.me' || u.hostname === 'api.whatsapp.com')) {
      var phone = u.hostname === 'wa.me' ? u.pathname.replace(/\D/g, '') : (u.searchParams.get('phone') || '').replace(/\D/g, '');
      var q = 'text=' + encodeURIComponent(u.searchParams.get('text') || '') + (phone ? '&phone=' + phone : '');
      return { app: 'whatsapp://send?' + q, web: u.toString(), text: u.searchParams.get('text') || '' };
    }
    return null;
  }
  function closeSheet() { var el = document.getElementById('wa'); if (el) el.remove(); }
  function sheet(w) {
    closeSheet();
    var d = document.createElement('div'); d.className = 'tl-sheet'; d.id = 'wa';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Send on WhatsApp');
    d.innerHTML = '<div class="box"><h2>Send on WhatsApp</h2><p></p><a id="waGo">Open WhatsApp</a>'
      + '<button class="tl-quiet" id="waCopy">Copy the message</button><button class="tl-quiet" id="waNo">Cancel</button></div>';
    d.querySelector('p').textContent = w.text;
    d.querySelector('#waGo').href = w.app;
    d.querySelector('#waGo').onclick = function () { setTimeout(closeSheet, 600); };
    d.querySelector('#waCopy').onclick = function () {
      var b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(w.text) : Promise.reject()).then(function () { b.textContent = 'Copied: paste it in WhatsApp'; }, function () { b.textContent = 'Couldn\'t copy: press and hold the message to copy it'; });
    };
    d.querySelector('#waNo').onclick = closeSheet;
    d.onclick = function (e) { if (e.target === d) closeSheet(); };
    document.body.appendChild(d);
    d.querySelector('#waGo').focus();
  }
  // The deal pack PDF itself (05/10): a tap here opens the phone's share
  // sheet with the file attached, so it goes into WhatsApp as a document.
  function fileSheet(m) {
    closeSheet();
    var bytes = atob(m.b64), arr = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    var blob = new Blob([arr], { type: 'application/pdf' }), file = null, name = String(m.name).replace(/[\\/:*?"<>|]/g, '_');
    try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) { file = null; }
    var canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    var save = m.mode === 'save';   // 05/10: "Save preview PDF" saves; "Send on WhatsApp" shares
    var text = String(m.text || '');
    var d = document.createElement('div'); d.className = 'tl-sheet'; d.id = 'wa';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', save ? 'Save the deal pack' : 'Send the deal pack');
    var shareBtn = canShare ? '<button id="shGo"' + (save ? ' class="tl-quiet">Share instead' : ' style="background:#1B4B45;color:#FFFFFF">Share the PDF') + '</button>' : '';
    var saveLink = '<a id="shSave"' + (save || !canShare ? '' : ' class="tl-quiet"') + '>Save the PDF</a>';
    d.innerHTML = '<div class="box"><h2>' + (save ? 'Save the deal pack' : 'Send the deal pack') + '</h2><p></p>'
      + (save ? saveLink + shareBtn : shareBtn + saveLink)
      + (text && !save ? '<button class="tl-quiet" id="waCopy">Copy the message</button>' : '') + '<button class="tl-quiet" id="waNo">Cancel</button></div>';
    d.querySelector('p').textContent = save ? name + '\n\nOn a phone, the PDF opens: use its share button and pick Save to Files.'
      : (canShare ? 'Pick WhatsApp, then the person or group. ' : 'Save it, then attach it in WhatsApp. ') + name + (text ? '\n\n' + text : '');
    if (canShare) d.querySelector('#shGo').onclick = function () {
      navigator.share({ files: [file] }).then(closeSheet, function (e) { if (e && e.name !== 'AbortError') d.querySelector('p').textContent = 'Couldn\'t open sharing: ' + (e.message || e); });
    };
    var a = d.querySelector('#shSave'); a.href = URL.createObjectURL(blob); a.download = name; a.addEventListener('click', function () { setTimeout(closeSheet, 300); });
    var cp = d.querySelector('#waCopy');
    if (cp) cp.onclick = function () { var b = this; (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { b.textContent = 'Copied: paste it with the PDF'; }, function () { b.textContent = 'Couldn\'t copy'; }); };
    d.querySelector('#waNo').onclick = closeSheet;
    d.onclick = function (e) { if (e.target === d) closeSheet(); };
    document.body.appendChild(d);
    (save ? d.querySelector('#shSave') : (d.querySelector('#shGo') || d.querySelector('#shSave'))).focus();
  }

  // Post images for Facebook (Social tab, 05/10): the share sheet with the
  // PNGs attached, plus a button to copy the post text first (Facebook
  // ignores text passed through the share sheet).
  function imageSheet(m) {
    closeSheet();
    var files = [];
    try {
      m.files.slice(0, 10).forEach(function (f) {
        if (!/\.(png|jpe?g)$/i.test(String(f.name || '')) || typeof f.b64 !== 'string' || f.b64.length > 15000000) return;
        var bytes = atob(f.b64), arr = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        files.push(new File([arr], String(f.name).replace(/[\\/:*?"<>|]/g, '_'), { type: /\.png$/i.test(f.name) ? 'image/png' : 'image/jpeg' }));
      });
    } catch (e) { files = []; }
    if (!files.length) return;
    var canShare = !!(navigator.canShare && navigator.canShare({ files: files }));
    var text = String(m.text || '');
    // 15/10: the WhatsApp group post with a photo uses this sheet too.
    var app = m.app === 'WhatsApp' ? 'WhatsApp' : 'Facebook';
    var d = document.createElement('div'); d.className = 'tl-sheet'; d.id = 'wa';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Post to ' + app);
    d.innerHTML = '<div class="box"><h2>' + (app === 'WhatsApp' ? 'Post to the WhatsApp group' : 'Post to Facebook') + '</h2><p></p>'
      + (text ? '<button id="imCopy" style="background:#1B4B45;color:#FFFFFF">1. Copy the post text</button>' : '')
      + (canShare ? '<button id="imGo"' + (text ? ' class="tl-quiet"' : ' style="background:#1B4B45;color:#FFFFFF"') + '>' + (text ? '2. ' : '') + 'Share ' + (files.length > 1 ? 'the ' + files.length + ' images' : 'the image') + '</button>' : '<a id="imSave">Save ' + (files.length > 1 ? 'the images' : 'the image') + '</a>')
      + '<button class="tl-quiet" id="waNo">Cancel</button></div>';
    d.querySelector('p').textContent = canShare ? (app === 'WhatsApp' ? 'Copy the text, then share and pick WhatsApp, then the group. If the text isn\'t there as the caption, paste it before you send.' : 'Copy the text, then share and pick Facebook. Paste the text into the post before you publish.') : 'Save, then add ' + (files.length > 1 ? 'them' : 'it') + ' to your post in Facebook.';
    var cp = d.querySelector('#imCopy');
    if (cp) cp.onclick = function () { var b = this; (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = 'Couldn\'t copy: use Copy text in the app'; }); };
    if (canShare) d.querySelector('#imGo').onclick = function () {
      navigator.share(app === 'WhatsApp' && text ? { files: files, text: text } : { files: files }).then(closeSheet, function (e) { if (e && e.name !== 'AbortError') d.querySelector('p').textContent = 'Couldn\'t open sharing: ' + (e.message || e); });
    };
    else { var a = d.querySelector('#imSave'); a.onclick = function () { files.forEach(function (f) { var l = document.createElement('a'); l.href = URL.createObjectURL(f); l.download = f.name; document.body.appendChild(l); l.click(); l.remove(); }); closeSheet(); }; a.href = '#'; }
    d.querySelector('#waNo').onclick = closeSheet;
    d.onclick = function (e) { if (e.target === d) closeSheet(); };
    document.body.appendChild(d);
    (d.querySelector('#imCopy') || d.querySelector('#imGo') || d.querySelector('#imSave')).focus();
  }

  window.addEventListener('message', function (e) {
    var host = ''; try { host = new URL(e.origin).hostname; } catch (x) { return; }
    if (!/(^|\.)googleusercontent\.com$/.test(host) && host !== 'script.google.com' && e.origin !== location.origin) return;
    var m = e.data || {};
    if (m.trident === 'hello' && e.source) e.source.postMessage({ trident: 'launcher' }, e.origin);
    else if (m.trident === 'whatsapp') { var w = waUrl(m.url); if (w) sheet(w); }
    else if (m.trident === 'shareimages' && Array.isArray(m.files)) imageSheet(m);
    else if (m.trident === 'sharefile' && typeof m.b64 === 'string' && /\.pdf$/i.test(String(m.name || '')) && m.b64.length < 30000000) fileSheet(m);
  });

})();
