const express = require('express');
const router = express.Router();
const { pool } = require('../database');

console.log('Маршрут /api/analytics загружен');

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

// Получить всю аналитику с информацией о рекламе
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.*, r.информация_о_рекламе, k.название AS рекламодатель
      FROM "аудитория" a
      JOIN "реклама" r ON a.реклама_id = r.реклама_id
      JOIN "рекламодатели" k ON r.рекламодатель_id = k.рекламодатель_id
      ORDER BY a.оценка DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при загрузке аналитики:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить аналитику по конкретной рекламе
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Проверяем, что id — это число
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID должен быть числом' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM "аудитория" WHERE реклама_id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Аналитика не найдена' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении аналитики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить запись аналитики
router.post('/', async (req, res) => {
  const { adId, viewers, engagement, rating } = req.body;

  if (!adId || viewers === undefined || engagement === undefined || !rating) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      INSERT INTO "аудитория"
        (реклама_id, количество_зрителей, коэффициент_вовлеченности, оценка)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [adId, viewers, engagement, rating];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении аналитики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить запись аналитики
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { adId, viewers, engagement, rating } = req.body;

  if (!adId || viewers === undefined || engagement === undefined || !rating) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      UPDATE "аудитория"
      SET реклама_id = $1, количество_зрителей = $2,
          коэффициент_вовлеченности = $3, оценка = $4
      WHERE аудитория_id = $5
      RETURNING *
    `;
    const values = [adId, viewers, engagement, rating, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись аналитики не найдена' });
    }

    res.json({ message: 'Аналитика обновлена', updated: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении аналитики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить запись аналитики
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID должен быть числом' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM "аудитория" WHERE аудитория_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись аналитики не найдена' });
    }

    res.json({ message: 'Аналитика удалена', deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении аналитики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Суммарное количество зрителей
router.get('/total-views', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT SUM(количество_зрителей) as total FROM аудитория'
    );
    res.json({ total: Number(rows[0].total || 0) });
  } catch (err) {
    console.error('Ошибка в /api/analytics/total-views:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;