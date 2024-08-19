import mysql from 'mysql2/promise';
import db from '../config/database.js';

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
                "SELECT Nombre, Apellido, Correo FROM usuario WHERE Correo = ?",
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
                ? "UPDATE usuario SET Nombre = ?, Apellido = ?, Contraseña = ? WHERE Correo = ?"
                : "UPDATE usuario SET Nombre = ?, Apellido = ? WHERE Correo = ?";

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
                "DELETE FROM prenda WHERE UsuarioId_usuario = ?",
                [userId]
            );
    
            // Eliminar el usuario
            const [result] = await connection.execute(
                "DELETE FROM usuario WHERE Id_usuario = ?",
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
    
    
    
}
