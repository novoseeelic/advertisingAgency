async function loadDashboardStats() {
  try {
    const endpoints = [
      { name: 'advertisers', url: '/api/advertisers/count' },
      { name: 'ads', url: '/api/ads/count' },
      { name: 'contracts', url: '/api/contracts/active-count' },
      { name: 'views', url: '/api/analytics/total-views' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        results[endpoint.name] = data;
      } catch (error) {
        console.error(`Error fetching ${endpoint.url}:`, error);
        results[endpoint.name] = { error: true };
      }
    }

    updateDashboardStats(results);
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    showAlert('Не удалось загрузить данные статистики', 'error');
  }
}

function updateDashboardStats(data) {
  const statsContainer = document.createElement('div');
  statsContainer.className = 'dashboard-stats';
  
  statsContainer.innerHTML = `
    <div class="stat-card">
      <h3>Рекламодатели</h3>
      <p class="stat-value">${data.advertisers?.count ?? 'N/A'}</p>
      ${data.advertisers?.error ? '<p class="stat-error">Ошибка загрузки</p>' : ''}
    </div>
    <div class="stat-card">
      <h3>Рекламные объявления</h3>
      <p class="stat-value">${data.ads?.count ?? 'N/A'}</p>
      ${data.ads?.error ? '<p class="stat-error">Ошибка загрузки</p>' : ''}
    </div>
    <div class="stat-card">
      <h3>Активные договоры</h3>
      <p class="stat-value">${data.contracts?.count ?? 'N/A'}</p>
      ${data.contracts?.error ? '<p class="stat-error">Ошибка загрузки</p>' : ''}
    </div>
    <div class="stat-card">
      <h3>Всего просмотров</h3>
      <p class="stat-value">${data.views?.total ?? 'N/A'}</p>
      ${data.views?.error ? '<p class="stat-error">Ошибка загрузки</p>' : ''}
    </div>
  `;
  
  const main = document.querySelector('main');
  const oldStats = main.querySelector('.dashboard-stats');
  if (oldStats) oldStats.remove();
  main.appendChild(statsContainer);
}