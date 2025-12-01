// js/app.js
import * as api from "./api-service.js";

// --- Router Sencillo basado en el ID de un elemento ---
const PAGE_ID = document.body.id;

// --- Lógica de UI Común (Header/Sidebar) ---
// Se ejecuta en todas las páginas del dashboard
if (document.querySelector(".wrapper")) {
  // Cargar info del usuario en el header
  const tokenData = api.decodificarToken();
  if (tokenData) {
    // Intentamos cogerlo del token primero para velocidad
    document.getElementById("userNameSmall").textContent = tokenData.name;
    document.getElementById(
      "userNameLarge"
    ).textContent = `${tokenData.name} - ${tokenData.email}`;

    // Luego pedimos los datos frescos (ej. avatar)
    api
      .getMiPerfil()
      .then((user) => {
        document.getElementById("userNameSmall").textContent = user.name;
        document.getElementById(
          "userNameLarge"
        ).textContent = `${user.name} - ${user.email}`;
        const avatar =
          user.avatar_url ||
          `https://placehold.co/160x160/007bff/ffffff?text=${user.name[0]}`;
        document.getElementById("userAvatarSmall").src = avatar;
        document.getElementById("userAvatarLarge").src = avatar;
      })
      .catch((err) => console.warn("No se pudo refrescar el perfil:", err));
  }

  // Botón de Logout
  document.getElementById("logoutBtn").onclick = () => {
    api.borrarToken();
    window.location.href = "../auth/login.html";
  };
}

// --- Lógica Específica de cada Página ---

// ----------- LOGIN PAGE -----------
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("loginError");

    try {
      const res = await api.login(email, password);
      if (res.token) {
        api.guardarToken(res.token);
        window.location.href = "../dashboard/index.html";
      }
    } catch (error) {
      errorEl.textContent = error.message || "Credenciales incorrectas";
      errorEl.style.display = "block";
    }
  });
}

// ----------- REGISTER PAGE -----------
if (document.getElementById("registerForm")) {
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("registerError");

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await api.register(name, email, password);
        if (res.message) {
          // Éxito, redirigir a login
          window.location.href = "login.html";
        }
      } catch (error) {
        errorEl.textContent = error.message || "Datos inválidos";
        errorEl.style.display = "block";
      }
    });
}

// ----------- DASHBOARD (STATS) -----------
if (document.getElementById("dashboardStats")) {
  async function cargarDashboardStats() {
    try {
      const stats = await api.getDashboardStats();
      document.getElementById("statTotalProjects").textContent =
        stats.totalProjects || 0;
      document.getElementById("statTasksPending").textContent =
        stats.tasksPending || 0;
      document.getElementById("statTasksCompleted").textContent =
        stats.tasksCompleted || 0;
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
  }
  cargarDashboardStats();
}

// ----------- PROJECTS LIST (projects.html) -----------
if (document.getElementById("projectsGrid")) {
  const grid = document.getElementById("projectsGrid");

  async function cargarProyectos() {
    try {
      const projects = await api.getProjects();
      grid.innerHTML = ""; // Limpiar
      if (projects.length === 0) {
        grid.innerHTML =
          '<div class="col-12"><p>No tienes proyectos. ¡Crea uno!</p></div>';
        return;
      }
      projects.forEach((proj) => {
        const card = document.createElement("div");
        card.className = "col-md-4";
        card.innerHTML = `
                    <div class="card card-primary card-outline project-card" data-project-id="${
                      proj.id
                    }">
                        <div class="card-body">
                            <h5 class="card-title">${proj.name}</h5>
                            <p class="card-text">${proj.description.substring(
                              0,
                              100
                            )}...</p>
                            <span class="badge bg-success">${proj.role}</span>
                        </div>
                    </div>
                `;
        // Click para ir al detalle
        card.querySelector(".project-card").onclick = () => {
          window.location.href = `project-detail.html?id=${proj.id}`;
        };
        grid.appendChild(card);
      });
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  }

  // Guardar Proyecto (Crear)
  document.getElementById("saveProjectButton").onclick = async () => {
    const name = document.getElementById("projectName").value;
    const description = document.getElementById("projectDescription").value;
    const errorEl = document.getElementById("projectError");

    try {
      await api.createProject(name, description);
      cargarProyectos(); // Recargar lista
      $("#projectModal").modal("hide"); // Ocultar modal (jQuery)
      document.getElementById("projectForm").reset();
    } catch (error) {
      errorEl.textContent = error.message || "Error al guardar";
      errorEl.style.display = "block";
    }
  };

  cargarProyectos();
}

// ----------- PROJECT DETAIL (project-detail.html) -----------
if (document.getElementById("projectDetailName")) {
  let currentProject = null;
  let tasksTable = null; // Referencia a la DataTable
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    window.location.href = "projects.html"; // Si no hay ID, volver
  }

  async function cargarDetalleProyecto() {
    try {
      const data = await api.getProjectDetails(projectId);
      currentProject = data; // Guardar data del proyecto (incluye rol)

      // Rellenar info
      document.getElementById("projectDetailName").textContent =
        data.project.name;

      // Rellenar Colaboradores (Nivel 3)
      const collabList = document.getElementById("collaboratorsList");
      collabList.innerHTML = "";
      data.collaborators.forEach((user) => {
        const avatar =
          user.avatar_url || `https://placehold.co/40x40?text=${user.name[0]}`;
        collabList.innerHTML += `
                    <li class="list-group-item">
                        <img src="${avatar}" class="img-circle img-sm mr-2" alt="Avatar">
                        ${user.name} (${user.email})
                        <span class="badge bg-primary float-right">${user.role}</span>
                    </li>`;
      });

      // Rellenar Tareas (Nivel 2)
      if (tasksTable) tasksTable.destroy(); // Limpiar tabla anterior
      tasksTable = $("#tasksTable").DataTable({
        data: data.tasks,
        columns: [
          { data: "id" },
          { data: "title" },
          { data: "assignee_name", defaultContent: "<i>Sin asignar</i>" },
          { data: "status" },
          {
            data: "id",
            render: (id) => `
                        <button class="btn btn-xs btn-info btn-edit-task permission-owner-editor" data-id="${id}">Editar</button>
                        <button class="btn btn-xs btn-danger btn-delete-task permission-owner-editor" data-id="${id}">Borrar</button>
                    `,
          },
        ],
        responsive: true,
        language: {
          url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
        },
        drawCallback: () => aplicarPermisosUI(data.currentUserRole), // Aplicar permisos DENTRO de la tabla
      });

      // Rellenar <select> de asignar tarea
      const assigneeSelect = document.getElementById("taskAssignee");
      assigneeSelect.innerHTML = '<option value="">Sin asignar</option>';
      data.collaborators.forEach((user) => {
        assigneeSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
      });

      // Aplicar Permisos (Nivel 3)
      aplicarPermisosUI(data.currentUserRole);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      alert("No se pudo cargar el proyecto.");
    }
  }

  function aplicarPermisosUI(role) {
    // Ocultar todos los botones de permisos
    document
      .querySelectorAll(".permission-owner, .permission-owner-editor")
      .forEach((el) => (el.style.display = "none"));

    // Mostrar según rol
    if (role === "owner") {
      document
        .querySelectorAll(".permission-owner, .permission-owner-editor")
        .forEach((el) => (el.style.display = "inline-block"));
    } else if (role === "editor") {
      document
        .querySelectorAll(".permission-owner-editor")
        .forEach((el) => (el.style.display = "inline-block"));
    }
    // 'viewer' no ve nada
  }

  // --- Lógica de Tareas ---
  document.getElementById("saveTaskButton").onclick = async () => {
    const taskId = document.getElementById("taskId").value;
    const data = {
      title: document.getElementById("taskTitle").value,
      status: document.getElementById("taskStatus").value,
      assigned_to_user_id:
        document.getElementById("taskAssignee").value || null,
    };

    try {
      if (taskId) {
        // Actualizar
        await api.updateTask(taskId, data);
      } else {
        // Crear
        await api.createTask(
          projectId,
          data.title,
          data.status,
          data.assigned_to_user_id
        );
      }
      cargarDetalleProyecto(); // Recargar todo
      $("#taskModal").modal("hide");
    } catch (error) {
      document.getElementById("taskError").textContent =
        error.message || "Error al guardar";
      document.getElementById("taskError").style.display = "block";
    }
  };

  // Event delegation para botones de tabla
  $("#tasksTable tbody").on("click", ".btn-edit-task", function () {
    const taskId = $(this).data("id");
    const task = currentProject.tasks.find((t) => t.id == taskId);
    if (task) {
      document.getElementById("taskId").value = task.id;
      document.getElementById("taskModalTitle").textContent = "Editar Tarea";
      document.getElementById("taskTitle").value = task.title;
      document.getElementById("taskStatus").value = task.status;
      document.getElementById("taskAssignee").value = task.assigned_to_user_id;
      $("#taskModal").modal("show");
    }
  });

  $("#tasksTable tbody").on("click", ".btn-delete-task", async function () {
    const taskId = $(this).data("id");
    if (confirm("¿Seguro que quieres borrar esta tarea?")) {
      try {
        await api.deleteTask(taskId);
        cargarDetalleProyecto(); // Recargar
      } catch (error) {
        alert("Error al borrar la tarea");
      }
    }
  });

  // Limpiar modal al crear
  $("#createTaskButton").on("click", () => {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("taskModalTitle").textContent = "Nueva Tarea";
  });

  // --- Lógica de Colaboradores ---
  document.getElementById("sendInviteButton").onclick = async () => {
    const email = document.getElementById("inviteEmail").value;
    const role = document.getElementById("inviteRole").value;
    const errorEl = document.getElementById("inviteError");

    try {
      await api.inviteUserToProject(projectId, email, role);
      cargarDetalleProyecto(); // Recargar
      $("#inviteModal").modal("hide");
    } catch (error) {
      errorEl.textContent = error.message || "Error al invitar";
      errorEl.style.display = "block";
    }
  };

  // --- Lógica de Borrar Proyecto ---
  document.getElementById("deleteProjectButton").onclick = async () => {
    if (
      confirm(
        "¿ESTÁS SEGURO?\nEsta acción es permanente y borrará el proyecto, tareas y colaboradores."
      )
    ) {
      try {
        await api.deleteProject(projectId);
        window.location.href = "projects.html";
      } catch (error) {
        alert("Error al borrar el proyecto.");
      }
    }
  };

  cargarDetalleProyecto();
}

// ----------- PROFILE PAGE (profile.html) -----------
if (document.getElementById("profileForm")) {
  async function cargarPerfil() {
    try {
      const user = await api.getMiPerfil();
      document.getElementById("profileName").textContent = user.name;
      document.getElementById("profileEmail").textContent = user.email;
      document.getElementById("profileAvatar").src =
        user.avatar_url || `https://placehold.co/128x128?text=${user.name[0]}`;

      // Rellenar formulario
      document.getElementById("inputName").value = user.name;
      document.getElementById("inputAvatar").value = user.avatar_url || "";
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  }

  document
    .getElementById("profileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("inputName").value;
      const avatar_url = document.getElementById("inputAvatar").value;
      const errorEl = document.getElementById("profileError");

      try {
        await api.updateMiPerfil(name, avatar_url);
        cargarPerfil(); // Recargar

        // Actualizar el header también (sin recargar la página)
        document.getElementById("userNameSmall").textContent = name;
        document.getElementById("userNameLarge").textContent = `${name} - ...`; // Email no lo tenemos aquí
        const avatar =
          avatar_url ||
          `https://placehold.co/160x160/007bff/ffffff?text=${name[0]}`;
        document.getElementById("userAvatarSmall").src = avatar;
        document.getElementById("userAvatarLarge").src = avatar;
      } catch (error) {
        errorEl.textContent = error.message || "Error al guardar";
        errorEl.style.display = "block";
      }
    });

  cargarPerfil();
}
