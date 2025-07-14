document.addEventListener('DOMContentLoaded', async () => {
  const applyBtn = document.getElementById('applyFilters');
  const tbody = document.querySelector('#analyticsTable tbody');
  let analyticsData = [];
  let advertisers = [];
  let ads = [];

  // Инициализация графиков
  const viewsCtx = document.getElementById('viewsChart').getContext('2d');
  const engagementCtx = document.getElementById('engagementChart').getContext('2d');

  const viewsChart = new Chart(viewsCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Просмотры', data: [], backgroundColor: 'rgba(54, 162, 235, 0.5)' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const engagementChart = new Chart(engagementCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Вовлеченность (%)', data: [], borderColor: 'rgba(255, 99, 132, 1)', fill: false }] },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value}%`
          },
          suggestedMax: 100
        }
      }
    }
  });

  // --- Загрузка рекламодателей ---
  const loadAdvertisers = async () => {
    const response = await fetch('/api/advertisers');
    advertisers = await response.json();

    const select = document.getElementById('advertiserFilter');
    select.innerHTML = '<option value="">Все</option>';
    advertisers.forEach(adv => {
      const option = document.createElement('option');
      option.value = adv.рекламодатель_id;
      option.textContent = adv.название;
      select.appendChild(option);
    });
  };

  const loadAds = async () => {
    const response = await fetch('/api/ads');
    ads = await response.json();
  };

  // --- Загрузка аналитики ---
  const loadAnalytics = async () => {
    const advertiserId = document.getElementById('advertiserFilter').value;
    const advertiserFilter = document.getElementById('advertiserFilter');
    const selectedAdvName = advertiserFilter.options[advertiserFilter.selectedIndex]?.text;

    let url = '/api/analytics';
    const params = new URLSearchParams();

    if (advertiserId) params.append('advertiser_id', advertiserId);

    if (params.toString()) url += `?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
      let analytics = await response.json();

      if (selectedAdvName && selectedAdvName !== 'Все') {
        const adv = advertisers.find(a => a.название === selectedAdvName);
        if (adv) {
          const relevantAdIds = ads
            .filter(ad => ad.рекламодатель_id === adv.рекламодатель_id)
            .map(ad => ad.реклама_id);

          analytics = analytics.filter(item => relevantAdIds.includes(item.реклама_id));
        }
      }

      return analytics;
    } catch (error) {
      console.error('Ошибка при загрузке аналитики:', error);
      alert('Не удалось загрузить аналитику');
      return [];
    }
  };

  // --- Отображение данных ---
  const renderAnalytics = async () => {
    analyticsData = await loadAnalytics();
    tbody.innerHTML = '';

    analyticsData.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.реклама_id}</td>
        <td>${getAdvertiserName(item.реклама_id)}</td>
        <td>${formatNumber(item.количество_зрителей)}</td>
        <td>${(item.коэффициент_вовлеченности * 100).toFixed(2)}%</td>
        <td>${item.оценка}</td>
      `;
      tbody.appendChild(row);
    });

    updateCharts(analyticsData);
  };

  // --- Получение названия рекламодателя по рекламе ---
  function getAdvertiserName(adId) {
    const ad = ads.find(a => a.реклама_id === adId);
    if (!ad) return '—';

    const advertiser = advertisers.find(adv => adv.рекламодатель_id === ad.рекламодатель_id);
    return advertiser?.название || '—';
  }

  // --- Форматирование чисел ---
  function formatNumber(value) {
    return value !== undefined ? Number(value).toLocaleString('ru-RU') : '—';
  }

  // --- Обновление графиков ---
  const updateCharts = (data) => {
    const labels = data.map(item => `Реклама #${item.реклама_id}`);

    viewsChart.data.labels = labels;
    viewsChart.data.datasets[0].data = data.map(item => item.количество_зрителей || 0);
    viewsChart.update();

    engagementChart.data.labels = labels;
    engagementChart.data.datasets[0].data = data.map(item => item.коэффициент_вовлеченности * 100);
    engagementChart.update();
  };

  // --- Автоматическое обновление при смене рекламодателя ---
  document.getElementById('advertiserFilter').addEventListener('change', renderAnalytics);

  // --- Инициализация ---
  await loadAdvertisers();
  await loadAds();
  await renderAnalytics();
});