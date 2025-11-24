const db= require("../config/database.js");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register= async(req,res)=>{
    const {name, email, password}= req.body;

    if  (!name || !email || !password){
        return res.status(400).json({message:"Poir favor complete todos los campos"})
    }

    try{
        const [existingUser] = await db.query("SELECT * FROM users where email= ?", [email]);

        if (users.length==0){
            return res.status(400).json({message:"Credenciale Invalidas"})
        }

        const user=users[0];

        const validPassword= await bcrypt.compare(password, user.password);
        if(!validPassword){
            return res.status(400).json({message: "Credenciales Invalidas"})
        }

        const token = jwt.sign(
            {id: user.id, email: user.email, name: user.name},
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        res.json({
            message: "Inicio de sesión exitoso",
            token,
            user: {id: user.id, email: user.email, name: user.name}
        })
    
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al iniciar sesión"})
    }
}