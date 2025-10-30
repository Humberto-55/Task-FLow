// ===================================
// 1. OBTENCIÓN DE ELEMENTOS Y EVENTOS
// ===================================
const addTaskBtn = document.getElementById('addTaskBtn');
const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const prioritySelect = document.getElementById('prioritySelect');
const contrastToggle = document.getElementById('contrast-toggle');
const daltonismToggle = document.getElementById('daltonism-toggle');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Contenedores de lista
const favoriteTasksList = document.getElementById('favorite-tasks-list'); 
const highPriorityList = document.getElementById('high-priority-list');
const mediumPriorityList = document.getElementById('medium-priority-list');
const lowPriorityList = document.getElementById('low-priority-list');
const completedTasksList = document.getElementById('completed-tasks-list');
const failedTasksList = document.getElementById('failed-tasks-list');

// Modal de Bienvenida y Ayuda
const welcomeModal = document.getElementById('welcome-modal');
const closeWelcomeBtn = document.getElementById('close-welcome-btn');
const linkDudas = document.getElementById('link-dudas');
const linkTecnico = document.getElementById('link-tecnico');

// Modal de recuperación
const recoveryModal = document.getElementById('recovery-modal');
const failureReasonInput = document.getElementById('failure-reason');
const confirmReasonBtn = document.getElementById('confirm-reason-btn');
const reassignTaskBtn = document.getElementById('reassign-task-btn');
let currentFailedTaskElement = null;

document.addEventListener('DOMContentLoaded', () => {
    setupFormLinks();
    loadTasks();
    showWelcomeModal();
    setInterval(checkTaskDeadlines, 60000);
});

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

contrastToggle.addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
  localStorage.setItem('highContrastMode', document.body.classList.contains('high-contrast'));
});

daltonismToggle.addEventListener('click', () => {
  document.body.classList.toggle('daltonism-mode');
  localStorage.setItem('daltonismMode', document.body.classList.contains('daltonism-mode'));
});

// ===============================
// 2. MODALES DE AYUDA Y BIENVENIDA
// ===============================
function setupFormLinks() {
    const URL_DUDAS = "https://forms.gle/VWrE8LM4ZcWuhyjE7";
    const URL_TECNICO = "https://forms.gle/p99c2zg594rTzick6";
    if (linkDudas) linkDudas.href = URL_DUDAS;
    if (linkTecnico) linkTecnico.href = URL_TECNICO;
}

helpBtn.addEventListener('click', () => {
  helpModal.classList.add('visible');
  helpModal.removeAttribute('hidden');
  closeModalBtn.focus();
});
closeModalBtn.addEventListener('click', () => {
  helpModal.classList.remove('visible');
  helpModal.setAttribute('hidden', '');
  helpBtn.focus();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && helpModal.classList.contains('visible')) {
    helpModal.classList.remove('visible');
    helpModal.setAttribute('hidden', '');
    helpBtn.focus();
  }
});

function showWelcomeModal() {
    // Mostrar SIEMPRE el mensaje de bienvenida
    welcomeModal.classList.add('visible');
    welcomeModal.removeAttribute('hidden');

    closeWelcomeBtn.addEventListener('click', () => {
        welcomeModal.classList.remove('visible');
        welcomeModal.setAttribute('hidden', '');
        taskInput.focus();
    });
}


// ===============================
// 3. RECUPERACIÓN DE TAREAS FALLIDAS
// ===============================
function handleFailedTaskClick(li) {
  if (!li.classList.contains('failed')) return;
  currentFailedTaskElement = li;
  recoveryModal.classList.add('visible');
  recoveryModal.removeAttribute('hidden');
  failureReasonInput.value = '';
}

reassignTaskBtn.addEventListener('click', () => {
  if (!currentFailedTaskElement) return;
  const taskTextSpan = currentFailedTaskElement.querySelector('span');
  const newText = prompt('Reasigna la tarea - Nuevo texto:', taskTextSpan.textContent);
  const newDate = prompt('Reasigna la tarea - Nueva fecha (YYYY-MM-DD):', currentFailedTaskElement.dataset.date);
  const newTime = prompt('Reasigna la tarea - Nueva hora (HH:MM):', currentFailedTaskElement.dataset.time);
  if (newText !== null && newText.trim() !== '') {
      taskTextSpan.textContent = newText.trim();
      currentFailedTaskElement.dataset.date = newDate || '';
      currentFailedTaskElement.dataset.time = newTime || '';
      const dateDisplay = currentFailedTaskElement.querySelector('.date-display');
      let nuevoVencimientoTexto = 'Sin fecha';
      if (newDate) {
          nuevoVencimientoTexto = ` Vence: ${new Date(newDate).toLocaleDateString()}`;
          if (newTime) nuevoVencimientoTexto += `<br>Hora: ${newTime}`;
      }
      dateDisplay.innerHTML = nuevoVencimientoTexto;
      currentFailedTaskElement.classList.remove('failed');
      currentFailedTaskElement.querySelector('.status-btn').textContent = '⬜';
      getTargetList(currentFailedTaskElement).appendChild(currentFailedTaskElement);
      reorderList(getTargetList(currentFailedTaskElement));
      saveTasks();
  }
  recoveryModal.classList.remove('visible');
  recoveryModal.setAttribute('hidden', '');
  currentFailedTaskElement = null;
});

confirmReasonBtn.addEventListener('click', () => {
  if (!currentFailedTaskElement) return;
  const reason = failureReasonInput.value.trim();
  const taskName = currentFailedTaskElement.querySelector('span').textContent;
  alert(reason ? `Motivo '${reason}' registrado. Tarea archivada.` : 'Tarea archivada sin motivo.');
  currentFailedTaskElement.remove();
  saveTasks();
  recoveryModal.classList.remove('visible');
  recoveryModal.setAttribute('hidden', '');
  currentFailedTaskElement = null;
});

// ===============================
// 4. FUNCIONES DE TAREAS
// ===============================
function checkTaskDeadlines() {
  [favoriteTasksList, highPriorityList, mediumPriorityList, lowPriorityList].forEach(ul => {
      ul.querySelectorAll('li').forEach(li => {
          const date = li.dataset.date, time = li.dataset.time;
          if (date) {
              const deadline = new Date(`${date}T${time || '23:59:59'}`);
              if (deadline < new Date() && !li.classList.contains('completed') && !li.classList.contains('failed')) {
                  li.classList.remove('favorite');
                  li.classList.add('failed');
                  li.querySelector('.status-btn').textContent = '❌';
                  failedTasksList.appendChild(li);
                  reorderList(failedTasksList);
                  saveTasks();
              }
          }
      });
  });
}

function getTargetList(li) {
  if (li.classList.contains('completed')) return completedTasksList;
  if (li.classList.contains('failed')) return failedTasksList;
  if (li.classList.contains('favorite')) return favoriteTasksList;
  if (li.classList.contains('high')) return highPriorityList;
  if (li.classList.contains('medium')) return mediumPriorityList;
  return lowPriorityList;
}

function reorderList(ulElement) {
  const tasks = Array.from(ulElement.querySelectorAll('li'));
  tasks.sort((a, b) => b.classList.contains('favorite') - a.classList.contains('favorite'));
  tasks.forEach(task => ulElement.appendChild(task));
}

function addTask() {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;
  const date = dateInput.value, time = timeInput.value;
  if (!text || !priority) return alert('Por favor, escribe la tarea y elige una prioridad válida.');
  const li = createTaskElement(text, priority, false, false, false, date, time);
  getTargetList(li).appendChild(li);
  reorderList(getTargetList(li));
  [taskInput, dateInput, timeInput, prioritySelect].forEach(i => i.value = '');
  taskInput.focus();
  saveTasks();
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('.task-group li').forEach(li => {
      const text = li.querySelector('span').textContent;
      const priority = li.classList.contains('high') ? 'high' : li.classList.contains('medium') ? 'medium' : 'low';
      tasks.push({
          text,
          completed: li.classList.contains('completed'),
          failed: li.classList.contains('failed'),
          favorite: li.classList.contains('favorite'),
          priority,
          date: li.dataset.date || '',
          time: li.dataset.time || ''
      });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  if (localStorage.getItem('highContrastMode') === 'true') document.body.classList.add('high-contrast');
  if (localStorage.getItem('daltonismMode') === 'true') document.body.classList.add('daltonism-mode');
  const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  storedTasks.forEach(t => {
      const el = createTaskElement(t.text, t.priority, t.completed, t.favorite, t.failed, t.date, t.time);
      getTargetList(el).appendChild(el);
  });
  [favoriteTasksList, highPriorityList, mediumPriorityList, lowPriorityList, completedTasksList, failedTasksList].forEach(reorderList);
  checkTaskDeadlines();
}

// ===============================
// 5. CREACIÓN DE TAREAS (PRINCIPAL)
// ===============================
function createTaskElement(text, priority, completed, favorite = false, failed = false, date = '', time = '') {
  const li = document.createElement('li');
  li.classList.add(priority);
  if (completed) li.classList.add('completed');
  if (failed) li.classList.add('failed');
  if (favorite) li.classList.add('favorite');

  const taskContent = document.createElement('div');
  taskContent.classList.add('task-content-wrapper');

  const span = document.createElement('span');
  span.textContent = favorite ? `${text} — Prioridad ${priorityName(priority)}` : text;

  const dateDisplay = document.createElement('small');
  dateDisplay.classList.add('date-display');
  dateDisplay.innerHTML = date ? ` Vence: ${new Date(date).toLocaleDateString()}${time ? `<br>Hora: ${time}` : ''}` : 'Sin fecha';

  taskContent.appendChild(span);
  taskContent.appendChild(dateDisplay);

  const statusBtn = document.createElement('button');
  statusBtn.classList.add('status-btn');
  statusBtn.textContent = completed ? '✅' : failed ? '❌' : '⬜';

  const statusMenu = document.createElement('div');
  statusMenu.classList.add('status-menu');
  [['⬜', 'Marcar como pendiente'], ['✅', 'Marcar como completada'], ['❌', 'Marcar como no completada']].forEach(([icon, text]) => {
      const btn = document.createElement('button');
      btn.textContent = `${icon} ${text}`;
      btn.addEventListener('click', () => {
          li.classList.remove('completed', 'failed');
          if (icon === '✅') li.classList.add('completed');
          else if (icon === '❌') li.classList.add('failed');
          statusBtn.textContent = icon;
          getTargetList(li).appendChild(li);
          reorderList(getTargetList(li));
          saveTasks();
          statusMenu.style.display = 'none';
      });
      statusMenu.appendChild(btn);
  });

  statusBtn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.status-menu').forEach(m => m.style.display = 'none');
      statusMenu.style.display = 'block';
      const r = statusBtn.getBoundingClientRect();
      statusMenu.style.top = `${r.bottom + window.scrollY}px`;
      statusMenu.style.left = `${r.left}px`;
  });
  document.addEventListener('click', e => {
      if (!statusMenu.contains(e.target) && e.target !== statusBtn) statusMenu.style.display = 'none';
  });
  document.body.appendChild(statusMenu);

  if (failed) li.addEventListener('click', e => { if (!e.target.closest('.action-buttons')) handleFailedTaskClick(li); });

  const actionButtons = document.createElement('div');
  actionButtons.classList.add('action-buttons');

  const favoriteBtn = document.createElement('button');
  favoriteBtn.textContent = favorite ? '★' : '☆';
  favoriteBtn.classList.add('favorite-btn');
  favoriteBtn.addEventListener('click', () => {
      li.classList.toggle('favorite');
      favoriteBtn.textContent = li.classList.contains('favorite') ? '★' : '☆';
      span.textContent = li.classList.contains('favorite')
          ? `${text} — Prioridad ${priorityName(priority)}`
          : text;
      getTargetList(li).appendChild(li);
      reorderList(getTargetList(li));
      saveTasks();
  });

const editBtn = document.createElement('button');
editBtn.textContent = '✏️';
editBtn.classList.add('edit-btn');
editBtn.addEventListener('click', () => {
    const currentPriority = li.classList.contains('high')
        ? 'high'
        : li.classList.contains('medium')
        ? 'medium'
        : 'low';

    const newText = prompt('Editar texto de la tarea:', text);
    const newDate = prompt('Editar fecha (YYYY-MM-DD):', li.dataset.date || '');
    const newTime = prompt('Editar hora (HH:MM):', li.dataset.time || '');
    const newPriority = prompt('Editar prioridad (low, medium, high):', currentPriority);

    if (newText !== null && newText.trim() !== '') text = newText.trim();
    li.dataset.date = newDate || '';
    li.dataset.time = newTime || '';
    if (newPriority && ['low', 'medium', 'high'].includes(newPriority)) {
        li.classList.remove('low', 'medium', 'high');
        li.classList.add(newPriority);
        priority = newPriority;
    }

    dateDisplay.innerHTML = newDate
        ? ` Vence: ${new Date(newDate).toLocaleDateString()}${newTime ? `<br>Hora: ${newTime}` : ''}`
        : 'Sin fecha';
    span.textContent = li.classList.contains('favorite')
        ? `${text} — Prioridad ${priorityName(priority)}`
        : text;

    // 🔹 NUEVA LÓGICA: Si está en completadas/fallidas o en favoritos, preguntar qué hacer
    if (li.classList.contains('completed') || li.classList.contains('failed')) {
        if (confirm('¿Deseas marcar esta tarea como pendiente nuevamente?')) {
            li.classList.remove('completed', 'failed');
            statusBtn.textContent = '⬜';
            getTargetList(li).appendChild(li);
        }
    } else if (li.classList.contains('favorite')) {
        if (confirm('¿Deseas mover esta tarea a su prioridad correspondiente?')) {
            li.classList.remove('favorite'); // Sale de favoritos
            getTargetList(li).appendChild(li);
        } else {
            // Se queda en favoritos (solo se edita)
            favoriteTasksList.appendChild(li);
        }
    } else {
        getTargetList(li).appendChild(li);
    }

    reorderList(getTargetList(li));
    reorderList(favoriteTasksList);
    saveTasks();
});

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta tarea?')) {
          li.remove();
          saveTasks();
      }
  });

  actionButtons.append(favoriteBtn, editBtn, deleteBtn);
  li.append(statusBtn, taskContent, actionButtons);
  li.dataset.date = date;
  li.dataset.time = time;
  return li;
}

function priorityName(p) {
  return p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
}
