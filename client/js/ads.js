document.addEventListener('DOMContentLoaded', async () => {
  const modal = document.getElementById('adModal');
  const form = document.getElementById('adForm');
  const addBtn = document.getElementById('addAd');
  const tbody = document.querySelector('#adsTable tbody');

  // --- Загрузка рекламодателей ---
  const loadAdvertisers = async () => {
    const res = await fetch('/api/advertisers');
    return await res.json();
  };

  const advertiserSelect = document.getElementById('advertiser_id');

  const advertisers = await loadAdvertisers();

  advertisers.forEach(a => {
    const option = document.createElement('option');
    option.value = a.рекламодатель_id;
    option.textContent = a.название;
    advertiserSelect.appendChild(option);
  });

  // --- Редактирование / Добавление ---
  const openModal = (ad = null) => {
    if (ad) {
      document.getElementById('modalTitle').textContent = 'Редактировать объявление';
      document.getElementById('ad_id').value = ad.реклама_id;
      document.getElementById('advertiser_id').value = ad.рекламодатель_id;
      document.getElementById('info').value = ad.информация_о_рекламе;
      document.getElementById('cost').value = ad.стоимость;
      document.getElementById('datePublished').value = formatDate(ad.дата_выхода);
    } else {
      document.getElementById('modalTitle').textContent = 'Добавить объявление';
      form.reset();
      document.getElementById('ad_id').value = '';
    }
    modal.style.display = 'block';
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  addBtn.addEventListener('click', () => openModal());
  document.querySelector('.close').addEventListener('click', closeModal);

  // --- Загрузка объявлений ---
  const loadAds = async () => {
    try {
      const response = await fetch('/api/ads');
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      alert('Не удалось загрузить данные объявлений');
      return [];
    }
  };

  // --- Отображение объявлений ---
  const renderAds = async () => {
    const ads = await loadAds();
    tbody.innerHTML = '';

    ads.forEach(ad => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ad.реклама_id}</td>
        <td>${ad.рекламодатель || '—'}</td>
        <td>${ad.информация_о_рекламе || '—'}</td>
        <td>${formatCurrency(ad.стоимость)}</td>
        <td>${formatDate(ad.дата_выхода)}</td>
        <td>
          <button class="edit" data-id="${ad.реклама_id}">Редактировать</button>
          <button class="delete" data-id="${ad.реклама_id}">Удалить</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // --- Обработчики событий ---
    document.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const ad = ads.find(a => a.реклама_id == id);
        if (ad) openModal(ad);
      });
    });

    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить это объявление?')) {
          try {
            const response = await fetch(`/api/ads/${btn.dataset.id}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка удаления');
            alert('Объявление успешно удалено');
            renderAds();
          } catch (error) {
            console.error('Error:', error);
            alert('Не удалось удалить объявление');
          }
        }
      });
    });
  };

  // --- Форма объявления ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const adData = {
      advertiserId: document.getElementById('advertiser_id').value,
      info: document.getElementById('info').value,
      cost: parseFloat(document.getElementById('cost').value),
      datePublished: document.getElementById('datePublished').value
    };

    const adId = document.getElementById('ad_id').value;
    const method = adId ? 'PUT' : 'POST';
    const url = adId ? `/api/ads/${adId}` : '/api/ads';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData)
      });

      if (!response.ok) throw new Error('Ошибка сохранения');

      const data = await response.json();
      closeModal();
      alert(`Объявление успешно ${adId ? 'обновлено' : 'добавлено'}`);
      renderAds();
    } catch (error) {
      console.error('Error:', error);
      alert('Не удалось сохранить данные объявления');
    }
  });

  // --- Вспомогательные функции ---
  function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  function formatCurrency(value) {
    return value !== undefined ? Number(value).toLocaleString('ru-RU') + ' ₽' : '—';
  }

  // --- Инициализация ---
  await renderAds();
});