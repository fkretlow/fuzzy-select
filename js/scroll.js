let DRAG_TARGET = null;

window.addEventListener("mouseup", () => {
    if (DRAG_TARGET !== null) {
        DRAG_TARGET.stopDrag();
        DRAG_TARGET = null;
    }
});

window.addEventListener("mousemove", () => {
    if (DRAG_TARGET) DRAG_TARGET.drag(event);
});


class ScrollBox {
    constructor(container, bar, handle, content) {
        this.container = container;
        this.bar = bar;

        this.content = content;
        this.content.addEventListener("scroll", () => { this.scroll(); });

        this.handle = handle;
        this.handle.style.height = this.handleLength() + "px";
        this.handle.addEventListener("mousedown", () => { this.startDrag(); });

        this.position = 0; // scrolling position in percentage, 1 means full

    }

    handleLength() {
        return this.container.clientHeight / this.content.scrollHeight * this.barInnerHeight();
    }

    barInnerHeight() {
        let { paddingTop, paddingBottom } = getComputedStyle(this.bar);
        return this.bar.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);
    }

    leeway() {
        return this.barInnerHeight() - this.handleLength();
    }

    overflow() {
        return this.content.scrollHeight - this.container.clientHeight;
    }

    scroll() {
        this.position = this.content.scrollTop / this.overflow();
        this.handle.style.top = this.position * this.leeway() + "px";
    }

    drag(event) {
        this.position += event.movementY / this.leeway();
        if (this.position < 0) this.position = 0;
        if (this.position > 1) this.position = 1;
        this.content.scrollTop = this.position * this.overflow();
    }

    startDrag() {
        DRAG_TARGET = this;
        this.content.classList.toggle("noselect");
        this.handle.classList.toggle("dragging");
    }

    stopDrag() {
        this.content.classList.toggle("noselect");
        this.handle.classList.toggle("dragging");
    }
}


window.addEventListener("load", () => {
    let container = document.querySelector(".scroll-box");
    let bar = document.querySelector(".scroll-bar");
    let handle = document.querySelector(".scroll-handle");
    let content = document.querySelector(".scroll-content");

    const handler = new ScrollBox(container, bar, handle, content);
});
