(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const experience = $(".experience-section");
  const vision = $("#vision");
  if (vision && experience) vision.after(experience);

  const state = {
    screen: "planning",
    responses: 7,
    responseTotal: 9,
    availabilitySent: false,
    need: { manager: 1, marshal: 4 },
    planView: "person",
    published: false,
    teamFilter: "all",
    teamQuery: "",
    lastFocus: null,
    toastTimer: null,
    tourIndex: -1
  };

  const flowContent = {
    programme: {
      number: "01",
      kicker: "Comprendre la semaine",
      title: "Le RKC sait déjà ce qui va se passer.",
      text: "Location 1000 m, location 1200 m, location piste enfants, privatisations, trophées licenciés et roulages licenciés 1200 m composent une vue hebdomadaire unique.",
      bullets: ["Piste, horaires et typologie", "Participants, karts et format", "Activités confirmées ou modifiées"]
    },
    knowledge: {
      number: "02",
      kicker: "Connaître les équipes",
      title: "Le système sait qui peut faire quoi.",
      text: "Chaque profil réunit son contrat, ses métiers, son niveau débutant, confirmé ou expert dans chacun d’eux, son temps de travail, ses indisponibilités et ses repos.",
      bullets: ["CDI disponibles intégrés automatiquement", "Extras connus et pondérés", "Congés, arrêts et déplacements visibles"]
    },
    selection: {
      number: "03",
      kicker: "Choisir la boucle d’extras",
      title: "Le RKC décide qui solliciter cette semaine.",
      text: "Les CDI forment le socle sauf congé, arrêt ou absence connue. Le responsable coche les extras qu’il souhaite interroger et peut ajouter ou retirer une personne à tout moment.",
      bullets: ["5 CDI présents dans le socle", "Liste d’extras pilotée par le responsable", "Ajout ou retrait possible au fil de l’eau"]
    },
    availability: {
      number: "04",
      kicker: "Recueillir les possibilités",
      title: "Chaque extra renseigne ses disponibilités.",
      text: "Environ une semaine avant, l’extra reçoit une demande pour renseigner uniquement la semaine concernée : jours, horaires, créneaux possibles et souplesse.",
      bullets: ["Une seule semaine à renseigner", "Réponses visibles en temps réel", "Une disponibilité ne vaut pas affectation"]
    },
    proposal: {
      number: "05",
      kicker: "Composer la semaine",
      title: "Une proposition cohérente est préparée.",
      text: "Les CDI disponibles, les extras ayant répondu, les besoins, les métiers, les niveaux, les repos et les pondérations entre extras sont croisés pour préparer le planning.",
      bullets: ["CDI intégrés selon leur contrat", "Extras répartis selon leur pondération", "Chaque affectation reste expliquée"]
    },
    decision: {
      number: "06",
      kicker: "Décider et verrouiller",
      title: "Le responsable vérifie, ajuste et publie.",
      text: "Il déplace une personne, ajoute un renfort, remplace une affectation et verrouille les choix à conserver avant de recalculer le reste puis de publier.",
      bullets: ["Ajustements manuels libres", "Choix verrouillables", "Aucune publication automatique"]
    }
  };

  const tourSteps = [
    { screen: "programme", title: "1 · L’activité de la semaine est déjà connue.", copy: "Locations, privatisations, trophées licenciés et réservations de roulage deviennent des besoins ajustables." },
    { screen: "team", title: "2 · Le RKC connaît réellement son équipe.", copy: "Contrats, métiers, niveaux débutant, confirmé ou expert dans chaque métier, congés, arrêts, jours off et repos entre missions forment un référentiel humain exploitable." },
    { screen: "availability", target: ".solicitation-map", title: "3 · Le responsable choisit les extras à solliciter.", copy: "La liste reste entièrement pilotée par le RKC et peut évoluer au fil de la semaine." },
    { screen: "availability", target: "#phone-demo", title: "4 · Chaque extra renseigne ses disponibilités.", copy: "Le lien personnel reste accessible ; une nouvelle demande invite à mettre la semaine à jour avant le calcul." },
    { screen: "planning", title: "5 · Une proposition cohérente est préparée.", copy: "Les CDI disponibles sont intégrés automatiquement. Les extras répondants complètent le besoin selon leur niveau et leur pondération." },
    { screen: "validation", title: "6 · Le responsable ajuste, publie et suit les confirmations.", copy: "Rien n’est envoyé avant sa validation ; chacun reçoit ensuite son planning personnel et peut confirmer ou signaler un problème." }
  ];

  const eventNeeds = {
    licensed: {
      tag: "1200 M", kicker: "Roulage licenciés 1200 m", title: "24 réservations de licenciés",
      facts: [["Activité", "Roulage licenciés"], ["Horaire", "18:00 à 22:00"], ["Piste", "1200 m"]], total: "0",
      roles: [["AC", "Accueil / contrôle d’accès", "Selon les règles retenues", "Option"], ["ME", "Support mécanique", "Disponible depuis l’atelier", "Option"]],
      note: "Aucun commissaire n’est requis pour ce format : ce roulage licenciés ne demande pas de couverture piste."
    },
    location: {
      tag: "1000 M", kicker: "Location 1000 m", title: "62 réservations · 7 vagues",
      facts: [["Activité", "Location"], ["Horaire", "09:00 à 20:00"], ["Piste", "1000 m"]], total: "4 à 5",
      roles: [["RP", "Responsable piste location", "Niveau expert · briefing inclus", "1"], ["CP", "Pisteurs location", "Effectif modulé selon les vagues", "3 à 4"]],
      note: "Le renfort est conseillé sur les pics de réservations, pas sur toute la journée."
    },
    atlas: {
      tag: "1200 M", kicker: "Privatisation 1200 m", title: "20 karts · 80 participants",
      facts: [["Activité", "Privatisation"], ["Horaire", "14:00 à 18:00"], ["Piste", "1200 m"]], total: "5", adjustable: true,
      note: "Besoin issu du modèle « Privatisation 1200 m », dimensionné par la combinaison piste, karts, participants, format et durée."
    },
    discovery: {
      tag: "PISTE ENFANTS", kicker: "Location piste enfants", title: "18 réservations · 4 vagues",
      facts: [["Activité", "Location"], ["Horaire", "10:00 à 19:00"], ["Piste", "Piste enfants"]], total: "2",
      roles: [["RP", "Responsable piste location", "Niveau expert · briefing inclus", "1"], ["PL", "Pisteur location", "Niveau confirmé ou débutant encadré", "1"]],
      note: "Le besoin est propre à la piste enfants et indépendant de la 1000 m."
    },
    tg: {
      tag: "1200 M", kicker: "Trophée licenciés 1200 m", title: "42 pilotes licenciés",
      facts: [["Activité", "Trophée licenciés"], ["Horaire", "08:00 à 15:00"], ["Piste", "1200 m"]], total: "8",
      roles: [["DC", "Direction de course", "Rôle attribué", "1"], ["RP", "Responsable piste", "Rôle attribué", "1"], ["CP", "Commissaires de piste", "Postes répartis selon le besoin", "4"], ["MC", "Mécanique compétition", "Préparation et assistance", "2"]],
      note: "La direction de course, les rôles obligatoires et les niveaux d’expérience priment sur le seul effectif."
    }
  };

  const people = {
    camille: {
      initials: "CM", avatarClass: "person-camille", contract: "CDI", name: "Camille M.", role: "Responsable exploitation piste",
      status: "Contrat actif", hours: "35 h / semaine", leave: "Jeudi",
      pattern: "Haute saison : mercredi à dimanche. Jours de repos proposés : lundi et mardi.",
      skills: [["Piste location", "Expert"]]
    },
    malik: {
      initials: "MB", avatarClass: "person-malik", contract: "CDI", name: "Malik B.", role: "Mécanique · renfort piste",
      status: "Contrat actif", hours: "35 h / semaine", leave: "Lundi",
      pattern: "Modèle atelier avec renforts opérationnels planifiés selon les événements.",
      skills: [["Mécanique location", "Expert"], ["Mécanique compétition", "Confirmé"], ["Magasin compétition", "Confirmé"], ["Piste location", "Débutant"]]
    },
    lea: {
      initials: "LD", avatarClass: "person-lea", contract: "CDI", name: "Léa D.", role: "Accueil · magasin",
      status: "Contrat actif", hours: "35 h / semaine", leave: "Mardi",
      pattern: "Accueil principal et magasin compétition. Une affectation reste stable sur toute sa plage d’ouverture.",
      skills: [["Accueil", "Expert"], ["Magasin compétition", "Confirmé"], ["Piste location", "Débutant"]]
    },
    noa: {
      initials: "NB", avatarClass: "person-noa", contract: "EXTRA", name: "Noa B.", role: "Commissaire de piste",
      status: "Profil actif", hours: "Selon affectations", leave: "Disponible samedi",
      pattern: "Pondération normale. Ses disponibilités de nuit sont déclarées dans sa réponse hebdomadaire.",
      skills: [["Piste location", "Confirmé"], ["Accueil", "Confirmé"]]
    },
    ines: {
      initials: "IM", avatarClass: "person-ines", contract: "EXTRA", name: "Inès M.", role: "Commissaire de piste · spécialisation événements",
      status: "Profil actif", hours: "Selon affectations", leave: "Disponible ven. à dim.",
      pattern: "Pondération forte. Profil expérimenté sur les événements 1200 m.",
      skills: [["Piste location", "Expert"]]
    },
    yassine: {
      initials: "YK", avatarClass: "person-yassine", contract: "EXTRA", name: "Yassine K.", role: "Accueil · commissaire",
      status: "Profil actif", hours: "Selon affectations", leave: "Réponse attendue",
      pattern: "Pondération faible pendant sa montée en expérience sur la piste location.",
      skills: [["Accueil", "Confirmé"], ["Piste location", "Débutant"]]
    }
  };

  const scheduleSets = {
    person: [
      { label: "Camille M.", sub: "CDI · Resp. piste · 35 h / 35 h", avatar: "CM", avatarClass: "person-camille", shifts: [
        [4, 29, "orange", "Resp. location", "08:30 à 12:00", "Camille maîtrise la 1000 m et conserve la responsabilité de l’ouverture."],
        [30, 6, "break", "", "", "Pause relayée : la responsabilité de la piste reste couverte."],
        [37, 55, "orange", "Resp. location", "13:15 à 20:00", "Camille reprend le même poste jusqu’à la fermeture de la location 1000 m."]
      ]},
      { label: "Malik B.", sub: "CDI · Mécanique · 32 h / 35 h", avatar: "MB", avatarClass: "person-malik", shifts: [
        [0, 38, "gray", "Atelier / mécanique", "08:00 à 13:00", "Malik reste affecté à la mécanique et prépare la flotte."],
        [38, 6, "break", "", "", "Pause relayée : l’atelier reste couvert."],
        [44, 39, "gray", "Atelier / mécanique", "13:30 à 18:30", "Malik reprend le même poste pour le support de l’après-midi."]
      ]},
      { label: "Léa D.", sub: "CDI · Accueil · 35 h / 35 h", avatar: "LD", avatarClass: "person-lea", shifts: [
        [8, 26, "gray", "Accueil / magasin", "09:00 à 12:30", "Léa est référente accueil et encaissement."],
        [34, 6, "break", "", "", "Pause relayée : l’accueil et le magasin restent ouverts."],
        [40, 53, "gray", "Accueil / magasin", "13:15 à 20:00", "Léa reprend le même poste jusqu’à la fermeture."]
      ]},
      { label: "Noa B.", sub: "Extra · Piste location confirmé · 9 h", avatar: "NB", avatarClass: "person-noa", shifts: [
        [16, 24, "teal", "Piste enfants", "10:00 à 13:00", "Noa couvre la piste enfants sur toute sa plage d’ouverture."],
        [40, 4, "break", "", "", "Pause relayée : la piste enfants reste couverte."],
        [44, 43, "teal", "Piste enfants", "13:30 à 19:00", "Noa reprend le même poste jusqu’à la relève."]
      ]},
      { label: "Inès M.", sub: "Extra · Piste location expert · 10 h", avatar: "IM", avatarClass: "person-ines", shifts: [
        [44, 39, "black", "Commissaire · poste pointage", "13:30 à 18:30", "Inès est experte en piste location et disponible sur toute la durée."]
      ]}
    ],
    track: [
      { label: "Piste 1000 m", sub: "Location", avatar: "10", avatarClass: "avatar-noa", shifts: [[7, 85, "orange", "Camille · équipe dédiée", "09:00 à 20:00", "Quatre à cinq personnes restent affectées à la location selon les réservations."]]},
      { label: "Piste 1200 m", sub: "Privatisation Atlas", avatar: "12", avatarClass: "avatar-ines", shifts: [[37, 11, "black", "Briefing · Sarah", "13:15 à 14:00", "Le briefing est assuré par un profil expert prévu sur l’événement."], [48, 31, "black", "Sarah · Inès · équipe", "14:00 à 18:00", "L’équipe dédiée reste sur la privatisation jusqu’à la fin."]]},
      { label: "Piste enfants", sub: "Location", avatar: "PE", avatarClass: "person-lea", shifts: [[16, 68, "teal", "Noa · équipe dédiée", "10:00 à 19:00", "La piste enfants reste couverte sur toute son ouverture."]]},
      { label: "Accueil", sub: "Accueil et magasin", avatar: "A", avatarClass: "person-yassine", shifts: [[7, 87, "gray", "Léa · Yassine", "09:00 à 20:00", "L’accueil et le magasin restent couverts sans interruption."]]},
      { label: "Atelier", sub: "Mécanique", avatar: "M", avatarClass: "person-malik", shifts: [[0, 38, "gray", "Malik · 2 mécaniciens", "08:00 à 13:00", "Préparation puis support disponible l’après-midi."]]}
    ],
    role: [
      { label: "Responsables piste", sub: "Niveau requis", avatar: "RP", avatarClass: "person-camille", shifts: [[4, 29, "orange", "Camille · 1000 m", "08:30 à 12:00", "Camille conserve la responsabilité de la location 1000 m."], [37, 55, "orange", "Camille · 1000 m", "13:15 à 20:00", "Même affectation après une pause relayée."]]},
      { label: "Commissaires", sub: "7 personnes", avatar: "CP", avatarClass: "person-noa", shifts: [[7, 85, "orange", "Équipe location", "09:00 à 20:00", "Effectif modulé selon le flux."], [44, 39, "black", "Équipe Atlas", "13:30 à 18:30", "Équipe événementielle dédiée."]]},
      { label: "Briefing", sub: "Capacité liée au niveau", avatar: "BR", avatarClass: "person-lea", shifts: [[6, 12, "orange", "Briefings location", "08:45 à 10:15", "Briefings en série sur la 1000 m."], [37, 11, "black", "Sarah · Atlas", "13:15 à 14:00", "Briefing de la privatisation Atlas par un profil expert."]]},
      { label: "Mécanique", sub: "3 personnes", avatar: "ME", avatarClass: "person-malik", shifts: [[0, 38, "gray", "Préparation endurance", "08:00 à 13:00", "La catégorie mécanique compétition est requise."], [40, 42, "gray", "Support terrain", "13:15 à 18:30", "Deux personnes restent mobilisables."]]},
      { label: "Accueil / magasin", sub: "3 personnes", avatar: "AC", avatarClass: "person-yassine", shifts: [[7, 87, "gray", "Léa · Yassine · renfort", "09:00 à 20:00", "Couverture continue et pics d’arrivée."]]}
    ]
  };

  const mobilePlanCards = [
    { avatar: "CM", avatarClass: "person-camille", name: "Camille M.", role: "CDI · responsable piste", hours: "35 h", target: "/ 35 h cible", segments: [["VEN. 06", "Location 1000 m", "08:30 à 17:00 · poste conservé"], ["SAM. 07", "Responsable location 1000 m", "08:30 à 20:00 · pause relayée"], ["DIM. 08", "Direction trophée licenciés", "08:00 à 15:00 · poste conservé"]], footer: "✓ Affectations stables et repos conformes" },
    { avatar: "MB", avatarClass: "person-malik", name: "Malik B.", role: "CDI · mécanique", hours: "32 h", target: "/ 35 h cible", segments: [["VEN. 06", "Préparation endurance", "08:00 à 13:00"], ["SAM. 07", "Mécanique + support terrain", "08:00 à 18:30 · pause incluse"], ["DIM. 08", "Atelier", "09:00 à 16:00"]], footer: "✓ Compétence mécanique couverte" },
    { avatar: "LD", avatarClass: "person-lea", name: "Léa D.", role: "CDI · accueil et magasin", hours: "35 h", target: "/ 35 h cible", segments: [["VEN. 06", "Accueil et magasin", "09:00 à 18:00 · poste conservé"], ["SAM. 07", "Accueil et magasin", "09:00 à 20:00 · pause relayée"], ["DIM. 08", "Accueil et magasin", "09:00 à 18:00 · poste conservé"]], footer: "✓ Accueil couvert sur toute l’ouverture" },
    { avatar: "NB", avatarClass: "person-noa", name: "Noa B.", role: "Extra · piste location · Confirmé", hours: "21 h", target: "3 journées", segments: [["VEN. 06", "Location 1000 m", "17:00 à 22:00 · poste conservé"], ["SAM. 07", "Location piste enfants", "10:00 à 19:00 · pause relayée"], ["DIM. 08", "Location 1000 m", "10:00 à 18:00 · poste conservé"]], footer: "✓ Repos entre journées vérifié" },
    { avatar: "IM", avatarClass: "person-ines", name: "Inès M.", role: "Extra · piste location · Expert", hours: "10 h", target: "2 missions", segments: [["SAM. 07", "Privatisation Atlas · poste pointage", "13:30 à 18:30"], ["DIM. 08", "Trophée licenciés · poste pointage", "09:00 à 14:00"]], footer: "✓ Repos et niveau vérifiés" }
  ];

  function showToast(title, copy) {
    const toast = $("#toast");
    $("#toast-title").textContent = title;
    $("#toast-copy").textContent = copy;
    toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  function setBodyLock(locked) {
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function renderMobilePlan() {
    const container = $(".mobile-plan-cards");
    const cards = mobilePlanCards;
    if (!container || !cards) return;
    container.innerHTML = cards.map(card => `
      <article>
        <header><span class="person-avatar ${card.avatarClass}">${card.avatar}</span><p><b>${card.name}</b><small>${card.role}</small></p><em><b>${card.hours}</b><small>${card.target}</small></em></header>
        <div>${card.segments.map(segment => `<span><i>${segment[0]}</i><b>${segment[1]}</b><small>${segment[2]}</small></span>`).join("")}</div>
        <footer${card.warning ? ' class="needs-choice"' : ""}>${card.footer}</footer>
      </article>`).join("");
  }

  function applyTeamFilters() {
    $$(".person-card").forEach(card => {
      const matchesType = state.teamFilter === "all" || card.dataset.type.includes(state.teamFilter);
      const matchesQuery = !state.teamQuery || card.textContent.toLocaleLowerCase("fr").includes(state.teamQuery);
      card.hidden = !(matchesType && matchesQuery);
    });
  }

  function rememberFocus() {
    state.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function focusDialog(dialog) {
    window.setTimeout(() => $("button", dialog)?.focus(), 0);
  }

  function restoreFocus() {
    if (state.lastFocus?.isConnected) state.lastFocus.focus();
    state.lastFocus = null;
  }

  function openScreen(name, scroll = false) {
    const panel = $(`[data-screen-panel="${name}"]`);
    if (!panel) return;
    state.screen = name;
    $$(".demo-screen").forEach(item => item.classList.toggle("is-active", item === panel));
    $$(".demo-nav").forEach(item => item.classList.toggle("is-active", item.dataset.screen === name));
    $(".demo-sidebar")?.classList.remove("is-open");
    $(".mobile-menu")?.setAttribute("aria-expanded", "false");
    setBodyLock(false);
    if (scroll) $("#experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (name === "planning") renderSchedule();
  }

  function renderFlow(key) {
    const data = flowContent[key];
    if (!data) return;
    const detail = $("#workflow-detail");
    detail.innerHTML = `
      <div class="detail-number">${data.number}</div>
      <div><p class="detail-kicker">${data.kicker}</p><h3>${data.title}</h3><p>${data.text}</p></div>
      <ul>${data.bullets.map(item => `<li><i>✓</i> ${item}</li>`).join("")}</ul>`;
    const keys = Object.keys(flowContent);
    const index = keys.indexOf(key);
    $("#workflow-progress").style.width = `${(index / (keys.length - 1)) * 100}%`;
  }

  function renderEventNeed(key) {
    const data = eventNeeds[key];
    const panel = $("#needs-panel");
    if (!data || !panel) return;
    panel.hidden = false;
    $$(".event-card").forEach(card => card.classList.toggle("is-selected", card.dataset.event === key));
    if (data.adjustable) {
      state.need = { manager: 1, marshal: 4 };
      const eventTotal = $("#event-total");
      if (eventTotal) eventTotal.textContent = data.total;
    }
    const roles = data.adjustable
      ? `<div class="need-role"><span class="role-symbol">RP</span><p><b>Responsable piste</b><small>Niveau expert en piste location</small></p><div class="stepper"><button aria-label="Diminuer le nombre de responsables" data-need="manager" data-delta="-1">-</button><b id="need-manager">1</b><button aria-label="Augmenter le nombre de responsables" data-need="manager" data-delta="1">+</button></div></div>
         <div class="need-role"><span class="role-symbol">PL</span><p><b>Pisteurs location</b><small>Un débutant reste encadré par un confirmé ou un expert</small></p><div class="stepper"><button aria-label="Diminuer le nombre de pisteurs" data-need="marshal" data-delta="-1">-</button><b id="need-marshal">4</b><button aria-label="Augmenter le nombre de pisteurs" data-need="marshal" data-delta="1">+</button></div></div>
         <div class="need-role"><span class="role-symbol">BR</span><p><b>Capacité briefing</b><small>Incluse dans le niveau expert en piste location</small></p><span class="skill-required">Requis ✓</span></div>`
      : data.roles.map(([symbol, title, detail, count]) => `<div class="need-role"><span class="role-symbol">${symbol}</span><p><b>${title}</b><small>${detail}</small></p><span class="skill-required">${count}</span></div>`).join("");
    panel.innerHTML = `
      <div class="needs-head"><span class="event-tag">${data.tag}</span><button aria-label="Fermer" data-action="close-needs">×</button></div>
      <p class="screen-kicker">${data.kicker}</p><h4>${data.title}</h4>
      <div class="event-facts">${data.facts.map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join("")}</div>
      <div class="needs-title"><div><p>Besoin proposé</p><small>${data.adjustable ? "Ajustez avant de calculer les affectations." : "Calculé selon le modèle de cette activité."}</small></div><span><b id="need-total">${data.total}</b> pers.</span></div>
      ${roles}
      <div class="recalc-note" id="recalc-note"><i>${data.total === "0" ? "✓" : "✦"}</i><p><b>${data.note}</b><small>Le responsable peut toujours modifier le modèle ou traiter une exception.</small></p></div>
      <button class="button button-dark button-full" data-action="recalculate">${data.adjustable ? "Recalculer la proposition" : "Calculer les affectations"}</button>
      <p class="needs-footnote">Les affectations déjà verrouillées seront conservées.</p>`;
  }

  function updateNeed() {
    const total = Object.values(state.need).reduce((sum, value) => sum + value, 0);
    Object.entries(state.need).forEach(([key, value]) => {
      const element = $(`#need-${key}`);
      if (element) element.textContent = value;
    });
    $("#need-total").textContent = total;
    $("#event-total").textContent = total;
    $("#recalc-note").innerHTML = `<i>↻</i><p><b>Le besoin a été ajusté à ${total} personnes</b><small>Relancez le calcul pour mettre à jour les affectations sans modifier les segments verrouillés.</small></p>`;
  }

  function updateResponseUI() {
    $$('[data-response-count]').forEach(el => { el.textContent = state.responses; });
    $$('[data-nonresponse-count]').forEach(el => { el.textContent = state.responseTotal - state.responses; });
    const percent = state.responseTotal ? Math.round((state.responses / state.responseTotal) * 100) : 0;
    $$('[data-response-progress]').forEach(el => { el.style.width = `${percent}%`; });
    $$('[data-response-percent]').forEach(el => { el.textContent = `${percent} %`; });
    const navBadge = $('.demo-nav[data-screen="availability"] .nav-badge');
    if (navBadge) navBadge.textContent = `${state.responses}/${state.responseTotal}`;
  }

  function updateSelectedExtraCount() {
    const count = $$(".selected-extra-grid input:checked").length;
    state.responseTotal = count;
    state.responses = Math.min(7, count);
    $$('[data-selected-extra-count]').forEach(element => { element.textContent = count; });
    const sendButton = $("#send-campaign-button");
    if (sendButton) {
      sendButton.disabled = count === 0;
      sendButton.innerHTML = `Simuler l’envoi aux <span data-selected-extra-count>${count}</span> extras`;
    }
    updateResponseUI();
    showToast(`${count} extra${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}`, count ? "Seules les personnes cochées recevront la prochaine demande de disponibilités." : "Aucune demande ne sera envoyée tant qu’aucun extra n’est sélectionné.");
  }

  function updateDayEditor(day, status) {
    const editor = $(".day-editor", day.closest(".phone-app"));
    if (!editor) return;
    const shortName = $("b", day)?.textContent.trim() || "Jour";
    const date = $("small", day)?.textContent.trim() || "";
    const names = { "Lun.": "Lundi", "Mar.": "Mardi", "Mer.": "Mercredi", "Jeu.": "Jeudi", "Ven.": "Vendredi", "Sam.": "Samedi", "Dim.": "Dimanche" };
    $("header b", editor).textContent = `${names[shortName] || shortName} ${date}`;
    const label = $("header span", editor);
    const inputs = $$("input", editor);
    const settings = {
      off: ["Indisponible", "", "", true],
      on: ["Toute la journée", "09:00", "20:00", false],
      custom: ["Horaires précis", "17:00", "23:00", false]
    }[status];
    label.textContent = settings[0];
    inputs[0].value = settings[1];
    inputs[1].value = settings[2];
    inputs.forEach(input => { input.disabled = settings[3]; });
  }

  function updateTour() {
    const title = $("#tour-title");
    const copy = $("#tour-copy");
    const progress = $("#tour-progress");
    const label = $("#tour-button-label");
    if (state.tourIndex < 0) {
      title.textContent = "Choisissez un écran dans le menu noir.";
      copy.textContent = "Modifiez un besoin, ouvrez une fiche équipe, testez le lien d’un extra, ajustez le planning ou déclenchez un imprévu.";
      progress.style.width = "0%";
      label.textContent = "Lancer la visite guidée";
      return;
    }
    const step = tourSteps[state.tourIndex];
    title.textContent = step.title;
    copy.textContent = step.copy;
    progress.style.width = `${((state.tourIndex + 1) / tourSteps.length) * 100}%`;
    label.textContent = state.tourIndex === tourSteps.length - 1 ? "Rejouer la visite" : "Étape suivante";
  }

  function runTourStep() {
    if (state.tourIndex === tourSteps.length - 1) {
      closeEmergency();
      state.tourIndex = -1;
    }
    state.tourIndex += 1;
    const step = tourSteps[state.tourIndex];
    if (step.emergency) {
      openEmergency();
    } else {
      closeEmergency();
      openScreen(step.screen, state.tourIndex === 0);
      const target = step.target ? $(step.target) : $(`[data-screen-panel="${step.screen}"]`);
      setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: step.target ? "center" : "start" }), 180);
    }
    updateTour();
  }

  function renderSchedule() {
    const body = $("#schedule-body");
    if (!body) return;
    const rows = JSON.parse(JSON.stringify(scheduleSets[state.planView] || scheduleSets.person));
    const labels = { person: "Personnes", track: "Zones", role: "Rôles" };
    $("#schedule-label").textContent = labels[state.planView];

    body.innerHTML = rows.map((row, rowIndex) => `
      <div class="schedule-row">
        <div class="schedule-person"><span class="person-avatar ${row.avatarClass}">${row.avatar}</span><p><b>${row.label}</b><small>${row.sub}</small></p></div>
        <div class="schedule-grid"></div>
        ${row.shifts.map((shift, shiftIndex) => `
          <button class="shift ${shift[2]}" style="--start:${shift[0]};--span:${shift[1]}" data-shift-row="${rowIndex}" data-shift-index="${shiftIndex}" ${shift[2] === "break" ? 'aria-label="Pause planifiée"' : ""}>
            ${shift[2] === "break" ? "" : `<b>${shift[3]}</b><small>${shift[4]}</small>`}
          </button>`).join("")}
      </div>`).join("");

    $$(".shift", body).forEach(button => {
      button.addEventListener("click", () => {
        const row = rows[Number(button.dataset.shiftRow)];
        const shift = row.shifts[Number(button.dataset.shiftIndex)];
        updateExplanation(row, shift);
      });
    });
  }

  function updateExplanation(row, shift) {
    const card = $("#assignment-explanation");
    if (!card) return;
    const title = shift[2] === "break" ? `Pause de ${row.label}` : `${row.label} · ${shift[3]}`;
    const checks = shift[2] === "break"
      ? ["Amplitude de la journée contrôlée", "Temps de pause réservé", "Aucune mission en chevauchement"]
      : ["Métier et niveau vérifiés", "Disponibilité renseignée", "Aucun chevauchement", "Impact sur les heures calculé"];
    card.innerHTML = `
      <span class="explanation-icon">✦</span>
      <p class="screen-kicker">Pourquoi cette proposition ?</p>
      <h4>${title}</h4>
      <p>${shift[5]}</p>
      <ul>${checks.map(check => `<li><i>✓</i> ${check}</li>`).join("")}</ul>
      <div class="explanation-actions"><button data-lock-shift>Verrouiller</button><button data-replace-shift>Remplacer</button></div>`;
    $("[data-lock-shift]", card).addEventListener("click", event => {
      event.currentTarget.textContent = "Verrouillé ✓";
      showToast("Affectation verrouillée", "Elle sera conservée lors du prochain calcul.");
    });
    $("[data-replace-shift]", card).addEventListener("click", () => showToast("3 alternatives trouvées", "La maquette classerait ici les personnes compatibles."));
  }

  function openPerson(key) {
    const data = people[key];
    if (!data) return;
    const modal = $("#person-modal");
    rememberFocus();
    const avatar = $("#modal-avatar");
    avatar.className = `person-photo ${data.avatarClass}`;
    avatar.textContent = data.initials;
    $("#modal-contract").textContent = data.contract;
    $("#modal-contract").className = `contract-tag${data.contract === "EXTRA" ? " contract-extra" : ""}`;
    $("#person-modal-title").textContent = data.name;
    $("#modal-role").textContent = data.role;
    $("#modal-status").textContent = data.status;
    $("#modal-hours").textContent = data.hours;
    $("#modal-leave").textContent = data.leave;
    $("#modal-pattern").textContent = data.pattern;
    $("#modal-skills").innerHTML = data.skills.map(([skill, level]) => `<span><b>${skill}</b><small>${level}</small></span>`).join("");
    modal.hidden = false;
    setBodyLock(true);
    focusDialog(modal);
  }

  function closeModals() {
    $$(".modal-backdrop").forEach(modal => { modal.hidden = true; });
    if (!$("#emergency-drawer").classList.contains("is-open")) setBodyLock(false);
    restoreFocus();
  }

  function openEmergency() {
    const drawer = $("#emergency-drawer");
    rememberFocus();
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    $("#emergency-form").hidden = false;
    $("#emergency-results").hidden = true;
    $$(".emergency-steps span").forEach((step, index) => step.classList.toggle("is-active", index === 0));
    setBodyLock(true);
    focusDialog(drawer);
  }

  function closeEmergency() {
    const drawer = $("#emergency-drawer");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    setBodyLock(false);
    restoreFocus();
  }

  function analyzeEmergency() {
    $("#emergency-form").hidden = true;
    $("#emergency-results").hidden = false;
    $$(".emergency-steps span").forEach((step, index) => step.classList.toggle("is-active", index <= 2));
    showToast("Impact analysé en temps réel", "Une mission touchée, un remplacement direct et deux options sous supervision.");
  }

  function openPublish() {
    const modal = $("#publish-modal");
    rememberFocus();
    modal.hidden = false;
    setBodyLock(true);
    focusDialog(modal);
  }

  function confirmPublish() {
    const sendSms = $("#publish-sms")?.checked !== false;
    state.published = true;
    closeModals();
    const status = $("#planning-status");
    if (status) {
      status.textContent = sendSms ? "Planning publié" : "Planning validé";
      status.classList.remove("status-prep");
      status.classList.add("status-live");
    }
    showToast(sendSms ? "Planning publié" : "Planning validé sans envoi", sendSms ? "14 personnes ont reçu leur notification individuelle." : "Le planning est verrouillé. Aucune notification n’a été envoyée.");
  }

  function handleAction(action, element) {
    switch (action) {
      case "restart":
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => window.location.reload(), 450);
        break;
      case "toggle-menu":
        $(".demo-sidebar")?.classList.toggle("is-open");
        const menuOpen = $(".demo-sidebar")?.classList.contains("is-open");
        $(".mobile-menu")?.setAttribute("aria-expanded", String(Boolean(menuOpen)));
        setBodyLock(menuOpen);
        break;
      case "submit-availability":
        if (!state.availabilitySent) {
          state.responses = Math.min(state.responses + 1, state.responseTotal);
          state.availabilitySent = true;
          updateResponseUI();
          const noaStatus = $("#noa-response-status");
          if (noaStatus) {
            noaStatus.textContent = "Complète";
            noaStatus.className = "response-complete";
          }
          const noaMobileStatus = $("#noa-response-status-mobile");
          if (noaMobileStatus) {
            noaMobileStatus.textContent = "Complète";
            noaMobileStatus.className = "response-complete";
          }
        }
        $(".phone-success").classList.add("is-visible");
        if (window.matchMedia("(max-width: 820px)").matches) {
          window.setTimeout(() => $("#phone-demo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
        }
        showToast("Disponibilité enregistrée", `Le cockpit est passé à ${state.responses} réponses sur ${state.responseTotal}.`);
        break;
      case "edit-availability":
        $(".phone-success").classList.remove("is-visible");
        break;
      case "recalculate":
        showToast("Nouvelle proposition calculée", "Les besoins ajustés sont couverts, les affectations verrouillées sont conservées.");
        if (element.closest("[data-screen-panel=programme]")) setTimeout(() => openScreen("planning"), 350);
        break;
      case "close-needs":
        $("#needs-panel").hidden = true;
        showToast("Détail refermé", "Choisissez une autre activité pour rouvrir son besoin d’équipe.");
        break;
      case "lock-default":
        element.textContent = "Verrouillé ✓";
        showToast("Proposition verrouillée", "Les affectations visibles seront conservées lors du prochain calcul.");
        break;
      case "replace-default":
        showToast("Alternatives disponibles", "Trois personnes compatibles peuvent être comparées pour cette affectation.");
        break;
      case "add-reinforcement":
        showToast("Renfort ajouté à la simulation", "Le planning sera recalculé autour de cette personne supplémentaire.");
        break;
      case "integration-info":
        showToast("Intégration cible", "La maquette simule l’import des dossiers Apex ; les modalités techniques seront confirmées avec le RKC.");
        break;
      case "preview-sms":
        showToast("Aperçu du SMS", "Le message et le formulaire mobile sont visibles juste en dessous.");
        $("#phone-demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "remind-extras":
        showToast("Relance préparée", `Seuls les ${state.responseTotal - state.responses} extras sans réponse recevraient ce SMS.`);
        break;
      case "send-campaign":
        if (!state.responseTotal) {
          showToast("Sélection requise", "Choisissez au moins un extra avant d’envoyer la demande de disponibilités.");
          break;
        }
        element.textContent = `Demande envoyée aux ${state.responseTotal} extras ✓`;
        showToast("Demande de disponibilités envoyée", `Les ${state.responseTotal} extras sélectionnés ont reçu leur lien personnel. Leurs réponses remonteront ici en direct.`);
        break;
      case "selection-info":
        showToast("Liste pilotée par le RKC", "Le responsable peut ajouter ou retirer un extra avant l’envoi, puis compléter la boucle au fil de l’eau.");
        break;
      case "all-week":
        $$(".day-state", element.closest(".phone-app")).forEach(dayState => {
          dayState.className = "day-state on";
          dayState.textContent = "Toute la journée";
        });
        showToast("Toute la semaine sélectionnée", "Chaque journée peut encore être précisée individuellement.");
        break;
      case "guided-next":
        runTourStep();
        break;
      case "guided-free":
        closeEmergency();
        state.tourIndex = -1;
        updateTour();
        showToast("Mode libre activé", "Explorez les écrans dans l’ordre qui vous convient.");
        break;
      case "relay-info":
        showToast("Contrôles d’un événement 24 h", "Relèves, repos, nuit, pauses, métiers et niveaux sont vérifiés avant toute proposition.");
        break;
      case "open-publish": openPublish(); break;
      case "confirm-publish": confirmPublish(); break;
      case "open-employee-plan":
        rememberFocus();
        $("#employee-plan-modal").hidden = false;
        setBodyLock(true);
        focusDialog($("#employee-plan-modal"));
        break;
      case "confirm-employee-plan":
        element.textContent = "Présence confirmée ✓";
        element.disabled = true;
        $("#noa-confirmation").textContent = "Confirmé";
        $("#noa-confirmation").className = "tracker-ok";
        const tracker = $("#employee-plan-modal .tracker-progress span");
        if (tracker) tracker.innerHTML = "<b>13</b> / 14 confirmées";
        const trackerBar = $("#employee-plan-modal .tracker-progress em");
        if (trackerBar) trackerBar.style.width = "93%";
        showToast("Présence confirmée", "Le responsable voit la confirmation immédiatement.");
        break;
      case "employee-issue":
        showToast("Signalement guidé", "Le salarié pourrait indiquer une indisponibilité, une erreur d’horaire ou demander à être rappelé.");
        break;
      case "close-modal": closeModals(); break;
      case "open-emergency": openEmergency(); break;
      case "close-emergency": closeEmergency(); break;
      case "analyze-emergency": analyzeEmergency(); break;
      case "contact-candidate":
        element.textContent = "Demande envoyée ✓";
        element.disabled = true;
        showToast("Demande ciblée envoyée", "La personne pourra accepter depuis le lien reçu par SMS.");
        break;
      case "accept-rule":
        $("#learning-card").innerHTML = `<span class="learning-badge">✓ RÈGLE CRÉÉE</span><p>Validée par le responsable</p><h4>Renfort conseillé au-delà de <span id="accepted-threshold">${$("#threshold-value").textContent}</span> sur la 1200 m.</h4><p class="learning-copy">La règle est historisée et pourra être modifiée ou désactivée. Elle influencera les prochains besoins proposés.</p><button class="button button-light button-full">Voir dans les modèles</button>`;
        showToast("Suggestion transformée en règle", "La décision du responsable est enregistrée et historisée.");
        break;
      case "ignore-rule":
        $("#learning-card").innerHTML = `<span class="learning-badge">SUGGESTION IGNORÉE</span><p>Décision du responsable</p><h4>Aucune nouvelle règle n’a été créée.</h4><p class="learning-copy">Le moteur continuera à présenter les faits sans modifier le modèle de besoin.</p>`;
        showToast("Suggestion ignorée", "Le responsable reste seul décisionnaire des règles RKC.");
        break;
    }
  }

  document.addEventListener("click", event => {
    const actionElement = event.target.closest("[data-action]");
    if (actionElement) handleAction(actionElement.dataset.action, actionElement);

    const demoMessage = event.target.closest("[data-demo-message]");
    if (demoMessage) showToast("Fonction prévue dans l’outil", demoMessage.dataset.demoMessage);

    const openScreenElement = event.target.closest("[data-open-screen]");
    if (openScreenElement) openScreen(openScreenElement.dataset.openScreen, !openScreenElement.closest("#demo-shell"));

    const nav = event.target.closest(".demo-nav");
    if (nav) openScreen(nav.dataset.screen);

    const flow = event.target.closest("[data-flow]");
    if (flow) {
      $$("[data-flow]").forEach(item => item.classList.toggle("is-active", item === flow));
      renderFlow(flow.dataset.flow);
    }

    const eventCard = event.target.closest(".event-card[data-event]");
    if (eventCard) renderEventNeed(eventCard.dataset.event);

    const eventChoice = event.target.closest("[data-event-choice]");
    if (eventChoice) {
      $$('[data-event-choice]', eventChoice.parentElement).forEach(item => item.classList.toggle("is-selected", item === eventChoice));
    }

    const needButton = event.target.closest("[data-need]");
    if (needButton) {
      const key = needButton.dataset.need;
      const minimums = { manager: 1, marshal: 1, briefing: 0 };
      state.need[key] = Math.max(minimums[key], state.need[key] + Number(needButton.dataset.delta));
      updateNeed();
    }

    const teamFilter = event.target.closest("[data-team-filter]");
    if (teamFilter) {
      state.teamFilter = teamFilter.dataset.teamFilter;
      $$("[data-team-filter]").forEach(item => item.classList.toggle("is-active", item === teamFilter));
      applyTeamFilters();
    }

    const personCard = event.target.closest("[data-person]");
    if (personCard) openPerson(personCard.dataset.person);

    const planView = event.target.closest("[data-plan-view]");
    if (planView) {
      state.planView = planView.dataset.planView;
      $$("[data-plan-view]").forEach(item => item.classList.toggle("is-active", item === planView));
      renderSchedule();
    }

    const planDay = event.target.closest("[data-plan-day]");
    if (planDay) {
      $$("[data-plan-day]").forEach(item => item.classList.toggle("is-active", item === planDay));
      showToast(`Vue du ${planDay.textContent.trim().toLowerCase()}`, "La maquette conserve les mêmes affectations et centre la lecture sur cette journée.");
    }

    const day = event.target.closest("[data-day-toggle]");
    if (day) {
      const dayState = $(".day-state", day);
      const values = [
        ["off", "Indisponible"],
        ["on", "Toute la journée"],
        ["custom", "Horaires précisés"]
      ];
      const current = values.findIndex(([className]) => dayState.classList.contains(className));
      const next = values[(current + 1) % values.length];
      dayState.className = `day-state ${next[0]}`;
      dayState.textContent = next[1];
      updateDayEditor(day, next[0]);
    }

    const incidentType = event.target.closest(".incident-types button");
    if (incidentType) {
      $$(".incident-types button").forEach(item => item.classList.toggle("is-active", item === incidentType));
    }

    if (event.target.classList.contains("modal-backdrop")) closeModals();
  });

  $("#threshold-value")?.parentElement.addEventListener("click", event => {
    if (event.target.tagName !== "BUTTON") return;
    const value = $("#threshold-value");
    const current = Number(value.textContent.match(/\d+/)[0]);
    value.textContent = `${Math.max(10, current + (event.target.textContent.trim() === "+" ? 1 : -1))} karts`;
  });

  $(".search-box input")?.addEventListener("input", event => {
    state.teamQuery = event.target.value.trim().toLocaleLowerCase("fr");
    applyTeamFilters();
  });

  document.addEventListener("change", event => {
    if (event.target.matches(".selected-extra-grid input")) updateSelectedExtraCount();
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeModals();
    closeEmergency();
    $(".demo-sidebar")?.classList.remove("is-open");
  });

  renderSchedule();
  renderMobilePlan();
  updateResponseUI();
  updateTour();
})();
