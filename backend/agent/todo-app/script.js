const input = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const list = document.getElementById('todo-list');

addButton.addEventListener('click', addTodo);

function addTodo() {
    const text = input.value.trim();
    if (text !== '') {
        const li = document.createElement('li');
        li.innerText = text;
        li.addEventListener('click', toggleDone);
        list.appendChild(li);
        input.value = '';
    }
}

function toggleDone(e) {
    e.target.classList.toggle('completed');
}
