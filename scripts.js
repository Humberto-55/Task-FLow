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
const tooltipToggle = document.getElementById('tooltip-toggle');
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

// Modal de Ayuda
const linkDudas = document.getElementById('link-dudas');
const linkTecnico = document.getElementById('link-tecnico');

// Modal de Bienvenida / Tutorial
const welcomeModal = document.getElementById('welcome-modal');
const startTutorialBtn = document.getElementById('start-tutorial-btn');
const skipTutorialBtn = document.getElementById('skip-tutorial-btn');
const tutorialStepsContainer = document.getElementById('tutorial-steps');
const tutorialText = document.getElementById('tutorial-text');
const tutorialPrev = document.getElementById('tutorial-prev');
const tutorialNext = document.getElementById('tutorial-next');
const tutorialSkip = document.getElementById('tutorial-skip');

// Modal de recuperación
const recoveryModal = document.getElementById('recovery-modal');
const failureReasonInput = document.getElementById('failure-reason');
const confirmReasonBtn = document.getElementById('confirm-reason-btn');
const reassignTaskBtn = document.getElementById('reassign-task-btn');
const cancelRecoveryBtn = document.getElementById('cancel-recovery-btn');
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
    setupTutorialListeners();
    setupReflectionModalListeners();
    setupRecoveryModalListeners();

    tooltipToggle.addEventListener('click', () => {
        const isChecked = tooltipToggle.checked;
        document.body.classList.toggle('tooltips-visible', isChecked);
        localStorage.setItem('tooltipsVisible', isChecked);
    });

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

function setupRecoveryModalListeners() {
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
                
                // (MODIFICADO) Usar función de formato AM/PM
                const formattedNewTime = formatTimeAMPM(newTime); 
                if (formattedNewTime) nuevoVencimientoTexto += `<br>Hora: ${formattedNewTime}`;
            }
            dateDisplay.innerHTML = nuevoVencimientoTexto;
            
            currentFailedTaskElement.classList.remove('failed');
            // (MODIFICADO) Cambia etiqueta "Estado" por "Marcar como:"
            currentFailedTaskElement.querySelector('.status-btn').innerHTML = '⬜<span class="action-label">Marcar como:</span>';
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

    if (cancelRecoveryBtn) {
        cancelRecoveryBtn.addEventListener('click', () => {
            recoveryModal.classList.remove('visible');
            recoveryModal.setAttribute('hidden', '');
            currentFailedTaskElement = null;
        });
    }
}


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

function updateTaskCount() {
    const pending = document.querySelectorAll('#favorite-tasks-list li, #high-priority-list li, #medium-priority-list li, #low-priority-list li').length;
    const completed = completedTasksList.getElementsByTagName('li').length;
    const failed = failedTasksList.getElementsByTagName('li').length;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
    failedCountEl.textContent = failed;
}

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
    date.textContent = `Reflexión del: ${new Date(reflection.timestamp).toLocaleDateString()}`;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-reflection-btn';
    deleteBtn.innerHTML = '🗑';
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
                  // (MODIFICADO) Cambia etiqueta "Estado" por "Marcar como:"
                  li.querySelector('.status-btn').innerHTML = '❌<span class="action-label">Marcar como:</span>';
                  
                  const actionButtons = li.querySelector('.action-buttons');
                  const reflectionPlanBtn = actionButtons.querySelector('.reflection-btn, .plan-btn') || document.createElement('button');
                  
                  reflectionPlanBtn.innerHTML = '📝<span class="action-label">Plan</span>';
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
  
  const tooltipsOn = localStorage.getItem('tooltipsVisible') === 'true';
  tooltipToggle.checked = tooltipsOn;
  document.body.classList.toggle('tooltips-visible', tooltipsOn);

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
// 5. CREACIÓN DE TAREAS (PRINCIPAL) - VERSIÓN CORREGIDA
// ===============================
function createTaskElement(text, priority, completed, favorite = false, failed = false, date = '', time = '') {
  const li = document.createElement('li');
  if (completed) li.classList.add('completed');
  if (failed) li.classList.add('failed');
  if (favorite) li.classList.add('favorite');
  if (!['high', 'medium', 'low'].includes(priority)) priority = 'low';
  li.classList.add(priority);


  const taskContent = document.createElement('div');
  taskContent.classList.add('task-content-wrapper');

  const span = document.createElement('span');
  span.dataset.originalText = text; 
  span.textContent = favorite ? `${text} — Prioridad ${priorityName(priority)}` : text;

  const dateDisplay = document.createElement('small');
  dateDisplay.classList.add('date-display');
  
  // (MODIFICADO) Usar función de formato AM/PM
  const formattedTime = formatTimeAMPM(time);
  dateDisplay.innerHTML = date ? ` Vence: ${new Date(date).toLocaleDateString()}${formattedTime ? `<br>Hora: ${formattedTime}` : ''}` : 'Sin fecha';

  taskContent.appendChild(span);
  taskContent.appendChild(dateDisplay);

  const statusBtn = document.createElement('button');
  statusBtn.classList.add('status-btn');
  // (MODIFICADO) Cambia etiqueta "Estado" por "Marcar como:"
  statusBtn.innerHTML = `${completed ? '✅' : failed ? '❌' : '⬜'}<span class="action-label">Marcar como:</span>`;
  statusBtn.setAttribute('data-tooltip', 'Cambiar estado');
  statusBtn.setAttribute('aria-label', 'Cambiar estado de la tarea');
  statusBtn.setAttribute('aria-haspopup', 'true');
  statusBtn.setAttribute('aria-expanded', 'false');

  const statusMenu = document.createElement('div');
  statusMenu.classList.add('status-menu');
  statusMenu.setAttribute('role', 'menu');

  const actionButtons = document.createElement('div');
  actionButtons.classList.add('action-buttons');
  
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
      btn.setAttribute('aria-label', ariaLabel || text);
      btn.setAttribute('role', 'menuitem');

      btn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          const wasCompleted = li.classList.contains('completed');
          const wasFailed = li.classList.contains('failed');
          li.classList.remove('completed', 'failed');
          
          if (icon === '✅') {
              li.classList.add('completed');
              if (!wasCompleted) {
                  showToast('¡Excelente! ¡Un logro más!', 'success');
              }
              reflectionPlanBtn.innerHTML = '💬<span class="action-label">Reflexión</span>';
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
                  showToast('¡Ánimo! A la próxima lo lograrás', 'failed');
              }
              reflectionPlanBtn.innerHTML = '📝<span class="action-label">Plan</span>';
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
                  showToast('¡Vamos de nuevo! Tú puedes', 'info');
              }
          }
          
          // (MODIFICADO) Cambia etiqueta "Estado" por "Marcar como:"
          statusBtn.innerHTML = `${icon}<span class="action-label">Marcar como:</span>`;
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
          // (MODIFICADO) Alinear a la DERECHA del botón
          statusMenu.style.left = `${r.left + window.scrollX - statusMenu.offsetWidth + r.width}px`;
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

  const favoriteBtn = document.createElement('button');
  favoriteBtn.classList.add('favorite-btn');
  favoriteBtn.innerHTML = `${favorite ? '★' : '☆'}<span class="action-label">Favorito</span>`;
  favoriteBtn.setAttribute('data-tooltip', favorite ? 'Quitar de favoritos' : 'Marcar como favorito');
  favoriteBtn.setAttribute('aria-label', favorite ? 'Quitar de favoritos' : 'Marcar como favorito');
  favoriteBtn.addEventListener('click', () => {
      li.classList.toggle('favorite');
      const originalText = span.dataset.originalText;
      span.textContent = li.classList.contains('favorite')
          ? `${originalText} — Prioridad ${priorityName(priority)}`
          : originalText;
      
      favoriteBtn.innerHTML = `${li.classList.contains('favorite') ? '★' : '☆'}<span class="action-label">Favorito</span>`;
      favoriteBtn.setAttribute('data-tooltip', li.classList.contains('favorite') ? 'Quitar de favoritos' : 'Marcar como favorito');
      favoriteBtn.setAttribute('aria-label', li.classList.contains('favorite') ? 'Quitar de favoritos' : 'Marcar como favorito');
      
      getTargetList(li).appendChild(li);
      reorderList(getTargetList(li));
      saveTasks();
  });

  const editBtn = document.createElement('button');
  editBtn.classList.add('edit-btn');
  editBtn.innerHTML = '✏️<span class="action-label">Editar</span>';
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
    
    // (MODIFICADO) Usar función de formato AM/PM
    const formattedNewTime = formatTimeAMPM(newTime);
    dateDisplay.innerHTML = newDate ? ` Vence: ${new Date(newDate).toLocaleDateString()}${formattedNewTime ? `<br>Hora: ${formattedNewTime}` : ''}` : 'Sin fecha';
    
    span.textContent = li.classList.contains('favorite') ? `${span.dataset.originalText} — Prioridad ${priorityName(priority)}` : span.dataset.originalText;
    if (li.classList.contains('completed') || li.classList.contains('failed')) {
        if (confirm('¿Deseas marcar esta tarea como pendiente nuevamente?')) {
            li.classList.remove('completed', 'failed');
            // (MODIFICADO) Cambia etiqueta "Estado" por "Marcar como:"
            statusBtn.innerHTML = '⬜<span class="action-label">Marcar como:</span>';
            reflectionPlanBtn.remove();
            showToast('¡Vamos de nuevo! Tú puedes', 'info');
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
  deleteBtn.classList.add('delete-btn');
  deleteBtn.innerHTML = '🗑<span class="action-label">Eliminar</span>';
  deleteBtn.setAttribute('data-tooltip', 'Eliminar tarea');
  deleteBtn.setAttribute('aria-label', 'Eliminar tarea');
  deleteBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta tarea? (Las reflexiones guardadas no se borrarán)')) {
          li.remove();
          saveTasks();
      }
  });

  // (MODIFICADO) Añadir botones en el nuevo orden
  actionButtons.append(statusBtn, favoriteBtn, editBtn, deleteBtn);
  if (completed) {
      reflectionPlanBtn.innerHTML = '💬<span class="action-label">Reflexión</span>';
      reflectionPlanBtn.className = 'reflection-btn';
      reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir reflexión de éxito');
      reflectionPlanBtn.setAttribute('aria-label', 'Añadir reflexión de éxito');
      reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleCompletedTaskClick(li); };
      actionButtons.append(reflectionPlanBtn);
  } else if (failed) {
      reflectionPlanBtn.innerHTML = '📝<span class="action-label">Plan</span>';
      reflectionPlanBtn.className = 'plan-btn';
      reflectionPlanBtn.setAttribute('data-tooltip', 'Añadir plan de acción');
      reflectionPlanBtn.setAttribute('aria-label', 'Añadir plan de acción');
      reflectionPlanBtn.onclick = (e) => { e.stopPropagation(); handleFailedTaskClick(li); };
      actionButtons.append(reflectionPlanBtn);
  }

  li.append(taskContent, actionButtons);
  li.dataset.date = date;
  li.dataset.time = time;
  return li;
}

// (NUEVA FUNCIÓN) Convierte HH:MM a formato 12-horas AM/PM
function formatTimeAMPM(time) {
    if (!time || time.split(':').length < 2) return ''; // Retorna vacío si no hay hora
    let [hours, minutes] = time.split(':');
    const hoursInt = parseInt(hours, 10);
    
    const ampm = hoursInt >= 12 ? 'PM' : 'AM';
    let hours12 = hoursInt % 12;
    hours12 = hours12 ? hours12 : 12; // La hora 0 (medianoche) debe ser 12
    
    return `${hours12}:${minutes} ${ampm}`;
}

function priorityName(p) {
  return p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
}


/* ===============================
// 6. LÓGICA DEL TUTORIAL
// =============================== */
// (MODIFICADO) Texto del último paso
const tutorialSteps = [
  { text: 'Este es el campo para escribir una nueva tarea. Escribe y elige prioridad para agregar.' },
  { text: 'Tus tareas se agruparán por Favoritas y por Prioridad (Alta, Media, Baja).' },
  { text: 'Usa los botones de acción a la derecha para gestionar tus tareas (cambiar estado, marcar favorito, editar, etc.).' },
  { text: 'Puedes mostrar u ocultar las etiquetas de los botones con el interruptor en el encabezado.' },
  { text: 'Al completar (✅) o fallar (❌), aparecerá un botón (💬 o 📝) para añadir reflexiones.' },
  { text: 'Puedes ver todas tus reflexiones guardadas al final de la página.' },
  { text: '¡Listo! Ya conoces lo básico.' } // <-- Texto modificado
];
let tutorialIndex = 0;

function setupTutorialListeners() {
    if (startTutorialBtn) {
        startTutorialBtn.addEventListener('click', () => {
            // (NUEVO) Ocultar el texto de introducción
            const introText = document.getElementById('welcome-intro-text');
            if (introText) introText.style.display = 'none';

            document.getElementById('tutorial-initial-options').style.display = 'none';
            tutorialStepsContainer.style.display = 'block';
            tutorialIndex = 0;
            showTutorialStep();
        });
    }
    if (skipTutorialBtn) {
        skipTutorialBtn.addEventListener('click', () => {
            welcomeModal.classList.remove('visible');
            welcomeModal.setAttribute('hidden','');
            taskInput.focus();
        });
    }
    if (tutorialPrev) {
        tutorialPrev.addEventListener('click', () => { 
            tutorialIndex = Math.max(0, tutorialIndex-1); 
            showTutorialStep(); 
        });
    }
    if (tutorialNext) {
        tutorialNext.addEventListener('click', () => {
            tutorialIndex++;
            if (tutorialIndex >= tutorialSteps.length) {
                const frases = ['¡Bien hecho! Ahora organiza tus tareas 💪', '¡Listo! A crear buenas rutinas 📌', '¡Motivación ON! A lograr metas 🔥'];
                alert(frases[Math.floor(Math.random()*frases.length)]);
                welcomeModal.classList.remove('visible');
                welcomeModal.setAttribute('hidden','');
                taskInput.focus();
            } else {
                showTutorialStep();
            }
        });
    }
    if (tutorialSkip) {
        tutorialSkip.addEventListener('click', () => {
            welcomeModal.classList.remove('visible');
            welcomeModal.setAttribute('hidden','');
            taskInput.focus();
        });
    }
}

function showTutorialStep() {
    tutorialText.textContent = tutorialSteps[tutorialIndex].text;
    tutorialPrev.style.display = (tutorialIndex === 0) ? 'none' : 'inline-block';
    tutorialNext.textContent = (tutorialIndex === tutorialSteps.length - 1) ? 'Finalizar' : 'Siguiente';
}
