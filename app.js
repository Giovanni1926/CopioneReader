(function () {
  'use strict';

  var ALIAS = {
    'MADRE (CARMELA)': 'CARMELA',
    MADRE: 'CARMELA',
    MAMMA: 'CARMELA',
    CARMELA: 'CARMELA',
    CAROL: 'CAROL',
    CAROLINA: 'CAROL',
    LUIGI: 'LUIGI',
    PAOLO: 'PAOLO',
    MATILDE: 'MATILDE',
    NATILDE: 'MATILDE',
    ISIDORO: 'ISIDORO',
    MAGO: 'MAGO',
    CAMILLO: 'CAMILLO',
    'DOTTORE (MEDICO)': 'DOTTORE',
    DOTTORE: 'DOTTORE',
    MEDICO: 'DOTTORE',
    'FRANCESCO (CICCIO)': 'FRANCESCO',
    FRANCESCO: 'FRANCESCO',
    CICCIO: 'FRANCESCO'
  };

  var PALETTE = [
    '#b23b3b', '#1e8a5f', '#2f6fc4', '#8e4fb0', '#c07f1a',
    '#0e9aa7', '#c2548c', '#6a8614', '#d2691e', '#4f7a3b',
    '#9a3f7d', '#5577a8', '#7a8c2c', '#a03050'
  ];

  var dom = {
    titolo: document.getElementById('titolo'),
    sottotitolo: document.getElementById('sottotitolo'),
    autore: document.getElementById('autore'),
    btnTema: document.getElementById('btn-tema'),
    btnStudio: document.getElementById('btn-studio'),
    btnModifica: document.getElementById('btn-modifica'),
    btnSalva: document.getElementById('btn-salva'),
    btnFile: document.getElementById('btn-file'),
    infoFile: document.getElementById('info-file'),
    attoTabs: document.getElementById('atto-tabs'),
    campoRicerca: document.getElementById('campo-ricerca'),
    conteggio: document.getElementById('conteggio-risultati'),
    btnPrec: document.getElementById('btn-prec'),
    btnSucc: document.getElementById('btn-succ'),
    btnTutti: document.getElementById('btn-tutti'),
    btnAnnulla: document.getElementById('btn-annulla'),
    listaPersonaggi: document.getElementById('lista-personaggi'),
    fontMeno: document.getElementById('font-meno'),
    fontPiu: document.getElementById('font-piu'),
    titoloAtto: document.getElementById('titolo-atto'),
    copione: document.getElementById('copione'),
    nessunRisultato: document.getElementById('nessun-risultato'),
    lettura: document.querySelector('.lettura'),
    barraStudio: document.getElementById('barra-studio'),
    studioPersonaggio: document.getElementById('studio-personaggio'),
    studioPrec: document.getElementById('studio-prec'),
    studioSucc: document.getElementById('studio-succ'),
    studioProgresso: document.getElementById('studio-progresso'),
    studioRivelaTutte: document.getElementById('studio-rivela-tutte'),
    studioUscita: document.getElementById('studio-uscita'),
    sovrapposta: document.getElementById('sovrapposta'),
    btnApertura: document.getElementById('btn-apertura'),
    btnRipristina: document.getElementById('btn-ripristina'),
    nomeRipristina: document.getElementById('nome-ripristina'),
    avvisoApertura: document.getElementById('avviso-apertura'),
    inputFile: document.getElementById('input-file'),
    toast: document.getElementById('toast'),
    btnNuovoPersonaggio: document.getElementById('btn-nuovo-personaggio'),
    formNuovoPersonaggio: document.getElementById('form-nuovo-personaggio'),
    npNome: document.getElementById('np-nome'),
    npRuolo: document.getElementById('np-ruolo'),
    npSalva: document.getElementById('np-salva'),
    npAnnulla: document.getElementById('np-annulla'),
    zonaAggiungi: document.getElementById('zona-aggiungi'),
    btnAggiungi: document.getElementById('btn-aggiungi'),
    btnTplCopione: document.getElementById('btn-tpl-copione'),
    btnTplSchema: document.getElementById('btn-tpl-schema')
  };

  var caratteri = [];
  var perId = {};
  var atti = [];
  var dati = null;
  var handle = null;
  var nomeFile = 'copione_strutturato.json';
  var editore = null;

  function nuovoCarattere(nome, ruolo) {
    var c = {
      id: nome.toUpperCase(),
      nome: nome,
      ruolo: ruolo || '',
      tag: [],
      linee: 0,
      dichiarato: false,
      colore: PALETTE[caratteri.length % PALETTE.length]
    };
    caratteri.push(c);
    perId[c.id] = c;
    return c;
  }

  function titoloCapitale(nome) {
    var s = (nome || '').trim();
    if (!s) return s;
    return s.split(/\s+/).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  function trovaOPersonaggio(nome, ruolo) {
    var pulito = titoloCapitale(nome);
    var u = pulito.toUpperCase().replace(/\s+/g, ' ');
    var id = ALIAS[u] || u;
    var c = perId[id];
    if (c) return c;
    if (!dati.personaggi) dati.personaggi = [];
    dati.personaggi.push({ nome: pulito, descrizione: ruolo || '' });
    stato.sporco = true;
    aggiornaStatoSalvataggio();
    costruisciCaratteri();
    return perId[id];
  }

  function canonical(raw) {
    if (raw == null) return null;
    var u = (raw + '').trim().toUpperCase().replace(/\s+/g, ' ');
    var id = ALIAS[u] || u;
    var c = perId[id];
    if (!c) c = nuovoCarattere(titoloCapitale(id), '');
    return c;
  }

  function costruisciCaratteri() {
    caratteri = [];
    perId = {};
    if (dati && dati.personaggi) {
      dati.personaggi.forEach(function (p) {
        var c = nuovoCarattere(titoloCapitale(p.nome || '?'), p.descrizione || p.ruolo);
        c.dichiarato = true;
      });
    }
    atti.forEach(function (atto) {
      atto.elementi.forEach(function (el) {
        if (el.tipo !== 'battuta' && el.tipo !== 'didascalia') return;
        if (!el.raw.personaggio) return;
        var c = canonical(el.raw.personaggio);
        if (el.tipo === 'battuta') {
          var tag = (el.raw.personaggio + '').trim().toUpperCase().replace(/\s+/g, ' ');
          if (c.tag.indexOf(tag) === -1) c.tag.push(tag);
          c.linee++;
        }
      });
    });
  }

  var stato = {
    atto: 0,
    filtro: {},
    ricerca: '',
    mCur: -1,
    mVis: [],
    fontStep: 0,
    tema: 'chiaro',
    studio: false,
    modifica: false,
    sporco: false,
    studioPersona: null,
    studioIdx: 0,
    rivelate: {}
  };

  var scena = null;

  function testoNorm(s) {
    return (s || '').toLowerCase();
  }

  function occorrenze(testo, q) {
    var out = [];
    if (!q) return out;
    var min = testoNorm(testo);
    var da = 0;
    while (da < min.length) {
      var at = min.indexOf(q, da);
      if (at === -1) break;
      out.push([at, at + q.length]);
      da = at + q.length;
    }
    return out;
  }

  function creaEl(tag, classe, testo) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo != null) el.textContent = testo;
    return el;
  }

  function paintMarka(el, testo, occ, corrente) {
    el.textContent = '';
    var frag = document.createDocumentFragment();
    var da = 0;
    occ.forEach(function (r, i) {
      if (r[0] > da) frag.appendChild(document.createTextNode(testo.slice(da, r[0])));
      var m = creaEl('mark');
      m.textContent = testo.slice(r[0], r[1]);
      if (corrente && i === 0) m.className = 'corrente';
      frag.appendChild(m);
      da = r[1];
    });
    if (da < testo.length) frag.appendChild(document.createTextNode(testo.slice(da)));
    el.appendChild(frag);
  }

  function isFormTarget(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function renderAtto(iAtto, noScroll) {
    dom.copione.textContent = '';
    scena = { records: [], items: [], battute: [], introEl: null };
    var atto = atti[iAtto];
    if (!atto) return;
    dom.titoloAtto.textContent = atto.titolo;

    function creaRec(tipo, classe, srcIdx) {
      var rec = {
        tipo: tipo,
        canon: null,
        srcIdx: srcIdx,
        el: creaEl('div', classe),
        items: []
      };
      dom.copione.appendChild(rec.el);
      scena.records.push(rec);
      return rec;
    }

    function aggiungiItem(rec, testo, cls, campo, raw, contenitore) {
      var el = contenitore || rec.el;
      var p = creaEl('p', cls);
      p.textContent = testo;
      el.appendChild(p);
      var item = { el: p, text: testo, occ: null, rec: rec };
      if (campo && raw) {
        item.edit = { raw: raw, field: campo };
        p.dataset.edit = '1';
      }
      rec.items.push(item);
      scena.items.push(item);
      return item;
    }

    function creaBattuta(c) {
      var br = creaRec('battuta', 'battuta');
      br.canon = c.id;
      var testa = creaEl('div', 'battuta-testa');
      var persona = creaEl('span', 'persona');
      persona.textContent = c.nome.toUpperCase();
      persona.style.color = c.colore;
      testa.appendChild(persona);
      br.el.appendChild(testa);
      var righe = creaEl('div', 'battuta-righe');
      br.el.appendChild(righe);
      br.testa = testa;
      br.righe = righe;
      return br;
    }

    function aggiungiDir(rec, testo, raw) {
      var p = creaEl('p', 'battuta-didascalia');
      p.textContent = testo;
      rec.el.insertBefore(p, rec.righe);
      var item = { el: p, text: testo, occ: null, rec: rec };
      item.edit = { raw: raw, field: 'didascalia_scenica' };
      p.dataset.edit = '1';
      rec.items.push(item);
      scena.items.push(item);
      return item;
    }

    function aggiungiRiga(rec, testo, raw) {
      return aggiungiItem(rec, testo, 'riga', 'testo', raw, rec.righe);
    }

    if (iAtto === 0 && dati) {
      var intro = creaRec('intro', 'intro');
      if (dati.descrizione) aggiungiItem(intro, dati.descrizione, '', 'descrizione', dati);
      if (dati.ambientazione_generale) aggiungiItem(intro, dati.ambientazione_generale, '', 'ambientazione_generale', dati);
    }

    var iSrc = 0;
    atto.elementi.forEach(function (el) {
      var tipo = el.tipo;
      var mioSrc = iSrc++;
      if (tipo === 'inizio_atto') return;

      if (tipo === 'battuta') {
        var testo = (el.raw.testo == null ? '' : String(el.raw.testo)).trim();
        var dir = (el.raw.didascalia_scenica == null ? '' : String(el.raw.didascalia_scenica)).trim();
        if (!testo && dir) {
          var dr2 = creaRec('didascalia', 'didascalia', mioSrc);
          aggiungiItem(dr2, dir, 'didascalia-corpo', 'didascalia_scenica', el.raw);
          return;
        }
        if (!testo) return;
        var c = canonical(el.raw.personaggio);
        if (!c) return;
        var br = creaBattuta(c);
        br.srcIdx = mioSrc;
        if (dir) aggiungiDir(br, dir, el.raw);
        aggiungiRiga(br, testo, el.raw);
        return;
      }
      if (tipo === 'didascalia') {
        var testo2 = (el.raw.testo == null ? '' : String(el.raw.testo)).trim();
        if (!testo2) return;
        var dd = creaRec('didascalia', 'didascalia', mioSrc);
        aggiungiItem(dd, testo2, 'didascalia-corpo', 'testo', el.raw);
        return;
      }
      if (tipo === 'musica') {
        var testo3 = (el.raw.didascalia_musicale == null ? '' : String(el.raw.didascalia_musicale)).trim();
        if (!testo3) return;
        var mu = creaRec('musica', 'musica', mioSrc);
        aggiungiItem(mu, testo3, '', 'didascalia_musicale', el.raw);
        return;
      }
      var testo4 = (el.raw.testo == null ? '' : String(el.raw.testo)).trim();
      if (!testo4) return;
      var fr = creaRec('fine_atto', 'fine-atto', mioSrc);
      aggiungiItem(fr, testo4, '', 'testo', el.raw);
    });

    scena.records.forEach(function (rec, i) {
      rec.el.dataset.idx = String(i);
      if (rec.srcIdx !== undefined && rec.srcIdx >= 0) {
        rec.el.dataset.src = String(rec.srcIdx);
      }
    });
    scena.battute = scena.records.filter(function (r) { return r.tipo === 'battuta'; });

    aggiungiToolbarModifica();

    renderVisibilita();
    aggiornaStudio();
    if (!noScroll) window.scrollTo(0, 0);
  }

  /* ---------- Struttura (modifica avanzata) ---------- */

  var modale = null;
  var dragEl = null;
  var dropTarget = null;

  function aggiungiToolbarModifica() {
    if (!scena) return;
    scena.records.forEach(function (rec) {
      if (rec.srcIdx === undefined || rec.srcIdx < 0) return;
      var az = creaEl('div', 'blocco-azioni');
      var grip = creaEl('span', 'blocco-grip');
      grip.textContent = '⠿';
      grip.title = 'Trascina per spostare';
      grip.setAttribute('draggable', 'true');
      var modifica = creaEl('button', 'blocco-tasto blocco-modifica');
      modifica.type = 'button';
      modifica.textContent = '✎';
      modifica.title = 'Modifica la riga del copione';
      modifica.dataset.azione = 'modifica';
      var aggiungi = creaEl('button', 'blocco-tasto');
      aggiungi.type = 'button';
      aggiungi.textContent = '＋';
      aggiungi.title = 'Inserisci un elemento dopo questo';
      aggiungi.dataset.azione = 'aggiungi';
      var elimina = creaEl('button', 'blocco-tasto blocco-elimina');
      elimina.type = 'button';
      elimina.textContent = '🗑';
      elimina.title = 'Elimina questo elemento';
      elimina.dataset.azione = 'elimina';
      az.appendChild(grip);
      az.appendChild(modifica);
      az.appendChild(aggiungi);
      az.appendChild(elimina);
      if (rec.el.firstChild) rec.el.insertBefore(az, rec.el.firstChild);
      else rec.el.appendChild(az);
    });
  }

  function elementoDaRec(rec) {
    if (!rec || rec.srcIdx === undefined || rec.srcIdx < 0) return null;
    var el = atti[stato.atto].elementi[rec.srcIdx];
    return el || null;
  }

  function recDaTarget(t) {
    if (!t) return null;
    var el = t.closest ? t.closest('[data-idx]') : null;
    if (!el) return null;
    var idx = parseInt(el.dataset.idx, 10);
    return scena.records[idx] || null;
  }

  function segnaStrutturaSporca() {
    stato.sporco = true;
    aggiornaStatoSalvataggio();
  }

  function ricostruisciStruttura() {
    if (!dati || !atti) return;
    var piatta = [];
    atti.forEach(function (atto) {
      atto.elementi.forEach(function (el) {
        if (el && el.raw) {
          el.raw.atto = atto.titolo;
          piatta.push(el.raw);
        }
      });
    });
    dati.struttura_sceneggiatura = piatta;
  }

  function rinfrescaDopoStruttura() {
    costruisciCaratteri();
    disegnaPersonaggi();
    var y = window.pageYOffset;
    renderAtto(stato.atto, true);
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  function eliminaElemento(rec) {
    var el = elementoDaRec(rec);
    if (!el) return;
    var arr = atti[stato.atto].elementi;
    var i = arr.indexOf(el);
    if (i === -1) return;
    arr.splice(i, 1);
    segnaStrutturaSporca();
    ricostruisciStruttura();
    rinfrescaDopoStruttura();
    mostraToast('Elemento eliminato. Premi Salva per scrivere sul file.');
  }

  function spostaElemento(daEl, targetEl, dopo) {
    var arr = atti[stato.atto].elementi;
    if (daEl === targetEl) return;
    arr.splice(arr.indexOf(daEl), 1);
    var j = arr.indexOf(targetEl);
    if (j === -1) { arr.push(daEl); }
    else if (dopo) { arr.splice(j + 1, 0, daEl); }
    else { arr.splice(j, 0, daEl); }
    segnaStrutturaSporca();
    ricostruisciStruttura();
    rinfrescaDopoStruttura();
  }

  function apriAggiunta(dopoRec) {
    if (modale) chiudiModale();
    if (!dati) return;
    var fin = creaEl('div', 'finestra');

    var h = creaEl('h2');
    h.textContent = 'Inserisci elemento';
    fin.appendChild(h);

    var tipo = creaEl('div', 'form-riga');
    var labTipo = creaEl('label', 'form-etichetta');
    labTipo.textContent = 'Tipo';
    var selTipo = document.createElement('select');
    var opz = [
      ['battuta', 'Battuta'],
      ['didascalia', 'Didascalia scenica'],
      ['musica', 'Musica']
    ];
    opz.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0];
      op.textContent = o[1];
      selTipo.appendChild(op);
    });
    tipo.appendChild(labTipo);
    tipo.appendChild(selTipo);
    fin.appendChild(tipo);

    var rigaPers = creaEl('div', 'form-riga');
    var labPers = creaEl('label', 'form-etichetta');
    labPers.textContent = 'Personaggio (nuovo o esistente)';
    var inpPers = document.createElement('input');
    inpPers.type = 'text';
    inpPers.setAttribute('list', 'lista-nomi-dialog');
    inpPers.placeholder = 'es. Beatrice oppure scegli…';
    var dl = creaEl('datalist');
    dl.id = 'lista-nomi-dialog';
    caratteri.forEach(function (c) {
      var op = document.createElement('option');
      op.value = c.nome;
      dl.appendChild(op);
    });
    rigaPers.appendChild(labPers);
    rigaPers.appendChild(inpPers);
    rigaPers.appendChild(dl);
    fin.appendChild(rigaPers);

    var rigaTesto = creaEl('div', 'form-riga');
    var labTesto = creaEl('label', 'form-etichetta');
    labTesto.textContent = 'Testo';
    var ta = document.createElement('textarea');
    ta.rows = 3;
    rigaTesto.appendChild(labTesto);
    rigaTesto.appendChild(ta);
    fin.appendChild(rigaTesto);

    function cambiaTipo() {
      rigaPers.style.display = selTipo.value === 'battuta' ? '' : 'none';
      labTipo.style.display = '';
    }
    selTipo.addEventListener('change', cambiaTipo);
    cambiaTipo();

    var bar = creaEl('div', 'editore-bar');
    var ann = creaEl('button', 'editore-btn');
    ann.type = 'button';
    ann.textContent = 'Annulla';
    ann.addEventListener('click', chiudiModale);
    var ok = creaEl('button', 'editore-btn editore-primario');
    ok.type = 'button';
    ok.textContent = 'Inserisci';
    ok.addEventListener('click', function () {
      var testo = (ta.value || '').trim();
      if (!testo) { mostraToast('Inserisci un testo.'); return; }
      var t = selTipo.value;
      var nome = t === 'battuta' ? (inpPers.value || '').trim() : '';
      if (t === 'battuta' && !nome) { mostraToast('Indica il personaggio.'); return; }
      var personaCanonica = '';
      if (t === 'battuta') {
        var c = trovaOPersonaggio(nome, '');
        if (!c) { mostraToast('Personaggio non disponibile.'); return; }
        personaCanonica = c.nome;
      }
      var raw = { atto: atti[stato.atto].titolo, tipo: t };
      if (t === 'battuta') {
        raw.personaggio = personaCanonica;
        raw.testo = testo;
      } else if (t === 'didascalia') {
        raw.testo = testo;
      } else if (t === 'musica') {
        raw.didascalia_musicale = testo;
      }
      var wrapper = { tipo: t, raw: raw };
      var arr = atti[stato.atto].elementi;
      if (dopoRec) {
        var el = elementoDaRec(dopoRec);
        var i = el ? arr.indexOf(el) : -1;
        if (i === -1) arr.push(wrapper);
        else arr.splice(i + 1, 0, wrapper);
      } else {
        arr.push(wrapper);
      }
      segnaStrutturaSporca();
      ricostruisciStruttura();
      costruisciCaratteri();
      disegnaPersonaggi();
      chiudiModale();
      var y = window.pageYOffset;
      renderAtto(stato.atto, true);
      requestAnimationFrame(function () { window.scrollTo(0, y); });
      mostraToast('Elemento aggiunto. Premi Salva per scrivere sul file.');
    });
    bar.appendChild(ann);
    bar.appendChild(ok);
    fin.appendChild(bar);

    var ov = creaEl('div', 'sovrapposta');
    ov.appendChild(fin);
    document.body.appendChild(ov);
    modale = { ov: ov, inpPers: inpPers, ta: ta, selTipo: selTipo };
    ov.addEventListener('click', function (ev) {
      if (ev.target === ov) chiudiModale();
    });
    setTimeout(function () { ta.focus(); }, 30);
  }

  function chiudiModale() {
    if (!modale) return;
    if (modale.ov && modale.ov.parentNode) modale.ov.parentNode.removeChild(modale.ov);
    modale = null;
  }

  function apriRigaEditor(rec) {
    if (!rec || rec.srcIdx === undefined || rec.srcIdx < 0) return;
    var el = atti[stato.atto].elementi[rec.srcIdx];
    if (!el || !el.raw) return;
    var raw = el.raw;
    var tipo = el.tipo;

    if (modale) chiudiModale();
    var fin = creaEl('div', 'finestra');
    var h = creaEl('h2');
    h.textContent = 'Modifica riga';
    fin.appendChild(h);

    function campo(label, cls, campoId) {
      var riga = creaEl('div', 'form-riga');
      var lab = creaEl('label', 'form-etichetta');
      lab.textContent = label;
      lab.setAttribute('for', campoId);
      riga.appendChild(lab);
      return { riga: riga, lab: lab };
    }

    var selPers = null;
    var inpPers = null;
    var taDir = null;
    var taTesto = null;
    var taMus = null;

    if (tipo === 'battuta') {
      var cp = campo('Personaggio', 'input', 'riga-pers');
      inpPers = document.createElement('input');
      inpPers.id = 'riga-pers';
      inpPers.type = 'text';
      inpPers.setAttribute('list', 'lista-nomi-riga');
      inpPers.value = raw.personaggio != null ? raw.personaggio : '';
      var dl = creaEl('datalist');
      dl.id = 'lista-nomi-riga';
      caratteri.forEach(function (c) {
        var op = document.createElement('option');
        op.value = c.nome;
        dl.appendChild(op);
      });
      cp.riga.appendChild(inpPers);
      cp.riga.appendChild(dl);
      fin.appendChild(cp.riga);

      var cd = campo('Didascalia scenica (facoltativa)', 'textarea', 'riga-dir');
      taDir = document.createElement('textarea');
      taDir.id = 'riga-dir';
      taDir.rows = 2;
      taDir.value = raw.didascalia_scenica != null ? raw.didascalia_scenica : '';
      cd.riga.appendChild(taDir);
      fin.appendChild(cd.riga);

      var ct = campo('Testo', 'textarea', 'riga-testo');
      taTesto = document.createElement('textarea');
      taTesto.id = 'riga-testo';
      taTesto.rows = 4;
      taTesto.value = raw.testo != null ? raw.testo : '';
      ct.riga.appendChild(taTesto);
      fin.appendChild(ct.riga);
    } else if (tipo === 'musica') {
      var cm = campo('Didascalia musicale', 'textarea', 'riga-mus');
      taMus = document.createElement('textarea');
      taMus.id = 'riga-mus';
      taMus.rows = 2;
      taMus.value = raw.didascalia_musicale != null ? raw.didascalia_musicale : '';
      cm.riga.appendChild(taMus);
      fin.appendChild(cm.riga);
    } else {
      var ct2 = campo(tipo === 'fine_atto' || tipo === 'fine_opera' ? 'Indicatore' : 'Testo', 'textarea', 'riga-testo2');
      taTesto = document.createElement('textarea');
      taTesto.id = 'riga-testo2';
      taTesto.rows = 3;
      taTesto.value = raw.testo != null ? raw.testo : '';
      ct2.riga.appendChild(taTesto);
      fin.appendChild(ct2.riga);
    }

    var bar = creaEl('div', 'editore-bar');
    var bAnn = creaEl('button', 'editore-btn');
    bAnn.type = 'button';
    bAnn.textContent = 'Annulla';
    bAnn.addEventListener('click', chiudiModale);
    var bSal = creaEl('button', 'editore-btn editore-primario');
    bSal.type = 'button';
    bSal.textContent = 'Salva';
    bSal.addEventListener('click', function () {
      if (tipo === 'battuta') {
        var nome = (inpPers.value || '').trim();
        if (!nome) { mostraToast('Indica il personaggio.'); return; }
        var c = trovaOPersonaggio(nome, '');
        raw.personaggio = c ? c.nome : nome;
        raw.didascalia_scenica = (taDir.value || '').trim();
        raw.testo = (taTesto.value || '').trim();
        if (!raw.testo) { mostraToast('Inserisci il testo della battuta.'); return; }
      } else if (tipo === 'musica') {
        raw.didascalia_musicale = (taMus.value || '').trim();
        if (!raw.didascalia_musicale) { mostraToast('Inserisci la didascalia musicale.'); return; }
      } else {
        raw.testo = (taTesto.value || '').trim();
      }
      segnaStrutturaSporca();
      ricostruisciStruttura();
      costruisciCaratteri();
      disegnaPersonaggi();
      chiudiModale();
      var y = window.pageYOffset;
      renderAtto(stato.atto, true);
      requestAnimationFrame(function () { window.scrollTo(0, y); });
      mostraToast('Riga aggiornata. Premi Salva per scrivere sul file.');
    });
    bar.appendChild(bAnn);
    bar.appendChild(bSal);
    fin.appendChild(bar);

    var ov = creaEl('div', 'sovrapposta');
    ov.appendChild(fin);
    document.body.appendChild(ov);
    modale = { ov: ov };
    ov.addEventListener('click', function (ev) {
      if (ev.target === ov) chiudiModale();
    });
    ov.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); chiudiModale(); }
    });
    var focus = taTesto || taMus || taDir;
    setTimeout(function () { if (focus) focus.focus(); }, 30);
  }

  function paintMarkaCorrente(item) {
    dom.copione.querySelectorAll('mark.corrente').forEach(function (m) { m.classList.remove('corrente'); });
    paintMarka(item.el, item.text, item.occ, true);
  }

  function renderVisibilita() {
    var q = testoNorm(stato.ricerca.trim());
    var hasFiltro = Object.keys(stato.filtro).length > 0;

    var matchRec = {};
    scena.items.forEach(function (item) {
      item.occ = null;
      if (q) {
        var occ = occorrenze(item.text, q);
        if (occ.length) { item.occ = occ; matchRec[item.rec] = true; }
      }
    });

    scena.records.forEach(function (rec) {
      var okFiltro = !hasFiltro || !rec.canon || !!stato.filtro[rec.canon];
      var okRicerca = !q || !!matchRec[rec];
      rec.match = q ? !!matchRec[rec] : false;
      rec.el.classList.toggle('fuori-filtro', !(okFiltro && okRicerca));
    });

    scena.items.forEach(function (item) {
      if (item.occ) {
        paintMarka(item.el, item.text, item.occ, false);
      } else if (item.el.querySelector('mark')) {
        item.el.textContent = item.text;
      }
    });

    if (q) {
      var vis = scena.items.filter(function (i) { return i.occ && !i.rec.el.classList.contains('fuori-filtro'); });
      stato.mVis = vis;
      if (vis.length) {
        stato.mCur = 0;
        paintMarkaCorrente(vis[0]);
        dom.conteggio.textContent = 'Risultato 1 di ' + vis.length;
        dom.nessunRisultato.classList.add('nascosto');
      } else {
        stato.mCur = -1;
        dom.conteggio.textContent = 'Nessun risultato';
        dom.nessunRisultato.classList.remove('nascosto');
      }
    } else {
      stato.mVis = [];
      stato.mCur = -1;
      dom.conteggio.textContent = '';
      dom.nessunRisultato.classList.add('nascosto');
    }
    dom.btnPrec.disabled = stato.mCur <= 0;
    dom.btnSucc.disabled = stato.mCur < 0 || stato.mCur >= stato.mVis.length - 1;
  }

  function vaiARisultato(delta) {
    var vis = stato.mVis;
    if (!vis.length || stato.mCur < 0) return;
    var nuovo = stato.mCur + delta;
    if (nuovo < 0) nuovo = 0;
    if (nuovo > vis.length - 1) nuovo = vis.length - 1;
    paintMarkaCorrente(vis[nuovo]);
    stato.mCur = nuovo;
    dom.conteggio.textContent = 'Risultato ' + (nuovo + 1) + ' di ' + vis.length;
    dom.btnPrec.disabled = nuovo <= 0;
    dom.btnSucc.disabled = nuovo >= vis.length - 1;
    vis[nuovo].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function disegnaTabs() {
    dom.attoTabs.textContent = '';
    atti.forEach(function (atto, i) {
      var b = creaEl('button');
      b.type = 'button';
      b.textContent = atto.titolo;
      if (i === stato.atto) b.className = 'attivo';
      b.addEventListener('click', function () {
        if (stato.atto === i) return;
        stato.atto = i;
        stato.ricerca = '';
        dom.campoRicerca.value = '';
        chiudiEditore();
        renderAtto(i);
      });
      dom.attoTabs.appendChild(b);
    });
  }

  function disegnaPersonaggi() {
    dom.listaPersonaggi.textContent = '';
    caratteri.forEach(function (c) {
      if (!c.dichiarato && c.linee === 0) return;
      var li = creaEl('li');
      var b = creaEl('button');
      b.type = 'button';
      b.dataset.id = c.id;
      var dot = creaEl('span', 'dot');
      dot.style.background = c.colore;
      var spanNome = creaEl('span');
      spanNome.textContent = c.nome;
      b.appendChild(dot);
      b.appendChild(spanNome);
      var dettaglio = [];
      if (c.ruolo) dettaglio.push(c.ruolo);
      if (c.tag.length) dettaglio.push('nel testo: ' + c.tag.join(' · '));
      var r = creaEl('span', 'ruolo');
      r.textContent = dettaglio.join(' — ');
      b.appendChild(r);
      b.addEventListener('click', function () { toggleFiltro(c.id); });
      li.appendChild(b);
      dom.listaPersonaggi.appendChild(li);
    });
    aggiornaChip();
  }

  function aggiornaChip() {
    dom.listaPersonaggi.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('filtro', !!stato.filtro[b.dataset.id]);
    });
    dom.btnTutti.classList.toggle('attivo', Object.keys(stato.filtro).length === 0);
    dom.btnAnnulla.disabled = Object.keys(stato.filtro).length === 0;
  }

  function toggleFiltro(id) {
    if (stato.filtro[id]) delete stato.filtro[id];
    else stato.filtro[id] = true;
    aggiornaChip();
    renderVisibilita();
  }

  function annullaFiltro() {
    stato.filtro = {};
    aggiornaChip();
    renderVisibilita();
  }

  function aggiungiPersonaggio(nome, ruolo) {
    if (!dati) return;
    var pulito = titoloCapitale(nome);
    var u = pulito.toUpperCase().replace(/\s+/g, ' ');
    var id = ALIAS[u] || u;
    if (perId[id]) { mostraToast('Il personaggio «' + perId[id].nome + '» esiste già.'); return; }
    var c = trovaOPersonaggio(pulito, ruolo);
    stato.sporco = true;
    aggiornaStatoSalvataggio();
    costruisciCaratteri();
    disegnaPersonaggi();
    mostraToast('Personaggio «' + c.nome + '» aggiunto.');
  }

  function colorDiId(id) {
    var c = perId[id];
    return c ? c.colore : PALETTE[0];
  }

  function leggiImpostazioni() {
    try {
      stato.fontStep = parseInt(localStorage.getItem('copione.font') || '0', 10) || 0;
      stato.tema = localStorage.getItem('copione.tema') || 'chiaro';
    } catch (e) { }
    if (stato.fontStep < -2) stato.fontStep = -2;
    if (stato.fontStep > 5) stato.fontStep = 5;
    document.documentElement.style.fontSize = (16 + stato.fontStep) + 'px';
    document.body.dataset.tema = stato.tema;
  }

  function salvaImpostazioni() {
    try {
      localStorage.setItem('copione.font', String(stato.fontStep));
      localStorage.setItem('copione.tema', stato.tema);
    } catch (e) { }
  }

  function aggiornaStudio() {
    if (!scena) return;
    var inStudio = stato.studio;
    dom.lettura.classList.toggle('in-studio', inStudio);
    dom.barraStudio.classList.toggle('nascosto', !inStudio);
    dom.btnStudio.classList.toggle('attivo', inStudio);

    if (!inStudio) {
      dom.copione.querySelectorAll('.riga.mascherata').forEach(function (el) { el.classList.remove('mascherata'); });
      dom.copione.querySelectorAll('.riga.rivelata').forEach(function (el) { el.classList.remove('rivelata'); });
      dom.copione.querySelectorAll('.studio-corrente').forEach(function (el) { el.classList.remove('studio-corrente'); });
      return;
    }

    var persona = stato.studioPersona;
    var n = scena.battute.length;
    if (stato.studioIdx > n - 1) stato.studioIdx = 0;

    dom.copione.querySelectorAll('.studio-corrente').forEach(function (el) { el.classList.remove('studio-corrente'); });

    scena.records.forEach(function (rec) {
      if (rec.tipo !== 'battuta') return;
      var idx = parseInt(rec.el.dataset.idx, 10);
      var mia = persona && rec.canon === persona;
      if (mia) {
        var riv = stato.rivelate[chiaveBlocco(stato.atto, idx)] || dom.studioRivelaTutte.checked;
        rec.el.querySelectorAll('.riga').forEach(function (el) {
          if (riv) {
            el.classList.remove('mascherata');
            el.classList.add('rivelata');
          } else {
            el.classList.add('mascherata');
            el.classList.remove('rivelata');
          }
        });
      } else {
        rec.el.querySelectorAll('.riga').forEach(function (el) {
          el.classList.remove('mascherata');
          el.classList.remove('rivelata');
        });
      }
    });

    var battute = scena.battute;
    if (battute.length) {
      var curIdx = stato.studioIdx;
      if (curIdx < 0) curIdx = 0;
      if (curIdx > battute.length - 1) curIdx = battute.length - 1;
      stato.studioIdx = curIdx;
      battute[curIdx].el.classList.add('studio-corrente');
      dom.studioProgresso.textContent = (curIdx + 1) + ' / ' + battute.length;
      dom.studioPrec.disabled = curIdx === 0;
      dom.studioSucc.disabled = curIdx >= battute.length - 1;
    } else {
      stato.studioIdx = 0;
      dom.studioProgresso.textContent = '—';
      dom.studioPrec.disabled = true;
      dom.studioSucc.disabled = true;
    }
  }

  function chiaveBlocco(atto, idx) { return atto + ':' + idx; }

  function studioVai(delta) {
    if (!stato.studio || !scena) return;
    var n = scena.battute.length;
    if (!n) return;
    stato.studioIdx += delta;
    if (stato.studioIdx < 0) stato.studioIdx = 0;
    if (stato.studioIdx > n - 1) stato.studioIdx = n - 1;
    aggiornaStudio();
    scena.battute[stato.studioIdx].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function studioRevealCorrente() {
    if (!stato.studio || !scena || !scena.battute.length) return;
    var rec = scena.battute[stato.studioIdx];
    var persona = stato.studioPersona;
    if (!persona || rec.canon !== persona) return;
    var k = chiaveBlocco(stato.atto, parseInt(rec.el.dataset.idx, 10));
    if (dom.studioRivelaTutte.checked) {
      dom.studioRivelaTutte.checked = false;
      stato.rivelate[k] = true;
    } else {
      if (stato.rivelate[k]) delete stato.rivelate[k];
      else stato.rivelate[k] = true;
    }
    aggiornaStudio();
  }

  function avviaStudio() {
    if (stato.modifica) toggleModifica();
    stato.studio = !stato.studio;
    if (stato.studio) {
      stato.ricerca = '';
      dom.campoRicerca.value = '';
      stato.filtro = {};
      aggiornaChip();
      renderVisibilita();
      var conLinee = caratteri.filter(function (c) { return c.linee > 0; });
      stato.studioPersona = conLinee.length ? conLinee[0].id : null;
      stato.studioIdx = 0;
      riempiSelectStudio();
    }
    aggiornaStudio();
    if (stato.studio && scena && scena.battute.length) {
      setTimeout(function () {
        scena.battute[stato.studioIdx].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }

  function riempiSelectStudio() {
    var opzioni = caratteri.filter(function (c) { return c.linee > 0; });
    dom.studioPersonaggio.textContent = '';
    opzioni.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.nome;
      dom.studioPersonaggio.appendChild(o);
    });
    dom.studioPersonaggio.value = stato.studioPersona || '';
  }

  function etichettaCampo(field) {
    return {
      testo: 'Testo',
      didascalia_scenica: 'Didascalia scenica',
      didascalia_musicale: 'Didascalia musicale',
      descrizione: 'Descrizione',
      ambientazione_generale: 'Ambientazione'
    }[field] || 'Testo';
  }

  function chiudiEditore() {
    if (!editore) return;
    var e = editore;
    editore = null;
    if (e.wrap && e.wrap.parentNode) e.wrap.parentNode.removeChild(e.wrap);
    e.item.el.classList.remove('nascondi-testo');
  }

  function salvaEditore() {
    var e = editore;
    if (!e) return;
    var valore = e.ta.value;
    var item = e.item;
    editore = null;
    if (e.wrap && e.wrap.parentNode) e.wrap.parentNode.removeChild(e.wrap);
    item.el.classList.remove('nascondi-testo');
    if (item.edit && valore !== item.text) {
      item.edit.raw[item.edit.field] = valore;
      stato.sporco = true;
      aggiornaStatoSalvataggio();
      var y = window.pageYOffset;
      renderAtto(stato.atto, true);
      requestAnimationFrame(function () { window.scrollTo(0, y); });
    }
  }

  function apriEditore(item) {
    if (!item || !item.edit) return;
    if (editore) {
      if (editore.item === item) return;
      return;
    }
    var p = item.el;
    p.classList.add('nascondi-testo');
    var wrap = creaEl('div', 'editore');
    var lab = creaEl('div', 'editore-etichetta');
    lab.textContent = etichettaCampo(item.edit.field);
    wrap.appendChild(lab);
    var ta = document.createElement('textarea');
    ta.className = 'editore-ta';
    ta.value = item.text;
    var righe = (item.text.match(/\n/g) || []).length + 1;
    ta.rows = Math.max(3, Math.min(righe, 14));
    wrap.appendChild(ta);
    var bar = creaEl('div', 'editore-bar');
    var bAnn = creaEl('button', 'editore-btn');
    bAnn.type = 'button';
    bAnn.textContent = 'Annulla';
    bAnn.addEventListener('click', function () { chiudiEditore(); });
    var bSal = creaEl('button', 'editore-btn editore-primario');
    bSal.type = 'button';
    bSal.textContent = 'Salva';
    bSal.addEventListener('click', function () { salvaEditore(); });
    bar.appendChild(bAnn);
    bar.appendChild(bSal);
    wrap.appendChild(bar);
    p.parentNode.insertBefore(wrap, p.nextSibling);
    editore = { item: item, wrap: wrap, ta: ta };
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); chiudiEditore(); }
      else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); salvaEditore(); }
    });
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  function toggleModifica() {
    stato.modifica = !stato.modifica;
    if (stato.modifica) {
      if (stato.studio) {
        stato.studio = false;
        aggiornaStudio();
      }
    } else {
      chiudiEditore();
    }
    document.body.classList.toggle('modifica', stato.modifica);
    dom.btnModifica.classList.toggle('attivo', stato.modifica);
    if (stato.modifica) mostraToast('Modifica: clicca su un testo per cambiarlo. Esc annulla, Ctrl+Invio salva.');
  }

  function aggiornaStatoSalvataggio() {
    dom.btnSalva.disabled = !stato.sporco;
    var info = dati ? nomeFile : 'Nessun copione caricato.';
    if (dati && stato.sporco) info += ' (modifiche non salvate)';
    dom.infoFile.textContent = info;
  }

  function mostraToast(msg, lungo) {
    dom.toast.textContent = msg;
    dom.toast.classList.remove('nascosto');
    clearTimeout(mostraToast._t);
    mostraToast._t = setTimeout(function () { dom.toast.classList.add('nascosto'); }, lungo ? 4000 : 2200);
  }

  function leggiTestoJson(testo) {
    var obj;
    try {
      obj = JSON.parse(testo);
    } catch (err) {
      if (dom.sovrapposta && !dom.sovrapposta.classList.contains('nascosto')) {
        dom.avvisoApertura.textContent = 'File JSON non valido: ' + err.message;
      } else {
        mostraToast('Errore: ' + err.message, true);
      }
      return;
    }
    if (!obj || !Array.isArray(obj.struttura_sceneggiatura)) {
      if (dom.sovrapposta && !dom.sovrapposta.classList.contains('nascosto')) {
        dom.avvisoApertura.textContent = 'Il file non contiene un copione valido (manca struttura_sceneggiatura).';
      }
      return;
    }
    dati = obj;
    var lista = dati.struttura_sceneggiatura;
    var ordine = [];
    var gruppi = {};
    lista.forEach(function (r) {
      var a = (r.atto || 'ATTO').trim();
      if (!gruppi[a]) { gruppi[a] = []; ordine.push(a); }
      gruppi[a].push(r);
    });
    atti = ordine.map(function (a) {
      return {
        titolo: a,
        elementi: gruppi[a].map(function (r) {
          return { tipo: (r.tipo || 'didascalia'), raw: r };
        })
      };
    });
    costruisciCaratteri();

    stato.atto = 0;
    stato.filtro = {};
    stato.ricerca = '';
    stato.sporco = false;
    stato.studio = false;
    stato.modifica = false;
    stato.mVis = [];
    stato.mCur = -1;
    document.body.classList.remove('modifica');
    dom.campoRicerca.value = '';
    dom.btnModifica.classList.remove('attivo');
    dom.campoRicerca.disabled = false;
    dom.btnStudio.disabled = false;
    dom.btnModifica.disabled = false;
    dom.btnSalva.disabled = true;
    dom.btnFile.disabled = false;
    if (dom.sovrapposta) dom.sovrapposta.classList.add('nascosto');
    aggiornaStatoSalvataggio();
    aggiornaChip();
    scrittura();
    aggiornaStudio();
    mostraToast('Copione caricato: ' + nomeFile);
  }

  function scrittura() {
    if (!dati) return;
    dom.titolo.textContent = dati.titolo || '';
    dom.sottotitolo.textContent = dati.tipo_opera || '';
    dom.autore.textContent = dati.autore ? ('di ' + dati.autore) : '';
    document.title = ((dati.titolo || '') ? dati.titolo + ' — ' : '') + 'Copione';
    disegnaTabs();
    disegnaPersonaggi();
    renderAtto(stato.atto);
  }

  function applicaPercorsoHandle(h) {
    handle = h;
    nomeFile = (h && h.name) ? h.name : nomeFile;
    salvaHandleDb(h);
    return caricaDaHandle(h);
  }

  function caricaDaHandle(h) {
    return h.getFile().then(function (f) { return f.text(); }).then(leggiTestoJson);
  }

  function salvaFile() {
    if (editore) salvaEditore();
    if (!dati) return;
    ricostruisciStruttura();
    var json = JSON.stringify(dati, null, 2);
    if (handle && handle.createWritable) {
      handle.createWritable().then(function (w) {
        return w.write(json).then(function () { return w.close(); });
      }).then(function () {
        stato.sporco = false;
        aggiornaStatoSalvataggio();
        mostraToast('Salvato su ' + nomeFile, true);
      }).catch(function (err) {
        mostraToast('Errore di salvataggio: ' + err.message, true);
      });
    } else {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nomeFile;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      stato.sporco = false;
      aggiornaStatoSalvataggio();
      mostraToast('Scaricato ' + nomeFile + ' (apri la pagina tramite server o Chrome/Edge per scrivere sul file).', true);
    }
  }

  function apriConPicker() {
    dom.avvisoApertura.textContent = '';
    if (window.showOpenFilePicker) {
      var tipi = [{ description: 'Copione JSON', accept: { 'application/json': ['.json'] } }];
      window.showOpenFilePicker({ types: tipi, multiple: false })
        .then(function (handles) { return applicaPercorsoHandle(handles[0]); })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          dom.avvisoApertura.textContent = 'Impossibile aprire il file: ' + (err && err.message ? err.message : err);
        });
    } else {
      dom.inputFile.click();
    }
  }

  function ripresa() {
    if (!handle) return;
    dom.avvisoApertura.textContent = '';
    var permesso = handle.requestPermission ? handle.requestPermission({ mode: 'readwrite' }) : Promise.resolve('granted');
    permesso.then(function (esito) {
      if (esito === 'granted') return caricaDaHandle(handle);
      dom.avvisoApertura.textContent = 'Accesso al file non consentito. Scegli di nuovo il file.';
    }).catch(function (err) {
      dom.avvisoApertura.textContent = 'Impossibile riprendere il file: ' + (err && err.message ? err.message : err);
    });
  }

  function apriFileDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('no idb')); return; }
      var req = indexedDB.open('copione-extractor', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('handle')) db.createObjectStore('handle');
      };
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction('handle', 'readonly');
        var get = tx.objectStore('handle').get('ultimo');
        get.onsuccess = function () { resolve(get.result || null); };
        get.onerror = function () { reject(get.error); };
      };
      req.onerror = function () { reject(req.error); };
    });
  }

  function scaricaTesto(nome, testo, mime) {
    var blob = new Blob([testo], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function templateCopione() {
    return {
      titolo: 'TITOLO DELLA COMMEDIA',
      tipo_opera: 'COMMEDIA IN UN ATTO',
      autore: 'AUTORE',
      descrizione: 'Scrivi qui la sinossi della commedia.',
      personaggi: [
        { nome: 'Personaggio 1', descrizione: 'breve descrizione' },
        { nome: 'Personaggio 2', descrizione: 'breve descrizione' }
      ],
      ambientazione_generale: 'Scrivi qui la descrizione dell\u2019ambientazione scenica.',
      struttura_sceneggiatura: [
        { atto: 'ATTO I', tipo: 'musica', didascalia_musicale: 'APERTURA MUSICALE' },
        { atto: 'ATTO I', tipo: 'didascalia', testo: '(Entra Personaggio 1 in scena)' },
        { atto: 'ATTO I', tipo: 'battuta', personaggio: 'Personaggio 1', didascalia_scenica: '(a Personaggio 2)', testo: 'PRIMA BATTUTA DEL COPIONE.' },
        { atto: 'ATTO I', tipo: 'battuta', personaggio: 'Personaggio 2', testo: 'SECONDA BATTUTA.' },
        { atto: 'ATTO I', tipo: 'fine_atto', testo: 'FINE I ATTO' }
      ]
    };
  }

  function scaricaTemplate() {
    scaricaTesto('template_copione.json', JSON.stringify(templateCopione(), null, 2));
    mostraToast('Template scaricato: template_copione.json', true);
  }

  function scaricaSchema() {
    fetch('copione.schema.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (testo) {
        scaricaTesto('copione.schema.json', testo);
        mostraToast('Schema scaricato: copione.schema.json', true);
      })
      .catch(function () {
        mostraToast('Apri la pagina tramite server locale (es. python -m http.server) per scaricare lo schema.', true);
      });
  }

  function salvaHandleDb(h) {
    if (!h || !window.indexedDB) return;
    try {
      var req = indexedDB.open('copione-extractor', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('handle')) db.createObjectStore('handle');
      };
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction('handle', 'readwrite');
        tx.objectStore('handle').put(h, 'ultimo');
      };
    } catch (e) { }
  }

  function legaEventi() {
    dom.btnTema.addEventListener('click', function () {
      stato.tema = stato.tema === 'scuro' ? 'chiaro' : 'scuro';
      document.body.dataset.tema = stato.tema;
      salvaImpostazioni();
    });

    dom.fontMeno.addEventListener('click', function () {
      if (stato.fontStep > -2) { stato.fontStep--; document.documentElement.style.fontSize = (16 + stato.fontStep) + 'px'; salvaImpostazioni(); }
    });
    dom.fontPiu.addEventListener('click', function () {
      if (stato.fontStep < 5) { stato.fontStep++; document.documentElement.style.fontSize = (16 + stato.fontStep) + 'px'; salvaImpostazioni(); }
    });

    dom.btnTutti.addEventListener('click', annullaFiltro);
    dom.btnAnnulla.addEventListener('click', annullaFiltro);

    dom.campoRicerca.addEventListener('input', function () {
      stato.ricerca = dom.campoRicerca.value;
      renderVisibilita();
    });
    dom.btnPrec.addEventListener('click', function () { vaiARisultato(-1); });
    dom.btnSucc.addEventListener('click', function () { vaiARisultato(1); });

    dom.btnStudio.addEventListener('click', avviaStudio);
    dom.studioUscita.addEventListener('click', function () {
      stato.studio = false;
      aggiornaStudio();
    });
    dom.studioPrec.addEventListener('click', function () { studioVai(-1); });
    dom.studioSucc.addEventListener('click', function () { studioVai(1); });
    dom.studioRivelaTutte.addEventListener('change', aggiornaStudio);
    dom.studioPersonaggio.addEventListener('change', function () {
      stato.studioPersona = dom.studioPersonaggio.value || null;
      stato.studioIdx = 0;
      stato.rivelate = {};
      aggiornaStudio();
      if (scena && scena.battute.length) scena.battute[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    dom.btnModifica.addEventListener('click', toggleModifica);
    dom.btnSalva.addEventListener('click', salvaFile);
    dom.btnFile.addEventListener('click', function () {
      dom.sovrapposta.classList.remove('nascosto');
      dom.avvisoApertura.textContent = '';
    });
    dom.btnApertura.addEventListener('click', apriConPicker);
    dom.btnRipristina.addEventListener('click', ripresa);
    dom.sovrapposta.addEventListener('click', function (ev) {
      if (!dati) return;
      if (ev.target === dom.sovrapposta) dom.sovrapposta.classList.add('nascosto');
    });

    dom.btnNuovoPersonaggio.addEventListener('click', function () {
      dom.formNuovoPersonaggio.classList.toggle('nascosto');
      if (!dom.formNuovoPersonaggio.classList.contains('nascosto')) dom.npNome.focus();
    });
    dom.npAnnulla.addEventListener('click', function () {
      dom.formNuovoPersonaggio.classList.add('nascosto');
      dom.npNome.value = '';
      dom.npRuolo.value = '';
    });
    dom.npSalva.addEventListener('click', function () {
      var nome = (dom.npNome.value || '').trim();
      if (!nome) { mostraToast('Indica il nome del personaggio.'); return; }
      aggiungiPersonaggio(nome, (dom.npRuolo.value || '').trim());
      dom.formNuovoPersonaggio.classList.add('nascosto');
      dom.npNome.value = '';
      dom.npRuolo.value = '';
    });
    dom.npNome.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); dom.npSalva.click(); }
    });
    dom.btnAggiungi.addEventListener('click', function () { apriAggiunta(null); });
    dom.btnTplCopione.addEventListener('click', scaricaTemplate);
    dom.btnTplSchema.addEventListener('click', scaricaSchema);

    dom.inputFile.addEventListener('change', function () {
      var f = dom.inputFile.files && dom.inputFile.files[0];
      if (!f) return;
      handle = null;
      nomeFile = f.name;
      var rd = new FileReader();
      rd.onload = function () { leggiTestoJson(rd.result); };
      rd.onerror = function () {
        dom.avvisoApertura.textContent = 'Lettura del file non riuscita.';
      };
      rd.readAsText(f, 'utf-8');
      dom.inputFile.value = '';
    });

    dom.copione.addEventListener('click', function (ev) {
      if (stato.modifica) {
        var btn = ev.target.closest ? ev.target.closest('.blocco-azioni button') : null;
        if (btn) {
          var rec = recDaTarget(ev.target);
          if (rec) {
            if (btn.dataset.azione === 'aggiungi') apriAggiunta(rec);
            else if (btn.dataset.azione === 'elimina') eliminaElemento(rec);
            else if (btn.dataset.azione === 'modifica') apriRigaEditor(rec);
          }
          return;
        }
        var p = ev.target.closest ? ev.target.closest('[data-edit]') : null;
        if (!p) return;
        var items = scena.items.filter(function (it) { return it.el === p; });
        if (items.length) {
          var rec2 = items[0].rec;
          if (rec2 && rec2.srcIdx !== undefined && rec2.srcIdx >= 0) {
            apriRigaEditor(rec2);
          } else {
            apriEditore(items[0]);
          }
        }
        return;
      }
      var b = ev.target.closest ? ev.target.closest('.battuta') : null;
      if (!b) return;
      var idx = parseInt(b.dataset.idx, 10);
      if (stato.studio) {
        var rec = scena.records[idx];
        if (!rec) return;
        var bb = scena.battute.indexOf(rec);
        if (bb !== -1) {
          stato.studioIdx = bb;
          var persona = stato.studioPersona;
          if (persona && rec.canon === persona) {
            var k = chiaveBlocco(stato.atto, idx);
            if (stato.rivelate[k]) delete stato.rivelate[k];
            else stato.rivelate[k] = true;
          }
          aggiornaStudio();
        }
      }
    });

    dom.copione.addEventListener('dragstart', function (ev) {
      var g = ev.target.closest ? ev.target.closest('.blocco-grip') : null;
      if (!g || !stato.modifica) return;
      var rec = recDaTarget(g);
      if (!rec) return;
      dragEl = elementoDaRec(rec);
      if (!dragEl) { dragEl = null; return; }
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(rec.srcIdx));
      g.classList.add('trascinando');
    });

    dom.copione.addEventListener('dragover', function (ev) {
      if (!stato.modifica || !dragEl) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      var rec = recDaTarget(ev.target);
      if (rec && rec.srcIdx !== undefined && rec.srcIdx >= 0) {
        if (dropTarget && dropTarget !== rec) dropTarget.el.classList.remove('drop-mira');
        dropTarget = rec;
        rec.el.classList.add('drop-mira');
      }
    });

    dom.copione.addEventListener('dragleave', function (ev) {
      if (dropTarget) {
        dropTarget.el.classList.remove('drop-mira');
        dropTarget = null;
      }
    });

    dom.copione.addEventListener('drop', function (ev) {
      ev.preventDefault();
      if (!stato.modifica || !dragEl) return;
      var rec = recDaTarget(ev.target);
      if (dropTarget) { dropTarget.el.classList.remove('drop-mira'); dropTarget = null; }
      var arr = atti[stato.atto].elementi;
      if (rec && rec.srcIdx === undefined) {
        var primo = arr.length ? arr[0] : null;
        spostaElemento(dragEl, primo, false);
      } else if (rec) {
        var dopo = false;
        var r = rec.el.getBoundingClientRect();
        dopo = ev.clientY > r.top + r.height / 2;
        var target = rec && rec.srcIdx !== undefined ? elementoDaRec(rec) : null;
        spostaElemento(dragEl, target, dopo);
      } else {
        spostaElemento(dragEl, null, false);
      }
      dragEl = null;
    });

    dom.copione.addEventListener('dragend', function (ev) {
      dom.copione.querySelectorAll('.blocco-grip.trascinando').forEach(function (g) { g.classList.remove('trascinando'); });
      if (dropTarget) { dropTarget.el.classList.remove('drop-mira'); dropTarget = null; }
      dragEl = null;
    });

    dom.zonaAggiungi.addEventListener('dragover', function (ev) {
      if (!stato.modifica || !dragEl) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      dom.zonaAggiungi.classList.add('drop-mira');
    });
    dom.zonaAggiungi.addEventListener('dragleave', function () {
      dom.zonaAggiungi.classList.remove('drop-mira');
    });
    dom.zonaAggiungi.addEventListener('drop', function (ev) {
      ev.preventDefault();
      if (!stato.modifica || !dragEl) return;
      dom.zonaAggiungi.classList.remove('drop-mira');
      spostaElemento(dragEl, null, false);
      dragEl = null;
    });

    document.addEventListener('keydown', function (ev) {
      if (editore) return;
      if (!stato.studio || isFormTarget(ev.target)) return;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); studioVai(1); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); studioVai(-1); }
      else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); studioRevealCorrente(); }
    });

    window.addEventListener('beforeunload', function (ev) {
      if (!stato.sporco) return;
      ev.preventDefault();
      ev.returnValue = '';
    });
  }

  function tentaAutomatico() {
    apriFileDb().then(function (h) {
      if (h && h.name && h.queryPermission) {
        handle = h;
        nomeFile = h.name;
        return h.queryPermission({ mode: 'readwrite' }).then(function (esito) {
          if (esito === 'granted') {
            return caricaDaHandle(h).then(function () { return true; });
          }
          dom.btnRipristina.classList.remove('nascosto');
          dom.nomeRipristina.textContent = h.name;
          dom.sovrapposta.classList.remove('nascosto');
          return true;
        });
      }
      if (/^https?:/i.test(location.protocol)) {
        return fetch('copione_strutturato.json', { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
          .then(leggiTestoJson)
          .catch(function () {
            dom.sovrapposta.classList.remove('nascosto');
          });
      }
      dom.sovrapposta.classList.remove('nascosto');
      return true;
    }).catch(function () {
      dom.sovrapposta.classList.remove('nascosto');
    });
  }

  leggiImpostazioni();
  legaEventi();
  aggiornaStatoSalvataggio();
  tentaAutomatico();
})();
