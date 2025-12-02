function handleIdle(){
document.getElementById("body").style.scrollbarWidth = "none";
}
let idleTime = 5000;
let timeoutId;

timeoutId = setTimeout(handleIdle, idleTime);

window.addEventListener('mousemove', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(handleIdle, idleTime);
});


function resetTimer(){
    clearTimeout(timeoutId);
    timeoutId = setTimeout(handleIdle, idleTime);
}

resetTimer(); 