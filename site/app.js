/* AI Radar — legge i JSON in data/ e disegna la pagina. Nessuna dipendenza oltre a D3. */
(function () {
  "use strict";

  // ------------------------------------------------------------ locale e formati
  const IT = d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["", " €"] });
  const TIT = d3.timeFormatLocale({
    dateTime: "%A %e %B %Y, %X", date: "%d/%m/%Y", time: "%H:%M:%S", periods: ["AM", "PM"],
    days: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
    shortDays: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"],
    months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    shortMonths: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  });
  const fInt = IT.format(",d");
  const f1 = IT.format(",.1f");
  const f2 = IT.format(",.2f");
  const fPct0 = (v) => IT.format(".0%")(v);
  const fSigned = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + IT.format(".0%")(Math.abs(v));
  const fCompact = (v) => {
    if (v == null) return "—";
    const a = Math.abs(v);
    if (a >= 1e9) return f1(v / 1e9) + " mld";
    if (a >= 1e6) return f1(v / 1e6) + " mln";
    if (a >= 1e4) return f1(v / 1e3) + " mila";
    return fInt(v);
  };
  const fDay = TIT.format("%-d %b %Y");
  const fDayLong = TIT.format("%-d %B %Y");
  const fMonth = TIT.format("%b %Y");
  const fMonthShort = TIT.format("%b");
  const parseDay = d3.utcParse("%Y-%m-%d");
  const parseMonth = d3.utcParse("%Y-%m");
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const pow10 = (v) => "10" + String(Math.round(Math.log10(v))).split("").map((c) => SUP[c]).join("");

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  };
  const link = (href, text) => {
    const a = el("a", null, text);
    if (/^https?:\/\//.test(href || "")) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
    return a;
  };
  const empty = (node, msg) => { node.replaceChildren(el("div", "empty", msg)); };

  const REGION_COLOR = { USA: "--s1", Cina: "--s2", UE: "--s3", "Regno Unito": "--s4", Altri: "--other" };
  const SOURCE_NAMES = {
    epoch: "Epoch AI · modelli notevoli",
    artificial_analysis: "Artificial Analysis · capacità e prezzi",
    arxiv: "arXiv · paper",
    github: "GitHub · repository",
    huggingface: "Hugging Face · modelli di tendenza",
    adzuna: "Adzuna · annunci di lavoro",
    eurostat: "Eurostat · imprese che usano l'AI",
    feeds: "Feed RSS · notizie",
    radar: "Radar delle competenze (calcolo)",
  };

  // ------------------------------------------------------------ tooltip
  const tip = $("tip");
  function showTip(evt, header, rows) {
    tip.replaceChildren();
    if (header) tip.append(el("div", "t-h", header));
    for (const r of rows) {
      const row = el("div", "t-row");
      if (r.color) { const k = el("span", "t-key"); k.style.background = r.color; row.append(k); }
      row.append(el("span", "t-v", r.value));
      if (r.label) row.append(el("span", null, r.label));
      tip.append(row);
    }
    tip.style.opacity = 1;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = evt.clientY - h - pad;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  }
  const hideTip = () => { tip.style.opacity = 0; };

  // ------------------------------------------------------------ tabelle
  function table(container, columns, rows, opts = {}) {
    const wrap = el("div", "tbl-wrap");
    const t = el("table");
    const thead = el("thead"), tr = el("tr");
    let sortKey = opts.sortKey || null, sortDir = opts.sortDir || -1;
    const tbody = el("tbody");
    columns.forEach((c) => {
      const th = el("th", c.num ? "num" : null);
      if (opts.sortable && c.sort) {
        const b = el("button", null, c.label);
        b.addEventListener("click", () => {
          sortDir = sortKey === c.key ? -sortDir : -1;
          sortKey = c.key;
          [...tr.children].forEach((h) => h.removeAttribute("aria-sort"));
          th.setAttribute("aria-sort", sortDir < 0 ? "descending" : "ascending");
          fill();
        });
        th.append(b);
      } else th.textContent = c.label;
      tr.append(th);
    });
    thead.append(tr);
    function fill() {
      const col = columns.find((c) => c.key === sortKey);
      // sortDir: -1 = decrescente, 1 = crescente; i valori mancanti vanno sempre in fondo.
      const data = col && col.sort ? rows.slice().sort((a, b) => {
        const va = col.sort(a), vb = col.sort(b);
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
      }) : rows;
      tbody.replaceChildren(...data.map((r) => {
        const row = el("tr");
        columns.forEach((c) => {
          const td = el("td", c.num ? "num" : null);
          const v = c.cell(r);
          if (v instanceof Node) td.append(v); else td.textContent = v == null ? "—" : v;
          row.append(td);
        });
        return row;
      }));
    }
    fill();
    t.append(thead, tbody);
    wrap.append(t);
    container.replaceChildren(wrap);
  }

  /** Aggiunge sotto un grafico il pulsante "Mostra i dati" con la tabella dei valori. */
  function dataToggle(card, columns, rows) {
    card.querySelectorAll(".data-toggle, .data-table").forEach((n) => n.remove());
    const b = el("button", "data-toggle", "Mostra i dati");
    b.setAttribute("aria-expanded", "false");
    const box = el("div", "data-table");
    box.hidden = true;
    table(box, columns, rows);
    b.addEventListener("click", () => {
      box.hidden = !box.hidden;
      b.setAttribute("aria-expanded", String(!box.hidden));
      b.textContent = box.hidden ? "Mostra i dati" : "Nascondi i dati";
    });
    const src = card.querySelector(".src");
    card.insertBefore(b, src);
    card.insertBefore(box, src);
  }

  /** Legenda inserita sopra il grafico (fuori dal nodo che viene ridisegnato). */
  function legend(chartNode, items) {
    const prev = chartNode.previousElementSibling;
    if (prev && prev.classList.contains("legend")) prev.remove();
    const lg = el("div", "legend");
    for (const it of items) {
      const s = el("span");
      const k = el("span", it.kind === "line" ? "key-line" : it.kind === "ring" ? "key-ring" : "key-dot");
      if (it.kind !== "ring") k.style.background = it.color;
      s.append(k, document.createTextNode(it.label));
      lg.append(s);
    }
    chartNode.parentElement.insertBefore(lg, chartNode);
  }

  // ------------------------------------------------------------ ridisegno al ridimensionamento
  const renderers = [];
  function chart(fn) { renderers.push(fn); fn(); }
  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderers.forEach((f) => f()), 150);
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => renderers.forEach((f) => f()));

  function svgIn(node, height) {
    node.replaceChildren();
    const w = Math.max(280, node.clientWidth);
    const svg = d3.select(node).append("svg").attr("viewBox", `0 0 ${w} ${height}`).attr("width", w).attr("height", height);
    return { svg, w, h: height };
  }

  /** Margine sinistro misurato sull'etichetta più larga dell'asse y. */
  function measure(svg, labels) {
    const t = svg.append("g").attr("class", "axis");
    let max = 0;
    labels.forEach((l) => { const n = t.append("text").text(l); max = Math.max(max, n.node().getComputedTextLength()); });
    t.remove();
    return Math.ceil(max);
  }

  // ============================================================ DATI
  const FILES = ["status", "epoch", "artificial_analysis", "arxiv", "github", "huggingface", "jobs", "eurostat", "news", "radar"];

  async function load() {
    const res = await Promise.allSettled(FILES.map((f) => fetch(`data/${f}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null))));
    const D = {};
    FILES.forEach((f, i) => { D[f] = res[i].status === "fulfilled" ? res[i].value : null; });
    return D;
  }

  // ============================================================ TESTATA E SINTESI
  function renderHeader(D) {
    const st = D.status;
    if (!st) { $("updated").textContent = "Dati non ancora disponibili: il primo aggiornamento non è ancora terminato."; return; }
    const fonti = Object.values(st.fonti || {});
    const ok = fonti.filter((f) => f.stato === "ok").length;
    $("updated").textContent = `Ultimo aggiornamento: ${fDayLong(new Date(st.aggiornato))} · ${ok} fonti su ${fonti.length} aggiornate`;
  }

  function tile(k, v, d, small) {
    const t = el("div", "tile");
    t.append(el("div", "tile-k", k));
    const vv = el("div", "tile-v" + (small ? " small" : ""));
    if (v instanceof Node) vv.append(v); else vv.textContent = v;
    t.append(vv);
    if (d) { const dd = el("div", "tile-d"); if (d instanceof Node) dd.append(d); else dd.textContent = d; t.append(dd); }
    return t;
  }

  function renderTiles(D) {
    const tiles = [];
    const rad = D.radar;
    if (rad) {
      const top = rad.competenze.filter((r) => r.quadrante === "impara-ora")
        .sort((a, b) => (b.slancio + b.domanda) - (a.slancio + a.domanda)).slice(0, 3);
      const placed = rad.competenze.filter((r) => r.quadrante).length;
      if (top.length) {
        const a = link("#formarsi", top.map((r) => r.nome).join(" · "));
        a.removeAttribute("target");
        tiles.push(tile("Da imparare ora", a, `Le prime ${top.length} su ${placed} competenze del radar`, true));
      }
    }
    const arx = D.arxiv;
    if (arx && arx.series && arx.series._totale) {
      const m = arx.mesi, s = arx.series._totale;
      const last = m[m.length - 1], v = s[last];
      let d = `${fMonth(parseMonth(last))}`;
      if (m.length >= 13 && s[m[m.length - 13]]) {
        const g = v / s[m[m.length - 13]] - 1;
        const span = el("span");
        span.append(document.createTextNode(fMonth(parseMonth(last)) + " · "), el("span", g >= 0 ? "delta-up" : "delta-down", fSigned(g)), document.createTextNode(" sull'anno prima"));
        d = span;
      }
      if (v != null) tiles.push(tile("Paper sull'AI in un mese", fInt(v), d));
    }
    const eu = D.eurostat;
    if (eu && eu.serie && eu.serie.EU27_2020) {
      const years = Object.keys(eu.serie.EU27_2020).sort();
      const y = years[years.length - 1];
      const it = eu.serie.IT && eu.serie.IT[y];
      tiles.push(tile("Imprese UE che usano l'AI", IT.format(".0f")(eu.serie.EU27_2020[y]) + "%", `${y}` + (it != null ? ` · Italia ${IT.format(".1f")(it)}%` : "")));
    }
    const aa = D.artificial_analysis;
    if (aa && aa.modelli && aa.modelli.length) {
      const m = aa.modelli[0];
      tiles.push(tile("Modello più capace oggi", m.nome, `${m.creatore || ""} · indice ${f1(m.indice)} su Artificial Analysis`, true));
    } else if (D.epoch) {
      const y = D.epoch.anno_in_corso;
      const byYear = d3.rollup(D.epoch.per_anno, (v) => d3.sum(v, (d) => d.n), (d) => d.anno);
      const recent = D.epoch.recenti && D.epoch.recenti[0];
      if (recent) tiles.push(tile("Ultimo modello notevole", recent.m, `${recent.o} · ${fDay(parseDay(recent.d))}`, true));
      else tiles.push(tile(`Modelli notevoli nel ${y}`, fInt(byYear.get(y) || 0), `${fInt(byYear.get(y - 1) || 0)} nel ${y - 1}`));
    }
    const box = $("tiles");
    if (!tiles.length) empty(box, "I primi dati arriveranno dopo il primo aggiornamento automatico.");
    else box.replaceChildren(...tiles);
  }

  // ============================================================ DOVE VA L'AI
  function renderCompute(D) {
    const node = $("chart-compute"), card = $("card-compute");
    const ep = D.epoch;
    if (!ep || !ep.punti || !ep.punti.length) return empty(node, "Dati di Epoch AI non ancora disponibili.");
    const pts = ep.punti.map((p) => ({ ...p, date: parseDay(p.d), g: ["USA", "Cina", "UE"].includes(p.a) ? p.a : "Altri" }))
      .filter((p) => p.date && p.c);
    const groups = ["Altri", "UE", "Cina", "USA"];
    const top = pts.slice().sort((a, b) => b.c - a.c).slice(0, 1); // solo il più grande: i successivi sono sempre ammassati

    chart(() => {
      const H = node.clientWidth < 520 ? 300 : 380;
      const { svg, w } = svgIn(node, H);
      const yDomain = d3.extent(pts, (p) => p.c);
      const y = d3.scaleLog([yDomain[0] / 2, yDomain[1] * 3], [H - 28, 12]);
      const ticks = y.ticks().filter((t) => Math.abs(Math.log10(t) - Math.round(Math.log10(t))) < 1e-9 && Math.round(Math.log10(t)) % 2 === 0);
      const ml = measure(svg, ticks.map(pow10)) + 10;
      const x = d3.scaleUtc(d3.extent(pts, (p) => p.date), [ml, w - 10]).nice();
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`)
        .call(d3.axisLeft(y).tickValues(ticks).tickSize(-(w - ml - 10)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`)
        .call(d3.axisLeft(y).tickValues(ticks).tickFormat(pow10).tickSize(0).tickPadding(8))
        .call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`)
        .call(d3.axisBottom(x).ticks(w < 520 ? 4 : 8).tickFormat(d3.utcFormat("%Y")).tickSizeOuter(0))
        .attr("font-size", null).attr("font-family", null);

      const color = (g) => css(REGION_COLOR[g]);
      for (const g of groups) {
        const sel = pts.filter((p) => p.g === g);
        svg.append("g").selectAll("circle").data(sel).join("circle")
          .attr("cx", (p) => x(p.date)).attr("cy", (p) => y(p.c))
          .attr("r", (p) => (p.f ? 5 : 3.2))
          .attr("fill", (p) => (p.f ? css("--surface") : color(g)))
          .attr("fill-opacity", (p) => (p.f ? 1 : g === "Altri" ? 0.8 : 0.85))
          .attr("stroke", (p) => (p.f ? color(g) : css("--surface")))
          .attr("stroke-width", (p) => (p.f ? 2 : 0.8));
      }
      svg.append("g").selectAll("text").data(top).join("text")
        .attr("class", "lbl-ink halo").attr("x", (p) => x(p.date) - 8).attr("y", (p) => y(p.c) + 4)
        .attr("text-anchor", "end").text((p) => p.m);

      // Punto più vicino al puntatore (Delaunay), con area di aggancio ampia.
      const delaunay = d3.Delaunay.from(pts, (p) => x(p.date), (p) => y(p.c));
      const hl = svg.append("circle").attr("r", 7).attr("fill", "none").attr("stroke", css("--ink")).attr("stroke-width", 1.5).style("opacity", 0);
      svg.append("rect").attr("x", ml).attr("y", 0).attr("width", w - ml).attr("height", H - 28).attr("fill", "transparent")
        .on("pointermove", (evt) => {
          const [mx, my] = d3.pointer(evt);
          const i = delaunay.find(mx, my);
          const p = pts[i];
          if (Math.hypot(x(p.date) - mx, y(p.c) - my) > 40) { hl.style("opacity", 0); return hideTip(); }
          hl.attr("cx", x(p.date)).attr("cy", y(p.c)).style("opacity", 1);
          showTip(evt, `${p.o} · ${fDay(p.date)}`, [
            { value: p.m, color: color(p.g) },
            { value: (() => { const e = Math.floor(Math.log10(p.c)); return f1(p.c / 10 ** e) + " × " + pow10(10 ** e); })(), label: "FLOP" },
            ...(p.f ? [{ value: "Modello di frontiera" }] : []),
          ]);
        })
        .on("pointerleave", () => { hl.style("opacity", 0); hideTip(); });
    });
    legend(node, [
      { label: "USA", color: "var(--s1)" }, { label: "Cina", color: "var(--s2)" }, { label: "UE", color: "var(--s3)" },
      { label: "Resto del mondo", color: "var(--other)" }, { label: "Modello di frontiera", kind: "ring" },
    ]);
    dataToggle(card, [
      { label: "Modello", cell: (p) => p.m }, { label: "Organizzazione", cell: (p) => p.o },
      { label: "Data", cell: (p) => p.d }, { label: "Area", cell: (p) => p.a },
      { label: "FLOP", num: true, cell: (p) => p.c.toExponential(2) },
    ], pts.slice().reverse());
  }

  function renderAA(D) {
    const node = $("chart-aa"), card = $("card-aa");
    const aa = D.artificial_analysis;
    if (!aa || !aa.modelli || !aa.modelli.length) {
      return empty(node, "Per questo grafico serve una chiave gratuita di Artificial Analysis (AA_API_KEY nei secret del repository).");
    }
    const pts = aa.modelli.filter((m) => m.prezzo > 0 && m.indice != null);
    const labelled = new Set(pts.slice(0, 4).map((m) => m.nome));
    chart(() => {
      const H = 300;
      const { svg, w } = svgIn(node, H);
      const y = d3.scaleLinear(d3.extent(pts, (m) => m.indice), [H - 28, 12]).nice();
      const ml = measure(svg, y.ticks(5).map((t) => fInt(t))) + 10;
      const x = d3.scaleLog(d3.extent(pts, (m) => m.prezzo), [ml, w - 12]).nice();
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(w - ml - 12)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8)).call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`)
        .call(d3.axisBottom(x).ticks(4, (v) => "$" + IT.format("~g")(v)).tickSizeOuter(0)).attr("font-size", null).attr("font-family", null);
      svg.append("g").selectAll("circle").data(pts).join("circle")
        .attr("cx", (m) => x(m.prezzo)).attr("cy", (m) => y(m.indice)).attr("r", 4.5)
        .attr("fill", css("--s1")).attr("fill-opacity", 0.85).attr("stroke", css("--surface")).attr("stroke-width", 1);
      svg.append("g").selectAll("text").data(pts.filter((m) => labelled.has(m.nome))).join("text")
        .attr("class", "lbl-ink halo").attr("x", (m) => x(m.prezzo) + 8).attr("y", (m) => y(m.indice) + 4)
        .attr("text-anchor", (m) => (x(m.prezzo) > w * 0.7 ? "end" : "start"))
        .attr("dx", (m) => (x(m.prezzo) > w * 0.7 ? -16 : 0)).text((m) => m.nome);
      const delaunay = d3.Delaunay.from(pts, (m) => x(m.prezzo), (m) => y(m.indice));
      svg.append("rect").attr("x", ml).attr("width", w - ml).attr("height", H - 28).attr("fill", "transparent")
        .on("pointermove", (evt) => {
          const [mx, my] = d3.pointer(evt);
          const m = pts[delaunay.find(mx, my)];
          if (Math.hypot(x(m.prezzo) - mx, y(m.indice) - my) > 36) return hideTip();
          showTip(evt, m.creatore || "", [
            { value: m.nome, color: css("--s1") },
            { value: f1(m.indice), label: "indice di intelligenza" },
            { value: "$" + f2(m.prezzo), label: "per milione di token" },
            ...(m.velocita ? [{ value: fInt(m.velocita), label: "token al secondo" }] : []),
          ]);
        }).on("pointerleave", hideTip);
    });
    dataToggle(card, [
      { label: "Modello", cell: (m) => m.nome }, { label: "Creatore", cell: (m) => m.creatore },
      { label: "Indice", num: true, cell: (m) => f1(m.indice) }, { label: "$ / mln token", num: true, cell: (m) => (m.prezzo ? f2(m.prezzo) : "—") },
    ], aa.modelli);
  }

  /** Linea mensile con mirino e valore dell'ultimo punto. */
  function monthlyLine(node, rows, valueLabel, color) {
    chart(() => {
      const H = 240;
      const { svg, w } = svgIn(node, H);
      const y = d3.scaleLinear([0, d3.max(rows, (r) => r.v) * 1.12], [H - 28, 12]).nice();
      const ml = measure(svg, y.ticks(4).map(fCompact)) + 10;
      const x = d3.scaleUtc(d3.extent(rows, (r) => r.date), [ml, w - 56]);
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(w - ml - 56)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(fCompact).tickSize(0).tickPadding(8)).call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`)
        .call(d3.axisBottom(x).ticks(w < 480 ? 4 : 7).tickFormat((d) => (d.getUTCMonth() === 0 ? d3.utcFormat("%Y")(d) : fMonthShort(d))).tickSizeOuter(0))
        .attr("font-size", null).attr("font-family", null);
      svg.append("path").datum(rows).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2)
        .attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
        .attr("d", d3.line((r) => x(r.date), (r) => y(r.v)));
      const last = rows[rows.length - 1];
      svg.append("circle").attr("cx", x(last.date)).attr("cy", y(last.v)).attr("r", 4).attr("fill", color);
      svg.append("text").attr("class", "lbl-strong").attr("x", x(last.date) + 8).attr("y", y(last.v) + 4).text(fCompact(last.v));
      const rule = svg.append("line").attr("y1", 12).attr("y2", H - 28).attr("stroke", css("--axis")).style("opacity", 0);
      const dot = svg.append("circle").attr("r", 4.5).attr("fill", color).attr("stroke", css("--surface")).attr("stroke-width", 2).style("opacity", 0);
      const bis = d3.bisector((r) => r.date).center;
      svg.append("rect").attr("x", ml).attr("width", w - ml).attr("height", H - 28).attr("fill", "transparent")
        .on("pointermove", (evt) => {
          const r = rows[bis(rows, x.invert(d3.pointer(evt)[0]))];
          rule.attr("x1", x(r.date)).attr("x2", x(r.date)).style("opacity", 1);
          dot.attr("cx", x(r.date)).attr("cy", y(r.v)).style("opacity", 1);
          showTip(evt, fMonth(r.date), [{ value: fInt(r.v), label: valueLabel, color }]);
        })
        .on("pointerleave", () => { rule.style("opacity", 0); dot.style("opacity", 0); hideTip(); });
    });
  }

  function renderArxivTotal(D) {
    const node = $("chart-arxiv-total"), card = $("card-arxiv-total");
    const a = D.arxiv;
    if (!a || !a.series || !a.series._totale) return empty(node, "Dati di arXiv non ancora disponibili.");
    const rows = a.mesi.filter((m) => a.series._totale[m] != null).map((m) => ({ m, date: parseMonth(m), v: a.series._totale[m] }));
    if (rows.length < 2) return empty(node, "Serve almeno un altro mese di dati.");
    monthlyLine(node, rows, "paper", css("--s1"));
    dataToggle(card, [{ label: "Mese", cell: (r) => fMonth(r.date) }, { label: "Paper", num: true, cell: (r) => fInt(r.v) }], rows.slice().reverse());
  }

  function renderOpen(D) {
    const node = $("chart-open"), card = $("card-open");
    const ep = D.epoch;
    if (!ep || !ep.pesi_aperti) return empty(node, "Dati di Epoch AI non ancora disponibili.");
    const rows = ep.pesi_aperti.filter((r) => r.totale > 0).map((r) => ({ ...r, q: r.aperti / r.totale, partial: r.anno === ep.anno_in_corso }));
    chart(() => {
      const H = 240;
      const { svg, w } = svgIn(node, H);
      const y = d3.scaleLinear([0, Math.max(0.5, d3.max(rows, (r) => r.q) * 1.15)], [H - 28, 12]).nice();
      const ml = measure(svg, y.ticks(4).map(fPct0)) + 10;
      const x = d3.scaleBand(rows.map((r) => r.anno), [ml, w - 4]).padding(0.28);
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(w - ml - 4)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(fPct0).tickSize(0).tickPadding(8)).call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      const every = Math.ceil(rows.length / Math.max(3, Math.floor((w - ml) / 44)));
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`)
        .call(d3.axisBottom(x).tickValues(rows.map((r) => r.anno).filter((_, i) => (rows.length - 1 - i) % every === 0)).tickSizeOuter(0))
        .attr("font-size", null).attr("font-family", null);
      const bw = Math.min(32, x.bandwidth());
      const off = (x.bandwidth() - bw) / 2;
      svg.append("g").selectAll("path").data(rows).join("path")
        .attr("fill", css("--s1")).attr("fill-opacity", (r) => (r.partial ? 0.45 : 1))
        .attr("d", (r) => {
          const x0 = x(r.anno) + off, y0 = y(r.q), h = y(0) - y0, rr = Math.min(4, bw / 2, h);
          return `M${x0},${y(0)}V${y0 + rr}Q${x0},${y0} ${x0 + rr},${y0}H${x0 + bw - rr}Q${x0 + bw},${y0} ${x0 + bw},${y0 + rr}V${y(0)}Z`;
        })
        .on("pointermove", (evt, r) => showTip(evt, String(r.anno) + (r.partial ? " (anno in corso)" : ""), [
          { value: fPct0(r.q), label: "con pesi aperti", color: css("--s1") }, { value: `${fInt(r.aperti)} su ${fInt(r.totale)}`, label: "modelli" },
        ]))
        .on("pointerleave", hideTip);
    });
    dataToggle(card, [
      { label: "Anno", cell: (r) => r.anno + (r.partial ? " (in corso)" : "") },
      { label: "Pesi aperti", num: true, cell: (r) => fInt(r.aperti) }, { label: "Totale", num: true, cell: (r) => fInt(r.totale) },
      { label: "Quota", num: true, cell: (r) => fPct0(r.q) },
    ], rows.slice().reverse());
  }

  function renderRecent(D) {
    const box = $("table-recent");
    const ep = D.epoch;
    if (!ep || !ep.recenti) return empty(box, "Dati di Epoch AI non ancora disponibili.");
    table(box, [
      { label: "Modello", cell: (r) => { const s = el("span", null, r.m); s.append(el("span", "sub", r.o)); return s; } },
      { label: "Data", cell: (r) => fDay(parseDay(r.d)) },
      { label: "Area", cell: (r) => r.a },
      { label: "Accesso", cell: (r) => r.accesso || "n.d." },
    ], ep.recenti.slice(0, 8));
  }

  // ============================================================ STARE AL PASSO
  function renderNews(D) {
    const list = $("news"), chips = $("news-filter");
    const n = D.news;
    if (!n || !n.notizie || !n.notizie.length) { chips.replaceChildren(); return empty(list, "Notizie non ancora disponibili."); }
    let current = "Tutte";
    const sources = ["Tutte", ...Array.from(new Set(n.notizie.map((x) => x.fonte)))];
    function draw() {
      chips.replaceChildren(...sources.map((s) => {
        const b = el("button", "chip", s);
        b.setAttribute("aria-pressed", String(s === current));
        b.addEventListener("click", () => { current = s; draw(); });
        return b;
      }));
      const items = n.notizie.filter((x) => current === "Tutte" || x.fonte === current).slice(0, 24);
      list.replaceChildren(...items.map((x) => {
        const li = el("li");
        li.append(link(x.link, x.titolo), el("span", "meta", `${x.fonte} · ${fDay(parseDay(x.data))}`));
        return li;
      }));
    }
    draw();
    const err = Object.keys(n.errori || {});
    $("news-src").textContent = `Ultimi ${n.giorni} giorni dai feed di ${n.fonti.map((f) => f.nome).join(", ")}.` + (err.length ? ` Non raggiunti all'ultimo aggiornamento: ${err.join(", ")}.` : "");
  }

  function renderHF(D) {
    const box = $("table-hf");
    const hf = D.huggingface;
    if (!hf || !hf.top) return empty(box, "Dati di Hugging Face non ancora disponibili.");
    table(box, [
      { label: "Modello", cell: (m) => { const s = el("span"); s.append(link(m.url, m.id), el("span", "sub", m.tipo)); return s; } },
      { label: "Like", num: true, cell: (m) => fCompact(m.like) },
      { label: "Download", num: true, cell: (m) => fCompact(m.download) },
    ], hf.top.slice(0, 12));
  }

  function renderHFTypes(D) {
    const node = $("chart-hf-types"), card = $("card-hf-types");
    const hf = D.huggingface;
    if (!hf || !hf.tipi_top100) return empty(node, "Dati di Hugging Face non ancora disponibili.");
    const all = Object.entries(hf.tipi_top100).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
    const rows = all.slice(0, 7);
    const rest = d3.sum(all.slice(7), (r) => r.v);
    if (rest) rows.push({ k: "altri compiti", v: rest });
    chart(() => {
      const rowH = 30, H = rows.length * rowH + 8;
      const { svg, w } = svgIn(node, H);
      const ml = Math.min(w * 0.48, measure(svg, rows.map((r) => r.k)) + 12);
      const x = d3.scaleLinear([0, d3.max(rows, (r) => r.v)], [ml, w - 36]);
      const g = svg.append("g").selectAll("g").data(rows).join("g").attr("transform", (_, i) => `translate(0,${i * rowH + 4})`);
      g.append("text").attr("class", "lbl-ink").attr("x", ml - 10).attr("y", 15).attr("text-anchor", "end").text((r) => r.k);
      g.append("rect").attr("x", ml).attr("y", 4).attr("height", 16).attr("rx", 4)
        .attr("width", (r) => Math.max(2, x(r.v) - ml)).attr("fill", (r) => (r.k === "altri compiti" ? css("--other") : css("--s1")));
      g.append("text").attr("class", "lbl").attr("x", (r) => x(r.v) + 6).attr("y", 16).text((r) => fInt(r.v));
      g.append("rect").attr("width", w).attr("height", rowH).attr("fill", "transparent")
        .on("pointermove", (evt, r) => showTip(evt, r.k, [{ value: fInt(r.v), label: "modelli su 100" }])).on("pointerleave", hideTip);
    });
    $("card-hf-types").querySelector(".chart").style.minHeight = "0";
    dataToggle(card, [{ label: "Compito", cell: (r) => r.k }, { label: "Modelli", num: true, cell: (r) => fInt(r.v) }], all);
  }

  function renderRepos(D) {
    const box = $("table-repos");
    const gh = D.github;
    if (!gh || !gh.repos || !gh.repos.length) return empty(box, "Dati di GitHub non ancora disponibili.");
    const rows = gh.repos.map((r) => {
      const h = r.storico || [];
      const last = h[h.length - 1], prev = h.length > 1 ? h[h.length - 2] : null;
      return { ...r, stelle: last ? last.stelle : null, delta: prev ? last.stelle - prev.stelle : null, dal: prev ? prev.data : null };
    });
    const hasDelta = rows.some((r) => r.delta != null);
    table(box, [
      { label: "Repository", sort: (r) => r.repo.toLowerCase(), cell: (r) => { const s = el("span"); s.append(link(r.url, r.repo), el("span", "sub", r.descrizione)); return s; } },
      { key: "stelle", label: "Stelle", num: true, sort: (r) => r.stelle, cell: (r) => fCompact(r.stelle) },
      { key: "delta", label: "In 7 giorni", num: true, sort: (r) => r.delta,
        cell: (r) => (r.delta == null ? "—" : (r.delta >= 0 ? "+" : "−") + fInt(Math.abs(r.delta))) },
    ].map((c) => ({ ...c, key: c.key || c.label })), rows, { sortable: true, sortKey: hasDelta ? "delta" : "stelle", sortDir: -1 });
  }

  // ============================================================ SU COSA FORMARSI
  const QUAD_ORDER = { "impara-ora": 0, prova: 1, consolida: 2, osserva: 3 };
  /** Ordine unico per tabella e legenda numerata: quadrante, poi slancio + domanda. */
  function radarSorted(rad) {
    return rad.competenze.slice().sort((a, b) => (QUAD_ORDER[a.quadrante] ?? 9) - (QUAD_ORDER[b.quadrante] ?? 9)
      || ((b.slancio ?? 0) + (b.domanda ?? 0)) - ((a.slancio ?? 0) + (a.domanda ?? 0)));
  }

  function renderRadar(D) {
    const node = $("chart-radar"), card = $("card-radar");
    const rad = D.radar;
    if (!rad) return empty(node, "Il radar si calcola dopo il primo aggiornamento di arXiv e GitHub.");
    const rows = rad.competenze.filter((r) => r.slancio != null && r.domanda != null);
    if (!rows.length) return empty(node, "Il radar si calcola dopo il primo aggiornamento di arXiv e GitHub.");
    if (rad.base_domanda !== "lavoro") {
      $("radar-intro").textContent = "Ogni competenza è collocata in base a due misure: lo slancio (quanto cresce l'attenzione negli ultimi 3 mesi rispetto ai 3 precedenti, su ricerca e open source) e l'adozione (quanti nuovi progetti open source la usano).";
    }
    $("radar-note").textContent = rad.base_domanda === "lavoro"
      ? "Domanda misurata sugli annunci di lavoro in Europa e USA. Posizioni relative tra le competenze del radar: al centro la mediana."
      : "Senza la chiave di Adzuna la domanda è stimata dall'adozione open source (nuovi repository negli ultimi 3 mesi). Posizioni relative tra le competenze del radar: al centro la mediana.";

    chart(() => {
      const narrow = node.clientWidth < 560;
      const H = narrow ? 420 : 520;
      const { svg, w } = svgIn(node, H);
      const m = { l: 34, r: 16, t: 26, b: 50 };
      const x = d3.scaleLinear([-0.04, 1.04], [m.l, w - m.r]);
      const y = d3.scaleLinear([-0.04, 1.04], [H - m.b, m.t]);
      // quadranti
      const quad = [
        // nomi dei quadranti fuori dal riquadro, così non finiscono sotto i punti agli angoli
        { id: "consolida", x0: -0.04, x1: 0.5, y0: 0.5, y1: 1.04, anchor: "start", tx: m.l, ty: m.t - 8 },
        { id: "impara-ora", x0: 0.5, x1: 1.04, y0: 0.5, y1: 1.04, anchor: "end", tx: w - m.r, ty: m.t - 8 },
        { id: "osserva", x0: -0.04, x1: 0.5, y0: -0.04, y1: 0.5, anchor: "start", tx: m.l, ty: H - m.b + 16 },
        { id: "prova", x0: 0.5, x1: 1.04, y0: -0.04, y1: 0.5, anchor: "end", tx: w - m.r, ty: H - m.b + 16 },
      ];
      svg.append("g").selectAll("rect").data(quad).join("rect")
        .attr("x", (q) => x(q.x0)).attr("width", (q) => x(q.x1) - x(q.x0))
        .attr("y", (q) => y(q.y1)).attr("height", (q) => y(q.y0) - y(q.y1))
        .attr("fill", (q) => (q.id === "impara-ora" ? css("--q-impara") : "transparent"));
      svg.append("g").selectAll("text").data(quad).join("text")
        .attr("class", (q) => (q.id === "impara-ora" ? "lbl-strong" : "lbl")).attr("x", (q) => q.tx).attr("y", (q) => q.ty)
        .attr("text-anchor", (q) => q.anchor).text((q) => rad.quadranti[q.id].toUpperCase()).style("letter-spacing", ".06em");
      svg.append("line").attr("x1", x(0.5)).attr("x2", x(0.5)).attr("y1", y(1.04)).attr("y2", y(-0.04)).attr("stroke", css("--axis")).attr("stroke-dasharray", "4 4");
      svg.append("line").attr("x1", x(-0.04)).attr("x2", x(1.04)).attr("y1", y(0.5)).attr("y2", y(0.5)).attr("stroke", css("--axis")).attr("stroke-dasharray", "4 4");
      svg.append("rect").attr("x", x(-0.04)).attr("y", y(1.04)).attr("width", x(1.04) - x(-0.04)).attr("height", y(-0.04) - y(1.04)).attr("fill", "none").attr("stroke", css("--grid"));
      svg.append("text").attr("class", "lbl").attr("x", (x(-0.04) + x(1.04)) / 2).attr("y", H - 6).attr("text-anchor", "middle").text("Slancio: crescita nella ricerca e nell'open source →");
      svg.append("text").attr("class", "lbl").attr("transform", `translate(${m.l - 14},${(y(1.04) + y(-0.04)) / 2}) rotate(-90)`).attr("text-anchor", "middle")
        .text(rad.base_domanda === "lavoro" ? "Domanda nel lavoro →" : "Adozione open source →");

      // Etichette: per ogni punto si prova una serie di posizioni e si tiene la prima
      // che resta nel grafico e non tocca altre etichette, altri punti o i nomi dei quadranti.
      const nodes = rows.map((r) => ({ r, ax: x(r.slancio), ay: y(r.domanda) }));
      const probe = svg.append("g");
      nodes.forEach((n) => {
        const t = probe.append("text").attr("class", n.r.quadrante === "impara-ora" ? "lbl-strong" : "lbl-ink").text(n.r.nome);
        n.wd = t.node().getComputedTextLength();
      });
      const taken = [];
      svg.selectAll("text").each(function () {
        const b = this.getBBox();
        if (this.parentNode !== probe.node()) taken.push({ x0: b.x - 4, y0: b.y - 2, x1: b.x + b.width + 4, y1: b.y + b.height + 2 });
      });
      probe.remove();
      const LH = 14;
      nodes.forEach((n) => taken.push({ x0: n.ax - 8, y0: n.ay - 8, x1: n.ax + 8, y1: n.ay + 8 }));
      const hits = (b) => taken.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
      const inside = (b) => b.x0 >= m.l + 2 && b.x1 <= w - m.r - 2 && b.y0 >= m.t + 2 && b.y1 <= H - m.b - 2;
      const order = { "impara-ora": 0, prova: 1, consolida: 1, osserva: 2 };
      let failures = 0;
      nodes.slice().sort((a, b) => order[a.r.quadrante] - order[b.r.quadrante]).forEach((n) => {
        const W = n.wd;
        const cands = [];
        for (const k of [0, 1, 2]) {
          const d = 9 + k * LH; // distanza verticale per le posizioni sopra/sotto
          for (const off of k === 0 ? [0] : [-k * LH, k * LH]) {
            cands.push({ x0: n.ax + 10, y0: n.ay - LH / 2 + off }, { x0: n.ax - 10 - W, y0: n.ay - LH / 2 + off });
          }
          cands.push({ x0: n.ax - W / 2, y0: n.ay - d - LH }, { x0: n.ax - W / 2, y0: n.ay + d });
        }
        let best = null;
        for (const c of cands) {
          const b = { x0: c.x0, y0: c.y0, x1: c.x0 + W, y1: c.y0 + LH };
          if (inside(b) && !hits(b)) { best = b; break; }
        }
        if (!best) {
          failures++;
          const c = cands.find((c) => inside({ x0: c.x0, y0: c.y0, x1: c.x0 + W, y1: c.y0 + LH })) || cands[0];
          best = { x0: c.x0, y0: c.y0, x1: c.x0 + W, y1: c.y0 + LH };
        }
        n.box = best;
        taken.push(best);
      });
      // Se i nomi non entrano senza sovrapporsi (schermi stretti, punti ammassati)
      // si passa ai numeri, con la legenda numerata sotto il grafico.
      const key = $("radar-key");
      if (narrow || failures > 0) {
        const num = new Map(radarSorted(rad).map((r, i) => [r.id, i + 1]));
        const g = svg.append("g").selectAll("g").data(nodes).join("g").attr("transform", (n) => `translate(${n.ax},${n.ay})`);
        g.append("circle").attr("r", 10).attr("fill", (n) => (n.r.quadrante === "impara-ora" ? css("--s1") : css("--ink-2")))
          .attr("stroke", css("--surface")).attr("stroke-width", 2);
        g.append("text").attr("text-anchor", "middle").attr("y", 4).attr("fill", css("--surface"))
          .style("font", "600 11px " + css("--font")).text((n) => num.get(n.r.id));
        g.append("circle").attr("r", 16).attr("fill", "transparent")
          .on("pointermove", (evt, n) => showTip(evt, n.r.nome, [{ value: rad.quadranti[n.r.quadrante] }])).on("pointerleave", hideTip);
        key.replaceChildren(...radarSorted(rad).filter((r) => r.quadrante).map((r) => el("li", null, r.nome)));
        key.hidden = false;
        return;
      }
      key.hidden = true;
      // linea di richiamo solo se l'etichetta è lontana dal suo punto
      svg.append("g").selectAll("line").data(nodes.filter((n) => {
        const cx = Math.max(n.box.x0, Math.min(n.ax, n.box.x1)), cy = Math.max(n.box.y0, Math.min(n.ay, n.box.y1));
        return Math.hypot(cx - n.ax, cy - n.ay) > 16;
      })).join("line")
        .attr("x1", (n) => n.ax).attr("y1", (n) => n.ay)
        .attr("x2", (n) => Math.max(n.box.x0, Math.min(n.ax, n.box.x1))).attr("y2", (n) => Math.max(n.box.y0, Math.min(n.ay, n.box.y1)))
        .attr("stroke", css("--axis")).attr("stroke-width", 1);
      svg.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("cx", (n) => n.ax).attr("cy", (n) => n.ay).attr("r", 6)
        .attr("fill", (n) => (n.r.quadrante === "impara-ora" ? css("--s1") : css("--ink-2")))
        .attr("stroke", css("--surface")).attr("stroke-width", 2);
      svg.append("g").selectAll("text").data(nodes).join("text")
        .attr("class", (n) => (n.r.quadrante === "impara-ora" ? "lbl-strong halo" : "lbl-ink halo"))
        .attr("x", (n) => n.box.x0).attr("y", (n) => n.box.y1 - 3).text((n) => n.r.nome);
      svg.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("cx", (n) => n.ax).attr("cy", (n) => n.ay).attr("r", 14).attr("fill", "transparent").style("cursor", "default")
        .on("pointermove", (evt, n) => {
          const r = n.r, rowsT = [{ value: rad.quadranti[r.quadrante] }];
          if (r.arxiv) rowsT.push({ value: fSigned(r.arxiv.crescita), label: "quota di paper AI (3 mesi)" });
          if (r.github) rowsT.push({ value: fSigned(r.github.crescita), label: "nuovi repository (3 mesi)" });
          if (r.lavoro && r.lavoro.media != null) rowsT.push({ value: f2(r.lavoro.media), label: "annunci ogni 10.000" });
          showTip(evt, r.nome, rowsT);
        })
        .on("pointerleave", hideTip);
    });
  }

  function sparkline(series) {
    const w = 96, h = 24;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`); svg.setAttribute("width", w); svg.setAttribute("height", h);
    svg.setAttribute("aria-hidden", "true");
    const vals = series.map((p) => (p.totale ? (1000 * p.n) / p.totale : null));
    const ok = vals.filter((v) => v != null);
    if (ok.length < 2) return svg;
    const x = d3.scaleLinear([0, vals.length - 1], [2, w - 4]);
    const y = d3.scaleLinear([0, d3.max(ok) || 1], [h - 2, 3]);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d3.line().defined((v) => v != null).x((_, i) => x(i)).y((v) => y(v))(vals));
    path.setAttribute("fill", "none"); path.setAttribute("stroke", css("--s1")); path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", x(vals.length - 1)); dot.setAttribute("cy", y(vals[vals.length - 1] || 0)); dot.setAttribute("r", 2.4); dot.setAttribute("fill", css("--s1"));
    svg.append(path, dot);
    return svg;
  }

  function renderRadarTable(D) {
    const box = $("table-radar");
    const rad = D.radar;
    if (!rad) return empty(box, "Il radar si calcola dopo il primo aggiornamento.");
    const order = QUAD_ORDER;
    const rows = radarSorted(rad);
    const num = new Map(rows.map((r, i) => [r.id, i + 1]));
    const pct = (v) => (v == null ? null : Math.round(v * 100));
    const growth = (s) => (s ? fSigned(s.crescita) : "—");
    table(box, [
      { key: "n", label: "#", num: true, sort: (r) => -num.get(r.id), cell: (r) => num.get(r.id) },
      { key: "nome", label: "Competenza", sort: (r) => r.nome.toLowerCase(),
        cell: (r) => { const s = el("span", null, r.nome); s.append(el("span", "sub", r.descrizione)); return s; } },
      { key: "q", label: "Quadrante", sort: (r) => -(order[r.quadrante] ?? 9),
        cell: (r) => (r.quadrante ? el("span", `q q-${r.quadrante}`, rad.quadranti[r.quadrante]) : "—") },
      { key: "s", label: "Slancio", num: true, sort: (r) => r.slancio, cell: (r) => pct(r.slancio) },
      { key: "d", label: "Domanda", num: true, sort: (r) => r.domanda, cell: (r) => pct(r.domanda) },
      { key: "pa", label: "Paper, crescita", num: true, sort: (r) => (r.arxiv ? r.arxiv.crescita : null), cell: (r) => growth(r.arxiv) },
      { key: "gh", label: "Repo, crescita", num: true, sort: (r) => (r.github ? r.github.crescita : null), cell: (r) => growth(r.github) },
      { key: "ue", label: "Lavoro UE", num: true, sort: (r) => (r.lavoro ? r.lavoro.media_ue : null), cell: (r) => (r.lavoro && r.lavoro.media_ue != null ? f2(r.lavoro.media_ue) : "—") },
      { key: "us", label: "Lavoro USA", num: true, sort: (r) => (r.lavoro ? r.lavoro.usa : null), cell: (r) => (r.lavoro && r.lavoro.usa != null ? f2(r.lavoro.usa) : "—") },
      { key: "tr", label: "Trend paper", cell: (r) => (r.arxiv ? sparkline(r.arxiv.mensile) : "—") },
    ], rows, { sortable: true });

    const meth = $("radar-method");
    meth.replaceChildren(
      el("p", null, "Slancio e domanda sono ranghi percentili da 0 a 100 tra le competenze del radar: 0 è la più bassa, 100 la più alta. Il radar dice quali competenze crescono più delle altre, non se una competenza vale in assoluto."),
      (() => {
        const ul = el("ul");
        [
          "Paper: quota di paper AI su arXiv che citano la competenza nell'abstract, ultimi 3 mesi interi rispetto ai 3 precedenti.",
          "Repo: nuovi repository GitHub con il topic della competenza, ultimi 3 mesi rispetto ai 3 precedenti.",
          "Ai conteggi si aggiunge 5 prima di calcolare la crescita, per non premiare i salti tra numeri piccoli.",
          "Lavoro: annunci attivi degli ultimi 30 giorni che citano la competenza, ogni 10.000 annunci del Paese. La domanda è la media tra i Paesi.",
          "Slancio = media dei ranghi di crescita di paper e repository (e degli annunci, quando c'è almeno un mese di storico).",
          "Quadranti: sopra la mediana su entrambe le misure = Impara ora; solo slancio = Da provare; solo domanda = Da consolidare; nessuna delle due = Tieni d'occhio.",
          "Le parole cercate per ogni competenza sono in config/skills.yaml e si possono cambiare.",
        ].forEach((t) => ul.append(el("li", null, t)));
        return ul;
      })(),
    );
  }

  // ============================================================ EUROPA E USA
  function renderRegions(D) {
    const node = $("chart-regions"), card = $("card-regions");
    const ep = D.epoch;
    if (!ep || !ep.per_anno) return empty(node, "Dati di Epoch AI non ancora disponibili.");
    const regions = ["USA", "Cina", "UE", "Regno Unito"];
    const years = Array.from(new Set(ep.per_anno.map((r) => r.anno))).sort();
    const series = regions.map((a) => ({ a, values: years.map((y) => ({ y, n: (ep.per_anno.find((r) => r.anno === y && r.area === a) || {}).n || 0 })) }));
    const cur = ep.anno_in_corso;
    chart(() => {
      const H = 280;
      const { svg, w } = svgIn(node, H);
      const yS = d3.scaleLinear([0, d3.max(series, (s) => d3.max(s.values, (v) => v.n)) * 1.1], [H - 28, 12]).nice();
      const ml = measure(svg, yS.ticks(4).map(fInt)) + 10;
      const endW = measure(svg, ["Regno Unito 00"]) + 8;
      const x = d3.scaleLinear(d3.extent(years), [ml, w - endW]);
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(yS).ticks(4).tickSize(-(w - ml - endW)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(yS).ticks(4).tickFormat(fInt).tickSize(0).tickPadding(8)).call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`)
        .call(d3.axisBottom(x).ticks(Math.min(years.length, w < 480 ? 4 : 8)).tickFormat(d3.format("d")).tickSizeOuter(0)).attr("font-size", null).attr("font-family", null);
      const line = d3.line((v) => x(v.y), (v) => yS(v.n));
      const ends = [];
      for (const s of series) {
        const color = css(REGION_COLOR[s.a]);
        const done = s.values.filter((v) => v.y < cur), tail = s.values.filter((v) => v.y >= cur - 1);
        svg.append("path").datum(done).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("d", line);
        if (tail.length === 2) svg.append("path").datum(tail).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("stroke-dasharray", "3 4").attr("d", line);
        const lastDone = done[done.length - 1];
        if (lastDone) ends.push({ a: s.a, color, y: yS(lastDone.n), n: lastDone.n, x: x(lastDone.y) });
      }
      // etichette finali separate di almeno 14px
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      svg.append("g").selectAll("text").data(ends).join("text").attr("class", "lbl-ink").attr("x", x(years[years.length - 1]) + 8).attr("y", (e) => e.y + 4).text((e) => e.a);
      const rule = svg.append("line").attr("y1", 12).attr("y2", H - 28).attr("stroke", css("--axis")).style("opacity", 0);
      svg.append("rect").attr("x", ml).attr("width", w - ml - endW).attr("height", H - 28).attr("fill", "transparent")
        .on("pointermove", (evt) => {
          const yr = Math.round(x.invert(d3.pointer(evt)[0]));
          rule.attr("x1", x(yr)).attr("x2", x(yr)).style("opacity", 1);
          const at = series.map((s) => ({ s, n: (s.values.find((v) => v.y === yr) || { n: 0 }).n })).sort((a, b) => b.n - a.n);
          showTip(evt, String(yr) + (yr === cur ? " (anno in corso)" : ""), at.map((r) => ({ value: fInt(r.n), label: r.s.a, color: css(REGION_COLOR[r.s.a]) })));
        })
        .on("pointerleave", () => { rule.style("opacity", 0); hideTip(); });
    });
    legend(node, regions.map((a) => ({ label: a, color: `var(${REGION_COLOR[a]})`, kind: "line" })).concat([{ label: `${cur} in corso (tratteggio)`, color: "var(--axis)", kind: "line" }]));
    dataToggle(card, [{ label: "Anno", cell: (r) => r.y }, ...regions.map((a) => ({ label: a, num: true, cell: (r) => fInt(r[a]) }))],
      years.slice().reverse().map((y) => Object.fromEntries([["y", y], ...series.map((s) => [s.a, s.values.find((v) => v.y === y).n])])));
  }

  function renderEurostat(D) {
    const node = $("chart-eurostat"), card = $("card-eurostat");
    const eu = D.eurostat;
    if (!eu || !eu.serie) return empty(node, "Dati di Eurostat non ancora disponibili.");
    const geos = Object.keys(eu.serie);
    const accent = { EU27_2020: "--s1", IT: "--s2" };
    const series = geos.map((g) => ({ g, name: (eu.nomi && eu.nomi[g]) || g, values: Object.entries(eu.serie[g]).map(([y, v]) => ({ y: +y, v })).sort((a, b) => a.y - b.y) }));
    const years = Array.from(new Set(series.flatMap((s) => s.values.map((v) => v.y)))).sort();
    chart(() => {
      const H = 280;
      const { svg, w } = svgIn(node, H);
      const y = d3.scaleLinear([0, d3.max(series, (s) => d3.max(s.values, (v) => v.v)) * 1.1], [H - 28, 12]).nice();
      const ml = measure(svg, y.ticks(4).map((t) => t + "%")) + 10;
      const endW = measure(svg, ["Unione europea 00%"]) + 8;
      const x = d3.scaleLinear(d3.extent(years), [ml, w - endW]);
      svg.append("g").attr("class", "gridline").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(w - ml - endW)).tickFormat(""));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${ml},0)`).call(d3.axisLeft(y).ticks(4).tickFormat((t) => t + "%").tickSize(0).tickPadding(8)).call((g) => g.select(".domain").remove()).attr("font-size", null).attr("font-family", null);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - 28})`).call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")).tickSizeOuter(0)).attr("font-size", null).attr("font-family", null);
      const line = d3.line((v) => x(v.y), (v) => y(v.v));
      const ordered = series.slice().sort((a, b) => (accent[a.g] ? 1 : 0) - (accent[b.g] ? 1 : 0));
      for (const s of ordered) {
        const c = accent[s.g] ? css(accent[s.g]) : css("--other");
        svg.append("path").datum(s.values).attr("fill", "none").attr("stroke", c).attr("stroke-width", accent[s.g] ? 2.5 : 1.2)
          .attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("d", line);
        if (accent[s.g]) svg.append("g").selectAll("circle").data(s.values).join("circle").attr("cx", (v) => x(v.y)).attr("cy", (v) => y(v.v)).attr("r", 3.5).attr("fill", c);
      }
      const ends = series.filter((s) => accent[s.g]).map((s) => { const l = s.values[s.values.length - 1]; return { label: `${s.g === "EU27_2020" ? "UE" : s.name} ${IT.format(".0f")(l.v)}%`, y: y(l.v), x: x(l.y) }; });
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      svg.append("g").selectAll("text").data(ends).join("text").attr("class", "lbl-strong").attr("x", (e) => e.x + 8).attr("y", (e) => e.y + 4).text((e) => e.label);
      const rule = svg.append("line").attr("y1", 12).attr("y2", H - 28).attr("stroke", css("--axis")).style("opacity", 0);
      svg.append("rect").attr("x", ml).attr("width", w - ml - endW + 8).attr("height", H - 28).attr("fill", "transparent")
        .on("pointermove", (evt) => {
          const px = x.invert(d3.pointer(evt)[0]);
          const yr = years.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));
          rule.attr("x1", x(yr)).attr("x2", x(yr)).style("opacity", 1);
          const rowsT = series.map((s) => ({ s, v: (s.values.find((v) => v.y === yr) || {}).v })).filter((r) => r.v != null)
            .sort((a, b) => b.v - a.v).map((r) => ({ value: IT.format(".1f")(r.v) + "%", label: r.s.name, color: accent[r.s.g] ? css(accent[r.s.g]) : css("--other") }));
          showTip(evt, String(yr), rowsT);
        })
        .on("pointerleave", () => { rule.style("opacity", 0); hideTip(); });
    });
    legend(node, [{ label: "Unione europea", color: "var(--s1)", kind: "line" }, { label: "Italia", color: "var(--s2)", kind: "line" }, { label: "Altri Paesi (dettaglio al passaggio del mouse)", color: "var(--other)", kind: "line" }]);
    dataToggle(card, [{ label: "Paese", cell: (r) => r.name }, ...years.map((y) => ({ label: String(y), num: true, cell: (r) => { const v = r.values.find((x) => x.y === y); return v ? IT.format(".1f")(v.v) + "%" : "—"; } }))], series);
  }

  function renderJobs(D) {
    const node = $("chart-jobs"), card = $("card-jobs");
    const jobs = D.jobs, rad = D.radar;
    if (!jobs || !jobs.snapshots || !jobs.snapshots.length || !rad) {
      return empty(node, "Per questo grafico serve una chiave gratuita di Adzuna (ADZUNA_APP_ID e ADZUNA_APP_KEY nei secret del repository).");
    }
    const countries = Object.keys(jobs.paesi);
    const skills = rad.competenze.filter((r) => r.lavoro && r.lavoro.media != null).sort((a, b) => b.lavoro.media - a.lavoro.media);
    const cols = [...countries.map((c) => ({ id: c, name: jobs.paesi[c] })), { id: "_ue", name: "Media UE" }];
    const val = (s, c) => (c === "_ue" ? s.lavoro.media_ue : s.lavoro.ogni_10mila[c]);
    const all = skills.flatMap((s) => cols.map((c) => val(s, c.id))).filter((v) => v != null);
    chart(() => {
      const narrow = node.clientWidth < 640;
      const rowH = 30, top = 44;
      const H = top + skills.length * rowH + 6;
      const { svg, w } = svgIn(node, H);
      const ml = Math.min(narrow ? 140 : 230, measure(svg, skills.map((s) => s.nome)) + 14);
      const x = d3.scaleBand(cols.map((c) => c.id), [ml, w]).paddingInner(0.06);
      const color = d3.scaleSequentialSqrt([0, d3.max(all) || 1], d3.interpolateRgb(css("--seq-1"), css("--seq-9")));
      svg.append("g").selectAll("text").data(cols).join("text")
        .attr("class", (c) => (c.id === "_ue" ? "lbl-strong" : "lbl")).attr("text-anchor", "middle")
        .attr("transform", (c) => `translate(${x(c.id) + x.bandwidth() / 2},${top - 12})${narrow ? " rotate(-35)" : ""}`)
        .text((c) => (narrow ? c.id.replace("_ue", "UE").toUpperCase() : c.name));
      const g = svg.append("g").selectAll("g").data(skills).join("g").attr("transform", (_, i) => `translate(0,${top + i * rowH})`);
      g.append("text").attr("class", "lbl-ink").attr("x", ml - 10).attr("y", rowH / 2 + 4).attr("text-anchor", "end")
        .text((s) => (narrow && s.nome.length > 20 ? s.nome.slice(0, 19) + "…" : s.nome));
      const cells = g.selectAll("g").data((s) => cols.map((c) => ({ s, c, v: val(s, c.id) }))).join("g")
        .attr("transform", (d) => `translate(${x(d.c.id)},2)`);
      cells.append("rect").attr("width", x.bandwidth()).attr("height", rowH - 4).attr("rx", 4)
        .attr("fill", (d) => (d.v == null ? "transparent" : d.v === 0 ? css("--seq-0") : color(d.v)))
        .attr("stroke", (d) => (d.c.id === "_ue" ? css("--ink-2") : "none")).attr("stroke-width", 1);
      cells.append("text").attr("x", x.bandwidth() / 2).attr("y", rowH / 2 + 2).attr("text-anchor", "middle")
        .style("font", "12px " + css("--font")).style("font-variant-numeric", "tabular-nums")
        .attr("fill", (d) => {
          if (d.v == null || d.v === 0) return css("--muted");
          const c = d3.lab(color(d.v));
          return c.l > 60 ? "#0b0b0b" : "#ffffff";
        })
        .text((d) => (d.v == null ? "—" : x.bandwidth() < 40 ? IT.format(".0f")(d.v) : f1(d.v)));
      cells.append("rect").attr("width", x.bandwidth()).attr("height", rowH - 4).attr("fill", "transparent")
        .on("pointermove", (evt, d) => showTip(evt, `${d.s.nome} · ${d.c.name}`, [{ value: d.v == null ? "—" : f2(d.v), label: "annunci ogni 10.000" }]))
        .on("pointerleave", hideTip);
    });
    const latest = d3.max(jobs.snapshots, (s) => s.data);
    card.querySelector(".note").textContent = `Annunci che citano la competenza ogni 10.000 annunci attivi, per Paese. Rilevazione del ${fDayLong(parseDay(latest))}, annunci degli ultimi 30 giorni. Colore più scuro = più richiesta.`;
    dataToggle(card, [{ label: "Competenza", cell: (s) => s.nome }, ...cols.map((c) => ({ label: c.name, num: true, cell: (s) => (val(s, c.id) == null ? "—" : f2(val(s, c.id))) }))], skills);
  }

  // ============================================================ FONTI
  function renderStatus(D) {
    const box = $("table-status");
    const st = D.status;
    if (!st) return empty(box, "Nessun aggiornamento registrato ancora.");
    const rows = Object.entries(st.fonti || {}).map(([k, v]) => ({ k, ...v }));
    const label = { ok: "aggiornata", errore: "errore", "non configurata": "non configurata" };
    table(box, [
      { label: "Fonte", cell: (r) => SOURCE_NAMES[r.k] || r.k },
      { label: "Stato", cell: (r) => { const s = el("span", r.stato === "ok" ? "ok" : r.stato === "errore" ? "err" : null); s.append(el("span", "dot"), document.createTextNode(label[r.stato] || r.stato)); return s; } },
      { label: "Ultimo aggiornamento riuscito", cell: (r) => (r.ultimo_successo ? fDay(new Date(r.ultimo_successo)) : "—") },
      { label: "Nota", cell: (r) => (r.stato === "ok" ? "" : r.messaggio || "") },
    ], rows);
  }

  // ============================================================ AVVIO
  load().then((D) => {
    const steps = [renderHeader, renderTiles, renderCompute, renderAA, renderArxivTotal, renderOpen, renderRecent,
      renderNews, renderHF, renderHFTypes, renderRepos, renderRadar, renderRadarTable, renderRegions, renderEurostat, renderJobs, renderStatus];
    for (const f of steps) {
      try { f(D); } catch (err) { console.error(f.name, err); }
    }
  });
})();
