const groepen = [];
const oefeningenPerLeerlijn = {};
const resultatenPerLeerling = {};
const STORAGE_KEY = "slo-kerndoel57-data-v1";

let idTeller = 1;
let geselecteerdeGroepId = null;
let geselecteerdeLeerlingId = null;
let geselecteerdeLeerlijn = null;
let geselecteerdeOefeningIndex = null;
let actieveTab = "groepen";
let actieveGroepenView = "overview";
const SECTIE_PROFIELEN = [
  {
    naam: "Sectie 1 - Acrobatische gymnastiek",
    leerlijnen: ["Balanceren", "Springen", "Over de kop gaan"],
    sporten: ["Turnen", "Acrogym", "Trampolinespringen", "Kunstrijden", "Freerunning"],
  },
  {
    naam: "Sectie 2 - Boulderen en klimmen",
    leerlijnen: ["Klimmen", "Stoeispelen"],
    sporten: ["Klimmen", "Boulderen", "Turnen", "Obstakelruns", "Crossfit"],
  },
  {
    naam: "Sectie 3 - Atletiek",
    leerlijnen: ["Hardlopen", "Tikspelen"],
    sporten: ["Atletiek", "Voetbal", "Hockey", "Volleybal", "Handbal", "Rugby"],
  },
  {
    naam: "Sectie 4 - Mikken, jongleren en doelspelen",
    leerlijnen: ["Mikken", "Jongleren", "Doelspelen"],
    sporten: ["Basketbal", "Korfbal", "Honkbal", "Tennis", "Badminton", "Boogschieten", "Tafeltennis"],
  },
  {
    naam: "Sectie 5 - Dans en demo",
    leerlijnen: ["Doelspelen", "Bewegen op muziek"],
    sporten: ["Streetdance", "Cheerleading", "Ritmische gymnastiek", "Kunstrijden"],
  },
  {
    naam: "Sectie 6 - Vechtsporten",
    leerlijnen: ["Stoeispelen", "Balanceren"],
    sporten: ["Judo", "Jiujitsu", "Worstelen", "Karate", "Taekwondo", "Boksen", "Kickboksen"],
  },
];

function saveState() {
  const data = {
    groepen,
    oefeningenPerLeerlijn,
    resultatenPerLeerling,
    idTeller,
    geselecteerdeGroepId,
    geselecteerdeLeerlingId,
    geselecteerdeLeerlijn,
    geselecteerdeOefeningIndex,
    actieveTab,
    actieveGroepenView,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;

    groepen.length = 0;
    (data.groepen || []).forEach((groep) => {
      groepen.push({
        id: groep.id,
        naam: groep.naam,
        leerlingen: Array.isArray(groep.leerlingen) ? groep.leerlingen : [],
      });
    });

    Object.keys(oefeningenPerLeerlijn).forEach((k) => delete oefeningenPerLeerlijn[k]);
    Object.entries(data.oefeningenPerLeerlijn || {}).forEach(([leerlijn, oefeningen]) => {
      oefeningenPerLeerlijn[leerlijn] = Array.isArray(oefeningen) ? oefeningen : [];
    });

    Object.keys(resultatenPerLeerling).forEach((k) => delete resultatenPerLeerling[k]);
    Object.assign(resultatenPerLeerling, data.resultatenPerLeerling || {});

    idTeller = Number.isFinite(data.idTeller) ? data.idTeller : 1;
    geselecteerdeGroepId = data.geselecteerdeGroepId || null;
    geselecteerdeLeerlingId = data.geselecteerdeLeerlingId || null;
    geselecteerdeLeerlijn = data.geselecteerdeLeerlijn || null;
    geselecteerdeOefeningIndex =
      Number.isInteger(data.geselecteerdeOefeningIndex) ? data.geselecteerdeOefeningIndex : null;
    actieveTab = data.actieveTab === "leerlijnen" ? "leerlijnen" : "groepen";
    actieveGroepenView = data.actieveGroepenView === "detail" ? "detail" : "overview";
  } catch (_err) {
    // Ongeldige opgeslagen data negeren
  }
}

function nieuwId(prefix) {
  idTeller += 1;
  return `${prefix}-${idTeller}`;
}

function getGroepById(id) {
  return groepen.find((groep) => groep.id === id) || null;
}

function getGeselecteerdeGroep() {
  return getGroepById(geselecteerdeGroepId);
}

function getGeselecteerdeLeerling() {
  const groep = getGeselecteerdeGroep();
  if (!groep) return null;
  return groep.leerlingen.find((leerling) => leerling.id === geselecteerdeLeerlingId) || null;
}

function showTab(tabNaam) {
  actieveTab = tabNaam;
  document.body.classList.toggle("groups-bg", tabNaam === "groepen");
  document.body.classList.toggle("leerlijnen-bg", tabNaam === "leerlijnen");
  const buttons = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabNaam);
  });
  contents.forEach((content) => {
    content.classList.toggle("active", content.dataset.tabContent === tabNaam);
  });
  saveState();
}

function showGroepenView(viewNaam) {
  actieveGroepenView = viewNaam === "detail" ? "detail" : "overview";
  const overview = document.getElementById("groepen-overview-view");
  const detail = document.getElementById("groep-detail-view");
  if (overview) {
    overview.classList.toggle("active", actieveGroepenView === "overview");
  }
  if (detail) {
    detail.classList.toggle("active", actieveGroepenView === "detail");
  }
  saveState();
}

function voegGroepToe(event) {
  event.preventDefault();

  const input = document.getElementById("groep-naam");
  const naam = input.value.trim();
  if (!naam) return false;

  const groep = {
    id: nieuwId("groep"),
    naam,
    leerlingen: [],
  };
  groepen.push(groep);

  geselecteerdeGroepId = groep.id;
  geselecteerdeLeerlingId = null;

  input.value = "";
  input.focus();

  renderGroepen();
  renderGroepDetail();
  renderLeerlingTabs();
  showGroepenView("detail");
  updateSelectieContext();
  saveState();
  return false;
}

function verwijderGroep(groepId) {
  const index = groepen.findIndex((groep) => groep.id === groepId);
  if (index === -1) return;

  const groep = groepen[index];
  groep.leerlingen.forEach((leerling) => {
    delete resultatenPerLeerling[leerling.id];
  });
  groepen.splice(index, 1);

  if (geselecteerdeGroepId === groepId) {
    geselecteerdeGroepId = null;
    geselecteerdeLeerlingId = null;
  }

  renderGroepen();
  renderGroepDetail();
  renderLeerlingTabs();
  if (groepen.length === 0) {
    showGroepenView("overview");
  }
  updateSelectieContext();
  saveState();
}

function selecteerGroep(groepId) {
  geselecteerdeGroepId = groepId;
  geselecteerdeLeerlingId = null;
  renderGroepen();
  renderGroepDetail();
  renderLeerlingTabs();
  showGroepenView("detail");
  updateSelectieContext();
  saveState();
}

function renderGroepen() {
  const lijst = document.getElementById("groepen-lijst");
  lijst.innerHTML = "";

  groepen.forEach((groep) => {
    const li = document.createElement("li");
    li.className = "groep-item";
    if (groep.id === geselecteerdeGroepId) {
      li.classList.add("active");
    }

    const main = document.createElement("button");
    main.type = "button";
    main.className = "groep-main";
    main.textContent = groep.naam;
    main.addEventListener("click", () => selecteerGroep(groep.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "groep-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => verwijderGroep(groep.id));

    li.appendChild(main);
    li.appendChild(remove);
    lijst.appendChild(li);
  });
}

function voegLeerlingToe(event) {
  event.preventDefault();
  const groep = getGeselecteerdeGroep();
  if (!groep) return false;

  const input = document.getElementById("leerling-naam");
  const naam = input.value.trim();
  if (!naam) return false;

  groep.leerlingen.push({
    id: nieuwId("leerling"),
    naam,
  });

  input.value = "";
  input.focus();
  renderGroepDetail();
  renderLeerlingTabs();
  saveState();
  return false;
}

function verwijderLeerling(leerlingId) {
  const groep = getGeselecteerdeGroep();
  if (!groep) return;

  const index = groep.leerlingen.findIndex((leerling) => leerling.id === leerlingId);
  if (index === -1) return;
  groep.leerlingen.splice(index, 1);
  delete resultatenPerLeerling[leerlingId];

  if (geselecteerdeLeerlingId === leerlingId) {
    geselecteerdeLeerlingId = null;
    updateSelectieContext();
  }

  renderGroepDetail();
  renderLeerlingTabs();
  renderOefeningen();
  renderNiveaus();
  saveState();
}

function selecteerLeerling(leerlingId) {
  geselecteerdeLeerlingId = leerlingId;
  renderLeerlingTabs();
  updateSelectieContext();
  saveState();
  showTab("leerlijnen");
}

function renderGroepDetail() {
  const groep = getGeselecteerdeGroep();
  const titel = document.getElementById("groep-detail-titel");
  const lijst = document.getElementById("leerlingen-lijst");
  const input = document.getElementById("leerling-naam");

  if (!titel || !lijst) return;

  if (!groep) {
    titel.textContent = "Groep";
    lijst.innerHTML = "";
    if (input) {
      input.value = "";
    }
    return;
  }

  titel.textContent = groep.naam;
  lijst.innerHTML = "";

  groep.leerlingen.forEach((leerling) => {
    const li = document.createElement("li");
    li.className = "leerling-item";

    const select = document.createElement("button");
    select.type = "button";
    select.className = "leerling-select";
    select.textContent = leerling.naam;
    select.addEventListener("click", () => selecteerLeerling(leerling.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "leerling-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => verwijderLeerling(leerling.id));

    const rapport = document.createElement("button");
    rapport.type = "button";
    rapport.className = "leerling-rapport";
    rapport.textContent = "Rapport";
    rapport.addEventListener("click", () => openLeerlingRapport(leerling.id));

    const acties = document.createElement("div");
    acties.className = "leerling-acties";
    acties.appendChild(rapport);
    acties.appendChild(remove);

    li.appendChild(select);
    li.appendChild(acties);
    lijst.appendChild(li);
  });
}

function gaTerugNaarGroepenOverzicht() {
  showGroepenView("overview");
}

function renderLeerlingTabs() {
  const container = document.getElementById("leerling-tabs");
  if (!container) return;
  container.innerHTML = "";

  const groep = getGeselecteerdeGroep();
  if (!groep || groep.leerlingen.length === 0) {
    const leeg = document.createElement("span");
    leeg.className = "leerling-tab-empty";
    leeg.textContent = "Nog geen leerling geselecteerd.";
    container.appendChild(leeg);
    return;
  }

  groep.leerlingen.forEach((leerling) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "leerling-tab";
    if (leerling.id === geselecteerdeLeerlingId) {
      tab.classList.add("active");
    }
    tab.textContent = leerling.naam;
    tab.addEventListener("click", () => {
      geselecteerdeLeerlingId = leerling.id;
      renderLeerlingTabs();
      updateSelectieContext();
      renderOefeningen();
      renderNiveaus();
      saveState();
    });
    container.appendChild(tab);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSportenLijst(sporten) {
  if (!Array.isArray(sporten) || sporten.length === 0) return "-";
  return sporten.join(", ");
}

function getGekozenNiveau(leerlingId, leerlijnNaam, oefeningNaam) {
  const entry = resultatenPerLeerling[leerlingId]?.[leerlijnNaam]?.[oefeningNaam];
  if (typeof entry === "number") return entry;
  if (entry && typeof entry === "object" && Number.isInteger(entry.gekozenNiveau)) {
    return entry.gekozenNiveau;
  }
  return null;
}

function openLeerlingRapport(leerlingId) {
  const groep = getGeselecteerdeGroep();
  if (!groep) return;
  const leerling = groep.leerlingen.find((l) => l.id === leerlingId);
  if (!leerling) return;

  const regelsPerLeerlijn = {};
  Object.entries(oefeningenPerLeerlijn).forEach(([leerlijnNaam, oefeningen]) => {
    (oefeningen || []).forEach((oefening) => {
      const gekozenNiveau = getGekozenNiveau(leerling.id, leerlijnNaam, oefening.naam);
      if (!gekozenNiveau) return;

      const niveauTekst =
        Array.isArray(oefening.niveaus) && oefening.niveaus[gekozenNiveau - 1]
          ? oefening.niveaus[gekozenNiveau - 1]
          : "-";

      if (!regelsPerLeerlijn[leerlijnNaam]) {
        regelsPerLeerlijn[leerlijnNaam] = [];
      }
      regelsPerLeerlijn[leerlijnNaam].push({
        oefeningNaam: oefening.naam,
        gekozenNiveau,
        niveauTekst,
      });
    });
  });

  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    window.alert("Popup geblokkeerd. Sta popups toe om het rapport te openen.");
    return;
  }

  const leerlijnNamen = Object.keys(regelsPerLeerlijn);
  const conclusieHtml =
    leerlijnNamen.length === 0
      ? ""
      : (() => {
          const leerlijnSamenvatting = leerlijnNamen
            .map((leerlijnNaam) => {
              const regels = regelsPerLeerlijn[leerlijnNaam] || [];
              const totaal = regels.reduce((som, regel) => som + regel.gekozenNiveau, 0);
              const gemiddelde = totaal / regels.length;
              return {
                leerlijnNaam,
                gemiddelde,
                aantal: regels.length,
              };
            })
            .sort((a, b) => b.gemiddelde - a.gemiddelde);

          const besteLeerlijn = leerlijnSamenvatting[0];
          const gelijkeBesteLeerlijnen = leerlijnSamenvatting.filter(
            (item) => Math.abs(item.gemiddelde - besteLeerlijn.gemiddelde) < 0.001
          );
          const besteLeerlijnNamen = gelijkeBesteLeerlijnen
            .map((item) => item.leerlijnNaam)
            .join(", ");
          const besteLeerlijnNiveau = besteLeerlijn.gemiddelde.toFixed(1).replace(".", ",");

          const leerlijnGemiddelden = {};
          leerlijnSamenvatting.forEach((item) => {
            leerlijnGemiddelden[item.leerlijnNaam] = item.gemiddelde;
          });

          const sectieSamenvatting = SECTIE_PROFIELEN.map((sectie) => {
            const scores = sectie.leerlijnen
              .map((naam) => leerlijnGemiddelden[naam])
              .filter((score) => typeof score === "number");
            if (scores.length === 0) {
              return null;
            }
            const gemiddelde = scores.reduce((som, score) => som + score, 0) / scores.length;
            return {
              naam: sectie.naam,
              gemiddelde,
              sporten: sectie.sporten,
            };
          })
            .filter(Boolean)
            .sort((a, b) => b.gemiddelde - a.gemiddelde);

          let sectieZin = "";
          if (sectieSamenvatting.length > 0) {
            const besteSectie = sectieSamenvatting[0];
            const slechtsteSectie = sectieSamenvatting[sectieSamenvatting.length - 1];
            const gelijkeBesteSecties = sectieSamenvatting.filter(
              (item) => Math.abs(item.gemiddelde - besteSectie.gemiddelde) < 0.001
            );
            const gelijkeSlechtsteSecties = sectieSamenvatting.filter(
              (item) => Math.abs(item.gemiddelde - slechtsteSectie.gemiddelde) < 0.001
            );
            const besteSectieNamen = gelijkeBesteSecties.map((item) => item.naam).join(", ");
            const slechtsteSectieNamen = gelijkeSlechtsteSecties
              .map((item) => item.naam)
              .join(", ");
            const besteSectieSporten = gelijkeBesteSecties
              .map((item) => `${item.naam}: ${formatSportenLijst(item.sporten)}`)
              .join(" | ");
            const slechtsteSectieSporten = gelijkeSlechtsteSecties
              .map((item) => `${item.naam}: ${formatSportenLijst(item.sporten)}`)
              .join(" | ");

            sectieZin = `
              <p>
                Op basis van de gekoppelde secties scoort ${escapeHtml(leerling.naam)} het beste in
                <strong>${escapeHtml(besteSectieNamen)}</strong> en het minst sterk in
                <strong>${escapeHtml(slechtsteSectieNamen)}</strong>.
              </p>
              <p>
                Sporten bij de beste sectie(s): ${escapeHtml(besteSectieSporten)}.
              </p>
              <p>
                Sporten bij de minst sterke sectie(s): ${escapeHtml(slechtsteSectieSporten)}.
              </p>
            `;
          }

          return `
            <section class="conclusie-blok">
              <h2>Kleine conclusie</h2>
              <p>
                ${escapeHtml(leerling.naam)} scoort op dit moment het sterkst in:
                <strong>${escapeHtml(besteLeerlijnNamen)}</strong>
                (gemiddeld niveau ${escapeHtml(besteLeerlijnNiveau)}).
              </p>
              ${sectieZin}
            </section>
          `;
        })();
  const rapportBodyHtml =
    leerlijnNamen.length === 0
      ? `<p>Nog geen scores ingevuld voor deze leerling.</p>`
      : leerlijnNamen
          .map((leerlijnNaam, index) => {
            const rows = regelsPerLeerlijn[leerlijnNaam]
              .map(
                (regel) => `
                  <article class="rapport-row">
                    <div class="rapport-row-head">
                      <h3>${escapeHtml(regel.oefeningNaam)}</h3>
                      <span class="niveau-label">Niveau ${escapeHtml(regel.gekozenNiveau)}</span>
                    </div>
                    <div class="niveau-dots" aria-label="Niveau ${escapeHtml(regel.gekozenNiveau)} van 5">
                      <span class="dot ${regel.gekozenNiveau === 1 ? "active" : ""}">1</span>
                      <span class="dot ${regel.gekozenNiveau === 2 ? "active" : ""}">2</span>
                      <span class="dot ${regel.gekozenNiveau === 3 ? "active" : ""}">3</span>
                      <span class="dot ${regel.gekozenNiveau === 4 ? "active" : ""}">4</span>
                      <span class="dot ${regel.gekozenNiveau === 5 ? "active" : ""}">5</span>
                    </div>
                    <p class="niveau-omschrijving">${escapeHtml(regel.niveauTekst)}</p>
                  </article>
                `
              )
              .join("");

            const kleurKlasse = `kleur-${(index % 5) + 1}`;
            return `
              <section class="leerlijn-blok ${kleurKlasse}">
                <h2 class="leerlijn-titel">${escapeHtml(leerlijnNaam)}</h2>
                <div class="rapport-rows">${rows}</div>
              </section>
            `;
          })
          .join("");

  const vandaag = new Date().toLocaleDateString("nl-NL");
  popup.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8" />
        <title>Rapport - ${escapeHtml(leerling.naam)}</title>
        <style>
          body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; color: #111827; background: #ffffff; }
          h1 { margin: 0 0 6px; font-size: 26px; color: #be185d; }
          .sub { margin: 0 0 18px; color: #4b5563; line-height: 1.45; }
          .toolbar { margin-bottom: 16px; }
          .toolbar button {
            border: 1px solid #d1d5db; background: #fff; border-radius: 8px;
            padding: 8px 14px; cursor: pointer;
          }
          .leerlijn-blok { margin-top: 18px; border: 1px solid #f3e8ff; border-radius: 14px; overflow: hidden; }
          .leerlijn-titel {
            margin: 0;
            padding: 10px 14px;
            font-size: 18px;
            color: #ffffff;
            background: #db2777;
          }
          .rapport-rows {
            padding: 10px 12px 4px;
            display: grid;
            gap: 10px;
            background: #fff7fb;
          }
          .rapport-row {
            border: 1px solid #fbcfe8;
            background: #ffffff;
            border-radius: 10px;
            padding: 10px;
          }
          .rapport-row-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }
          .rapport-row-head h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
          }
          .niveau-label {
            border-radius: 999px;
            background: #fdf2f8;
            color: #9d174d;
            border: 1px solid #f9a8d4;
            padding: 2px 8px;
            font-size: 12px;
            white-space: nowrap;
          }
          .niveau-dots {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            margin-bottom: 8px;
          }
          .dot {
            width: 24px;
            height: 24px;
            border-radius: 999px;
            border: 2px solid #f472b6;
            color: #9d174d;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            background: #ffffff;
          }
          .dot.active {
            background: #ec4899;
            color: #ffffff;
            border-color: #db2777;
          }
          .niveau-omschrijving {
            margin: 0;
            color: #4b5563;
            font-size: 13px;
          }
          .kleur-1 .leerlijn-titel { background: #db2777; }
          .kleur-2 .leerlijn-titel { background: #a855f7; }
          .kleur-3 .leerlijn-titel { background: #2563eb; }
          .kleur-4 .leerlijn-titel { background: #0d9488; }
          .kleur-5 .leerlijn-titel { background: #f97316; }
          .conclusie-blok {
            margin-top: 24px;
            padding: 12px 14px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }
          .conclusie-blok h2 { margin: 0 0 8px; font-size: 18px; }
          .conclusie-blok p { margin: 0 0 8px; }
          .conclusie-blok p:last-child { margin-bottom: 0; }
          @media print {
            html, body, body * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .toolbar { display: none; }
            body { margin: 0; }
            .rapport-row { break-inside: avoid; }
            .dot.active {
              background: #ec4899 !important;
              border-color: #be185d !important;
              color: #ffffff !important;
            }
            /* Fallback voor printers/browsers die achtergrondkleuren negeren. */
            .dot.active {
              font-size: 0 !important;
              position: relative;
            }
            .dot.active::after {
              content: "●";
              font-size: 14px;
              line-height: 1;
              color: #be185d !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar"><button onclick="window.print()">Rapport printen</button></div>
        <h1>Leerlingrapport Bewegingsonderwijs</h1>
        <p class="sub">
          Leerling: <strong>${escapeHtml(leerling.naam)}</strong><br />
          Groep: <strong>${escapeHtml(groep.naam)}</strong><br />
          Datum: <strong>${escapeHtml(vandaag)}</strong>
        </p>
        ${rapportBodyHtml}
        ${conclusieHtml}
      </body>
    </html>
  `);
  popup.document.close();
}

function updateSelectieContext() {
  const context = document.getElementById("selectie-context");
  const leerling = getGeselecteerdeLeerling();
  const groep = getGeselecteerdeGroep();

  if (!groep || !leerling) {
    context.textContent = "Geen leerling geselecteerd.";
    return;
  }
  context.textContent = `Geselecteerd: ${leerling.naam} (${groep.naam})`;
}

function filterLeerlijnen() {
  const input = document.getElementById("leerlijn-zoek");
  const filter = input.value.toLowerCase();
  const items = document.querySelectorAll("#leerlijnen-lijst .leerlijn-item");

  items.forEach((item) => {
    const naamEl = item.querySelector(".leerlijn-naam");
    const text = naamEl ? naamEl.textContent.toLowerCase() : item.textContent.toLowerCase();
    item.style.display = text.includes(filter) ? "" : "none";
  });
}

function initLeerlijnenClicks() {
  const items = document.querySelectorAll("#leerlijnen-lijst .leerlijn-item");
  const overlay = document.getElementById("oefeningen-overlay");
  const overlayTitel = document.getElementById("overlay-titel");

  items.forEach((item) => {
    item.addEventListener("click", () => {
      items.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const naamEl = item.querySelector(".leerlijn-naam");
      geselecteerdeLeerlijn = (naamEl ? naamEl.textContent : item.textContent).trim();
      geselecteerdeOefeningIndex = null;

      overlayTitel.textContent = geselecteerdeLeerlijn;
      overlay.classList.add("open");
      resetNiveausPanel();

      renderOefeningen();
      saveState();
    });
  });
}

function updateLeerlijnTellers() {
  const alleLeerlijnen = document.querySelectorAll("#leerlijnen-lijst .leerlijn-item");
  alleLeerlijnen.forEach((item) => {
    const naamEl = item.querySelector(".leerlijn-naam");
    const naam = (naamEl ? naamEl.textContent : item.textContent).trim();
    const countEl = item.querySelector(".leerlijn-count");
    const aantal = (oefeningenPerLeerlijn[naam] || []).length;
    if (countEl) {
      countEl.textContent = aantal > 0 ? `(${aantal} oefeningen)` : "";
    }
  });
}

function renderOefeningen() {
  const lijst = document.getElementById("oefeningen-lijst");
  lijst.innerHTML = "";

  if (!geselecteerdeLeerlijn) {
    updateLeerlijnTellers();
    return;
  }

  const oefeningen = oefeningenPerLeerlijn[geselecteerdeLeerlijn] || [];
  const leerling = getGeselecteerdeLeerling();

  oefeningen.forEach((oefening, index) => {
    const li = document.createElement("li");
    li.className = "oefening-item";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "oefening-header";

    const naamSpan = document.createElement("span");
    naamSpan.className = "oefening-naam";
    naamSpan.textContent = oefening.naam;

    const countSpan = document.createElement("span");
    countSpan.className = "oefening-count";
    const resultaat = leerling
      ? getOefeningResultaatVoorLeerling(
          leerling,
          geselecteerdeLeerlijn,
          oefening.naam,
          false
        )
      : null;
    const aantalNiveaus = Array.isArray(oefening.niveaus) ? oefening.niveaus.length : 0;
    const gekozenNiveau = resultaat ? resultaat.gekozenNiveau : null;
    countSpan.textContent = `${aantalNiveaus}/5 niveaus${gekozenNiveau ? ` · leerling: niveau ${gekozenNiveau}` : ""}`;

    header.appendChild(naamSpan);
    header.appendChild(countSpan);

    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "oefening-remove";
    knop.textContent = "×";
    knop.addEventListener("click", () => {
      oefeningen.splice(index, 1);
      if (geselecteerdeOefeningIndex === index) {
        geselecteerdeOefeningIndex = null;
        resetNiveausPanel();
      }
      renderOefeningen();
      renderNiveaus();
    });

    header.addEventListener("click", () => {
      geselecteerdeOefeningIndex = index;
      openNiveausPanel(oefening.naam);
      renderNiveaus();
      saveState();
    });

    li.appendChild(header);
    li.appendChild(knop);
    lijst.appendChild(li);
  });

  updateLeerlijnTellers();
}

function resetNiveausPanel() {
  const empty = document.getElementById("niveaus-empty");
  const content = document.getElementById("niveaus-content");
  const naamSpan = document.getElementById("niveaus-oefening-naam");
  const lijst = document.getElementById("niveaus-lijst");
  const info = document.getElementById("toekenning-info");

  empty.style.display = "block";
  content.style.display = "none";
  naamSpan.textContent = "";
  lijst.innerHTML = "";
  info.textContent = "Selecteer een leerling en niveau om een resultaat toe te kennen.";
}

function openNiveausPanel(oefeningNaam) {
  const empty = document.getElementById("niveaus-empty");
  const content = document.getElementById("niveaus-content");
  const naamSpan = document.getElementById("niveaus-oefening-naam");
  empty.style.display = "none";
  content.style.display = "block";
  naamSpan.textContent = oefeningNaam;
}

function getHuidigeOefening() {
  if (
    geselecteerdeLeerlijn == null ||
    geselecteerdeOefeningIndex == null ||
    !oefeningenPerLeerlijn[geselecteerdeLeerlijn]
  ) {
    return null;
  }
  return oefeningenPerLeerlijn[geselecteerdeLeerlijn][geselecteerdeOefeningIndex] || null;
}

function getOefeningResultaatVoorLeerling(leerling, leerlijnNaam, oefeningNaam, createIfMissing) {
  if (!leerling || !leerlijnNaam || !oefeningNaam) return null;

  if (!resultatenPerLeerling[leerling.id]) {
    if (!createIfMissing) return null;
    resultatenPerLeerling[leerling.id] = {};
  }

  if (!resultatenPerLeerling[leerling.id][leerlijnNaam]) {
    if (!createIfMissing) return null;
    resultatenPerLeerling[leerling.id][leerlijnNaam] = {};
  }

  const map = resultatenPerLeerling[leerling.id][leerlijnNaam];
  const bestaand = map[oefeningNaam];

  // Migratie: oude opslag bewaarde alleen het gekozen nummer.
  if (typeof bestaand === "number") {
    map[oefeningNaam] = { gekozenNiveau: bestaand };
  } else if (!bestaand && createIfMissing) {
    map[oefeningNaam] = { gekozenNiveau: null };
  } else if (
    bestaand &&
    typeof bestaand === "object" &&
    !Array.isArray(bestaand)
  ) {
    if (
      bestaand.gekozenNiveau !== null &&
      bestaand.gekozenNiveau !== undefined &&
      !Number.isInteger(bestaand.gekozenNiveau)
    ) {
      bestaand.gekozenNiveau = null;
    }
  }

  return map[oefeningNaam] || null;
}

function kenNiveauToe(niveauNummer) {
  const leerling = getGeselecteerdeLeerling();
  const oefening = getHuidigeOefening();
  if (!leerling || !oefening || !geselecteerdeLeerlijn) {
    return;
  }

  const resultaat = getOefeningResultaatVoorLeerling(
    leerling,
    geselecteerdeLeerlijn,
    oefening.naam,
    true
  );
  resultaat.gekozenNiveau = niveauNummer;

  renderNiveaus();
  renderOefeningen();
  saveState();
}

function bewerkNiveau(index) {
  const oefening = getHuidigeOefening();
  if (!oefening || !Array.isArray(oefening.niveaus) || typeof oefening.niveaus[index] !== "string") {
    return;
  }

  const huidigeTekst = oefening.niveaus[index];
  const nieuweTekst = window.prompt("Pas de beschrijving van dit niveau aan:", huidigeTekst);
  if (nieuweTekst === null) {
    return;
  }

  const opgeschoond = nieuweTekst.trim();
  if (!opgeschoond) {
    return;
  }

  oefening.niveaus[index] = opgeschoond;
  renderNiveaus();
  renderOefeningen();
  saveState();
}

function renderNiveaus() {
  const lijst = document.getElementById("niveaus-lijst");
  const info = document.getElementById("toekenning-info");
  lijst.innerHTML = "";

  const oefening = getHuidigeOefening();
  const leerling = getGeselecteerdeLeerling();
  if (!oefening) return;

  let gekozenNiveau = null;
  let niveaus = Array.isArray(oefening.niveaus) ? oefening.niveaus : [];
  if (leerling) {
    const resultaat = getOefeningResultaatVoorLeerling(
      leerling,
      geselecteerdeLeerlijn,
      oefening.naam,
      true
    );
    gekozenNiveau = resultaat.gekozenNiveau || null;

    // Migratie: als oude leerling-specifieke niveaus bestaan, maak ze gedeeld.
    if (niveaus.length === 0 && Array.isArray(resultaat.niveaus) && resultaat.niveaus.length > 0) {
      oefening.niveaus = [...resultaat.niveaus];
      niveaus = oefening.niveaus;
      delete resultaat.niveaus;
      saveState();
    }
  }

  if (leerling) {
    info.textContent = `Resultaat toekennen aan: ${leerling.naam}`;
  } else {
    info.textContent = "Selecteer eerst een leerling in het tabblad Groepen.";
  }

  niveaus.forEach((tekst, index) => {
    const niveauNummer = index + 1;
    const kaart = document.createElement("li");
    kaart.className = `niveau-card niveau-${niveauNummer}`;

    const headerRow = document.createElement("div");
    headerRow.className = "niveau-header-row";

    const label = document.createElement("div");
    label.className = "niveau-label";
    label.textContent = `Niveau ${niveauNummer}`;

    const acties = document.createElement("div");
    acties.className = "niveau-actions";

    const kiesBtn = document.createElement("button");
    kiesBtn.type = "button";
    kiesBtn.className = "niveau-kies";
    kiesBtn.textContent = "Kies";
    if (gekozenNiveau === niveauNummer) {
      kiesBtn.classList.add("active");
      kiesBtn.textContent = "Gekozen";
    }
    kiesBtn.disabled = !leerling;
    kiesBtn.addEventListener("click", () => kenNiveauToe(niveauNummer));

    const bewerkBtn = document.createElement("button");
    bewerkBtn.type = "button";
    bewerkBtn.className = "niveau-bewerk";
    bewerkBtn.textContent = "Bewerk";
    bewerkBtn.addEventListener("click", () => bewerkNiveau(index));

    const body = document.createElement("div");
    body.className = "niveau-tekst";
    body.textContent = tekst;

    acties.appendChild(kiesBtn);
    acties.appendChild(bewerkBtn);
    headerRow.appendChild(label);
    headerRow.appendChild(acties);
    kaart.appendChild(headerRow);
    kaart.appendChild(body);
    lijst.appendChild(kaart);
  });
}

function voegOefeningToe(event) {
  event.preventDefault();
  if (!geselecteerdeLeerlijn) return false;

  const input = document.getElementById("oefening-tekst");
  const tekst = input.value.trim();
  if (!tekst) return false;

  if (!oefeningenPerLeerlijn[geselecteerdeLeerlijn]) {
    oefeningenPerLeerlijn[geselecteerdeLeerlijn] = [];
  }
  oefeningenPerLeerlijn[geselecteerdeLeerlijn].push({
    naam: tekst,
    niveaus: [],
  });

  input.value = "";
  input.focus();
  renderOefeningen();
  saveState();
  return false;
}

function voegNiveauToe(event) {
  event.preventDefault();
  const oefening = getHuidigeOefening();
  if (!oefening) return false;

  const input = document.getElementById("niveau-tekst");
  const tekst = input.value.trim();
  if (!tekst) return false;

  if (!Array.isArray(oefening.niveaus)) {
    oefening.niveaus = [];
  }
  if (oefening.niveaus.length >= 5) {
    window.alert("Je kunt maximaal 5 niveaus toevoegen.");
    return false;
  }
  oefening.niveaus.push(tekst);
  input.value = "";
  input.focus();

  renderNiveaus();
  renderOefeningen();
  saveState();
  return false;
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });
}

function initOverlay() {
  const overlay = document.getElementById("oefeningen-overlay");
  const backdrop = overlay.querySelector(".overlay-backdrop");
  const closeBtn = overlay.querySelector(".overlay-close");

  const sluit = () => {
    overlay.classList.remove("open");
  };
  backdrop.addEventListener("click", sluit);
  closeBtn.addEventListener("click", sluit);
}

function initPagina() {
  loadState();
  initTabs();
  initOverlay();
  initLeerlijnenClicks();
  renderGroepen();
  renderGroepDetail();
  renderLeerlingTabs();
  updateSelectieContext();
  updateLeerlijnTellers();
  resetNiveausPanel();
  showTab(actieveTab);
  if (!getGeselecteerdeGroep() && actieveGroepenView === "detail") {
    actieveGroepenView = "overview";
  }
  showGroepenView(actieveGroepenView);
}

initPagina();

