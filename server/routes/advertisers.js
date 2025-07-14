const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Лог для проверки подключения маршрута
console.log('Маршрут /api/advertisers загружен');

// ТЕСТОВЫЙ маршрут
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

// Получить всех рекламодателей
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "рекламодатели" ORDER BY рекламодатель_id');
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при загрузке рекламодателей:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить рекламодателя по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM "рекламодатели" WHERE рекламодатель_id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Рекламодатель не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при получении рекламодателя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить нового рекламодателя
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      INSERT INTO "рекламодатели" (название, почта, номер_телефона)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, email, phone];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении рекламодателя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить рекламодателя по ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Сначала проверяем, используется ли рекламодатель в другой таблице
    const checkQuery = `
      SELECT COUNT(*) FROM "реклама" WHERE рекламодатель_id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Невозможно удалить рекламодателя — он используется в таблице рекламы.'
      });
    }

    // Если всё в порядке — удаляем
    const deleteQuery = `
      DELETE FROM "рекламодатели" WHERE рекламодатель_id = $1 RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Рекламодатель не найден' });
    }

    res.json({ message: 'Рекламодатель удален', deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении рекламодателя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Редактировать рекламодателя по ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      UPDATE "рекламодатели"
      SET название = $1, почта = $2, номер_телефона = $3
      WHERE рекламодатель_id = $4
      RETURNING *
    `;
    const values = [name, email, phone, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Рекламодатель не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении рекламодателя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;