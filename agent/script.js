document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');

    addTodoBtn.addEventListener('click', addTodo);

    function addTodo() {
        const todoText = todoInput.value.trim();
        if (todoText !== '') {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${todoText}</span>
                <button class="delete-btn">Delete</button>
            `;
            todoList.appendChild(li);
            todoInput.value = '';

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', deleteTodo);
        }
    }

    function deleteTodo(event) {
        const li = event.target.parentElement;
        todoList.removeChild(li);
    }
});
