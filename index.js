const express = require('express');
const morgan = require ('morgan');
const fs = require('fs');
var cors=require('cors')
const path = require('path');
const mysql = require('mysql2');
const app = express();
const swaggerUI = require('swagger-ui-express')
const swaggerJsDoc = require ('swagger-jsdoc')
const { SwaggerTheme } = require('swagger-themes');
const redoc = require('redoc-express');

const port = process.env.PORT || 8080
const host = process.env.host || 'localhost'
const user = process.env.user || 'root'
const password = process.env.password || '2701'
const database = process.env.database || 'alumnos'
const dbport = process.env.dbport || 3306

const dataDeBase = {
    host: host,
    user: user,
    password: password,
    database: database,
    port: dbport
};

const theme = new SwaggerTheme('v3');

const options = {
    explorer: true,
    customCss: theme.getBuffer('dark')
  };

app.use(cors())
app.use(express.urlencoded({extended:true}));

const read = fs.readFileSync(path.join(__dirname,'./README.md'),
{encoding:'utf8',flag:'r'});


const def = fs.readFileSync(path.join(__dirname,'./swagger.json'),
{encoding:'utf8',flag:'r'});

const defObj= JSON.parse(def)
defObj.info.description=read;

const swaggerOptions = {
    definition:defObj,
    apis: [`${path.join(__dirname, "./index.js")}`]
}


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerDocs,options));

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

app.get('/', function (req, res) {
    res.send('hello, world!');
});



//ALL USERS
/**
 * @swagger
 * /alumnos/:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Consultar todos los alumnos
 *     description: Obtiene Json que con todos los alumnos de la Base de Datos
 *     responses:
 *       200:
 *         description: Regresa un Json con todos los alumnos
 */
app.get('/alumnos', async (req, resp) => {
    try {
        const conexion = await mysql.createConnection(dataDeBase);
        const [rows, fields] = await conexion.query('SELECT * FROM tec');
        resp.json(rows);
    } catch (err) {
        resp.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
    }
});

// SELECT
/**
 * @swagger
 * /alumnos/{id}:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Consultar un alumno por ID
 *     description: Obtiene Json con un alumno específico de la Base de Datos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del alumno a consultar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Regresa un Json con el alumno solicitado
 *       404:
 *         description: El alumno no existe
 */
app.get('/alumnos/:id', async (req, resp) => {
    try {
        console.log(req.params.id);
        const conexion = await mysql.createConnection(dataDeBase);
        const [rows, fields] = await conexion.query('SELECT * FROM tec WHERE idtec=' + req.params.id);
        if (rows.length == 0) {
            resp.status(404);
            resp.json({ mensaje: 'Usuario no existe' });
        } else {
            resp.json(rows);
        }
    } catch (err) {
        resp.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
    }
});

// INSERT INTO
/**
 * @swagger
 * /alumnos/:
 *   post:
 *     tags:
 *       - Alumnos
 *     summary: Agregar un nuevo alumno
 *     description: Agrega un nuevo alumno a la Base de Datos con los parámetros proporcionados en el cuerpo de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idtec:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *             required:
 *               - idtec
 *               - nombre
 *               - apellido
 *     responses:
 *       201:
 *         description: Usuario agregado correctamente
 */
app.post('/alumnos', async (req, resp) => {
    try {
        const id = req.body.idtec;
        const nom = req.body.nombre;
        const ape = req.body.apellido;
        const conexion = await mysql.createConnection(dataDeBase);
        const [result] = await conexion.query('INSERT INTO tec (idtec, nombre, apellido) VALUES (?, ?, ?)', [id, nom, ape]);
        
        resp.status(201).json({ mensaje: 'Usuario agregado correctamente'});
    } catch (err) {
        resp.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
    }
});  

// UPDATE
/**
 * @swagger
 * /alumnos/:
 *   put:
 *     tags:
 *       - Alumnos
 *     summary: Modificar un alumno existente
 *     description: Modifica un alumno existente en la Base de Datos con los parámetros proporcionados en el cuerpo de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idtec:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *             required:
 *               - idtec
 *     responses:
 *       200:
 *         description: Usuario modificado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: Solicitud incorrecta
 */
app.put('/alumnos', async (req, res) => {
    try {
        const objeto = req.body;
        const conexion = await mysql.createConnection(dataDeBase);

        if (!objeto.idtec || Object.keys(objeto).length === 1) {
            return res.status(400).json({ error: 'Solicitud incorrecta' });
        }
    
        let sentenciaSql = 'UPDATE tec SET';
        const campos = Object.keys(objeto).filter(key => key !== 'idtec');
        
        for (let i = 0; i < campos.length; i++) {
            if (i == campos.length - 1) {
                sentenciaSql += `${campos[i]} = '${objeto[campos[i]]}'`;
            } else {
                sentenciaSql += `${campos[i]} = '${objeto[campos[i]]}',` ;
            }
        }
        sentenciaSql +=  'WHERE idtec = ${objeto.idtec};';
        const result = await conexion.query(sentenciaSql);

        if (result.affectedRows == 0) {
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
        } else {
            res.json({ mensaje: 'Usuario modificado correctamente' });
        }
    } catch (err) {
        res.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
    }
});

// DELETE
/**
 * @swagger
 * /alumnos/:
 *   delete:
 *     tags:
 *       - Alumnos
 *     summary: Eliminar un alumno por ID
 *     description: Elimina un alumno de la Base de Datos según el ID proporcionado en los parámetros de la solicitud
 *     parameters:
 *       - in: query
 *         name: idtec
 *         required: true
 *         description: ID del alumno a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro eliminado correctamente
 *       404:
 *         description: Registro no encontrado
 */
app.delete('/alumnos', async (req, resp) => {
    try {
        const id = req.query.idtec;
        console.log(id);
        const conexion = await mysql.createConnection(dataDeBase);
        const query = "DELETE FROM tec WHERE idtec = "+id;
        const [rows, fields] = await conexion.query(query);
        if (rows.affectedRows == 0) {
            resp.json({ mensaje: 'Registro No Eliminado' });
        } else {
            resp.json({ mensaje: 'Registro Eliminado' });
        }
    } catch (err) {
        resp.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
    }
});


//URLSearch
app.post('/alumnos/urlencoded', async (req, resp) => {
    try {
        const id = req.body.idtec;
        const nom = req.body.nombre;
        const ape = req.body.apellido;
        const conexion = await mysql.createConnection(dataDeBase);
        const [result] = await conexion.query('INSERT INTO prueba (id, nombre, apellido) VALUES (?, ?, ?)', [id, nom, ape]);

        resp.status(201).json({ mensaje: 'Usuario agregado correctamente' });
    } catch (err) {
        resp.status(500).json({ mensaje: 'Error de conexión', tipo: err.message, sql: err.sqlMessage });
        console.error(err);
    }
});


app.use("/api-docs-json",(req,res)=>{
    res.json(swaggerDocs);
})

app.get(
    '/api-docs-redoc',
    redoc({
      title: 'API Docs',
      specUrl: '/api-docs-json',
      nonce: '', // <= it is optional,we can omit this key and value
      // we are now start supporting the redocOptions object
      // you can omit the options object if you don't need it
      // https://redocly.com/docs/api-reference-docs/configuration/functionality/
      redocOptions: {
        theme: {
          colors: {
            primary: {
              main: '#6EC5AB'
            }
          },
          typography: {
            fontFamily: `"museo-sans", 'Helvetica Neue', Helvetica, Arial, sans-serif`,
            fontSize: '15px',
            lineHeight: '1.5',
            code: {
              code: '#87E8C7',
              backgroundColor: '#4D4D4E'
            }
          },
          menu: {
            backgroundColor: '#ffffff'
          }
        }
      }
    })
  );
  

app.listen(port, () => {
    console.log('Servidor express escuchando');
});