let pageTitle = document.title;

export function setTitle(title) {
    pageTitle = title;
    document.title = title;
}

export function flashTitle(msg) {
    if (document.hasFocus()) { return; }
    let toggle = function() {
        document.title = (document.title === pageTitle) ? msg : pageTitle;
    }
    let id = window.setInterval(toggle, 1000);

    let clear = function() {
        window.removeEventListener('focus', clear);
        window.clearInterval(id);
        document.title = pageTitle;
    }
    window.addEventListener('focus', clear);
}

