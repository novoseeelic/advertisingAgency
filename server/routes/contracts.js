const express = require('express');
const router = express.Router();
const { pool } = require('../database');

console.log('Маршрут /api/contracts загружен');

// Получить все договоры
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT д.*, р.название AS рекламодатель, а.фио AS агент 
      FROM "договоры" д
      JOIN "рекламодатели" р ON д.рекламодатель_id = р.рекламодатель_id
      JOIN "агенты" а ON д.агент_id = а.агент_id
      ORDER BY д.дата_заключения DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при загрузке договоров:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить договор по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM "договоры" WHERE договор_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Договор не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при получении договора:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить новый договор
router.post('/', async (req, res) => {
  const { advertiserId, agentId, dateSigned, durationValue, durationUnit, amount, status } = req.body;

  if (!advertiserId || !agentId || !dateSigned || !amount || !status) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  let durationInterval = '';
  switch (durationUnit) {
    case 'years':
      durationInterval = `${durationValue} year`;
      break;
    case 'months':
      durationInterval = `${durationValue} mons`;
      break;
    // case 'weeks':
    //   durationInterval = `${durationValue} week`;
    //   break;
    case 'days':
    default:
      durationInterval = `${durationValue} day`;
  }

  try {
    const query = `
      INSERT INTO "договоры"
        (рекламодатель_id, агент_id, дата_заключения, срок_действия, сумма, статус)
      VALUES ($1, $2, $3, $4::interval, $5, $6)
      RETURNING *
    `;
    const values = [advertiserId, agentId, dateSigned, durationInterval, amount, status];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении договора:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить договор
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    advertiserId,
    agentId,
    dateSigned,
    durationValue,
    durationUnit,
    amount,
    status
  } = req.body;

  if (!advertiserId || !agentId || !dateSigned || durationValue === undefined || !amount || !status) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  let durationInterval = '';
  switch (durationUnit) {
    case 'years':
      durationInterval = `${durationValue} years`;
      break;
    case 'months':
      durationInterval = `${durationValue} months`;
      break;
    case 'weeks':
      durationInterval = `${durationValue} weeks`;
      break;
    case 'days':
    default:
      durationInterval = `${durationValue} days`;
  }

  try {
    const query = `
      UPDATE "договоры"
      SET рекламодатель_id = $1,
          агент_id = $2,
          дата_заключения = $3,
          срок_действия = $4::interval,
          сумма = $5,
          статус = $6
      WHERE договор_id = $7
      RETURNING *
    `;
    const values = [advertiserId, agentId, dateSigned, durationInterval, amount, status, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Договор не найден' });
    }

    res.json({ message: 'Договор обновлён', updated: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении договора:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить договор
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM "договоры" WHERE договор_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Договор не найден' });
    }

    res.json({ message: 'Договор удалён', deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении договора:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;