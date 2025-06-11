let display = document.getElementById('display');
let currentInput = '';

function operate(value) {
    currentInput += value;
    display.value = currentInput;
}

function clearDisplay() {
    currentInput = '';
    display.value = '';
}

function calculate() {
    try {
        currentInput = eval(currentInput);
        display.value = currentInput;
    } catch (error) {
        display.value = 'Error';
        currentInput = '';
    }
}

function backspace() {
    currentInput = currentInput.slice(0, -1);
    display.value = currentInput;
}
