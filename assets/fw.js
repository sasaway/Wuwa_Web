/* Fair Winds 공용 스크립트: 다시 그린 뒤에도 포커스 유지, 표 스크롤 래퍼, 탭 전환 모션 */
(function(){
  var GENERIC = {'btn':1,'btn-small':1,'btn-danger':1,'btn-gold':1,'row-add':1,'tglbtn':1,'pill':1,'added':1,'active':1,'toggle':1};
  var HOLDER_SEL = '[data-id],[data-cid],[data-rid],[data-pid],[data-vid]';
  var FOCUSABLE = 'input,select,textarea,button';

  function sig(el){
    var cls = Array.prototype.slice.call(el.classList);
    var c = '';
    for(var i=0;i<cls.length;i++){ if(!GENERIC[cls[i]]){ c = cls[i]; break; } }
    if(!c && cls.length) c = cls[0];
    return el.tagName.toLowerCase() + (c ? '.' + c : '');
  }
  function holderKey(h){
    return Object.keys(h.dataset).map(function(k){ return h.dataset[k]; }).join('|');
  }
  function listIn(scope, s){
    return Array.prototype.filter.call(scope.querySelectorAll(FOCUSABLE), function(x){ return sig(x) === s; });
  }
  function caret(el){
    try{ return {s: el.selectionStart, e: el.selectionEnd}; }catch(_){ return {s:null, e:null}; }
  }

  window.captureFocus = function(root){
    var a = document.activeElement;
    if(!a || a === document.body || !root.contains(a) || !a.matches(FOCUSABLE)) return null;
    var c = caret(a);
    if(a.id) return {id:a.id, s:c.s, e:c.e};
    var holder = a.closest(HOLDER_SEL);
    var scope = (holder && root.contains(holder)) ? holder : root;
    var s = sig(a);
    var list = (scope === a) ? [a] : listIn(scope, s);
    return {hk: scope === root ? '' : holderKey(scope), sig:s, i:list.indexOf(a), s:c.s, e:c.e};
  };

  window.restoreFocus = function(root, f){
    if(!f) return;
    var el = null;
    if(f.id){
      el = root.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(f.id) : f.id));
    }else{
      var scope = root;
      if(f.hk){
        scope = null;
        var hs = root.querySelectorAll(HOLDER_SEL);
        for(var i=0;i<hs.length;i++){ if(holderKey(hs[i]) === f.hk){ scope = hs[i]; break; } }
      }
      if(scope){
        var list = (scope !== root && scope.matches(f.sig)) ? [scope] : listIn(scope, f.sig);
        el = list[f.i] || null;
      }
    }
    if(!el) return;
    el.focus({preventScroll:true});
    try{ if(f.s != null && el.setSelectionRange) el.setSelectionRange(f.s, f.e); }catch(_){ /* 캐럿이 없는 요소는 무시 */ }
  };

  window.wrapTables = function(root){
    Array.prototype.forEach.call(root.querySelectorAll('table'), function(t){
      if(t.parentElement.classList.contains('table-scroll')) return;
      var w = document.createElement('div');
      w.className = 'table-scroll';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
  };

  window.playViewEnter = function(){
    var m = document.getElementById('mainArea');
    if(!m) return;
    m.classList.remove('view-enter');
    void m.offsetWidth;
    m.classList.add('view-enter');
  };
})();
