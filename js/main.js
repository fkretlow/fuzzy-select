const catalog = [
    "Leinenhemd", "Schreibtischlampe", "Orangensaft", "Birke", "Schnee", "Erdbeeren"
];

window.addEventListener("load", e => {
    const input = document.querySelector("#select-input");
    const output = document.querySelector("#select-output");
    const handler = new FuzzySelectHandler(input, output, catalog);
});
