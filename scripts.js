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

// NUEVOS ELEMENTOS DEL MODAL DE RECUPERACIÓN
const recoveryModal = document.getElementById('recovery-modal');
const failureReasonInput = document.getElementById('failure-reason');
const confirmReasonBtn = document.getElementById('confirm-reason-btn');
const reassignTaskBtn = document.getElementById('reassign-task-btn');
let currentFailedTaskElement = null; // Para guardar la tarea sobre la que se hizo clic


// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    setupFormLinks();
    loadTasks();
    showWelcomeModal(); 
    setInterval(checkTaskDeadlines, 60000); // Verifica cada minuto
});

// Eventos de Tareas (se mantienen)
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addTask();
});
contrastToggle.addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
  localStorage.setItem('highContrastMode', document.body.classList.contains('high-contrast'));
});
daltonismToggle.addEventListener('click', () => {
    document.body.classList.toggle('daltonism-mode');
    localStorage.setItem('daltonismMode', document.body.classList.contains('daltonism-mode'));
});
// (Resto de la lógica de modales de ayuda y setupFormLinks se mantiene...)
function setupFormLinks() {
    const URL_DUDAS = "https://forms.gle/VWrE8LM4ZcWuhyjE7";
    const URL_TECNICO = "https://forms.gle/p99c2zg594rTzick6";
    if (linkDudas) linkDudas.href = URL_DUDAS;
    if (linkTecnico) linkTecnico.href = URL_TECNICO;
}

helpBtn.addEventListener('click', () => {
    helpModal.classList.add('visible'); helpModal.removeAttribute('hidden'); closeModalBtn.focus(); 
});
closeModalBtn.addEventListener('click', () => {
    helpModal.classList.remove('visible'); helpModal.setAttribute('hidden', ''); helpBtn.focus();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('visible')) {
        helpModal.classList.remove('visible'); helpModal.setAttribute('hidden', ''); helpBtn.focus();
    }
});
function showWelcomeModal() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) return;
    welcomeModal.classList.add('visible');
    welcomeModal.removeAttribute('hidden');
    closeWelcomeBtn.addEventListener('click', () => {
        welcomeModal.classList.remove('visible');
        welcomeModal.setAttribute('hidden', '');
        localStorage.setItem('hasSeenWelcome', 'true'); 
        taskInput.focus();
    });
}


// ===================================
// 3. LÓGICA DE RECUPERACIÓN DE TAREAS
// ===================================

/**
 * Muestra el modal de recuperación y guarda la referencia de la tarea.
 */
function handleFailedTaskClick(li) {
    if (!li.classList.contains('failed')) return; // Solo funciona en tareas fallidas
    
    currentFailedTaskElement = li;
    recoveryModal.classList.add('visible');
    recoveryModal.removeAttribute('hidden');
    failureReasonInput.value = ''; // Limpiar el input

    // Ocultar modal de ayuda si estaba abierto
    helpModal.classList.remove('visible');
    helpModal.setAttribute('hidden', '');
}

/**
 * Lógica para REASIGNAR la tarea
 */
reassignTaskBtn.addEventListener('click', () => {
    if (!currentFailedTaskElement) return;

    // Abrir el modal de edición con la información actual
    const taskTextSpan = currentFailedTaskElement.querySelector('span');
    const newText = prompt('Reasigna la tarea - Nuevo texto:', taskTextSpan.textContent);
    const newDate = prompt('Reasigna la tarea - Nueva fecha (YYYY-MM-DD):', currentFailedTaskElement.dataset.date);
    const newTime = prompt('Reasigna la tarea - Nueva hora (HH:MM):', currentFailedTaskElement.dataset.time);

    if (newText !== null && newText.trim() !== '') {
        // 1. Actualizar datos
        taskTextSpan.textContent = newText.trim();
        currentFailedTaskElement.dataset.date = newDate || '';
        currentFailedTaskElement.dataset.time = newTime || '';
        
        // 2. Mover de Fallida a Pendiente (Alta/Media/Baja)
        currentFailedTaskElement.classList.remove('failed');
        currentFailedTaskElement.querySelector('.status-btn').textContent = '⬜';

        // 3. Actualizar la visualización de la fecha
        const dateDisplay = currentFailedTaskElement.querySelector('.date-display');
        let nuevoVencimientoTexto = 'Sin fecha';
        if (newDate) {
            nuevoVencimientoTexto = `Vence: ${new Date(newDate).toLocaleDateString()}`;
            if (newTime) {
                nuevoVencimientoTexto += `<br>Hora: ${newTime}`; // CAMBIO: Usar <br>
            }
        }
        dateDisplay.innerHTML = nuevoVencimientoTexto; // CAMBIO: Usar innerHTML

        // Mover y guardar
        getTargetList(currentFailedTaskElement).appendChild(currentFailedTaskElement);
        reorderList(getTargetList(currentFailedTaskElement));
        reorderList(failedTasksList); 
        saveTasks();
    }
    
    // Cerrar modal
    recoveryModal.classList.remove('visible');
    recoveryModal.setAttribute('hidden', '');
    currentFailedTaskElement = null;
});

/**
 * Lógica para ARCHIVAR la tarea (Simplemente la eliminamos si es vencida o fallida)
 */
confirmReasonBtn.addEventListener('click', () => {
    if (!currentFailedTaskElement) return;

    const reason = failureReasonInput.value.trim();
    const taskName = currentFailedTaskElement.querySelector('span').textContent;
    
    if (reason) {
        console.log(`TAREA ARCHIVADA: ${taskName}. Motivo: ${reason}`);
        alert(`Motivo '${reason}' registrado. Tarea archivada.`);
    } else {
        alert('Tarea archivada sin motivo.');
    }
    
    // Eliminar la tarea y guardar
    currentFailedTaskElement.remove();
    saveTasks();
    
    // Cerrar modal
    recoveryModal.classList.remove('visible');
    recoveryModal.setAttribute('hidden', '');
    currentFailedTaskElement = null;
});


// ===================================
// 4. LÓGICA DE TAREAS Y MOVIMIENTO
// ===================================

/**
 * Verifica si una tarea ha vencido y la mueve si es necesario. (Se mantiene)
 */
function checkTaskDeadlines() {
    const activeLists = [favoriteTasksList, highPriorityList, mediumPriorityList, lowPriorityList];
    
    activeLists.forEach(ulElement => {
        ulElement.querySelectorAll('li').forEach(li => {
            const date = li.dataset.date;
            const time = li.dataset.time;
            
            if (date) {
                const deadline = new Date(`${date}T${time || '23:59:59'}`);
                const now = new Date();
                
                if (deadline < now) {
                    if (!li.classList.contains('completed') && !li.classList.contains('failed')) {
                        
                        li.classList.remove('favorite');
                        li.classList.add('failed'); 
                        
                        const statusBtn = li.querySelector('.status-btn');
                        if (statusBtn) statusBtn.textContent = '❌'; 
                        
                        failedTasksList.appendChild(li);
                        
                        reorderList(failedTasksList);
                        reorderList(ulElement);
                        saveTasks();
                        console.log(`Tarea vencida movida: ${li.querySelector('span').textContent}`);
                    }
                }
            }
        });
    });
}


/**
 * Retorna el contenedor UL correcto basado en el estado y prioridad. (Se mantiene)
 */
function getTargetList(li) {
    const isCompleted = li.classList.contains('completed');
    const isFailed = li.classList.contains('failed');
    const isFavorite = li.classList.contains('favorite');

    if (isCompleted) return completedTasksList; 
    if (isFailed) return failedTasksList; 
    
    if (isFavorite) return favoriteTasksList; 
    
    if (li.classList.contains('high')) return highPriorityList;
    if (li.classList.contains('medium')) return mediumPriorityList;
    if (li.classList.contains('low')) return lowPriorityList;

    return lowPriorityList; 
}

/**
 * Función que ordena la lista localmente (Favoritos primero) (Se mantiene)
 */
function reorderList(ulElement) {
    const tasks = Array.from(ulElement.querySelectorAll('li'));
    
    tasks.sort((a, b) => {
        const aIsFavorite = a.classList.contains('favorite');
        const bIsFavorite = b.classList.contains('favorite');
        
        if (aIsFavorite !== bIsFavorite) {
            return aIsFavorite ? -1 : 1; 
        }
        return 0; 
    });
    tasks.forEach(task => ulElement.appendChild(task));
}


/**
 * Función que alterna el estado de la tarea y MUEVE el elemento si es necesario.
 */
function toggleTaskStatus(li) {
    let newStatusIcon;
    const currentList = li.parentElement;
    
    if (li.classList.contains('completed')) {
        li.classList.remove('completed');
        li.classList.add('failed');
        newStatusIcon = '❌';
    } else if (li.classList.contains('failed')) {
        li.classList.remove('failed');
        newStatusIcon = '⬜';
    } else {
        li.classList.add('completed');
        newStatusIcon = '✅';
    }
    
    const targetList = getTargetList(li);
    if (currentList !== targetList) {
        targetList.appendChild(li);
    }
    
    reorderList(targetList);
    if (currentList && currentList !== targetList) {
        reorderList(currentList); 
    }

    return newStatusIcon;
}


/**
 * Crea la estructura LI para una tarea...
 */
function createTaskElement(text, priority, completed, favorite = false, failed = false, date = '', time = '') { 
    const li = document.createElement('li');
    li.classList.add(priority);
    if (completed) li.classList.add('completed');
    if (failed) li.classList.add('failed');
    if (favorite) li.classList.add('favorite');

    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content-wrapper');

    const span = document.createElement('span');
    span.textContent = text;
    
    // --- FECHA Y HORA ---
    const dateDisplay = document.createElement('small');
    dateDisplay.classList.add('date-display');
    
    let vencimientoTexto = 'Sin fecha';
    if (date) {
        vencimientoTexto = ` Vence: ${new Date(date).toLocaleDateString()}`;
        if (time) {
            vencimientoTexto += `<br>Hora: ${time}`; // CAMBIO: Usar <br>
        }
    }
    dateDisplay.innerHTML = vencimientoTexto; // CAMBIO: Usar innerHTML

    taskContent.appendChild(span);
    taskContent.appendChild(dateDisplay);
    
    // --- BOTÓN DE ESTADO ---
    const statusBtn = document.createElement('button');
    statusBtn.classList.add('status-btn');
    statusBtn.setAttribute('aria-label', 'Marcar estado de tarea');
    statusBtn.setAttribute('title', 'Marcar tarea como completada, fallida o pendiente');
    statusBtn.setAttribute('data-tooltip', 'Marcar tarea como completada, fallida o pendiente');
    
    if (completed) { statusBtn.textContent = '✅'; } 
    else if (failed) { statusBtn.textContent = '❌'; } 
    else { statusBtn.textContent = '⬜'; }

    statusBtn.addEventListener('click', () => {
        statusBtn.textContent = toggleTaskStatus(li);
        saveTasks();
    });

    // Permitir clic en la tarea fallida para abrir el modal de justificación
    if (failed) {
        li.addEventListener('click', (e) => {
            // Asegurar que el clic no fue en un botón de acción
            if (!e.target.closest('.action-buttons')) {
                handleFailedTaskClick(li);
            }
        });
    }

    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    
    // Botón Favorito (se mantiene)
    const favoriteBtn = document.createElement('button');
    favoriteBtn.textContent = favorite ? '★' : '☆'; 
    favoriteBtn.classList.add('favorite-btn');
    favoriteBtn.setAttribute('aria-label', 'Marcar o desmarcar como favorita');
    favoriteBtn.setAttribute('title', 'Marcar/Desmarcar como favorito'); 
    favoriteBtn.setAttribute('data-tooltip', 'Marcar/Desmarcar como favorito'); 

    favoriteBtn.addEventListener('click', () => {
        const currentList = li.parentElement;
        li.classList.toggle('favorite');
        favoriteBtn.textContent = li.classList.contains('favorite') ? '★' : '☆'; 
        
        if (!li.classList.contains('completed') && !li.classList.contains('failed')) {
             const targetList = getTargetList(li);
             if (currentList !== targetList) {
                 targetList.appendChild(li);
             }
        }
        
        if (currentList) { reorderList(currentList); }
        saveTasks();
    });

    // Botón Editar (se mantiene)
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.classList.add('edit-btn');
    editBtn.setAttribute('aria-label', 'Editar tarea');
    editBtn.setAttribute('title', 'Editar tarea'); 
    editBtn.setAttribute('data-tooltip', 'Editar tarea'); 
    
    editBtn.addEventListener('click', () => {
        const newText = prompt('Editar texto de la tarea:', span.textContent);
        const newDate = prompt('Editar fecha (YYYY-MM-DD), deje vacío para borrar:', date);
        const newTime = prompt('Editar hora (HH:MM), deje vacío para borrar:', time); 

        if (newText !== null && newText.trim() !== '') {
            span.textContent = newText.trim();
        }
        
        li.dataset.date = newDate || '';
        li.dataset.time = newTime || '';

        let nuevoVencimientoTexto = 'Sin fecha';
        if (newDate) {
            nuevoVencimientoTexto = `Vence: ${new Date(newDate).toLocaleDateString()}`;
            if (newTime) {
                nuevoVencimientoTexto += `<br>Hora: ${newTime}`;
            }
        }
        dateDisplay.innerHTML = nuevoVencimientoTexto;

        saveTasks();
    });

    // Botón eliminar (se mantiene)
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.setAttribute('aria-label', 'Eliminar tarea');
    deleteBtn.setAttribute('title', 'Eliminar tarea'); 
    deleteBtn.setAttribute('data-tooltip', 'Eliminar tarea'); 

    deleteBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            li.remove();
            saveTasks(); 
        }
    });

    // Ensamblaje
    li.appendChild(statusBtn); 
    li.appendChild(taskContent); 
    actionButtons.appendChild(favoriteBtn);
    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    li.appendChild(actionButtons);
    
    li.dataset.date = date;
    li.dataset.time = time;
    
    return li;
}

/**
 * Añade una nueva tarea, FECHA, HORA, y la pone en su sección de prioridad. (Se mantiene)
 */
function addTask() {
    const taskText = taskInput.value.trim();
    const selectedPriority = prioritySelect.value;
    const selectedDate = dateInput.value; 
    const selectedTime = timeInput.value; 
    
    if (taskText === '' || selectedPriority === '') {
        alert('Por favor, escribe la tarea y elige una prioridad válida.');
        return;
    }

    const newTask = createTaskElement(taskText, selectedPriority, false, false, false, selectedDate, selectedTime); 
    
    const targetList = getTargetList(newTask);
    targetList.appendChild(newTask);
    
    reorderList(targetList);

    taskInput.value = '';
    dateInput.value = ''; 
    timeInput.value = ''; 
    prioritySelect.value = ''; 
    taskInput.focus();
    
    saveTasks(); 
}

/**
 * Guarda las tareas en LocalStorage (Persistencia). Incluye la fecha y hora. (Se mantiene)
 */
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-group li').forEach(li => {
        const text = li.querySelector('span').textContent;
        const completed = li.classList.contains('completed');
        const failed = li.classList.contains('failed');
        const favorite = li.classList.contains('favorite');
        const date = li.dataset.date || ''; 
        const time = li.dataset.time || '';
        
        let priority = 'low'; 
        if (li.classList.contains('medium')) priority = 'medium';
        if (li.classList.contains('high')) priority = 'high';

        tasks.push({ text, completed, failed, priority, favorite, date, time }); 
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Carga las tareas desde LocalStorage al iniciar y las distribuye. (Se mantiene)
 */
function loadTasks() {
    const isHighContrast = localStorage.getItem('highContrastMode') === 'true';
    if (isHighContrast) { document.body.classList.add('high-contrast'); }
    
    const isDaltonismMode = localStorage.getItem('daltonismMode') === 'true';
    if (isDaltonismMode) { document.body.classList.add('daltonism-mode'); } 
    
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        tasks.forEach(task => {
            const taskElement = createTaskElement(task.text, task.priority, task.completed, task.favorite, task.failed, task.date, task.time);
            const targetList = getTargetList(taskElement); 
            targetList.appendChild(taskElement);
        });
        
        reorderList(favoriteTasksList);
        reorderList(highPriorityList);
        reorderList(mediumPriorityList);
        reorderList(lowPriorityList);
        reorderList(completedTasksList);
        reorderList(failedTasksList);
        
        checkTaskDeadlines();
    }
    
    prioritySelect.value = ''; 
}
