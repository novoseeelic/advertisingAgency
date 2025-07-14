document.addEventListener('DOMContentLoaded', async () => {
  const modal = document.getElementById('agentModal');
  const form = document.getElementById('agentForm');
  const addBtn = document.getElementById('addAgent');
  const tbody = document.querySelector('#agentsTable tbody');

  // Открыть/закрыть модальное окно
  const openModal = (agent = null) => {
    if (agent) {
      document.getElementById('modalTitle').textContent = 'Редактировать агента';
      document.getElementById('agentId').value = agent.агент_id;
      document.getElementById('full_name').value = agent.фио;
      document.getElementById('phone').value = agent.телефон;
      document.getElementById('commission_rate').value = agent.процент_от_сделки;
      document.getElementById('hire_date').value = agent.дата_найма.split('T')[0];
    } else {
      document.getElementById('modalTitle').textContent = 'Добавить агента';
      form.reset();
      document.getElementById('agentId').value = '';
    }
    modal.style.display = 'block';
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  addBtn.addEventListener('click', () => openModal());
  document.querySelector('.close').addEventListener('click', closeModal);

  // Загрузка данных агентов
  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      alert('Не удалось загрузить данные агентов');
      return [];
    }
  };

  // Отображение агентов в таблице
  const renderAgents = async () => {
    const agents = await loadAgents();
    tbody.innerHTML = '';

    agents.forEach(agent => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${agent.агент_id}</td>
        <td>${agent.фио}</td>
        <td>${agent.телефон}</td>
        <td>${agent.процент_от_сделки}</td>
        <td>${new Date(agent.дата_найма).toLocaleDateString()}</td>
        <td>
          <button class="edit" data-id="${agent.агент_id}">Редактировать</button>
          <button class="delete" data-id="${agent.агент_id}">Удалить</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const agentId = btn.dataset.id;
        const agent = (await loadAgents()).find(a => a.агент_id == agentId);
        if (agent) openModal(agent);
      });
    });

    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить этого агента?')) {
          try {
            const response = await fetch(`/api/agents/${btn.dataset.id}`, {
              method: 'DELETE'
            });

            if (!response.ok) throw new Error('Ошибка удаления');

            alert('Агент успешно удален');
            renderAgents();
          } catch (error) {
            console.error('Error:', error);
            alert('Не удалось удалить агента');
          }
        }
      });
    });
  };

  // Обработка формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agentData = {
      fio: document.getElementById('full_name').value,
      phone: document.getElementById('phone').value,
      commissionRate: parseFloat(document.getElementById('commission_rate').value),
      hireDate: document.getElementById('hire_date').value,
    };

    const agentId = document.getElementById('agentId').value;
    const method = agentId ? 'PUT' : 'POST';
    const url = agentId ? `/api/agents/${agentId}` : '/api/agents';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      if (!response.ok) throw new Error('Ошибка сохранения');

      const data = await response.json();
      closeModal();
      alert(`Агент успешно ${agentId ? 'обновлен' : 'добавлен'}`);
      renderAgents();
    } catch (error) {
      console.error('Error:', error);
      alert('Не удалось сохранить данные агента');
    }
  });

  // Инициализация
  await renderAgents();
});