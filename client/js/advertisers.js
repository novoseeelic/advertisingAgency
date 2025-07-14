const tableBody = document.querySelector('#advertisersTable tbody');
const modal = document.getElementById('modal');
const addAdvertiserBtn = document.getElementById('addAdvertiser');
const closeBtn = document.querySelector('.modal .close');
const form = document.getElementById('advertiserForm');

let editingId = null;

// Открытие модального окна (для добавления)
addAdvertiserBtn.addEventListener('click', () => {
  editingId = null;
  form.reset();
  document.getElementById('formTitle').textContent = 'Добавить рекламодателя';
  modal.style.display = 'block';
});

// Закрытие модального окна
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  form.reset();
  editingId = null;
  document.getElementById('formTitle').textContent = 'Добавить рекламодателя';
});

// Загрузка данных при загрузке страницы
window.addEventListener('DOMContentLoaded', loadAdvertisers);

async function loadAdvertisers() {
  try {
    const res = await fetch('/api/advertisers');
    const advertisers = await res.json();

    tableBody.innerHTML = '';

    advertisers.forEach(advertiser => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${advertiser.рекламодатель_id}</td>
        <td>${advertiser.название}</td>
        <td>${advertiser.почта}</td>
        <td>${advertiser.номер_телефона}</td>
        <td>
          <button class="edit-btn" data-id="${advertiser.рекламодатель_id}">Редактировать</button>
          <button class="delete-btn" data-id="${advertiser.рекламодатель_id}">Удалить</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Обработчики событий для кнопок удаления и редактирования
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Вы уверены, что хотите удалить этого рекламодателя?")) {
          const res = await fetch(`/api/advertisers/${id}`, { method: 'DELETE' });
          const result = await res.json();
          
          if (res.ok) {
            loadAdvertisers(); // Перезагружаем список
          } else {
            alert(result.error || 'Не удалось удалить рекламодателя');
          }
        }
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const res = await fetch(`/api/advertisers/${id}`);
        const advertiser = await res.json();

        if (!res.ok) {
          alert('Ошибка загрузки данных для редактирования');
          return;
        }

        document.getElementById('name').value = advertiser.название;
        document.getElementById('email').value = advertiser.почта;
        document.getElementById('phone').value = advertiser.номер_телефона;

        editingId = id;
        document.getElementById('formTitle').textContent = 'Редактировать рекламодателя';
        modal.style.display = 'block';
      });
    });

  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    alert('Не удалось загрузить данные рекламодателей');
  }
}

// Отправка формы (добавление или редактирование)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newAdvertiser = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim()
  };

  try {
    let url = '/api/advertisers';
    let method = 'POST';

    if (editingId) {
      url += `/${editingId}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAdvertiser)
    });

    const result = await res.json();

    if (res.ok) {
      modal.style.display = 'none';
      form.reset();
      editingId = null;
      document.getElementById('formTitle').textContent = 'Добавить рекламодателя';
      loadAdvertisers(); // Обновляем таблицу
    } else {
      alert(`Ошибка: ${result.error || 'Не удалось сохранить изменения'}`);
    }
  } catch (err) {
    console.error(err);
    alert('Произошла ошибка при отправке данных');
  }
});