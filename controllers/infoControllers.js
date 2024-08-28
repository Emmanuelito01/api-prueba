import mysql from 'mysql2/promise';
import db from '../config/database.js';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';


export default class infoController {
    
    static async store(req, res) {
        let connection;
        try {
            const { nombre, apellido, email, password } = req.body;
            connection = await mysql.createConnection(db);

            // Inserta el usuario en la base de datos
            const [result] = await connection.execute(
                "INSERT INTO Usuario (Nombre, Apellido, Correo, Contraseña) VALUES (?, ?, ?, ?)",
                [nombre, apellido, email, password]
            );

            if (result.insertId) {
                // Envía el ID del usuario como parte de la respuesta
                res.status(200).json({ message: "Datos guardados exitosamente", userId: result.insertId });
            } else {
                res.status(500).json({ message: "Error al guardar los datos del usuario" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async login(req, res) {
        let connection;
        try {
            const { email, password } = req.body;
            connection = await mysql.createConnection(db);
            const [results] = await connection.execute(
                "SELECT * FROM Usuario WHERE Correo = ? AND Contraseña = ?",
                [email, password]
            );
            if (results.length > 0) {
                const user = results[0];
                res.status(200).json({ message: "Inicio de sesión exitoso", userId: user.Id_usuario });
            } else {
                res.status(401).json({ message: "Credenciales incorrectas" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async getUserInfo(req, res) {
        let connection;
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ message: "Email es requerido" });
            }

            connection = await mysql.createConnection(db);
            const [results] = await connection.execute(
                "SELECT Nombre, Apellido, Correo FROM Usuario WHERE Correo = ?",
                [email]
            );
            if (results.length > 0) {
                res.status(200).json(results[0]);
            } else {
                res.status(404).json({ message: "Usuario no encontrado" });
            }
        } catch (error) {
            console.error('Error al obtener la información del usuario:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    static async updateUserInfo(req, res) {
        let connection;
        try {
            const { email, nombre, apellido, password } = req.body;

            // Validar datos de entrada
            if (!email || !nombre || !apellido || !password) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }

            connection = await mysql.createConnection(db);

            const query = password
                ? "UPDATE Usuario SET Nombre = ?, Apellido = ?, Contraseña = ? WHERE Correo = ?"
                : "UPDATE Usuario SET Nombre = ?, Apellido = ? WHERE Correo = ?";

            const params = password
                ? [nombre, apellido, password, email]
                : [nombre, apellido, email];

            const [results] = await connection.execute(query, params);

            if (results.affectedRows > 0) {
                res.status(200).json({ message: "Datos actualizados exitosamente" });
            } else {
                res.status(404).json({ message: "Usuario no encontrado" });
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async deleteUser(req, res) {
        let connection;
        try {
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ message: "userId es requerido" });
            }
    
            connection = await mysql.createConnection(db);
            
            // Eliminar las filas dependientes en la tabla `prenda`
            await connection.execute(
                "DELETE FROM Prenda WHERE UsuarioId_usuario = ?",
                [userId]
            );
    
            // Eliminar el usuario
            const [result] = await connection.execute(
                "DELETE FROM Usuario WHERE Id_usuario = ?",
                [userId]
            );
    
            if (result.affectedRows > 0) {
                res.status(200).json({ message: "Usuario eliminado exitosamente" });
            } else {
                res.status(404).json({ message: "Usuario no encontrado" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
       
    static async getUserClothes(req, res) {
        let connection;
        try {
            console.log("Solicitud recibida con userId:", req.query.userId); // Log para verificar el userId
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ message: "userId es requerido" });
            }
    
            connection = await mysql.createConnection(db);
            const [results] = await connection.execute(
                "SELECT Url_prenda FROM Prenda WHERE UsuarioId_usuario = ?",
                [userId]
            );
    
            if (results.length > 0) {
                res.status(200).json(results);
            } else {
                res.status(404).json({ message: "No se encontraron prendas para este usuario" });
            }
        } catch (error) {
            console.error('Error al obtener las prendas:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async getClothesByName(req, res) {
        let connection;
        try {
            const { userId, names } = req.query; // Usa 'names' en lugar de 'name'
            
            if (!userId || !names) {
                return res.status(400).json({ message: "userId y names son requeridos" });
            }
            
            // Asegúrate de que 'names' sea un arreglo
            const nameArray = Array.isArray(names) ? names : [names];
            
            connection = await mysql.createConnection(db);
            
            // Construye la consulta con placeholders para cada nombre
            const placeholders = nameArray.map(() => '?').join(', ');
            const query = `SELECT Url_prenda FROM Prenda WHERE UsuarioId_usuario = ? AND Nombre IN (${placeholders})`;
            
            // Combina el userId con el arreglo de nombres
            const [results] = await connection.execute(
                query,
                [userId, ...nameArray]
            );

            if (results.length > 0) {
                res.status(200).json(results);
            } else {
                res.status(404).json({ message: "No se encontraron prendas con esos nombres" });
            }
        } catch (error) {
            console.error('Error al obtener las prendas:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    //------------------------------------------
    static async saveClothing(req, res) {
        let connection;
        try {
            const { color, codigoVestimenta, nombre, imageUrl, UsuarioId_usuario } = req.body;
    
            // Validar que los datos esenciales están presentes
            if (!color || !codigoVestimenta || !nombre || !imageUrl || !UsuarioId_usuario) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }
    
            connection = await mysql.createConnection(db);
    
            // Inserta los datos de la prenda en la base de datos
            const [result] = await connection.execute(
                "INSERT INTO Prenda (Color, Codigo_vestimenta, Nombre, Url_prenda, UsuarioId_usuario) VALUES (?, ?, ?, ?, ?)",
                [color, codigoVestimenta, nombre, imageUrl, UsuarioId_usuario]
            );
    
            if (result.insertId) {
                res.status(200).json({ message: "Prenda guardada exitosamente", prendaId: result.insertId });
            } else {
                res.status(500).json({ message: "Error al guardar la prenda" });
            }
        } catch (error) {
            console.error("Error al guardar la prenda:", error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async getClothesByCategory(req, res) {
        let connection;
        try {
            const { userId, names } = req.query; // 'names' es el código de vestimenta
            if (!userId || !names) {
                return res.status(400).json({ message: "userId y código de vestimenta son requeridos" });
            }
    
            connection = await mysql.createConnection(db);
    
            // Consulta para obtener una prenda de cada tipo
            const query = `
                (SELECT * FROM Prenda
                 WHERE UsuarioId_usuario = ?
                   AND Codigo_vestimenta = ?
                   AND (Nombre LIKE '%chaqueta%' OR Nombre LIKE '%saco%')
                 ORDER BY RAND()
                 LIMIT 1)
                UNION
                (SELECT * FROM Prenda
                 WHERE UsuarioId_usuario = ?
                   AND Codigo_vestimenta = ?
                   AND (Nombre LIKE '%camiseta%' OR Nombre LIKE '%camisa%')
                 ORDER BY RAND()
                 LIMIT 1)
                UNION
                (SELECT * FROM Prenda
                 WHERE UsuarioId_usuario = ?
                   AND Codigo_vestimenta = ?
                   AND (Nombre LIKE '%pantalón%' OR Nombre LIKE '%short%' OR Nombre LIKE '%falda%')
                 ORDER BY RAND()
                 LIMIT 1)
            `;
    
            const [rows] = await connection.execute(query, [userId, names, userId, names, userId, names]);
    
            if (rows.length > 0) {
                res.status(200).json(rows);
            } else {
                res.status(404).json({ message: "No se encontraron prendas para el código de vestimenta proporcionado." });
            }
        } catch (error) {
            console.error('Error al obtener las prendas:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async saveFavorites(req, res) {
        let connection;
        try {
            const { userId, urls } = req.body;
    
            console.log('Received data:', { userId, urls }); // Verifica los datos recibidos
    
            if (!userId || !urls || !Array.isArray(urls) || urls.length < 3) {
                return res.status(400).json({ message: 'userId y un array de URLs con al menos 3 elementos son requeridos' });
            }
    
            connection = await mysql.createConnection(db);
    
            // Reemplaza valores `undefined` con `null`
            const sanitizedUrls = urls.map(url => url ?? null);
    
            console.log('Sanitized URLs:', sanitizedUrls); // Verifica los datos antes de la inserción
    
            const [result] = await connection.execute(
                "INSERT INTO Favoritos (Url_1, Url_2, Url_3, UsuarioId_usuario) VALUES (?, ?, ?, ?)",
                [sanitizedUrls[0], sanitizedUrls[1], sanitizedUrls[2], userId]
            );
    
            if (result.insertId) {
                res.status(200).json({ message: "Favoritos guardados exitosamente" });
            } else {
                res.status(500).json({ message: "Error al guardar los favoritos" });
            }
        } catch (error) {
            console.error('Error al guardar en favoritos:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async getFavorites(req, res) {
        let connection;
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ message: "userId es requerido" });
            }
    
            connection = await mysql.createConnection(db);
            const [results] = await connection.execute(
                "SELECT Url_1, Url_2, Url_3 FROM Favoritos WHERE UsuarioId_usuario = ?",
                [userId]
            );
    
            if (results.length > 0) {
                res.status(200).json(results); // Devolver todos los resultados
            } else {
                res.status(404).json({ message: "No se encontraron favoritos para este usuario" });
            }
        } catch (error) {
            console.error('Error al obtener los favoritos:', error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async deleteClothingItem(req, res) {
        let connection;
        try {
            const { imageUrl } = req.body;
            if (!imageUrl) {
                return res.status(400).json({ message: "La URL de la prenda es requerida" });
            }
    
            connection = await mysql.createConnection(db);
    
            const [result] = await connection.execute(
                "DELETE FROM Prenda WHERE Url_prenda = ?",
                [imageUrl]
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Prenda no encontrada" });
            }
    
            return res.status(200).json({ message: "Prenda eliminada exitosamente" });
        } catch (error) {
            console.error("Error eliminando la prenda: ", error);
            return res.status(500).json({ message: "Error eliminando la prenda" });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    static async deleteFavorite(req, res) {
    let connection;
    try {
        const { userId, imageUrl } = req.body;
        console.log('userId:', userId);
        console.log('imageUrl:', imageUrl);

        if (!userId || !imageUrl) {
            return res.status(400).json({ message: "userId e imageUrl son requeridos" });
        }

        connection = await mysql.createConnection(db);

        // Consulta para eliminar el favorito
        const [result] = await connection.execute(
            "DELETE FROM favoritos WHERE UsuarioId_usuario = ? AND (Url_1 = ? OR Url_2 = ? OR Url_3 = ?)",
            [userId, imageUrl, imageUrl, imageUrl]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Favorito eliminado exitosamente" });
        } else {
            res.status(404).json({ message: "Favorito no encontrado" });
        }
    } catch (error) {
        console.error('Error al eliminar el favorito:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
    
}
