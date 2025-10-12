/* ==================== CONFIGURATION ==================== */
const CONFIG = {
  APP_VERSION: "1.2",
  STORAGE_KEY: "savedDescriptions_v1_2",
  OLD_STORAGE_KEY: "savedDescriptions_v1_1_1",

  DELETE_SVG: `<svg viewBox="-3.5 0 19 19" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;display:block;"><path d="M11.383 13.644A1.03 1.03 0 0 1 9.928 15.1L6 11.172 2.072 15.1a1.03 1.03 0 1 1-1.455-1.456l3.928-3.928L.617 5.79a1.03 1.03 0 1 1 1.455-1.456L6 8.261l3.928-3.928a1.03 1.03 0 0 1 1.455 1.456L7.455 9.716z" fill="currentColor"/></svg>`,

  COPY_NOPRICE_ICON: "https://shafa.c.prom.st/favicon-32x32.png",

  BRANDS: [
    "ZARA",
    "H&M",
    "M&S",
    "George",
    "Primark",
    "F&F",
    "Stradivarius",
    "Bershka",
    "Pull & Bear",
    "COS",
    "Arket",
    "Massimo Dutty",
    "Next",
    "New Look",
    "& Other Stories",
    "Mango",
    "ASOS",
    "Topshop",
    "Monki",
    "Reiss",
    "Autograph",
    "Hugo Boss",
    "Cashmere",
    "Woolmark",
    "Ralph Lauren",
    "Max Mara",
    "Only",
    "C&A",
    "Weekday",
    "Calvin Klein",
  ],

  CATEGORY_FIELDS: {
    sweater: ["по груди", "по низу", "рукав", "довжина"],
    pants: ["по пояс", "по стегна", "посадка", "довжина", "ширина внизу"],
    skirt: ["по пояс", "по стегна", "довжина"],
    tshirt: ["по груди", "по низу", "довжина"],
    outerwear: ["плечі", "по груди", "по низу", "рукав", "довжина"],
    dress: ["по груди", "по талії", "по стегна", "рукав", "довжина"],
  },

  NUMERIC_FIELDS: [
    "по груди",
    "по низу",
    "рукав",
    "довжина",
    "по пояс",
    "по стегна",
    "посадка",
    "ширина внизу",
    "плечі",
    "по талії",
  ],

  CATEGORIES_WITH_NECK_CHECKBOX: ["sweater", "outerwear", "dress"],

  SPLASH_DELAYS: { fadeOut: 700, remove: 420, fallback: 6000 },
};

/* ==================== APPLICATION STATE ==================== */
const state = {
  activeCategory: null,
  savedDescriptions: [],
  brandSuggestions: {
    current: [],
    selectedIndex: -1,
  },
};

/* ==================== UTILITIES ==================== */
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));

const autosize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.max(160, el.scrollHeight) + "px";
};

const copyToClipboard = (text) => {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};


const fallbackCopy = (text) => {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  ta.remove();
};

/* ==================== STORAGE MANAGEMENT ==================== */
const storage = {
  migrate() {
    try {
      const old = localStorage.getItem(CONFIG.OLD_STORAGE_KEY);
      const current = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (old && !current) {
        localStorage.setItem(CONFIG.STORAGE_KEY, old);
        localStorage.removeItem(CONFIG.OLD_STORAGE_KEY);
      }
    } catch (e) {}
  },

  load() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || "[]") || [];
    } catch (e) {
      return [];
    }
  },

  save(data) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
  },
};

/* ==================== BRAND AUTOCOMPLETE ==================== */
const brandAutocomplete = {
  filter(value) {
    const v = value.trim().toLowerCase();
    if (!v) return [];

    const matches = CONFIG.BRANDS.filter((b) => b.toLowerCase().includes(v));
    return matches.sort((a, b) => {
      const av = a.toLowerCase(),
        bv = b.toLowerCase();
      const startsA = av.startsWith(v),
        startsB = bv.startsWith(v);
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return a.localeCompare(b);
    });
  },

  render() {
    const container = $("#brandSuggestions");
    container.innerHTML = "";

    if (!state.brandSuggestions.current.length) {
      container.style.display = "none";
      return;
    }

    state.brandSuggestions.current.forEach((brand, i) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = brand;
      if (i === state.brandSuggestions.selectedIndex)
        div.classList.add("active");

      div.addEventListener("mousedown", () => {
        $("#brand").value = brand;
        container.style.display = "none";
        state.brandSuggestions.selectedIndex = -1;
      });

      container.appendChild(div);
    });

    container.style.display = "block";
  },

  navigate(direction) {
    const max = state.brandSuggestions.current.length - 1;
    if (direction === "down") {
      state.brandSuggestions.selectedIndex = Math.min(
        state.brandSuggestions.selectedIndex + 1,
        max
      );
    } else if (direction === "up") {
      state.brandSuggestions.selectedIndex = Math.max(
        state.brandSuggestions.selectedIndex - 1,
        0
      );
    }
    this.render();
  },

  select() {
    const idx = state.brandSuggestions.selectedIndex;
    if (idx >= 0 && state.brandSuggestions.current[idx]) {
      $("#brand").value = state.brandSuggestions.current[idx];
      $("#brandSuggestions").style.display = "none";
      state.brandSuggestions.selectedIndex = -1;
    }
  },
};

/* ==================== CATEGORY MANAGEMENT ==================== */
const categoryManager = {
  setActive(category) {
    state.activeCategory = category;
    $all(".category-pill").forEach((p) => p.classList.remove("active"));
    $(`.category-pill[data-cat="${category}"]`)?.classList.add("active");
    this.renderFields();
  },

  renderFields() {
    const container = $("#categoryFields");
    container.innerHTML = "";

    if (!state.activeCategory || !CONFIG.CATEGORY_FIELDS[state.activeCategory])
      return;

    CONFIG.CATEGORY_FIELDS[state.activeCategory].forEach((field) => {
      const row = document.createElement("div");
      row.className = "cat-row";

      const label = document.createElement("label");
      label.textContent = field;

      const input = document.createElement("input");
      input.dataset.field = field;

      if (CONFIG.NUMERIC_FIELDS.includes(field)) {
        input.type = "number";
        input.inputMode = "numeric";
        input.pattern = "[0-9]*";
      } else {
        input.type = "text";
      }

      row.appendChild(label);
      row.appendChild(input);
      container.appendChild(row);
    });

    if (CONFIG.CATEGORIES_WITH_NECK_CHECKBOX.includes(state.activeCategory)) {
      this.addNeckCheckbox(container);
    }
  },

  addNeckCheckbox(container) {
    const row = document.createElement("div");
    row.className = "cat-row";

    const spacer = document.createElement("label");
    spacer.style.visibility = "hidden";

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.innerHTML = `<label style="font-weight:600"><input id="fromNeck" type="checkbox"> Рукав від горловини</label>`;

    row.appendChild(spacer);
    row.appendChild(wrapper);
    container.appendChild(row);
  },
};

/* ==================== OUTPUT BUILDER ==================== */
const outputBuilder = {
  build() {
    const price = $("#price").value.trim();
    const brand = $("#brand").value.trim();
    const desc = $("#descInput").value.trim();
    const condition =
      (document.querySelector('input[name="state"]:checked') || {}).value || "";
    const sizes = $all('.sizes input[type="checkbox"]:checked').map(
      (c) => c.value
    );

    let output = "";
    if (price) output += `💸Ціна ${price} грн\n`;
    if (brand) output += `${brand}\n`;
    if (desc) output += `${desc}\n`;
    if (condition) output += `${condition}\n`;
    output += "―――――――\n";
    if (sizes.length) output += `розмір ${sizes.join("/")} \n`;

    if (state.activeCategory) {
      $all("#categoryFields input[data-field]").forEach((inp) => {
        const val = inp.value.trim();
        if (val) output += `${inp.dataset.field} ${val}\n`;
      });

      const fromNeck = $("#fromNeck");
      if (fromNeck?.checked) {
        output = output.replace(/(рукав\s+)/, "рукав від горловини ");
      }
    }

    output += "―――――――\n";

    const materials = $all(".materials input:checked").map((i) => i.value);
    const customMaterial = $("#materialCustom").value.trim();
    if (customMaterial) materials.push(customMaterial);
    if (materials.length) output += materials.join("/") + "\n";

    return output.trim();
  },
};

/* ==================== SAVED DESCRIPTIONS MANAGER ==================== */
const savedManager = {
  add(text) {
    const title = $("#descInput").value.trim() || "Без назви";
    const id =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    state.savedDescriptions.unshift({ id, title, text, copied: false });
    storage.save(state.savedDescriptions);
    this.render();
  },

  remove(index) {
    if (!confirm("Видалити цей збережений опис?")) return;
    state.savedDescriptions.splice(index, 1);
    storage.save(state.savedDescriptions);
    this.render();
  },

  clearAll() {
    if (!confirm("Видалити всі збережені описи?")) return;
    state.savedDescriptions = [];
    storage.save(state.savedDescriptions);
    this.render();
  },

  markCopied(index) {
    state.savedDescriptions[index].copied = true;
    storage.save(state.savedDescriptions);
    this.render();
  },

  copyWithoutPrice(text) {
    const lines = text.split(/\r?\n/);
    const startIdx = lines.length && /ціна|💸/i.test(lines[0]) ? 1 : 0;
    return lines.slice(startIdx).join("\n");
  },

  render() {
    const container = $("#savedList");
    container.innerHTML = "";

    state.savedDescriptions.forEach((item, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "saved-item";

      const header = document.createElement("div");
      header.className = "saved-header" + (item.copied ? " copied" : "");

      const title = document.createElement("div");
      title.textContent = item.title;

      const actions = document.createElement("div");
      actions.className = "saved-actions";

      // Copy all button
      const copyAllBtn = document.createElement("button");
      copyAllBtn.className = "icon-btn";
      copyAllBtn.title = "Копіювати весь опис";
      copyAllBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16 1H4a1 1 0 0 0-1 1v14h2V3h11V1zm3 4H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm-1 16H9V7h9v14z"/></svg>`;
      copyAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(item.text);
        this.markCopied(idx);
      });

      // Copy without price button
      const copyNoPriceBtn = document.createElement("button");
      copyNoPriceBtn.className = "icon-btn";
      copyNoPriceBtn.title = "Копіювати без ціни";
      const img = document.createElement("img");
      img.src = CONFIG.COPY_NOPRICE_ICON;
      img.alt = "cp";
      copyNoPriceBtn.appendChild(img);
      copyNoPriceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(this.copyWithoutPrice(item.text));
      });

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.title = "Видалити";
      delBtn.innerHTML = CONFIG.DELETE_SVG;
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.remove(idx);
      });

      actions.appendChild(copyAllBtn);
      actions.appendChild(copyNoPriceBtn);
      actions.appendChild(delBtn);

      header.appendChild(title);
      header.appendChild(actions);

      const body = document.createElement("div");
      body.className = "saved-body";
      body.textContent = item.text;

      header.addEventListener("click", (e) => {
        if (!e.target.closest(".icon-btn")) {
          body.style.display =
            body.style.display === "block" ? "none" : "block";
        }
      });

      wrapper.appendChild(header);
      wrapper.appendChild(body);
      container.appendChild(wrapper);
    });
  },
};

/* ==================== FORM MANAGEMENT ==================== */
const formManager = {
  clear() {
    if (!confirm("Очистити всі поля форми?")) return;
    $all('input[type="text"], input[type="number"], textarea').forEach(
      (i) => (i.value = "")
    );
    $all('input[type="checkbox"], input[type="radio"]').forEach(
      (i) => (i.checked = false)
    );
    $("#categoryFields").innerHTML = "";
    $("#output").value = "";
    autosize($("#output"));
    $all(".category-pill").forEach((p) => p.classList.remove("active"));
    state.activeCategory = null;
    $("#brandSuggestions").style.display = "none";
  },
};

/* ==================== UI INITIALIZATION ==================== */
const ui = {
  initSplash() {
    window.addEventListener("load", () => {
      const splash = $("#splash");
      setTimeout(() => {
        if (splash) splash.style.opacity = "0";
        setTimeout(() => {
          splash?.parentNode?.removeChild(splash);
          $("#app").classList.remove("hidden");
        }, CONFIG.SPLASH_DELAYS.remove);
      }, CONFIG.SPLASH_DELAYS.fadeOut);
    });

    setTimeout(() => {
      const s = $("#splash");
      if (s?.parentNode) {
        s.parentNode.removeChild(s);
        $("#app").classList.remove("hidden");
      }
    }, CONFIG.SPLASH_DELAYS.fallback);
  },

  initBrandInput() {
    const input = $("#brand");
    const suggestions = $("#brandSuggestions");

    input.addEventListener("input", (e) => {
      const value = e.target.value;
      state.brandSuggestions.current = brandAutocomplete.filter(value);
      state.brandSuggestions.selectedIndex = -1;
      brandAutocomplete.render();
    });

    input.addEventListener("keydown", (e) => {
      if (suggestions.style.display === "none") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        brandAutocomplete.navigate("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        brandAutocomplete.navigate("up");
      } else if (e.key === "Enter") {
        e.preventDefault();
        brandAutocomplete.select();
      } else if (e.key === "Escape") {
        suggestions.style.display = "none";
        state.brandSuggestions.selectedIndex = -1;
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => (suggestions.style.display = "none"), 140);
    });
  },

  initCategoryPills() {
    $("#categoryGroup").addEventListener("click", (e) => {
      const pill = e.target.closest(".category-pill");
      if (pill) categoryManager.setActive(pill.dataset.cat);
    });
  },

  initButtons() {
    $("#btnGenerate").addEventListener("click", () => {
      const output = $("#output");
      output.value = outputBuilder.build();
      autosize(output);
    });

    $("#btnCopy").addEventListener("click", () => {
      const output = $("#output");
      if (output.value) copyToClipboard(output.value);
    });

    $("#btnSave").addEventListener("click", () => {
      const text = $("#output").value.trim();
      if (!text) {
        alert("Немає тексту для збереження.");
        return;
      }
      savedManager.add(text);
      formManager.clear();
    });

    $("#btnClearAll").addEventListener("click", () => savedManager.clearAll());
    $("#fabClear").addEventListener("click", () => formManager.clear());
  },

  initOutput() {
    const output = $("#output");
    output.addEventListener("input", () => autosize(output));
    autosize(output);
  },

  preventEnterSubmit() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName.toLowerCase() !== "textarea") {
        e.preventDefault();
      }
    });
  },
};

/* ==================== APPLICATION INITIALIZATION ==================== */
function init() {
  storage.migrate();
  state.savedDescriptions = storage.load();

  ui.initSplash();
  ui.initBrandInput();
  ui.initCategoryPills();
  ui.initButtons();
  ui.initOutput();
  ui.preventEnterSubmit();

  savedManager.render();
}

init();

/* ==================== CODE STRUCTURE DOCUMENTATION ====================

APPLICATION ARCHITECTURE:
This application follows a state-driven architecture with clear separation of concerns.

STATE MANAGEMENT:
- All application state is centralized in the `state` object
- State includes: activeCategory, savedDescriptions, brandSuggestions
- State changes trigger UI updates through manager render methods

CONFIGURATION:
- All constants are in CONFIG object at top
- Easy to modify: brands, categories, field names, storage keys, icons
- No magic strings scattered throughout code

MODULE ORGANIZATION:
1. CONFIG - All configuration constants
2. state - Application state object
3. Utilities - Helper functions ($, $all, autosize, clipboard)
4. storage - LocalStorage operations (migrate, load, save)
5. brandAutocomplete - Brand search and suggestion logic
6. categoryManager - Category selection and field rendering
7. outputBuilder - Builds final description text
8. savedManager - Manages saved descriptions list
9. formManager - Form clearing operations
10. ui - UI initialization and event binding
11. init() - Application startup

INSTRUCTIONS FOR LLMs ADDING NEW FEATURES:

1. ADDING NEW CONFIGURATION:
   - Add to CONFIG object at top
   - Keep related configs grouped together
   - Use SCREAMING_SNAKE_CASE for constants

2. ADDING NEW STATE:
   - Add properties to `state` object
   - Document what the state represents
   - Initialize with sensible defaults

3. ADDING NEW FEATURES:
   - Create a new manager object (e.g., `newFeatureManager`)
   - Add methods: render(), update(), clear() as needed
   - Keep functions pure when possible (input → output, no side effects)
   - Use state object for data, not global variables

4. ADDING NEW UI ELEMENTS:
   - Add initialization in `ui.initYourFeature()`
   - Call from `init()` function
   - Use event delegation where possible
   - Keep event handlers thin - delegate to managers

5. MODIFYING EXISTING FEATURES:
   - Find relevant manager object
   - Modify methods within that manager
   - Update state object if data structure changes
   - Update CONFIG if constants change

6. ADDING NEW CATEGORIES:
   - Add to CONFIG.CATEGORY_FIELDS
   - Add field names to CONFIG.NUMERIC_FIELDS if numeric
   - Add to CONFIG.CATEGORIES_WITH_NECK_CHECKBOX if needs checkbox

7. ADDING NEW STORAGE:
   - Add methods to `storage` object
   - Keep localStorage operations centralized
   - Handle errors gracefully (try/catch)

8. DEBUGGING:
   - State is visible: console.log(state)
   - Config is visible: console.log(CONFIG)
   - Each manager is testable independently

9. BEST PRACTICES:
   - Don't use inline event handlers
   - Don't scatter constants throughout code
   - Don't modify state directly in UI code
   - Don't create global variables
   - Use manager methods to update state
   - Keep functions focused on single responsibility

10. COMMON PATTERNS:
    - Manager.render() - updates DOM from state
    - Manager.update() - updates state
    - storage.save() - persists state changes
    - ui.initX() - sets up event listeners

==================== END DOCUMENTATION ==================== */
