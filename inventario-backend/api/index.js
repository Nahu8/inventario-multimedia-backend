const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, '../data'); // Ajuste para la estructura de Vercel

// **Helper function** para leer y escribir archivos JSON
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}

function writeJsonFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// **GET: Obtener la lista completa**
app.get('/api/:category', async (req, res) => {
  const category = req.params.category;
  const filePath = path.join(DATA_DIR, `${category}.json`);
  try {
    const data = await readJsonFile(filePath);
    res.json(data);
  } catch (err) {
    res.status(500).send(`Error al leer los datos de ${category}: ${err.message}`);
  }
});

// **POST: Agregar un nuevo ítem**
app.post('/api/:category', async (req, res) => {
    const category = req.params.category; // Categoría obtenida de la URL
    const filePath = path.join(DATA_DIR, `${category}.json`); // Ruta al archivo JSON correspondiente
    const newItem = req.body; // Datos enviados en el body de la solicitud
  
    try {
      // Leer los datos existentes del archivo JSON
      const data = await readJsonFile(filePath);
  
      // Generar un nuevo ID para el nuevo ítem
      newItem.id = data.length ? data[data.length - 1].id + 1 : 1;
  
      // Agregar el nuevo ítem a la lista
      data.push(newItem);
  
      // Guardar los datos actualizados en el archivo JSON
      await writeJsonFile(filePath, data);
  
      // Responder con éxito
      res.status(201).send('Ítem agregado con éxito');
    } catch (err) {
      // Manejar errores en la lectura/escritura
      res.status(500).send(`Error al agregar un ítem a ${category}: ${err.message}`);
    }
  });

// **PUT: Editar un ítem existente**
app.put('/api/:category/:id', async (req, res) => {
  const category = req.params.category;
  const id = parseInt(req.params.id, 10);
  const filePath = path.join(DATA_DIR, `${category}.json`);
  const updatedItem = req.body;

  try {
    const data = await readJsonFile(filePath);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).send('Ítem no encontrado');
    }
    data[index] = { ...data[index], ...updatedItem }; // Actualizar ítem
    await writeJsonFile(filePath, data);
    res.send('Ítem actualizado con éxito');
  } catch (err) {
    res.status(500).send(`Error al actualizar el ítem en ${category}: ${err.message}`);
  }
});

// **DELETE: Eliminar un ítem existente**
app.delete('/api/:category/:id', async (req, res) => {
  const category = req.params.category;
  const id = parseInt(req.params.id, 10);
  const filePath = path.join(DATA_DIR, `${category}.json`);

  try {
    const data = await readJsonFile(filePath);
    const filteredData = data.filter((item) => item.id !== id);
    if (filteredData.length === data.length) {
      return res.status(404).send('Ítem no encontrado');
    }
    await writeJsonFile(filePath, filteredData);
    res.send('Ítem eliminado con éxito');
  } catch (err) {
    res.status(500).send(`Error al eliminar el ítem de ${category}: ${err.message}`);
  }
});

// Exporta la aplicación Express para Vercel
module.exports = app;
