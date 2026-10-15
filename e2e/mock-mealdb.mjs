// Локальная заглушка TheMealDB API для сквозных тестов (без доступа к интернету).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const meals = JSON.parse(readFileSync(new URL('./fixtures/mealdb-meals.json', import.meta.url), 'utf-8'));
const PORT = Number(process.env.MOCK_PORT ?? 4100);

const palette = { pancakes: ['#f8d48a', '#d98b2b'], banana: ['#fff1a8', '#e2b93b'], blini: ['#f3d2b0', '#b9733a'] };

function svg(name) {
  const [a, b] = palette[name] ?? ['#eee', '#ccc'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="640" height="400" fill="#f6efe6"/>
  <ellipse cx="320" cy="250" rx="230" ry="70" fill="#e8dccd"/>
  <ellipse cx="320" cy="225" rx="170" ry="52" fill="url(#g)"/>
  <ellipse cx="320" cy="200" rx="160" ry="48" fill="url(#g)" opacity="0.9"/>
  <ellipse cx="320" cy="176" rx="150" ry="44" fill="url(#g)"/>
  <ellipse cx="300" cy="165" rx="40" ry="10" fill="#fff" opacity="0.5"/>
</svg>`;
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/mock-images/')) {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return res.end(svg(url.pathname.split('/').pop().replace('.svg', '')));
  }
  let found = null;
  if (url.pathname.endsWith('/search.php')) {
    const q = (url.searchParams.get('s') ?? '').toLowerCase();
    found = meals.filter((m) => m.strMeal.toLowerCase().includes(q));
  } else if (url.pathname.endsWith('/lookup.php')) {
    found = meals.filter((m) => m.idMeal === url.searchParams.get('i'));
  } else if (url.pathname.endsWith('/random.php')) {
    found = [meals[Math.floor(Math.random() * meals.length)]];
  } else {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ meals: found.length ? found : null }));
}).listen(PORT, () => console.log(`Mock TheMealDB: http://localhost:${PORT}`));
