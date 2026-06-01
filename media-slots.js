/* ════════════════════════════════════════════════════════════════
   No'j Studio — Media Slots con auto-detección + lightbox
   ----------------------------------------------------------------
   Cada slot del portafolio prueba automáticamente qué archivo subiste
   a /images/ con el nombre del slot y lo jala solo — sin tocar código.
   Al hacer clic, la media se abre maximizada (lightbox).

   Uso en el HTML:
     <div class="port-item" data-slot="foto_eventos_2" data-priority="image" data-tag="Boda">
       <div class="port-ph">…placeholder…</div>
       <div class="port-overlay"><span class="port-tag">Boda</span></div>
     </div>

   - data-slot      → nombre base del archivo dentro de /images/ (sin extensión)
   - data-priority  → "video" (default) o "image": qué tipo intenta primero
   - data-tag       → alt text / etiqueta

   Acepta video (mp4·webm·mov) o foto (jpg·jpeg·png·webp).
   ════════════════════════════════════════════════════════════════ */
(function(){
  var VIDEO_EXT = ['mp4','webm','mov','MP4','MOV'];
  var IMG_EXT   = ['jpg','jpeg','png','webp','JPG','JPEG','PNG'];

  /* ---------- estilos (una sola vez) ---------- */
  if(!document.getElementById('media-slots-css')){
    var css = document.createElement('style');
    css.id = 'media-slots-css';
    css.textContent =
      '.port-item{position:relative;overflow:hidden}'+
      '.port-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;z-index:1}'+
      '.port-item.has-media{cursor:zoom-in}'+
      '.port-item .port-ph{position:absolute;inset:0;z-index:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.6rem;color:rgba(255,255,255,0.22);font-size:0.62rem;letter-spacing:0.08em;text-transform:none;text-align:center;padding:1rem;background:repeating-linear-gradient(135deg,#141414,#141414 10px,#171717 10px,#171717 20px)}'+
      '.port-ph-icon{font-size:1.8rem;opacity:0.3}'+
      '.port-ph code{display:block;margin-top:0.25rem;font-family:monospace;font-size:0.58rem;color:#7aaccc;opacity:0.9;letter-spacing:0.02em}'+
      '.port-ph .ph-type{font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3)}'+
      '.port-overlay{display:none!important}'+
      '.port-expand{position:absolute;top:0.9rem;right:0.9rem;z-index:3;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(10,10,10,0.7);border:1px solid rgba(255,255,255,0.18);color:#f4f2ed;font-size:0.95rem;opacity:0;transform:scale(0.9);transition:opacity .25s,transform .25s;pointer-events:none}'+
      '.port-item.has-media:hover .port-expand{opacity:1;transform:scale(1)}'+
      /* lightbox */
      '#ms-lightbox{position:fixed;inset:0;z-index:9999;background:rgba(6,6,6,0.96);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:5vh 4vw;cursor:zoom-out}'+
      '#ms-lightbox.open{display:flex}'+
      '#ms-lightbox .ms-lb-media{max-width:92vw;max-height:90vh;object-fit:contain;box-shadow:0 40px 120px rgba(0,0,0,0.7);background:#000}'+
      '#ms-lightbox .ms-lb-close{position:fixed;top:1.4rem;right:1.6rem;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#f4f2ed;font-size:1.4rem;cursor:pointer;transition:background .2s}'+
      '#ms-lightbox .ms-lb-close:hover{background:rgba(255,255,255,0.18)}'+
      '#ms-lightbox .ms-lb-cap{position:fixed;bottom:1.6rem;left:50%;transform:translateX(-50%);font-family:sans-serif;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55)}';
    document.head.appendChild(css);
  }

  /* ---------- lightbox ---------- */
  var lb, lbStage, lbCap;
  function ensureLightbox(){
    if(lb) return;
    lb = document.createElement('div');
    lb.id = 'ms-lightbox';
    lb.innerHTML = '<button class="ms-lb-close" aria-label="Cerrar">&times;</button><div class="ms-lb-stage"></div><div class="ms-lb-cap"></div>';
    document.body.appendChild(lb);
    lbStage = lb.querySelector('.ms-lb-stage');
    lbCap = lb.querySelector('.ms-lb-cap');
    function close(){
      lb.classList.remove('open');
      lbStage.innerHTML = '';
      document.body.style.overflow = '';
    }
    lb.addEventListener('click', function(e){
      if(e.target === lb || e.target.classList.contains('ms-lb-close') || e.target.classList.contains('ms-lb-stage')) close();
    });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }
  function openLightbox(src, type, caption){
    ensureLightbox();
    lbStage.innerHTML = '';
    var el;
    if(type === 'video'){
      el = document.createElement('video');
      el.src = src; el.controls = true; el.autoplay = true; el.loop = true;
      el.playsInline = true; el.setAttribute('playsinline','');
    } else {
      el = document.createElement('img');
      el.src = src;
    }
    el.className = 'ms-lb-media';
    lbStage.appendChild(el);
    lbCap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /* ---------- carga de slots ---------- */
  function attach(item, src, type){
    item.classList.add('has-media');
    var exp = document.createElement('div');
    exp.className = 'port-expand'; exp.innerHTML = '&#9974;'; // ⛶
    item.appendChild(exp);
    var cap = item.getAttribute('data-tag') || '';
    item.addEventListener('click', function(){ openLightbox(src, type, cap); });
  }

  function candidates(base, priority){
    var vids = VIDEO_EXT.map(function(e){ return {url: base + '.' + e, type: 'video'}; });
    var imgs = IMG_EXT.map(function(e){ return {url: base + '.' + e, type: 'image'}; });
    return priority === 'image' ? imgs.concat(vids) : vids.concat(imgs);
  }

  function tryNext(item, cands, i){
    if(i >= cands.length) return; // sin media — se queda el placeholder
    var cand = cands[i];
    if(cand.type === 'video'){
      var v = document.createElement('video');
      v.muted = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline',''); v.setAttribute('muted',''); v.setAttribute('preload','metadata');
      v.className = 'port-media';
      var settled = false;
      v.addEventListener('loadeddata', function(){
        if(settled) return; settled = true;
        item.insertBefore(v, item.firstChild); v.play().catch(function(){});
        attach(item, cand.url, 'video');
      });
      v.addEventListener('error', function(){
        if(settled) return; settled = true; tryNext(item, cands, i + 1);
      });
      v.src = cand.url; v.load();
    } else {
      var img = new Image();
      img.onload = function(){
        img.className = 'port-media';
        img.alt = item.getAttribute('data-tag') || '';
        item.insertBefore(img, item.firstChild);
        attach(item, cand.url, 'image');
      };
      img.onerror = function(){ tryNext(item, cands, i + 1); };
      img.src = cand.url;
    }
  }

  function init(){
    document.querySelectorAll('.port-item[data-slot]').forEach(function(item){
      tryNext(item, candidates('images/' + item.getAttribute('data-slot'), item.getAttribute('data-priority')), 0);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
