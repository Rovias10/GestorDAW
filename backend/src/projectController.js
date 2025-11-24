const db = require('../config/database.js');

exports.getAllProjects = async(req,res)=>{
    try{
        const userID = req.user.id;

        const [projects] = await db.query(
            "SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC",
            [userID]
        );

        const projectWithRole = projects.map(project=>({ ...project,role:"owner"}));

        req.json(projectsWithRole);
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Error al obtener los proyectos"})
    }
};

exports.createProject = async (req, res)=>{
    const {name, description}= req.body;
    const owner_id = req.user.id;

    if(!name){
        return res.status(400).json({message:"Nombre es obligatorio"})
    }

    try{
        const [result] = await db.query(
            "INSERT INTO projects (name,desfirption, owner_id) VALUES (?, ?, ?)",
            [name, description, owner_id]
        );

        req.status(201).json({
            message: "Proyecto creado exitosamente",
            id: result.innerId,
            name,
            description,
            role: "owner"
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Error al crear el proyecto"})
    }
}