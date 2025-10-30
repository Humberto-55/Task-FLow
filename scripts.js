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

// Modal de Reflexión
const reflectionModal = document.getElementById('reflection-modal');
const reflectionText = document.getElementById('reflection-text');
const confirmReflectionBtn = document.getElementById('confirm-reflection-btn');
const closeReflectionBtn = document.getElementById('close-reflection-btn');
let currentCompletedTaskElement = null;

// Contador de Tareas
const pendingCountEl = document.getElementById('pending-count');
const completedCountEl = document.getElementById('completed-count');
const failedCountEl = document.getElementById('failed-count');

// Sección de Reflexiones
const completedReflectionsList = document.getElementById('completed-reflections-list');
const failedReflectionsList = document.getElementById('failed-reflections-list');


document.addEventListener('DOMContentLoaded', () => {
    setupFormLinks();
    loadTasks();
    loadReflections();
    showWelcomeModal();
    setupReflectionModalListeners();
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
    welcomeModal.classList.add('visible');
    welcomeModal.removeAttribute('hidden');
    closeWelcomeBtn.addEventListener('click', () => {
        welcomeModal.classList.remove('visible');
        welcomeModal.setAttribute('hidden', '');
        taskInput.focus();
    });
}

// ===============================
// 2.1 NOTIFICACIÓN TOAST
// ===============================
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 3000);
}


// ===============================
// 3. RECUPERACIÓN Y REFLEXIÓN
// ===============================

// --- Modal de Tareas Fallidas ---
function handleFailedTaskClick(li) {
  if (!li.classList.contains('failed')) return;
  currentFailedTaskElement = li;
  recoveryModal.classList.add('visible');
  recoveryModal.removeAttribute('hidden');
  failureReasonInput.value = '';
  failureReasonInput.focus();
}

reassignTaskBtn.addEventListener('click', () => {
  if (!currentFailedTaskElement) return;
  const taskTextSpan = currentFailedTaskElement.querySelector('span');
  const newText = prompt('Reasigna la tarea - Nuevo texto:', taskTextSpan.dataset.originalText);
  const newDate = prompt('Reasigna la tarea - Nueva fecha (YYYY-MM-DD):', currentFailedTaskElement.dataset.date);
  const newTime = prompt('Reasigna la tarea - Nueva hora (HH:MM):', currentFailedTaskElement.dataset.time);
  
  if (newText !== null && newText.trim() !== '') {
      taskTextSpan.textContent = newText.trim();
      taskTextSpan.dataset.originalText = newText.trim();
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
      // Mover el botón de plan/reflexión
      currentFailedTaskElement.querySelector('.plan-btn')?.remove();
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
  const taskText = currentFailedTaskElement.querySelector('span').dataset.originalText;

  if (reason) {
      saveReflection(taskText, reason, 'failed');
      alert(`Plan de acción '${reason}' registrado. Tarea archivada.`);
  } else {
      alert('Tarea archivada sin plan.');
  }
  
  currentFailedTaskElement.remove();
  saveTasks();
  recoveryModal.classList.remove('visible');
  recoveryModal.setAttribute('hidden', '');
  currentFailedTaskElement = null;
});

// --- Modal de Reflexión de Tarea Completada ---
function setupReflectionModalListeners() {
    confirmReflectionBtn.addEventListener('click', () => {
        const reflection = reflectionText.value.trim();
        if (reflection && currentCompletedTaskElement) {
            const taskText = currentCompletedTaskElement.querySelector('span').dataset.originalText;
            saveReflection(taskText, reflection, 'completed');
            alert(`Reflexión guardada: '${reflection}'`);
        }
        reflectionModal.classList.remove('visible');
        reflectionModal.setAttribute('hidden', '');
        currentCompletedTaskElement = null;
    });

    closeReflectionBtn.addEventListener('click', () => {
        reflectionModal.classList.remove('visible');
        reflectionModal.setAttribute('hidden', '');
        currentCompletedTaskElement = null;
    });
}

function handleCompletedTaskClick(li) {
  currentCompletedTaskElement = li;
  reflectionModal.classList.add('visible');
  reflectionModal.removeAttribute('hidden');
  reflectionText.value = '';
  reflectionText.focus();
}

// ===============================
// 4. FUNCIONES DE TAREAS Y REFLEXIONES
// ===============================

// --- Contador de Tareas ---
function updateTaskCount() {
    const pending = document.querySelectorAll('#favorite-tasks-list li, #high-priority-list li, #medium-priority-list li, #low-priority-list li').length;
    const completed = completedTasksList.getElementsByTagName('li').length;
    const failed = failedTasksList.getElementsByTagName('li').length;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
    failedCountEl.textContent = failed;
}

// --- Guardar Reflexión ---
function saveReflection(taskText, reflectionText, status) {
    const reflections = JSON.parse(localStorage.getItem('reflections') || '[]');
    const newReflection = {
        id: Date.now().toString(),
        taskText: taskText,
        text: reflectionText,
        status: status,
        timestamp: new Date().toISOString()
    };
    reflections.push(newReflection);
    localStorage.setItem('reflections', JSON.stringify(reflections));
    loadReflections();
}

// --- Cargar Reflexiones ---
function loadReflections() {
    const reflections = JSON.parse(localStorage.getItem('reflections') || '[]');
    completedReflectionsList.innerHTML = '';
    failedReflectionsList.innerHTML = '';

    reflections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 

    reflections.forEach(reflection => {
        const li = createReflectionElement(reflection);
        if (reflection.status === 'completed') {
            completedReflectionsList.appendChild(li);
        } else {
            failedReflectionsList.appendChild(li);
        }
    });
}

// --- Crear Elemento de Reflexión ---
function createReflectionElement(reflection) {
    const li = document.createElement('li');
    li.className = 'reflection-item';
    li.dataset.id = reflection.id;

    const text = document.createElement('p');
    text.className = 'reflection-text';
    text.textContent = reflection.text;

    const meta = document.createElement('div');
    meta.className = 'reflection-meta';

    const task = document.createElement('span');
    task.className = 'reflection-task';
    task.textContent = `Tarea: ${reflection.taskText}`;

    const date = document.createElement('span');
    date.className = 'reflection-date';
    date.textContent = new Date(reflection.timestamp).toLocaleDateString();

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-reflection-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.setAttribute('aria-label', 'Eliminar esta reflexión');
    deleteBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar esta reflexión? No se puede deshacer.')) {
            deleteReflection(reflection.id);
        }
    });
    
    meta.append(task, date, deleteBtn);
    li.append(text, meta);
    return li;
}

// --- Eliminar Reflexión ---
function deleteReflection(id) {
    let reflections = JSON.parse(localStorage.getItem('reflections') || '[]');
    reflections = reflections.filter(r => r.id !== id);
    localStorage.setItem('reflections', JSON.stringify(reflections));
    loadReflections();
}


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
                  
                  // (MODIFICADO) Añadir botón de plan de acción
                  const actionButtons = li.querySelector('.action-buttons');
                  const reflectionPlanBtn = actionButtons.querySelector('.reflection-btn, .plan-btn') || document.createElement('button');
                  
                  reflectionPlanBtn.textContent = '📝';
                  reflectionPlanBtn.className = 'plan-btn';
                  reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir plan de acción');
                  reflectionPlanBtn.setAttribute('aria-label', 'Añadir plan de acción');
                  reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleFailedTaskClick(li); };
                  if (!actionButtons.contains(reflectionPlanBtn)) {
                      actionButtons.appendChild(reflectionPlanBtn);
                  }
                  
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
      const textSpan = li.querySelector('span');
      let originalText = textSpan.dataset.originalText || textSpan.textContent.split(' — Prioridad ')[0];
      textSpan.dataset.originalText = originalText;

      tasks.push({
          text: originalText,
          completed: li.classList.contains('completed'),
          failed: li.classList.contains('failed'),
          favorite: li.classList.contains('favorite'),
          priority: li.classList.contains('high') ? 'high' : li.classList.contains('medium') ? 'medium' : 'low',
          date: li.dataset.date || '',
          time: li.dataset.time || ''
      });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateTaskCount();
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
  updateTaskCount();
}

// ===============================
// 5. CREACIÓN DE TAREAS (PRINCIPAL) - VERSIÓN ACTUALIZADA
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
  span.dataset.originalText = text; 
  span.textContent = favorite ? `${text} — Prioridad ${priorityName(priority)}` : text;

  const dateDisplay = document.createElement('small');
  dateDisplay.classList.add('date-display');
  dateDisplay.innerHTML = date ? ` Vence: ${new Date(date).toLocaleDateString()}${time ? `<br>Hora: ${time}` : ''}` : 'Sin fecha';

  taskContent.appendChild(span);
  taskContent.appendChild(dateDisplay);

  const statusBtn = document.createElement('button');
  statusBtn.classList.add('status-btn');
  statusBtn.textContent = completed ? '✅' : failed ? '❌' : '⬜';
  statusBtn.setAttribute('aria-label', 'Cambiar estado de la tarea');
  statusBtn.setAttribute('aria-haspopup', 'true');
  statusBtn.setAttribute('aria-expanded', 'false');

  const statusMenu = document.createElement('div');
  statusMenu.classList.add('status-menu');
  statusMenu.setAttribute('role', 'menu');

  const actionButtons = document.createElement('div');
  actionButtons.classList.add('action-buttons');
  
  // (MODIFICADO) Crear el botón de reflexión/plan en este scope
  const reflectionPlanBtn = document.createElement('button');
  reflectionPlanBtn.setAttribute('aria-live', 'polite');

  const statusOptions = [
      ['⬜', 'Marcar como pendiente', 'Marcar tarea como pendiente'],
      ['✅', 'Marcar como completada', 'Marcar tarea como completada'],
      ['❌', 'Marcar como no completada', 'Marcar tarea como no completada']
  ];

  statusOptions.forEach(([icon, text, ariaLabel]) => {
      const btn = document.createElement('button');
      btn.textContent = `${icon} ${text}`;
      btn.setAttribute('aria-label', ariaLabel);
      btn.setAttribute('role', 'menuitem');

      btn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          
          const wasCompleted = li.classList.contains('completed');
          const wasFailed = li.classList.contains('failed');
          
          li.classList.remove('completed', 'failed');
          
          if (icon === '✅') {
              li.classList.add('completed');
              if (!wasCompleted) {
                  const messages = ['¡Excelente!', '¡Un logro más!', '¡Sigue así!', '¡Tarea conquistada!'];
                  showToast(messages[Math.floor(Math.random() * messages.length)], 'success');
              }
              // (MODIFICADO) Configurar y añadir botón de Reflexión
              reflectionPlanBtn.textContent = '💬';
              reflectionPlanBtn.className = 'reflection-btn';
              reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir reflexión de éxito');
              reflectionPlanBtn.setAttribute('aria-label', 'Añadir reflexión de éxito');
              reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleCompletedTaskClick(li); };
              if (!actionButtons.contains(reflectionPlanBtn)) {
                  actionButtons.appendChild(reflectionPlanBtn);
              }

          } else if (icon === '❌') {
              li.classList.add('failed');
              if (!wasFailed) {
                  const messages = ['¡Ánimo!', 'No te preocupes, ¡tú puedes!', 'A la próxima lo lograrás'];
                  showToast(messages[Math.floor(Math.random() * messages.length)], 'failed');
              }
              // (MODIFICADO) Configurar y añadir botón de Plan de Acción
              reflectionPlanBtn.textContent = '📝';
              reflectionPlanBtn.className = 'plan-btn';
              reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir plan de acción');
              reflectionPlanBtn.setAttribute('aria-label', 'Añadir plan de acción');
              reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleFailedTaskClick(li); };
              if (!actionButtons.contains(reflectionPlanBtn)) {
                  actionButtons.appendChild(reflectionPlanBtn);
              }

          } else { // '⬜' Pendiente
              reflectionPlanBtn.remove();
              if (wasCompleted || wasFailed) {
                  const messages = ['¡Vamos de nuevo!', '¡Tú puedes con esto!', '¡Un nuevo intento!'];
                  showToast(messages[Math.floor(Math.random() * messages.length)], 'info');
              }
          }
          
          statusBtn.textContent = icon;
          getTargetList(li).appendChild(li);
          reorderList(getTargetList(li));
          saveTasks();
          statusMenu.style.display = 'none';
          statusBtn.setAttribute('aria-expanded', 'false');
      });
      statusMenu.appendChild(btn);
  });

  statusBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isExpanded = statusMenu.style.display === 'block';
      document.querySelectorAll('.status-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.status-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
      if (!isExpanded) {
          statusMenu.style.display = 'block';
          statusBtn.setAttribute('aria-expanded', 'true');
          const r = statusBtn.getBoundingClientRect();
          statusMenu.style.top = `${r.bottom + window.scrollY}px`;
          statusMenu.style.left = `${r.left}px`;
      } else {
          statusMenu.style.display = 'none';
          statusBtn.setAttribute('aria-expanded', 'false');
      }
  });

  document.addEventListener('click', e => {
      if (!statusMenu.contains(e.target) && e.target !== statusBtn) {
          statusMenu.style.display = 'none';
          if(statusBtn) statusBtn.setAttribute('aria-expanded', 'false');
      }
  });
  document.body.appendChild(statusMenu);

  // (REMOVIDO) El evento de clic en el 'li' ya no es necesario
  // if (failed) li.addEventListener('click', ...); 

  const favoriteBtn = document.createElement('button');
  favoriteBtn.textContent = favorite ? '★' : '☆';
  favoriteBtn.classList.add('favorite-btn');
  favoriteBtn.setAttribute('data-tooltip', favorite ? 'Quitar de favoritos' : 'Marcar como favorito');
  favoriteBtn.setAttribute('aria-label', favorite ? 'Quitar de favoritos' : 'Marcar como favorito');
  favoriteBtn.addEventListener('click', () => {
      li.classList.toggle('favorite');
      const originalText = span.dataset.originalText;
      span.textContent = li.classList.contains('favorite')
          ? `${originalText} — Prioridad ${priorityName(priority)}`
          : originalText;
      
      favoriteBtn.textContent = li.classList.contains('favorite') ? '★' : '☆';
      favoriteBtn.setAttribute('data-tooltip', li.classList.contains('favorite') ? 'Quitar de favoritos' : 'Marcar como favorito');
      favoriteBtn.setAttribute('aria-label', li.classList.contains('favorite') ? 'Quitar de favoritos' : 'Marcar como favorito');
      
      getTargetList(li).appendChild(li);
      reorderList(getTargetList(li));
      saveTasks();
  });

  const editBtn = document.createElement('button');
  editBtn.textContent = '✏️';
  editBtn.classList.add('edit-btn');
  editBtn.setAttribute('data-tooltip', 'Editar tarea');
  editBtn.setAttribute('aria-label', 'Editar tarea');
  editBtn.addEventListener('click', () => {
    let currentText = span.dataset.originalText;
    const currentPriority = li.classList.contains('high') ? 'high' : li.classList.contains('medium') ? 'medium' : 'low';

    const newText = prompt('Editar texto de la tarea:', currentText);
    const newDate = prompt('Editar fecha (YYYY-MM-DD):', li.dataset.date || '');
    const newTime = prompt('Editar hora (HH:MM):', li.dataset.time || '');
    const newPriority = prompt('Editar prioridad (low, medium, high):', currentPriority);

    if (newText !== null && newText.trim() !== '') {
        span.dataset.originalText = newText.trim();
        text = newText.trim();
    }
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
        ? `${span.dataset.originalText} — Prioridad ${priorityName(priority)}`
        : span.dataset.originalText;

    if (li.classList.contains('completed') || li.classList.contains('failed')) {
        if (confirm('¿Deseas marcar esta tarea como pendiente nuevamente?')) {
            li.classList.remove('completed', 'failed');
            statusBtn.textContent = '⬜';
            reflectionPlanBtn.remove(); // (MODIFICADO) Quitar el botón
            const messages = ['¡Vamos de nuevo!', '¡Tú puedes con esto!', '¡Un nuevo intento!'];
            showToast(messages[Math.floor(Math.random() * messages.length)], 'info');
            getTargetList(li).appendChild(li);
        }
    } else if (li.classList.contains('favorite')) {
        if (confirm('¿Deseas mover esta tarea a su prioridad correspondiente?')) {
            li.classList.remove('favorite');
            getTargetList(li).appendChild(li);
        } else {
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
  deleteBtn.setAttribute('data-tooltip', 'Eliminar tarea');
  deleteBtn.setAttribute('aria-label', 'Eliminar tarea');
  deleteBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta tarea? (Las reflexiones guardadas no se borrarán)')) {
          li.remove();
          saveTasks();
      }
  });

  // (MODIFICADO) Lógica para añadir los botones al cargar
  actionButtons.append(favoriteBtn, editBtn, deleteBtn);
  if (completed) {
      reflectionPlanBtn.textContent = '💬';
      reflectionPlanBtn.className = 'reflection-btn';
      reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir reflexión de éxito');
      reflectionPlanBtn.setAttribute('aria-label', 'Añadir reflexión de éxito');
      reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleCompletedTaskClick(li); };
      actionButtons.append(reflectionPlanBtn);
  } else if (failed) {
      reflectionPlanBtn.textContent = '📝';
      reflectionPlanBtn.className = 'plan-btn';
      reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir plan de acción');
      reflectionPlanBtn.setAttribute('aria-label', 'Añadir plan de acción');
      reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleFailedTaskClick(li); };
      actionButtons.append(reflectionPlanBtn);
  }

  li.append(statusBtn, taskContent, actionButtons);
  li.dataset.date = date;
  li.dataset.time = time;
  return li;
}

function priorityName(p) {
  return p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
}
