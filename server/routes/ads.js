const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Лог для проверки загрузки маршрута
console.log('Маршрут /api/ads загружен');

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

// Получить все объявления с информацией о рекламодателе
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT р.*, к.название AS рекламодатель 
      FROM "реклама" р
      JOIN "рекламодатели" к ON р.рекламодатель_id = к.рекламодатель_id
      ORDER BY р.дата_выхода DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при загрузке объявлений:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новое объявление
router.post('/', async (req, res) => {
  const { advertiserId, info, cost, datePublished } = req.body;

  if (!advertiserId || !info || cost === undefined || !datePublished) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      INSERT INTO "реклама"
        (рекламодатель_id, информация_о_рекламе, стоимость, дата_выхода)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [advertiserId, info, cost, datePublished];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении объявления:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить объявление
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { advertiserId, info, cost, datePublished } = req.body;

  if (!advertiserId || !info || cost === undefined || !datePublished) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const query = `
      UPDATE "реклама"
      SET рекламодатель_id = $1, информация_о_рекламе = $2,
          стоимость = $3, дата_выхода = $4
      WHERE реклама_id = $5
      RETURNING *
    `;
    const values = [advertiserId, info, cost, datePublished, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    res.json({ message: 'Объявление обновлено', updated: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении объявления:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить объявление
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM "реклама" WHERE реклама_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    res.json({ message: 'Объявление удалено', deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении объявления:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Счётчик объявлений — остаётся как есть
router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM реклама');
    res.json({ count: Number(rows[0].count) });
  } catch (err) {
    console.error('Ошибка в /api/ads/count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;