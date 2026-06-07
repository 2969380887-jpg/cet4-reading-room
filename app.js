const app = document.querySelector("#app");
const wordSheet = document.querySelector("#word-sheet");
const wordSheetContent = document.querySelector("#word-sheet-content");

const state = {
  papers: [],
  paperIndex: Number(localStorage.getItem("cet4-paper") || 0),
  view: localStorage.getItem("cet4-view") || "cloze",
  selectedBankWord: null,
  answers: JSON.parse(localStorage.getItem("cet4-answers") || "{}"),
  translations: JSON.parse(localStorage.getItem("cet4-translations") || "{}"),
  wordCache: JSON.parse(localStorage.getItem("cet4-word-cache") || "{}"),
};

const commonWords = {
  intensity: "强度；强烈",
  exercise: "锻炼；练习",
  evidence: "证据",
  guideline: "指导方针",
  beneficial: "有益的",
  physical: "身体的；物理的",
  mental: "心理的；精神的",
  health: "健康",
  review: "综述；评论；复习",
  influence: "影响",
  mood: "情绪",
  climate: "气候",
  warming: "变暖",
  global: "全球的",
  species: "物种",
  research: "研究",
  scientist: "科学家",
  financial: "金融的；财务的",
  education: "教育",
  literacy: "读写能力；素养",
  confidence: "信心",
  security: "安全；保障",
  nature: "自然",
  public: "公共的",
  community: "社区；群体",
  engineer: "工程师",
  engineering: "工程学",
  challenge: "挑战",
  responsibility: "责任",
  balance: "平衡",
  stress: "压力",
  flexible: "灵活的",
};

function save() {
  localStorage.setItem("cet4-paper", state.paperIndex);
  localStorage.setItem("cet4-view", state.view);
  localStorage.setItem("cet4-answers", JSON.stringify(state.answers));
  localStorage.setItem("cet4-translations", JSON.stringify(state.translations));
  localStorage.setItem("cet4-word-cache", JSON.stringify(state.wordCache));
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

function clickableText(text) {
  return escapeHtml(text).replace(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g, word => {
    const value = word.toLowerCase().replace(/[’']/g, "");
    return `<span class="lookup-word" data-word="${value}">${word}</span>`;
  });
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
      `<button class="bank-word" data-bank="${item.letter}: ${item.word}">${item.letter} · ${item.word}</button>`
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
      ${renderTranslateControl(key, text, "查看本段翻译")}
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
      ${renderTranslateControl(`q-${question.number}-stem`, question.stem, "查看题干翻译")}
      ${question.choices.map(choice => `
        <label class="choice">
          <input type="radio" name="q-${question.number}" data-question="${question.number}" value="${choice.letter}" ${state.answers[answerKey(question.number)] === choice.letter ? "checked" : ""}>
          <span class="choice-text"><b>${choice.letter}.</b> ${clickableText(choice.text)}</span>
          <span class="choice-tools">${renderTranslateControl(`q-${question.number}-${choice.letter}`, choice.text, `查看 ${choice.letter} 选项翻译`)}</span>
        </label>`).join("")}
    </section>`;
}

function renderTranslateControl(key, text, label) {
  if (state.translations[key]) {
    return `<div class="translate-row"><button class="translate-button" data-collapse="${key}">收起翻译</button><div class="translation">${escapeHtml(state.translations[key])}</div></div>`;
  }
  return `<div class="translate-row"><button class="translate-button" data-translate="${encodeURIComponent(key)}" data-text="${encodeURIComponent(text)}">▶ ${label}</button></div>`;
}

function render() {
  state.papers.length ? renderStudy() : renderHome();
  save();
}

async function translate(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks = normalized.match(/.{1,420}(?:\s|$)/g) || [normalized];
  const results = [];
  for (const chunk of chunks) {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk.trim())}&langpair=en|zh-CN`);
    if (!response.ok) throw new Error("translation failed");
    const data = await response.json();
    results.push(data.responseData?.translatedText || "");
  }
  return results.join("");
}

function openWordSheet(word) {
  document.querySelectorAll(".active-word").forEach(node => node.classList.remove("active-word"));
  document.querySelectorAll(`[data-word="${CSS.escape(word)}"]`).forEach(node => node.classList.add("active-word"));
  const cached = state.wordCache[word];
  wordSheetContent.innerHTML = cached ? wordHtml(cached) : `
    <h2 class="word-title">${word}</h2>
    <div class="word-phonetic">正在查询释义...</div>
    <div class="word-meaning">考研释义：${commonWords[word] || "查询中"}</div>`;
  wordSheet.classList.add("open");
  if (!cached) lookupWord(word);
}

function wordHtml(info) {
  return `
    <h2 class="word-title">${escapeHtml(info.word)} <span class="word-phonetic">${escapeHtml(info.phonetic || "")}</span></h2>
    <div class="word-meaning">考研释义：${escapeHtml(info.chinese || commonWords[info.word] || "暂无中文释义")}</div>
    ${info.definition ? `<div class="word-definition">${escapeHtml(info.definition)}</div>` : ""}
    ${info.audio ? `<audio controls src="${info.audio}"></audio>` : ""}`;
}

async function lookupWord(word) {
  try {
    const [dictionaryResponse, chinese] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      translate(word),
    ]);
    let entry = {};
    if (dictionaryResponse.status === "fulfilled" && dictionaryResponse.value.ok) {
      const entries = await dictionaryResponse.value.json();
      entry = entries[0] || {};
    }
    const definition = entry.meanings?.[0]?.definitions?.[0]?.definition || "";
    const audio = entry.phonetics?.find(item => item.audio)?.audio || "";
    const info = {
      word,
      phonetic: entry.phonetic || entry.phonetics?.find(item => item.text)?.text || "",
      chinese: chinese.status === "fulfilled" ? chinese.value : commonWords[word] || "",
      definition,
      audio,
    };
    state.wordCache[word] = info;
    save();
    wordSheetContent.innerHTML = wordHtml(info);
  } catch {
    wordSheetContent.innerHTML = wordHtml({
      word,
      chinese: commonWords[word] || "网络查询失败，请稍后再试",
      definition: "",
    });
  }
}

document.addEventListener("click", async event => {
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
  const word = event.target.closest("[data-word]");
  if (word) { openWordSheet(word.dataset.word); return; }
  const translateButton = event.target.closest("[data-translate]");
  if (translateButton) {
    const key = decodeURIComponent(translateButton.dataset.translate);
    translateButton.disabled = true;
    translateButton.textContent = "翻译中...";
    try {
      state.translations[key] = await translate(decodeURIComponent(translateButton.dataset.text));
      renderStudy();
      save();
    } catch {
      translateButton.disabled = false;
      translateButton.textContent = "翻译失败，点击重试";
    }
    return;
  }
  const collapse = event.target.closest("[data-collapse]");
  if (collapse) {
    delete state.translations[collapse.dataset.collapse];
    renderStudy();
    save();
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

fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    state.papers = data.papers;
    renderHome();
  })
  .catch(() => {
    app.innerHTML = `<section class="home"><div class="home-card"><h1>内容加载失败</h1><p>请通过网站地址打开本页面。</p></div></section>`;
  });
