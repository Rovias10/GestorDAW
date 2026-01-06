import * as api from "./api-service.js";

const toggleBtn = document.getElementById("darkModeToggle");
const toggleIcon = toggleBtn ? toggleBtn.querySelector("i") : null;

function updateDarkModeIcon(isDark) {
  if (!toggleIcon) return;
  if (isDark) {
    toggleIcon.classList.remove("fa-moon"); 
    toggleIcon.classList.add("fa-sun");
  } else {
    toggleIcon.classList.remove("fa-sun"); 
    toggleIcon.classList.add("fa-moon"); 
  }
}

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  updateDarkModeIcon(true); 
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    updateDarkModeIcon(isDark);

    if (isDark) {
      localStorage.setItem("darkMode", "enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
    }
  });
}

const PAGE_ID = document.body.id;

if (document.querySelector(".wrapper")) {
  const tokenData = api.decodificarToken();
  if (tokenData) {
    document.getElementById("userNameSmall").textContent = tokenData.name;
    document.getElementById(
      "userNameLarge"
    ).textContent = `${tokenData.name} - ${tokenData.email}`;

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

  document.getElementById("logoutBtn").onclick = () => {
    api.borrarToken();
    window.location.href = "../auth/login.html";
  };
}

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

if (document.getElementById("registerForm")) {
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const errorEl = document.getElementById("registerError");
      const successEl = document.getElementById("registerSuccess");
      const formEl = document.getElementById("registerForm");

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      errorEl.style.display = "none";
      successEl.style.display = "none";

      try {
        const res = await api.register(name, email, password);

        if (res.message) {
          formEl.style.display = "none";

          successEl.style.display = "block";
          successEl.innerHTML = `
            <h4><i class="icon fas fa-check"></i> ¡Registro completado!</h4>
            <p>${res.message}</p>
            <hr>
            <p class="mb-0">Por favor, revisa tu bandeja de entrada (y spam) para activar tu cuenta antes de iniciar sesión.</p>
            <br>
            <a href="login.html" class="btn btn-outline-light text-dark" style="background: white;">Ir al Login</a>
          `;
        }
      } catch (error) {
        errorEl.textContent = error.message || "Datos inválidos";
        errorEl.style.display = "block";
      }
    });
}

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
      document.getElementById("statTasksInProgress").textContent =
        stats.inProgressTasks || 0;
      const donutChartCanvas = document
        .getElementById("donutChart")
        .getContext("2d");

      new Chart(donutChartCanvas, {
        type: "doughnut",
        data: {
          labels: ["Pendientes", "En Progreso", "Completadas"],
          datasets: [
            {
              data: [
                stats.tasksPending || 0,
                stats.inProgressTasks || 0,
                stats.tasksCompleted || 0,
              ],

              backgroundColor: ["#FFB547", "#4318FF", "#05CD99"],
              borderWidth: 0, 
              hoverOffset: 4,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
        },
      });
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
  }
  cargarDashboardStats();
}

if (document.getElementById("projectsGrid")) {
  const grid = document.getElementById("projectsGrid");

  async function cargarProyectos() {
    try {
      const projects = await api.getProjects();
      grid.innerHTML = "";
      if (projects.length === 0) {
        grid.innerHTML =
          '<div class="col-12"><p>No tienes proyectos. ¡Crea uno!</p></div>';
        return;
      }
      projects.forEach((proj) => {
        const card = document.createElement("div");
        const total = proj.total_tasks || 0;
        const completed = proj.completed_tasks || 0;

        let barColor = "bg-primary";
        if (percent === 100) barColor = "bg-success";
        else if (percent < 50 && total > 0) barColor = "bg-warning";

        card.innerHTML = `
            <div class="card card-primary card-outline project-card h-100" data-project-id="${
              proj.id
            }" style="cursor: pointer;">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title font-weight-bold m-0" style="font-size: 1.1rem;">${
                          proj.name
                        }</h5>
                        <span class="badge badge-light border" style="font-size: 0.75rem;">${
                          proj.role
                        }</span>
                    </div>
                    
                    <p class="card-text text-muted flex-grow-1" style="font-size: 0.9rem;">
                        ${proj.description.substring(0, 80)}${
          proj.description.length > 80 ? "..." : ""
        }
                    </p>
                    
                    <div class="mt-3">
                        <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 0.8rem;">
                            <span class="font-weight-bold text-dark">${percent}%</span>
                            <span>${completed}/${total} tareas</span>
                        </div>
                        <div class="progress" style="height: 6px; border-radius: 10px; background-color: #e9ecef;">
                            <div class="progress-bar ${barColor}" role="progressbar" 
                                 style="width: ${percent}%; border-radius: 10px;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        card.querySelector(".project-card").onclick = () => {
          window.location.href = `project-detail.html?id=${proj.id}`;
        };
        grid.appendChild(card);
      });
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  }

  document.getElementById("saveProjectButton").onclick = async () => {
    const name = document.getElementById("projectName").value;
    const description = document.getElementById("projectDescription").value;
    const errorEl = document.getElementById("projectError");

    try {
      await api.createProject(name, description);
      cargarProyectos();
      $("#projectModal").modal("hide");
      document.getElementById("projectForm").reset();
    } catch (error) {
      errorEl.textContent = error.message || "Error al guardar";
      errorEl.style.display = "block";
    }
  };

  cargarProyectos();
}

if (document.getElementById("projectDetailName")) {
  let currentProject = null;
  let tasksTable = null;
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    window.location.href = "projects.html";
  }

  async function cargarDetalleProyecto() {
    try {
      const data = await api.getProjectDetails(projectId);
      currentProject = data;
      document.getElementById("projectDetailName").textContent =
        data.project.name;

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

      if (tasksTable) tasksTable.destroy();

      tasksTable = $("#tasksTable").DataTable({
        data: data.tasks,
        dom:
          "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
          "<'row'<'col-sm-12'tr>>" +
          "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
          {
            extend: "excelHtml5",
            text: '<i class="fas fa-file-excel"></i> Excel',
            className: "btn btn-success btn-sm",
            exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
          },
          {
            extend: "pdfHtml5",
            text: '<i class="fas fa-file-pdf"></i> PDF',
            className: "btn btn-danger btn-sm",
            exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
          },
          {
            extend: "print",
            text: '<i class="fas fa-print"></i> Imprimir',
            className: "btn btn-info btn-sm",
            exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
          },
          {
            extend: "copy",
            text: '<i class="fas fa-copy"></i> Copiar',
            className: "btn btn-secondary btn-sm",
          },
        ],
      
        columns: [
          { data: "id" },
          { data: "title" },
          {
            data: "priority",
            render: function (data) {
              if (data === "critical")
                return '<span class="badge badge-danger">Crítica</span>';
              if (data === "high")
                return '<span class="badge badge-warning">Alta</span>';
              if (data === "medium")
                return '<span class="badge badge-info">Media</span>';
              return '<span class="badge badge-secondary">Baja</span>';
            },
          },
          {
            data: null,
            render: function (row) {
              const total = row.total_seconds || 0;
              const h = Math.floor(total / 3600)
                .toString()
                .padStart(2, "0");
              const m = Math.floor((total % 3600) / 60)
                .toString()
                .padStart(2, "0");
              const btnClass = row.is_tracking ? "btn-warning" : "btn-success";
              const icon = row.is_tracking ? "fa-pause" : "fa-play";

              return `
                    <div class="btn-group">
                        <button type="button" class="btn btn-default btn-xs disabled"><b>${h}:${m}</b></button>
                        <button type="button" class="btn btn-xs ${btnClass} btn-timer" data-id="${row.id}">
                            <i class="fas ${icon}"></i>
                        </button>
                    </div>
                 `;
            },
          },
          { data: "assignee_name", defaultContent: "<i>Sin asignar</i>" },
          {
            data: "status",
            render: function (data) {
              if (data === "completed")
                return '<span class="text-success">Completada</span>';
              if (data === "in_progress")
                return '<span class="text-primary">En Progreso</span>';
              return "Pendiente";
            },
          },
          {
            data: "id",
            render: (id) => `
                <button class="btn btn-xs btn-info btn-edit-task permission-owner-editor" data-id="${id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-xs btn-danger btn-delete-task permission-owner-editor" data-id="${id}"><i class="fas fa-trash"></i></button>
            `,
          },
        ],
        responsive: true,
        order: [[0, "desc"]],
        language: {
          url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
        },
        drawCallback: () => aplicarPermisosUI(data.currentUserRole),
      });

      const assigneeSelect = document.getElementById("taskAssignee");
      assigneeSelect.innerHTML = '<option value="">Sin asignar</option>';
      data.collaborators.forEach((user) => {
        assigneeSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
      });

      aplicarPermisosUI(data.currentUserRole);

      const btnChat = document.getElementById("btnOpenChat");
      if (btnChat) {
        btnChat.href = `chat.html?projectId=${project.id}`;
      }
    } catch (error) {
      console.error("Error cargando detalle:", error);
      Swal.fire({
        icon: "error",
        title: "Ups...",
        text: "No se pudo cargar el proyecto. Tal vez fue borrado o no tienes permisos.",
        footer: '<a href="projects.html">Volver a la lista</a>',
      });
    }

    let calendar = null;

    $('a[data-toggle="pill"]').on("shown.bs.tab", function (e) {
      if (e.target.getAttribute("href") === "#calendarView") {
        renderCalendar();
      }
    });

    function renderCalendar() {
      const calendarEl = document.getElementById("calendar");

      if (calendar) {
        calendar.render();
        return;
      }

      const events = currentProject.tasks
        .map((task) => {
          if (!task.due_date) return null;

          let color = "#3b82f6";
          if (task.priority === "high") color = "#f59e0b";
          if (task.priority === "critical") color = "#ef4444";
          if (task.status === "completed") color = "#10b981";

          return {
            title: task.title,
            start: task.due_date,
            color: color,
            extendedProps: { description: task.description },
          };
        })
        .filter((e) => e !== null);

      calendar = new FullCalendar.Calendar(calendarEl, {
        locale: "es",
        initialView: "dayGridMonth",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listMonth",
        },
        events: events,
        height: 650,
        eventClick: function (info) {
          Swal.fire({
            title: info.event.title,
            text: info.event.extendedProps.description || "Sin descripción",
            icon: "info",
          });
        },
      });
      calendar.render();
    }
  }

  function aplicarPermisosUI(role) {
    document
      .querySelectorAll(".permission-owner, .permission-owner-editor")
      .forEach((el) => (el.style.display = "none"));

    if (role === "owner") {
      document
        .querySelectorAll(".permission-owner, .permission-owner-editor")
        .forEach((el) => (el.style.display = "inline-block"));
    } else if (role === "editor") {
      document
        .querySelectorAll(".permission-owner-editor")
        .forEach((el) => (el.style.display = "inline-block"));
    }
  }

  document.getElementById("saveTaskButton").onclick = async () => {
    const taskId = document.getElementById("taskId").value;

    const data = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDescription").value,
      priority: document.getElementById("taskPriority").value,
      due_date: document.getElementById("taskDueDate").value,
      status: document.getElementById("taskStatus").value,
      assigned_to_user_id:
        document.getElementById("taskAssignee").value || null,
    };

    try {
      if (taskId) {
        await api.updateTask(taskId, data);
      } else {
        await api.createTaskExtended(projectId, data);
      }
      cargarDetalleProyecto();
      $("#taskModal").modal("hide");
    } catch (error) {
      document.getElementById("taskError").textContent =
        error.message || "Error al guardar";
      document.getElementById("taskError").style.display = "block";
    }
  };

  $("#tasksTable tbody").on("click", ".btn-edit-task", function () {
    const taskId = $(this).data("id");
    const task = currentProject.tasks.find((t) => t.id == taskId);

    if (task) {
      document.getElementById("taskId").value = task.id;
      document.getElementById("taskModalTitle").textContent = "Editar Tarea";

      document.getElementById("taskTitle").value = task.title;
      document.getElementById("taskDescription").value = task.description || "";
      document.getElementById("taskPriority").value = task.priority || "medium";
      if (task.due_date) {
        const dateStr = new Date(task.due_date).toISOString().split("T")[0];
        document.getElementById("taskDueDate").value = dateStr;
      } else {
        document.getElementById("taskDueDate").value = "";
      }
      document.getElementById("taskStatus").value = task.status;

      document.getElementById("taskAssignee").value = task.user_id;

      $("#taskModal").modal("show");
    }
  });

  $("#tasksTable tbody").on("click", ".btn-delete-task", async function () {
    const taskId = $(this).data("id");

    const result = await Swal.fire({
      title: "¿Borrar tarea?",
      text: "No podrás deshacer esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await api.deleteTask(taskId);

        Swal.fire({
          title: "Eliminada",
          text: "La tarea ha sido borrada.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        cargarDetalleProyecto();
      } catch (error) {
        Swal.fire("Error", "No se pudo borrar la tarea.", "error");
      }
    }
  });

  $("#tasksTable tbody").on("click", ".btn-timer", async function () {
    const taskId = $(this).data("id");
    try {
      const token = localStorage.getItem("jwt");

      await fetch(`http://localhost:3000/api/tasks/${taskId}/timer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      cargarDetalleProyecto();
      cargarActividad();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo actualizar el tiempo", "error");
    }
  });

  $("#createTaskButton").on("click", () => {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("taskModalTitle").textContent = "Nueva Tarea";
  });

  document.getElementById("sendInviteButton").onclick = async () => {
    const email = document.getElementById("inviteEmail").value;
    const role = document.getElementById("inviteRole").value;
    const errorEl = document.getElementById("inviteError");

    try {
      await api.inviteUserToProject(projectId, email, role);
      cargarDetalleProyecto();
      $("#inviteModal").modal("hide");
    } catch (error) {
      errorEl.textContent = error.message || "Error al invitar";
      errorEl.style.display = "block";
    }
  };

  document.getElementById("deleteProjectButton").onclick = async () => {
    const result = await Swal.fire({
      title: "¿ESTÁS SEGURO?",
      text: "Esta acción es permanente. Se borrará el proyecto, todas sus tareas y el chat.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "¡Sí, destruir proyecto!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await api.deleteProject(projectId);

        await Swal.fire(
          "¡Eliminado!",
          "El proyecto ha sido borrado correctamente.",
          "success"
        );

        window.location.href = "projects.html";
      } catch (error) {
        Swal.fire("Error", "No se pudo borrar el proyecto.", "error");
      }
    }
  };

  const socket = io("http://localhost:3000");
  const chatContainer = document.getElementById("chatContainer");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  socket.emit("join_project", projectId);

  function appendMessage(msgData, isMe) {
    const time = new Date(msgData.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const name = msgData.name || msgData.userName || "Usuario";
    const text = msgData.message;

    const alignClass = isMe ? "right" : "left";
    const nameFloat = isMe ? "float-right" : "float-left";
    const timeFloat = isMe ? "float-left" : "float-right";

    const html = `
        <div class="direct-chat-msg ${alignClass}">
            <div class="direct-chat-infos clearfix">
                <span class="direct-chat-name ${nameFloat}">${name}</span>
                <span class="direct-chat-timestamp ${timeFloat}">${time}</span>
            </div>
            <img class="direct-chat-img" src="https://placehold.co/128x128?text=${name.charAt(
              0
            )}" alt="User">
            <div class="direct-chat-text">
                ${text}
            </div>
        </div>
    `;

    chatContainer.insertAdjacentHTML("beforeend", html);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function cargarChatHistory() {
    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(
        `http://localhost:3000/api/projects/${projectId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const messages = await res.json();

      chatContainer.innerHTML = "";
      const myData = api.decodificarToken();

      messages.forEach((msg) => {
        const isMe = msg.user_id === myData.id;
        appendMessage(msg, isMe);
      });
    } catch (error) {
      console.error("Error cargando chat:", error);
    }
  }
  cargarChatHistory();

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value;
    if (!text.trim()) return;

    const myData = api.decodificarToken();

    socket.emit("send_message", {
      projectId: projectId,
      userId: myData.id,
      userName: myData.name,
      message: text,
    });

    chatInput.value = "";
  });

  socket.on("receive_message", (data) => {
    const myData = api.decodificarToken();
    const isMe = data.userId === myData.id;

    appendMessage(data, isMe);
  });
  async function cargarActividad() {
    const list = document.getElementById("activityList");
    if (!list) return;

    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(
        `http://localhost:3000/api/projects/${projectId}/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const acts = await res.json();

      if (acts.length === 0) {
        list.innerHTML =
          '<p class="text-center text-muted p-3">No hay actividad reciente.</p>';
        return;
      }

      let html = "";
      acts.forEach((act) => {
        const date = new Date(act.created_at).toLocaleString();
        let icon = "fas fa-info bg-gray";
        if (act.action_type === "CREATE_TASK") icon = "fas fa-plus bg-blue";
        if (act.action_type === "DELETE_TASK") icon = "fas fa-trash bg-red";
        if (act.action_type === "START_TIMER") icon = "fas fa-play bg-green";
        if (act.action_type === "STOP_TIMER") icon = "fas fa-pause bg-yellow";

        html += `
             <div>
                <i class="${icon}"></i>
                <div class="timeline-item">
                    <span class="time"><i class="fas fa-clock"></i> ${date}</span>
                    <h3 class="timeline-header no-border">
                        <span class="text-primary font-weight-bold">${act.user_name}</span> 
                        ${act.details}
                    </h3>
                </div>
             </div>`;
      });
      html += '<div><i class="far fa-clock bg-gray"></i></div>';
      list.innerHTML = html;
    } catch (e) {
      console.error("Error historial", e);
    }
  }

  cargarDetalleProyecto();

  const nameEl = document.getElementById("userNameSmall");
  const myName = nameEl ? nameEl.textContent.trim() : "";

  $(".filter-btn").on("click", function () {
    $(".filter-btn").each(function () {
      const fType = $(this).data("filter");
      const classMap = {
        all: "btn-outline-secondary",
        mine: "btn-outline-primary",
        urgent: "btn-outline-warning",
        completed: "btn-outline-success",
        pending: "btn-outline-danger",
      };
      const baseClass = classMap[fType] || "btn-outline-secondary";

      $(this).removeClass("active btn-secondary").addClass(baseClass);
    });
    const myFilter = $(this).data("filter");
    const myClassMap = {
      all: "btn-outline-secondary",
      mine: "btn-outline-primary",
      urgent: "btn-outline-warning",
      completed: "btn-outline-success",
      pending: "btn-outline-danger",
    };
    const myBaseClass = myClassMap[myFilter] || "btn-outline-secondary";

    $(this).removeClass(myBaseClass).addClass("active btn-secondary");

    const filter = $(this).data("filter");

    if (tasksTable) {
      tasksTable.search("").columns().search("").draw();

      if (filter === "mine") {
        tasksTable.column(4).search(myName).draw();
      } else if (filter === "urgent") {
        tasksTable.column(2).search("Alta|Crítica", true, false).draw();
      } else if (filter === "completed") {
        tasksTable.column(5).search("Completada").draw();
      } else if (filter === "pending") {
        tasksTable.column(5).search("Pendiente|Progreso", true, false).draw();
      }
    }
  });

  const viewBtn = document.getElementById("viewToggleBtn");
  const tableView = document.querySelector(".card-outline-tabs");
  const kanbanView = document.getElementById("kanbanView");

  if (viewBtn) {
    viewBtn.onclick = () => {
      if (kanbanView.style.display === "none") {
        kanbanView.style.display = "flex";
        tableView.style.display = "none";
        viewBtn.innerHTML = '<i class="fas fa-list"></i> Vista Lista';
        renderKanban();
      } else {
        kanbanView.style.display = "none";
        tableView.style.display = "block";
        viewBtn.innerHTML = '<i class="fas fa-columns"></i> Vista Tablero';
      }
    };
  }

  function renderKanban() {
    ["pending", "in_progress", "completed"].forEach((s) => {
      document.getElementById(`kanban-${s}`).innerHTML = "";
    });

    currentProject.tasks.forEach((task) => {
      const colId = `kanban-${task.status}`;
      const col = document.getElementById(colId);
      if (col) {
        const card = document.createElement("div");
        card.className = "card card-light card-outline collapsed-card mb-2";
        card.setAttribute("data-id", task.id);
        card.style.cursor = "move";

        let borderClass = "card-primary";
        if (task.priority === "high") borderClass = "card-warning";
        if (task.priority === "critical") borderClass = "card-danger";
        card.classList.add(borderClass);

        card.innerHTML = `
                <div class="card-header">
                  <h5 class="card-title text-sm">#${task.id} ${task.title}</h5>
                  <div class="card-tools">
                    <span class="badge badge-light">${
                      task.assignee_name || "?"
                    }</span>
                  </div>
                </div>
                <div class="card-body p-2 text-muted text-xs">
                    ${task.description || "Sin descripción"}
                </div>
              `;
        col.appendChild(card);
      }
    });
  }

  ["pending", "in_progress", "completed"].forEach((status) => {
    const el = document.getElementById(`kanban-${status}`);
    new Sortable(el, {
      group: "kanban",
      animation: 150,
      onEnd: async function (evt) {
        const itemEl = evt.item;
        const newStatus = evt.to.getAttribute("data-status");
        const oldStatus = evt.from.getAttribute("data-status");
        const taskId = itemEl.getAttribute("data-id");

        if (newStatus !== oldStatus) {
          try {
            const token = localStorage.getItem("jwt");

            const task = currentProject.tasks.find((t) => t.id == taskId);

            await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_date: task.due_date,
                status: newStatus,
                assigned_to_user_id: task.user_id,
              }),
            });

            task.status = newStatus;
            cargarActividad();

            const Toast = Swal.mixin({
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 3000,
            });
            Toast.fire({ icon: "success", title: "Estado actualizado" });
          } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo mover la tarea", "error");
          }
        }
      },
    });
  });
  cargarActividad();
}

if (document.getElementById("profileForm")) {
  async function cargarPerfil() {
    try {
      const user = await api.getMiPerfil();
      document.getElementById("profileName").textContent = user.name;
      document.getElementById("profileEmail").textContent = user.email;

      const avatarSrc =
        user.avatar_url ||
        `https://placehold.co/128x128?text=${user.name.charAt(0)}`;
      document.getElementById("profileAvatar").src = avatarSrc;

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
      const successEl = document.getElementById("profileSuccess");

      errorEl.style.display = "none";

      try {
        await api.updateMiPerfil(name, avatar_url);
        await cargarPerfil();

        const tokenData = api.decodificarToken();
        document.getElementById("userNameSmall").textContent = name;
        if (avatar_url) {
          document.getElementById("userAvatarSmall").src = avatar_url;
          document.getElementById("userAvatarLarge").src = avatar_url;
        }


        Swal.fire({
          title: "¡Perfil Actualizado!",
          text: "Se ha enviado un correo de confirmación a tu email.",
          icon: "success",
          confirmButtonText: "Genial",
        });
      } catch (error) {
        console.error(error);
        errorEl.textContent = error.message || "Error al actualizar el perfil";
        errorEl.style.display = "block";
      }
    });

  cargarPerfil();
}
