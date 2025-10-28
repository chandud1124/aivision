import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 5174;
const dist = path.join(process.cwd(), 'dist');

app.use(express.static(dist));
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, () => console.log(`Serving dist on http://localhost:${port}`));
