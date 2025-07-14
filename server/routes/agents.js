const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Лог для проверки подключения маршрута
console.log('Маршрут /api/agents загружен');

// Тестовый маршрут
router.get('/test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не могу подключиться к БД', details: err.message });
  }
});

// Получить всех агентов
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "агенты" ORDER BY агент_id');
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при загрузке агентов:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить нового агента
router.post('/', async (req, res) => {
  const { fio, phone, commissionRate, hireDate } = req.body;

  if (!fio || !phone || commissionRate === undefined || !hireDate) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      INSERT INTO "агенты" (фио, телефон, процент_от_сделки, дата_найма)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [fio, phone, commissionRate, hireDate];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении агента:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить агента по ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM "агенты" WHERE агент_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Агент не найден' });
    }

    res.json({ message: 'Агент удалён', deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении агента:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить данные агента по ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fio, phone, commissionRate, hireDate } = req.body;

  if (!fio || !phone || commissionRate === undefined || !hireDate) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      UPDATE "агенты"
      SET фио = $1, телефон = $2, процент_от_сделки = $3, дата_найма = $4
      WHERE агент_id = $5
      RETURNING *
    `;
    const values = [fio, phone, commissionRate, hireDate, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Агент не найден' });
    }

    res.json({ message: 'Агент успешно обновлён', updated: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении агента:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;