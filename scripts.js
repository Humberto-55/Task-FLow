// ===================================
// 1. OBTENCIÓN DE ELEMENTOS Y EVENTOS
// ===================================
const addTaskBtn = document.getElementById('addTaskBtn');
const taskInput = document.getElementById('taskInput');
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

// Modal de Bienvenida
const welcomeModal = document.getElementById('welcome-modal');
const closeWelcomeBtn = document.getElementById('close-welcome-btn');

// Elementos del modal de ayuda para inyectar URLs
const linkDudas = document.getElementById('link-dudas');
const linkTecnico = document.getElementById('link-tecnico');


// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    setupFormLinks(); // <--- LLAMADA A LA FUNCIÓN DE INYECCIÓN DE URLS
    loadTasks();
    showWelcomeModal(); 
});

// Eventos de Tareas
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addTask();
});

// Eventos de Accesibilidad
contrastToggle.addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
  localStorage.setItem('highContrastMode', document.body.classList.contains('high-contrast'));
});

daltonismToggle.addEventListener('click', () => {
    document.body.classList.toggle('daltonism-mode');
    localStorage.setItem('daltonismMode', document.body.classList.contains('daltonism-mode'));
});

// Modal de Ayuda (se mantiene)
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
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('visible')) {
        helpModal.classList.remove('visible');
        helpModal.setAttribute('hidden', '');
        helpBtn.focus();
    }
});


// Lógica para asignar URLs a los botones del modal de ayuda
function setupFormLinks() {
    // URLS FINALES INYECTADAS
    const URL_DUDAS = "https://forms.gle/VWrE8LM4ZcWuhyjE7";
    const URL_TECNICO = "https://forms.gle/p99c2zg594rTzick6";
    
    if (linkDudas) linkDudas.href = URL_DUDAS;
    if (linkTecnico) linkTecnico.href = URL_TECNICO;
}

// Modal de Bienvenida (Se mantiene)
function showWelcomeModal() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (hasSeenWelcome) {
        return;
    }
    
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
// 2. LÓGICA DE TAREAS Y MOVIMIENTO
// ===================================

/**
 * Retorna el contenedor UL correcto basado en el estado y prioridad.
 */
function getTargetList(li) {
    const isCompleted = li.classList.contains('completed');
    const isFailed = li.classList.contains('failed');
    const isFavorite = li.classList.contains('favorite');

    if (isCompleted) {
        return completedTasksList; 
    }
    if (isFailed) {
        return failedTasksList; 
    } 
    
    // Tareas activas (Pendientes)
    if (isFavorite) {
        return favoriteTasksList; 
    } else {
        // No favoritas pendientes (secciones de prioridad)
        if (li.classList.contains('high')) return highPriorityList;
        if (li.classList.contains('medium')) return mediumPriorityList;
        if (li.classList.contains('low')) return lowPriorityList;
    }
    return lowPriorityList; 
}

/**
 * Función que ordena la lista localmente (Favoritos primero)
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
    
    // 1. Determinar el NUEVO estado
    if (li.classList.contains('completed')) {
        // De Completada (✅) pasa a No Completada (❌)
        li.classList.remove('completed');
        li.classList.add('failed');
        newStatusIcon = '❌';
    } else if (li.classList.contains('failed')) {
        // De Fallida (❌) pasa a Pendiente (⬜)
        li.classList.remove('failed');
        // El estado favorito se mantendrá si pasa a Pendiente
        newStatusIcon = '⬜';
    } else {
        // De Pendiente (⬜) pasa a Completada (✅)
        li.classList.add('completed');
        newStatusIcon = '✅';
    }
    
    // 2. Mover la tarea a la lista correcta
    const targetList = getTargetList(li);
    if (currentList !== targetList) {
        targetList.appendChild(li);
    }
    
    // 3. Reordenar las listas involucradas
    reorderList(targetList);
    if (currentList && currentList !== targetList) {
        reorderList(currentList); 
    }

    return newStatusIcon;
}


/**
 * Crea la estructura LI para una tarea...
 */
function createTaskElement(text, priority, completed, favorite = false, failed = false) { 
    const li = document.createElement('li');
    li.classList.add(priority);
    if (completed) li.classList.add('completed');
    if (failed) li.classList.add('failed');
    if (favorite) li.classList.add('favorite');

    const span = document.createElement('span');
    span.textContent = text;
    
    // --- NUEVO BOTÓN DE ESTADO ---
    const statusBtn = document.createElement('button');
    statusBtn.classList.add('status-btn');
    statusBtn.setAttribute('aria-label', 'Marcar estado de tarea');
    statusBtn.setAttribute('title', 'Marcar tarea como completada, fallida o pendiente');
    statusBtn.setAttribute('data-tooltip', 'Marcar tarea como completada, fallida o pendiente');

    
    // Icono inicial
    if (completed) { statusBtn.textContent = '✅'; } 
    else if (failed) { statusBtn.textContent = '❌'; } 
    else { statusBtn.textContent = '⬜'; }

    // Evento de click para cambiar el estado
    statusBtn.addEventListener('click', () => {
        statusBtn.textContent = toggleTaskStatus(li);
        saveTasks();
    });

    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    
    // Botón FAVORITO (El click requiere reordenar la lista actual y la lógica de movimiento)
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
        
        // Si la tarea NO está finalizada (pendiente), moverla a la sección Favoritos o de Prioridad
        if (!li.classList.contains('completed') && !li.classList.contains('failed')) {
             const targetList = getTargetList(li);
             if (currentList !== targetList) {
                 targetList.appendChild(li);
             }
        }
        
        if (currentList) { reorderList(currentList); }
        
        saveTasks();
    });

    // Botón EDITAR (Se mantiene)
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.classList.add('edit-btn');
    editBtn.setAttribute('aria-label', 'Editar tarea');
    editBtn.setAttribute('title', 'Editar tarea'); 
    editBtn.setAttribute('data-tooltip', 'Editar tarea'); 
    
    editBtn.addEventListener('click', () => {
        const currentText = span.textContent;
        const newText = prompt('Editar tarea:', currentText);

        if (newText !== null && newText.trim() !== '') {
            span.textContent = newText.trim();
            saveTasks();
        }
    });

    // Botón eliminar (Se mantiene)
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
    li.appendChild(span);
    actionButtons.appendChild(favoriteBtn);
    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    li.appendChild(actionButtons);
    
    return li;
}

/**
 * Añade una nueva tarea y la pone en su sección de prioridad.
 */
function addTask() {
    const taskText = taskInput.value.trim();
    const selectedPriority = prioritySelect.value;
    
    if (taskText === '' || selectedPriority === '') {
        alert('Por favor, escribe la tarea y elige una prioridad válida.');
        return;
    }

    const newTask = createTaskElement(taskText, selectedPriority, false, false, false); 
    
    const targetList = getTargetList(newTask);
    targetList.appendChild(newTask);
    
    reorderList(targetList);

    taskInput.value = '';
    prioritySelect.value = ''; 
    taskInput.focus();
    
    saveTasks(); 
}

/**
 * Guarda las tareas en LocalStorage (Persistencia).
 */
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-group li').forEach(li => {
        const text = li.querySelector('span').textContent;
        const completed = li.classList.contains('completed');
        const failed = li.classList.contains('failed');
        const favorite = li.classList.contains('favorite');
        
        let priority = 'low'; 
        if (li.classList.contains('medium')) priority = 'medium';
        if (li.classList.contains('high')) priority = 'high';

        tasks.push({ text, completed, failed, priority, favorite }); 
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Carga las tareas desde LocalStorage al iniciar y las distribuye.
 */
function loadTasks() {
    // Cargar modos de accesibilidad
    const isHighContrast = localStorage.getItem('highContrastMode') === 'true';
    if (isHighContrast) { document.body.classList.add('high-contrast'); }
    
    const isDaltonismMode = localStorage.getItem('daltonismMode') === 'true';
    if (isDaltonismMode) { document.body.classList.add('daltonism-mode'); } 
    
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        tasks.forEach(task => {
            const taskElement = createTaskElement(task.text, task.priority, task.completed, task.favorite, task.failed);
            const targetList = getTargetList(taskElement); 
            targetList.appendChild(taskElement);
        });
        
        // Reordenar todas las listas al final de la carga 
        reorderList(favoriteTasksList);
        reorderList(highPriorityList);
        reorderList(mediumPriorityList);
        reorderList(lowPriorityList);
        reorderList(completedTasksList);
        reorderList(failedTasksList);
    }
    
    prioritySelect.value = ''; 
}