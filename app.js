const INDEX_PATH = "recipes/index.json";
const DEFAULT_CATEGORIES = ["brunch", "lunch", "dinner"];

const state = {
  recipes: [],
  categories: [],
  search: "",
  category: "all",
  loadError: "",
};

const elements = {
  listView: document.querySelector("#list-view"),
  detailView: document.querySelector("#detail-view"),
  list: document.querySelector("#recipe-list"),
  count: document.querySelector("#recipe-count"),
  empty: document.querySelector("#empty-state"),
  detail: document.querySelector("#recipe-detail"),
  search: document.querySelector("#search-input"),
  category: document.querySelector("#category-filter"),
  back: document.querySelector("#back-button"),
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadRecipeIndex();
  renderCategoryOptions();
  renderRecipeList();
  handleRoute();
  registerServiceWorker();
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLocaleLowerCase("de-DE");
    renderRecipeList();
  });

  elements.category.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderRecipeList();
  });

  elements.back.addEventListener("click", () => {
    window.location.hash = "";
  });

  window.addEventListener("hashchange", handleRoute);
}

async function loadRecipeIndex() {
  elements.list.innerHTML = '<p class="loading">Rezepte werden geladen...</p>';
  state.loadError = "";

  try {
    const response = await fetch(INDEX_PATH);

    if (!response.ok) {
      throw new Error(`Rezeptverzeichnis konnte nicht geladen werden (${response.status}).`);
    }

    const recipes = await response.json();
    state.recipes = recipes
      .filter((recipe) => recipe.title && recipe.file)
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    state.categories = buildCategoryList(state.recipes);
  } catch (error) {
    state.loadError = error.message;
  }
}

function buildCategoryList(recipes) {
  const recipeCategories = recipes.map((recipe) => recipe.category).filter(Boolean);
  return [...new Set([...DEFAULT_CATEGORIES, ...recipeCategories])];
}

function renderCategoryOptions() {
  const options = ['<option value="all">Alle Kategorien</option>'];

  for (const category of state.categories) {
    options.push(`<option value="${escapeAttribute(category)}">${escapeHtml(formatCategory(category))}</option>`);
  }

  elements.category.innerHTML = options.join("");
}

function renderRecipeList() {
  if (state.loadError) {
    elements.count.textContent = "0 Rezepte";
    elements.empty.hidden = true;
    elements.list.innerHTML = `<p class="error">${escapeHtml(state.loadError)}</p>`;
    return;
  }

  const filteredRecipes = state.recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLocaleLowerCase("de-DE").includes(state.search);
    const matchesCategory = state.category === "all" || recipe.category === state.category;
    return matchesSearch && matchesCategory;
  });

  elements.count.textContent = recipeCountText(filteredRecipes.length);
  elements.empty.hidden = filteredRecipes.length > 0;

  elements.list.innerHTML = filteredRecipes
    .map(
      (recipe) => `
        <button class="recipe-card" type="button" data-recipe-id="${escapeAttribute(recipe.id)}">
          <span class="category-pill">${escapeHtml(formatCategory(recipe.category || "Rezept"))}</span>
          <h3>${escapeHtml(recipe.title)}</h3>
          ${renderRecipeMeta(recipe, "card-meta")}
        </button>
      `
    )
    .join("");

  for (const card of elements.list.querySelectorAll(".recipe-card")) {
    card.addEventListener("click", () => {
      window.location.hash = `recipe=${encodeURIComponent(card.dataset.recipeId)}`;
    });
  }
}

function recipeCountText(count) {
  if (count === 0) {
    return "0 Rezepte";
  }

  if (count === 1) {
    return "1 Rezept";
  }

  return `${count} Rezepte`;
}

function handleRoute() {
  const recipeId = parseRecipeIdFromHash();

  if (!recipeId) {
    showListView();
    return;
  }

  const recipe = state.recipes.find((item) => item.id === recipeId);

  if (!recipe) {
    showDetailError("Dieses Rezept wurde im Rezeptverzeichnis nicht gefunden.");
    return;
  }

  showRecipe(recipe);
}

function parseRecipeIdFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("recipe");
}

function showListView() {
  elements.detailView.hidden = true;
  elements.listView.hidden = false;
  elements.detail.innerHTML = "";
}

async function showRecipe(recipe) {
  elements.listView.hidden = true;
  elements.detailView.hidden = false;
  elements.detail.innerHTML = '<p class="loading">Rezept wird geladen...</p>';
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const recipePath = `recipes/${recipe.file}`;
    const response = await fetch(recipePath);

    if (!response.ok) {
      throw new Error(`Markdown-Datei konnte nicht geladen werden (${response.status}).`);
    }

    const markdown = await response.text();
    elements.detail.innerHTML = renderRecipeMarkdown(markdown, recipe);
  } catch (error) {
    showDetailError(error.message);
  }
}

function showDetailError(message) {
  elements.listView.hidden = true;
  elements.detailView.hidden = false;
  elements.detail.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
}

function renderRecipeMarkdown(markdown, recipe) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const sections = [];
  let title = recipe.title;
  let introLines = [];
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1].trim(), lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  const introHtml = introLines.length ? `<div class="recipe-intro">${renderLooseMarkdown(introLines)}</div>` : "";
  const sourceHtml = renderSourceLink(recipe);
  const metaHtml = renderRecipeMeta(recipe, "recipe-meta");

  return `
    <header>
      <h1>${escapeHtml(title)}</h1>
      <span class="category-pill recipe-category">${escapeHtml(formatCategory(recipe.category || "Rezept"))}</span>
      ${metaHtml}
      ${sourceHtml}
    </header>
    ${introHtml}
    ${sections.map(renderSection).join("")}
  `;
}

function renderRecipeMeta(recipe, className) {
  const items = [recipe.duration, recipe.servings]
    .filter(Boolean)
    .map((value) => `<span class="meta-item">${escapeHtml(value)}</span>`);

  if (!items.length) {
    return "";
  }

  return `<p class="${escapeAttribute(className)}">${items.join("")}</p>`;
}

function renderSourceLink(recipe) {
  const sourceUrl = getSafeSourceUrl(recipe.sourceUrl);

  if (!sourceUrl) {
    return "";
  }

  return `
    <p class="source-line">
      <a href="${escapeAttribute(sourceUrl)}" target="_blank" rel="noopener noreferrer">Quelle oeffnen</a>
    </p>
  `;
}

function getSafeSourceUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

function formatCategory(category) {
  const value = String(category || "").trim();

  if (!value) {
    return "Rezept";
  }

  return value.charAt(0).toLocaleUpperCase("de-DE") + value.slice(1);
}

function renderSection(section) {
  const normalizedTitle = section.title.toLocaleLowerCase("de-DE");

  if (normalizedTitle.includes("zutat")) {
    const items = section.lines.map(stripListMarker).filter(Boolean);
    return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <ul class="ingredients-list">
          ${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  if (normalizedTitle.includes("zubereitung") || normalizedTitle.includes("anleitung")) {
    const steps = section.lines.map(stripListMarker).filter(Boolean);
    return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <ol class="steps-list">
          ${steps.map((step) => `<li>${renderInlineMarkdown(step)}</li>`).join("")}
        </ol>
      </section>
    `;
  }

  return `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${renderLooseMarkdown(section.lines)}
    </section>
  `;
}

function renderLooseMarkdown(lines) {
  const groups = [];
  let currentList = null;

  for (const line of lines) {
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);

    if (unordered || ordered) {
      const type = ordered ? "ol" : "ul";
      const value = unordered ? unordered[1] : ordered[1];

      if (!currentList || currentList.type !== type) {
        currentList = { type, items: [] };
        groups.push(currentList);
      }

      currentList.items.push(value);
    } else {
      currentList = null;
      groups.push({ type: "p", text: line });
    }
  }

  return groups
    .map((group) => {
      if (group.type === "p") {
        return `<p>${renderInlineMarkdown(group.text)}</p>`;
      }

      const className = group.type === "ol" ? "markdown-numbered-list" : "markdown-list";
      return `<${group.type} class="${className}">${group.items
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("")}</${group.type}>`;
    })
    .join("");
}

function stripListMarker(line) {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

function renderInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Die App funktioniert auch ohne Service Worker.
    });
  });
}
