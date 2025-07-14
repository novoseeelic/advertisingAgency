document.addEventListener('DOMContentLoaded', async () => {
  const modal = document.getElementById('contractModal');
  const form = document.getElementById('contractForm');
  const addBtn = document.getElementById('addContract');
  const tbody = document.querySelector('#contractsTable tbody');

  const advertiserSelect = document.getElementById('advertiser_id');
  const agentSelect = document.getElementById('agent_id');
  const durationValueInput = document.getElementById('duration_value');
  const durationUnitInput = document.getElementById('duration_unit');

  const conclusionDateInput = document.getElementById('conclusion_date');
  const totalValueInput = document.getElementById('total_value');
  const statusSelect = document.getElementById('status');
  const contractIdInput = document.getElementById('contract_id');

  let contracts = [];

  // Формат даты для input[type="date"]
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Склонение
  function declineYear(n) {
    n = Math.abs(n);
    if (n % 10 === 1 && n % 100 !== 11) return 'год';
    if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 'года';
    return 'лет';
  }

  function declineMonth(n) {
    n = Math.abs(n);
    if (n % 10 === 1 && n % 100 !== 11) return 'месяц';
    if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 'месяца';
    return 'месяцев';
  }

  function declineDay(n) {
    n = Math.abs(n);
    if (n % 10 === 1 && n % 100 !== 11) return 'день';
    if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 'дня';
    return 'дней';
  }

  function formatInterval(value) {
    if (!value || typeof value !== 'object') return '—';

    const parts = [];
    if (value.years || value.year) {
      const count = value.years || value.year;
      parts.push(`${count} ${declineYear(count)}`);
    }
    if (value.months || value.month) {
      const count = value.months || value.month;
      parts.push(`${count} ${declineMonth(count)}`);
    }
    if (value.days || value.day) {
      const count = value.days || value.day;
      parts.push(`${count} ${declineDay(count)}`);
    }
    return parts.length ? parts.join(', ') : '—';
  }

  // Загрузка справочников
  const loadAdvertisers = async () => {
    const res = await fetch('/api/advertisers');
    return await res.json();
  };

  const loadAgents = async () => {
    const res = await fetch('/api/agents');
    return await res.json();
  };

  const initSelects = async () => {
    const [advertisers, agents] = await Promise.all([loadAdvertisers(), loadAgents()]);
    advertiserSelect.innerHTML = '<option value="">Выберите рекламодателя</option>';
    advertisers.forEach(a => {
      const option = document.createElement('option');
      option.value = a.рекламодатель_id;
      option.textContent = a.название;
      advertiserSelect.appendChild(option);
    });

    agentSelect.innerHTML = '<option value="">Выберите агента</option>';
    agents.forEach(a => {
      const option = document.createElement('option');
      option.value = a.агент_id;
      option.textContent = a.фио;
      agentSelect.appendChild(option);
    });
  };

  const loadContracts = async () => {
    const res = await fetch('/api/contracts');
    return await res.json();
  };

  const renderContracts = async () => {
    contracts = await loadContracts();
    tbody.innerHTML = '';

    contracts.forEach(contract => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${contract.договор_id}</td>
        <td>${contract.рекламодатель}</td>
        <td>${contract.агент}</td>
        <td>${new Date(contract.дата_заключения).toLocaleDateString()}</td>
        <td>${formatInterval(contract.срок_действия)}</td>
        <td>${Number(contract.сумма).toLocaleString('ru-RU')} ₽</td>
        <td>${contract.статус}</td>
        <td>
          <button class="edit" data-id="${contract.договор_id}">Редактировать</button>
          <button class="delete" data-id="${contract.договор_id}">Удалить</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    document.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const contract = contracts.find(c => c.договор_id == id);
        openModal(contract);
      });
    });

    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить этот договор?')) {
          try {
            const response = await fetch(`/api/contracts/${btn.dataset.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Ошибка удаления');
            alert('Договор успешно удален');
            renderContracts();
          } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось удалить договор');
          }
        }
      });
    });
  };

  const openModal = (contract = null) => {
    if (contract) {
      document.getElementById('modalTitle').textContent = 'Редактировать договор';
      contractIdInput.value = contract.договор_id;
      advertiserSelect.value = contract.рекламодатель_id;
      agentSelect.value = contract.агент_id;
      conclusionDateInput.value = formatDate(contract.дата_заключения);

      // Парсим срок действия
      if (contract.срок_действия?.days) {
        durationValueInput.value = contract.срок_действия.days;
        durationUnitInput.value = 'days';
      } else if (contract.срок_действия?.months) {
        durationValueInput.value = contract.срок_действия.months;
        durationUnitInput.value = 'months';
      } else if (contract.срок_действия?.years) {
        durationValueInput.value = contract.срок_действия.years;
        durationUnitInput.value = 'years';
      }

      totalValueInput.value = contract.сумма;
      statusSelect.value = contract.статус;
    } else {
      document.getElementById('modalTitle').textContent = 'Добавить договор';
      form.reset();
      contractIdInput.value = '';
    }
    modal.style.display = 'block';
  };

  const closeModal = () => {
    modal.style.display = 'none';
    form.reset();
  };

  // Обработка формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const advertiserId = parseInt(advertiserSelect.value);
    const agentId = parseInt(agentSelect.value);
    const dateSigned = conclusionDateInput.value.trim();
    const durationValue = parseInt(durationValueInput.value);
    const durationUnit = durationUnitInput.value;
    const totalValue = parseFloat(totalValueInput.value);
    const status = statusSelect.value.trim();
  
    // Логируем перед отправкой
    console.log("Отправляемые данные:", {
      advertiser_id: advertiserId,
      agent_id: agentId,
      dateSigned,
      durationValue,
      durationUnit,
      amount: totalValue,
      status
    });
  
    // Валидация
    if (
      isNaN(advertiserId) || advertiserId <= 0 ||
      isNaN(agentId) || agentId <= 0 ||
      !dateSigned ||
      isNaN(durationValue) || durationValue <= 0 ||
      isNaN(totalValue) || totalValue <= 0 ||
      !status
    ) {
      alert('Пожалуйста, заполните все обязательные поля корректно.');
      return;
    }
  
    let durationInterval = '';
    switch (durationUnit) {
      case 'years':
        durationInterval = `${durationValue} year`;
        break;
      case 'months':
        durationInterval = `${durationValue} mons`;
        break;
      default:
        durationInterval = `${durationValue} day`;
    }
  
    const contractData = {
      advertiser_id: advertiserId,
      agent_id: agentId,
      dateSigned,
      duration: durationInterval,
      amount: totalValue,
      status
    };
  
    console.log("Финальный JSON для API:", contractData); // Логируем финальный объект
  
    const contractId = contractIdInput.value;
    const method = contractId ? 'PUT' : 'POST';
    const url = contractId ? `/api/contracts/${contractId}` : '/api/contracts';
  
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения данных');
      }
  
      const result = await response.json();
      closeModal();
      alert(`Договор ${contractId ? 'обновлён' : 'добавлен'}`);
      renderContracts();
    } catch (error) {
      console.error('Ошибка:', error);
      alert(`Не удалось сохранить договор: ${error.message}`);
    }
  });

  // Кнопки
  addBtn.addEventListener('click', () => openModal());
  document.querySelector('.close')?.addEventListener('click', closeModal);

  // Инициализация
  await initSelects();
  await renderContracts();
});