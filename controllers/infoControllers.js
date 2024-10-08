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
            // Verificar si el correo existe
            const [emailResults] = await connection.execute(
                "SELECT * FROM Usuario WHERE Correo = ?",
                [email]
            );
            if (emailResults.length === 0) {
                // El correo no está registrado
                return res.status(404).json({ message: "No existe una cuenta asociada con este correo electrónico" });
            }
            // Si el correo existe, verificar la contraseña
            const [results] = await connection.execute(
                "SELECT * FROM Usuario WHERE Correo = ? AND Contraseña = ?",
                [email, password]
            );
            if (results.length > 0) {
                const user = results[0];
                return res.status(200).json({ message: "Inicio de sesión exitoso", userId: user.Id_usuario });
            } else {
                // El correo existe, pero la contraseña es incorrecta
                return res.status(401).json({ message: "Contraseña incorrecta" });
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
            const { userId } = req.query; // Change to expect userId instead of email
            if (!userId) {
                return res.status(400).json({ message: "userId es requerido" }); // Modify the error message
            }
    
            connection = await mysql.createConnection(db);
            const [results] = await connection.execute(
                "SELECT Nombre, Apellido, Correo FROM Usuario WHERE Id_usuario = ?", // Query by Id_usuario instead of Correo
                [userId]
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
            const { userId, email, nombre, apellido, password } = req.body;
    
            // Validar datos de entrada
            if (!userId || !email || !nombre || !apellido || !password) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }
    
            connection = await mysql.createConnection(db);
    
            const query = password
                ? "UPDATE Usuario SET Correo = ?, Nombre = ?, Apellido = ?, Contraseña = ? WHERE Id_usuario = ?"
                : "UPDATE Usuario SET Correo = ?, Nombre = ?, Apellido = ? WHERE Id_usuario = ?";
    
            const params = password
                ? [email, nombre, apellido, password, userId]
                : [email, nombre, apellido, userId];
    
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
            // Eliminar las filas dependientes en la tabla `favoritos`
            await connection.execute(
                "DELETE FROM Favoritos WHERE UsuarioId_usuario = ?",
                [userId]
            );
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
            const { userId, names } = req.query;
            if (!userId || !names) {
                return res.status(400).json({ message: "userId y código de vestimenta son requeridos" });
            }
    
            connection = await mysql.createConnection(db);
    
            // Consulta para obtener todas las prendas del usuario para el código de vestimenta especificado
            const [rows] = await connection.execute(
                `SELECT * FROM Prenda WHERE UsuarioId_usuario = ? AND Codigo_vestimenta = ?`,
                [userId, names]
            );
    
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
            const { userId, urls, favoriteName } = req.body;
    
            console.log('Received data:', { userId, urls, favoriteName }); // Verifica los datos recibidos
    
            if (!userId || !urls || !Array.isArray(urls) || urls.length < 3 || !favoriteName) {
                return res.status(400).json({ message: 'userId, un array de URLs con al menos 3 elementos y favoriteName son requeridos' });
            }
    
            connection = await mysql.createConnection(db);
    
            // Reemplaza valores `undefined` con `null`
            const sanitizedUrls = urls.map(url => url ?? null);
    
            console.log('Sanitized URLs:', sanitizedUrls); // Verifica los datos antes de la inserción
    
            const [result] = await connection.execute(
                "INSERT INTO Favoritos (Url_1, Url_2, Url_3, UsuarioId_usuario, Nombref) VALUES (?, ?, ?, ?, ?)",
                [sanitizedUrls[0], sanitizedUrls[1], sanitizedUrls[2], userId, favoriteName]
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
                `SELECT Url_1, Url_2, Url_3, Nombref 
                 FROM Favoritos 
                 WHERE UsuarioId_usuario = ?`,
                [userId]
            );
    
            if (results.length > 0) {
                res.status(200).json(results);
            } else {
                res.status(404).json({ message: "No se encontraron favoritos" });
            }
        } catch (error) {
            console.error('Error al obtener favoritos:', error);
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
            "DELETE FROM Favoritos WHERE UsuarioId_usuario = ? AND (Url_1 = ? OR Url_2 = ? OR Url_3 = ?)",
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
