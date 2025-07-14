const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Функция для получения всех рекламодателей
const getAdvertisers = async () => {
  const res = await pool.query('SELECT * FROM Рекламодатели ORDER BY название');
  return res.rows;
};

// Функция для получения всех агентов
const getAgents = async () => {
  const res = await pool.query('SELECT * FROM Агенты ORDER BY фио');
  return res.rows;
};

// Функция для получения всех договоров
const getContracts = async () => {
  const query = `
    SELECT д.*, р.название as рекламодатель, а.фио as агент 
    FROM Договоры д
    JOIN Рекламодатели р ON д.рекламодатель_id = р.рекламодатель_id
    JOIN Агенты а ON д.агент_id = а.агент_id
    ORDER BY д.дата_заключения DESC
  `;
  const res = await pool.query(query);
  return res.rows;
};

// Функция для получения всех рекламных объявлений
const getAds = async () => {
  const query = `
    SELECT р.*, к.название as рекламодатель 
    FROM Реклама р
    JOIN Рекламодатели к ON р.рекламодатель_id = к.рекламодатель_id
    ORDER BY р.дата_выхода DESC
  `;
  const res = await pool.query(query);
  return res.rows;
};

// Функция для получения аналитики по конкретному объявлению
const getAdAnalytics = async (adId) => {
  const res = await pool.query(
    'SELECT * FROM Аудитория WHERE реклама_id = $1 ORDER BY дата_измерения DESC',
    [adId]
  );
  return res.rows;
};

// Экспортируем все функции и пул
module.exports = {
  pool,
  getAdvertisers,
  getAgents,
  getContracts,
  getAds,
  getAdAnalytics
};