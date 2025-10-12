/* ================= CONFIG ================= */
const APP_VERSION = "1.2";
const STORAGE_KEY = "savedDescriptions_v1_2";
const OLD_KEY = "savedDescriptions_v1_1_1"; // migrate if exists

// DELETE SVG (user-provided 'X' icon) - set fill to currentColor so it follows header text color
const DELETE_SVG = `<svg viewBox="-3.5 0 19 19" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;display:block;"><path d="M11.383 13.644A1.03 1.03 0 0 1 9.928 15.1L6 11.172 2.072 15.1a1.03 1.03 0 1 1-1.455-1.456l3.928-3.928L.617 5.79a1.03 1.03 0 1 1 1.455-1.456L6 8.261l3.928-3.928a1.03 1.03 0 0 1 1.455 1.456L7.455 9.716z" fill="currentColor"/></svg>`;

// Shafa icon URL (for copy-without-price) -> we will embed as <img> in button
const COPY_NOPRICE_ICON = "https://shafa.c.prom.st/favicon-32x32.png";

/* ================ BRANDS (autocomplete) ================ */
const BRANDS = [
  "ZARA","H&M","M&S","George","Primark","F&F","Stradivarius","Bershka",
  "Pull & Bear","COS","Arket","Massimo Dutty","Next","New Look","& Other Stories",
  "Mango","ASOS","Topshop","Monki","Reiss","Autograph","Hugo Boss","Cashmere",
  "Woolmark","Ralph Lauren","Max Mara","Only","C&A","Weekday","Calvin Klein"
];

/* ================ CATEGORY FIELDS & numeric list ================ */
const categoryFields = {
  sweater: ["по груди","по низу","рукав","довжина"],
  pants: ["по пояс","по стегна","посадка","довжина","ширина внизу"],
  skirt: ["по пояс","по стегна","довжина"],
  tshirt: ["по груди","по низу","довжина"],
  outerwear: ["плечі","по груди","по низу","рукав","довжина"],
  dress: ["по груди","по талія","по стегна","рукав","довжина"]
};

const numericFields = ["по груди","по низу","рукав","довжина","по пояс","по стегна","посадка","ширина внизу","плечі","по талія"];

/* =================== UTIL =================== */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function autosize(el){
  if(!el) return;
  el.style.height = "auto";
  el.style.height = Math.max(160, el.scrollHeight) + "px";
}

/* ================= SPLASH HIDE ================= */
window.addEventListener("load", ()=>{
  const splash = document.getElementById("splash");
  setTimeout(()=> {
    if(splash) splash.style.opacity = "0";
    setTimeout(()=> {
      if(splash && splash.parentNode) splash.parentNode.removeChild(splash);
      document.getElementById("app").classList.remove("hidden");
    }, 420);
  }, 700);
});
// fallback
setTimeout(()=>{ const s = document.getElementById("splash"); if(s && s.parentNode){ s.parentNode.removeChild(s); document.getElementById("app").classList.remove("hidden"); } }, 6000);

/* ================= BRAND AUTOCOMPLETE ================= */
const brandInput = $("#brand");
const suggestionsEl = $("#brandSuggestions");
let currentSuggestions = [];
let suggestionIndex = -1;

brandInput.addEventListener("input", onBrandInput);
brandInput.addEventListener("keydown", onBrandKeyDown);
brandInput.addEventListener("blur", ()=> setTimeout(()=> suggestionsEl.style.display='none', 140));

function onBrandInput(e){
  const v = e.target.value.trim().toLowerCase();
  if(!v){ suggestionsEl.style.display='none'; currentSuggestions=[]; suggestionIndex=-1; return; }
  currentSuggestions = BRANDS.filter(b => b.toLowerCase().includes(v));
  currentSuggestions.sort((a,b)=>{
    const av=a.toLowerCase(), bv=b.toLowerCase();
    const sa = av.startsWith(v), sb = bv.startsWith(v);
    if(sa && !sb) return -1;
    if(!sa && sb) return 1;
    return a.localeCompare(b);
  });
  renderBrandSuggestions();
}
function renderBrandSuggestions(){
  suggestionsEl.innerHTML = "";
  if(!currentSuggestions.length){ suggestionsEl.style.display='none'; return; }
  currentSuggestions.forEach((s,i)=>{
    const div = document.createElement("div");
    div.className = "suggestion";
    div.textContent = s;
    if(i===suggestionIndex) div.classList.add("active");
    div.addEventListener("mousedown", (ev)=> {
      brandInput.value = s;
      suggestionsEl.style.display='none';
      suggestionIndex = -1;
    });
    suggestionsEl.appendChild(div);
  });
  suggestionsEl.style.display = 'block';
}
function onBrandKeyDown(e){
  if(suggestionsEl.style.display === 'none') return;
  if(e.key === "ArrowDown"){ e.preventDefault(); suggestionIndex = Math.min(suggestionIndex+1, currentSuggestions.length-1); renderBrandSuggestions(); }
  else if(e.key === "ArrowUp"){ e.preventDefault(); suggestionIndex = Math.max(suggestionIndex-1, 0); renderBrandSuggestions(); }
  else if(e.key === "Enter"){ e.preventDefault(); if(suggestionIndex>=0 && currentSuggestions[suggestionIndex]){ brandInput.value = currentSuggestions[suggestionIndex]; suggestionsEl.style.display='none'; suggestionIndex=-1; } }
  else if(e.key === "Escape"){ suggestionsEl.style.display='none'; suggestionIndex=-1; }
}

/* ================= CATEGORY RENDER ================= */
const categoryGroup = document.getElementById("categoryGroup");
const catFieldsContainer = document.getElementById("categoryFields");
let activeCategory = null;

categoryGroup.addEventListener("click", (ev)=>{
  const pill = ev.target.closest(".category-pill");
  if(!pill) return;
  const cat = pill.dataset.cat;
  [...categoryGroup.querySelectorAll(".category-pill")].forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  activeCategory = cat;
  renderCategoryFields(cat);
});

function renderCategoryFields(cat){
  catFieldsContainer.innerHTML = "";
  if(!cat || !categoryFields[cat]) return;
  categoryFields[cat].forEach(field=>{
    const row = document.createElement("div");
    row.className = "cat-row";
    const lbl = document.createElement("label");
    lbl.textContent = field;
    const inp = document.createElement("input");
    if(numericFields.includes(field)){
      inp.type = "number";
      inp.inputMode = "numeric";
      inp.pattern = "[0-9]*";
    } else {
      inp.type = "text";
    }
    inp.dataset.field = field;
    row.appendChild(lbl);
    row.appendChild(inp);
    catFieldsContainer.appendChild(row);
  });
  if(cat === "sweater" || cat === "outerwear" || cat === "dress"){
    // add "Рукав від горловини" checkbox beneath
    const cbRow = document.createElement("div");
    cbRow.className = "cat-row";
    const spacer = document.createElement("label");
    spacer.textContent = ""; spacer.style.visibility = "hidden";
    const cbWrapper = document.createElement("div");
    cbWrapper.style.display = "flex";
    cbWrapper.style.alignItems = "center";
    cbWrapper.innerHTML = `<label style="font-weight:600"><input id="fromNeck" type="checkbox"> Рукав від горловини</label>`;
    cbRow.appendChild(spacer);
    cbRow.appendChild(cbWrapper);
    catFieldsContainer.appendChild(cbRow);
  }
}

/* ================= BUILD OUTPUT ================= */
function buildResultText(){
  const price = $("#price").value.trim();
  const brand = $("#brand").value.trim();
  const desc = $("#descInput").value.trim();
  const cond = (document.querySelector('input[name="state"]:checked') || {}).value || "";
  const sizes = $all('.sizes input[type="checkbox"]:checked').map(c=>c.value);
  let out = "";
  if(price) out += `💸Ціна ${price} грн\n`;
  if(brand) out += `${brand}\n`;
  if(desc) out += `${desc}\n`;
  if(cond) out += `${cond}\n`;
  out += "—————————\n";
  if(sizes.length) out += `розмір ${sizes.join("/")} \n`;

  if(activeCategory){
    $all('#categoryFields input[data-field]').forEach(inp=>{
      if(inp.value && inp.value.toString().trim() !== ""){
        out += `${inp.dataset.field} ${inp.value.toString().trim()}\n`;
      }
    });
    const fromNeck = $("#fromNeck");
    if(fromNeck && fromNeck.checked){
      out = out.replace(/(рукав\s+)/, "рукав від горловини ");
    }
  }
  out += "—————————\n";
  const mats = $all('.materials input:checked').map(i=>i.value);
  const custom = $("#materialCustom").value.trim();
  if(custom) mats.push(custom);
  if(mats.length) out += mats.join("/") + "\n";
  return out.trim();
}

/* ================= AUTOSIZE OUTPUT ================= */
const outputEl = $("#output");
function updateOutputHeight(){ autosize(outputEl); }
outputEl.addEventListener("input", updateOutputHeight);
autosize(outputEl);

/* ================= LOCAL STORAGE (load/migrate) ================= */
let savedData = [];
function loadSavedData(){
  // migrate from OLD_KEY if exists and STORAGE_KEY empty
  try{
    const old = localStorage.getItem(OLD_KEY);
    const cur = localStorage.getItem(STORAGE_KEY);
    if(old && !cur){
      localStorage.setItem(STORAGE_KEY, old);
      localStorage.removeItem(OLD_KEY);
    }
  }catch(e){}
  try{
    savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") || [];
  }catch(e){ savedData = []; }
}
function persistSaved(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData)); }

/* ================= RENDER SAVED LIST (accordion) ================= */
const savedListEl = $("#savedList");
function renderSavedList(){
  savedListEl.innerHTML = "";
  savedData.forEach((item, idx) => {
    const wrapper = document.createElement("div"); wrapper.className = "saved-item";
    const header = document.createElement("div"); header.className = "saved-header" + (item.copied ? " copied" : "");
    const title = document.createElement("div"); title.textContent = item.title;
    const actions = document.createElement("div"); actions.className = "saved-actions";

    // copy all button
    const copyAllBtn = document.createElement("button"); copyAllBtn.className = "icon-btn"; copyAllBtn.title = "Копіювати весь опис";
    copyAllBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16 1H4a1 1 0 0 0-1 1v14h2V3h11V1zm3 4H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm-1 16H9V7h9v14z"/></svg>`;

    // copy-without-price button (use image icon)
    const copyNoPriceBtn = document.createElement("button"); copyNoPriceBtn.className = "icon-btn"; copyNoPriceBtn.title = "Копіювати без ціни";
    const img = document.createElement("img"); img.src = COPY_NOPRICE_ICON; img.alt="cp"; copyNoPriceBtn.appendChild(img);

    // delete button (use DELETE_SVG)
    const delBtn = document.createElement("button"); delBtn.className = "icon-btn"; delBtn.title = "Видалити";
    delBtn.innerHTML = DELETE_SVG;

    actions.appendChild(copyAllBtn);
    actions.appendChild(copyNoPriceBtn);
    actions.appendChild(delBtn);

    header.appendChild(title);
    header.appendChild(actions);

    const body = document.createElement("div"); body.className = "saved-body"; body.textContent = item.text;

    // toggle body on header click (ignore clicks on action buttons)
    header.addEventListener("click", (ev)=>{
      if(ev.target.closest(".icon-btn")) return;
      const isVisible = body.style.display === "block";
      body.style.display = isVisible ? "none" : "block";
    });

    // copy all behavior (mark copied)
    copyAllBtn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      copyToClipboard(item.text);
      item.copied = true;
      persistSaved();
      renderSavedList();
    });

    // copy without price
    copyNoPriceBtn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      // remove first non-empty line that starts with 💸Ціна or first line unconditionally
      const lines = item.text.split(/\r?\n/);
      let startIdx = 0;
      // if first line contains 'Ціна' or emoji, skip it
      if(lines.length && /цiн|ціна|💸/i.test(lines[0])) startIdx = 1;
      const noPrice = lines.slice(startIdx).join("\n");
      copyToClipboard(noPrice);
      // do NOT mark as copied (only copyAll marks as copied), unless you want both to mark
    });

    // delete
    delBtn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      if(!confirm("Видалити цей збережений опис?")) return;
      savedData.splice(idx,1);
      persistSaved();
      renderSavedList();
    });

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    savedListEl.appendChild(wrapper);
  });
}

/* ================= COPY helper ================= */
function copyToClipboard(text){
  if(!text) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).catch(()=> fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  ta.remove();
}

/* ================= BUTTONS: generate/copy/save ================= */
$("#btnGenerate").addEventListener("click", ()=>{
  const t = buildResultText();
  outputEl.value = t;
  autosize(outputEl);
});

$("#btnCopy").addEventListener("click", ()=>{
  if(!outputEl.value) return;
  copyToClipboard(outputEl.value);
});

$("#btnSave").addEventListener("click", ()=>{
  const text = outputEl.value.trim();
  if(!text){ alert("Немає тексту для збереження."); return; }
  const title = $("#descInput").value.trim() || "Без назви";
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
  savedData.unshift({ id, title, text, copied: false });
  persistSaved();
  renderSavedList();
  // clear inputs for new entry (leave saved list)
  clearFormInputsKeepingSaved();
});

/* ============== CLEAR ALL (saved items) ============== */
$("#btnClearAll").addEventListener("click", ()=>{
  if(!confirm("Видалити всі збережені описі?")) return;
  savedData = [];
  persistSaved();
  renderSavedList();
});

/* ============== FLOATING CLEAR (clears form inputs only) ============== */
$("#fabClear").addEventListener("click", ()=>{
  if(!confirm("Очистити всі поля форми?")) return;
  clearFormInputsKeepingSaved();
});

/* ============== FORM CLEAR HELPERS ============== */
function clearFormInputsKeepingSaved(){
  $all('input[type="text"], input[type="number"], textarea').forEach(i => i.value = "");
  $all('input[type="checkbox"], input[type="radio"]').forEach(i => i.checked = false);
  catFieldsContainer.innerHTML = "";
  outputEl.value = "";
  autosize(outputEl);
  [...document.querySelectorAll(".category-pill")].forEach(p => p.classList.remove("active"));
  activeCategory = null;
  suggestionsEl.style.display = "none";
}

/* ============== INIT (load saved etc) ============== */
loadSavedData();
renderSavedList();
autosize(outputEl);

/* ============== UTILITY: prevent accidental Enter submit ============== */
document.addEventListener("keydown", function(e){
  if(e.key === "Enter" && e.target.tagName.toLowerCase() !== "textarea"){
    e.preventDefault();
  }
});