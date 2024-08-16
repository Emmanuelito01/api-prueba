import mysql from 'mysql2/promise';
import db from '../config/database.js';
export default class infoController {
    static async store(req, res) {
        let connection;
        try {
            const { nombre, apellido, email, password } = req.body;
            connection = await mysql.createConnection(db);
            const [result] = await connection.execute(
                "INSERT INTO Usuario (Nombre, Apellido, Correo, Contraseña) VALUES (?, ?, ?, ?)",
                [nombre, apellido, email, password]
            );
            if (result.insertId) {
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
            console.error('Error al obtener la información del Usuario:', error);
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
}