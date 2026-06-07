const state = {
  papers: [],
  paperIndex: Number(localStorage.getItem("cet4-paper") || 0),
  view: localStorage.getItem("cet4-view") || "cloze",
  selectedBankWord: null,
  answers: JSON.parse(localStorage.getItem("cet4-answers") || "{}"),
  translations: JSON.parse(localStorage.getItem("cet4-translations") || "{}"),
  vocabulary: JSON.parse(localStorage.getItem("cet4-vocabulary") || "{}"),
};

const content = document.querySelector("#content");
const picker = document.querySelector("#paper-picker");
const wordDialog = document.querySelector("#word-dialog");
const vocabularyDialog = document.querySelector("#vocabulary-dialog");

const save = () => {
  localStorage.setItem("cet4-paper", state.paperIndex);
  localStorage.setItem("cet4-view", state.view);
  localStorage.setItem("cet4-answers", JSON.stringify(state.answers));
  localStorage.setItem("cet4-translations", JSON.stringify(state.translations));
  localStorage.setItem("cet4-vocabulary", JSON.stringify(state.vocabulary));
};

function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 1800);
}

function answerKey(number) {
  return `${state.papers[state.paperIndex].id}-${number}`;
}

function clickableText(text) {
  return text.replace(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g, word =>
    `<span class="lookup-word" data-word="${word.toLowerCase()}">${word}</span>`
  );
}

function renderPicker() {
  picker.innerHTML = state.papers.map((paper, index) =>
    `<button class="paper-chip ${index === state.paperIndex ? "active" : ""}" data-paper="${index}">${paper.title.replace("四级真题", "")}</button>`
  ).join("");
}

function currentNumbers() {
  const paper = state.papers[state.paperIndex];
  return state.view === "cloze"
    ? Array.from({ length: 10 }, (_, i) => i + 26)
    : paper.passages[Number(state.view.at(-1))].questions.map(q => q.number);
}

function renderQuestionJumper() {
  const group = (label, numbers) => `<span class="jump-label">${label}</span>${numbers.map(number =>
    `<button class="question-jump ${state.answers[answerKey(number)] ? "done" : ""}" data-jump="${number}">${number}</button>`
  ).join("")}`;
  document.querySelector("#question-jumper").innerHTML =
    group("选词填空", Array.from({ length: 10 }, (_, i) => i + 26)) +
    group("仔细阅读", Array.from({ length: 10 }, (_, i) => i + 46));
}

function renderCloze(paper) {
  const chosen = Object.fromEntries(
    Object.entries(state.answers).filter(([key]) => key.startsWith(`${paper.id}-`))
  );
  const passage = clickableText(paper.cloze.passage).replace(/\b(2[6-9]|3[0-5])\b/g, number => {
    const value = chosen[`${paper.id}-${number}`];
    return `<button class="blank" id="q-${number}" data-blank="${number}">${value || number}</button>`;
  });
  content.innerHTML = `
    <h2>Section A · 选词填空</h2>
    <p class="section-intro">点击词库中的单词，再点击正文空格。点击正文里的其他英文单词可以查词。</p>
    <div class="word-bank">${paper.cloze.wordBank.map(item =>
      `<button class="bank-word" data-bank="${item.letter}: ${item.word}">${item.letter} · ${item.word}</button>`
    ).join("")}</div>
    <div class="reading-text"><p>${passage}</p></div>
    <div class="translation" id="cloze-translation">${translationButton(`${paper.id}-cloze`, paper.cloze.passage)}</div>`;
  updateProgress();
}

function translationButton(key, text) {
  if (state.translations[key]) return state.translations[key];
  return `<button class="translate-button" data-translate="${encodeURIComponent(key)}" data-text="${encodeURIComponent(text)}">查看本段翻译</button>`;
}

function renderPassage(paper, index) {
  const passage = paper.passages[index];
  content.innerHTML = `
    <h2>Section C · ${passage.title}</h2>
    <p class="section-intro">逐段精读：点单词查词，点每段下方按钮查看中文翻译。</p>
    <div class="reading-text">
      ${passage.paragraphs.map((paragraph, paragraphIndex) => `
        <section class="paragraph-card">
          <span class="paragraph-number">PARAGRAPH ${String(paragraphIndex + 1).padStart(2, "0")}</span>
          <p>${clickableText(paragraph)}</p>
          <div class="translation">${translationButton(`${paper.id}-${index}-${paragraphIndex}`, paragraph)}</div>
        </section>`).join("")}
    </div>
    <div class="question-list">
      <h2>阅读题目</h2>
      ${passage.questions.map(question => `
        <section class="question" id="q-${question.number}">
          <p>${question.number}. ${clickableText(question.stem)}</p>
          ${question.choices.map(choice => `
            <label class="choice">
              <input type="radio" name="q-${question.number}" data-question="${question.number}" value="${choice.letter}" ${state.answers[answerKey(question.number)] === choice.letter ? "checked" : ""}>
              <span><b>${choice.letter}.</b> ${clickableText(choice.text)}</span>
            </label>`).join("")}
        </section>`).join("")}
    </div>`;
  updateProgress();
}

function render() {
  const paper = state.papers[state.paperIndex];
  renderPicker();
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === state.view));
  const meta = state.view === "cloze"
    ? ["选词填空", "先通读全文，再从词库中点击一个词，并点击对应空格填入。"]
    : [state.view === "passage-0" ? "仔细阅读一" : "仔细阅读二", "点单词查释义与发音，按段查看翻译，再完成文后题目。"];
  document.querySelector("#section-title").textContent = meta[0];
  document.querySelector("#section-tip").textContent = meta[1];
  state.view === "cloze" ? renderCloze(paper) : renderPassage(paper, Number(state.view.at(-1)));
  renderQuestionJumper();
  document.querySelector("#saved-count").textContent = Object.keys(state.vocabulary).length;
  save();
}

function updateProgress() {
  const numbers = currentNumbers();
  const done = numbers.filter(number => state.answers[answerKey(number)]).length;
  document.querySelector("#progress-text").textContent = `${done} / ${numbers.length}`;
  document.querySelector("#progress-bar").style.width = `${done / numbers.length * 100}%`;
}

async function translate(text) {
  const chunks = text.match(/.{1,430}(?:\s|$)/g) || [text];
  const results = [];
  for (const chunk of chunks) {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk.trim())}&langpair=en|zh-CN`);
    if (!response.ok) throw new Error("translation failed");
    const data = await response.json();
    results.push(data.responseData.translatedText);
  }
  return results.join("");
}

async function lookupWord(word) {
  wordDialog.showModal();
  const cached = state.vocabulary[word];
  document.querySelector("#word-dialog-content").innerHTML = `<p class="eyebrow">WORD LOOKUP</p><h2 class="word-heading">${word}</h2><p>正在查询...</p>`;
  try {
    const [dictionaryResponse, chinese] = await Promise.all([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      translate(word),
    ]);
    const entries = dictionaryResponse.ok ? await dictionaryResponse.json() : [];
    const entry = entries[0] || {};
    const meanings = (entry.meanings || []).slice(0, 3);
    const html = `
      <p class="eyebrow">WORD LOOKUP</p>
      <h2 class="word-heading">${word}</h2>
      <p class="phonetic">${entry.phonetic || ""} · ${chinese}</p>
      ${entry.phonetics?.find(p => p.audio)?.audio ? `<audio controls src="${entry.phonetics.find(p => p.audio).audio}"></audio>` : ""}
      ${meanings.map(item => `<div class="definition"><b>${item.partOfSpeech}</b><p>${item.definitions?.[0]?.definition || ""}</p></div>`).join("")}
      <button class="primary-button save-word" data-save-word="${word}">${cached ? "已加入生词本" : "加入生词本"}</button>`;
    document.querySelector("#word-dialog-content").innerHTML = html;
    wordDialog.dataset.currentChinese = chinese;
  } catch {
    document.querySelector("#word-dialog-content").innerHTML = `<h2 class="word-heading">${word}</h2><p>暂时无法连接词典服务，请稍后再试。</p>`;
  }
}

document.addEventListener("click", async event => {
  const paperButton = event.target.closest("[data-paper]");
  if (paperButton) { state.paperIndex = Number(paperButton.dataset.paper); render(); return; }
  const tab = event.target.closest("[data-view]");
  if (tab) { state.view = tab.dataset.view; render(); return; }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    const number = Number(jump.dataset.jump);
    const targetView = number <= 35 ? "cloze" : number <= 50 ? "passage-0" : "passage-1";
    if (state.view !== targetView) { state.view = targetView; render(); }
    requestAnimationFrame(() => {
      const target = document.querySelector(`#q-${number}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (targetView === "cloze") {
        target?.classList.add("blank-target");
        setTimeout(() => target?.classList.remove("blank-target"), 1400);
      }
    });
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
    if (!state.selectedBankWord) { toast("请先选择词库中的单词"); return; }
    state.answers[answerKey(blank.dataset.blank)] = state.selectedBankWord;
    state.selectedBankWord = null;
    render();
    return;
  }
  const word = event.target.closest("[data-word]");
  if (word) { lookupWord(word.dataset.word); return; }
  const translateButton = event.target.closest("[data-translate]");
  if (translateButton) {
    const key = decodeURIComponent(translateButton.dataset.translate);
    translateButton.disabled = true;
    translateButton.textContent = "翻译中...";
    try {
      state.translations[key] = await translate(decodeURIComponent(translateButton.dataset.text));
      save();
      render();
    } catch {
      translateButton.disabled = false;
      translateButton.textContent = "暂时无法翻译，点击重试";
    }
    return;
  }
  const saveWord = event.target.closest("[data-save-word]");
  if (saveWord) {
    const wordValue = saveWord.dataset.saveWord;
    state.vocabulary[wordValue] = wordDialog.dataset.currentChinese || "";
    save();
    render();
    saveWord.textContent = "已加入生词本";
    toast("已加入生词本");
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-question]")) {
    state.answers[answerKey(event.target.dataset.question)] = event.target.value;
    save();
    updateProgress();
  }
});

document.querySelectorAll(".dialog-close").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelector("#reset-current").addEventListener("click", () => {
  const paper = state.papers[state.paperIndex];
  const numbers = state.view === "cloze" ? Array.from({ length: 10 }, (_, i) => i + 26) : paper.passages[Number(state.view.at(-1))].questions.map(q => q.number);
  numbers.forEach(number => delete state.answers[answerKey(number)]);
  render();
});
document.querySelector("#open-vocabulary").addEventListener("click", () => {
  document.querySelector("#vocabulary-list").innerHTML = Object.entries(state.vocabulary).length
    ? Object.entries(state.vocabulary).map(([word, chinese]) => `<div class="saved-word"><b>${word}</b><br><span>${chinese}</span></div>`).join("")
    : "<p>还没有收藏单词。阅读时点击英文单词即可添加。</p>";
  vocabularyDialog.showModal();
});

fetch("data/papers.json")
  .then(response => response.json())
  .then(data => { state.papers = data.papers; render(); })
  .catch(() => { content.innerHTML = "<h2>内容加载失败</h2><p>请通过网站服务器打开本页面。</p>"; });
