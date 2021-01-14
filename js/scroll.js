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

window.addEventListener("resize", () => {
    for (let b of scrollBoxes) b.resize();
})


class ScrollBox {
    constructor(root, bar, handle, container, content) {
        this.root = root;
        this.bar = bar;
        this.handle = handle;
        this.container = container;
        this.content = content;

        this.content.addEventListener("scroll", () => { this.scroll(); });
        this.handle.addEventListener("mousedown", () => { this.startDrag(); });

        this.position = 0; // scrolling position in percentage, 1 means fully down
        this.resize();
    }

    resize() {
        let containerStyle = getComputedStyle(this.container);
        this.availableHeight = this.container.clientHeight
                - (parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom));
        this.overflow = this.content.scrollHeight - this.availableHeight;
        let barStyle = getComputedStyle(this.bar);
        this.barInnerHeight = this.bar.clientHeight
                - (parseFloat(barStyle.paddingTop) + parseFloat(barStyle.paddingBottom));
        this.handleLength = this.availableHeight / this.content.scrollHeight * this.barInnerHeight;
        this.handle.style.height = `${this.handleLength}px`;
        this.handleLeeway = this.barInnerHeight - this.handleLength;
    }

    scroll() {
        this.position = this.content.scrollTop / this.overflow;
        this.handle.style.top = `${this.position * this.handleLeeway}px`;
    }

    drag(event) {
        this.position += event.movementY / this.handleLeeway;
        if (this.position < 0) this.position = 0;
        if (this.position > 1) this.position = 1;
        this.content.scrollTop = this.position * this.overflow;
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

let scrollBoxes = [];

window.addEventListener("load", () => {
    let root = document.querySelector(".scrollable");
    let bar = document.querySelector(".scroll-bar");
    let handle = document.querySelector(".scroll-handle");
    let container = document.querySelector(".scroll-container");
    let content = document.querySelector(".scroll-content");

    scrollBoxes.push(new ScrollBox(root, bar, handle, container, content));
});
