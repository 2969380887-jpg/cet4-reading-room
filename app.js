const app = document.querySelector("#app");
const wordSheet = document.querySelector("#word-sheet");
const wordSheetContent = document.querySelector("#word-sheet-content");

const state = {
  papers: [],
  paperIndex: Number(localStorage.getItem("cet4-paper") || 0),
  view: localStorage.getItem("cet4-view") || "cloze",
  selectedBankWord: null,
  answers: JSON.parse(localStorage.getItem("cet4-answers") || "{}"),
  translations: {},
  localLexicon: {},
  visibleTranslations: new Set(),
};

const lexicon = {
  ability: ["n.", "/əˈbɪləti/", "能力；才能"],
  academic: ["adj.", "/ˌækəˈdemɪk/", "学术的；学院的"],
  accepted: ["adj.", "/əkˈseptɪd/", "被接受的；公认的"],
  achievement: ["n.", "/əˈtʃiːvmənt/", "成就；完成"],
  actually: ["adv.", "/ˈæktʃuəli/", "实际上；事实上"],
  adaptable: ["adj.", "/əˈdæptəbl/", "能适应的"],
  advantage: ["n.", "/ədˈvɑːntɪdʒ/", "优势；有利条件"],
  advertising: ["n.", "/ˈædvətaɪzɪŋ/", "广告；广告活动"],
  approximately: ["adv.", "/əˈprɒksɪmətli/", "大约；近似地"],
  assume: ["v.", "/əˈsjuːm/", "假定；认为"],
  audience: ["n.", "/ˈɔːdiəns/", "观众；听众"],
  balance: ["n./v.", "/ˈbæləns/", "平衡；权衡"],
  beneficial: ["adj.", "/ˌbenɪˈfɪʃl/", "有益的；有利的"],
  challenge: ["n./v.", "/ˈtʃælɪndʒ/", "挑战；质疑"],
  climate: ["n.", "/ˈklaɪmət/", "气候；风气"],
  community: ["n.", "/kəˈmjuːnəti/", "社区；群体"],
  comprehend: ["v.", "/ˌkɒmprɪˈhend/", "理解；领会"],
  confidence: ["n.", "/ˈkɒnfɪdəns/", "信心；信任"],
  consider: ["v.", "/kənˈsɪdə(r)/", "考虑；认为"],
  considerable: ["adj.", "/kənˈsɪdərəbl/", "相当大的；重要的"],
  constitute: ["v.", "/ˈkɒnstɪtjuːt/", "构成；组成"],
  contributing: ["adj./v.", "/kənˈtrɪbjuːtɪŋ/", "促成的；贡献"],
  crucial: ["adj.", "/ˈkruːʃl/", "关键的；至关重要的"],
  distribution: ["n.", "/ˌdɪstrɪˈbjuːʃn/", "分配；分布"],
  education: ["n.", "/ˌedʒuˈkeɪʃn/", "教育；培养"],
  emotional: ["adj.", "/ɪˈməʊʃənl/", "情感的；情绪的"],
  engineer: ["n./v.", "/ˌendʒɪˈnɪə(r)/", "工程师；设计"],
  engineering: ["n.", "/ˌendʒɪˈnɪərɪŋ/", "工程学；工程"],
  environment: ["n.", "/ɪnˈvaɪrənmənt/", "环境；周围状况"],
  evidence: ["n.", "/ˈevɪdəns/", "证据；迹象"],
  exercise: ["n./v.", "/ˈeksəsaɪz/", "锻炼；练习；运用"],
  financial: ["adj.", "/faɪˈnænʃl/", "金融的；财务的"],
  flexible: ["adj.", "/ˈfleksəbl/", "灵活的；可变通的"],
  global: ["adj.", "/ˈɡləʊbl/", "全球的；整体的"],
  guideline: ["n.", "/ˈɡaɪdlaɪn/", "指导方针；准则"],
  health: ["n.", "/helθ/", "健康；卫生"],
  ignorance: ["n.", "/ˈɪɡnərəns/", "无知；不了解"],
  influence: ["n./v.", "/ˈɪnfluəns/", "影响；影响力"],
  intensity: ["n.", "/ɪnˈtensəti/", "强度；强烈"],
  interact: ["v.", "/ˌɪntərˈækt/", "互动；相互作用"],
  literacy: ["n.", "/ˈlɪtərəsi/", "读写能力；素养"],
  management: ["n.", "/ˈmænɪdʒmənt/", "管理；经营"],
  mental: ["adj.", "/ˈmentl/", "心理的；精神的"],
  mood: ["n.", "/muːd/", "心情；情绪"],
  nature: ["n.", "/ˈneɪtʃə(r)/", "自然；本质"],
  physical: ["adj.", "/ˈfɪzɪkl/", "身体的；物理的"],
  public: ["adj./n.", "/ˈpʌblɪk/", "公共的；公众"],
  research: ["n./v.", "/rɪˈsɜːtʃ/", "研究；调查"],
  responsibility: ["n.", "/rɪˌspɒnsəˈbɪləti/", "责任；职责"],
  review: ["n./v.", "/rɪˈvjuː/", "综述；评论；复习"],
  sample: ["n./v.", "/ˈsɑːmpl/", "样本；抽样"],
  security: ["n.", "/sɪˈkjʊərəti/", "安全；保障"],
  significant: ["adj.", "/sɪɡˈnɪfɪkənt/", "重要的；显著的"],
  species: ["n.", "/ˈspiːʃiːz/", "物种"],
  stress: ["n./v.", "/stres/", "压力；强调"],
  systematic: ["adj.", "/ˌsɪstəˈmætɪk/", "系统的；有条理的"],
  technology: ["n.", "/tekˈnɒlədʒi/", "技术；科技"],
  unique: ["adj.", "/juˈniːk/", "独特的；唯一的"],
  vocabulary: ["n.", "/vəˈkæbjələri/", "词汇；词汇量"],
  warming: ["n.", "/ˈwɔːmɪŋ/", "变暖；升温"],
};

const wordBankMeanings = {
  closed: ["adj.", "/kləʊzd/", "关闭的；封闭的"],
  complex: ["adj.", "/ˈkɒmpleks/", "复杂的"],
  component: ["n.", "/kəmˈpəʊnənt/", "组成部分；部件"],
  confused: ["adj.", "/kənˈfjuːzd/", "困惑的；混乱的"],
  deteriorate: ["v.", "/dɪˈtɪəriəreɪt/", "恶化；退化"],
  deposited: ["v.", "/dɪˈpɒzɪtɪd/", "存放；沉积"],
  equivalent: ["adj./n.", "/ɪˈkwɪvələnt/", "相等的；等同物"],
  graphically: ["adv.", "/ˈɡræfɪkli/", "生动地；用图表地"],
  instinct: ["n.", "/ˈɪnstɪŋkt/", "本能；直觉"],
  instincts: ["n.", "/ˈɪnstɪŋkts/", "本能；直觉"],
  literary: ["adj.", "/ˈlɪtərəri/", "文学的"],
  narration: ["n.", "/nəˈreɪʃn/", "叙述；讲述"],
  neutral: ["adj.", "/ˈnjuːtrəl/", "中立的；中性的"],
  offence: ["n.", "/əˈfens/", "违法行为；冒犯"],
  offences: ["n.", "/əˈfensɪz/", "违法行为；冒犯"],
  permanently: ["adv.", "/ˈpɜːmənəntli/", "永久地"],
  performed: ["v.", "/pəˈfɔːmd/", "执行；表现；表演"],
  prescribes: ["v.", "/prɪˈskraɪbz/", "规定；开处方"],
  readily: ["adv.", "/ˈredɪli/", "容易地；乐意地"],
  registered: ["adj./v.", "/ˈredʒɪstəd/", "注册的；登记"],
  reinforces: ["v.", "/ˌriːɪnˈfɔːsɪz/", "加强；巩固"],
  revealed: ["v.", "/rɪˈviːld/", "揭示；透露"],
  symbolic: ["adj.", "/sɪmˈbɒlɪk/", "象征性的"],
  speculate: ["v.", "/ˈspekjuleɪt/", "推测；投机"],
  suddenly: ["adv.", "/ˈsʌdənli/", "突然地"],
  ultimately: ["adv.", "/ˈʌltɪmətli/", "最终；根本上"],
  undermined: ["v.", "/ˌʌndəˈmaɪnd/", "削弱；破坏"],
  yielded: ["v.", "/jiːldɪd/", "产生；屈服"],
};

function getWordInfo(word) {
  const base = word.toLowerCase().replace(/[^a-z-]/g, "");
  const forms = [
    base,
    base.replace(/s$/, ""),
    base.replace(/es$/, ""),
    base.replace(/ed$/, ""),
    base.replace(/ing$/, ""),
    base.replace(/ies$/, "y"),
  ];
  const localKey = forms.find(item => state.localLexicon[item]);
  if (localKey) {
    return formatLocalWord(base, state.localLexicon[localKey]);
  }
  const foundKey = forms.find(item => lexicon[item] || wordBankMeanings[item]);
  if (foundKey) {
    const [pos, phonetic, meaning] = lexicon[foundKey] || wordBankMeanings[foundKey];
    return { word: base, pos, phonetic, meaning };
  }
  return guessWordInfo(base);
}

function formatLocalWord(word, entry) {
  const translation = entry.translation || "";
  const posMatch = translation.match(/\b(n|v|adj|adv|prep|conj|pron|num|int)\./i);
  return {
    word,
    pos: posMatch ? posMatch[0] : "n./v.",
    phonetic: entry.phonetic ? `/${entry.phonetic}/` : `/${word}/`,
    meaning: translation || entry.definition || "暂无本地释义，建议结合上下文理解。",
  };
}

function guessWordInfo(word) {
  let pos = "n./v.";
  if (word.endsWith("ly")) pos = "adv.";
  else if (/(ous|ful|ive|able|ible|al|ic|less)$/.test(word)) pos = "adj.";
  else if (/(tion|sion|ment|ness|ity|ance|ence|ship)$/.test(word)) pos = "n.";
  else if (/(ize|ise|fy|ate)$/.test(word)) pos = "v.";
  const phonetic = `/${word}/`;
  return { word, pos, phonetic, meaning: "暂无本地释义，建议结合上下文理解。" };
}

function save() {
  localStorage.setItem("cet4-paper", state.paperIndex);
  localStorage.setItem("cet4-view", state.view);
  localStorage.setItem("cet4-answers", JSON.stringify(state.answers));
}

function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 1600);
}

function answerKey(number) {
  return `${state.papers[state.paperIndex].id}-${number}`;
}

function cleanTitle(title) {
  return title.replace(/\s+/g, "").replace("四级真题", " · 四级真题 ");
}

function describePaper() {
  return "Section A 选词填空 + Passage One 精读 Q46-50 + Passage Two 精读 Q51-55 · 全文查词 + 独立翻译";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function clickableText(text) {
  return escapeHtml(text).replace(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g, word => {
    const value = word.toLowerCase().replace(/[’']/g, "");
    return `<span class="lookup-word" data-word="${value}">${word}</span>`;
  });
}

function splitReading(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length < 520) return [normalized];
  const sentences = normalized.match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g) || [normalized];
  const paragraphs = [];
  let current = "";
  sentences.forEach(sentence => {
    if ((current + sentence).length > 430 && current) {
      paragraphs.push(current.trim());
      current = "";
    }
    current += sentence;
  });
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}

function renderHome() {
  app.innerHTML = `
    <section class="home">
      <div class="home-card">
        <h1>考研英语阅读</h1>
        <p class="subtitle">中浩 · CET-4 / CET-6 / 考研真题</p>
        <div class="paper-list">
          ${state.papers.map((paper, index) => `
            <button class="paper-card" data-open-paper="${index}">
              <strong>${cleanTitle(paper.title)}</strong>
              <span>${describePaper()}</span>
            </button>`).join("")}
        </div>
        <p class="home-note">点击任意单词查询 · 手机/平板/PC 全适配</p>
      </div>
    </section>`;
}

function renderStudy() {
  const paper = state.papers[state.paperIndex];
  app.innerHTML = `
    <section class="study">
      <div class="top-actions">
        <button class="plain-button" data-home>← 返回选卷</button>
        <button class="plain-button" data-reset>重置当前部分</button>
      </div>
      <header class="study-title">
        <h1>${cleanTitle(paper.title)}</h1>
        <p>Reading Comprehension</p>
        <span class="pill">Section A 选词填空 · Passage One · Passage Two</span>
      </header>
      <nav class="section-tabs">
        <button class="tab ${state.view === "cloze" ? "active" : ""}" data-view="cloze">Section A<small>选词填空 Q26-35</small></button>
        <button class="tab ${state.view === "passage-0" ? "active" : ""}" data-view="passage-0">Passage One<small>仔细阅读 Q46-50</small></button>
        <button class="tab ${state.view === "passage-1" ? "active" : ""}" data-view="passage-1">Passage Two<small>仔细阅读 Q51-55</small></button>
      </nav>
      <nav class="question-jumper">${renderQuestionJumper()}</nav>
      <article class="paper-sheet">
        ${state.view === "cloze" ? renderCloze(paper) : renderPassage(paper, Number(state.view.at(-1)))}
      </article>
    </section>`;
}

function renderQuestionJumper() {
  const group = (label, numbers) => `<span class="jump-label">${label}</span>${numbers.map(number =>
    `<button class="question-jump ${state.answers[answerKey(number)] ? "done" : ""}" data-jump="${number}">${number}</button>`
  ).join("")}`;
  return group("选词填空", Array.from({ length: 10 }, (_, i) => i + 26)) +
    group("仔细阅读", Array.from({ length: 10 }, (_, i) => i + 46));
}

function renderCloze(paper) {
  const paragraphs = splitReading(paper.cloze.passage);
  return `
    <h2 class="section-heading">Section A — 选词填空</h2>
    <div class="word-bank">${paper.cloze.wordBank.map(item =>
      `<div class="bank-item">
        <button class="bank-word" data-bank="${item.letter}: ${item.word}">${item.letter} · ${item.word}</button>
        <button class="bank-meaning" data-word="${item.word.toLowerCase()}">释义</button>
      </div>`
    ).join("")}</div>
    <div class="reading-text">
      ${paragraphs.map((paragraph, index) => renderParagraph(paragraph, `${paper.id}-cloze-${index}`, index)).join("")}
    </div>`;
}

function renderParagraph(text, key, index) {
  const withWords = clickableText(text).replace(/\b(2[6-9]|3[0-5])\b/g, number => {
    const value = state.answers[answerKey(number)];
    return `<button class="blank" id="q-${number}" data-blank="${number}">${value || number}</button>`;
  });
  return `
    <section class="para-block">
      <span class="para-label">PARAGRAPH ${String(index + 1).padStart(2, "0")}</span>
      <p>${withWords}</p>
      ${renderTranslateControl(key, "查看本段翻译")}
    </section>`;
}

function renderPassage(paper, index) {
  const passage = paper.passages[index];
  return `
    <h2 class="section-heading">Section C — ${passage.title}</h2>
    <div class="reading-text">
      ${passage.paragraphs.map((paragraph, paragraphIndex) =>
        renderParagraph(paragraph, `${paper.id}-p${index}-${paragraphIndex}`, paragraphIndex)
      ).join("")}
    </div>
    <div class="question-list">
      <h2 class="section-heading">阅读题目</h2>
      ${passage.questions.map(question => renderQuestion(question)).join("")}
    </div>`;
}

function renderQuestion(question) {
  return `
    <section class="question-card" id="q-${question.number}">
      <p class="question-stem">${question.number}. ${clickableText(question.stem)}</p>
      ${renderTranslateControl(`q-${question.number}-stem`, "查看题干翻译")}
      ${question.choices.map(choice => `
        <label class="choice">
          <input type="radio" name="q-${question.number}" data-question="${question.number}" value="${choice.letter}" ${state.answers[answerKey(question.number)] === choice.letter ? "checked" : ""}>
          <span class="choice-text"><b>${choice.letter}.</b> ${clickableText(choice.text)}</span>
          <span class="choice-tools">${renderTranslateControl(`q-${question.number}-${choice.letter}`, `查看 ${choice.letter} 选项翻译`)}</span>
        </label>`).join("")}
    </section>`;
}

function renderTranslateControl(key, label) {
  const translation = state.translations[key];
  if (translation && state.visibleTranslations.has(key)) {
    return `<div class="translate-row"><button class="translate-button" data-collapse="${key}">收起翻译</button><div class="translation">${escapeHtml(translation)}</div></div>`;
  }
  return `<div class="translate-row"><button class="translate-button" data-show-translation="${key}">▶ ${label}</button></div>`;
}

function showMissingTranslation(button) {
  const row = button.closest(".translate-row");
  row.innerHTML = `<button class="translate-button" disabled>暂无本地翻译</button>
    <div class="translation">这条内容还没有写入本地翻译库，所以不会联网等待。需要的话，我可以在你明确同意后一次性生成并写入本地译文。</div>`;
}

function openWordSheet(word) {
  document.querySelectorAll(".active-word").forEach(node => node.classList.remove("active-word"));
  document.querySelectorAll(`[data-word="${CSS.escape(word)}"]`).forEach(node => node.classList.add("active-word"));
  const info = getWordInfo(word);
  wordSheetContent.innerHTML = `
    <h2 class="word-title">${escapeHtml(info.word)} <span class="word-phonetic">${escapeHtml(info.phonetic)}</span></h2>
    <div class="word-meaning"><b>词性：</b>${escapeHtml(info.pos)}</div>
    <div class="word-meaning"><b>考研常见意思：</b>${escapeHtml(info.meaning)}</div>`;
  wordSheet.classList.add("open");
}

document.addEventListener("click", event => {
  const openPaper = event.target.closest("[data-open-paper]");
  if (openPaper) {
    state.paperIndex = Number(openPaper.dataset.openPaper);
    renderStudy();
    save();
    return;
  }
  if (event.target.closest("[data-home]")) { renderHome(); return; }
  const tab = event.target.closest("[data-view]");
  if (tab) { state.view = tab.dataset.view; renderStudy(); save(); return; }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    const number = Number(jump.dataset.jump);
    const nextView = number <= 35 ? "cloze" : number <= 50 ? "passage-0" : "passage-1";
    if (state.view !== nextView) { state.view = nextView; renderStudy(); }
    requestAnimationFrame(() => {
      const target = document.querySelector(`#q-${number}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.classList.add("blank-target");
      setTimeout(() => target?.classList.remove("blank-target"), 1200);
    });
    save();
    return;
  }
  const meaning = event.target.closest("[data-word]");
  if (meaning) { openWordSheet(meaning.dataset.word); return; }
  const bank = event.target.closest("[data-bank]");
  if (bank) {
    state.selectedBankWord = bank.dataset.bank;
    document.querySelectorAll(".bank-word").forEach(node => node.classList.toggle("selected", node === bank));
    return;
  }
  const blank = event.target.closest("[data-blank]");
  if (blank) {
    if (!state.selectedBankWord) { toast("请先选择词库里的单词"); return; }
    state.answers[answerKey(blank.dataset.blank)] = state.selectedBankWord;
    state.selectedBankWord = null;
    renderStudy();
    save();
    return;
  }
  const showTranslation = event.target.closest("[data-show-translation]");
  if (showTranslation) {
    const key = showTranslation.dataset.showTranslation;
    if (state.translations[key]) {
      state.visibleTranslations.add(key);
      renderStudy();
    }
    else showMissingTranslation(showTranslation);
    return;
  }
  const collapse = event.target.closest("[data-collapse]");
  if (collapse) {
    state.visibleTranslations.delete(collapse.dataset.collapse);
    renderStudy();
    return;
  }
  if (event.target.closest("[data-reset]")) {
    const paper = state.papers[state.paperIndex];
    const numbers = state.view === "cloze"
      ? Array.from({ length: 10 }, (_, i) => i + 26)
      : paper.passages[Number(state.view.at(-1))].questions.map(q => q.number);
    numbers.forEach(number => delete state.answers[answerKey(number)]);
    renderStudy();
    save();
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-question]")) {
    state.answers[answerKey(event.target.dataset.question)] = event.target.value;
    save();
    const jump = document.querySelector(`[data-jump="${event.target.dataset.question}"]`);
    jump?.classList.add("done");
  }
});

document.querySelector("#close-word-sheet").addEventListener("click", () => {
  wordSheet.classList.remove("open");
  document.querySelectorAll(".active-word").forEach(node => node.classList.remove("active-word"));
});

Promise.all([
  fetch("data/papers.json").then(response => response.json()),
  fetch("data/translations.json").then(response => response.ok ? response.json() : {}).catch(() => ({})),
  fetch("data/lexicon.json").then(response => response.ok ? response.json() : {}).catch(() => ({})),
])
  .then(([data, translations, localLexicon]) => {
    state.papers = data.papers;
    state.translations = translations;
    state.localLexicon = localLexicon;
    renderHome();
  })
  .catch(() => {
    app.innerHTML = `<section class="home"><div class="home-card"><h1>内容加载失败</h1><p>请通过网站地址打开本页面。</p></div></section>`;
  });
