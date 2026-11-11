document.addEventListener('DOMContentLoaded', async () => {
  const projects = await loadJSON('data/projects.json');
  document.getElementById('projectGrid').innerHTML = projects.map((p) => `
    <article class="card">
      <div class="card-img"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()"></div>
      <div class="card-foot">
        <div>
          <h3 class="card-title">${esc(p.title)}</h3>
          <p class="card-meta">${esc([p.category, p.year].filter(Boolean).join(' · '))}</p>
          <p class="card-desc">${esc(p.summary)}</p>
        </div>
        ${p.url ? `<a class="card-ext" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Open project">${EXT_ICON}</a>` : ''}
      </div>
    </article>`).join('') || '<p class="empty">Projects coming soon.</p>';
});
