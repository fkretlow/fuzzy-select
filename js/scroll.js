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


class Scrollable {
    constructor(node) {
        this.root = document.createElement("div");
        this.root.classList.add("scroll-root");
        this.bar = document.createElement("div");
        this.bar.classList.add("scroll-bar");
        this.handle = document.createElement("div");
        this.handle.classList.add("scroll-handle");
        this.container = document.createElement("div");
        this.container.classList.add("scroll-container");
        this.content = document.createElement("div");
        this.content.classList.add("scroll-content");

        this.container.appendChild(this.content);
        this.root.appendChild(this.container);
        this.bar.appendChild(this.handle);
        this.root.appendChild(this.bar);

        node.replaceWith(this.root);
        this.content.appendChild(node);

        this.content.addEventListener("scroll", () => { this.scroll(); });
        this.handle.addEventListener("mousedown", () => { this.startDrag(); });
        this.handle.addEventListener("click", (event) => { event.stopPropagation(); });
        this.bar.addEventListener("mousedown", () => {
            this.jump(event);
            this.startDrag();
        })

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

    jump(clickEvent) {
        let offset = clickEvent.offsetY;
        if (clickEvent.target === this.handle) {
            offset += this.position * this.handleLeeway;
        }
        let pos = (offset - .5 * this.handleLength) / this.handleLeeway;
        if (pos < 0) this.position = 0;
        if (pos > 1) this.position = 1;
        else         this.position = pos;
        this.content.scroll({
            left: 0,
            top: this.position * this.overflow,
            behavior: "smooth"
        });
    }

    scroll() {
        this.position = this.content.scrollTop / this.overflow;
        this.handle.style.top = `${this.position * this.handleLeeway}px`;
    }

    drag(mousemoveEvent) {
        this.position += mousemoveEvent.movementY / this.handleLeeway;
        if (this.position < 0) this.position = 0;
        if (this.position > 1) this.position = 1;
        this.content.scrollTop = this.position * this.overflow;
    }

    startDrag() {
        DRAG_TARGET = this;
        this.container.classList.add("noselect");
        this.handle.classList.toggle("dragging");
    }

    stopDrag() {
        this.container.classList.remove("noselect");
        this.handle.classList.toggle("dragging");
    }
}

let scrollBoxes = [];

window.addEventListener("load", () => {
    let scrollables = document.querySelectorAll(".scrollable");
    scrollables.forEach(node => { scrollBoxes.push(new Scrollable(node)); });
});
